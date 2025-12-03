# Vue Web App

Test application for Convex Panel with Vue.

## Setup

1. Create a `.env` file with your Convex URL:
   ```
   VITE_CONVEX_URL=https://your-deployment.convex.cloud
   CONVEX_ACCESS_TOKEN=your_team_access_token
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Run the dev server:
   ```bash
   pnpm dev
   ```

## Usage

The app demonstrates how to use Convex Panel with Vue. The `ConvexPanel` component is imported from `convex-panel/vue` and automatically mounts the React-based panel in your Vue application.

```vue
<template>
  <ConvexPanel :convex-url="convexUrl" :access-token="accessToken" />
</template>

<script setup lang="ts">
import ConvexPanel from 'convex-panel/vue';
const convexUrl = import.meta.env.VITE_CONVEX_URL;
const accessToken = import.meta.env.VITE_CONVEX_ACCESS_TOKEN;
</script>
```



