import { createApp } from "vue";
// The shared stylesheet, which Vue parts and the React bridge both draw with.
import "@kozmos-ds/styles/style.css";
import "./style.css";
import App from "./App.vue";

createApp(App).mount("#app");
