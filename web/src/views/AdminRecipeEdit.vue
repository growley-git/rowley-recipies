<script setup lang="ts">
import { gql } from "@apollo/client/core";
import { useMutation, useQuery } from "@vue/apollo-composable";
import { FRACTION_DELTAS, wholeAndFractionToDecimal } from "@rowley/domain";
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import IngredientEditor, {
  type IngredientForm,
} from "../components/IngredientEditor.vue";
import { useAlerts } from "../composables/useAlerts";

const TAGS = gql`
  query TagsForAdmin {
    tags {
      id
      name
      slug
    }
  }
`;

const FLAGS = gql`
  query AdminFlags {
    aiFeatureFlags {
      enabled
      tagSuggestions
      summaries
    }
  }
`;

const RECIPE = gql`
  query RecipeAdmin($id: ID!) {
    recipe(id: $id) {
      id
      title
      slug
      publishedAt
      aiSummary
      steps {
        id
        sortOrder
        text
      }
      ingredients {
        id
        section
        foodName
        unit
        amount
        note
      }
      tags {
        id
        name
      }
    }
  }
`;

const CREATE = gql`
  mutation Create($input: RecipeInput!) {
    createRecipe(input: $input) {
      id
    }
  }
`;

const UPDATE = gql`
  mutation Update($id: ID!, $input: RecipeInput!) {
    updateRecipe(id: $id, input: $input) {
      id
    }
  }
`;

const SUGGEST = gql`
  mutation Suggest($recipeId: ID!) {
    suggestTagsForRecipe(recipeId: $recipeId) {
      id
      name
      slug
    }
  }
`;

const SUMMARIZE = gql`
  mutation Summarize($recipeId: ID!) {
    summarizeRecipe(recipeId: $recipeId)
  }
`;

const props = defineProps<{
  id?: string;
}>();

const router = useRouter();
const { push: toast } = useAlerts();
const isNew = computed(() => !props.id);

const title = ref("");
const slug = ref("");
const steps = ref<string[]>([""]);
const selectedTagIds = ref<string[]>([]);
const ingredients = ref<IngredientForm[]>([emptyIngredient()]);

const { result: tagsResult } = useQuery(TAGS);
const tags = computed(() => tagsResult.value?.tags ?? []);

const { result: flagsResult } = useQuery(FLAGS);
const flags = computed(() => flagsResult.value?.aiFeatureFlags);

const { result: recipeResult, loading } = useQuery(
  RECIPE,
  () => ({ id: props.id! }),
  () => ({ enabled: !isNew.value && !!props.id })
);

watch(
  () => recipeResult.value?.recipe,
  (r) => {
    if (!r) return;
    title.value = r.title;
    slug.value = r.slug;
    const stepTexts = r.steps?.map((s: { text: string }) => s.text) ?? [];
    steps.value = stepTexts.length ? stepTexts : [""];
    selectedTagIds.value = r.tags?.map((t: { id: string }) => t.id) ?? [];
    ingredients.value =
      r.ingredients?.map(lineToForm) ?? [emptyIngredient()];
  },
  { immediate: true }
);

const { mutate: create } = useMutation(CREATE);
const { mutate: update } = useMutation(UPDATE);
const { mutate: suggest } = useMutation(SUGGEST);
const { mutate: summarize } = useMutation(SUMMARIZE);

function emptyIngredient(): IngredientForm {
  return {
    section: "",
    foodName: "",
    unit: "cup",
    whole: 0,
    fractionKey: "none",
    note: "",
    decimalPreview: "0",
  };
}

function lineToForm(line: {
  section?: string | null;
  foodName: string;
  unit: string;
  amount: number;
  note?: string | null;
}): IngredientForm {
  const whole = Math.floor(line.amount);
  const frac = line.amount - whole;
  let fractionKey: keyof typeof FRACTION_DELTAS = "none";
  let best = Infinity;
  for (const k of Object.keys(FRACTION_DELTAS) as Array<
    keyof typeof FRACTION_DELTAS
  >) {
    if (k === "none") continue;
    const d = Math.abs((FRACTION_DELTAS[k] ?? 0) - frac);
    if (d < best) {
      best = d;
      fractionKey = k;
    }
  }
  if (best > 0.02) fractionKey = "none";
  return {
    section: line.section ?? "",
    foodName: line.foodName,
    unit: line.unit,
    whole,
    fractionKey,
    note: line.note ?? "",
    decimalPreview: String(line.amount),
  };
}

function toInput(ing: IngredientForm) {
  return {
    section: ing.section || undefined,
    foodName: ing.foodName,
    unit: ing.unit,
    amount: wholeAndFractionToDecimal(ing.whole, ing.fractionKey),
    note: ing.note || undefined,
  };
}

