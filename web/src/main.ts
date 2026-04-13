import "./styles/main.scss";
// MDI webfont — https://pictogrammers.com/docs/library/mdi/getting-started/webfont/
import "@mdi/font/css/materialdesignicons.min.css";
import { DefaultApolloClient } from "@vue/apollo-composable";
import { createApp } from "vue";
import { createApollo } from "./apollo";
import App from "./App.vue";
import { router } from "./router";

const apollo = createApollo();

const app = createApp(App);
app.provide(DefaultApolloClient, apollo);
app.use(router);
app.mount("#app");
