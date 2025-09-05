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

export function isJsonFormat(input: string): boolean {
  if (!input.trim()) return false;
  
  const trimmed = input.trim();
  return (trimmed.startsWith('{') && trimmed.endsWith('}')) || 
         (trimmed.startsWith('[') && trimmed.endsWith(']'));
}

export function extractQueryFromJson(input: string): ParseResult {
  try {
    const parsed = JSON.parse(input);
    
    // Check if it has a query field
    if (typeof parsed === 'object' && parsed !== null && typeof parsed.query === 'string') {
      // Clean up escaped newlines in the query
      const cleanQuery = parsed.query.replace(/\\n/g, '\n').replace(/\\"/g, '"');
      
      return {
        success: true,
        data: {
          query: cleanQuery,
          operationName: parsed.operationName,
          variables: parsed.variables
        }
      };
    }
    
    // If it's a JSON array or object without query field, treat as invalid for our use case
    return {
      success: false,
      error: 'JSON must contain a "query" field'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid JSON format'
    };
  }
}

export function formatAsJson(query: string, operationName?: string, variables?: any): string {
  const jsonObj: any = {
    query: query.replace(/\n/g, '\\n').replace(/"/g, '\\"')
  };
  
  if (operationName) {
    jsonObj.operationName = operationName;
  }
  
  if (variables && Object.keys(variables).length > 0) {
    jsonObj.variables = variables;
  }
  
  return JSON.stringify(jsonObj, null, 2);
}
