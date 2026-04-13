<script setup lang="ts">
import { gql } from "@apollo/client/core";
import { useQuery } from "@vue/apollo-composable";
import { computed, ref, watch } from "vue";

const RECIPES = gql`
  query Recipes($filter: RecipeFilterInput, $pagination: PaginationInput) {
    recipes(filter: $filter, pagination: $pagination) {
      totalCount
      edges {
        cursor
        node {
          id
          title
          slug
          publishedAt
          reviewStats {
            averageRating
            reviewCount
          }
          tags {
            id
            name
            slug
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
    tags {
      id
      name
      slug
    }
  }
`;

const search = ref("");
const tagSlug = ref<string | null>(null);

const { result, loading, refetch } = useQuery(RECIPES, () => ({
  filter: {
    publishedOnly: true,
    search: search.value.trim() || undefined,
    tagSlug: tagSlug.value || undefined,
  },
  pagination: { first: 24 },
}));

watch([search, tagSlug], () => {
  void refetch();
});

const recipes = computed(() => result.value?.recipes?.edges ?? []);
const tags = computed(() => result.value?.tags ?? []);

function selectTag(slug: string | null) {
  tagSlug.value = slug;
}

function formatAvg(n: number | null | undefined) {
  if (n == null) return "";
  return n.toFixed(1);
}
</script>

<template>
  <div>
    <h1>Recipe archive</h1>
    <p class="lede">Published family recipes — search, filter by tag, open a dish.</p>

    <div class="toolbar card">
      <input
        v-model="search"
        class="input"
        type="search"
        placeholder="Search title, directions, or ingredient…"
        aria-label="Search recipes"
      />
      <div class="tags">
        <button
          type="button"
          class="tag-pill"
          :class="{ active: tagSlug === null }"
          @click="selectTag(null)"
        >
          All
        </button>
        <button
          v-for="t in tags"
          :key="t.id"
          type="button"
          class="tag-pill"
          :class="{ active: tagSlug === t.slug }"
          @click="selectTag(t.slug)"
        >
          {{ t.name }}
        </button>
      </div>
    </div>

    <p v-if="loading">Loading…</p>
    <ul v-else class="list">
      <li v-for="e in recipes" :key="e.cursor">
        <RouterLink :to="`/recipe/${e.node.slug}`">{{ e.node.title }}</RouterLink>
        <span
          v-if="e.node.reviewStats?.reviewCount"
          class="rating-summary"
          :title="`${e.node.reviewStats.reviewCount} review(s)`"
        >
           {{ "\u2605" }} {{ formatAvg(e.node.reviewStats.averageRating) }}
          <span class="count">({{ e.node.reviewStats.reviewCount }})</span>
        </span>
        <span v-if="e.node.tags?.length" class="meta">
          <span v-for="tg in e.node.tags" :key="tg.id" class="tag-pill">{{ tg.name }}</span>
        </span>
      </li>
    </ul>
    <p v-if="!loading && recipes.length === 0">No recipes match.</p>
  </div>
</template>

<style lang="scss" scoped>
.lede {
  color: var(--muted);
  max-width: 42rem;
}
.toolbar {
  margin: 1.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.tag-pill.active {
  outline: 2px solid var(--accent);
}
.list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.list li {
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}
.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}
.rating-summary {
  font-size: 0.9rem;
  color: var(--muted);
  white-space: nowrap;
}
.rating-summary .count {
  font-size: 0.85rem;
  opacity: 0.85;
}
</style>
