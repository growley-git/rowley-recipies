<script setup lang="ts">
import { gql } from "@apollo/client/core";
import { useMutation, useQuery } from "@vue/apollo-composable";
import { computed } from "vue";
import { useAlerts } from "../composables/useAlerts";
const LIST = gql`
  query AdminRecipes {
    recipes(filter: {}, pagination: { first: 100 }) {
      totalCount
      edges {
        node {
          id
          title
          slug
          publishedAt
        }
      }
    }
  }
`;

const DELETE = gql`
  mutation Del($id: ID!) {
    deleteRecipe(id: $id)
  }
`;

const PUBLISH = gql`
  mutation Pub($id: ID!) {
    publishRecipe(id: $id) {
      id
      publishedAt
    }
  }
`;

const UNPUB = gql`
  mutation Unpub($id: ID!) {
    unpublishRecipe(id: $id) {
      id
      publishedAt
    }
  }
`;

const { result, loading, refetch } = useQuery(LIST);
const { mutate: del } = useMutation(DELETE);
const { mutate: pub } = useMutation(PUBLISH);
const { mutate: unpub } = useMutation(UNPUB);
const { push: toast } = useAlerts();

const edges = computed(() => result.value?.recipes?.edges ?? []);

async function remove(id: string) {
  if (!confirm("Delete this recipe?")) return;
  try {
    await del({ id });
    await refetch();
    toast("Recipe deleted.", "success");
  } catch {
    toast("Could not delete that recipe. Try again.", "error");
  }
}

async function togglePublish(id: string, published: boolean) {
  try {
    if (published) await unpub({ id });
    else await pub({ id });
    await refetch();
    toast(published ? "Recipe unpublished." : "Recipe published.", "success");
  } catch {
    toast("Could not update publish status. Try again.", "error");
  }
}
</script>

<template>
  <div>
    <div class="head">
      <h1>Recipes</h1>
      <RouterLink to="/admin/recipes/new" class="btn btn-primary">New recipe</RouterLink>
    </div>
    <p v-if="loading">Loading…</p>
    <table v-else class="table card">
      <thead>
        <tr>
          <th>Title</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="e in edges" :key="e.node.id">
          <td>
            <RouterLink :to="`/admin/recipes/${e.node.id}`">{{ e.node.title }}</RouterLink>
          </td>
          <td>{{ e.node.publishedAt ? "Published" : "Draft" }}</td>
          <td class="actions">
            <button
              type="button"
              class="btn small"
              @click="togglePublish(e.node.id, !!e.node.publishedAt)"
            >
              {{ e.node.publishedAt ? "Unpublish" : "Publish" }}
            </button>
            <button type="button" class="btn small" @click="remove(e.node.id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="scss" scoped>
.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}
.table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  text-align: left;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--border);
}
.actions {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}
.small {
  font-size: 0.85rem;
  padding: 0.25rem 0.5rem;
}
</style>
