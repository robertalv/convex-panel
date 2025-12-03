import './app.css';
import 'convex-panel/styles.css';
import App from './App.svelte';
import { mount } from 'svelte';

// Set up dark mode
document.documentElement.lang = 'en';
document.documentElement.classList.add('dark');

const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;

