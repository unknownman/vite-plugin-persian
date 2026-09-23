import { createApp } from "vue";
import App from "./App.vue";
import { vPersianDigits } from "vite-plugin-persian/vue";
import "./style.css";

createApp(App).directive("persian-digits", vPersianDigits).mount("#app");