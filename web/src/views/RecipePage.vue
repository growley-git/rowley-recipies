<script setup lang="ts">
import { gql } from "@apollo/client/core";
import { useMutation, useQuery } from "@vue/apollo-composable";
import { computed } from "vue";
import { useRoute } from "vue-router";
import RecipeStepText from "../components/RecipeStepText.vue";
import { useAlerts } from "../composables/useAlerts";
import { GROCERY_LIST_QUERY } from "../graphql/groceryList";

const props = defineProps<{
  slug: string;
}>();

const RECIPE = gql`
  query RecipeBySlug($slug: String!) {
    recipe(slug: $slug) {
      id
      title
      slug
      publishedAt
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
        amountDisplay
        note
      }
      tags {
        id
        name
        slug
      }
    }
  }
`;

const ADD_TO_LIST = gql`
  mutation AddRecipe($recipeId: ID!) {
    addRecipeToGroceryList(recipeId: $recipeId) {
      lineCount
    }
  }
`;

const route = useRoute();
const slug = computed(() => (props.slug ?? route.params.slug) as string);

const { result, loading } = useQuery(
  RECIPE,
  () => ({ slug: slug.value }),
  () => ({ enabled: !!slug.value })
);

const recipe = computed(() => result.value?.recipe);

const ingredientFoodNames = computed(() =>
  (recipe.value?.ingredients ?? []).map((i: { foodName: string }) => i.foodName)
);

const { mutate: addToList, loading: adding } = useMutation(ADD_TO_LIST, {
  refetchQueries: [{ query: GROCERY_LIST_QUERY }],
  awaitRefetchQueries: true,
});
const { push: alert } = useAlerts();

async function add() {
  const id = recipe.value?.id;
  if (!id) return;
  try {
    await addToList({ recipeId: id });
    alert(
      "Ingredients added to your grocery list.",
      "success"
    );
  } catch {
    alert("Could not add to the grocery list. Try again.", "error");
  }
}
</script>

<template>
  <div v-if="loading">Loading…</div>
  <article v-else-if="recipe">
    <h1>{{ recipe.title }}</h1>
    <p v-if="recipe.tags?.length" class="tags">
      <span v-for="t in recipe.tags" :key="t.id" class="tag-pill">{{ t.name }}</span>
    </p>
    <section v-if="recipe.ingredients?.length" class="card block">
      <h2>Ingredients</h2>
      <ul>
        <li v-for="ing in recipe.ingredients" :key="ing.id">
          <template v-if="ing.section">
            <strong class="section">{{ ing.section }}</strong>
          </template>
          <span class="qty">{{ ing.amountDisplay }}</span>
          {{ ing.foodName }}
          <span v-if="ing.note" class="note">({{ ing.note }})</span>
        </li>
      </ul>
      <button
        type="button"
        class="btn btn-primary"
        :disabled="adding || !recipe.publishedAt"
        @click="add"
      >
        Add to grocery list
      </button>
      <p v-if="!recipe.publishedAt" class="hint">This recipe is not published.</p>
    </section>
    <section v-if="recipe.steps?.length" class="card block">
      <h2>Directions</h2>
      <ol class="steps">
        <li v-for="s in recipe.steps" :key="s.id">
          <RecipeStepText :text="s.text" :food-names="ingredientFoodNames" />
        </li>
      </ol>
    </section>
  </article>
  <p v-else>Recipe not found.</p>
</template>

<style lang="scss" scoped>
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 1rem;
}
.block {
  margin-bottom: 1.5rem;
}
.section {
  display: block;
  margin-top: 0.75rem;
  color: var(--muted);
  font-size: 0.9rem;
}
.qty {
  font-weight: 600;
  margin-right: 0.25rem;
}
.note {
  color: var(--muted);
  font-size: 0.9rem;
}
.steps {
  margin: 0;
  padding-left: 1.25rem;
}
.steps li {
  margin: 0.5rem 0;
  padding-left: 0.25rem;
}
.hint {
  font-size: 0.9rem;
  color: var(--muted);
}
</style>
