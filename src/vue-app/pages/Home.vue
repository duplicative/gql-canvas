<template>
  <div class="h-screen bg-gray-100">
    <header class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">GraphQL Query Visualizer</h1>
          <p class="text-gray-600 text-sm mt-1">
            Interactive tool for visualizing and editing GraphQL query structure
          </p>
        </div>
      </div>
    </header>

    <div class="h-[calc(100vh-73px)]">
      <ResizableLayout :initial-split="40">
        <template #left>
          <QueryInput
            :query="query"
            @update:query="handleQueryChange"
            :error="parseError"
            @visualize="handleVisualize"
          />
        </template>
        <template #right>
          <GraphVisualization
            :root-node="rootNode"
            @update:node="handleNodeUpdate"
            @update:query="handleQueryFromVisualization"
          />
        </template>
      </ResizableLayout>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { parseGraphQLQuery } from '@/vue-app/utils/graphql-parser';
import type { GraphQLNode } from '@/shared/types';
import { isJsonFormat, extractQueryFromJson } from '@/vue-app/utils/json-parser';
import QueryInput from '@/vue-app/components/QueryInput.vue';
import GraphVisualization from '@/vue-app/components/GraphVisualization.vue';
import ResizableLayout from '@/vue-app/components/ResizableLayout.vue';

const defaultQuery = `{"operationName":"getUsers","variables":{"orgId":"812ddf56-2fbc-4996-9279-3b12421026f9"},"query":"query getUsers($orgId: ID!) {\\n  organization(orgId: $orgId) {\\n    name\\n    description\\n    id\\n    ...fieldsOnOrganizationWithUsers\\n    __typename\\n  }\\n}\\n\\nfragment fieldsOnOrganizationWithUsers on Organization {\\n  users {\\n    orgId\\n    orgName\\n    usersList {\\n      email\\n      userId\\n      status\\n      roles {\\n        id\\n        name\\n        __typename\\n      }\\n      __typename\\n    }\\n    __typename\\n  }\\n  __typename\\n}"}`;

const query = ref(defaultQuery);
const rootNode = ref<GraphQLNode | null>(null);
const parseError = ref<string>();

const parseQuery = (queryString: string) => {
  let actualQuery = queryString;
  let variables: { [key: string]: any } | undefined;

  // Check if it's JSON format and extract the query
  if (isJsonFormat(queryString.trim())) {
    const jsonResult = extractQueryFromJson(queryString);
    if (jsonResult.success && jsonResult.data) {
      actualQuery = jsonResult.data.query;
      variables = jsonResult.data.variables;
    } else {
      parseError.value = jsonResult.error || 'Failed to parse JSON';
      rootNode.value = null;
      return;
    }
  }

  const result = parseGraphQLQuery(actualQuery, variables);
  if (result.error) {
    parseError.value = result.error;
    rootNode.value = null;
  } else {
    parseError.value = undefined;
    rootNode.value = result.node;
  }
};

const handleQueryChange = (newQuery: string) => {
  query.value = newQuery;
  parseQuery(newQuery);
};

const handleVisualize = () => {
  parseQuery(query.value);
};

const handleNodeUpdate = (updatedNode: GraphQLNode) => {
  rootNode.value = updatedNode;
};

const handleQueryFromVisualization = (newQuery: string) => {
  query.value = newQuery;
};

// Parse initial query on mount
onMounted(() => {
  parseQuery(defaultQuery);
});
</script>
