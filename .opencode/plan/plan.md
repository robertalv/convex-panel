# Mobile Pro Tier Implementation Plan

## 1. Pro Gating Infrastructure (Foundation)

- **Goal:** Enable "Pro" feature gating based on user subscription.
- **Status:** Planning

### 1.1 Storage Keys

- Modify `apps/mobile/src/features/data/utils/storage.ts` to add `MOBILE_PRO_STATUS`.

### 1.2 TierBadge Component

- Create `apps/mobile/src/components/ui/TierBadge.tsx`.
- Port logic from desktop, using `getPlanInfo` equivalent.
- Use `rocket` icon for "Pro" tier (closest match to Zap/Flash).

### 1.3 Hook: `useIsProUser`

- Create `apps/mobile/src/hooks/useIsProUser.ts`.
- Fetch subscription using `useBigBrain` -> `getTeamSubscription`.
- Return boolean based on plan type (`CONVEX_PROFESSIONAL` || `CONVEX_BUSINESS`).

## 2. Performance Insights (Low Hanging Fruit)

- **Goal:** Visual charts for query performance.
- **Dependencies:** `react-native-chart-kit` (already installed).
- **Files:**
  - `apps/mobile/src/features/dashboard/components/InsightsScreen.tsx`
  - `apps/mobile/src/features/dashboard/components/PerformanceCharts.tsx`

## 3. AI Chatbot (High Value)

- **Goal:** Conversational interface for logs/data.
- **Dependencies:** `ai` (Vercel AI SDK), `openai`.
- **Files:**
  - `apps/mobile/src/features/ai/ChatScreen.tsx`
  - `apps/mobile/src/features/ai/components/ChatBubble.tsx`
  - `apps/mobile/src/features/ai/hooks/useConvexAI.ts`

## 4. Schema Visualizer (Complex)

- **Goal:** Read-only schema node graph.
- **Dependencies:** `react-native-svg` (already installed).
- **Files:**
  - `apps/mobile/src/features/schema/SchemaVisualizerScreen.tsx`
  - `apps/mobile/src/features/schema/components/SchemaNode.tsx`
  - `apps/mobile/src/features/schema/utils/layout.ts` (Simple force-directed or tree layout)
