import { createRouter, createWebHashHistory, createWebHistory } from "vue-router";
import { getToken } from "./lib/auth";
import AdminRecipeEdit from "./views/AdminRecipeEdit.vue";
import AdminRecipes from "./views/AdminRecipes.vue";
import GroceryListPage from "./views/GroceryListPage.vue";
import HomePage from "./views/HomePage.vue";
import LoginPage from "./views/LoginPage.vue";
import RecipePage from "./views/RecipePage.vue";
import SlotMachinePage from "./views/SlotMachinePage.vue";

const history =
  import.meta.env.VITE_ELECTRON === "1"
    ? createWebHashHistory()
    : createWebHistory();

export const router = createRouter({
  history,
  routes: [
    { path: "/", name: "home", component: HomePage },
    { path: "/recipe/:slug", name: "recipe", component: RecipePage, props: true },
    { path: "/grocery", name: "grocery", component: GroceryListPage },
    { path: "/spin", name: "spin", component: SlotMachinePage },
    { path: "/admin", name: "admin-login", component: LoginPage },
    { path: "/admin/recipes", name: "admin-recipes", component: AdminRecipes },
    {
      path: "/admin/recipes/new",
      name: "admin-recipe-new",
      component: AdminRecipeEdit,
    },
    {
      path: "/admin/recipes/:id",
      name: "admin-recipe-edit",
      component: AdminRecipeEdit,
      props: true,
    },
  ],
});

router.beforeEach((to) => {
  if (to.path.startsWith("/admin/recipes") && !getToken()) {
    return { name: "admin-login", query: { redirect: to.fullPath } };
  }
  return true;
});
