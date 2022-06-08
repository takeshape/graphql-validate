import {DepGraph} from 'dependency-graph';
import {
  DocumentNode,
  FragmentDefinitionNode,
  GraphQLError,
  GraphQLSchema,
  Kind,
  print,
  Source,
  validate as validateDocument
} from 'graphql';
import {transformDocumentWithApollo, transformSchemaWithApollo} from './utils/apollo.js';
import {readDocument} from './utils/ast.js';
import {findDeprecatedUsages} from './utils/graphql.js';
import {validateQueryDepth} from './utils/query-depth.js';

export interface InvalidDocument {
  source: Source;
  errors: GraphQLError[];
  deprecated: GraphQLError[];
}

export interface ValidateOptions {
  /**
   * Fails on duplicated fragment names
   * @default true
   */
  strictFragments?: boolean;
  /**
   * Fails on deprecated usage
   * @default true
   */
  strictDeprecated?: boolean;
  /**
   * Works only with combination of `apollo`
   * @default false
   */
  keepClientFields?: boolean;
  /**
   * Supports Apollo directives (`@client` and `@connection`)
   * @default false
   */
  apollo?: boolean;
  /**
   * Fails when operation depth exceeds maximum depth
   * @default false
   */
  maxDepth?: number;
}

export function validate(schema: GraphQLSchema, sources: Source[], options?: ValidateOptions): InvalidDocument[] {
  const config: ValidateOptions = {
    strictDeprecated: true,
    strictFragments: true,
    keepClientFields: false,
    apollo: false,
    ...options,
  };
  const invalidDocuments: InvalidDocument[] = [];
  // Read documents
  const documents = sources.map(readDocument);
  // Keep all named fragments
  const fragments: Array<{node: FragmentDefinitionNode; source: string}> = [];
  const fragmentNames: string[] = [];
  const graph = new DepGraph<FragmentDefinitionNode>({circular: true});

  documents.forEach(doc => {
    doc.fragments.forEach(fragment => {
      fragmentNames.push(fragment.node.name.value);
      fragments.push(fragment);
      graph.addNode(fragment.node.name.value, fragment.node);
    });
  });

  fragments.forEach(fragment => {
    const depends = extractFragments(print(fragment.node));

    if (depends) {
      depends.forEach(name => {
        graph.addDependency(fragment.node.name.value, name);
      });
    }
  });

  documents
    // Since we include fragments, validate only operations
    .filter(doc => doc.hasOperations)
    .forEach(doc => {
      const docWithOperations: DocumentNode = {
        kind: Kind.DOCUMENT,
        definitions: doc.operations.map(d => d.node),
      };
      const extractedFragments = (extractFragments(print(docWithOperations)) ?? [])
        // Resolve all nested fragments
        .map(fragmentName => resolveFragment(graph.getNodeData(fragmentName), graph))
        // Flatten arrays
        .reduce((list, current) => list.concat(current), [])
        // Remove duplicates
        .filter((def, i, all) => all.findIndex(item => item.name.value === def.name.value) === i);
      const merged: DocumentNode = {
        kind: Kind.DOCUMENT,
        definitions: [...docWithOperations.definitions, ...extractedFragments],
      };

      const transformedSchema = config.apollo ? transformSchemaWithApollo(schema) : schema;

      const transformedDoc = config.apollo
        ? transformDocumentWithApollo(merged, {
          keepClientFields: config.keepClientFields!,
        })
        : merged;

      const errors = (validateDocument(transformedSchema, transformedDoc) as GraphQLError[]) || [];

      if (config.maxDepth) {
        const depthError = validateQueryDepth({
          source: doc.source,
          doc: transformedDoc,
          maxDepth: config.maxDepth,
          fragmentGraph: graph,
        });

        if (depthError) {
          errors.push(depthError);
        }
      }

      const deprecated = config.strictDeprecated ? findDeprecatedUsages(transformedSchema, transformedDoc) : [];
      const duplicatedFragments = config.strictFragments ? findDuplicatedFragments(fragmentNames) : [];

      if (sumLengths(errors, duplicatedFragments, deprecated) > 0) {
        invalidDocuments.push({
          source: doc.source,
          errors: [...errors, ...duplicatedFragments],
          deprecated,
        });
      }
    });

  return invalidDocuments;
}

function findDuplicatedFragments(fragmentNames: string[]) {
  return fragmentNames
    .filter((name, i, all) => all.indexOf(name) !== i)
    .map(name => new GraphQLError(`Name of '${name}' fragment is not unique`));
}

//
// PostInfo -> AuthorInfo
// AuthorInfo -> None
//
function resolveFragment(
  fragment: FragmentDefinitionNode,
  graph: DepGraph<FragmentDefinitionNode>,
): FragmentDefinitionNode[] {
  return graph
    .dependenciesOf(fragment.name.value)
    .reduce((list, current) => [...list, ...resolveFragment(graph.getNodeData(current), graph)], [fragment]);
}

function extractFragments(document: string): string[] | undefined {
  return (document.match(/[.]{3}[a-z0-9_]+\b/gi) ?? []).map(name => name.replace('...', ''));
}

function sumLengths(...arrays: any[][]): number {
  return arrays.reduce((sum, {length}) => sum + length, 0);
}