async function save() {
  const stepInputs = steps.value
    .map((t) => t.trim())
    .filter(Boolean)
    .map((text) => ({ text }));
  if (stepInputs.length === 0) {
    toast("Add at least one direction step.", "error");
    return;
  }
  const input = {
    title: title.value,
    slug: slug.value,
    tagIds: selectedTagIds.value,
    steps: stepInputs,
    ingredients: ingredients.value.filter((i) => i.foodName.trim()).map(toInput),
  };
  try {
    if (isNew.value) {
      const res = await create({ input });
      const id = res?.data?.createRecipe?.id;
      if (!id) {
        toast("Recipe was not created. Try again.", "error");
        return;
      }
      toast("Recipe created.", "success");
      await router.push(`/admin/recipes/${id}`);
    } else {
      await update({ id: props.id!, input });
      toast("Recipe saved.", "success");
      await router.push("/admin/recipes");
    }
  } catch {
    toast("Could not save the recipe. Check your connection and try again.", "error");
  }
}

function addIngredient() {
  ingredients.value.push(emptyIngredient());
}

function removeIngredient(index: number) {
  ingredients.value.splice(index, 1);
}

function addStep() {
  steps.value.push("");
}

function removeStep(index: number) {
  if (steps.value.length <= 1) return;
  steps.value.splice(index, 1);
}

async function runSuggest() {
  if (!props.id) return;
  try {
    const res = await suggest({ recipeId: props.id });
    const suggested = res?.data?.suggestTagsForRecipe ?? [];
    const ids = new Set(selectedTagIds.value);
    for (const t of suggested) ids.add(t.id);
    selectedTagIds.value = [...ids];
    toast(
      suggested.length
        ? `Applied ${suggested.length} suggested tag(s).`
        : "No new tag suggestions.",
      suggested.length ? "success" : "info"
    );
  } catch {
    toast("Could not load tag suggestions.", "error");
  }
}

async function runSummarize() {
  if (!props.id) return;
  try {
    await summarize({ recipeId: props.id });
    toast("Summary generated.", "success", 900);
    setTimeout(() => window.location.reload(), 950);
  } catch {
    toast("Could not generate summary.", "error");
  }
}
</script>

<template>
  <div v-if="!isNew && loading">Loading…</div>
  <form v-else class="edit" @submit.prevent="save">
    <h1>{{ isNew ? "New recipe" : "Edit recipe" }}</h1>

    <label>
      Title
      <input v-model="title" class="input" required />
    </label>
    <label>
      Slug (URL)
      <input v-model="slug" class="input" required pattern="[a-z0-9-]+" />
    </label>

    <h2>Directions</h2>
    <p class="muted">
      One step per box — prep (wash produce, preheat oven), cooking, and finishing.
    </p>
    <div
      v-for="(_s, i) in steps"
      :key="i"
      class="step-row card"
    >
      <label>
        Step {{ i + 1 }}
        <textarea
          v-model="steps[i]"
          class="input step-text"
          rows="3"
          placeholder="e.g. Preheat oven to 375°F."
        />
      </label>
      <button
        v-if="steps.length > 1"
        type="button"
        class="btn small"
        @click="removeStep(i)"
      >
        Remove step
      </button>
    </div>
    <button type="button" class="btn" @click="addStep">Add step</button>

    <fieldset>
      <legend>Tags</legend>
      <label v-for="t in tags" :key="t.id" class="check">
        <input v-model="selectedTagIds" type="checkbox" :value="t.id" />
        {{ t.name }}
      </label>
    </fieldset>

    <div v-if="!isNew && flags?.enabled" class="ai card">
      <h2>AI helpers</h2>
      <p v-if="flags?.tagSuggestions" class="muted">
        Suggestions use title keywords against your tag list (stub when AI_FEATURES=1).
      </p>
      <div class="row">
        <button
          v-if="flags?.tagSuggestions"
          type="button"
          class="btn"
          @click="runSuggest"
        >
          Suggest tags
        </button>
        <button
          v-if="flags?.summaries"
          type="button"
          class="btn"
          @click="runSummarize"
        >
          Generate summary
        </button>
      </div>
    </div>

    <h2>Ingredients</h2>
    <IngredientEditor
      v-for="(ing, i) in ingredients"
      :key="i"
      :model-value="ing"
      @update:model-value="(v) => (ingredients[i] = v)"
    />
    <button type="button" class="btn" @click="addIngredient">Add ingredient</button>
    <button
      v-if="ingredients.length > 1"
      type="button"
      class="btn"
      @click="removeIngredient(ingredients.length - 1)"
    >
      Remove last
    </button>

    <div class="footer">
      <button type="submit" class="btn btn-primary">Save</button>
      <RouterLink to="/admin/recipes" class="btn">Cancel</RouterLink>
    </div>
  </form>
</template>

<style lang="scss" scoped>
.edit {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 640px;
}
label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.step-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.step-text {
  font-family: inherit;
  min-height: 4.5rem;
}
.small {
  align-self: flex-start;
  font-size: 0.85rem;
  padding: 0.25rem 0.5rem;
}
fieldset {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1rem;
}
.check {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
  margin: 0.25rem 0;
}
.footer {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.muted {
  color: var(--muted);
  font-size: 0.9rem;
}
</style>
