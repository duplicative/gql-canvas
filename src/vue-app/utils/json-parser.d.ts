interface JsonQueryData {
    query: string;
    operationName?: string;
    variables?: any;
}
interface ParseResult {
    success: boolean;
    data?: JsonQueryData;
    error?: string;
}
export declare function isJsonFormat(input: string): boolean;
export declare function extractQueryFromJson(input: string): ParseResult;
export declare function formatAsJson(query: string, operationName?: string, variables?: any): string;
export {};
