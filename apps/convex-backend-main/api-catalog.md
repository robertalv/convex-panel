# Convex API Catalog

A curated list of all Convex APIs and demos available in this repository.

## Core APIs

### Authentication & Users
- **users-and-auth** - Basic user authentication system
- **users-and-clerk** - Clerk integration for user management
- **users-and-clerk-webhooks** - Clerk with webhook handling
- **clerk** - Simple Clerk authentication demo

### Messaging & Chat
- **convex-chat-speculative** - Speculative chat implementation
- **convex-ai-chat** - AI-powered chat with embeddings and document ingestion
- **messages** - Basic messaging functionality (multiple demos)

### File Management
- **file-storage** - Basic file storage capabilities
- **file-storage-with-http** - File storage with HTTP endpoints

### Scheduling & Automation
- **cron-jobs** - Scheduled task management
- **scheduling** - Task scheduling system

### HTTP & External Integration
- **http** - HTTP endpoint handling
- **system-tables** - System table administration

## Framework Integrations

### React
- **react-vite** - React with Vite
- **react-vite-ts** - React with Vite and TypeScript
- **react-native** - React Native mobile app

### Next.js
- **nextjs-app-dir** - Next.js App Router
- **nextjs-app-dir-14** - Next.js 14 App Router
- **nextjs-app-dir-js** - Next.js App Router (JavaScript)

### Other Frameworks
- **sveltekit** - SvelteKit integration
- **tanstack-start-clerk** - TanStack Start with Clerk auth

## Specialized Demos

### Development Tools
- **typescript** - TypeScript configuration example
- **cjs-typescript** - CommonJS TypeScript setup
- **bundle-size** - Bundle size optimization demo

### Advanced Features
- **version** - Version management system with GitHub integration
- **system-udfs** - System user-defined functions
- **retention-tester** - Data retention testing
- **waitlist** - Waitlist management system

## Quick Start Templates
- **tasks** - Simple task management (multiple framework variants)
- **posts** - Basic post/content management

## API Structure

Each API typically includes:
- `listMessages` / `sendMessage` - Basic CRUD operations
- `tasks` - Task management functions
- `users` - User management functions
- `http` - HTTP endpoint handlers
- `crons` - Scheduled function definitions

## Usage

To reference any function from these APIs:
```js
const myFunction = api.moduleName.functionName;
const result = await myFunction(args);
```

For internal functions:
```js
const internalFunction = internal.moduleName.functionName;
```