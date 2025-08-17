// GraphQL AST node types for our visualization

// GraphQL AST node types for our visualization
export interface GraphQLNode {
  id: string;
  name: string;
  type: 'operation' | 'field' | 'fragment' | 'variables';
  arguments?: { [key: string]: any };
  variables?: { [key: string]: any };
  children: GraphQLNode[];
  parent?: string;
}

export interface DiagramNode extends d3.HierarchyNode<GraphQLNode> {
  x: number;
  y: number;
}

export interface ParseResult {
  nodes: GraphQLNode[];
  error?: string;
}
