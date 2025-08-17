import React, { useState, useCallback } from 'react';
import { parseGraphQLQuery } from '@/react-app/utils/graphql-parser';
import { GraphQLNode } from '@/shared/types';
import { isJsonFormat, extractQueryFromJson } from '@/react-app/utils/json-parser';
import QueryInput from '@/react-app/components/QueryInput';
import GraphVisualization from '@/react-app/components/GraphVisualization';
import ResizableLayout from '@/react-app/components/ResizableLayout';

const defaultQuery = `{"operationName":"getUsers","variables":{"orgId":"812ddf56-2fbc-4996-9279-3b12421026f9"},"query":"query getUsers($orgId: ID!) {\\n  organization(orgId: $orgId) {\\n    name\\n    description\\n    id\\n    ...fieldsOnOrganizationWithUsers\\n    __typename\\n  }\\n}\\n\\nfragment fieldsOnOrganizationWithUsers on Organization {\\n  users {\\n    orgId\\n    orgName\\n    usersList {\\n      email\\n      userId\\n      status\\n      roles {\\n        id\\n        name\\n        __typename\\n      }\\n      __typename\\n    }\\n    __typename\\n  }\\n  __typename\\n}"}`;

export default function Home() {
  const [query, setQuery] = useState(defaultQuery);
  const [rootNode, setRootNode] = useState<GraphQLNode | null>(null);
  const [parseError, setParseError] = useState<string>();

  const parseQuery = useCallback((queryString: string) => {
    let actualQuery = queryString;
    let variables: { [key: string]: any } | undefined;
    
    // Check if it's JSON format and extract the query
    if (isJsonFormat(queryString.trim())) {
      const jsonResult = extractQueryFromJson(queryString);
      if (jsonResult.success && jsonResult.data) {
        actualQuery = jsonResult.data.query;
        variables = jsonResult.data.variables;
      } else {
        setParseError(jsonResult.error || 'Failed to parse JSON');
        setRootNode(null);
        return;
      }
    }
    
    const result = parseGraphQLQuery(actualQuery, variables);
    if (result.error) {
      setParseError(result.error);
      setRootNode(null);
    } else {
      setParseError(undefined);
      setRootNode(result.node);
    }
  }, []);

  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
    parseQuery(newQuery);
  }, [parseQuery]);

  const handleVisualize = useCallback(() => {
    parseQuery(query);
  }, [query, parseQuery]);

  const handleNodeUpdate = useCallback((updatedNode: GraphQLNode) => {
    setRootNode(updatedNode);
  }, []);

  const handleQueryFromVisualization = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  // Parse initial query on mount
  React.useEffect(() => {
    parseQuery(defaultQuery);
  }, [parseQuery]);

  return (
    <div className="h-screen bg-gray-100">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">GraphQL Query Visualizer</h1>
            <p className="text-gray-600 text-sm mt-1">
              Interactive tool for visualizing and editing GraphQL query structure
            </p>
          </div>
        </div>
      </header>

      <div className="h-[calc(100vh-73px)]">
        <ResizableLayout
          left={
            <QueryInput
              query={query}
              onQueryChange={handleQueryChange}
              error={parseError}
              onVisualize={handleVisualize}
            />
          }
          right={
            <GraphVisualization
              rootNode={rootNode}
              onNodeUpdate={handleNodeUpdate}
              onQueryChange={handleQueryFromVisualization}
            />
          }
          initialSplit={40}
        />
      </div>
    </div>
  );
}
