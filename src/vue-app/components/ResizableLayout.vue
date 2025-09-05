<template>
  <div ref="containerRef" class="flex h-full w-full">
    <div :style="{ width: `${leftWidth}%` }" class="flex-shrink-0 overflow-auto">
      <slot name="left"></slot>
    </div>

    <div
      class="w-1 bg-gray-300 cursor-col-resize hover:bg-blue-500 transition-colors flex-shrink-0 relative"
      @mousedown="handleMouseDown"
    >
      <div class="absolute inset-y-0 -left-1 -right-1" />
    </div>

    <div :style="{ width: `${100 - leftWidth}%` }" class="flex-shrink-0 overflow-auto">
      <slot name="right"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  initialSplit: {
    type: Number,
    default: 50,
  },
});

const leftWidth = ref(props.initialSplit);
const isDragging = ref(false);
const containerRef = ref<HTMLDivElement | null>(null);

const handleMouseDown = () => {
  isDragging.value = true;
};

const handleMouseUp = () => {
  isDragging.value = false;
};

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value || !containerRef.value) return;

  const rect = containerRef.value.getBoundingClientRect();
  const newLeftWidth = ((e.clientX - rect.left) / rect.width) * 100;

  // Constrain between 20% and 80%
  const constrainedWidth = Math.max(20, Math.min(80, newLeftWidth));
  leftWidth.value = constrainedWidth;
};

onMounted(() => {
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
});

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
});
</script>
