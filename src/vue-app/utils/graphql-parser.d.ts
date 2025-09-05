import type { GraphQLNode } from '@/shared/types';
export declare function parseGraphQLQuery(queryString: string, variables?: {
    [key: string]: any;
}): {
    node: GraphQLNode | null;
    error?: string;
};
export declare function graphQLNodeToQuery(node: GraphQLNode, depth?: number): string;
