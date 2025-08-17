import { useEffect, useState, useRef } from 'react';
import { isJsonFormat, extractQueryFromJson } from '@/react-app/utils/json-parser';

interface QueryInputProps {
  query: string;
  onQueryChange: (query: string) => void;
  error?: string;
  onVisualize: () => void;
}

interface ParsedJsonQuery {
  query: string;
  operationName?: string;
  variables?: any;
}

export default function QueryInput({ query, onQueryChange, error, onVisualize }: QueryInputProps) {
  const [localQuery, setLocalQuery] = useState(query);
  const [inputFormat, setInputFormat] = useState<'graphql' | 'json'>('graphql');
  const [parsedJson, setParsedJson] = useState<ParsedJsonQuery | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  const handleInputChange = (value: string) => {
    setLocalQuery(value);
    
    // Detect format and extract query
    const isJson = isJsonFormat(value.trim());
    setInputFormat(isJson ? 'json' : 'graphql');
    
    let queryToVisualize = value;
    let jsonData: ParsedJsonQuery | null = null;
    
    if (isJson) {
      const result = extractQueryFromJson(value);
      if (result.success && result.data) {
        queryToVisualize = result.data.query;
        jsonData = result.data;
      }
    }
    
    setParsedJson(jsonData);
    
    // Debounce the query change
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      onQueryChange(queryToVisualize);
    }, 500);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 border-r border-gray-200">
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-800">GraphQL Query</h2>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full ${
              inputFormat === 'json' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-blue-100 text-blue-700'
            }`}>
              {inputFormat === 'json' ? 'JSON Format' : 'GraphQL Format'}
            </span>
          </div>
        </div>
        
        {parsedJson && (
          <div className="mb-3 p-2 bg-gray-50 rounded-md">
            <div className="text-xs text-gray-600 space-y-1">
              {parsedJson.operationName && (
                <div><span className="font-medium">Operation:</span> {parsedJson.operationName}</div>
              )}
              {parsedJson.variables && Object.keys(parsedJson.variables).length > 0 && (
                <div><span className="font-medium">Variables:</span> {Object.keys(parsedJson.variables).join(', ')}</div>
              )}
            </div>
          </div>
        )}
        
        <button
          onClick={onVisualize}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Visualize
        </button>
      </div>
      
      <div className="flex-1 p-4">
        <textarea
          value={localQuery}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Paste your GraphQL query here, or JSON format with query field..."
          className="w-full h-full resize-none border border-gray-300 rounded-md p-3 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        
        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
