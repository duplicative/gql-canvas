<template>
  <div class="flex flex-col h-full bg-gray-50 border-r border-gray-200">
    <div class="p-4 border-b border-gray-200 bg-white">
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-lg font-semibold text-gray-800">GraphQL Query</h2>
        <div class="flex items-center gap-2">
          <span :class="['text-xs px-2 py-1 rounded-full', {
            'bg-green-100 text-green-700': inputFormat === 'json',
            'bg-blue-100 text-blue-700': inputFormat === 'graphql'
          }]">
            {{ inputFormat === 'json' ? 'JSON Format' : 'GraphQL Format' }}
          </span>
        </div>
      </div>

      <div v-if="parsedJson" class="mb-3 p-2 bg-gray-50 rounded-md">
        <div class="text-xs text-gray-600 space-y-1">
          <div v-if="parsedJson.operationName"><span class="font-medium">Operation:</span> {{ parsedJson.operationName }}</div>
          <div v-if="parsedJson.variables && Object.keys(parsedJson.variables).length > 0"><span class="font-medium">Variables:</span> {{ Object.keys(parsedJson.variables).join(', ') }}</div>
        </div>
      </div>

      <button
        @click="$emit('visualize')"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
      >
        Visualize
      </button>
    </div>

    <div class="flex-1 p-4">
      <textarea
        :value="localQuery"
        @input="handleInputChange(($event.target as HTMLTextAreaElement).value)"
        placeholder="Paste your GraphQL query here, or JSON format with query field..."
        class="w-full h-full resize-none border border-gray-300 rounded-md p-3 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />

      <div v-if="error" class="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
        <p class="text-red-600 text-sm">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { isJsonFormat, extractQueryFromJson } from '@/vue-app/utils/json-parser';

interface ParsedJsonQuery {
  query: string;
  operationName?: string;
  variables?: any;
}

const props = defineProps<{
  query: string;
  error?: string;
}>();

const emit = defineEmits(['update:query', 'visualize']);

const localQuery = ref(props.query);
const inputFormat = ref<'graphql' | 'json'>('graphql');
const parsedJson = ref<ParsedJsonQuery | null>(null);
let debounceTimer: number | undefined;

watch(() => props.query, (newQuery) => {
  localQuery.value = newQuery;
});

const handleInputChange = (value: string) => {
  localQuery.value = value;

  const isJson = isJsonFormat(value.trim());
  inputFormat.value = isJson ? 'json' : 'graphql';

  let queryToVisualize = value;
  let jsonData: ParsedJsonQuery | null = null;

  if (isJson) {
    const result = extractQueryFromJson(value);
    if (result.success && result.data) {
      queryToVisualize = result.data.query;
      jsonData = result.data;
    }
  }

  parsedJson.value = jsonData;

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    emit('update:query', queryToVisualize);
  }, 500);
};
</script>
