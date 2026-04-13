<script setup lang="ts">
import { gql } from "@apollo/client/core";
import { useMutation, useQuery } from "@vue/apollo-composable";
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { useAlerts } from "../composables/useAlerts";
import { GROCERY_LIST_QUERY } from "../graphql/groceryList";

const REMOVE = gql`
  mutation Remove($id: ID!) {
    removeGroceryLine(id: $id)
  }
`;

const CLEAR = gql`
  mutation Clear {
    clearGroceryList
  }
`;

const { result, loading, refetch } = useQuery(GROCERY_LIST_QUERY);
const { mutate: removeLine } = useMutation(REMOVE);
const { mutate: clearList } = useMutation(CLEAR);
const { push: alert } = useAlerts();

const payload = computed(() => result.value?.groceryList);
const lines = computed(() => payload.value?.lines ?? []);
const selectedRecipes = computed(() => payload.value?.selectedRecipes ?? []);

const md = computed(() => {
  let out = "";
  const meals = selectedRecipes.value;
  if (meals.length) {
    out += "## Recipes in this list\n\n";
    out +=
      meals.map((r: { title: string }) => `- ${r.title}`).join("\n") + "\n\n";
  }
  out += "## Grocery list\n\n";
  if (!lines.value.length) {
    out += "_Empty_\n";
    return out;
  }
  out +=
    lines.value
      .map(
        (l: {
          display: string;
          foodName: string;
          sourceRecipes?: { title: string }[];
        }) => {
          let row = `- ${l.display} ${l.foodName}`;
          if (l.sourceRecipes?.length) {
            const names = l.sourceRecipes
              .map((r: { title: string }) => r.title)
              .join(", ");
            row += ` _(from: ${names})_`;
          }
          return row;
        }
      )
      .join("\n") + "\n";
  return out;
});

async function remove(id: string) {
  try {
    await removeLine({ id });
    await refetch();
    alert("Removed that line from your grocery list.", "success");
  } catch {
    alert("Could not remove that item. Try again.", "error");
  }
}

async function clear() {
  try {
    await clearList();
    await refetch();
    alert("Grocery list cleared.", "success");
  } catch {
    alert("Could not clear the list. Try again.", "error");
  }
}

async function copyMd() {
  try {
    await navigator.clipboard.writeText(md.value);
    alert("Grocery list copied to clipboard.", "success");
  } catch {
    alert("Could not copy — your browser may block clipboard access.", "error");
  }
}

function printPage() {
  window.print();
}

function sourceRecipeTitles(recipes: { title: string }[] | undefined): string {
  return recipes?.map((r) => r.title).join(", ") ?? "";
}
</script>

<template>
  <div>
    <h1>Grocery list</h1>
    <p class="lede">
      Consolidated from recipes you added — merged by ingredient and unit. Recipes
      you’ve included are listed below.
    </p>

    <div class="actions no-print">
      <button type="button" class="btn" @click="copyMd">Copy as Markdown</button>
      <button type="button" class="btn" @click="printPage">Print</button>
      <button type="button" class="btn" @click="clear">Clear all</button>
    </div>

    <p v-if="loading">Loading…</p>
    <template v-else>
      <section
        v-if="selectedRecipes.length"
        class="card recipes-banner no-print"
      >
        <h2>Recipes in this list</h2>
        <ul class="recipe-links">
          <li v-for="r in selectedRecipes" :key="r.id">
            <RouterLink :to="`/recipe/${r.slug}`">{{ r.title }}</RouterLink>
          </li>
        </ul>
      </section>

      <section v-if="selectedRecipes.length" class="print-only print-recipes">
        <h2>Recipes</h2>
        <ul>
          <li v-for="r in selectedRecipes" :key="r.id">{{ r.title }}</li>
        </ul>
      </section>

      <ul class="list card">
        <li v-for="line in lines" :key="line.id">
          <div class="line-body">
            <span class="line-qty">{{ line.display }} {{ line.foodName }}</span>
            <p v-if="line.sourceRecipes?.length" class="sources">
              <span class="label">From</span>
              <span class="source-links no-print">
                <template v-for="(r, i) in line.sourceRecipes" :key="r.id">
                  <RouterLink :to="`/recipe/${r.slug}`">{{ r.title }}</RouterLink>
                  <span v-if="i < line.sourceRecipes.length - 1">, </span>
                </template>
              </span>
              <span class="source-plain print-only">{{
                sourceRecipeTitles(line.sourceRecipes)
              }}</span>
            </p>
          </div>
          <button type="button" class="btn small no-print" @click="remove(line.id)">
            Remove
          </button>
        </li>
      </ul>
      <p v-if="lines.length === 0">Your list is empty. Add recipes from the archive.</p>
    </template>

    <section class="print-only">
      <pre class="md">{{ md }}</pre>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.lede {
  color: var(--muted);
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1rem 0;
}
.recipes-banner {
  margin-bottom: 1rem;
}
.recipes-banner h2 {
  margin: 0 0 0.75rem;
  font-size: 1.1rem;
}
.recipe-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
}
.list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.list li {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.65rem 0;
  border-bottom: 1px solid var(--border);
}
.line-body {
  flex: 1;
  min-width: 0;
}
.line-qty {
  font-weight: 500;
}
.sources {
  margin: 0.35rem 0 0;
  font-size: 0.88rem;
  color: var(--muted);
}
.sources .label {
  margin-right: 0.35rem;
}
.sources a {
  color: var(--accent);
}
.source-plain {
  display: none;
}
.print-recipes {
  display: none;
}
.small {
  padding: 0.25rem 0.5rem;
  font-size: 0.85rem;
  flex-shrink: 0;
}
.md {
  white-space: pre-wrap;
  font-family: inherit;
}
.print-only {
  display: none;
}
@media print {
  .no-print {
    display: none !important;
  }
  .print-only {
    display: block;
  }
  .source-links {
    display: none !important;
  }
  .source-plain {
    display: inline !important;
  }
}
</style>
