<script setup lang="ts">
import { gql } from "@apollo/client/core";
import { useMutation } from "@vue/apollo-composable";
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAlerts } from "../composables/useAlerts";
import { setToken } from "../lib/auth";

const LOGIN = gql`
  mutation Login($password: String!) {
    login(password: $password) {
      token
      expiresAt
    }
  }
`;

const password = ref("");
const router = useRouter();
const route = useRoute();
const { push: toast } = useAlerts();

const { mutate, loading } = useMutation(LOGIN);

async function submit() {
  try {
    const res = await mutate({ password: password.value });
    const token = res?.data?.login?.token;
    if (token) {
      setToken(token);
      toast("Signed in.", "success");
      const redirect = (route.query.redirect as string) || "/admin/recipes";
      await router.push(redirect);
    } else {
      toast("Login failed.", "error");
    }
  } catch {
    toast("Login failed.", "error");
  }
}
</script>

<template>
  <div class="narrow">
    <h1>Admin sign in</h1>
    <form class="card" @submit.prevent="submit">
      <label>
        Password
        <input v-model="password" class="input" type="password" autocomplete="current-password" />
      </label>
      <button type="submit" class="btn btn-primary" :disabled="loading">Sign in</button>
    </form>
  </div>
</template>

<style lang="scss" scoped>
.narrow {
  max-width: 420px;
}
form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
