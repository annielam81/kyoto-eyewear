import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './app.css';
import { useSessionStore } from './stores/session';

const app = createApp(App);
app.use(createPinia());
app.use(router);

const session = useSessionStore();
session.init().finally(() => {
  app.mount('#app');
});
