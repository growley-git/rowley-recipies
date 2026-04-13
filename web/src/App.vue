<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
import AlertStack from "./components/AlertStack.vue";
import BreadcrumbBar from "./components/BreadcrumbBar.vue";
</script>

<template>
  <div class="layout">
    <AlertStack />
    <header class="nav">
      <RouterLink to="/" class="nav-brand">Rowley Recipes</RouterLink>
      <nav class="nav-links">
        <RouterLink class="icon-text" to="/">
          <span class="mdi mdi-book-open-variant icon-inline icon-leading" aria-hidden="true"></span>
          Recipes
        </RouterLink>
        <RouterLink class="icon-text" to="/grocery">
          <span class="mdi mdi-cart-outline icon-inline icon-leading" aria-hidden="true"></span>
          Grocery list
        </RouterLink>
        <RouterLink class="icon-text" to="/admin">
          <span class="mdi mdi-lock-outline icon-inline icon-leading" aria-hidden="true"></span>
          Chefs Portal
        </RouterLink>
      </nav>
    </header>
    <main class="main-body">
      <BreadcrumbBar />
      <RouterView />
    </main>
    <footer class="site-footer">
      <RouterLink to="/spin" class="footer-easter">Can’t decide?</RouterLink>
      <hr>
      <p>
        <small>
          &copy; {{ new Date().getFullYear() }} Rowley Recipes. All rights reserved.
        </small>
      </p>
    </footer>
  </div>
</template>

<style lang="scss" scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-body {
  flex: 1;
}

.site-footer {
  text-align: center;
  padding: 1rem 1.5rem 1.5rem;
  border-top: 1px solid var(--border, #e7e5e4);

  .footer-easter {
    font-size: 0.8rem;
    color: var(--muted, #78716c);

    &:hover {
      color: var(--accent, #b45309);
    }
  }
}
</style>
