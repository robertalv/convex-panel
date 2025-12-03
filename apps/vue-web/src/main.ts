import './app.css';
import 'convex-panel/styles.css';
import { createApp } from 'vue';
import App from './App.vue';

// Set up dark mode
document.documentElement.lang = 'en';
document.documentElement.classList.add('dark');

const app = createApp(App);
app.mount('#app');

