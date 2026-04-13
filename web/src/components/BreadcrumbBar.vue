<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter, type RouteLocationNormalizedLoaded } from "vue-router";
import { breadcrumbDetailLabel } from "../composables/breadcrumbDetail";

type Crumb = { path: string; label: string };

const router = useRouter();
const route = useRoute();
const trail = ref<Crumb[]>([]);

function fallbackLabel(r: RouteLocationNormalizedLoaded): string {
  switch (r.name) {
    case "home":
      return "Recipes";
    case "recipe":
      return "Recipe";
    case "grocery":
      return "Grocery list";
    case "spin":
      return "Pick a recipe";
    case "admin-login":
      return "Sign in";
    case "admin-recipes":
      return "Manage recipes";
    case "admin-recipe-new":
      return "New recipe";
    case "admin-recipe-edit":
      return "Edit recipe";
    default:
      return "Page";
  }
}

function labelForDestination(
  r: RouteLocationNormalizedLoaded,
  preferDetail: boolean
): string {
  if (
    preferDetail &&
    (r.name === "recipe" ||
      r.name === "admin-recipe-edit" ||
      r.name === "admin-recipe-new") &&
    breadcrumbDetailLabel.value
  ) {
    return breadcrumbDetailLabel.value;
  }
  return fallbackLabel(r);
}

function buildInitialTrail(to: RouteLocationNormalizedLoaded): Crumb[] {
  if (to.name === "home") {
    return [{ path: to.fullPath, label: labelForDestination(to, false) }];
  }
  return [
    { path: "/", label: "Recipes" },
    { path: to.fullPath, label: labelForDestination(to, true) },
  ];
}

const removeAfterEach = router.afterEach((to, from) => {
  const firstNav = from.matched.length === 0;
  if (firstNav) {
    trail.value = buildInitialTrail(to);
    return;
  }

  if (from.name === "admin-login" && to.name === "admin-recipes") {
    trail.value = [
      { path: "/", label: "Recipes" },
      { path: to.fullPath, label: labelForDestination(to, true) },
    ];
    return;
  }

  const idx = trail.value.findIndex((c) => c.path === to.fullPath);
  if (idx >= 0) {
    trail.value = trail.value.slice(0, idx + 1);
    return;
  }

  trail.value = [
    ...trail.value,
    { path: to.fullPath, label: labelForDestination(to, true) },
  ];
});

watch(
  breadcrumbDetailLabel,
  (label) => {
    if (!label) return;
    const t = trail.value;
    if (!t.length) return;
    const last = t[t.length - 1];
    if (last.path !== route.fullPath) return;
    if (
      route.name !== "recipe" &&
      route.name !== "admin-recipe-edit" &&
      route.name !== "admin-recipe-new"
    ) {
      return;
    }
    if (last.label === label) return;
    trail.value = [...t.slice(0, -1), { ...last, label }];
  }
);

const showBar = computed(() => {
  const t = trail.value;
  return !(t.length === 1 && route.name === "home");
});

onUnmounted(() => {
  removeAfterEach();
});
</script>

<template>
  <nav
    v-if="showBar"
    class="breadcrumb container"
    aria-label="Breadcrumb"
  >
    <ol class="breadcrumb-list">
      <li
        v-for="(crumb, i) in trail"
        :key="crumb.path + i"
        class="breadcrumb-item"
      >
        <RouterLink
          v-if="i < trail.length - 1"
          :to="crumb.path"
          class="breadcrumb-link"
        >
          {{ crumb.label }}
        </RouterLink>
        <span
          v-else
          class="breadcrumb-current"
          aria-current="page"
        >
          {{ crumb.label }}
        </span>
        <span
          v-if="i < trail.length - 1"
          class="breadcrumb-sep"
          aria-hidden="true"
        >
          /
        </span>
      </li>
    </ol>
  </nav>
</template>

<style lang="scss" scoped>
.breadcrumb {
  padding: 0.65rem 0 0.25rem;
  font-size: 0.9rem;
}

.breadcrumb-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.15rem 0.35rem;
}

.breadcrumb-item {
  display: inline-flex;
  align-items: baseline;
  gap: 0.35rem;
}

.breadcrumb-link {
  color: var(--accent, #b45309);
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
}

.breadcrumb-current {
  color: var(--muted, #78716c);
  font-weight: 500;
}

.breadcrumb-sep {
  color: var(--muted, #78716c);
  user-select: none;
  font-weight: 300;
}
</style>
