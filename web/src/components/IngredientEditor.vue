<script setup lang="ts">
import { FRACTION_DELTAS, wholeAndFractionToDecimal } from "@rowley/domain";
import { computed, ref, watch } from "vue";

export interface IngredientForm {
  id?: string;
  section: string;
  foodName: string;
  unit: string;
  whole: number;
  fractionKey: keyof typeof FRACTION_DELTAS;
  note: string;
  decimalPreview: string;
}

const props = defineProps<{
  modelValue: IngredientForm;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: IngredientForm];
}>();

const local = ref({ ...props.modelValue });

watch(
  () => props.modelValue,
  (v) => {
    local.value = { ...v };
  },
  { deep: true }
);

const amount = computed(() =>
  wholeAndFractionToDecimal(local.value.whole, local.value.fractionKey)
);

const preview = computed(() => {
  const v = amount.value;
  return Number.isFinite(v) ? v.toFixed(3).replace(/\.?0+$/, "") : "";
});

function sync() {
  emit("update:modelValue", {
    ...local.value,
    decimalPreview: preview.value,
  });
}

function updateField<K extends keyof IngredientForm>(key: K, val: IngredientForm[K]) {
  (local.value as IngredientForm)[key] = val;
  sync();
}

const fractionOptions = Object.keys(FRACTION_DELTAS) as Array<
  keyof typeof FRACTION_DELTAS
>;

const units = [
  "cup",
  "tbsp",
  "tsp",
  "oz",
  "lb",
  "g",
  "ml",
  "whole",
  "pinch",
  "clove",
  "can",
  "each",
];
</script>

<template>
  <div class="ingredient card">
    <div class="row">
      <label>
        Section
        <input
          :value="local.section"
          class="input"
          placeholder="Optional (e.g. Sauce)"
          @input="updateField('section', ($event.target as HTMLInputElement).value)"
        />
      </label>
    </div>
    <div class="row grid">
      <label>
        Whole
        <input
          type="number"
          class="input"
          :value="local.whole"
          step="1"
          @input="
            updateField('whole', Number(($event.target as HTMLInputElement).value) || 0)
          "
        />
      </label>
      <label>
        Fraction
        <select
          class="input"
          :value="local.fractionKey"
          @change="
            updateField(
              'fractionKey',
              ($event.target as HTMLSelectElement).value as keyof typeof FRACTION_DELTAS
            )
          "
        >
          <option v-for="f in fractionOptions" :key="f" :value="f">
            {{ f === "none" ? "—" : f }}
          </option>
        </select>
      </label>
      <label>
        Unit
        <select
          class="input"
          :value="local.unit"
          @change="updateField('unit', ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
        </select>
      </label>
    </div>
    <label>
      Ingredient
      <input
        class="input"
        :value="local.foodName"
        required
        @input="updateField('foodName', ($event.target as HTMLInputElement).value)"
      />
    </label>
    <label>
      Note
      <input
        class="input"
        :value="local.note"
        @input="updateField('note', ($event.target as HTMLInputElement).value)"
      />
    </label>
    <p class="hint">Stored amount: {{ preview }} (used for cart math)</p>
  </div>
</template>

<style lang="scss" scoped>
.row {
  margin-bottom: 0.75rem;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
}
label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: var(--muted);
}
.ingredient {
  margin-bottom: 1rem;
}
.hint {
  margin: 0.5rem 0 0;
  font-size: 0.8rem;
  color: var(--muted);
}
</style>
