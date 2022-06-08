import {
  DocumentNode,
  FieldNode,
  getNamedType, GraphQLEnumValue,
  GraphQLError,
  GraphQLField, GraphQLSchema, TypeInfo,
  visit,
  visitWithTypeInfo
} from 'graphql';

export function isDeprecated(fieldOrEnumValue: GraphQLField<any, any> | GraphQLEnumValue) {
  if ('isDeprecated' in fieldOrEnumValue) {
    return (fieldOrEnumValue as any).isDeprecated;
  }

  if (fieldOrEnumValue.deprecationReason !== null && fieldOrEnumValue.deprecationReason !== undefined) {
    return true;
  }

  if (fieldOrEnumValue.astNode?.directives?.some(directive => directive.name.value === 'deprecated')) {
    return true;
  }

  return false;
}

export function findDeprecatedUsages(schema: GraphQLSchema, ast: DocumentNode): GraphQLError[] {
  const errors: GraphQLError[] = [];
  const typeInfo = new TypeInfo(schema);

  visit(
    ast,
    visitWithTypeInfo(typeInfo, {
      Argument(node) {
        const argument = typeInfo.getArgument();
        if (argument) {
          const reason = argument.deprecationReason;
          if (reason) {
            const fieldDef = typeInfo.getFieldDef();
            if (fieldDef) {
              errors.push(
                new GraphQLError(`The argument '${argument?.name}' of '${fieldDef.name}' is deprecated. ${reason}`, {
                  nodes: [
                    node,
                  ]}),
              );
            }
          }
        }
      },
      Field(node) {
        const fieldDef = typeInfo.getFieldDef();
        if (fieldDef && isDeprecated(fieldDef)) {
          const parentType = typeInfo.getParentType();
          if (parentType) {
            const reason = fieldDef.deprecationReason;
            errors.push(
              new GraphQLError(
                `The field '${parentType.name}.${fieldDef.name}' is deprecated.${reason ? ' ' + reason : ''}`, {
                  nodes: [node]
                }
              ),
            );
          }
        }
      },
      EnumValue(node) {
        const enumVal = typeInfo.getEnumValue();
        if (enumVal && isDeprecated(enumVal)) {
          const type = getNamedType(typeInfo.getInputType()!);
          if (type) {
            const reason = enumVal.deprecationReason;
            errors.push(
              new GraphQLError(
                `The enum value '${type.name}.${enumVal.name}' is deprecated.${reason ? ' ' + reason : ''}`, {
                  nodes: [node]
                }
              ),
            );
          }
        }
      },
    }),
  );

  return errors;
}

export function removeFieldIfDirectives(node: FieldNode, directiveNames: string[]): FieldNode | undefined {
  if (node.directives) {
    if (node.directives.some(d => directiveNames.includes(d.name.value))) {
      return null;
    }
  }

  return node;
}

export function removeDirectives(node: FieldNode, directiveNames: string[]): FieldNode {
  if (node.directives) {
    return {
      ...node,
      directives: node.directives.filter(d => !directiveNames.includes(d.name.value)),
    };
  }

  return node;
}
