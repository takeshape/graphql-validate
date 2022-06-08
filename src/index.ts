import {Source as DocumentSource} from '@graphql-tools/utils';
import {writeFileSync} from 'fs';
import {GraphQLError, GraphQLSchema, print, Source} from 'graphql';
import {loadConfig} from 'graphql-config';
import {relative} from 'path';
import {GlobalArgs, parseGlobalArgs} from './commands.js';
import {InvalidDocument, validate as validateDocuments} from './core.js';
import createLoader from './loaders.js';
import {bolderize, chalk, logger} from './logger.js';

export function handler({
  schema,
  documents,
  strictFragments,
  maxDepth,
  apollo,
  keepClientFields,
  failOnDeprecated,
  filter,
  onlyErrors,
  relativePaths,
  output,
  silent,
}: {
  schema: GraphQLSchema;
  documents: DocumentSource[];
  failOnDeprecated: boolean;
  strictFragments: boolean;
  apollo: boolean;
  keepClientFields: boolean;
  maxDepth?: number;
  filter?: string[];
  onlyErrors?: boolean;
  relativePaths?: boolean;
  output?: string;
  silent?: boolean;
}) {
  let invalidDocuments = validateDocuments(
    schema,
    documents.map(doc => new Source(print(doc.document), doc.location)),
    {
      strictFragments,
      maxDepth,
      apollo,
      keepClientFields,
    },
  );

  if (invalidDocuments.length) {
    if (failOnDeprecated) {
      invalidDocuments = moveDeprecatedToErrors(invalidDocuments);
    }

    if (relativePaths) {
      invalidDocuments = useRelativePaths(invalidDocuments);
    }

    const errorsCount = countErrors(invalidDocuments);
    const deprecated = countDeprecated(invalidDocuments);
    const shouldFailProcess = errorsCount > 0;

    if (errorsCount) {
      if (!silent) {
        logger.log(`\nDetected ${errorsCount} invalid document${errorsCount > 1 ? 's' : ''}:\n`);
      }

      printInvalidDocuments(useFilter(invalidDocuments, filter), 'errors', true, silent);
    } else {
      logger.success('All documents are valid');
    }

    if (deprecated && !onlyErrors) {
      if (!silent) {
        logger.info(`\nDetected ${deprecated} document${deprecated > 1 ? 's' : ''} with deprecated fields:\n`);
      }

      printInvalidDocuments(useFilter(invalidDocuments, filter), 'deprecated', false, silent);
    }

    if (output) {
      writeFileSync(
        output,
        JSON.stringify(
          {
            status: !shouldFailProcess,
            documents: useFilter(invalidDocuments, filter),
          },
          null,
          2,
        ),
        {
          encoding: 'utf-8',
        },
      );
    }

    if (shouldFailProcess) {
      process.exit(1);
    }
  } else {
    logger.success('All documents are valid');
  }
}

function moveDeprecatedToErrors(docs: InvalidDocument[]) {
  return docs.map(doc => ({
    source: doc.source,
    errors: [...(doc.errors ?? []), ...(doc.deprecated ?? [])],
    deprecated: [],
  }));
}

function useRelativePaths(docs: InvalidDocument[]) {
  return docs.map(doc => {
    doc.source.name = relative(process.cwd(), doc.source.name);
    return doc;
  });
}

function useFilter(docs: InvalidDocument[], patterns?: string[]) {
  if (!patterns || !patterns.length) {
    return docs;
  }

  return docs.filter(doc => patterns.some(filepath => doc.source.name.includes(filepath)));
}

type Args = {
  schema: string;
  documents: string;
  deprecated: boolean;
  noStrictFragments: boolean;
  apollo: boolean;
  keepClientFields: boolean;
  maxDepth?: number;
  filter?: string[];
  onlyErrors?: boolean;
  relativePaths?: boolean;
  output?: string;
  silent?: boolean;
  ignore?: string[];
} & GlobalArgs;

export default async function validate(args: Args) {
  const config = await loadConfig({
    rootDir: process.cwd(),
    throwOnEmpty: true,
    throwOnMissing: true,
  });
  const project = config.getProject();

  const {headers, token} = parseGlobalArgs(args);
  const apollo = args.apollo || false;
  const aws = args.aws ?? false;
  const apolloFederation = args.federation ?? false;
  const method = args.method?.toUpperCase() ?? 'POST';
  const maxDepth = args.maxDepth ?? undefined;
  const strictFragments = !args.noStrictFragments;
  const keepClientFields = args.keepClientFields ?? false;
  const failOnDeprecated = args.deprecated;
  const {output} = args;
  const silent = args.silent ?? false;
  const relativePaths = args.relativePaths ?? false;
  const onlyErrors = args.onlyErrors ?? false;
  const ignore = args.ignore ?? [];

  const loader = createLoader();

  const schema = await loader.loadSchema(
    project.schema ?? args.schema,
    {
      headers,
      token,
      method,
      apolloFederation,
      aws
    },
  );

  const documents = await loader.loadDocuments(project.documents ?? args.documents, {
    ignore,
  });

  handler({
    schema,
    documents,
    apollo,
    maxDepth,
    strictFragments,
    keepClientFields,
    failOnDeprecated,
    filter: args.filter,
    silent,
    output,
    relativePaths,
    onlyErrors,
  });
}

function countErrors(invalidDocuments: InvalidDocument[]): number {
  if (invalidDocuments.length) {
    return invalidDocuments.filter(doc => doc.errors?.length).length;
  }

  return 0;
}

function countDeprecated(invalidDocuments: InvalidDocument[]): number {
  if (invalidDocuments.length) {
    return invalidDocuments.filter(doc => doc.deprecated?.length).length;
  }

  return 0;
}

function printInvalidDocuments(
  invalidDocuments: InvalidDocument[],
  listKey: 'errors' | 'deprecated',
  isError = false,
  silent = false,
): void {
  if (silent) {
    return;
  }

  invalidDocuments.forEach(doc => {
    if (doc.errors.length) {
      renderErrors(doc.source.name, doc[listKey], isError).forEach(line => {
        logger.log(line);
      });
    }
  });
}

function renderErrors(sourceName: string, errors: GraphQLError[], isError = false): string[] {
  const errorsAsString = errors.map(e => ` - ${bolderize(e.message)}`).join('\n');

  return [
    isError ? chalk.redBright('error') : chalk.yellowBright('warn'),
    `in ${sourceName}:\n\n`,
    errorsAsString,
    '\n\n',
  ];
}
