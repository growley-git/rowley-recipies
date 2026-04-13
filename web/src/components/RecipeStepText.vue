<script setup lang="ts">
import { computed } from "vue";
import { highlightIngredientsInText } from "../utils/highlightIngredients";

const props = defineProps<{
  text: string;
  foodNames: string[];
}>();

const html = computed(() =>
  highlightIngredientsInText(props.text, props.foodNames)
);
</script>

<template>
  <span class="step-text" v-html="html" />
</template>

<style lang="scss" scoped>
.step-text :deep(.ingredient-hit) {
  font-weight: 700;
  color: var(--accent, #b45309);
}
</style>
