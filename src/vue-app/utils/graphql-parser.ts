import { parse } from 'graphql';
import type { DocumentNode, OperationDefinitionNode, SelectionNode, FieldNode, InlineFragmentNode, FragmentSpreadNode, FragmentDefinitionNode } from 'graphql';
import type { GraphQLNode } from '@/shared/types';

let nodeIdCounter = 0;
let fragmentDefinitions: { [key: string]: FragmentDefinitionNode } = {};

function generateId(): string {
  return `node_${nodeIdCounter++}`;
}

function parseArguments(args: readonly any[]): { [key: string]: any } {
  const result: { [key: string]: any } = {};
  args.forEach(arg => {
    if (arg.name && arg.value) {
      // Simplified argument parsing - just get the basic structure
      result[arg.name.value] = arg.value.kind === 'StringValue' 
        ? arg.value.value 
        : arg.value.kind === 'Variable'
        ? `$${arg.value.name.value}`
        : arg.value.value || arg.value.kind;
    }
  });
  return result;
}

function formatArguments(args: { [key: string]: any }): string {
  if (!args || Object.keys(args).length === 0) return '';
  
  const formattedArgs = Object.entries(args).map(([key, value]) => {
    if (typeof value === 'string' && value.startsWith('$')) {
      return `${key}: ${value}`;
    }
    return `${key}: ${JSON.stringify(value)}`;
  }).join(', ');
  
  return `(${formattedArgs})`;
}

function formatVariableDefinitions(variableDefinitions: readonly any[]): string {
  if (!variableDefinitions || variableDefinitions.length === 0) return '';
  
  const formattedVars = variableDefinitions.map(varDef => {
    const name = varDef.variable.name.value;
    const type = formatType(varDef.type);
    return `$${name}: ${type}`;
  }).join(', ');
  
  return `(${formattedVars})`;
}

function formatType(type: any): string {
  if (type.kind === 'NonNullType') {
    return formatType(type.type) + '!';
  } else if (type.kind === 'ListType') {
    return `[${formatType(type.type)}]`;
  } else if (type.kind === 'NamedType') {
    return type.name.value;
  }
  return type.toString();
}

function parseSelectionSet(selectionSet: any, parentId?: string): GraphQLNode[] {
  if (!selectionSet || !selectionSet.selections) return [];

  const nodes: GraphQLNode[] = [];

  selectionSet.selections.forEach((selection: SelectionNode) => {
    if (selection.kind === 'Field') {
      const fieldNode = selection as FieldNode;
      const fieldArgs = fieldNode.arguments ? parseArguments(fieldNode.arguments) : undefined;
      const argumentsString = fieldArgs ? formatArguments(fieldArgs) : '';
      
      const node: GraphQLNode = {
        id: generateId(),
        name: fieldNode.name.value + argumentsString,
        type: 'field',
        arguments: fieldArgs,
        children: [],
        parent: parentId
      };

      if (fieldNode.selectionSet) {
        node.children = parseSelectionSet(fieldNode.selectionSet, node.id);
      }

      nodes.push(node);
    } else if (selection.kind === 'InlineFragment') {
      const inlineFragment = selection as InlineFragmentNode;
      if (inlineFragment.selectionSet) {
        nodes.push(...parseSelectionSet(inlineFragment.selectionSet, parentId));
      }
    } else if (selection.kind === 'FragmentSpread') {
      const fragmentSpread = selection as FragmentSpreadNode;
      const fragmentName = fragmentSpread.name.value;
      const node: GraphQLNode = {
        id: generateId(),
        name: `...${fragmentName}`,
        type: 'fragment',
        children: [],
        parent: parentId
      };

      // Look up the fragment definition and parse its selection set
      const fragmentDef = fragmentDefinitions[fragmentName];
      if (fragmentDef && fragmentDef.selectionSet) {
        node.children = parseSelectionSet(fragmentDef.selectionSet, node.id);
      }

      nodes.push(node);
    }
  });

  return nodes;
}

export function parseGraphQLQuery(queryString: string, variables?: { [key: string]: any }): { node: GraphQLNode | null; error?: string } {
  try {
    nodeIdCounter = 0; // Reset counter for each parse
    fragmentDefinitions = {}; // Reset fragment definitions for each parse
    
    const document: DocumentNode = parse(queryString);
    
    if (!document.definitions || document.definitions.length === 0) {
      return { node: null, error: 'No query definitions found' };
    }

    // First pass: collect all fragment definitions
    document.definitions.forEach(definition => {
      if (definition.kind === 'FragmentDefinition') {
        const fragmentDef = definition as FragmentDefinitionNode;
        fragmentDefinitions[fragmentDef.name.value] = fragmentDef;
      }
    });

    // Find the operation definition
    const operationDefinition = document.definitions.find(def => def.kind === 'OperationDefinition');
    
    if (!operationDefinition) {
      return { node: null, error: 'No operation definition found' };
    }

    const operation = operationDefinition as OperationDefinitionNode;
    const baseName = operation.name?.value || operation.operation;
    const variableDefsString = operation.variableDefinitions ? formatVariableDefinitions(operation.variableDefinitions) : '';
    const operationName = baseName + variableDefsString;

    const children = parseSelectionSet(operation.selectionSet);
    
    // Add variables node if variables exist
    if (variables && Object.keys(variables).length > 0) {
      const variablesNode: GraphQLNode = {
        id: generateId(),
        name: 'Variables',
        type: 'variables',
        variables: variables,
        children: [],
      };
      children.unshift(variablesNode); // Add at the beginning
    }

    const rootNode: GraphQLNode = {
      id: generateId(),
      name: operationName,
      type: 'operation',
      children: children,
    };

    return { node: rootNode };
  } catch (error) {
    return { 
      node: null, 
      error: error instanceof Error ? error.message : 'Failed to parse GraphQL query' 
    };
  }
}

export function graphQLNodeToQuery(node: GraphQLNode, depth = 0): string {
  const indent = '  '.repeat(depth);
  
  if (node.type === 'operation') {
    const children = node.children.map(child => graphQLNodeToQuery(child, depth + 1)).join('\n');
    return `${node.name} {\n${children}\n}`;
  }
  
  if (node.type === 'fragment') {
    return `${indent}${node.name}`;
  }
  
  if (node.type === 'variables') {
    // Variables don't appear in the generated query
    return '';
  }
  
  const args = node.arguments && Object.keys(node.arguments).length > 0
    ? `(${Object.entries(node.arguments).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join(', ')})`
    : '';
    
  if (node.children.length === 0) {
    return `${indent}${node.name}${args}`;
  }
  
  const children = node.children.map(child => graphQLNodeToQuery(child, depth + 1)).join('\n');
  return `${indent}${node.name}${args} {\n${children}\n${indent}}`;
}
