import {
  Bot,
  Mail,
  Users,
  GitBranch,
  Workflow,
  RefreshCw,
  Clock,
  Database,
  TrendingUp,
  Search,
  Hash,
  MapPin,
  Cloud,
  FileText,
  Bell,
  CreditCard,
  Receipt,
  MessageSquare,
  Github,
  Flag,
  Wallet,
  Gauge,
  Zap,
  Type,
} from 'lucide-react';
import type { ComponentInfo, ComponentCategory } from '../../../types/components';
import { getComponentImageUrl } from '../utils/images';

const getGradient = (index: number, category: string): { gradientFrom: string; gradientTo: string } => {
  const gradients: Record<string, string[][]> = {
    'Durable Functions': [
      ['#fce7f3', '#fbcfe8'], // Pink
      ['#e9d5ff', '#c084fc'], // Purple
      ['#ddd6fe', '#c4b5fd'], // Light purple
      ['#f3e8ff', '#e9d5ff'], // Lavender
      ['#fce7f3', '#f9a8d4'], // Rose
    ],
    'Database': [
      ['#dbeafe', '#bfdbfe'], // Blue
      ['#bfdbfe', '#93c5fd'], // Sky blue
      ['#cffafe', '#a5f3fc'], // Cyan
      ['#e0e7ff', '#c7d2fe'], // Indigo
      ['#ddd6fe', '#c4b5fd'], // Violet
      ['#f0f9ff', '#e0f2fe'], // Light blue
    ],
    'Integrations': [
      ['#fed7aa', '#fde68a'], // Orange
      ['#fef3c7', '#fde68a'], // Yellow
      ['#fee2e2', '#fecaca'], // Red
      ['#dcfce7', '#bbf7d0'], // Green
      ['#f3e8ff', '#e9d5ff'], // Purple
      ['#e0e7ff', '#c7d2fe'], // Indigo
      ['#fef3c7', '#fde047'], // Amber
      ['#ddd6fe', '#c4b5fd'], // Violet
      ['#fce7f3', '#fbcfe8'], // Pink
      ['#d1fae5', '#a7f3d0'], // Emerald
    ],
    'Backend': [
      ['#fce7f3', '#fbcfe8'], // Pink
      ['#dbeafe', '#bfdbfe'], // Blue
      ['#e0e7ff', '#c7d2fe'], // Indigo
      ['#fef3c7', '#fde68a'], // Yellow
    ],
  };

  const categoryGradients = gradients[category] || [['#e5e7eb', '#d1d5db']];
  const gradient = categoryGradients[index % categoryGradients.length];
  return { gradientFrom: gradient[0], gradientTo: gradient[1] };
};

const addImageUrl = (component: Omit<ComponentInfo, 'imageUrl'>): ComponentInfo => {
  const imageUrl = getComponentImageUrl(component.id);
  return imageUrl ? { ...component, imageUrl } : component;
};

const componentsData: Array<Omit<ComponentInfo, 'imageUrl'>> = [
  {
    id: 'ai-agent',
    title: 'AI Agent',
    description: 'Agents organize your AI workflows into units, with message history and vector search built in.',
    icon: <Bot size={48} />,
    gradientFrom: '#fce7f3',
    gradientTo: '#fbcfe8',
    weeklyDownloads: 9696,
    developer: 'get-convex',
    category: 'Durable Functions' as ComponentCategory,
    npmPackage: '@convex-dev/agent',
    longDescription: 'AI Agents, built on Convex. The Agent component is a core building block for building AI agents. It manages threads and messages, around which you Agents can cooperate in static or dynamic workflows.',
    features: [
      '**Agents** organize LLM prompting with associated models, prompts, Tool Calls, and behavior in relation to other Agents, functions, APIs, and more.',
      '**Threads** persist messages and can be shared by multiple users and agents (including human agents).',
      '**Streaming text and objects** using deltas over websockets so all clients stay in sync efficiently, without http streaming. Enables streaming from async functions.',
      '**Conversation context** is automatically included in each LLM call, including built-in hybrid vector/text search for messages in the thread and opt-in search for messages from other threads (for the same specified user).',
      '**RAG techniques** are supported for prompt augmentation from other sources, either up front in the prompt or as tool calls. Integrates with the RAG Component, or DIY.',
      '**Workflows** allow building multi-step operations that can span agents, users, durably and reliably.',
      '**Files** are supported in thread history with automatic saving to file storage and ref-counting.',
      '**Debugging** is enabled by callbacks, the agent playground where you can inspect all metadata and iterate on prompts and context settings, and inspection in the dashboard.',
      '**Usage tracking** is easy to set up, enabling usage attribution per-provider, per-model, per-user, per-agent, for billing & more.',
      '**Rate limiting**, powered by the Rate Limiter Component, helps control the rate at which users can interact with agents and keep you from exceeding your LLM provider\'s limits.',
    ],
    repoUrl: 'https://github.com/get-convex/agent',
    packageUrl: 'https://www.npmjs.com/package/@convex-dev/agent',
    docsUrl: 'https://docs.convex.dev/agents',
    docsLinks: [
      { label: 'Agents', url: 'https://docs.convex.dev/agents/agent-usage' },
      { label: 'Tools', url: 'https://docs.convex.dev/agents/tools' },
      { label: 'Threads', url: 'https://docs.convex.dev/agents/threads' },
      { label: 'Messages', url: 'https://docs.convex.dev/agents/messages' },
      { label: 'Human Agents', url: 'https://docs.convex.dev/agents/human-agents' },
      { label: 'Conversation Context', url: 'https://docs.convex.dev/agents/context' },
    ],
    stackPostUrl: 'https://stack.convex.dev/ai-agents',
    exampleCommands: [
      'git clone https://github.com/get-convex/agent.git',
      'cd agent',
      'npm run setup',
      'npm run dev',
    ],
    bugReportUrl: 'https://github.com/get-convex/agent/issues',
  },
  {
    id: 'workpool',
    title: 'Workpool',
    description: 'Workpools give critical tasks priority by organizing async operations into separate, customizable queues.',
    icon: <GitBranch size={48} />,
    ...getGradient(1, 'Durable Functions'),
    weeklyDownloads: 17320,
    developer: 'get-convex',
    category: 'Durable Functions' as ComponentCategory,
    npmPackage: '@convex-dev/workpool',
    longDescription: 'This Convex component pools actions and mutations to restrict parallel requests. Configure multiple pools with different parallelism, retry failed actions (with backoff and jitter) for idempotent actions, and use an onComplete callback to build durable, reliable workflows.',
    features: [
      '**Configure multiple pools** with different parallelism to separate and throttle async workloads.',
      '**Retry failed actions** with backoff and jitter for idempotent actions, fully configurable (respecting parallelism).',
      '**onComplete callback** so you can build durable, reliable workflows. Called when the work is finished, whether it succeeded, failed, or was canceled.',
      '**Separate and throttle async workloads** - prioritize important work (like emails) over less important work (like scraping) by putting them in different pools.',
      '**Retry management** - create an upper bound on parallel work to mitigate retry stampedes during third party outages.',
      '**Idempotency support** - ensures that actions can be safely retried without causing duplicate side effects.',
      '**Reduce database write conflicts** - by limiting parallelism, you can reduce OCC errors from mutations that read and write the same data.',
      '**Reactive status** - the workpool stores the status of each function in the database, and thanks to Convex\'s reactive queries, you can read it in a query to power a reactive UI.',
      '**Batching support** - use `enqueueActionBatch` to enqueue multiple actions at once, reducing overhead.',
      '**Canceling work** - cancel individual work items or all pending work.',
    ],
    repoUrl: 'https://github.com/get-convex/workpool',
    packageUrl: 'https://www.npmjs.com/package/@convex-dev/workpool',
    docsUrl: 'https://docs.convex.dev/components/workpool',
    docsLinks: [
      { label: 'GitHub Repository', url: 'https://github.com/get-convex/workpool' },
      { label: 'Example Usage', url: 'https://github.com/get-convex/workpool/blob/main/example/convex/example.ts' },
      { label: 'Best Practices', url: 'https://docs.convex.dev/understanding/best-practices' },
      { label: 'Write Conflicts', url: 'https://docs.convex.dev/error#1' },
    ],
    exampleCommands: [
      'npm install @convex-dev/workpool',
    ],
    bugReportUrl: 'https://github.com/get-convex/workpool/issues',
    documentationSections: [
      {
        heading: 'Separating and throttling async workloads',
        paragraphs: [
          'Suppose you have some important async work, like sending verification emails, and some less important async work, like scraping data from an API. If all of these are scheduled with `ctx.scheduler.runAfter`, they\'ll compete with each other for resources. The emails might be delayed if there are too many scraping requests queued ahead of them.',
          'To resolve this problem, you can separate work into different pools.',
        ],
        code: `const emailPool = new Workpool(components.emailWorkpool, {
  maxParallelism: 10,
});
const scrapePool = new Workpool(components.scrapeWorkpool, {
  maxParallelism: 5,
});

export const userSignUp = mutation({
  args: {...},
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert("users", args);
    await emailPool.enqueueAction(ctx, internal.auth.sendEmailVerification, {
      userId,
    });
  },
});

export const downloadLatestWeather = mutation({
  handler: async (ctx, args) => {
    for (const city of allCities) {
      await scrapePool.enqueueAction(ctx, internal.weather.scrape, { city });
    }
  },
});`,
      },
      {
        heading: 'Durable, reliable workflows',
        subsections: [
          {
            subheading: 'Retry management',
            paragraphs: [
              'Imagine that the payment processor is a 3rd party API, and they temporarily have an outage. Now imagine you implement your own action retrying logic for your busy app. You\'ll find very quickly that your entire backend is overwhelmed with retrying actions. This could bog down live traffic with background work, and/or cause you to exceed rate limits with the payment provider.',
              'Creating an upper bound on how much work will be done in parallel is a good way to mitigate this risk. Actions that are currently backing off awaiting retry will not tie up a thread in the workpool.',
            ],
          },
          {
            subheading: 'Completion handling',
            paragraphs: [
              'By handing off asynchronous work, it will be guaranteed to run, and with retries you can account for temporary failures, while avoiding a "stampeding herd" during third party outages.',
              'With the onComplete callback, you can define how to proceed after each step, whether that enqueues another job to the workpool, updates the database, etc. It will always be called, whether the work was successful, failed, or was canceled. See below for more info.',
            ],
          },
        ],
        paragraphs: [
          'Example:',
        ],
        codeBlocks: [
          {
            code: `const pool = new Workpool(components.emailWorkpool, {
  retryActionsByDefault: true,
  // Specifies config for actions with retry: true, or if retried by default.
  defaultRetryBehavior: { maxAttempts: 3, initialBackoffMs: 1000, base: 2 },
});

const sendEmailReliablyWithRetries = mutation({
  args: {
    emailType: v.string(),
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    // ... do other things in the transaction
    await pool.enqueueAction(ctx, internal.email.send, args, {
      onComplete: internal.email.emailSent,
      context: { emailType: args.emailType, userId: args.userId },
      retry: false, // don't retry this action, as we can't guarantee idempotency.
    });
  },
});

export const emailSent = internalMutation({
  args: vOnCompleteValidator(
    v.object({ emailType: v.string(), userId: v.id("users") }),
  ),
  handler: async (ctx, { workId, context, result }) => {
    if (result.kind === "canceled") return;
    const emailLogId = await ctx.db.insert("userEmailLog", {
      userId: context.userId,
      emailType: context.emailType,
      result: result.kind === "success" ? result.returnValue : null,
      error: result.kind === "failed" ? result.error : null,
    });
    if (result.kind === "failed") {
      await pool.enqueueAction(
        ctx,
        internal.email.checkStatus,
        { userId },
        {
          retry: { maxAttempts: 10, initialBackoffMs: 250, base: 2 }, // custom
          onComplete: internal.email.handleEmailStatus,
          context: { emailLogId },
        },
      );
    }
  },
});`,
          },
          {
            note: 'Note: the onComplete handler runs in a different transaction than the job enqueued. If you want to run it in the same transaction, you can do that work at the end of the enqueued function, before returning. This is generally faster and more typesafe when handling the "success" case. You can also use this equivalent helper to define an onComplete mutation. Note the DataModel type parameter, if you want ctx.db to be type safe.',
            code: `export const emailSent = pool.defineOnComplete<DataModel>({
  context: v.object({ emailType: v.string(), userId: v.id("users") }),
  handler: async (ctx, { workId, context, result }) => {
    // ...
  },
});`,
          },
        ],
      },
      {
        heading: 'Idempotency',
        paragraphs: [
          'Idempotent actions are actions that can be run multiple times safely. This typically means they don\'t cause any side effects that would be a problem if executed twice or more.',
          'As an example of an unsafe, non-idempotent action, consider an action that charges a user\'s credit card without providing a unique transaction id to the payment processor. The first time the action is run, imagine that the API call succeeds to the payment provider, but then the action throws an exception before the transaction is marked finished in our Convex database. If the action is run twice, the user may be double charged for the transaction!',
          'If we alter this action to provide a consistent transaction id to the payment provider, they can simply NOOP the second payment attempt. The this makes the action idempotent, and it can safely be retried.',
          'If you\'re creating complex workflows with many steps involving 3rd party APIs:',
        ],
        subsections: [
          {
            paragraphs: [
              'You should ensure that each step is an idempotent Convex action.',
              'You should use this component to manage these actions so it all just works!',
            ],
          },
        ],
      },
      {
        heading: 'Reducing database write conflicts (aka OCC errors)',
        paragraphs: [
          'With limited parallelism, you can reduce write conflicts from mutations that read and write the same data.',
          'Consider this action that calls a mutation to increment a singleton counter. By calling the mutation on a workpool with maxParallelism: 1, it will never throw an error due to conflicts with parallel mutations.',
        ],
        code: `const counterPool = new Workpool(components.counterWorkpool, {
  maxParallelism: 1,
});

export const doSomethingAndCount = action({
  handler: async (ctx) => {
    const doSomething = await fetch("https://example.com");
    await counterPool.enqueueMutation(ctx, internal.counter.increment, {});
  },
});

// This mutation is prone to conflicting with itself, because it always reads
// and writes the same data. By running it in a workpool with low parallelism,
// it will run serially.
export const increment = internalMutation({
  handler: async (ctx) => {
    const countDoc = await ctx.db.query("counter").unique();
    await ctx.db.patch(countDoc!._id, { count: countDoc!.count + 1 });
  },
});`,
        subsections: [
          {
            paragraphs: [
              'Effectively, Workpool runs async functions similar to `ctx.scheduler.runAfter(0, ...)`, but it limits the number of functions that can run in parallel.',
            ],
          },
        ],
      },
      {
        heading: 'Reactive status of asynchronous work',
        paragraphs: [
          'The workpool stores the status of each function in the database, and thanks to Convex\'s reactive queries, you can read it in a query to power a reactive UI.',
          'By default, it will keep the status for 1 day but you can change this with the `statusTtl` option to `Workpool`.',
          'To keep the status forever, set `statusTtl: Number.POSITIVE_INFINITY`.',
          'You can read the status of a function by calling `pool.status(id)`.',
        ],
        code: `import { vWorkIdValidator } from "@convex-dev/workpool";
import { query } from "./_generated/server";

export const getStatus = query({
  args: { id: vWorkIdValidator },
  handler: async (ctx, args) => {
    const status = await pool.status(args.id);
    return status;
  },
});`,
        subsections: [
          {
            subheading: 'The status will be one of:',
            paragraphs: [
              '`{ kind: "pending"; previousAttempts: number }`: The function has not started yet.',
              '`{ kind: "running"; previousAttempts: number }`: The function is currently running.',
              '`{ kind: "finished" }`: The function has succeeded, failed, or been canceled.',
            ],
          },
        ],
        codeBlocks: [
          {
            note: 'To get the result of your function, you can either write to the database from within your function, call or schedule another function from there, or use the `onComplete` handler to respond to the job result.',
          },
        ],
      },
      {
        heading: 'Get started',
        subsections: [
          {
            subheading: 'Pre-requisite: Convex',
            paragraphs: [
              'You\'ll need an existing Convex project to use the component. Convex is a hosted backend platform, including a database, serverless functions, and a ton more you can learn about here.',
              'Run `npm create convex` or follow any of the quickstarts to set one up.',
            ],
          },
          {
            subheading: 'Install the component',
            paragraphs: [
              'See example/ for a working demo.',
              'Install the Workpool component:',
            ],
          },
        ],
        codeBlocks: [
          {
            code: 'npm install @convex-dev/workpool',
          },
          {
            note: 'Create a convex.config.ts file in your app\'s convex/ folder and install the component by calling use:',
            code: `// convex/convex.config.ts
import { defineApp } from "convex/server";
import workpool from "@convex-dev/workpool/convex.config.js";

const app = defineApp();
app.use(workpool, { name: "emailWorkpool" });
app.use(workpool, { name: "scrapeWorkpool" });

export default app;`,
          },
          {
            note: 'See example usage in example.ts.',
          },
        ],
      },
      {
        heading: 'Configuring the Workpool',
        paragraphs: [
          'Check out the docstrings, but notable options include:',
          '• `maxParallelism`: How many actions/mutations can run at once within this pool. Avoid exceeding 100 on Pro, 20 on the free plan, across all workpools and workflows.',
          '• `retryActionsByDefault`: Whether to retry actions that fail by default.',
          '• `defaultRetryBehavior`: The default retry behavior for enqueued actions.',
          'You can override the retry behavior per-call with the `retry` option.',
        ],
      },
      {
        heading: 'Options for enqueueing work',
        paragraphs: [
          'See the docstrings for more details, but notable options include:',
          '• `retry`: Whether to retry the action if it fails. Overrides defaults. If it\'s set to `true`, it will use the `defaultRetryBehavior`. If it\'s set to a custom config, it will use that (and do retries).',
          '• `onComplete`: A mutation to run after the function finishes.',
          '• `context`: Any data you want to pass to the `onComplete` mutation.',
          '• `runAt` and `runAfter`: Similar to `ctx.scheduler.run*`, allows you to schedule the work to run later. By default it\'s immediate.',
        ],
      },
      {
        heading: 'Retry behavior',
        paragraphs: [
          'The retry options work like this:',
          '• The first request runs as it\'s scheduled.',
          '• If it fails, it will wait around `initialBackoffMs` and then try again.',
          '• Each subsequent retry waits `initialBackoffMs * base^<retryNumber - 1>`.',
          '• The standard base is 2.',
          '• The actual wait time uses "jitter" to avoid all retries happening at once if they all fail at the same time.',
          'You can override the retry behavior per-call with the `retry` option.',
        ],
      },
      {
        heading: 'Optimizations with and without Workpool',
        paragraphs: [
          'The benefit of Workpool is that it won\'t fall over if there are many jobs scheduled at once, and it allows you to throttle low-priority jobs.',
          'However, Workpool has some overhead and can slow down your workload compared to using `ctx.scheduler` directly.',
          'Since each Workpool has some overhead -- each runs several functions to coordinate its work -- don\'t create too many of them.',
          'If you\'re running into issues with too many concurrent functions, there are alternatives to Workpool:',
          '• Try combining multiple mutations into a single mutation, with batching or debouncing. See the next section for enqueueing multiple actions at once.',
          '• Call plain TypeScript functions if possible.',
          '• In particular, an action calling `ctx.runAction` has more overhead than just calling the action\'s handler directly.',
          'See best practices for more.',
        ],
      },
      {
        heading: 'Batching',
        paragraphs: [
          'If you\'re enqueuing a lot of work, you can use `enqueueActionBatch` to enqueue a batch of actions at once, or the equivalents for queries or mutations.',
          'This helps in two ways:',
          '• It reduces the number of calls to the component, which reduces overhead as each component call runs in a fresh container (for strong isolation).',
          '• When called from an action, it reduces the number of mutations that might conflict with each other, especially if they were being called in parallel.',
        ],
        code: `await pool.enqueueActionBatch(ctx, internal.weather.scrape, [
  { city: "New York" },
  { city: "Los Angeles" },
  { city: "Chicago" },
]);`,
      },
      {
        heading: 'Canceling work',
        paragraphs: [
          'You can cancel work by calling `pool.cancel(id)` or all of them with `pool.cancelAll()`.',
        ],
        code: `export const cancelWork = mutation({
  args: { id: vWorkIdValidator },
  handler: async (ctx, args) => {
    // You can cancel the work, if it hasn't finished yet.
    await pool.cancel(ctx, args.id);
  },
});`,
        codeBlocks: [
          {
            note: 'This will avoid starting or retrying, but will not stop in-progress work.',
          },
        ],
      },
      {
        heading: 'Monitoring the workpool',
        paragraphs: [
          'If you want to know the status of your workpool, here are some queries to use for Axiom. Just replace your-dataset with your dataset\'s name (which is also what you enter in the log streaming configuration in the Convex dashboard).',
          'Note: these are optimized for monitors. For dashboards, you might want to change `bin(_time, X)` to `bin_auto(_time)`.',
        ],
        subsections: [
          {
            subheading: 'Is it backlogged',
            paragraphs: [
              'Reports the current backlog length, where "backlog" is tasks that are past due, not including tasks that have been scheduled for the future. This reports the max for 1 minute intervals (which is roughly how often the report is generated).',
            ],
            code: `['your-dataset']
| extend parsed_message = iff(isnotnull(parse_json(trim("'", tostring(["data.message"])))), 
  parse_json(trim("'", tostring(["data.message"]))), 
  parse_json('{}') )
| where parsed_message["component"] == "workpool" and parsed_message["event"] == "report"
| summarize max_backlog = max(toint(parsed_message["backlog"])) 
  by bin(_time, 1m), workpool = tostring(["data.function.component_path"])`,
          },
          {
            subheading: 'Are functions failing (after retries)',
            paragraphs: [
              'Reports the overall average failure rate per registered workpool in 5 minute intervals.',
            ],
            code: `['your-dataset']
| extend parsed_message = iff(isnotnull(parse_json(trim("'", tostring(["data.message"])))), 
  parse_json(trim("'", tostring(["data.message"]))), 
  parse_json('{}') )
| where parsed_message["component"] == "workpool" and parsed_message["event"] == "report"
| extend permanentFailureRate = parsed_message["permanentFailureRate"]
| summarize avg(todouble(permanentFailureRate)) 
  by bin(_time, 5m), workpool = tostring(["data.function.component_path"])`,
          },
          {
            subheading: 'Are functions retrying a lot',
            paragraphs: [
              'Reports the ratio (0 to 1) of failures per function, in 5 minute intervals. Note: to get this data, set the workpool logLevel to "INFO" (or "DEBUG").',
            ],
            code: `['your-dataset']
| extend parsed_message = iff(     isnotnull(parse_json(trim("'", tostring(["data.message"])))), 
  parse_json(trim("'", tostring(["data.message"]))), 
  parse_json('{}') )
| where parsed_message["component"] == "workpool" and (parsed_message["event"] == "completed") and parsed_message["status"] != "canceled"
| summarize failure_ratio = avg(iff(parsed_message["status"] != "success", 1, 0)) 
  by bin(_time, 5m), function = tostring(parsed_message["fnName"])`,
          },
          {
            subheading: 'Is there a big delay between being enqueued and starting',
            paragraphs: [
              'Reports the average time between enqueueing work and it actually starting. Note: to get this data, set the workpool logLevel to "INFO" (or "DEBUG").',
            ],
            code: `['your-dataset']
| extend parsed_message = iff(isnotnull(parse_json(trim("'", tostring(["data.message"])))), 
  parse_json(trim("'", tostring(["data.message"]))), 
  parse_json('{}') )
| where parsed_message["component"] == "workpool" and parsed_message["event"] == "started"
| summarize start_lag_seconds = avg(todouble(parsed_message["startLag"])/1000) 
  by bin(_time, 1m), function = tostring(parsed_message["fnName"])`,
          },
        ],
        codeBlocks: [
          {
            note: 'While similar to the backlog size, this is a more concrete value, since the events in the backlog may take variable amounts of time. This is a more user-visible metric, though it is a "lagging" indicator - this will be high when the backlog was large enough to delay the processing of an entry. So alerting on the backlog size will give you a faster indicator, while this is a metric of the severity of the incident.',
          },
        ],
      },
    ],
  },
  {
    id: 'workflow',
    title: 'Workflow',
    description: 'Simplify programming long running code flows. Workflows execute durably with configurable retries and delays.',
    icon: <Workflow size={48} />,
    ...getGradient(2, 'Durable Functions'),
    weeklyDownloads: 7647,
    developer: 'get-convex',
    category: 'Durable Functions' as ComponentCategory,
    npmPackage: '@convex-dev/workflow',
    repoUrl: 'https://github.com/get-convex/workflow',
    packageUrl: 'https://www.npmjs.com/package/@convex-dev/workflow',
    docsUrl: 'https://github.com/get-convex/workflow#readme',
    bugReportUrl: 'https://github.com/get-convex/workflow/issues',
    exampleCommands: [
      'git clone https://github.com/get-convex/workflow.git',
      'cd workflow',
      'npm install',
      'npm run dev',
    ],
    longDescription: 'Have you ever wanted to run a series of functions reliably and durably, where each can have its own retry behavior, the overall workflow will survive server restarts, and you can have long-running workflows spanning months that can be canceled? Do you want to observe the status of a workflow reactively, as well as the results written from each step? And do you want to do this with code, instead of a static configuration? Welcome to the world of Convex workflows.',
    features: [
      'Run workflows asynchronously, and observe their status reactively via subscriptions, from one or many users simultaneously, even on page refreshes.',
      'Workflows can run for months, and survive server restarts. You can specify delays or custom times to run each step.',
      'Run steps in parallel, or in sequence.',
      'Output from previous steps is available to pass to subsequent steps.',
      'Run queries, mutations, and actions.',
      'Specify retry behavior on a per-step basis, along with a default policy.',
      'Specify how many workflow steps can run in parallel to manage load.',
      'Cancel long-running workflows.',
      'Clean up workflows after they\'re done.',
    ],
    documentationSections: [
      {
        heading: 'Example',
        paragraphs: [
          'This component adds durably executed workflows to Convex. Combine Convex queries, mutations, and actions into long-lived workflows, and the system will always fully execute a workflow to completion.',
        ],
        code: `import { WorkflowManager } from "@convex-dev/workflow";
import { components } from "./_generated/api";

export const workflow = new WorkflowManager(components.workflow);

export const userOnboarding = workflow.define({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args): Promise<void> => {
    const status = await ctx.runMutation(
      internal.emails.sendVerificationEmail,
      { storageId: args.storageId },
    );

    if (status === "needsVerification") {
      // Waits until verification is completed asynchronously.
      await ctx.awaitEvent({ name: "verificationEmail" });
    }
    const result = await ctx.runAction(
      internal.llm.generateCustomContent,
      { userId: args.userId },
      // Retry this on transient errors with the default retry policy.
      { retry: true },
    );
    if (result.needsHumanInput) {
      // Run a whole workflow as a single step.
      await ctx.runWorkflow(internal.llm.refineContentWorkflow, {
        userId: args.userId,
      });
    }

    await ctx.runMutation(
      internal.emails.sendFollowUpEmailMaybe,
      { userId: args.userId },
      // Runs one day after the previous step.
      { runAfter: 24 * 60 * 60 * 1000 },
    );
  },
});`,
      },
      {
        heading: 'Installation',
        subsections: [
          {
            subheading: 'Step 1: Install the package',
            paragraphs: [
              'First, add `@convex-dev/workflow` to your Convex project:',
            ],
            code: 'npm install @convex-dev/workflow',
          },
          {
            subheading: 'Step 2: Install the component',
            paragraphs: [
              'Then, install the component within your `convex/convex.config.ts` file:',
            ],
            code: `// convex/convex.config.ts
import workflow from "@convex-dev/workflow/convex.config.js";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(workflow);
export default app;`,
          },
          {
            subheading: 'Step 3: Create a workflow manager',
            paragraphs: [
              'Finally, create a workflow manager within your `convex/` folder, and point it to the installed component:',
            ],
            code: `// convex/index.ts
import { WorkflowManager } from "@convex-dev/workflow";
import { components } from "./_generated/api";

export const workflow = new WorkflowManager(components.workflow);`,
          },
        ],
      },
      {
        heading: 'Usage',
        paragraphs: [
          'The first step is to define a workflow using `workflow.define()`. This function is designed to feel like a Convex action but with a few restrictions:',
          '1. The workflow runs in the background, so it can\'t return a value.',
          '2. The workflow must be _deterministic_, so it should implement most of its logic by calling out to other Convex functions. We restrict access to some non-deterministic functions like `fetch` and `crypto`. Others we patch, such as `console` for logging, `Math.random()` (seeded PRNG) and `Date` for time.',
          'Note: To help avoid type cycles, always annotate the return type of the `handler` with the return type of the workflow.',
        ],
        code: `export const exampleWorkflow = workflow.define({
  args: { name: v.string() },
  returns: v.string(),
  handler: async (step, args): Promise<string> => {
    //                         ^ Specify the return type of the handler
    const queryResult = await step.runQuery(
      internal.example.exampleQuery,
      args,
    );
    const actionResult = await step.runAction(
      internal.example.exampleAction,
      { queryResult }, // pass in results from previous steps!
    );
    return actionResult;
  },
});

export const exampleQuery = internalQuery({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return \`The query says... Hi \${args.name}!\`;
  },
});

export const exampleAction = internalAction({
  args: { queryResult: v.string() },
  handler: async (ctx, args) => {
    return args.queryResult + " The action says... Hi back!";
  },
});`,
      },
      {
        heading: 'Starting a workflow',
        paragraphs: [
          'Once you\'ve defined a workflow, you can start it from a mutation or action using `workflow.start()`.',
        ],
        code: `export const kickoffWorkflow = mutation({
  handler: async (ctx) => {
    const workflowId = await workflow.start(
      ctx,
      internal.example.exampleWorkflow,
      { name: "James" },
    );
  },
});`,
      },
      {
        heading: 'Handling the workflow\'s result with onComplete',
        paragraphs: [
          'You can handle the workflow\'s result with `onComplete`. This is useful for cleaning up any resources used by the workflow.',
          'Note: when you return things from a workflow, you\'ll need to specify the return type of your `handler` to break type cycles due to using `internal.*` functions in the body, which then inform the type of the workflow, which is included in the `internal.*` type.',
          'You can also specify a `returns` validator to do runtime validation on the return value. If it fails, your `onComplete` handler will be called with an error instead of success. You can also do validation in the `onComplete` handler to have more control over handling that situation.',
        ],
        code: `import { vWorkflowId } from "@convex-dev/workflow";
import { vResultValidator } from "@convex-dev/workpool";

export const foo = mutation({
  handler: async (ctx) => {
    const name = "James";
    const workflowId = await workflow.start(
      ctx,
      internal.example.exampleWorkflow,
      { name },
      {
        onComplete: internal.example.handleOnComplete,
        context: name, // can be anything
      },
    );
  },
});

export const handleOnComplete = mutation({
  args: {
    workflowId: vWorkflowId,
    result: vResultValidator,
    context: v.any(), // used to pass through data from the start site.
  },
  handler: async (ctx, args) => {
    const name = (args.context as { name: string }).name;
    if (args.result.kind === "success") {
      const text = args.result.returnValue;
      console.log(\`\${name} result: \${text}\`);
    } else if (args.result.kind === "error") {
      console.error("Workflow failed", args.result.error);
    } else if (args.result.kind === "canceled") {
      console.log("Workflow canceled", args.context);
    }
  },
});`,
      },
      {
        heading: 'Running steps in parallel',
        paragraphs: [
          'You can run steps in parallel by calling `step.runAction()` multiple times in a `Promise.all()` call.',
        ],
        code: `export const exampleWorkflow = workflow.define({
  args: { name: v.string() },
  handler: async (step, args): Promise<void> => {
    const [result1, result2] = await Promise.all([
      step.runAction(internal.example.myAction, args),
      step.runAction(internal.example.myAction, args),
    ]);
  },
});`,
        codeBlocks: [
          {
            note: 'Note: The workflow will not proceed until all steps fired off at once have completed.',
          },
        ],
      },
      {
        heading: 'Specifying retry behavior',
        paragraphs: [
          'Sometimes actions fail due to transient errors, whether it was an unreliable third-party API or a server restart. You can have the workflow automatically retry actions using best practices (exponential backoff & jitter). By default there are no retries, and the workflow will fail.',
          'You can specify default retry behavior for all workflows on the WorkflowManager, or override it on a per-workflow basis.',
          'You can also specify a custom retry behavior per-step, to opt-out of retries for actions that may want at-most-once semantics.',
          'Workpool options:',
          'If you specify any of these, it will override the `DEFAULT_RETRY_BEHAVIOR`.',
          '• `defaultRetryBehavior`: The default retry behavior for all workflows.',
          '  • `maxAttempts`: The maximum number of attempts to retry an action.',
          '  • `initialBackoffMs`: The initial backoff time in milliseconds.',
          '  • `base`: The base multiplier for the backoff. Default is 2.',
          '• `retryActionsByDefault`: Whether to retry actions, by default is false.',
          '  • If you specify a retry behavior at the step level, it will always retry.',
          'At the step level, you can also specify `true` or `false` to disable or use the default policy.',
        ],
        code: `const workflow = new WorkflowManager(components.workflow, {
  defaultRetryBehavior: {
    maxAttempts: 3,
    initialBackoffMs: 100,
    base: 2,
  },
  // If specified, this sets the defaults, overridden per-workflow or per-step.
  workpoolOptions: { ... }
});

export const exampleWorkflow = workflow.define({
  args: { name: v.string() },
  handler: async (step, args): Promise<void> => {
    // Uses default retry behavior & retryActionsByDefault
    await step.runAction(internal.example.myAction, args);
    // Retries will be attempted with the default behavior
    await step.runAction(internal.example.myAction, args, { retry: true });
    // No retries will be attempted
    await step.runAction(internal.example.myAction, args, { retry: false });
    // Custom retry behavior will be used
    await step.runAction(internal.example.myAction, args, {
      retry: { maxAttempts: 2, initialBackoffMs: 100, base: 2 },
    });
  },
  // If specified, this will override the workflow manager's default
  workpoolOptions: { ... },
});`,
      },
      {
        heading: 'Specifying step parallelism',
        paragraphs: [
          'You can specify how many steps can run in parallel by setting the `maxParallelism` workpool option. It has a reasonable default. On the free tier, you should not exceed 20, otherwise your other scheduled functions may become delayed while competing for available functions with your workflow steps. On a Pro account, you should not exceed 100 across all your workflows and workpools. If you want to do a lot of work in parallel, you should employ batching, where each workflow operates on a batch of work, e.g. scraping a list of links instead of one link per workflow.',
        ],
        code: `const workflow = new WorkflowManager(components.workflow, {
  workpoolOptions: {
    // You must only set this to one value per components.xyz!
    // You can set different values if you "use" multiple different components
    // in convex.config.ts.
    maxParallelism: 10,
  },
});`,
      },
      {
        heading: 'Checking a workflow\'s status',
        paragraphs: [
          'The `workflow.start()` method returns a `WorkflowId`, which can then be used for querying a workflow\'s status.',
        ],
        code: `export const kickoffWorkflow = action({
  handler: async (ctx) => {
    const workflowId = await workflow.start(
      ctx,
      internal.example.exampleWorkflow,
      { name: "James" },
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const status = await workflow.status(ctx, workflowId);
    console.log("Workflow status after 1s", status);
  },
});`,
      },
      {
        heading: 'Canceling a workflow',
        paragraphs: [
          'You can cancel a workflow with `workflow.cancel()`, halting the workflow\'s execution immediately. In-progress calls to `step.runAction()`, however, will finish executing.',
        ],
        code: `export const kickoffWorkflow = action({
  handler: async (ctx) => {
    const workflowId = await workflow.start(
      ctx,
      internal.example.exampleWorkflow,
      { name: "James" },
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Cancel the workflow after 1 second.
    await workflow.cancel(ctx, workflowId);
  },
});`,
      },
      {
        heading: 'Cleaning up a workflow',
        paragraphs: [
          'After a workflow has completed, you can clean up its storage with `workflow.cleanup()`. Completed workflows are not automatically cleaned up by the system.',
        ],
        code: `export const kickoffWorkflow = action({
  handler: async (ctx) => {
    const workflowId = await workflow.start(
      ctx,
      internal.example.exampleWorkflow,
      { name: "James" },
    );
    try {
      while (true) {
        const status = await workflow.status(ctx, workflowId);
        if (status.type === "inProgress") {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
        console.log("Workflow completed with status:", status);
        break;
      }
    } finally {
      await workflow.cleanup(ctx, workflowId);
    }
  },
});`,
      },
      {
        heading: 'Specifying a custom name for a step',
        paragraphs: [
          'You can specify a custom name for a step by passing a `name` option to the step.',
          'This allows the events emitted to your logs to be more descriptive. By default it uses the `file/folder:function` name.',
        ],
        code: `export const exampleWorkflow = workflow.define({
  args: { name: v.string() },
  handler: async (step, args): Promise<void> => {
    await step.runAction(internal.example.myAction, args, { name: "FOO" });
  },
});`,
      },
      {
        heading: 'Tips and troubleshooting',
        subsections: [
          {
            subheading: 'Circular dependencies',
            paragraphs: [
              'Having the return value of workflows depend on other Convex functions can lead to circular dependencies due to the `internal.foo.bar` way of specifying functions. The way to fix this is to explicitly type the return value of the workflow. When in doubt, add return types to more `handler` functions, like this:',
            ],
            code: `export const supportAgentWorkflow = workflow.define({
  args: { prompt: v.string(), userId: v.string(), threadId: v.string() },
  handler: async (step, { prompt, userId, threadId }): Promise<string> => {
    // ...
  },
});

// And regular functions too:
export const myFunction = action({
  args: { prompt: v.string() },
  handler: async (ctx, { prompt }): Promise<string> => {
    // ...
  },
});`,
          },
          {
            subheading: 'More concise workflows',
            paragraphs: [
              'To avoid the noise of `internal.foo.*` syntax, you can use a variable. For instance, if you define all your steps in `convex/steps.ts`, you can do this:',
            ],
            code: `const s = internal.steps;

export const myWorkflow = workflow.define({
  args: { prompt: v.string() },
  handler: async (step, args): Promise<string> => {
    const result = await step.runAction(s.myAction, args);
    return result;
  },
});`,
          },
        ],
      },
      {
        heading: 'Limitations',
        paragraphs: [
          'Here are a few limitations to keep in mind:',
          '• Steps can only take in and return a total of _1 MiB_ of data within a single workflow execution. If you run into journal size limits, you can work around this by storing results in the DB from your step functions and passing IDs around within the workflow.',
          '• The workflow body is internally a mutation, with each step\'s return value read from the database on each subsequent step. As a result, the limits for a mutation apply and limit the number and size of steps you can perform to 16MiB (including the workflow state overhead). See more about mutation limits [here](https://docs.convex.dev/production/state/limits#transactions).',
          '• We currently do not collect backtraces from within function calls from workflows.',
          '• If you need to use side effects like `fetch` or use cryptographic randomness, you\'ll need to do that in a step, not in the workflow definition.',
          '• `Math.random` is deterministic and not suitable for cryptographic use. It is, however, useful for sharding, jitter, and other pseudo-random applications.',
          '• If the implementation of the workflow meaningfully changes (steps added, removed, or reordered) then it will fail with a determinism violation. The implementation should stay stable for the lifetime of active workflows. See this issue for ideas on how to make this better.',
        ],
      },
    ],
  },
  {
    id: 'action-retrier',
    title: 'Action Retrier',
    description: 'Add reliability to an unreliable external service. Retry idempotent calls a set number of times.',
    icon: <RefreshCw size={48} />,
    ...getGradient(3, 'Durable Functions'),
    weeklyDownloads: 6487,
    developer: 'get-convex',
    category: 'Durable Functions' as ComponentCategory,
    npmPackage: '@convex-dev/action-retrier',
    repoUrl: 'https://github.com/get-convex/action-retrier',
    packageUrl: 'https://www.npmjs.com/package/@convex-dev/action-retrier',
    docsUrl: 'https://github.com/get-convex/action-retrier#readme',
    bugReportUrl: 'https://github.com/get-convex/action-retrier/issues',
    exampleCommands: [
      'git clone https://github.com/get-convex/action-retrier.git',
      'cd action-retrier',
      'npm install',
      'npm run dev',
    ],
    longDescription: 'Actions can sometimes fail due to network errors, server restarts, or issues with a 3rd party API, and it\'s often useful to retry them. The Action Retrier component makes this really easy. The retrier component will run the action and retry it on failure, sleeping with exponential backoff, until the action succeeds or the maximum number of retries is reached.',
    features: [
      'Automatically retry actions up to four times by default before giving up.',
      'Exponential backoff with configurable initial delay and base multiplier.',
      'Query run status reactively to track action execution.',
      'Cancel runs that are in progress or queued.',
      'Optional onComplete callback mutation guaranteed to run exactly once.',
      'Automatic cleanup of completed runs after 7 days, or manual cleanup available.',
      'Configurable retry parameters per-run or globally via constructor.',
      'Idempotent action support for safe retries.',
    ],
    documentationSections: [
      {
        heading: 'Example',
        paragraphs: [
          'The Action Retrier component makes retrying actions really easy.',
        ],
        code: `import { ActionRetrier } from "@convex-dev/action-retrier";
import { components } from "./convex/_generated/server";

const retrier = new ActionRetrier(components.actionRetrier);

// \`retrier.run\` will automatically retry your action up to four times before giving up.
await retrier.run(ctx, internal.module.myAction, { arg: 123 });`,
      },
      {
        heading: 'Pre-requisite: Convex',
        paragraphs: [
          'You\'ll need an existing Convex project to use the component. Convex is a hosted backend platform, including a database, serverless functions, and a ton more you can learn about [here](https://docs.convex.dev/home).',
          'Run `npm create convex` or follow any of the quickstarts to set one up.',
        ],
      },
      {
        heading: 'Installation',
        subsections: [
          {
            subheading: 'Step 1: Install the package',
            paragraphs: [
              'First, add `@convex-dev/action-retrier` as an NPM dependency:',
            ],
            code: 'npm install @convex-dev/action-retrier',
          },
          {
            subheading: 'Step 2: Install the component',
            paragraphs: [
              'Then, install the component into your Convex project within the `convex/convex.config.ts` configuration file:',
            ],
            code: `// convex/convex.config.ts
import { defineApp } from "convex/server";
import actionRetrier from "@convex-dev/action-retrier/convex.config.js";

const app = defineApp();
app.use(actionRetrier);
export default app;`,
          },
          {
            subheading: 'Step 3: Create an ActionRetrier',
            paragraphs: [
              'Finally, create a new `ActionRetrier` within your Convex project, and point it to the installed component:',
            ],
            code: `// convex/index.ts
import { ActionRetrier } from "@convex-dev/action-retrier";
import { components } from "./_generated/api";

export const retrier = new ActionRetrier(components.actionRetrier);`,
          },
          {
            subheading: 'Configuration options',
            paragraphs: [
              'You can optionally configure the retrier\'s backoff behavior in the `ActionRetrier` constructor.',
              'Configuration options:',
              '• `initialBackoffMs`: The initial delay after a failure before retrying (default: 250).',
              '• `base`: The base for the exponential backoff (default: 2).',
              '• `maxFailures`: The maximum number of times to retry the action (default: 4).',
            ],
            code: `const retrier = new ActionRetrier(components.actionRetrier, {
  initialBackoffMs: 10000,
  base: 10,
  maxFailures: 4,
});`,
          },
        ],
      },
      {
        heading: 'API',
        subsections: [
          {
            subheading: 'Starting a run',
            paragraphs: [
              'After installing the component, use the `run` method from either a mutation or action to kick off an action.',
              'The return value of `retrier.run` is not the result of the action, but rather an ID that you can use to query its status or cancel it. The action\'s return value is saved along with the status, when it succeeds.',
            ],
            code: `export const kickoffExampleAction = mutation({
  handler: async (ctx) => {
    const runId = await retrier.run(ctx, internal.index.exampleAction, {
      foo: "bar",
    });
    // ... optionally persist or pass along the runId
  },
});

export const exampleAction = internalAction({
  args: { foo: v.string() },
  handler: async (ctx, args) => {
    return operationThatMightFail(args);
  },
});`,
          },
        ],
        codeBlocks: [
          {
            note: 'You can optionally specify overrides to the backoff parameters in an options argument.',
            code: `export const kickoffExampleAction = action(async (ctx) => {
  const runId = await retrier.run(
    ctx,
    internal.index.exampleAction,
    { failureRate: 0.8 },
    {
      initialBackoffMs: 125,
      base: 2.71,
      maxFailures: 3,
    },
  );
});`,
          },
          {
            note: 'You can specify an `onComplete` mutation callback in the options argument as well. This mutation is guaranteed to eventually run exactly once.',
            code: `// convex/index.ts

import { runResultValidator, runIdValidator } from "@convex-dev/action-retrier";

export const kickoffExampleAction = action(async (ctx) => {
  const runId = await retrier.run(
    ctx,
    internal.index.exampleAction,
    { failureRate: 0.8 },
    {
      onComplete: internal.index.exampleCallback,
    },
  );
});

export const exampleCallback = internalMutation({
  args: { id: runIdValidator, result: runResultValidator },
  handler: async (ctx, args) => {
    if (args.result.type === "success") {
      console.log(
        "Action succeeded with return value:",
        args.result.returnValue,
      );
    } else if (args.result.type === "failed") {
      console.log("Action failed with error:", args.result.error);
    } else if (args.result.type === "canceled") {
      console.log("Action was canceled.");
    }
  },
});`,
          },
        ],
      },
      {
        heading: 'Run status',
        paragraphs: [
          'The `run` method returns a `RunId`, which can then be used for querying a run\'s status.',
        ],
        code: `export const kickoffExampleAction = action(async (ctx) => {
  const runId = await retrier.run(ctx, internal.index.exampleAction, {
    failureRate: 0.8,
  });
  while (true) {
    const status = await retrier.status(ctx, runId);
    if (status.type === "inProgress") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      continue;
    } else {
      console.log("Run completed with result:", status.result);
      break;
    }
  }
});`,
      },
      {
        heading: 'Canceling a run',
        paragraphs: [
          'You can cancel a run using the `cancel` method.',
          'Runs that are currently executing will be canceled best effort, so they may still continue to execute. A successful call to `cancel`, however, does guarantee that subsequent `status` calls will indicate cancelation.',
        ],
        code: `export const kickoffExampleAction = action(async (ctx) => {
  const runId = await retrier.run(ctx, internal.index.exampleAction, {
    failureRate: 0.8,
  });
  await new Promise((resolve) => setTimeout(resolve, 1000));
  await retrier.cancel(ctx, runId);
});`,
      },
      {
        heading: 'Cleaning up completed runs',
        paragraphs: [
          'Runs take up space in the database, since they store their return values. After a run completes, you can immediately clean up its storage by using `retrier.cleanup(ctx, runId)`. The system will automatically cleanup completed runs after 7 days.',
        ],
        code: `export const kickoffExampleAction = action(async (ctx) => {
  const runId = await retrier.run(ctx, internal.index.exampleAction, {
    failureRate: 0.8,
  });
  try {
    while (true) {
      const status = await retrier.status(ctx, runId);
      if (status.type === "inProgress") {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      } else {
        console.log("Run completed with result:", status.result);
        break;
      }
    }
  } finally {
    await retrier.cleanup(ctx, runId);
  }
});`,
      },
      {
        heading: 'Logging',
        paragraphs: [
          'You can set the `ACTION_RETRIER_LOG_LEVEL` to `DEBUG` to have the retrier log out more of its internal information, which you can then view on the Convex dashboard.',
        ],
        code: 'npx convex env set ACTION_RETRIER_LOG_LEVEL DEBUG',
        codeBlocks: [
          {
            note: 'The default log level is `INFO`, but you can also set it to `ERROR` for even fewer logs.',
          },
        ],
      },
    ],
  },
  {
    id: 'crons',
    title: 'Crons',
    description: 'Use cronspec to run functions on a repeated schedule.',
    icon: <Clock size={48} />,
    ...getGradient(4, 'Durable Functions'),
    weeklyDownloads: 1882,
    developer: 'get-convex',
    category: 'Durable Functions' as ComponentCategory,
    npmPackage: '@convex-dev/crons',
    repoUrl: 'https://github.com/get-convex/crons',
    packageUrl: 'https://www.npmjs.com/package/@convex-dev/crons',
    docsUrl: 'https://github.com/get-convex/crons#readme',
    docsLinks: [
      { label: 'Stack post on runtime crons', url: 'https://stack.convex.dev/cron-jobs' },
      { label: 'Convex tutorial', url: 'https://docs.convex.dev/tutorial' },
      { label: 'Convex docs', url: 'https://docs.convex.dev/home' },
    ],
    bugReportUrl: 'https://github.com/get-convex/crons/issues',
    exampleCommands: [
      'git clone https://github.com/get-convex/crons.git',
      'cd crons',
      'npm install',
      'npm run dev',
    ],
    longDescription: 'This Convex component provides functionality for registering and managing cron jobs at runtime. Convex comes with built-in support for cron jobs but they must be statically defined at deployment time. This library allows for dynamic registration of cron jobs at runtime. It supports intervals in milliseconds as well as cron schedules with the same format as the unix cron command.',
    features: [
      'Register cron jobs dynamically at runtime, not just at deployment time.',
      'Support for interval-based schedules (run every X milliseconds).',
      'Support for cron schedules using standard cronspec format (Unix cron syntax).',
      'Get cron jobs by name or ID.',
      'List all registered cron jobs.',
      'Delete cron jobs by name or ID.',
      'Transactional creation guarantees crons exist after mutation completes.',
      'Idempotent registration for statically-defined crons via init scripts.',
    ],
    documentationSections: [
      {
        heading: 'Example',
        paragraphs: [
          'This component allows you to register and manage cron jobs dynamically at runtime.',
        ],
        code: `// Register a cron to run once per day.
const daily = await crons.register(
  ctx,
  { kind: "cron", cronspec: "0 0 * * *" },
  internal.example.logStuff,
  { message: "daily cron" },
);

// Register a cron to run every hour.
const hourly = await crons.register(
  ctx,
  { kind: "interval", ms: 3600000 },
  internal.example.logStuff,
  { message: "hourly cron" },
);`,
      },
      {
        heading: 'Design',
        paragraphs: [
          'The design of this component is based on the [Cronvex demo app](https://stack.convex.dev/cron-jobs) that\'s described in this Stack post.',
        ],
      },
      {
        heading: 'Pre-requisite: Convex',
        paragraphs: [
          'You\'ll need an existing Convex project to use the component. Convex is a hosted backend platform, including a database, serverless functions, and a ton more you can learn about [here](https://docs.convex.dev/home).',
          'Run `npm create convex` or follow any of the quickstarts to set one up.',
        ],
      },
      {
        heading: 'Installation',
        subsections: [
          {
            subheading: 'Step 1: Install the package',
            paragraphs: [
              'Install the component package:',
            ],
            code: 'npm install @convex-dev/crons',
          },
          {
            subheading: 'Step 2: Install the component',
            paragraphs: [
              'Create a `convex.config.ts` file in your app\'s `convex/` folder and install the component by calling use:',
            ],
            code: `// convex/convex.config.ts
import { defineApp } from "convex/server";
import crons from "@convex-dev/crons/convex.config.js";

const app = defineApp();
app.use(crons);
export default app;`,
          },
          {
            subheading: 'Step 3: Create a Crons wrapper',
            paragraphs: [
              'A `Crons` wrapper can be instantiated within your Convex code as:',
            ],
            code: `import { components } from "./_generated/api";
import { Crons } from "@convex-dev/crons";

const crons = new Crons(components.crons);`,
          },
        ],
      },
      {
        heading: 'Usage',
        paragraphs: [
          'The `Crons` wrapper class provides the following methods:',
          '• `register(ctx, schedule, fn, args, name?)`: Registers a new cron job.',
          '• `get(ctx, { name | id })`: Gets a cron job by name or ID.',
          '• `list(ctx)`: Lists all cron jobs.',
          '• `delete(ctx, { name | id })`: Deletes a cron job by name or ID.',
        ],
        code: `import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Dummy function that we're going to schedule.
export const logStuff = internalMutation({
  args: {
    message: v.string(),
  },
  handler: async (_ctx, args) => {
    console.log(args.message);
  },
});

// Run a bunch of cron operations as a test. Note that this function runs as a
// transaction and cleans up after itself so you won't actually see these crons
// showing up in the database while it's in progress.
export const doSomeStuff = internalMutation({
  handler: async (ctx) => {
    // Register some crons.
    const namedCronId = await crons.register(
      ctx,
      { kind: "interval", ms: 3600000 },
      internal.example.logStuff,
      { message: "Hourly cron test" },
      "hourly-test",
    );
    console.log("Registered new cron job with ID:", namedCronId);

    const unnamedCronId = await crons.register(
      ctx,
      { kind: "cron", cronspec: "0 * * * *" },
      internal.example.logStuff,
      { message: "Minutely cron test" },
    );
    console.log("Registered new cron job with ID:", unnamedCronId);

    // Get the cron job by name.
    const cronByName = await crons.get(ctx, { name: "hourly-test" });
    console.log("Retrieved cron job by name:", cronByName);

    // Get the cron job by ID.
    const cronById = await crons.get(ctx, { id: unnamedCronId });
    console.log("Retrieved cron job by ID:", cronById);

    // List all cron jobs.
    const allCrons = await crons.list(ctx);
    console.log("All cron jobs:", allCrons);

    // Delete the cron jobs.
    await crons.delete(ctx, { name: "hourly-test" });
    console.log("Deleted cron job by name:", "hourly-test");

    await crons.delete(ctx, { id: unnamedCronId });
    console.log("Deleted cron job by ID:", unnamedCronId);

    // Verify deletion.
    const deletedCronByName = await crons.get(ctx, { name: "hourly-test" });
    console.log("Deleted cron job (should be null):", deletedCronByName);

    const deletedCronById = await crons.get(ctx, { id: unnamedCronId });
    console.log("Deleted cron job (should be null):", deletedCronById);
  },
});`,
      },
      {
        heading: 'Cron schedule format',
        paragraphs: [
          'Crons support intervals in milliseconds as well as cron schedules with the same format as the unix cron command:',
        ],
        code: ` *  *  *  *  *  *
 ┬  ┬  ┬  ┬  ┬  ┬
 │  │  │  │  │  │
 │  │  │  │  │  └── day of week (0 - 7, 1L - 7L) (0 or 7 is Sun)
 │  │  │  │  └───── month (1 - 12)
 │  │  │  └──────── day of month (1 - 31, L)
 │  │  └─────────── hour (0 - 23)
 │  └────────────── minute (0 - 59)
 └───────────────── second (0 - 59, optional)`,
      },
      {
        heading: 'Statically defined cron jobs',
        paragraphs: [
          'If you\'d like to statically define cronjobs like in the built-in `crons.ts` Convex feature you can do so via an init script that idempotently registers a cron with a given name. e.g., in an `init.ts` file that gets run on every deploy via `convex dev --run init`.',
        ],
        code: `// Register a daily cron job. This could be called from an init script to make
// sure it's always registered, like the built-in crons in Convex.
export const registerDailyCron = internalMutation({
  handler: async (ctx) => {
    if ((await crons.get(ctx, { name: "daily" })) === null) {
      await crons.register(
        ctx,
        { kind: "cron", cronspec: "0 0 * * *" },
        internal.example.logStuff,
        {
          message: "daily cron",
        },
        "daily",
      );
    }
  },
});`,
      },
      {
        heading: 'Transactional guarantees',
        paragraphs: [
          'Crons are created transactionally and will be guaranteed to exist after the mutation that creates them has run. It\'s thus possible to write workflows like the following that schedules a cron and then deletes itself as soon as it runs, without any additional error handling about the cron not existing.',
        ],
        code: `// This will schedule a cron job to run every 10 seconds but then delete itself
// the first time it runs.
export const selfDeletingCron = internalMutation({
  handler: async (ctx) => {
    const cronId = await crons.register(
      ctx,
      { kind: "interval", ms: 10000 },
      internal.example.deleteSelf,
      { name: "self-deleting-cron" },
      "self-deleting-cron",
    );
    console.log("Registered self-deleting cron job with ID:", cronId);
  },
});

// Worker function that deletes a cron job.
export const deleteSelf = internalMutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    console.log("Self-deleting cron job running. Name:", name);
    await crons.delete(ctx, { name });
    console.log("Self-deleting cron job has been deleted. Name:", name);
  },
});`,
      },
    ],
  },

  // Database
  {
    id: 'migrations',
    title: 'Migrations',
    description: 'Framework for long running data migrations of live data.',
    icon: <Database size={48} />,
    ...getGradient(0, 'Database'),
    weeklyDownloads: 20657,
    developer: 'get-convex',
    category: 'Database' as ComponentCategory,
    npmPackage: '@convex-dev/migrations',
    repoUrl: 'https://github.com/get-convex/migrations',
    packageUrl: 'https://www.npmjs.com/package/@convex-dev/migrations',
    docsUrl: 'https://github.com/get-convex/migrations#readme',
    docsLinks: [
      { label: 'Database triggers', url: 'https://stack.convex.dev/triggers' },
      { label: 'Custom functions', url: 'https://stack.convex.dev/custom-functions' },
      { label: 'Convex docs', url: 'https://docs.convex.dev/home' },
      { label: 'Convex tutorial', url: 'https://docs.convex.dev/tutorial' },
      { label: 'Stateful migrations', url: 'https://stack.convex.dev/migrating-data-with-mutations' },
      { label: 'Lightweight migrations', url: 'https://stack.convex.dev/lightweight-zero-downtime-migrations' },
      { label: 'Intro to migrations', url: 'https://stack.convex.dev/intro-to-migrations' },
    ],
    bugReportUrl: 'https://github.com/get-convex/migrations/issues',
    exampleCommands: [
      'git clone https://github.com/get-convex/migrations.git',
      'cd migrations',
      'npm install',
      'npm run dev',
    ],
    longDescription: 'Migrations allow you to define functions that run on all documents in a table (or a specified subset). They run in batches asynchronously (online migration). The component tracks the migrations state so it can avoid running twice, pick up where it left off (in the case of a bug or failure along the way), and expose the migration state in realtime via Convex queries.',
    features: [
      'Define migrations that run on all documents in a table or a specified subset.',
      'Run migrations in batches asynchronously for online migrations without downtime.',
      'Track migration state to avoid running twice and resume from failures.',
      'Expose migration state in realtime via Convex queries for monitoring.',
      'Support for custom ranges using indexes to migrate subsets of data.',
      'Shorthand syntax for simple patch operations.',
      'Run migrations one at a time or serially in a defined order.',
      'Test migrations with dry-run mode before applying changes.',
      'Stop, restart, and monitor migrations programmatically or from CLI.',
      'Custom batch sizes and parallelization options for performance tuning.',
    ],
    documentationSections: [
      {
        heading: 'Example',
        paragraphs: [
          'Define and run migrations, like this one setting a default value for users:',
        ],
        code: `export const setDefaultValue = migrations.define({
  table: "users",
  migrateOne: async (ctx, user) => {
    if (user.optionalField === undefined) {
      await ctx.db.patch(user._id, { optionalField: "default" });
    }
  },
});`,
        codeBlocks: [
          {
            note: 'You can then run it programmatically or from the CLI. See below.',
          },
        ],
      },
      {
        heading: 'Typical migration steps',
        paragraphs: [
          '1. Modify your schema to allow old and new values. Typically this is adding a new optional field or marking a field as optional so it can be deleted. As part of this, update your code to handle both versions.',
          '2. Define a migration to change the data to the new schema.',
          '3. Push the migration and schema changes.',
          '4. Run the migration(s) to completion.',
          '5. Modify your schema and code to assume the new value. Pushing this change will only succeed once all the data matches the new schema. This is the default behavior for Convex, unless you disable schema validation.',
          'See [this Stack post](https://stack.convex.dev/migrating-data-with-mutations) for walkthroughs of common use cases.',
        ],
      },
      {
        heading: 'Pre-requisite: Convex',
        paragraphs: [
          'You\'ll need an existing Convex project to use the component. Convex is a hosted backend platform, including a database, serverless functions, and a ton more you can learn about [here](https://docs.convex.dev/home).',
          'Run `npm create convex` or follow any of the quickstarts to set one up.',
        ],
      },
      {
        heading: 'Installation',
        subsections: [
          {
            subheading: 'Step 1: Install the package',
            paragraphs: [
              'Install the component package:',
            ],
            code: 'npm install @convex-dev/migrations',
          },
          {
            subheading: 'Step 2: Install the component',
            paragraphs: [
              'Create a `convex.config.ts` file in your app\'s `convex/` folder and install the component by calling use:',
            ],
            code: `// convex/convex.config.ts
import { defineApp } from "convex/server";
import migrations from "@convex-dev/migrations/convex.config.js";

const app = defineApp();
app.use(migrations);
export default app;`,
          },
        ],
      },
      {
        heading: 'Initialization',
        paragraphs: [
          'Examples below are assuming the code is in `convex/migrations.ts`. This is not a requirement. If you want to use a different file, make sure to change the examples below from `internal.migrations.*` to your new file name, like `internal.myFolder.myMigrationsFile.*` or CLI arguments like `migrations:*` to `myFolder/myMigrationsFile:*`.',
        ],
        code: `import { Migrations } from "@convex-dev/migrations";
import { components } from "./_generated/api.js";
import { DataModel } from "./_generated/dataModel.js";

export const migrations = new Migrations<DataModel>(components.migrations);

export const run = migrations.runner();`,
        codeBlocks: [
          {
            note: 'The type parameter `DataModel` is optional. It provides type safety for migration definitions. As always, database operations in migrations will abide by your schema definition at runtime. Note: if you use custom functions to override `internalMutation`, see below.',
          },
        ],
      },
      {
        heading: 'Define migrations',
        paragraphs: [
          'Within the `migrateOne` function, you can write code to modify a single document in the specified table. Making changes is optional, and you can also read and write to other tables from this function.',
        ],
        code: `export const setDefaultValue = migrations.define({
  table: "myTable",
  migrateOne: async (ctx, doc) => {
    if (doc.optionalField === undefined) {
      await ctx.db.patch(doc._id, { optionalField: "default" });
    }
  },
});`,
      },
      {
        heading: 'Shorthand syntax',
        paragraphs: [
          'Since the most common migration involves patching each document, if you return an object, it will be applied as a patch automatically.',
        ],
        code: `export const clearField = migrations.define({
  table: "myTable",
  migrateOne: () => ({ optionalField: undefined }),
});

// is equivalent to \`await ctx.db.patch(doc._id, { optionalField: undefined })\``,
      },
      {
        heading: 'Migrating a subset of a table using an index',
        paragraphs: [
          'If you only want to migrate a range of documents, you can avoid processing the whole table by specifying a `customRange`. You can use any existing index you have on the table, or the built-in `by_creation_time` index.',
        ],
        code: `export const validateRequiredField = migrations.define({
  table: "myTable",
  customRange: (query) =>
    query.withIndex("by_requiredField", (q) => q.eq("requiredField", "")),
  migrateOne: async (_ctx, doc) => {
    console.log("Needs fixup: " + doc._id);
    // Shorthand for patching
    return { requiredField: "<unknown>" };
  },
});`,
      },
      {
        heading: 'Running migrations one at a time',
        subsections: [
          {
            subheading: 'Using the Dashboard or CLI',
            paragraphs: [
              'To define a one-off function to run a single migration, pass a reference to it:',
            ],
            code: `export const runIt = migrations.runner(internal.migrations.setDefaultValue);

// To run it from the CLI:
// npx convex run convex/migrations.ts:runIt # or shorthand: migrations:runIt
// Note: pass the --prod argument to run this and below commands in production`,
          },
          {
            subheading: 'General-purpose runner',
            paragraphs: [
              'You can also expose a general-purpose function to run your migrations. For example, in `convex/migrations.ts` add:',
            ],
            code: `export const run = migrations.runner();

// Then run it with the function name:
// npx convex run migrations:run '{fn: "migrations:setDefaultValue"}'`,
          },
          {
            subheading: 'Programmatically',
            paragraphs: [
              'You can also run migrations from other Convex mutations or actions:',
            ],
            code: `await migrations.runOne(ctx, internal.example.setDefaultValue);`,
          },
        ],
        codeBlocks: [
          {
            note: '**Behavior:**\n• If it is already running it will refuse to start another duplicate worker.\n• If it had previously failed on some batch, it will continue from that batch unless you manually specify cursor.\n• If you provide an explicit cursor (`null` means to start at the beginning), it will start from there.\n• If you pass `true` for `dryRun` then it will run one batch and then throw, so no changes are committed, and you can see what it would have done. This is good for validating it does what you expect.',
          },
        ],
      },
      {
        heading: 'Running migrations serially',
        subsections: [
          {
            subheading: 'Using the Dashboard or CLI',
            paragraphs: [
              'You can also pass a list of migrations to runner to have it run a series of migrations instead of just one:',
            ],
            code: `export const runAll = migrations.runner([
  internal.migrations.setDefaultValue,
  internal.migrations.validateRequiredField,
  internal.migrations.convertUnionField,
]);

// Then just run:
// npx convex run migrations:runAll`,
          },
          {
            subheading: 'With next argument',
            paragraphs: [
              'With the runner functions, you can pass a "next" argument to run a series of migrations after the first:',
            ],
            code: `// npx convex run migrations:runIt '{next:["migrations:clearField"]}'
// OR
// npx convex run migrations:run '{fn: "migrations:setDefaultValue", next:["migrations:clearField"]}'`,
          },
          {
            subheading: 'Programmatically',
            paragraphs: [
              'Run migrations serially from code:',
            ],
            code: `await migrations.runSerially(ctx, [
  internal.migrations.setDefaultValue,
  internal.migrations.validateRequiredField,
  internal.migrations.convertUnionField,
]);`,
          },
        ],
        codeBlocks: [
          {
            note: '**Behavior:**\n• If a migration is already in progress when attempted, it will no-op.\n• If a migration had already completed, it will skip it.\n• If a migration had partial progress, it will resume from where it left off.\n• If a migration fails or is canceled, it will not continue on, in case you had some dependencies between the migrations. Call the series again to retry.\n• **Note:** if you start multiple serial migrations, the behavior is:\n  • If they don\'t overlap on functions, they will happily run in parallel.\n  • If they have a function in common and one completes before the other attempts it, the second will just skip it.\n  • If they have a function in common and one is in progress, the second will no-op and not run any further migrations in its series.',
          },
        ],
      },
      {
        heading: 'Operations',
        subsections: [
          {
            subheading: 'Test a migration with dryRun',
            paragraphs: [
              'Before running a migration that may irreversibly change data, you can validate a batch by passing `dryRun` to any runner or `runOne` command:',
            ],
            code: `// npx convex run migrations:runIt '{dryRun: true}'`,
          },
          {
            subheading: 'Restart a migration',
            paragraphs: [
              'Pass `null` for the cursor to force a migration to start over.',
            ],
            code: `// npx convex run migrations:runIt '{cursor: null}'

// You can also pass in any valid cursor to start from. You can find valid cursors
// in the response of calls to getStatus. This can allow retrying a migration from
// a known good point as you iterate on the code.`,
          },
          {
            subheading: 'Stop a migration',
            paragraphs: [
              'You can stop a migration from the CLI or dashboard, calling the component API directly:',
            ],
            code: `// npx convex run --component migrations lib:cancel '{name: "migrations:myMigration"}'

// Or via migrations.cancel programatically:
await migrations.cancel(ctx, internal.migrations.myMigration);`,
          },
          {
            subheading: 'Get the status of migrations',
            paragraphs: [
              'To see the live status of migrations as they progress, you can query it via the CLI:',
            ],
            code: `// npx convex run --component migrations lib:getStatus --watch
// The --watch will live-update the status as it changes.`,
          },
        ],
        code: `// Or programmatically:
const status: MigrationStatus[] = await migrations.getStatus(ctx, {
  limit: 10,
});

// or

const status: MigrationStatus[] = await migrations.getStatus(ctx, {
  migrations: [
    internal.migrations.setDefaultValue,
    internal.migrations.validateRequiredField,
    internal.migrations.convertUnionField,
  ],
});`,
        codeBlocks: [
          {
            note: 'The type is annotated to avoid circular type dependencies, for instance if you are returning the result from a query that is defined in the same file as the referenced migrations.',
          },
        ],
      },
      {
        heading: 'Running migrations as part of a production deploy',
        paragraphs: [
          'As part of your build and deploy command, you can chain the corresponding `npx convex run` command, such as:',
        ],
        code: `npx convex deploy --cmd 'npm run build' && npx convex run convex/migrations.ts:runAll --prod`,
      },
      {
        heading: 'Configuration options',
        subsections: [
          {
            subheading: 'Override the internalMutation to apply custom DB behavior',
            paragraphs: [
              'You can customize which `internalMutation` implementation the underlying migration should use. This might be important if you use custom functions to intercept database writes to apply validation or trigger operations on changes.',
              'See [this article](https://stack.convex.dev/custom-functions) for more information on usage and advanced patterns.',
            ],
            code: `// Assuming you define your own internalMutation in convex/functions.ts:
import { internalMutation } from "./functions";
import { Migrations } from "@convex-dev/migrations";
import { components } from "./_generated/api";

export const migrations = new Migrations(components.migrations, {
  internalMutation,
});`,
          },
          {
            subheading: 'Custom batch size',
            paragraphs: [
              'The component will fetch your data in batches of 100, and call your function on each document in a batch. If you want to change the batch size, you can specify it. This can be useful if your documents are large, to avoid running over the transaction limit, or if your documents are updating frequently and you are seeing OCC conflicts while migrating.',
            ],
            code: `export const clearField = migrations.define({
  table: "myTable",
  batchSize: 10,
  migrateOne: () => ({ optionalField: undefined }),
});

// You can also override this batch size for an individual invocation:
await migrations.runOne(ctx, internal.migrations.clearField, {
  batchSize: 1,
});`,
          },
          {
            subheading: 'Parallelizing batches',
            paragraphs: [
              'Each batch is processed serially, but within a batch you can have each `migrateOne` call run in parallel if you pass `parallelize: true`. If you do so, ensure your callback doesn\'t assume that each call is isolated. For instance, if each call reads then updates the same counter, then multiple functions in the same batch could read the same counter value, and get off by one. As a result, migrations are run serially by default.',
            ],
            code: `export const clearField = migrations.define({
  table: "myTable",
  parallelize: true,
  migrateOne: () => ({ optionalField: undefined }),
});`,
          },
          {
            subheading: 'Shorthand running syntax',
            paragraphs: [
              'For those that don\'t want to type out `migrations:myNewMigration` every time they run a migration from the CLI or dashboard, especially if you define your migrations elsewhere like `ops/db/migrations:myNewMigration`, you can configure a prefix:',
            ],
            code: `export const migrations = new Migrations(components.migrations, {
  internalMigration,
  migrationsLocationPrefix: "migrations:",
});

// And then just call:
// npx convex run migrations:run '{fn: "myNewMutation", next: ["myNextMutation"]}'

// Or in code:
await migrations.getStatus(ctx, { migrations: ["myNewMutation"] });
await migrations.cancel(ctx, "myNewMutation");`,
          },
          {
            subheading: 'Running migrations synchronously',
            paragraphs: [
              'If you want to run a migration synchronously from a test or action, you can use `runToCompletion`. Note that if the action crashes or is canceled, it will not continue migrating in the background.',
            ],
            code: `// From an action:
import { components, internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { runToCompletion } from "@convex-dev/migrations";

export const myAction = internalAction({
  args: {},
  handler: async (ctx) => {
    //...
    const toRun = internal.example.setDefaultValue;
    await runToCompletion(ctx, components.migrations, toRun);
  },
});

// In a test:
import { test } from "vitest";
import { convexTest } from "convex-test";
import component from "@convex-dev/migrations/test";
import { runToCompletion } from "@convex-dev/migrations";
import { components, internal } from "./_generated/api";
import schema from "./schema";

test("test setDefaultValue migration", async () => {
  const t = convexTest(schema);
  // Register the component in the test instance
  component.register(t);
  await t.run(async (ctx) => {
    // Add sample data to migrate
    await ctx.db.insert("myTable", { optionalField: undefined });
    // Run the migration to completion
    const migrationToTest = internal.example.setDefaultValue;
    await runToCompletion(ctx, components.migrations, migrationToTest);
    // Assert that the migration was successful by checking the data
    const docs = await ctx.db.query("myTable").collect();
    expect(docs.every((doc) => doc.optionalField !== undefined)).toBe(true);
  });
});`,
          },
        ],
      },
    ],
  },
  {
    id: 'aggregate',
    title: 'Aggregate',
    description: 'Keep track of sums and counts in a denormalized and scalable way.',
    icon: <TrendingUp size={48} />,
    ...getGradient(1, 'Database'),
    weeklyDownloads: 4917,
    developer: 'get-convex',
    category: 'Database' as ComponentCategory,
    npmPackage: '@convex-dev/aggregate',
    repoUrl: 'https://github.com/get-convex/aggregate',
    packageUrl: 'https://www.npmjs.com/package/@convex-dev/aggregate',
    docsUrl: 'https://github.com/get-convex/aggregate#readme',
    docsLinks: [
      { label: 'Pagination', url: 'https://stack.convex.dev/pagination#whats-an-index-key' },
      { label: 'Photos example', url: 'https://github.com/get-convex/aggregate/blob/main/example/convex/photos.ts' },
      { label: 'Live demo', url: 'https://aggregate-component-example.netlify.app/' },
      { label: 'Convex tutorial', url: 'https://docs.convex.dev/tutorial' },
      { label: 'Convex docs', url: 'https://docs.convex.dev/home' },
      { label: 'Mutations', url: 'https://docs.convex.dev/functions/mutation-functions#transactions' },
      { label: 'Reactive pagination', url: 'https://stack.convex.dev/fully-reactive-pagination' },
      { label: 'Migrations intro', url: 'https://stack.convex.dev/intro-to-migrations' },
      { label: 'Leaderboard example', url: 'https://github.com/get-convex/aggregate/blob/main/example/convex/leaderboard.ts' },
      { label: 'OCC and Atomicity', url: 'https://docs.convex.dev/database/advanced/occ' },
    ],
    bugReportUrl: 'https://github.com/get-convex/aggregate/issues',
    videoUrl: 'https://youtube.com/watch?v=YD3nW_PtHWA&feature=youtu.be',
    exampleCommands: [
      'git clone https://github.com/get-convex/aggregate.git',
      'cd aggregate/example',
      'npm install',
      'npm run dev',
    ],
    longDescription: 'This Convex component calculates count and sums of values for efficient aggregation. The Aggregate component provides O(log(n))-time lookups, instead of the O(n) that would result from naive usage of .collect() in Convex or COUNT(*) in MySQL or Postgres.',
    features: [
      'Efficient COUNT, SUM, MAX, MIN operations with O(log(n)) time complexity.',
      'Find rankings, percentiles, and statistical aggregations quickly.',
      'Group data by arbitrary keys using prefix bounds for flexible queries.',
      'Namespace data for high-throughput scenarios without cross-partition interference.',
      'Offset-based pagination for jumping to specific pages instantly.',
      'Random access to documents for shuffling and randomization.',
      'Batch operations for improved performance when making multiple queries.',
      'Reactive updates that automatically refresh when underlying data changes.',
      'Transactional guarantees ensuring atomicity across multiple operations.',
      'Automatic synchronization with table changes using triggers or manual updates.',
    ],
    documentationSections: [
      {
        heading: 'Efficient COUNT, SUM, MAX with the Aggregate Component',
        paragraphs: [
          'Suppose you have a leaderboard of game scores. These are some operations that the Aggregate component makes easy and efficient:',
        ],
        code: `// Count the total number of scores
aggregate.count(ctx)

// Count the number of scores greater than 65
aggregate.count(ctx, { bounds: { lower: { key: 65, inclusive: false } } })

// Find the p95 score
aggregate.at(ctx, Math.floor(aggregate.count(ctx) * 0.95))

// Find the overall average score
aggregate.sum(ctx) / aggregate.count(ctx)

// Find the ranking for a score of 65 in the leaderboard
aggregate.indexOf(ctx, 65)`,
        codeBlocks: [
          {
            note: 'Find the average score for an individual user. You can define another aggregate grouped by user and aggregate within each:',
            code: `// aggregateScoreByUser is the leaderboard scores grouped by username.
const bounds = { prefix: [username] };

const highScoreForUser = await aggregateScoreByUser.max(ctx, { bounds });

const avgScoreForUser =
  (await aggregateScoreByUser.sum(ctx, { bounds })) /
  (await aggregateScoreByUser.count(ctx, { bounds }));

// It still enables adding or averaging all scores across all usernames.
const globalAverageScore =
  (await aggregateScoreByUser.sum(ctx)) /
  (await aggregateScoreByUser.count(ctx));`,
          },
          {
            note: 'Alternatively, you can define an aggregate with separate namespaces, and do the same query. This method increases throughput because a user\'s data won\'t interfere with other users. However, you lose the ability to aggregate over all users.',
            code: `const forUser = { namespace: username };

const highScoreForUser = await aggregateScoreByUser.max(ctx, forUser);

const avgScoreForUser =
  (await aggregateScoreByUser.sum(ctx, forUser)) /
  (await aggregateScoreByUser.count(ctx, forUser));`,
          },
        ],
      },
      {
        heading: 'What are Aggregates for?',
        paragraphs: [
          'With plain Convex indexes, you can insert new documents and you can paginate through all documents. But sometimes you want big-picture data that encompasses many of your individual data points, without having to fetch them all. That\'s where aggregates come in.',
          'The Aggregates component keeps a data structure with denormalized counts and sums. It\'s effectively a key-value store which is sorted by the key, and where you can count values and number of keys that lie between two keys.',
          'The keys may be arbitrary Convex values, so you can choose to sort your data by:',
          '• A number, like a leaderboard score',
          '• A string, like user ids -- so you can count the data owned by each user',
          '• An index key',
          '• Nothing, use key=null for everything if you just want a total count, such as for random access.',
        ],
      },
      {
        heading: 'Grouping',
        paragraphs: [
          'You can use sorting to group your data set.',
          'If you want to keep track of multiple games with scores for each user, use a tuple of `[game, username, score]` as the key. Then you can bound your queries with a prefix of the key:',
          '• `aggregateByGame.count(ctx, { prefix: [game] })` counts how many times a given game has been played',
          '• `aggregateByGame.count(ctx, { prefix: [game, username] })` counts how many times a given user has played a given game.',
          '• `aggregateByGame.max(ctx, { prefix: [game, username] })` returns the high score for a given user in a given game.',
          'Pay attention to the sort order when aggregating. While `aggregateByGame.max(ctx, { prefix: [game] })` looks like it might give the highest score for a game, it actually gives the user with the highest username who has played that game (like "Zach"). To get the highest score for a game, you would need to aggregate with key `[game, score]`.',
          'To support different sorting and partitioning keys, you can define multiple instances. See below for details.',
          'If you separate your data via the sortKey and prefix bounds, you can look at your data from any altitude. You can do a global count to see how many total data points there are, or you can zero in on an individual group of the data.',
          'However, there\'s a tradeoff: nearby data points can interfere with each other in the internal data structure, reducing throughput. See below for more details. To avoid interference, you can use Namespaces.',
        ],
      },
      {
        heading: 'Namespacing',
        paragraphs: [
          'If your data is separated into distinct partitions, and you don\'t need to aggregate between partitions, then you can put each partition into its own namespace. Each namespace gets its own internal data structure.',
          'If your app has multiple games, it\'s not useful to aggregate scores across different games. The scoring system for chess isn\'t related to the scoring system for football. So we can namespace our scores based on the game.',
          'Whenever we aggregate scores, we must specify the namespace. On the other hand, the internal aggregation data structure can keep the scores separate and keep throughput high.',
        ],
        code: `const leaderboardByGame = new TableAggregate<{
  Namespace: Id<"games">;
  Key: number;
  DataModel: DataModel;
  TableName: "scores";
}>(components.leaderboardByGame, {
  namespace: (doc) => doc.gameId,
  sortKey: (doc) => doc.score,
});

// And whenever you use this aggregate, you specify the namespace.
const footballHighScore = await leaderboardByGame.max(ctx, {
  namespace: footballId,
});`,
        codeBlocks: [
          {
            note: 'See an example of a namespaced aggregate in [example/convex/photos.ts](https://github.com/get-convex/aggregate/blob/main/example/convex/photos.ts).',
          },
        ],
      },
      {
        heading: 'More examples',
        paragraphs: [
          'The Aggregate component can efficiently calculate all of these:',
          '• In a messaging app, how many messages have been sent within the past month?',
          '• Offset-based pagination: view the 14th page of photos, where each page has 50 photos.',
          '• Random access: Look up a random song in a playlist, as the next song to play.',
          'Try it out: [https://aggregate-component-example.netlify.app/](https://aggregate-component-example.netlify.app/)',
        ],
      },
      {
        heading: 'Pre-requisite: Convex',
        paragraphs: [
          'You\'ll need an existing Convex project to use the component. Convex is a hosted backend platform, including a database, serverless functions, and a ton more you can learn about [here](https://docs.convex.dev/home).',
          'Run `npm create convex` or follow any of the quickstarts to set one up.',
        ],
      },
      {
        heading: 'Installation',
        subsections: [
          {
            subheading: 'Step 1: Install the package',
            paragraphs: [
              'See [example/](https://github.com/get-convex/aggregate/tree/main/example) for a working demo.',
              'Install the Aggregate component:',
            ],
            code: 'npm install @convex-dev/aggregate',
          },
          {
            subheading: 'Step 2: Install the component',
            paragraphs: [
              'Create a `convex.config.ts` file in your app\'s `convex/` folder and install the component by calling use:',
            ],
            code: `// convex/convex.config.ts
import { defineApp } from "convex/server";
import aggregate from "@convex-dev/aggregate/convex.config.js";

const app = defineApp();
app.use(aggregate);
export default app;`,
          },
        ],
      },
      {
        heading: 'Defining multiple aggregates',
        paragraphs: [
          'You can aggregate multiple tables, multiple sort keys, or multiple values, but you need to make an instance of the aggregate component for each.',
          'You do this by using the aggregate component multiple times, giving each usage its own name.',
        ],
        code: `app.use(aggregate, { name: "aggregateScores" });
app.use(aggregate, { name: "aggregateByGame" });`,
        codeBlocks: [
          {
            note: 'You then use the named aggregate when initializing the TableAggregate as we\'ll see below, using `components.aggregateScores` instead of `components.aggregate`.',
          },
        ],
      },
      {
        heading: 'Usage',
        subsections: [
          {
            subheading: 'Write to the aggregate data structure',
            paragraphs: [
              'Usually you want to aggregate data in a Convex table. If you\'re aggregating data that\'s not in a table, you can use the lower-level API.',
              'For table-based data, you can use the TableAggregate to define how table data will be sorted and summed in the aggregate component.',
            ],
            code: `import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { mutation as rawMutation } from "./_generated/server";
import { TableAggregate } from "@convex-dev/aggregate";

const aggregate = new TableAggregate<{
  Key: number;
  DataModel: DataModel;
  TableName: "mytable";
}>(components.aggregate, {
  sortKey: (doc) => doc._creationTime, // Allows querying across time ranges.
  sumValue: (doc) => doc.value, // The value to be used in .sum calculations.
});`,
          },
          {
            subheading: 'Example: aggregateByGame',
            paragraphs: [
              'Pick your key as described above. For example, here\'s how you might define `aggregateByGame`, as an aggregate on the "scores" table:',
            ],
            code: `const aggregateByGame = new TableAggregate<{
  Namespace: Id<"games">;
  Key: [string, number];
  DataModel: DataModel;
  TableName: "leaderboard";
}>(components.aggregateByGame, {
  namespace: (doc) => doc.gameId,
  sortKey: (doc) => [doc.username, doc.score],
});`,
          },
          {
            subheading: 'Updating the aggregate',
            paragraphs: [
              'When the table changes, you should update the aggregate as well, in the same mutation.',
            ],
            code: `// When you insert into the table, call aggregate.insert
const id = await ctx.db.insert("mytable", { foo, bar });
const doc = await ctx.db.get(id);
await aggregate.insert(ctx, doc!);

// If you update a document, use aggregate.replace
const oldDoc = await ctx.db.get(id);
await ctx.db.patch(id, { foo });
const newDoc = await ctx.db.get(id);
await aggregate.replace(ctx, oldDoc!, newDoc!);

// And if you delete a document, use aggregate.delete
const oldDoc = await ctx.db.get(id);
await ctx.db.delete(id);
await aggregate.delete(ctx, oldDoc!);`,
          },
        ],
        codeBlocks: [
          {
            note: 'It\'s important that every modification to the table also updates the associated aggregate. See tips below.',
          },
          {
            note: 'Note that Convex mutations are atomic, so you don\'t need to worry about race conditions where the document is written but the aggregate isn\'t, and you don\'t need to worry about a query reading a document that isn\'t in the aggregate yet.',
          },
          {
            note: 'If the table already has data before attaching the aggregate, run a migration to backfill.',
          },
        ],
      },
      {
        heading: 'Calculate aggregates',
        paragraphs: [
          'Now that your Aggregate component has all of the data from your table, you can call any of the methods on your instance to aggregate data.',
        ],
        code: `// convex/myfunctions.ts
// then in your queries and mutations you can do
const tableCount = await aggregateByGame.count(ctx);

// or any of the other examples listed above.`,
        codeBlocks: [
          {
            note: 'See more examples in [example/convex/leaderboard.ts](https://github.com/get-convex/aggregate/blob/main/example/convex/leaderboard.ts), and see the docstrings on the Aggregate class.',
          },
        ],
      },
      {
        heading: 'Example use-cases',
        paragraphs: [
          'To run the examples:',
          '1. Clone this repo.',
          '2. `npm i && cd aggregate/example && npm i`',
          '3. `npm run dev` and create a new project',
          '4. The dashboard should open and you can run functions like `leaderboard:addScore` and `leaderboard:userAverageScore`.',
          'Or play with them online at: [https://aggregate-component-example.netlify.app/](https://aggregate-component-example.netlify.app/)',
        ],
      },
      {
        heading: 'Total Count and Randomization',
        paragraphs: [
          'If you don\'t need the ordering, partitioning, or summing behavior of TableAggregate, you can set `namespace: undefined` and `sortKey: null`.',
        ],
        code: `const randomize = new TableAggregate<{
  Key: null;
  DataModel: DataModel;
  TableName: "mytable";
}>(components.aggregate, { sortKey: (doc) => null });`,
        codeBlocks: [
          {
            note: 'Without sorting, all documents are ordered by their `_id` which is generally random. And you can look up the document at any index to find one at random or shuffle the whole table.',
          },
          {
            note: 'See more examples in [example/convex/shuffle.ts](https://github.com/get-convex/aggregate/blob/main/example/convex/shuffle.ts), including a paginated random shuffle of some music.',
          },
        ],
      },
      {
        heading: 'Offset-based pagination',
        paragraphs: [
          'Convex supports infinite-scroll pagination which is reactive so you never have to worry about items going missing from your list. But sometimes you want to display separate pages of results on separate pages of your app.',
          'For this example, imagine you have a table of photo albums.',
        ],
        code: `// convex/schema.ts
defineSchema({
  photos: defineTable({ album: v.string(), url: v.string() }).index(
    "by_album_creation_time",
    ["album"],
  ),
});

// And an aggregate defined with key as _creationTime and namespace as album.
// convex/convex.config.ts
app.use(aggregate, { name: "photos" });

// convex/photos.ts
const photos = new TableAggregate<{
  Namespace: string; // album name
  Key: number; // creation time
  DataModel: DataModel;
  TableName: "photos";
}>(components.photos, {
  namespace: (doc) => doc.album,
  sortKey: (doc) => doc._creationTime,
});

// You can pick a page size and jump to any page once you have TableAggregate
// to map from offset to an index key.
// In this example, if offset is 100 and numItems is 10, we get the hundredth
// _creationTime (in ascending order) and starting there we get the next ten
// documents. In this way we can paginate through the whole photo album.
export const pageOfPhotos = query({
  args: { offset: v.number(), numItems: v.number(), album: v.string() },
  handler: async (ctx, { offset, numItems, album }) => {
    const { key } = await photos.at(ctx, offset, { namespace: album });
    return await ctx.db.query("photos")
      .withIndex("by_album_creation_time", q=>q.eq("album", album).gte("_creationTime", key))
      .take(numItems);
  },
});`,
        codeBlocks: [
          {
            note: 'See the full example in [example/convex/photos.ts](https://github.com/get-convex/aggregate/blob/main/example/convex/photos.ts).',
          },
        ],
      },
      {
        heading: 'Aggregate without a table',
        paragraphs: [
          'Often you\'re aggregating over a table of data, but sometimes you want to aggregate data that isn\'t stored anywhere else. For that, you can use the DirectAggregate interface, which is like TableAggregate except you handle insert, delete, and replace operations yourself.',
        ],
        code: `import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { DirectAggregate } from "@convex-dev/aggregate";

// Note the id should be unique to be a tie-breaker in case two data points
// have the same key.
const aggregate = new DirectAggregate<{ Key: number; Id: string }>(
  components.aggregate,
);

// within a mutation, add values to be aggregated
await aggregate.insert(ctx, { key, id });

// if you want to use .sum to aggregate sums of values, insert with a sumValue
await aggregate.insert(ctx, { key, id, sumValue });

// or delete values that were previously added
await aggregate.delete(ctx, { key, id });

// or update values
await aggregate.replace(ctx, { key: oldKey, id }, { key: newKey });`,
        codeBlocks: [
          {
            note: 'See [example/convex/stats.ts](https://github.com/get-convex/aggregate/blob/main/example/convex/stats.ts) for an example.',
          },
        ],
      },
      {
        heading: 'Operations',
        subsections: [
          {
            subheading: 'Attach Aggregate to an existing table',
            paragraphs: [
              'Adding aggregation to an existing table requires a migration. There are several ways to perform migrations, but here\'s an overview of one way:',
              '1. Use `insertIfDoesNotExist`/`replaceOrInsert`/`deleteIfExists` in place of `insert`/`replace`/`delete` (or `idempotentTrigger` in place of `trigger`) to update items in the aggregate. These methods act the same, except they work even if the aggregate component isn\'t in sync with the table.',
              '2. Deploy this code change, so the live path writing documents also write to the aggregate component.',
              '3. Use a paginated background migration to walk all existing data and call `insertIfDoesNotExist`. In the example, you would run `runAggregateBackfill` in leaderboard.ts.',
              '4. Now all of the data is represented in the Aggregate, you can start calling read methods like `aggregate.count(ctx)` and you can change the write methods back (`insertIfDoesNotExist` -> `insert` etc.).',
            ],
          },
          {
            subheading: 'Automatically update aggregate when table changes',
            paragraphs: [
              'It\'s important that every modification to the table also updates the associated aggregate. If they get out of sync then computed aggregates might be incorrect. Then you might have to fix them.',
              'There are three ways to go about keeping data in sync:',
            ],
            code: `// 1. Be careful to always update the aggregate in any mutation that updates
// the source-of-truth table.

// 2. [Recommended] Place all writes to a table in separate TypeScript functions,
// and always call these functions from mutations instead of writing to the db
// directly. This method is recommended, because it encapsulates the logic for
// updating a table, while still keeping all operations explicit.
export const playAGame = mutation(async (ctx) => {
  ...
  await insertScore(ctx, gameId, user1, user1Score);
  await insertScore(ctx, gameId, user2, user2Score);
});

// All inserts to the "scores" table go through this function.
async function insertScore(ctx, gameId, username, score) {
  const id = await ctx.db.insert("scores", { gameId, username, score });
  const doc = await ctx.db.get(id);
  await aggregateByGame.insert(ctx, doc!);
}

// 3. Register a Trigger, which automatically runs code when a mutation changes
// the data in a table.
const triggers = new Triggers<DataModel>();
triggers.register("mytable", aggregate.trigger());

export const mutation = customMutation(rawMutation, customCtx(triggers.wrapDB));

// The example/convex/photos.ts example uses a trigger.`,
          },
          {
            subheading: 'Repair incorrect aggregates',
            paragraphs: [
              'If some mutation or direct write in the Dashboard updated the source of truth data without writing to the aggregate, they can get out of sync and the returned aggregates may be incorrect.',
              'The simplest way to fix is to start over. Either call `await aggregate.clear(ctx)` or rename the component like `app.use(aggregate, { name: "newName" })` which will reset it to be empty. Then follow the instructions from above.',
              'There is an alternative which doesn\'t clear the aggregates: compare the source of truth to the aggregate table. You can use `db.query("mytable").paginate()` on your Convex table and `aggregate.paginate()` on the aggregate. Update the aggregates based on the diff of these two paginated data streams.',
            ],
          },
        ],
      },
      {
        heading: 'Performance Optimizations',
        subsections: [
          {
            subheading: 'Batch Operations',
            paragraphs: [
              'For improved performance when making multiple similar queries, the Aggregate component provides batch versions of common operations:',
              '• `countBatch()` - Count items for multiple bounds in a single call',
              '• `sumBatch()` - Sum items for multiple bounds in a single call',
              '• `atBatch()` - Return items at multiple offsets in a single call',
              'These batch functions are significantly more efficient than making individual calls because they:',
              '• Reduce function call overhead: Instead of multiple separate function invocations, batch operations make a single call that processes multiple queries internally.',
              '• Optimize database access: Batch operations can leverage internal optimizations and reduce the number of database round trips.',
              '• Improve transaction efficiency: When used in mutations, batch operations reduce the transaction scope and potential for conflicts.',
            ],
            code: `// Instead of multiple individual calls:
const counts = await Promise.all([
  aggregate.count(ctx, { bounds: bounds1 }),
  aggregate.count(ctx, { bounds: bounds2 }),
  aggregate.count(ctx, { bounds: bounds3 }),
]);

// Use the batch equivalent for better performance:
const counts = await aggregate.countBatch(ctx, [
  { bounds: bounds1 },
  { bounds: bounds2 },
  { bounds: bounds3 },
]);`,
          },
          {
            subheading: 'Reactivity and Atomicity',
            paragraphs: [
              'Like all Convex queries, aggregates are reactive, and updating them is transactional.',
              'If aggregated data updates infrequently, everything runs smoothly. However, if aggregated data updates frequently, the reactivity and atomicity can cause issues: reactive queries can rerun often, and mutations can slow down.',
            ],
          },
          {
            subheading: 'Reactivity',
            paragraphs: [
              'Reactivity means if you query an aggregate, like a count, sum, rank, offset-based page, etc. your UI will automatically update to reflect updates.',
              'If someone gets a new high score, everyone else\'s leaderboard will show them moving down, and the total count of scores will increase. If I add a new song, it will automatically get shuffled into the music album.',
              'Don\'t worry about polling to get new results. Don\'t worry about data needing a few seconds to propagate through the system. And you don\'t need to refresh your browser. As soon as the data is updated, the aggregates are updated everywhere, including the user\'s UI.',
            ],
          },
          {
            subheading: 'Transactions',
            paragraphs: [
              'Transactionality means if you do multiple writes in the same mutation, like adding data to a table and inserting it into an aggregate, those operations are performed together. No query or mutation can observe a race condition where the data exists in the table but not in the aggregate. And if two mutations insert data into an aggregate, the count will go up by two, even if the mutations are running in parallel.',
              'There\'s a special transactional property of components that is even better than the Convex guarantees you\'re used to. If you were to keep a denormalized count with a normal Convex mutation, you\'ll notice that the TypeScript can run with various orderings, messing up the final result.',
            ],
            code: `// You might try to do this before experiencing the wonders of the Aggregate component.
async function increment(ctx: MutationCtx) {
  const doc = (await ctx.query("count").unique())!;
  await ctx.db.patch(doc._id, { value: doc.value + 1 });
}

export const addTwo = mutation({
  handler: async (ctx) => {
    await Promise.all([increment(ctx), increment(ctx)]);
  },
});

// When you call the addTwo mutation, the count will increase by... one.
// That's because TypeScript runs both db.querys before running the db.patchs.
// But with the Aggregate component, the count goes up by two as intended.
// That's because component operations are atomic.
export const addTwo = mutation({
  handler: async (ctx) => {
    await Promise.all([
      aggregate.insert(ctx, "some key", "a"),
      aggregate.insert(ctx, "other key", "b"),
    ]);
  },
});`,
          },
        ],
        codeBlocks: [
          {
            note: 'You may have noticed that Aggregate methods can be called from actions, unlike `ctx.db`. This was an accident, but it works, so let\'s call it a feature! In particular, each Aggregate method called from any context, including from an action, will be atomic within itself. However, we recommend calling the methods from a mutation or query so they can be transactional with other database reads and writes.',
          },
        ],
      },
      {
        heading: 'Read dependencies and writes',
        paragraphs: [
          'When a query calls `await aggregate.count(ctx)`, this depends on the entire aggregate data structure. When any mutation changes the data structure, i.e. insert, delete, or replace, the query reruns and sends new results to the frontend. This is necessary to keep the frontend looking snappy, but it can cause large function call and bandwidth usage on Convex.',
          'When a mutation calls `await aggregate.count(ctx)`, then this mutation needs to run transactionally relative to other mutations. Another mutation that does an insert, delete, or replace can cause an OCC conflict.',
          'In order to calculate in O(log(n)) time, the aggregate component stores denormalized counts in an internal data structure. Data points with nearby keys may have their counts accumulated in one place.',
          'Imagine the leaderboard aggregate defined with `Key: [username, score]`. Users "Laura" and "Lauren" have adjacent keys, so there is a node internal to the Aggregate component that includes the counts of Laura and Lauren combined. If Laura is looking at her own high score, this involves reading from the internal node shared with Lauren. So when Lauren gets a new high score, Laura\'s query reruns (but its result doesn\'t change). And when Laura and Lauren both get new scores at the same time, their mutations will run slower to make the change to the internal node transactional.',
          'Corollary: if a table\'s aggregate uses a key on `_creationTime`, each new data point will be added to the same part of the data structure (the end), because `_creationTime` keeps increasing. Therefore all inserts will wait for each other and no mutations can run in parallel.',
          'On the other hand, each namespace has its own data structure and there\'s no overlap in internal nodes between namespaces. So if you use `Namespace: username` and `Key: score`, which has similar capabilities to an aggregate with `Key: [username, score]`, then you never have a problem with "Laura" and "Lauren" having contention.',
        ],
      },
      {
        heading: 'Put bounds on aggregated data',
        paragraphs: [
          'To reduce the read dependency footprint of your query, you can partition your aggregate space and make sure you\'re using bounds whenever possible. Examples:',
        ],
        code: `// This query only reads scores between 95 and 100, so in a query it only reruns
// when a score in that range changes, and in a mutation it only conflicts with
// mutations that modify a score in that range.
await aggregateByScore.count(ctx, {
  lower: { key: 95, inclusive: false },
  upper: { key: 100, inclusive: true },
});

// This query only reads data from a specific user, so it will only rerun or
// conflict when a mutation modifies that user.
await aggregateScoreByUser.count(ctx, { prefix: [username] });`,
      },
      {
        heading: 'Lazy aggregation',
        paragraphs: [
          'The aggregate data structure internally denormalizes counts so they can be calculated efficiently by only reading a few documents instead of every document in your table.',
          'However, this isn\'t always required: we can trade off speed and database bandwidth for reduced impact of writes.',
          'By default, the root aggregation document is lazy; it doesn\'t store a count. This means `aggregate.count(ctx)` has to look at several documents instead of just one, but it also means that an insert at a very small key won\'t intersect with a write or read on a very large key.',
          'If you want to maximize query speed without worrying about conflicts, e.g. because the data changes infrequently but queries are frequent, you can turn off the default behavior by starting over with `aggregate.clear(ctx, 16, false)` which set `rootLazy` to false.',
          'Another way to optimize lazy aggregation is to increase the `maxNodeSize` of the aggregate data structure. e.g. if the root is lazy and `maxNodeSize` is the default of 16, that means each write updates some document that accumulates 1/16th of the entire data structure. So each write will intersect with 1/16th of all other writes, and reads may spuriously rerun 1/16th of the time. To increase `maxNodeSize`, run `aggregate.clear(ctx, maxNodeSize)` and start over.',
        ],
      },
    ],
  },
  {
    id: 'presence-db',
    title: 'Presence',
    description: 'Track user presence in real-time.',
    icon: <Users size={48} />,
    ...getGradient(2, 'Database'),
    weeklyDownloads: 4317,
    developer: 'get-convex',
    category: 'Database' as ComponentCategory,
    npmPackage: '@convex-dev/presence',
    repoUrl: 'https://github.com/get-convex/presence',
    packageUrl: 'https://www.npmjs.com/package/@convex-dev/presence',
    docsUrl: 'https://github.com/get-convex/presence#readme',
    docsLinks: [
      { label: 'Hosted demo', url: 'https://presence.previews.convex.dev' },
    ],
    bugReportUrl: 'https://github.com/get-convex/presence/issues',
    videoUrl: 'https://youtube.com/watch?v=YD3nW_PtHWA&feature=youtu.be',
    exampleCommands: [
      'git clone https://github.com/get-convex/presence.git',
      'cd presence/example',
      'npm install',
      'npm run dev',
    ],
    longDescription: 'A Convex component for managing presence functionality, i.e., a live-updating list of users in a "room" including their status for when they were last online. It can be tricky to implement presence efficiently, without any polling and without re-running queries every time a user sends a heartbeat message. This component implements presence via Convex scheduled functions such that clients only receive updates when a user joins or leaves the room.',
    features: [
      'Live-updating list of users in a "room" with their online status.',
      'No polling required - efficient implementation using Convex scheduled functions.',
      'Clients only receive updates when users join or leave rooms.',
      'React hook (usePresence) handles heartbeat messages automatically.',
      'Graceful disconnection when tabs are closed.',
      'Built-in FacePile component for displaying active users.',
      'React Native support with optional dependencies.',
      'Additional functions for querying presence state.',
      'Room-based presence tracking for multiple concurrent rooms.',
      'Session management with automatic cleanup.',
    ],
    documentationSections: [
      {
        heading: 'Overview',
        paragraphs: [
          'It can be tricky to implement presence efficiently, without any polling and without re-running queries every time a user sends a heartbeat message. This component implements presence via Convex scheduled functions such that clients only receive updates when a user joins or leaves the room.',
          'The most common use case for this component is via the `usePresence` hook, which takes care of sending heartbeat messages to the server and gracefully disconnecting a user when the tab is closed.',
        ],
      },
      {
        heading: 'Installation',
        paragraphs: [
          'Install the Presence component:',
        ],
        code: 'npm install @convex-dev/presence',
      },
      {
        heading: 'Examples',
        paragraphs: [
          'See the example directory for a simple example of how to use this component. The example-with-auth directory shows how to use the component with authentication.',
          'There\'s a hosted version of example-with-auth at [https://presence.previews.convex.dev](https://presence.previews.convex.dev).',
        ],
      },
      {
        heading: 'Usage',
        subsections: [
          {
            subheading: 'Step 1: Add the component to your Convex app',
            paragraphs: [
              'First, add the component to your Convex app:',
            ],
            code: `// convex/convex.config.ts
import { defineApp } from "convex/server";
import presence from "@convex-dev/presence/convex.config.js";

const app = defineApp();
app.use(presence);
export default app;`,
          },
          {
            subheading: 'Step 2: Set up presence functions',
            paragraphs: [
              'Create presence functions in your Convex backend:',
            ],
            code: `// convex/presence.ts
import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { v } from "convex/values";
import { Presence } from "@convex-dev/presence";

export const presence = new Presence(components.presence);

export const heartbeat = mutation({
  args: {
    roomId: v.string(),
    userId: v.string(),
    sessionId: v.string(),
    interval: v.number(),
  },
  handler: async (ctx, { roomId, userId, sessionId, interval }) => {
    // TODO: Add your auth checks here.
    return await presence.heartbeat(ctx, roomId, userId, sessionId, interval);
  },
});

export const list = query({
  args: { roomToken: v.string() },
  handler: async (ctx, { roomToken }) => {
    // Avoid adding per-user reads so all subscriptions can share same cache.
    return await presence.list(ctx, roomToken);
  },
});

export const disconnect = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    // Can't check auth here because it's called over http from sendBeacon.
    return await presence.disconnect(ctx, sessionToken);
  },
});`,
          },
          {
            subheading: 'Step 3: Use the React hook in your client',
            paragraphs: [
              'A Presence React component can be instantiated from your client code like this:',
            ],
            code: `// src/App.tsx
import { api } from "../convex/_generated/api";
import usePresence from "@convex-dev/presence/react";
import FacePile from "@convex-dev/presence/facepile";

export default function App(): React.ReactElement {
  const [name] = useState(() => "User " + Math.floor(Math.random() * 10000));
  const presenceState = usePresence(api.presence, "my-chat-room", name);

  return (
    <main>
      <FacePile presenceState={presenceState ?? []} />
    </main>
  );
}`,
          },
        ],
        codeBlocks: [
          {
            note: 'This uses the basic FacePile component included with this package but you can easily copy this code and use the `usePresence` hook directly to implement your own styling.',
          },
        ],
      },
      {
        heading: 'React Native support',
        paragraphs: [
          'If you\'re using React Native, install these optional dependencies:',
        ],
        code: `npx expo install react-native expo-crypto

// and then import the usePresence hook from @convex-dev/presence/react-native:
import { usePresence } from "@convex-dev/presence/react-native";`,
        codeBlocks: [
          {
            note: 'Note: The component currently doesn\'t have a React Native equivalent, but you can easily create your own.',
          },
        ],
      },
      {
        heading: 'Additional functionality',
        paragraphs: [
          'The component interface for the Presence class is defined in `src/client/index.ts`. It includes additional functions for maintaining presence state and for querying presence for a given user or room.',
          'e.g., you can use the `listUser` function to check if a user is online in any room.',
        ],
      },
    ],
  },
  {
    id: 'rag',
    title: 'RAG',
    description: 'Retrieval-Augmented Generation (RAG) for use with your AI products and Agents',
    icon: <Search size={48} />,
    ...getGradient(3, 'Database'),
    weeklyDownloads: 3616,
    developer: 'get-convex',
    category: 'Database' as ComponentCategory,
    npmPackage: '@convex-dev/rag',
    repoUrl: 'https://github.com/get-convex/rag',
    packageUrl: 'https://www.npmjs.com/package/@convex-dev/rag',
    docsUrl: 'https://github.com/get-convex/rag#readme',
    docsLinks: [
      { label: 'AI Agents docs', url: 'https://docs.convex.dev/agents' },
      { label: 'Agent component', url: 'https://www.convex.dev/components/agent' },
    ],
    bugReportUrl: 'https://github.com/get-convex/rag/issues',
    videoUrl: 'https://www.youtube.com/watch?v=dGmtAmdAaFs',
    exampleCommands: [
      'git clone https://github.com/get-convex/rag.git',
      'cd rag',
      'npm install',
      'npm run dev',
    ],
    longDescription: 'A component for semantic search, usually used to look up context for LLMs. Use with an Agent for Retrieval-Augmented Generation (RAG).',
    features: [
      'Add or replace content with text chunks and embeddings.',
      'Vector-based semantic search using configurable embedding models.',
      'Organize content into namespaces for per-user search.',
      'Filter content with custom indexed fields.',
      'Weight content by providing a 0 to 1 "importance" value.',
      'Get surrounding chunks for better context.',
      'Migrate content or whole namespaces without disruption.',
      'Automatic embedding generation if not provided.',
      'Integration with Agent Component for RAG workflows.',
      'Support for multiple embedding models from the AI SDK.',
    ],
    documentationSections: [
      {
        heading: 'Key Features',
        paragraphs: [
          '✨ **Add Content**: Add or replace content with text chunks and embeddings.',
          '**Semantic Search**: Vector-based search using configurable embedding models',
          '**Namespaces**: Organize content into namespaces for per-user search.',
          '**Custom Filtering**: Filter content with custom indexed fields.',
          '**Importance Weighting**: Weight content by providing a 0 to 1 "importance".',
          '**Chunk Context**: Get surrounding chunks for better context.',
          '**Graceful Migrations**: Migrate content or whole namespaces without disruption.',
        ],
      },
      {
        heading: 'Installation',
        paragraphs: [
          'Create a `convex.config.ts` file in your app\'s `convex/` folder and install the component by calling use:',
        ],
        code: `// convex/convex.config.ts
import { defineApp } from "convex/server";
import rag from "@convex-dev/rag/convex.config.js";

const app = defineApp();
app.use(rag);
export default app;`,
        codeBlocks: [
          {
            note: 'Run `npx convex codegen` if `npx convex dev` isn\'t already running.',
          },
        ],
      },
      {
        heading: 'Basic Setup',
        paragraphs: [
          'Set up the RAG component with your embedding model:',
        ],
        code: `// convex/example.ts
import { components } from "./_generated/api";
import { RAG } from "@convex-dev/rag";
// Any AI SDK model that supports embeddings will work.
import { openai } from "@ai-sdk/openai";

const rag = new RAG(components.rag, {
  textEmbeddingModel: openai.embedding("text-embedding-3-small"),
  embeddingDimension: 1536, // Needs to match your embedding model
});`,
      },
      {
        heading: 'Add context to RAG',
        paragraphs: [
          'Add content with text chunks. Each call to `add` will create a new entry. It will embed the chunks automatically if you don\'t provide them.',
        ],
        code: `export const add = action({
  args: { text: v.string() },
  handler: async (ctx, { text }) => {
    // Add the text to a namespace shared by all users.
    await rag.add(ctx, {
      namespace: "all-users",
      text,
    });
  },
});`,
        codeBlocks: [
          {
            note: 'See below for how to chunk the text yourself or add content asynchronously, e.g. to handle large files.',
          },
        ],
      },
      {
        heading: 'Semantic Search',
        paragraphs: [
          'Search across content with vector similarity',
          '`text` is a string with the full content of the results, for convenience. It is in order of the entries, with titles at each entry boundary, and separators between non-sequential chunks. See below for more details.',
          '`results` is an array of matching chunks with scores and more metadata.',
          '`entries` is an array of the entries that matched the query. Each result has a `entryId` referencing one of these source entries.',
          '`usage` contains embedding token usage information. Will be `{ tokens: 0 }` if no embedding was performed (e.g. when passing pre-computed embeddings).',
        ],
        code: `export const search = action({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const { results, text, entries, usage } = await rag.search(ctx, {
      namespace: "global",
      query: args.query,
      limit: 10,
      vectorScoreThreshold: 0.5, // Only return results with a score >= 0.5
    });
    return { results, text, entries, usage };
  },
});`,
      },
      {
        heading: 'Generate a response based on RAG context',
        paragraphs: [
          'Once you have searched for the context, you can use it with an LLM.',
          'Generally you\'ll already be using something to make LLM requests, e.g. the Agent Component, which tracks the message history for you. See the [Agent Component docs](https://docs.convex.dev/agents) for more details on doing RAG with the Agent Component.',
          'However, if you just want a one-off response, you can use the `generateText` function as a convenience.',
          'This will automatically search for relevant entries and use them as context for the LLM, using default formatting.',
          'The arguments to `generateText` are compatible with all arguments to `generateText` from the AI SDK.',
        ],
        code: `export const askQuestion = action({
  args: {
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const { text, context } = await rag.generateText(ctx, {
      search: { namespace: userId, limit: 10 },
      prompt: args.prompt,
      model: openai.chat("gpt-4o-mini"),
    });
    return { answer: text, context };
  },
});`,
        codeBlocks: [
          {
            note: 'Note: You can specify any of the search options available on `rag.search`.',
          },
        ],
      },
      {
        heading: 'Filtered Search',
        paragraphs: [
          'You can provide filters when adding content and use them to search. To do this, you\'ll need to give the RAG component a list of the filter names. You can optionally provide a type parameter for type safety (no runtime validation).',
          'Note: these filters can be OR\'d together when searching. In order to get an AND, you provide a filter with a more complex value, such as `categoryAndType` below.',
        ],
        code: `// convex/example.ts
import { components } from "./_generated/api";
import { RAG } from "@convex-dev/rag";
// Any AI SDK model that supports embeddings will work.
import { openai } from "@ai-sdk/openai";

// Optional: Add type safety to your filters.
type FilterTypes = {
  category: string;
  contentType: string;
  categoryAndType: { category: string; contentType: string };
};

const rag = new RAG<FilterTypes>(components.rag, {
  textEmbeddingModel: openai.embedding("text-embedding-3-small"),
  embeddingDimension: 1536, // Needs to match your embedding model
  filterNames: ["category", "contentType", "categoryAndType"],
});`,
      },
      {
        heading: 'Adding content with filters',
        paragraphs: [
          'When adding content, you can include filter values:',
        ],
        code: `await rag.add(ctx, {
  namespace: "global",
  text,
  filterValues: [
    { name: "category", value: "news" },
    { name: "contentType", value: "article" },
    {
      name: "categoryAndType",
      value: { category: "news", contentType: "article" },
    },
  ],
});`,
      },
      {
        heading: 'Search with metadata filters',
        paragraphs: [
          'Use filters when searching to narrow down results:',
        ],
        code: `export const searchForNewsOrSports = action({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const results = await rag.search(ctx, {
      namespace: userId,
      query: args.query,
      filters: [
        { name: "category", value: "news" },
        { name: "category", value: "sports" },
      ],
      limit: 10,
    });
    return results;
  },
});`,
      },
      {
        heading: 'Add surrounding chunks to results for context',
        paragraphs: [
          'Instead of getting just the single matching chunk, you can request surrounding chunks so there\'s more context to the result.',
          'Note: If there are results that have overlapping ranges, it will not return duplicate chunks, but instead give priority to adding the "before" context to each chunk. For example if you requested 2 before and 1 after, and your results were for the same entryId indexes 1, 4, and 7, the results would be:',
          '• `[{ order: 1, content: [chunk0, chunk1], startOrder: 0, ... }]` - Only one before chunk available, and leaves chunk2 for the next result.',
          '• `[{ order: 4, content: [chunk2, chunk3, chunk4], startOrder: 2, ... }]` - 2 before chunks available, but leaves chunk5 for the next result.',
          '• `[{ order: 7, content: [chunk5, chunk6, chunk7, chunk8], startOrder: 5, ... }]` - 2 before chunks available, and includes one after chunk.',
        ],
        code: `export const searchWithContext = action({
  args: {
    query: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { results, text, entries, usage } = await rag.search(ctx, {
      namespace: args.userId,
      query: args.query,
      chunkContext: { before: 2, after: 1 }, // Include 2 chunks before, 1 after
      limit: 5,
    });
    return { results, text, entries, usage };
  },
});`,
      },
    ],
  },
  {
    id: 'sharded-counter',
    title: 'Sharded Counter',
    description: 'Scalable counter that can increment and decrement with high throughput.',
    icon: <Hash size={48} />,
    ...getGradient(4, 'Database'),
    weeklyDownloads: 1742,
    developer: 'get-convex',
    category: 'Database' as ComponentCategory,
    npmPackage: '@convex-dev/sharded-counter',
    repoUrl: 'https://github.com/get-convex/sharded-counter',
    packageUrl: 'https://www.npmjs.com/package/@convex-dev/sharded-counter',
    docsUrl: 'https://github.com/get-convex/sharded-counter#readme',
    docsLinks: [
      { label: 'Example code', url: 'https://github.com/get-convex/sharded-counter/blob/main/example/convex/example.ts' },
      { label: 'Triggers', url: 'https://www.npmjs.com/package/convex-helpers#triggers' },
      { label: 'Aggregate component', url: 'https://www.npmjs.com/package/@convex-dev/aggregate' },
      { label: 'Floating-point arithmetic', url: 'https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html' },
      { label: 'OCC and Atomicity', url: 'https://docs.convex.dev/database/advanced/occ' },
    ],
    bugReportUrl: 'https://github.com/get-convex/sharded-counter/issues',
    videoUrl: 'https://www.youtube.com/watch?v=LRUWplYoejQ',
    exampleCommands: [
      'git clone https://github.com/get-convex/sharded-counter.git',
      'cd sharded-counter/example',
      'npm install',
      'npm run dev',
    ],
    longDescription: 'This component adds counters to Convex. It acts as a key-value store from string to number, with sharding to increase throughput when updating values. Since it\'s built on Convex, everything is automatically consistent, reactive, and cached. Since it\'s built with Components, the operations are isolated and increment/decrement are atomic even if run in parallel.',
    features: [
      'Key-value store from string to number with sharding for high throughput.',
      'Automatic consistency, reactivity, and caching via Convex.',
      'Atomic increment/decrement operations even when run in parallel.',
      'Configurable number of shards per counter key for throughput vs latency tradeoffs.',
      'Estimated counts to reduce read contention by reading from fewer shards.',
      'Rebalancing to evenly distribute counts across shards.',
      'Trigger integration for automatic counter updates when table changes.',
      'Backfilling support for counting existing documents in tables.',
      'Simple API with inc, dec, add, subtract, reset, and count methods.',
      'Support for custom key types beyond strings (e.g., user IDs).',
    ],
    documentationSections: [
      {
        heading: 'Example',
        paragraphs: [
          'For example, if you want to display one million checkboxes on your Convex site, you want to count the checkboxes in real-time while allowing a lot of the boxes to change in parallel.',
          'More generally, whenever you have a counter that is changing frequently, you can use this component to keep track of it efficiently.',
        ],
        code: `export const checkBox = mutation({
  args: { i: v.number() },
  handler: async (ctx, args) => {
    const checkbox = await ctx.db
      .query("checkboxes")
      .withIndex("i", (q) => q.eq("i", args.i))
      .unique();
    if (!checkbox.isChecked) {
      await ctx.db.patch(checkbox._id, { isChecked: true });
      // Here we increment the number of checkboxes.
      await numCheckboxes.inc(ctx);
    }
  },
});

export const getCount = query({
  args: {},
  handler: async (ctx, _args) => {
    return await numCheckboxes.count(ctx);
  },
});`,
        codeBlocks: [
          {
            note: 'This relies on the assumption that you need to frequently modify the counter, but only need to read its value from a query, or infrequently in a mutation. If you read the count every time you modify it, you lose the sharding benefit.',
          },
        ],
      },
      {
        heading: 'Pre-requisite: Convex',
        paragraphs: [
          'You\'ll need an existing Convex project to use the component. Convex is a hosted backend platform, including a database, serverless functions, and a ton more you can learn about [here](https://docs.convex.dev/home).',
          'Run `npm create convex` or follow any of the quickstarts to set one up.',
        ],
      },
      {
        heading: 'Installation',
        subsections: [
          {
            subheading: 'Step 1: Install the package',
            paragraphs: [
              'First, install the component package:',
            ],
            code: 'npm install @convex-dev/sharded-counter',
          },
          {
            subheading: 'Step 2: Install the component',
            paragraphs: [
              'Then, create a `convex.config.ts` file in your app\'s `convex/` folder and install the component by calling use:',
            ],
            code: `// convex/convex.config.ts
import { defineApp } from "convex/server";
import shardedCounter from "@convex-dev/sharded-counter/convex.config.js";

const app = defineApp();
app.use(shardedCounter);
export default app;`,
          },
          {
            subheading: 'Step 3: Create a ShardedCounter instance',
            paragraphs: [
              'Finally, create a new ShardedCounter within your convex/ folder, and point it to the installed component.',
            ],
            code: `import { components } from "./_generated/api";
import { ShardedCounter } from "@convex-dev/sharded-counter";

const counter = new ShardedCounter(components.shardedCounter);`,
          },
        ],
      },
      {
        heading: 'Updating and reading counters',
        paragraphs: [
          'Once you have a ShardedCounter, there are a few methods you can use to update the counter for a key in a mutation or action.',
        ],
        code: `await counter.add(ctx, "checkboxes", 5); // increment by 5
await counter.inc(ctx, "checkboxes"); // increment by 1
await counter.subtract(ctx, "checkboxes", 5); // decrement by 5
await counter.dec(ctx, "checkboxes"); // decrement by 1
await counter.reset(ctx, "checkboxes"); // reset to 0

const numCheckboxes = counter.for("checkboxes");
await numCheckboxes.inc(ctx); // increment
await numCheckboxes.dec(ctx); // decrement
await numCheckboxes.add(ctx, 5); // add 5
await numCheckboxes.subtract(ctx, 5); // subtract 5
await numCheckboxes.reset(ctx); // reset to 0

// And you can read the counter's value in a query, mutation, or action.
await counter.count(ctx, "checkboxes");
await numCheckboxes.count(ctx);`,
        codeBlocks: [
          {
            note: 'See more example usage in [example.ts](https://github.com/get-convex/sharded-counter/blob/main/example/convex/example.ts).',
          },
        ],
      },
      {
        heading: 'Sharding the counter',
        paragraphs: [
          'When a single document is modified by two mutations at the same time, the mutations slow down to achieve serializable results.',
          'To achieve high throughput, the ShardedCounter distributes counts across multiple documents, called "shards". Increments and decrements update a random shard, while queries of the total count read from all shards.',
          '**More shards** => greater throughput when incrementing or decrementing.',
          '**Fewer shards** => better latency when querying the count.',
          'You can set the number of shards when initializing the ShardedCounter, either setting it specially for each key:',
        ],
        code: `const counter = new ShardedCounter(components.shardedCounter, {
  shards: { checkboxes: 100 }, // 100 shards for the key "checkboxes"
});

// Or by setting a default that applies to all keys not specified in shards:
const counter = new ShardedCounter(components.shardedCounter, {
  shards: { checkboxes: 100 },
  defaultShards: 8,
});`,
        codeBlocks: [
          {
            note: 'The default number of shards if none is specified is 16.',
          },
          {
            note: 'Note your keys can be a subtype of string. e.g. if you want to store a count of friends for each user, and you don\'t care about throughput for a single user, you would declare ShardedCounter like so:',
            code: `const friendCounts = new ShardedCounter<Id<"users">>(
  components.shardedCounter,
  { defaultShards: 1 },
);

// Decrement a user's friend count by 1
await friendsCount.dec(ctx, userId);`,
          },
        ],
      },
      {
        heading: 'Reduce contention on reads',
        paragraphs: [
          'Reading the count with `counter.count(ctx, "checkboxes")` reads from all shards to get an accurate count. This takes a read dependency on all shard documents.',
          'In a query subscription, that means any change to the counter causes the query to rerun.',
          'In a mutation, that means any modification to the counter causes an OCC conflict.',
          'You can reduce contention by estimating the count: read from a smaller number of shards and extrapolate based on the total number of shards.',
          'You may change the number of shards for a key, by changing the second argument to the ShardedCounter constructor. If you decrease the number of shards, you will be left with extra shards that won\'t be written to but are still read when computing count. In this case, you should call `counter.rebalance` to delete the extraneous shards, which will even out the count across shards.',
          '**NOTE:** `counter.rebalance` reads and writes all shards, so it could cause more OCCs, and it\'s recommended you call it sparingly, from the Convex dashboard or from an infrequent cron.',
          '**NOTE:** counts are floats, and floating point arithmetic isn\'t infinitely precise. Even if you always add and subtract integers, you may get a fractional counts, especially if you use `estimateCount` or `rebalance`. Values distributed across shards may be added in different combinations, and floating point arithmetic isn\'t associative. You can use `Math.round` to ensure your final count is an integer, if desired.',
        ],
        code: `const estimatedCheckboxCount = await counter.estimateCount(ctx, "checkboxes");

// By default, this reads from a single random shard and multiplies by the total number
// of shards to form an estimate. You can improve the estimate by reading from more
// shards, at the cost of more contention:
const estimateFromThree = await counter.estimateCount(ctx, "checkboxes", 3);`,
        codeBlocks: [
          {
            note: 'If the counter was accumulated from many small `counter.inc` and `counter.dec` calls, then they should be uniformly distributed across the shards, so estimated counts will be accurate.',
          },
          {
            note: 'In some cases the counter will not be evenly distributed:\n• If the counter was accumulated from few operations\n• If some operations were `counter.add`s or `counter.subtract`s with large values, because each operation only changes a single shard\n• If the number of shards changed',
          },
          {
            note: 'In these cases, the count might not be evenly distributed across the shards. To repair such cases, you can call:',
            code: `await counter.rebalance(ctx, "checkboxes");`,
          },
        ],
      },
      {
        heading: 'Counting documents in a table',
        paragraphs: [
          'Often you want to use a sharded counter to track how many documents are in a table.',
          'If you want more than just a count, take a look at the [Aggregate component](https://www.npmjs.com/package/@convex-dev/aggregate).',
          'There are three ways to go about keeping a count in sync with a table:',
        ],
        code: `// 1. Be careful to always update the aggregate in any mutation that inserts or
// deletes from the table.

// 2. [Recommended] Place all writes to a table in separate TypeScript functions,
// and always call these functions from mutations instead of writing to the db
// directly. This method is recommended, because it encapsulates the logic for
// updating a table, while still keeping all operations explicit.
export const insertPair = mutation(async (ctx) => {
  ...
  await insertUser(ctx, user1);
  await insertUser(ctx, user2);
});

// All inserts to the "users" table go through this function.
async function insertUser(ctx, user) {
  await ctx.db.insert("users", user);
  await counter.inc(ctx, "users");
}

// 3. Register a Trigger, which automatically runs code when a mutation changes
// the data in a table.
const triggers = new Triggers<DataModel>();
triggers.register("mytable", counter.trigger("mycounter"));

export const mutation = customMutation(rawMutation, customCtx(triggers.wrapDB));`,
        codeBlocks: [
          {
            note: 'The `insertUserWithTrigger` mutation uses a trigger.',
          },
        ],
      },
      {
        heading: 'Backfilling an existing count',
        paragraphs: [
          'If you want to count items like documents in a table, you may already have documents before installing the ShardedCounter component, and these should be accounted for.',
          'The easy version of this is to calculate the value once and add that value, if there aren\'t active requests happening. You can also periodically re-calculate the value and update the counter, if there aren\'t in-flight requests.',
          'The tricky part is handling requests while doing the calculation: making sure to merge active updates to counts with old values that you want to backfill.',
        ],
      },
      {
        heading: 'Simple backfill: if table is append-only',
        paragraphs: [
          'See example code at the bottom of [example/convex/example.ts](https://github.com/get-convex/sharded-counter/blob/main/example/convex/example.ts).',
          'Walkthrough of steps:',
          '1. Change live writes to update the counter. In the example, you would be changing `insertUserBeforeBackfill` to be implemented as `insertUserAfterBackfill`.',
          '2. Write a backfill that counts documents that were created before the code from (1) deployed. In the example, this would be `backfillOldUsers`.',
          '3. Run `backfillOldUsers` from the dashboard.',
        ],
      },
      {
        heading: 'Complex backfill: if documents may be deleted',
        paragraphs: [
          'See example code at the bottom of [example/convex/example.ts](https://github.com/get-convex/sharded-counter/blob/main/example/convex/example.ts).',
          'Walkthrough of steps:',
          '1. Create `backfillCursor` table in `schema.ts`',
          '2. Create a new document in this table, with fields `{ creationTime: 0, id: "", isDone: false }`',
          '3. Wherever you want to update a counter based on a document changing, wrap the update in a conditional, so it only gets updated if the backfill has processed that document. In the example, you would be changing `insertUserBeforeBackfill` to be implemented as `insertUserDuringBackfill`.',
          '4. Define backfill functions similar to `backfillUsers` and `backfillUsersBatch`',
          '5. Call `backfillUsersBatch` from the dashboard.',
          '6. Remove the conditional when updating counters. In the example, you would be changing `insertUserDuringBackfill` to be implemented as `insertUserAfterBackfill`.',
          '7. Delete the `backfillCursor` table.',
        ],
      },
    ],
  },
  {
    id: 'geospatial',
    title: 'Geospatial',
    description: 'Efficiently query points on a map within a selected region of the globe.',
    icon: <MapPin size={48} />,
    ...getGradient(5, 'Database'),
    weeklyDownloads: 776,
    developer: 'get-convex',
    category: 'Database' as ComponentCategory,
    npmPackage: '@convex-dev/geospatial',
    repoUrl: 'https://github.com/get-convex/geospatial',
    packageUrl: 'https://www.npmjs.com/package/@convex-dev/geospatial',
    docsUrl: 'https://github.com/get-convex/geospatial#readme',
    docsLinks: [
      { label: 'Leaflet library', url: 'https://leafletjs.com/' },
    ],
    bugReportUrl: 'https://github.com/get-convex/geospatial/issues',
    exampleCommands: [
      'npm install',
      'cd example',
      'npm install',
      'npm run dev',
    ],
    longDescription: 'This component adds a geospatial index to Convex, allowing you to efficiently store and query points on the Earth\'s surface. Insert points into the geospatial key value store along with their geographic coordinates. Efficiently query for all points within a given rectangle on the sphere. Control the sort order for the results with a custom sorting key. Filter query results with equality and IN clauses. And since it\'s built on Convex, everything is automatically consistent, reactive, and cached!',
    features: [
      'Insert points with geographic coordinates (latitude, longitude).',
      'Efficiently query for all points within a given rectangle on the sphere.',
      'Control the sort order for results with a custom sorting key.',
      'Filter query results with equality and IN clauses.',
      'Query for the nearest points to a given location with optional distance limit.',
      'Automatic consistency, reactivity, and caching via Convex.',
      'Support for pagination with cursors for large result sets.',
      'Type-safe API with optional type parameters for keys and filter fields.',
      'Beta status with tested scalability up to ~1,000,000 points.',
    ],
    documentationSections: [
      {
        heading: 'Overview',
        paragraphs: [
          'This component adds a geospatial index to Convex, allowing you to efficiently store and query points on the Earth\'s surface.',
          'Insert points into the geospatial key value store along with their geographic coordinates. Efficiently query for all points within a given rectangle on the sphere. Control the sort order for the results with a custom sorting key. Filter query results with equality and IN clauses. And since it\'s built on Convex, everything is automatically consistent, reactive, and cached!',
          'This component is currently in beta. It\'s missing some functionality, but what\'s there should work. We\'ve tested the example app up to about 1,000,000 points, so reach out if you\'re using a much larger dataset.',
        ],
        codeBlocks: [
          {
            note: 'If you find a bug or have a feature request, you can [file it here](https://github.com/get-convex/geospatial/issues).',
          },
        ],
      },
      {
        heading: 'Pre-requisite: Convex',
        paragraphs: [
          'You\'ll need an existing Convex project to use the component. Convex is a hosted backend platform, including a database, serverless functions, and a ton more you can learn about [here](https://docs.convex.dev/home).',
          'Run `npm create convex` or follow any of the quickstarts to set one up.',
        ],
      },
      {
        heading: 'Installation',
        subsections: [
          {
            subheading: 'Step 1: Install the package',
            paragraphs: [
              'First, add @convex-dev/geospatial to your Convex project:',
            ],
            code: 'npm install @convex-dev/geospatial',
          },
          {
            subheading: 'Step 2: Install the component',
            paragraphs: [
              'Then, install the component into your Convex project within the `convex/convex.config.ts` file:',
            ],
            code: `// convex/convex.config.ts

import geospatial from "@convex-dev/geospatial/convex.config.js";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(geospatial);
export default app;`,
          },
          {
            subheading: 'Step 3: Create a GeospatialIndex instance',
            paragraphs: [
              'Finally, create a new GeospatialIndex within your `convex/` folder, and point it to the installed component:',
            ],
            code: `// convex/index.ts

import { GeospatialIndex } from "@convex-dev/geospatial";
import { components } from "./_generated/api";

const geospatial = new GeospatialIndex(components.geospatial);`,
          },
        ],
      },
      {
        heading: 'Inserting points',
        paragraphs: [
          'After installing the component, you can insert, get, and remove points from the index. You can specify a `filterKeys` record for filtering at query time and optionally a `sortKey` for the query result order. We currently only support ascending order on the `sortKey`.',
        ],
        code: `// convex/index.ts

const example = mutation({
  handler: async (ctx) => {
    const cityId = await ctx.db.insert("cities", {...});

    await geospatial.insert(
      ctx,
      "American Museum of Natural History",
      {
        latitude: 40.7813,
        longitude: -73.9737,
      },
      { category: "museum" },
      28.0, // Price used as the sort key
    );

    const result = await geospatial.get(ctx, cityId);
    await geospatial.remove(ctx, cityId);
  },
});`,
        codeBlocks: [
          {
            note: 'If you would like some more typesafety, you can specify a type argument for the `GeospatialIndex` class. This will also provide you with auto-complete for the `filterKeys` and `sortKey` parameters. Above the key was "American Museum of Natural History" but most commonly the key will be an ID in another table of yours.',
            code: `// convex/index.ts

import { GeospatialIndex, Point } from "@convex-dev/geospatial";
import { components } from "./_generated/api";
import { Id } from "./_generated/dataModel";

export const geospatial = new GeospatialIndex<
  Id<"museums">,
  { category: string; anotherFilter?: number }
>(components.geospatial);`,
          },
        ],
      },
      {
        heading: 'Querying points within a shape',
        paragraphs: [
          'After inserting some points, you can query them with the query API.',
        ],
        code: `// convex/index.ts

const example = query({
  handler: async (ctx) => {
    const rectangle = {
      west: -73.9712,
      south: 40.7831,
      east: -72.9712,
      north: 41.7831,
    };

    const result = await geospatial.query(ctx, {
      shape: { type: "rectangle", rectangle },
      limit: 16,
    });

    return result;
  },
});`,
        codeBlocks: [
          {
            note: 'This query will find all points that lie within the query rectangle, sort them in ascending `sortKey` order, and return at most 16 results.',
          },
        ],
      },
      {
        heading: 'Filtering query results',
        paragraphs: [
          'You can optionally add filter conditions to queries.',
        ],
        subsections: [
          {
            subheading: 'IN filter',
            paragraphs: [
              'The first type of filter condition is an `in()` filter, which requires that a matching document have a filter field with a value in a specified set.',
            ],
            code: `// convex/index.ts

const example = query({
  handler: async (ctx) => {
    const rectangle = {
      west: -73.9712,
      south: 40.7831,
      east: -72.9712,
      north: 41.7831,
    };

    const result = await geospatial.query(ctx, {
      shape: { type: "rectangle", rectangle },
      filter: (q) => q.in("category", ["museum", "restaurant"]),
    });

    return result;
  },
});`,
          },
          {
            subheading: 'Equality filter',
            paragraphs: [
              'The second type of filter condition is an `eq()` filter, which requires that a matching document have a filter field with a value equal to a specified value.',
            ],
            code: `// convex/index.ts

const example = query({
  handler: async (ctx) => {
    const result = await geospatial.query(ctx, {
      shape: { type: "rectangle", rectangle },
      filter: (q) => q.eq("category", "museum"),
    });

    return result;
  },
});`,
          },
          {
            subheading: 'Sort key range filter',
            paragraphs: [
              'The final type of filter condition allows you to specify ranges over the `sortKey`. We currently only support (optional) inclusive lower bounds and exclusive upper bounds.',
            ],
            code: `// convex/index.ts

const example = query({
  handler: async (ctx) => {
    const rectangle = {
      west: -73.9712,
      south: 40.7831,
      east: -72.9712,
      north: 41.7831,
    };

    const result = await geospatial.query(ctx, {
      shape: { type: "rectangle", rectangle },
      filter: (q) => q.gte("sortKey", 10).lt("sortKey", 30),
    });

    return result;
  },
});`,
          },
        ],
      },
      {
        heading: 'Pagination',
        paragraphs: [
          'Queries take in a `limit`, which bounds the maximum number of rows returned. If this limit is hit, the query will return a `nextCursor` for continuation. The query may also return a `nextCursor` with fewer than `limit` results if it runs out of its IO budget while executing.',
          'In either case, you can continue the stream by passing `nextCursor` to the next call\'s `cursor` parameter.',
        ],
        code: `// convex/index.ts

const example = query({
  handler: async (ctx) => {
    const rectangle = {
      west: -73.9712,
      south: 40.7831,
      east: -72.9712,
      north: 41.7831,
    };

    const startCursor = undefined;
    const result = await geospatial.query(
      ctx,
      {
        shape: { type: "rectangle", rectangle },
        limit: 16,
      },
      startCursor,
    );

    if (result.nextCursor) {
      // Continue the query, starting from the first query's cursor.
      const nextResult = await geospatial.query(
        ctx,
        {
          shape: { type: "rectangle", rectangle },
          limit: 16,
        },
        result.nextCursor,
      );

      return [...result.results, ...nextResult.results];
    }

    return result.results; // { key, coordinates }[]
  },
});`,
        codeBlocks: [
          {
            note: 'Note: you typically pass the `nextCursor` in from a client that is paginating through results, to avoid loading too much data in a single query.',
          },
        ],
      },
      {
        heading: 'Querying the points nearest a query point',
        paragraphs: [
          'You can also query for the points closest to a given point, optionally limiting to a maximum distance (in meters).',
        ],
        code: `// convex/index.ts

const example = query({
  handler: async (ctx) => {
    const maxResults = 16;
    const maxDistance = 10000;

    const result = await geospatial.queryNearest(
      ctx,
      { latitude: 40.7813, longitude: -73.9737 },
      maxResults,
      maxDistance,
    );

    return result;
  },
});`,
        codeBlocks: [
          {
            note: 'The `maxDistance` parameter is optional, but providing it can greatly speed up searching the index.',
          },
        ],
      },
      {
        heading: 'Example',
        paragraphs: [
          'See `example/` for a full example with a [Leaflet](https://leafletjs.com/)-based frontend.',
        ],
      },
      {
        heading: 'Development',
        paragraphs: [
          'Install dependencies and fire up the example app to get started.',
        ],
        code: `npm install
cd example
npm install
npm run dev`,
        codeBlocks: [
          {
            note: 'The component definition is in `src/` and reflects what users of the component will install. The example app, which is entirely independent, lives in `example/`.',
          },
        ],
      },
    ],
  },

  // Integrations
  {
    id: 'resend',
    title: 'Resend',
    description: 'Send reliable transactional emails to your users with Resend.',
    icon: <Mail size={48} />,
    gradientFrom: '#fed7aa',
    gradientTo: '#fde68a',
    weeklyDownloads: 8182,
    developer: 'get-convex',
    category: 'Integrations' as ComponentCategory,
    npmPackage: '@convex-dev/resend',
    repoUrl: 'https://github.com/get-convex/resend',
    packageUrl: 'https://www.npmjs.com/package/@convex-dev/resend',
    docsUrl: 'https://github.com/get-convex/resend#readme',
    docsLinks: [
      { label: 'Convex Actions runtime', url: 'https://docs.convex.dev/functions/actions#choosing-the-runtime-use-node' },
      { label: 'React Email setup', url: 'https://react.email/docs/getting-started/manual-setup#2-install-dependencies' },
      { label: 'React Email', url: 'https://react.email/' },
      { label: 'Resend test emails', url: 'https://resend.com/docs/dashboard/emails/send-test-emails#using-labels-effectively' },
    ],
    bugReportUrl: 'https://github.com/get-convex/resend/issues',
    videoUrl: 'https://www.youtube.com/watch?v=iIq67N8vuMU',
    exampleCommands: [
      'git clone https://github.com/get-convex/resend.git',
      'cd resend/example',
      'npm install',
      'npm run dev',
    ],
    longDescription: 'This component is the official way to integrate the Resend email service with your Convex project. It provides queueing, batching, durable execution, idempotency, and rate limiting to ensure reliable email delivery.',
    features: [
      'Queueing: Send as many emails as you want, as fast as you want—they\'ll all be delivered (eventually).',
      'Batching: Automatically batches large groups of emails and sends them to Resend efficiently.',
      'Durable execution: Uses Convex workpools to ensure emails are eventually delivered, even in the face of temporary failures or network outages.',
      'Idempotency: Manages Resend idempotency keys to guarantee emails are delivered exactly once, preventing accidental spamming from retries.',
      'Rate limiting: Honors API rate limits established by Resend.',
      'Webhook integration: Handle email status events (delivered, bounced, spam complaints) via webhooks.',
      'Email status tracking: Check email status and cancel emails before they\'re sent.',
      'React Email support: Generate HTML emails from JSX templates.',
      'Manual email sending: Fine-grained control for advanced use cases like attachments.',
      'Data retention management: Cleanup utilities for managing email history.',
    ],
    documentationSections: [
      {
        heading: 'Overview',
        paragraphs: [
          'This component is the official way to integrate the Resend email service with your Convex project.',
          'Navigate the Email MINEFIELD with the Resend Component!',
        ],
        codeBlocks: [
          {
            note: 'See [example](https://github.com/get-convex/resend/tree/main/example) for a demo of how to incorporate this hook into your application.',
          },
        ],
      },
      {
        heading: 'Installation',
        paragraphs: [
          'Install the package:',
        ],
        code: 'npm install @convex-dev/resend',
      },
      {
        heading: 'Get Started',
        paragraphs: [
          'Create a Resend account and grab an API key. Set it to `RESEND_API_KEY` in your deployment environment.',
          'Next, add the component to your Convex app via `convex/convex.config.ts`:',
        ],
        code: `import { defineApp } from "convex/server";
import resend from "@convex-dev/resend/convex.config.js";

const app = defineApp();
app.use(resend);

export default app;`,
      },
      {
        heading: 'Basic Usage',
        paragraphs: [
          'Then you can use it, as we see in `convex/sendEmails.ts`:',
        ],
        code: `import { components } from "./_generated/api";
import { Resend } from "@convex-dev/resend";
import { internalMutation } from "./_generated/server";

export const resend: Resend = new Resend(components.resend, {});

export const sendTestEmail = internalMutation({
  handler: async (ctx) => {
    await resend.sendEmail(ctx, {
      from: "Me <test@mydomain.com>",
      to: "delivered@resend.dev",
      subject: "Hi there",
      html: "This is a test email",
    });
  },
});`,
        codeBlocks: [
          {
            note: 'Then, calling `sendTestEmail` from anywhere in your app will send this test email.',
          },
          {
            note: 'If you want to send emails to real addresses, you need to disable `testMode`. You can do this in `ResendOptions`, as detailed below.',
          },
          {
            note: 'A note on test email addresses: Resend allows the use of labels for test emails. For simplicity, this component only allows labels matching `[a-zA-Z0-9_-]*`, e.g. `delivered+user-1@resend.dev`.',
          },
        ],
      },
      {
        heading: 'Setting up a Resend webhook',
        paragraphs: [
          'While the setup we have so far will reliably send emails, you don\'t have any feedback on anything delivering, bouncing, or triggering spam complaints. For that, we need to set up a webhook!',
          'On the Convex side, we need to mount an http endpoint to our project to route it to the Resend component in `convex/http.ts`:',
        ],
        code: `import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { resend } from "./sendEmails";

const http = httpRouter();

http.route({
  path: "/resend-webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    return await resend.handleResendEventWebhook(ctx, req);
  }),
});

export default http;`,
        codeBlocks: [
          {
            note: 'If our Convex project is `happy-leopard-123`, we now have a Resend webhook for our project running at `https://happy-leopard-123.convex.site/resend-webhook`.',
          },
          {
            note: 'So navigate to the Resend dashboard and create a new webhook at that URL. Make sure to enable all the `email.*` events; the other event types will be ignored.',
          },
          {
            note: 'Finally, copy the webhook secret out of the Resend dashboard and set it to the `RESEND_WEBHOOK_SECRET` environment variable in your Convex deployment.',
          },
          {
            note: 'You should now be seeing email status updates as Resend makes progress on your batches!',
          },
        ],
      },
      {
        heading: 'Registering an email status event handler',
        paragraphs: [
          'If you have your webhook established, you can also register an event handler in your apps you get notifications when email statuses change.',
          'Update your `sendEmails.ts` to look something like this:',
        ],
        code: `import { components, internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { vEmailId, vEmailEvent, Resend } from "@convex-dev/resend";

export const resend: Resend = new Resend(components.resend, {
  onEmailEvent: internal.example.handleEmailEvent,
});

export const handleEmailEvent = internalMutation({
  args: vOnEmailEventArgs,
  handler: async (ctx, args) => {
    // Handle however you want
    // args provides { id: EmailId; event: EmailEvent; }
    // see /example/example.ts
  },
});`,
        codeBlocks: [
          {
            note: 'Check out the `example/` project in this repo for a full demo.',
          },
        ],
      },
      {
        heading: 'Resend component options, and going into production',
        paragraphs: [
          'There is a `ResendOptions` argument to the component constructor to help customize it\'s behavior.',
          'Check out the docstrings, but notable options include:',
        ],
        codeBlocks: [
          {
            note: '**`apiKey`**: Provide the Resend API key instead of having it read from the environment variable.',
          },
          {
            note: '**`webhookSecret`**: Same thing, but for the webhook secret.',
          },
          {
            note: '**`testMode`**: Only allow delivery to test addresses. To keep you safe as you develop your project, `testMode` is default `true`. You need to explicitly set this to `false` for the component to allow you to enqueue emails to artibrary addresses.',
          },
          {
            note: '**`onEmailEvent`**: Your email event callback, as outlined above! Check out the docstrings for details on the events that are emitted.',
          },
        ],
      },
      {
        heading: 'Optional email sending parameters',
        paragraphs: [
          'In addition to basic `from`/`to`/`subject` and `html`/`plain` text bodies, the `sendEmail` method allows you to provide a list of `replyTo` addresses, and other email headers.',
        ],
      },
      {
        heading: 'Tracking, getting status, and cancelling emails',
        paragraphs: [
          'The `sendEmail` method returns a branded type, `EmailId`. You can use this for a few things:',
        ],
        codeBlocks: [
          {
            note: 'To reassociate the original email during status changes in your email event handler.',
          },
          {
            note: 'To check on the status any time using `resend.status(ctx, emailId)`.',
          },
          {
            note: 'To cancel the email using `resend.cancelEmail(ctx, emailId)`. If the email has already been sent to the Resend API, it cannot be cancelled. Cancellations do not trigger an email event.',
          },
        ],
      },
      {
        heading: 'Data retention',
        paragraphs: [
          'This component retains "finalized" (delivered, cancelled, bounced) emails. It\'s your responsibility to clear out those emails on your own schedule. You can run `cleanupOldEmails` and `cleanupAbandonedEmails` from the dashboard, under the "resend" component tab in the function runner, or set up a cron job.',
          'If you pass no argument, it defaults to deleting emails older than 7 days.',
          'If you don\'t care about historical email status, the recommended approach is to use a cron job, as shown below:',
        ],
        code: `// in convex/crons.ts

import { cronJobs } from "convex/server";
import { components, internal } from "./_generated/api.js";
import { internalMutation } from "./_generated/server.js";

const crons = cronJobs();
crons.interval(
  "Remove old emails from the resend component",
  { hours: 1 },
  internal.crons.cleanupResend,
);

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const cleanupResend = internalMutation({
  args: {},
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(0, components.resend.lib.cleanupOldEmails, {
      olderThan: ONE_WEEK_MS,
    });
    await ctx.scheduler.runAfter(
      0,
      components.resend.lib.cleanupAbandonedEmails,
      // These generally indicate a bug, so keep them around for longer.
      { olderThan: 4 * ONE_WEEK_MS },
    );
  },
});

export default crons;`,
      },
      {
        heading: 'Using React Email',
        paragraphs: [
          'You can use React Email to generate your HTML for you from JSX.',
          'First install the dependencies:',
        ],
        code: `npm install @react-email/components react react-dom react-email @react-email/render`,
        codeBlocks: [
          {
            note: 'Then create a new `.tsx` file in your Convex directory e.g. `/convex/emails.tsx`:',
            code: `// IMPORTANT: this is a Convex Node Action
"use node";

import { action } from "./_generated/server";
import { render, pretty } from "@react-email/render";
import { Button, Html } from "@react-email/components";
import { components } from "./_generated/api";
import { Resend } from "@convex-dev/resend";

export const resend: Resend = new Resend(components.resend, {
  testMode: false,
});

export const sendEmail = action({
  args: {},
  handler: async (ctx, args) => {
    // 1. Generate the HTML from your JSX
    // This can come from a custom component in your /emails/ directory
    // if you would like to view your templates locally. For more info see:
    // https://react.email/docs/getting-started/manual-setup#5-run-locally
    const html = await pretty(
      await render(
        <Html>
          <Button
            href="https://example.com"
            style={{ background: "#000", color: "#fff", padding: "12px 20px" }}
          >
            Click me
          </Button>
        </Html>,
      ),
    );

    // 2. Send your email as usual using the component
    await resend.sendEmail(ctx, {
      from: "Me <test@mydomain.com>",
      to: "delivered@resend.dev",
      subject: "Hi there",
      html,
    });
  },
});`,
          },
          {
            note: '[!WARNING] React Email requires some Node dependencies thus it must run in a Convex Node action and not a regular Action.',
          },
        ],
      },
      {
        heading: 'Sending emails manually, e.g. for attachments',
        paragraphs: [
          'If you need something that the component doesn\'t provide (it is currently limited by what is supported by the batch API in Resend), you can send emails manually. This is the preferred approach, because you have fine-grained control over the email sending process, and can track its progress manually using the component\'s public APIs.',
        ],
        code: `import { components, internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { Resend as ResendComponent } from "@convex-dev/resend";
import { Resend } from "resend";

const resend = new Resend("re_xxxxxxxxx");

export const resendResendComponent = new ResendComponent(components.resend, {});

export const sendManualEmail = internalMutation({
  args: {},
  handler: async (ctx, args) => {
    const from = "Acme <onboarding@resend.dev>";
    const to = ["delivered@resend.dev"];
    const subject = "hello world";
    const html = "<p>it works!</p>";

    const emailId = await resend.sendEmailManually(
      ctx,
      { from, to, subject },
      async (emailId) => {
        const data = await resend.emails.send({
          from,
          to,
          subject,
          html,
          headers: [
            {
              name: "Idempotency-Key",
              value: emailId,
            },
          ],
        });
        return data.id;
      },
    );
  },
});`,
      },
    ],
  },
  {
    id: 'cloudflare-r2',
    title: 'Cloudflare R2',
    description: 'Store and serve files from Cloudflare R2.',
    icon: <Cloud size={48} />,
    ...getGradient(1, 'Integrations'),
    weeklyDownloads: 4573,
    developer: 'get-convex',
    category: 'Integrations' as ComponentCategory,
    npmPackage: '@convex-dev/r2',
    repoUrl: 'https://github.com/get-convex/r2',
    packageUrl: 'https://www.npmjs.com/package/@convex-dev/r2',
    docsUrl: 'https://github.com/get-convex/r2#readme',
    docsLinks: [
      { label: 'Convex docs', url: 'https://docs.convex.dev/home' },
      { label: 'Cloudflare', url: 'https://www.cloudflare.com/' },
      { label: 'Create R2 buckets', url: 'https://developers.cloudflare.com/r2/buckets/create-buckets/' },
      { label: 'CORS configuration', url: 'https://developers.cloudflare.com/r2/buckets/cors/#add-cors-policies-from-the-dashboard' },
    ],
    bugReportUrl: 'https://github.com/get-convex/r2/issues',
    exampleCommands: [
      'git clone https://github.com/get-convex/r2.git',
      'cd r2/example',
      'npm install',
      'npm run dev',
    ],
    longDescription: 'Store and serve files with Cloudflare R2. This component provides hooks for React and Svelte that handle the entire upload process, including generating signed URLs, uploading files to R2, and storing file metadata in your Convex database.',
    features: [
      'Upload files from React or Svelte using convenient hooks.',
      'Generate signed URLs for secure file uploads.',
      'Store file metadata automatically in your Convex database.',
      'Store files directly from actions (server-side storage).',
      'Generate URLs to serve files to users with customizable expiration times.',
      'Delete files via actions or mutations.',
      'Access and list file metadata (ContentType, ContentLength, LastModified).',
      'Support for custom object keys.',
      'Callback hooks for upload validation and post-upload processing.',
      'Pagination support for listing metadata.',
    ],
    documentationSections: [
      {
        heading: 'Overview',
        paragraphs: [
          'Store and serve files with Cloudflare R2.',
        ],
        code: `// or @convex-dev/r2/svelte for Svelte!
import { useUploadFile } from "@convex-dev/r2/react";

// Upload files from React
const uploadFile = useUploadFile(api.example);
// ...in a callback
const key = await uploadFile(file);

// Access files on the server
const url = await r2.getUrl(key);
const response = await fetch(url);`,
        codeBlocks: [
          {
            note: 'Check out the [example app](https://github.com/get-convex/r2/tree/main/example) for a complete example.',
          },
        ],
      },
      {
        heading: 'Prerequisites',
        subsections: [
          {
            subheading: 'Cloudflare Account',
            paragraphs: [
              'Create a Cloudflare account',
              'Create an R2 bucket',
              'Set the bucket name as an environment variable `R2_BUCKET` in your Convex deployment via `npx convex env set R2_BUCKET <bucket-name>`.',
              'Add a CORS policy to the bucket allowing GET and PUT requests from your Convex app. You can also use `\'*\'` to allow all origins (use with caution).',
            ],
            code: `[
  {
    "AllowedOrigins": ["http://localhost:5173"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["Content-Type"]
  }
]`,
          },
          {
            subheading: 'Create an API token',
            paragraphs: [
              'On the main R2 page in your Cloudflare dashboard, click **Manage R2 API Tokens**',
              'Click **Create API Token**',
              'Edit the token name',
              'Set permissions to **Object Read & Write**',
              'Under **Specify bucket**, select the bucket you created above',
              'Optionally change TTL',
              'Click **Create API Token**',
            ],
          },
          {
            subheading: 'Record credentials',
            paragraphs: [
              'On the next screen you\'ll be provided with four values that you\'ll need later:',
              '**Token Value**: `R2_TOKEN`',
              '**Access Key ID**: `R2_ACCESS_KEY_ID`',
              '**Secret Access Key**: `R2_SECRET_ACCESS_KEY`',
              '**Endpoint**: `R2_ENDPOINT`',
            ],
          },
          {
            subheading: 'Convex App',
            paragraphs: [
              'You\'ll need a Convex App to use the component. Follow any of the [Convex quickstarts](https://docs.convex.dev/home) to set one up.',
            ],
          },
        ],
      },
      {
        heading: 'Installation',
        subsections: [
          {
            subheading: 'Step 1: Install the package',
            paragraphs: [
              'Install the component package:',
            ],
            code: 'npm install @convex-dev/r2',
          },
          {
            subheading: 'Step 2: Install the component',
            paragraphs: [
              'Create a `convex.config.ts` file in your app\'s `convex/` folder and install the component by calling `use`:',
            ],
            code: `// convex/convex.config.ts
import { defineApp } from "convex/server";
import r2 from "@convex-dev/r2/convex.config.js";

const app = defineApp();
app.use(r2);

export default app;`,
          },
          {
            subheading: 'Step 3: Set API credentials',
            paragraphs: [
              'Set your API credentials using the values you recorded earlier:',
            ],
            code: `npx convex env set R2_TOKEN xxxxx
npx convex env set R2_ACCESS_KEY_ID xxxxx
npx convex env set R2_SECRET_ACCESS_KEY xxxxx
npx convex env set R2_ENDPOINT xxxxx
npx convex env set R2_BUCKET xxxxx`,
          },
        ],
        codeBlocks: [
          {
            note: 'Note: All of these values can also be supplied as the second argument to `R2`. This enables storing values in multiple buckets using the same component. It also enables dynamically setting the values at runtime.',
          },
        ],
      },
      {
        heading: 'Uploading files',
        paragraphs: [
          'File uploads to R2 typically use signed urls. The R2 component provides hooks for React and Svelte that handle the entire upload process:',
        ],
        codeBlocks: [
          {
            note: '1. generates the signed url',
          },
          {
            note: '2. uploads the file to R2',
          },
          {
            note: '3. stores the file\'s metadata in your Convex database',
          },
        ],
        subsections: [
          {
            subheading: 'Instantiate the R2 client',
            paragraphs: [
              'Instantiate a R2 component client in a file in your app\'s `convex/` folder:',
            ],
            code: `// convex/example.ts
import { R2 } from "@convex-dev/r2";
import { components } from "./_generated/api";

export const r2 = new R2(components.r2);

export const { generateUploadUrl, syncMetadata } = r2.clientApi({
  checkUpload: async (ctx, bucket) => {
    // const user = await userFromAuth(ctx);
    // ...validate that the user can upload to this bucket
  },
  onUpload: async (ctx, bucket, key) => {
    // ...do something with the key
    // This technically runs in the \`syncMetadata\` mutation, as the upload
    // is performed from the client side. Will run if using the \`useUploadFile\`
    // hook, or if \`syncMetadata\` function is called directly. Runs after the
    // \`checkUpload\` callback.
  },
});`,
          },
          {
            subheading: 'React example',
            paragraphs: [
              'Use the `useUploadFile` hook in your component to upload files:',
            ],
            code: `// src/App.tsx
import { FormEvent, useRef, useState } from "react";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { useUploadFile } from "@convex-dev/r2/react";

export default function App() {
  // Passing the entire api exported from \`convex/example.ts\` to the hook.
  // This must include \`generateUploadUrl\` and \`syncMetadata\` from the r2 client api.
  const uploadFile = useUploadFile(api.example);
  const imageInput = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  async function handleUpload(event: FormEvent) {
    event.preventDefault();
    // The file is uploaded to R2, metadata is synced to the database, and the
    // key of the newly created object is returned.
    await uploadFile(selectedImage!);
    setSelectedImage(null);
    imageInput.current!.value = "";
  }

  return (
    <form onSubmit={handleUpload}>
      <input
        type="file"
        accept="image/*"
        ref={imageInput}
        onChange={(event) => setSelectedImage(event.target.files![0])}
        disabled={selectedImage !== null}
      />
      <input
        type="submit"
        value="Upload"
        disabled={selectedImage === null}
      />
    </form>
  );
}`,
          },
          {
            subheading: 'Svelte example',
            code: `<script lang="ts">
   import { useUploadFile } from "@convex-dev/r2/svelte";
   import { api } from "../convex/_generated/api";

   const uploadFile = useUploadFile(api.example);
   let selectedImage = $state<File | null>(null);

   async function handleUpload(file: File) {
     await uploadFile(file);
     selectedImage = null;
   }
 </script>

 <form
   onsubmit={() => {
     if (selectedImage) handleUpload(selectedImage);
   }}
 >
   <input
     type="file"
     accept="image/*"
     onchange={(e) => {
       selectedImage = e.currentTarget.files?.[0] ?? null;
     }}
     disabled={selectedImage !== null}
   />
   <button type="submit" disabled={selectedImage === null}> Upload </button>
 </form>`,
          },
        ],
      },
      {
        heading: 'Using a custom object key',
        paragraphs: [
          'The `r2.generateUploadUrl` function generates a uuid to use as the object key by default, but a custom key can be provided if desired. Note: the `generateUploadUrl` function returned by `r2.clientApi` does not accept a custom key, as that function is a mutation to be called from the client side and you don\'t want your client defining your object keys. Providing a custom key requires making your own mutation that calls the `generateUploadUrl` method of the `r2` instance.',
        ],
        code: `// convex/example.ts
import { R2 } from "@convex-dev/r2";
import { components } from "./_generated/api";

export const r2 = new R2(components.r2);

// A custom mutation that creates a key from the user id and a uuid. If the key
// already exists, the mutation will fail.
export const generateUploadUrlWithCustomKey = mutation({
  args: {},
  handler: async (ctx) => {
    // Replace this with whatever function you use to get the current user
    const currentUser = await getUser(ctx);
    if (!currentUser) {
      throw new Error("User not found");
    }
    const key = \`\${currentUser.id}.\${crypto.randomUUID()}\`;
    return r2.generateUploadUrl(key);
  },
});`,
      },
      {
        heading: 'Storing Files from Actions',
        paragraphs: [
          'Files can be stored in R2 directly from actions using the `r2.store` method. This is useful when you need to store files that are generated or downloaded on the server side.',
        ],
        code: `// convex/example.ts
import { internalAction } from "./_generated/server";
import { R2 } from "@convex-dev/r2";

const r2 = new R2(components.r2);

export const store = internalAction({
  handler: async (ctx) => {
    // Download a random image from picsum.photos
    const url = "https://picsum.photos/200/300";
    const response = await fetch(url);
    const blob = await response.blob();

    // This function call is the only required part, it uploads the blob to R2,
    // syncs the metadata, and returns the key. The key is a uuid by default, but
    // an optional custom key can be provided in the options object. A MIME type
    // can also be provided, which will override the type inferred for blobs.
    const key = await r2.store(ctx, blob, {
      key: "my-custom-key",
      type: "image/jpeg",
    });

    // Example use case, associate the key with a record in your database
    await ctx.runMutation(internal.example.insertImage, { key });
  },
});`,
        codeBlocks: [
          {
            note: 'The `store` method:\n• Takes a `Blob`, `Buffer`, or `Uint8Array` and stores it in R2\n• Syncs metadata to your Convex database\n• Returns the key that can be used to access the file later',
          },
        ],
      },
      {
        heading: 'Serving Files',
        paragraphs: [
          'Files stored in R2 can be served to your users by generating a URL pointing to a given file.',
        ],
        subsections: [
          {
            subheading: 'Generating file URLs in queries',
            paragraphs: [
              'The simplest way to serve files is to return URLs along with other data required by your app from queries and mutations.',
              'A file URL can be generated from a object key by the `r2.getUrl` function of the R2 component client.',
            ],
            code: `// convex/listMessages.ts
import { components } from "./_generated/api";
import { query } from "./_generated/server";
import { R2 } from "@convex-dev/r2";

const r2 = new R2(components.r2);

export const list = query({
  args: {},
  handler: async (ctx) => {
    // In this example, messages have an imageKey field with the object key
    const messages = await ctx.db.query("messages").collect();
    return Promise.all(
      messages.map(async (message) => ({
        ...message,
        imageUrl: await r2.getUrl(
          message.imageKey,
          // Options object is optional, can be omitted
          {
            // Custom expiration time in seconds, default is 900 (15 minutes)
            expiresIn: 60 * 60 * 24, // 1 day
          },
        ),
      })),
    );
  },
});`,
          },
          {
            subheading: 'Using URLs in components',
            paragraphs: [
              'File URLs can be used in img elements to render images:',
            ],
            code: `// src/App.tsx
function Image({ message }: { message: { url: string } }) {
  return <img src={message.url} height="300px" width="auto" />;
}`,
          },
        ],
      },
      {
        heading: 'Deleting Files',
        paragraphs: [
          'Files stored in R2 can be deleted from actions or mutations via the `r2.deleteObject` function, which accepts an object key.',
        ],
        code: `// convex/images.ts
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { R2 } from "@convex-dev/r2";

const r2 = new R2(components.r2);

export const deleteObject = mutation({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    return await r2.deleteObject(ctx, args.key);
  },
});`,
      },
      {
        heading: 'Accessing File Metadata',
        paragraphs: [
          'File metadata of an R2 file can be accessed from actions via `r2.getMetadata`:',
        ],
        code: `// convex/images.ts
import { v } from "convex/values";
import { query } from "./_generated/server";
import { R2 } from "@convex-dev/r2";

const r2 = new R2(components.r2);

export const getMetadata = query({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    return await r2.getMetadata(args.key);
  },
});`,
        codeBlocks: [
          {
            note: 'This is an example of the returned document:',
            code: `{
  "ContentType": "image/jpeg",
  "ContentLength": 125338,
  "LastModified": "2024-03-20T12:34:56Z"
}`,
          },
          {
            note: 'The returned document has the following fields:\n• `ContentType`: the ContentType of the file if it was provided on upload\n• `ContentLength`: the size of the file in bytes\n• `LastModified`: the last modified date of the file',
          },
        ],
      },
      {
        heading: 'Listing and paginating metadata',
        paragraphs: [
          'Metadata can be listed or paginated from actions via `r2.listMetadata` and `r2.pageMetadata`.',
        ],
        code: `// convex/example.ts
import { query } from "./_generated/server";
import { R2 } from "@convex-dev/r2";

const r2 = new R2(components.r2);

export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return r2.listMetadata(ctx, args.limit);
  },
});

export const page = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return r2.pageMetadata(ctx, args.paginationOpts);
  },
});`,
      },
      {
        heading: 'Accessing metadata after upload',
        paragraphs: [
          'The `onSyncMetadata` callback can be used to run a mutation after every metadata sync. The `useUploadFile` hook syncs metadata after every upload, so this function will run each time as well.',
          'Because this runs after metadata sync, the `r2.getMetadata` can be used to access the metadata of the newly uploaded file.',
        ],
        code: `// convex/example.ts
import { R2, type R2Callbacks } from "@convex-dev/r2";
import { components } from "./_generated/api";

export const r2 = new R2(components.r2);

const callbacks: R2Callbacks = internal.example;

export const { generateUploadUrl, syncMetadata, onSyncMetadata } = r2.clientApi(
  {
    // Pass the functions from this file back into the component.
    // Technically only an object with \`onSyncMetadata\` is required, the recommended
    // pattern is just for convenience.
    callbacks,

    onSyncMetadata: async (ctx, args) => {
      // args: { bucket: string; key: string; isNew: boolean }
      // args.isNew is true if the key did not previously exist in your Convex R2
      // metadata table
      const metadata = await r2.getMetadata(ctx, args.key);
      // log metadata of synced object
      console.log("metadata", metadata);
    },
  },
);`,
      },
    ],
  },
  {
    id: 'collaborative-text-editor',
    title: 'Collaborative Text Editor Sync',
    description: 'Add a collaborative editor sync engine for the popular ProseMirror-based Tiptap and BlockNote rich text editors.',
    icon: <FileText size={48} />,
    ...getGradient(2, 'Integrations'),
    weeklyDownloads: 1645,
    developer: 'get-convex',
    category: 'Integrations' as ComponentCategory,
    npmPackage: '@convex-dev/prosemirror-sync',
    repoUrl: 'https://github.com/get-convex/prosemirror-sync',
    packageUrl: 'https://www.npmjs.com/package/@convex-dev/prosemirror-sync',
    docsUrl: 'https://github.com/get-convex/prosemirror-sync#readme',
    docsLinks: [
      { label: 'Stack post', url: 'https://stack.convex.dev/add-a-collaborative-document-editor-to-your-app' },
      { label: 'Contributing', url: 'https://github.com/get-convex/prosemirror-sync/blob/main/CONTRIBUTING.md' },
      { label: 'Example code', url: 'https://github.com/get-convex/prosemirror-sync/blob/main/example/convex/example.ts' },
      { label: 'Example component', url: 'https://github.com/get-convex/prosemirror-sync/blob/main/example/src/App.tsx' },
      { label: 'ProseMirror Transform', url: 'https://prosemirror.net/docs/ref/#transform.Transform' },
      { label: 'BlockNote node conversions', url: 'https://github.com/TypeCellOS/BlockNote/tree/main/packages/core/src/api/nodeConversions' },
    ],
    bugReportUrl: 'https://github.com/get-convex/prosemirror-sync/issues',
    videoUrl: 'https://www.youtube.com/watch?v=TGd-Nl7PBYQ',
    exampleCommands: [
      'git clone https://github.com/get-convex/prosemirror-sync.git',
      'cd prosemirror-sync/example',
      'npm install',
      'npm run dev',
    ],
    longDescription: 'Add a collaborative editor that syncs to the cloud. With this component, users can edit the same document in multiple tabs or devices, and the changes will be synced to the cloud. The data lives in your Convex database, and can be stored alongside the rest of your app\'s data. Just configure your editor features, add this component to your Convex backend, and use the provided sync React hook.',
    features: [
      'Safely merges changes between clients via operational transformations (OT).',
      'Simple React hook to fetch the initial document and keep it in sync via a Tiptap extension.',
      'Supports both Tiptap and BlockNote editors.',
      'Server-side entrypoints for authorizing reads, writes, and snapshots.',
      'Create a new document, online or offline.',
      'Debounced snapshots allow new clients to avoid reading the full history.',
      'Deletion API for old snapshots & steps.',
      'Transform the document server-side, enabling easy AI interoperation.',
      'Real-time collaborative editing with automatic conflict resolution.',
      'Works with React hooks for seamless integration.',
    ],
    documentationSections: [
      {
        heading: 'Overview',
        paragraphs: [
          'Add a collaborative editor that syncs to the cloud. With this component, users can edit the same document in multiple tabs or devices, and the changes will be synced to the cloud. The data lives in your Convex database, and can be stored alongside the rest of your app\'s data.',
          'Just configure your editor features, add this component to your Convex backend, and use the provided sync React hook.',
        ],
        code: `function CollaborativeEditor() {
  const sync = useBlockNoteSync(api.prosemirrorSync, "some-id");

  return sync.isLoading ? (
    <p>Loading...</p>
  ) : sync.editor ? (
    <BlockNoteView editor={sync.editor} />
  ) : (
    <button onClick={() => sync.create(EMPTY_DOC)}>Create document</button>
  );
}`,
        codeBlocks: [
          {
            note: 'For the editor, you can choose to use Tiptap or BlockNote. Go with BlockNote unless you want to customize the editor heavily.',
          },
          {
            note: '**Tiptap** is based on ProseMirror and saves you a lot of configuration compared to using the ProseMirror editor directly. It has a rich ecosystem of extensions, and is very customizable.',
          },
          {
            note: '**BlockNote** is based on Tiptap and has a nicer UI and experience out of the box, at the cost of being harder to extend and customize for advanced usecases. If you\'re looking for the easiest way to get all the fancy formatting options, this is it.',
          },
          {
            note: 'Unfortunately, even though they both are based on ProseMirror, the data model differs, so it\'s not trivial to switch editors later on without migrating all of the data, so you might experiment with both before launching publicly.',
          },
        ],
      },
      {
        heading: 'Pre-requisite: Convex',
        paragraphs: [
          'You\'ll need an existing Convex project to use the component. Convex is a hosted backend platform, including a database, serverless functions, and a ton more you can learn about [here](https://docs.convex.dev/home).',
          'Run `npm create convex` or follow any of the quickstarts to set one up.',
        ],
      },
      {
        heading: 'Installation',
        subsections: [
          {
            subheading: 'Step 1: Install the package',
            paragraphs: [
              'Install the component package:',
            ],
            code: 'npm install @convex-dev/prosemirror-sync',
          },
          {
            subheading: 'Step 2: Install the component',
            paragraphs: [
              'Create a `convex.config.ts` file in your app\'s `convex/` folder and install the component by calling use:',
            ],
            code: `// convex/convex.config.ts
import { defineApp } from "convex/server";
import prosemirrorSync from "@convex-dev/prosemirror-sync/convex.config.js";

const app = defineApp();
app.use(prosemirrorSync);

export default app;`,
          },
        ],
      },
      {
        heading: 'Usage',
        paragraphs: [
          'To use the component, you expose the API in a file in your `convex/` folder, and use the editor-specific sync React hook, passing in a reference to the API you defined. For this example, we\'ll create the API in `convex/example.ts`.',
        ],
        code: `// convex/example.ts
import { components } from "./_generated/api";
import { ProsemirrorSync } from "@convex-dev/prosemirror-sync";

const prosemirrorSync = new ProsemirrorSync(components.prosemirrorSync);

export const {
  getSnapshot,
  submitSnapshot,
  latestVersion,
  getSteps,
  submitSteps,
} = prosemirrorSync.syncApi({
  // ...
});`,
        codeBlocks: [
          {
            note: 'In your React components, you can then use the editor-specific hook to fetch the document and keep it in sync via a Tiptap extension. Note: This requires a ConvexProvider to be in the component tree.',
          },
        ],
      },
      {
        heading: 'BlockNote editor',
        paragraphs: [
          'IMPORTANT: BlockNote doesn\'t currently support `<StrictMode>` in React 19. If you\'re using React 19, make sure you remove any `<React.StrictMode>` blocks and set `reactStrictMode: false` in your `next.config.ts` if applicable.',
        ],
        code: `// src/MyComponent.tsx
import { useBlockNoteSync } from "@convex-dev/prosemirror-sync/blocknote";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { api } from "../convex/_generated/api";
import { BlockNoteEditor } from "@blocknote/core";

export function MyComponent() {
  const sync = useBlockNoteSync<BlockNoteEditor>(api.example, "some-id");

  return sync.isLoading ? (
    <p>Loading...</p>
  ) : sync.editor ? (
    <BlockNoteView editor={sync.editor} />
  ) : (
    <button onClick={() => sync.create({ type: "doc", content: [] })}>
      Create document
    </button>
  );
}`,
      },
      {
        heading: 'Tiptap editor',
        paragraphs: [
          'In your React components, you can use the `useTiptapSync` hook to fetch the initial document and keep it in sync via a Tiptap extension. Note: This requires a ConvexProvider to be in the component tree.',
        ],
        code: `// src/MyComponent.tsx
import { useTiptapSync } from "@convex-dev/prosemirror-sync/tiptap";
import { EditorContent, EditorProvider } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { api } from "../convex/_generated/api";

export function MyComponent() {
  const sync = useTiptapSync(api.example, "some-id");

  return sync.isLoading ? (
    <p>Loading...</p>
  ) : sync.initialContent !== null ? (
    <EditorProvider
      content={sync.initialContent}
      extensions={[StarterKit, sync.extension]}
    >
      <EditorContent editor={null} />
    </EditorProvider>
  ) : (
    <button onClick={() => sync.create({ type: "doc", content: [] })}>
      Create document
    </button>
  );
}`,
        codeBlocks: [
          {
            note: 'See a working example in [example.ts](https://github.com/get-convex/prosemirror-sync/blob/main/example/convex/example.ts) and [App.tsx](https://github.com/get-convex/prosemirror-sync/blob/main/example/src/App.tsx).',
          },
        ],
      },
      {
        heading: 'Configuring the snapshot debounce interval',
        paragraphs: [
          'The snapshot debounce interval is set to one second by default. You can specify a different interval with the `snapshotDebounceMs` option when calling `useTiptapSync` or `useBlockNoteSync`.',
          'A snapshot won\'t be sent until both of these are true:',
        ],
        codeBlocks: [
          {
            note: '1. The document has been idle for the debounce interval.',
          },
          {
            note: '2. The current user was the last to make a change.',
          },
          {
            note: 'There can be races, but since each client will submit the snapshot for their own change, they won\'t conflict with each other and are safe to apply.',
          },
        ],
      },
      {
        heading: 'Creating a new document',
        paragraphs: [
          'You can create a new document from the client by calling `sync.create(content)`, or on the server by calling `prosemirrorSync.create(ctx, id, content)`.',
          'The content should be a JSON object matching the Schema. If you\'re using BlockNote, it needs to be the ProseMirror JSON representation of the BlockNote blocks. Look at the value stored in the snapshots table in your database for an example. Both can use this value: `{ type: "doc", content: [] }`',
        ],
        codeBlocks: [
          {
            note: 'For client-side document creation:\n• While it\'s safest to wait until the server confirms the document doesn\'t exist yet (`!sync.isLoading`), you can choose to call it while offline with a newly created ID to start editing a new document before you reconnect.\n• When the client next connects and syncs the document, it will submit the initial version and all local changes as steps.\n• If multiple clients create the same document, it will fail if they submit different initial content.',
          },
          {
            note: 'Note: if you don\'t open that document while online, it won\'t sync.',
          },
        ],
      },
      {
        heading: 'Transforming the document server-side',
        paragraphs: [
          'You can transform the document server-side. It will give you the latest version of the document, and you return a ProseMirror Transform.',
          'You can make this transform via `new Transform(doc)` or, if you are hydrating a full EditorState, you can use `Editor.create({doc}).tr` to create a new Transaction (which is a subclass of Transform).',
        ],
        code: `import { getSchema } from "@tiptap/core";
import { EditorState } from "@tiptap/pm/state";

export const transformExample = action({
  args: {
    id: v.string(),
  },
  handler: async (ctx, { id }) => {
    const schema = getSchema(extensions);
    await prosemirrorSync.transform(ctx, id, schema, (doc) => {
      const tr = EditorState.create({ doc }).tr;
      tr.insertText("Hello, world!", 0);
      return tr;
    });
  },
});`,
        codeBlocks: [
          {
            note: 'The extensions should be the same as the ones used by your client editor, for any extensions that affect the schema (not the sync extension).',
          },
          {
            note: 'The transform function can be called multiple times if the document is being modified concurrently. Ideally this callback doesn\'t do any slow operations internally. Instead, do them beforehand.',
          },
          {
            note: 'The doc may differ from the one returned from `getDoc`. You can compare the version returned from `getDoc` to the second argument to the transform function to see if the document has changed.',
          },
          {
            note: 'The transform function can return a `null` value to abort making changes.',
          },
          {
            note: 'If you\'re passing along a position to insert the text, be aware that changes happening in parallel may cause the position to change. You can pass more stable identifiers, or use the ProseMirror mapping capabilities to map the position between different versions by fetching the steps between the versions fetched with `(component).lib.getSteps`.',
          },
          {
            note: 'If you\'re using BlockNote, you\'ll need to convert the BlockNote blocks between BlockNote blocks and ProseMirror nodes. See [blockToNode and nodeToBlock](https://github.com/TypeCellOS/BlockNote/tree/main/packages/core/src/api/nodeConversions).',
          },
        ],
      },
      {
        heading: 'Example: AI transformation with slower operations',
        paragraphs: [
          'An example of doing slower AI operations beforehand:',
        ],
        code: `import { Transform } from "@tiptap/pm/transform";

// An example of doing slower AI operations beforehand:
const schema = getSchema(extensions);
const { doc, version } = await prosemirrorSync.getDoc(ctx, id, schema);
const content = await generateAIContent(doc);

await prosemirrorSync.transform(ctx, id, schema, (doc, v) => {
  if (v !== version) {
    // Decide what to do if the document changes.
  }
  // An example of using Transform directly.
  const tr = new Transform(doc);
  tr.insert(0, schema.text(content));
  return tr;
});`,
      },
      {
        heading: 'Future features',
        paragraphs: [
          'Features that could be added later:',
        ],
        codeBlocks: [
          {
            note: '• Offline editing support: cache the document and local changes in sessionStorage and sync when back online (only for active browser tab).',
          },
          {
            note: '• Also save snapshots (but not local edits) to localStorage so new tabs can see and edit documents offline (but won\'t see edits from other tabs until they\'re back online).',
          },
          {
            note: '• Configuration for debouncing syncing steps (to reduce function calls).',
          },
          {
            note: '• Option to write the concrete value each time a delta is submitted.',
          },
          {
            note: '• Pluggable storage for ReactNative, assuming single-session.',
          },
          {
            note: '• Warning when closing tab with unsynced changes (works by default?).',
          },
          {
            note: '• Convert it to a ProseMirror plugin instead of a Tiptap extension, so raw ProseMirror usecases can also use it.',
          },
          {
            note: '• Handling edge cases, such as old clients with local changes on top of an older version of the document where the steps necessary for them to rebase their changes have since been vacuumed.',
          },
          {
            note: '• Type parameter for the document ID for more type safety for folks using Convex IDs as their document IDs. This is available on the server but not browser.',
          },
          {
            note: '• Drop clientIds entirely and just use two UUIDs locally to differentiate our changes from server-applied changes.',
          },
          {
            note: '• Add an optional authorId to the data model to track who made which changes.',
          },
        ],
      },
      {
        heading: 'Missing features',
        paragraphs: [
          'Missing features that aren\'t currently planned:',
        ],
        codeBlocks: [
          {
            note: '• Supporting documents larger than 1 Megabyte.',
          },
          {
            note: '• Offline support that syncs changes between browser tabs or peer-to-peer.',
          },
          {
            note: '• Syncing Yjs documents instead of ProseMirror steps. That would be done by a different Yjs-specific component.',
          },
          {
            note: '• Syncing presence (e.g. showing other users\' names and cursor in the UI). This is another thing a Yjs-oriented ProseMirror component could tackle.',
          },
          {
            note: '• Callback to confirm rebases and handle failures in the client (during sync).',
          },
          {
            note: '• Optimization to sync a snapshot instead of many deltas when an old client reconnects and doesn\'t have local changes.',
          },
          {
            note: '• Handling multiple AsyncStorage instances that are restored from the same cloud backup, leading to multiple clients with the same clientID. For now, we\'ll assume that AsyncStorage is only used by one client at a time.',
          },
        ],
      },
    ],
  },
  {
    id: 'expo-push-notifications',
    title: 'Expo Push Notifications',
    description: 'Send push notifications with Expo. Manage retries and batching.',
    icon: <Bell size={48} />,
    ...getGradient(3, 'Integrations'),
    weeklyDownloads: 1466,
    developer: 'get-convex',
    category: 'Integrations' as ComponentCategory,
    npmPackage: '@convex-dev/expo-push-notifications',
    repoUrl: 'https://github.com/get-convex/expo-push-notifications',
    packageUrl: 'https://www.npmjs.com/package/@convex-dev/expo-push-notifications',
    docsUrl: 'https://github.com/get-convex/expo-push-notifications#readme',
    docsLinks: [
      { label: 'Expo push notifications setup', url: 'https://docs.expo.dev/push-notifications/push-notifications-setup/#registering-for-push-notifications' },
      { label: 'Expo push notifications overview', url: 'https://docs.expo.dev/push-notifications/overview/' },
    ],
    bugReportUrl: 'https://github.com/get-convex/expo-push-notifications/issues',
    exampleCommands: [
      'git clone https://github.com/get-convex/expo-push-notifications.git',
      'cd expo-push-notifications/example',
      'npm install',
      'npm run dev',
    ],
    longDescription: 'This is a Convex component that integrates with Expo\'s push notification API to allow sending mobile push notifications to users of your app. It will batch calls to Expo\'s API and handle retrying delivery.',
    features: [
      'Send push notifications to users of your Expo/React Native app.',
      'Automatic batching of calls to Expo\'s API for efficiency.',
      'Handles retrying delivery automatically.',
      'Register and manage push notification tokens for users.',
      'Pause and resume push notifications for individual users.',
      'Query notification status reactively using Convex queries.',
      'Get all notifications for a user.',
      'Support for custom user identifier types.',
      'Graceful shutdown and restart of the push notification sender.',
      'Configurable logging levels for debugging.',
    ],
    documentationSections: [
      {
        heading: 'Overview',
        paragraphs: [
          'This is a Convex component that integrates with Expo\'s push notification API to allow sending mobile push notifications to users of your app. It will batch calls to Expo\'s API and handle retrying delivery.',
        ],
        code: `// App.tsx

<Button
  onPress={() => {
    void convex.mutation(api.example.sendPushNotification, {
      to: otherUser,
      title: \`Hi from \${currentUser.name}\`,
    });
  }}
>
  <Text>Say hi!</Text>
</Button>

// convex/example.ts

export const sendPushNotification = mutation({
  args: { title: v.string(), to: v.id("users") },
  handler: async (ctx, args) => {
    // Sending a notification
    return pushNotifications.sendPushNotification(ctx, {
      userId: args.to,
      notification: {
        title: args.title,
      },
    });
  },
});`,
      },
      {
        heading: 'Pre-requisite: Convex',
        paragraphs: [
          'You\'ll need an existing Convex project to use the component. Convex is a hosted backend platform, including a database, serverless functions, and a ton more you can learn about [here](https://docs.convex.dev/home).',
          'Run `npm create convex` or follow any of the quickstarts to set one up.',
        ],
      },
      {
        heading: 'Installation',
        subsections: [
          {
            subheading: 'Step 1: Install the package',
            paragraphs: [
              'Install the component package:',
            ],
            code: 'npm i @convex-dev/expo-push-notifications',
          },
          {
            subheading: 'Step 2: Install the component',
            paragraphs: [
              'Create a `convex.config.ts` file in your app\'s `convex/` folder and install the component by calling use:',
            ],
            code: `// convex/convex.config.ts

import { defineApp } from "convex/server";
import pushNotifications from "@convex-dev/expo-push-notifications/convex.config.js";

const app = defineApp();
app.use(pushNotifications);

// other components

export default app;`,
          },
          {
            subheading: 'Step 3: Instantiate the PushNotifications client',
            paragraphs: [
              'Instantiate the PushNotifications client in your Convex functions:',
            ],
            code: `// convex/example.ts

import { PushNotifications } from "@convex-dev/expo-push-notifications";

const pushNotifications = new PushNotifications(components.pushNotifications);`,
          },
        ],
        codeBlocks: [
          {
            note: 'It takes in an optional type parameter (defaulting to `Id<"users">`) for the type to use as a unique identifier for push notification recipients:',
            code: `import { PushNotifications } from "@convex-dev/expo-push-notifications";

export type Email = string & { __isEmail: true };

const pushNotifications = new PushNotifications<Email>(
  components.pushNotifications,
);`,
          },
        ],
      },
      {
        heading: 'Registering a user for push notifications',
        paragraphs: [
          'Get a user\'s push notification token following the [Expo documentation](https://docs.expo.dev/push-notifications/push-notifications-setup/#registering-for-push-notifications), and record it using a Convex mutation:',
        ],
        code: `// convex/example.ts

export const recordPushNotificationToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    await pushNotifications.recordToken(ctx, {
      userId,
      pushToken: args.token,
    });
  },
});`,
        codeBlocks: [
          {
            note: 'You can pause and resume push notification sending for a user using the `pausePushNotifications` and `resumePushNotifications` methods.',
          },
          {
            note: 'To determine if a user has a token and their pause status, you can use `getStatusForUser`.',
          },
        ],
      },
      {
        heading: 'Send notifications',
        paragraphs: [
          'Send push notifications to users:',
        ],
        code: `// convex/example.ts

export const sendPushNotification = mutation({
  args: { title: v.string(), to: v.string() },
  handler: async (ctx, args) => {
    const pushId = await pushNotifications.sendPushNotification(ctx, {
      userId: args.to,
      notification: {
        title: args.title,
      },
    });
  },
});`,
        codeBlocks: [
          {
            note: 'You can use the ID returned from `sendPushNotifications` to query the status of the notification using `getNotification`. Using this in a query allows you to subscribe to the status of a notification.',
          },
          {
            note: 'You can also view all notifications for a user with `getNotificationsForUser`.',
          },
        ],
      },
      {
        heading: 'Troubleshooting',
        paragraphs: [
          'To add more logging, provide PushNotifications with a `logLevel` in the constructor:',
        ],
        code: `const pushNotifications = new PushNotifications(components.pushNotifications, {
  logLevel: "DEBUG",
});`,
        codeBlocks: [
          {
            note: 'The push notification sender can be shutdown gracefully, and then restarted using the `shutdown` and `restart` methods.',
          },
        ],
      },
    ],
  },
  {
    id: 'polar',
    title: 'Polar',
    description: 'Add subscriptions and billing to your Convex app with Polar.',
    icon: <CreditCard size={48} />,
    ...getGradient(4, 'Integrations'),
    weeklyDownloads: 1173,
    developer: 'get-convex',
    category: 'Integrations' as ComponentCategory,
    npmPackage: '@convex-dev/polar',
    repoUrl: 'https://github.com/get-convex/polar',
    packageUrl: 'https://www.npmjs.com/package/@convex-dev/polar',
    docsUrl: 'https://github.com/get-convex/polar#readme',
    docsLinks: [
      { label: 'Polar website', url: 'https://polar.sh/' },
      { label: 'Convex environment variables', url: 'https://docs.convex.dev/production/environment-variables#system-environment-variables' },
    ],
    bugReportUrl: 'https://github.com/get-convex/polar/issues',
    exampleCommands: [
      'git clone https://github.com/get-convex/polar.git',
      'cd polar/example',
      'npm install',
      'npm run dev',
    ],
    longDescription: 'Add subscriptions and billing to your Convex app with Polar. This component integrates with Polar to provide subscription management, checkout links, customer portals, and automatic product syncing.',
    features: [
      'Get subscription details for the current user.',
      'Show available plans with React components.',
      'Create checkout links for new subscriptions.',
      'Manage existing subscriptions via customer portal.',
      'Handle subscription changes (upgrade, downgrade, cancel).',
      'Automatic product syncing via webhooks.',
      'Support for multiple active subscriptions per user.',
      'Server-side subscription queries and mutations.',
      'Configurable product keys for easy reference.',
      'Webhook callbacks for subscription events.',
    ],
    documentationSections: [
      {
        heading: 'Overview',
        paragraphs: [
          'Add subscriptions and billing to your Convex app with Polar.',
        ],
        code: `// Get subscription details for the current user
// Note: getCurrentSubscription is for apps that only allow one active
// subscription per user. If you need to support multiple active
// subscriptions, use listUserSubscriptions instead.
const {
  productKey,
  status,
  currentPeriodEnd,
  currentPeriodStart,
  ...
} = await polar.getCurrentSubscription(ctx, {
  userId: user._id,
});

// Show available plans
<CheckoutLink
  polarApi={api.example}
  productIds={[products.premiumMonthly.id, products.premiumYearly.id]}
  // Optional: turn off embedding to link to a checkout page
  embed={false}
>
  Upgrade to Premium
</CheckoutLink>

// Manage existing subscriptions
<CustomerPortalLink polarApi={api.example}>
  Manage Subscription
</CustomerPortalLink>`,
        codeBlocks: [
          {
            note: 'Check out the [example app](https://github.com/get-convex/polar/tree/main/example) for a complete example.',
          },
        ],
      },
      {
        heading: 'Prerequisites',
        subsections: [
          {
            subheading: 'Convex App',
            paragraphs: [
              'You\'ll need a Convex App to use the component. Follow any of the [Convex quickstarts](https://docs.convex.dev/home) to set one up.',
            ],
          },
          {
            subheading: 'Polar Account',
            paragraphs: [
              'Create a Polar account',
              'Create an organization and generate an organization token with permissions:',
              '• `products:read`',
              '• `products:write`',
              '• `subscriptions:read`',
              '• `subscriptions:write`',
              '• `customers:read`',
              '• `customers:write`',
              '• `checkouts:read`',
              '• `checkouts:write`',
              '• `checkout_links:read`',
              '• `checkout_links:write`',
              '• `customer_portal:read`',
              '• `customer_portal:write`',
              '• `customer_sessions:write`',
            ],
          },
        ],
      },
      {
        heading: 'Installation',
        subsections: [
          {
            subheading: 'Step 1: Install the package',
            paragraphs: [
              'Install the component package:',
            ],
            code: 'npm install @convex-dev/polar',
          },
          {
            subheading: 'Step 2: Install the component',
            paragraphs: [
              'Create a `convex.config.ts` file in your app\'s `convex/` folder and install the component by calling `app.use`:',
            ],
            code: `// convex/convex.config.ts

import { defineApp } from "convex/server";
import polar from "@convex-dev/polar/convex.config.js";

const app = defineApp();
app.use(polar);

export default app;`,
          },
          {
            subheading: 'Step 3: Set your Polar organization token',
            paragraphs: [
              'Set your Polar organization token:',
            ],
            code: 'npx convex env set POLAR_ORGANIZATION_TOKEN xxxxx',
          },
        ],
      },
      {
        heading: 'Set up Polar webhooks',
        paragraphs: [
          'The Polar component uses webhooks to keep subscription data in sync. You\'ll need to:',
        ],
        codeBlocks: [
          {
            note: '1. Create a webhook and webhook secret in the Polar dashboard, using your Convex site URL + `/polar/events` as the webhook endpoint. It should look like this: `https://verb-noun-123.convex.site/polar/events`',
          },
          {
            note: 'Enable the following events:\n• `product.created`\n• `product.updated`\n• `subscription.created`\n• `subscription.updated`',
          },
          {
            note: '2. Set the webhook secret in your Convex environment:',
            code: 'npx convex env set POLAR_WEBHOOK_SECRET xxxxx',
          },
          {
            note: '3. Register the webhook handler in your `convex/http.ts`:',
            code: `import { httpRouter } from "convex/server";
import { polar } from "./example";

const http = httpRouter();

// Register the webhook handler at /polar/events
polar.registerRoutes(http as any);

export default http;`,
          },
        ],
      },
      {
        heading: 'Webhook callbacks',
        paragraphs: [
          'You can also provide callbacks for webhook events:',
        ],
        code: `polar.registerRoutes(http, {
  // Optional custom path, default is "/polar/events"
  path: "/polar/events",
  // Optional callbacks for webhook events
  onSubscriptionUpdated: async (ctx, event) => {
    // Handle subscription updates, like cancellations.
    // Note that a cancelled subscription will not be deleted from the database,
    // so this information remains available without a hook, eg., via
    // \`getCurrentSubscription()\`.
    if (event.data.customerCancellationReason) {
      console.log("Customer cancelled:", event.data.customerCancellationReason);
    }
  },
  onSubscriptionCreated: async (ctx, event) => {
    // Handle new subscriptions
  },
  onProductCreated: async (ctx, event) => {
    // Handle new products
  },
  onProductUpdated: async (ctx, event) => {
    // Handle product updates
  },
});`,
        codeBlocks: [
          {
            note: 'Be sure to run `npx convex dev` to start your Convex app with the Polar component enabled, which will deploy the webhook handler to your Convex instance.',
          },
        ],
      },
      {
        heading: 'Create products in Polar',
        paragraphs: [
          'Create a product in the Polar dashboard for each pricing plan that you want to offer. The product data will be synced to your Convex app automatically.',
        ],
        codeBlocks: [
          {
            note: '**Note:** You can have one price per plan, so a plan with monthly and yearly pricing requires two products in Polar.',
          },
          {
            note: '**Note:** The Convex Polar component is currently built to support recurring subscriptions, and may not work as expected with one-time payments. Please [open an issue](https://github.com/get-convex/polar/issues) or [reach out on Discord](https://discord.com/invite/convex) if you run into any issues.',
          },
          {
            note: 'Products created prior to using this component need to be synced with Convex using the `syncProducts` function.',
          },
        ],
      },
      {
        heading: 'Initialize the Polar client',
        paragraphs: [
          'Create a Polar client in your Convex backend:',
        ],
        code: `// convex/example.ts

import { Polar } from "@convex-dev/polar";
import { api, components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";

export const polar = new Polar(components.polar, {
  // Required: provide a function the component can use to get the current user's ID and
  // email - this will be used for retrieving the correct subscription data for the
  // current user. The function should return an object with \`userId\` and \`email\`
  // properties.
  getUserInfo: async (ctx) => {
    const user = await ctx.runQuery(api.example.getCurrentUser);
    return {
      userId: user._id,
      email: user.email,
    };
  },
  // Optional: Configure static keys for referencing your products.
  // Alternatively you can use the \`listAllProducts\` function to get
  // the product data and sort it out in your UI however you like
  // (eg., by price, name, recurrence, etc.).
  // Map your product keys to Polar product IDs (you can also use env vars for this)
  // Replace these keys with whatever is useful for your app (eg., "pro", "proMonthly",
  // whatever you want), and replace the values with the actual product IDs from your
  // Polar dashboard
  products: {
    premiumMonthly: "product_id_from_polar",
    premiumYearly: "product_id_from_polar",
    premiumPlusMonthly: "product_id_from_polar",
    premiumPlusYearly: "product_id_from_polar",
  },
  // Optional: Set Polar configuration directly in code
  organizationToken: "your_organization_token", // Defaults to POLAR_ORGANIZATION_TOKEN env var
  webhookSecret: "your_webhook_secret", // Defaults to POLAR_WEBHOOK_SECRET env var
  server: "sandbox", // Optional: "sandbox" or "production", defaults to POLAR_SERVER env var
});

// Export API functions from the Polar client
export const {
  changeCurrentSubscription,
  cancelCurrentSubscription,
  getConfiguredProducts,
  listAllProducts,
  generateCheckoutLink,
  generateCustomerPortalUrl,
} = polar.api();`,
      },
      {
        heading: 'Display products and prices',
        paragraphs: [
          'Use the exported `getConfiguredProducts` or `listAllProducts` function to display your products and their prices:',
        ],
        subsections: [
          {
            subheading: 'getConfiguredProducts',
            paragraphs: [
              'Simple example of displaying products and prices if you\'ve configured products by key in the Polar constructor:',
            ],
            code: `// Simple example of displaying products and prices if you've configured
// products by key in the Polar constructor
function PricingTable() {
  const products = useQuery(api.example.getConfiguredProducts);
  if (!products) return null;

  return (
    <div>
      {products.premiumMonthly && (
        <div>
          <h3>{products.premiumMonthly.name}</h3>
          <p>
            $\{(products.premiumMonthly.prices[0].priceAmount ?? 0) / 100}/month
          </p>
        </div>
      )}
      {products.premiumYearly && (
        <div>
          <h3>{products.premiumYearly.name}</h3>
          <p>
            $\{(products.premiumYearly.prices[0].priceAmount ?? 0) / 100}/year
          </p>
        </div>
      )}
    </div>
  );
}`,
          },
          {
            subheading: 'listAllProducts',
            paragraphs: [
              'Simple example of displaying products and prices if you haven\'t configured products by key in the Polar constructor:',
            ],
            code: `// Simple example of displaying products and prices if you haven't configured
// products by key in the Polar constructor
function PricingTable() {
  const products = useQuery(api.example.listAllProducts);
  if (!products) return null;

  // You can sort through products in the client as below, or you can use
  // \`polar.listAllProducts\` in your own Convex query and return your desired
  // products to display in the UI.
  const proMonthly = products.find(
    (p) => p.prices[0].recurringInterval === "month",
  );
  const proYearly = products.find(
    (p) => p.prices[0].recurringInterval === "year",
  );
  return (
    <div>
      {proMonthly && (
        <div>
          <h3>{proMonthly.name}</h3>
          <p>
            $\{(proMonthly.prices[0].priceAmount ?? 0) / 100}/
            {proMonthly.prices[0].recurringInterval}
          </p>
        </div>
      )}
      {proYearly && (
        <div>
          <h3>{proYearly.name}</h3>
          <p>$\{(proYearly.prices[0].priceAmount ?? 0) / 100}/year</p>
        </div>
      )}
    </div>
  );
}`,
          },
        ],
        codeBlocks: [
          {
            note: 'Each product includes:\n• `id`: The Polar product ID\n• `name`: The product name\n• `prices`: Array of prices with:\n  - `priceAmount`: Price in cents\n  - `priceCurrency`: Currency code (e.g., "USD")\n  - `recurringInterval`: "month" or "year"',
          },
        ],
      },
      {
        heading: 'Add subscription UI components',
        paragraphs: [
          'Use the provided React components to add subscription functionality to your app:',
        ],
        code: `import { CheckoutLink, CustomerPortalLink } from "@convex-dev/polar/react";
import { api } from "../convex/_generated/api";

// For new subscriptions
<CheckoutLink
  // For our example, the api.example object includes the generateCheckoutLink
  // function. You can also pass any object that includes this function.
  polarApi={api.example}
  productIds={[products.premiumMonthly.id, products.premiumYearly.id]}
  // Optional: turn off embedding to link to a checkout page
  embed={false}
>
  Upgrade to Premium
</CheckoutLink>

// For managing existing subscriptions
<CustomerPortalLink
  polarApi={{
    generateCustomerPortalUrl: api.example.generateCustomerPortalUrl,
  }}
>
  Manage Subscription
</CustomerPortalLink>`,
      },
      {
        heading: 'Handle subscription changes',
        paragraphs: [
          'The Polar component provides functions to handle subscription changes for the current user.',
        ],
        codeBlocks: [
          {
            note: '**Note:** It is highly recommended to prompt the user for confirmation before changing their subscription this way!',
          },
        ],
        code: `// Change subscription
const changeSubscription = useAction(api.example.changeCurrentSubscription);
await changeSubscription({ productId: "new_product_id" });

// Cancel subscription
const cancelSubscription = useAction(api.example.cancelCurrentSubscription);
await cancelSubscription({ revokeImmediately: true });`,
      },
      {
        heading: 'Access subscription data',
        paragraphs: [
          'Query subscription information in your app:',
        ],
        code: `// convex/example.ts

// A query that returns a user with their subscription details
export const getCurrentUser = query({
  handler: async (ctx) => {
    const user = await ctx.db.query("users").first();
    if (!user) throw new Error("No user found");

    const subscription = await polar.getCurrentSubscription(ctx, {
      userId: user._id,
    });

    return {
      ...user,
      subscription,
      isFree: !subscription,
      isPremium:
        subscription?.productKey === "premiumMonthly" ||
        subscription?.productKey === "premiumYearly",
    };
  },
});`,
      },
      {
        heading: 'API Reference',
        subsections: [
          {
            subheading: 'Polar Client',
            paragraphs: [
              'The `Polar` class accepts a configuration object with:',
              '• `getUserInfo`: Function to get the current user\'s ID and email',
              '• `products`: (Optional) Map of arbitrarily named keys to Polar product IDs',
              '• `organizationToken`: (Optional) Your Polar organization token. Falls back to `POLAR_ORGANIZATION_TOKEN` env var',
              '• `webhookSecret`: (Optional) Your Polar webhook secret. Falls back to `POLAR_WEBHOOK_SECRET` env var',
              '• `server`: (Optional) Polar server environment: "sandbox" or "production". Falls back to `POLAR_SERVER` env var',
            ],
          },
          {
            subheading: 'React Components',
            paragraphs: [
              '#### CheckoutLink',
              'Props:',
              '• `polarApi`: Object containing `generateCheckoutLink` function',
              '• `productIds`: Array of product IDs to show in the checkout',
              '• `children`: React children (button content)',
              '• `embed`: (Optional) Whether to embed the checkout link. Defaults to `true`.',
              '• `className`: (Optional) CSS class name',
              '• `subscriptionId`: (Optional) ID of a subscription to upgrade. It must be on a free pricing.',
              '#### CustomerPortalLink',
              'Props:',
              '• `polarApi`: Object containing `generateCustomerPortalUrl` function',
              '• `children`: React children (button content)',
              '• `className`: (Optional) CSS class name',
            ],
          },
          {
            subheading: 'API Functions',
            paragraphs: [
              '#### changeCurrentSubscription',
              'Change an existing subscription to a new plan:',
            ],
            code: `await changeSubscription({ productId: "new_product_id" });`,
          },
        ],
      },
      {
        heading: 'Additional API functions',
        paragraphs: [
          '#### cancelCurrentSubscription',
          'Cancel an existing subscription:',
        ],
        code: `await cancelSubscription({ revokeImmediately: true });`,
        codeBlocks: [
          {
            note: '#### getCurrentSubscription',
            code: `Get the current user's subscription details:

const subscription = await polar.getCurrentSubscription(ctx, { userId });`,
          },
          {
            note: '#### listUserSubscriptions',
            code: `For apps that support multiple active subscriptions per user, get all subscriptions for a user:

const subscriptions = await polar.listUserSubscriptions(ctx, { userId });`,
          },
          {
            note: '#### getProducts',
            code: `List all available products and their prices:

const products = await polar.listProducts(ctx);`,
          },
          {
            note: '#### registerRoutes',
            code: `Register webhook handlers for the Polar component:

polar.registerRoutes(http, {
  // Optional: customize the webhook endpoint path (defaults to "/polar/events")
  path: "/custom/webhook/path",
});`,
          },
          {
            note: 'The webhook handler uses the `webhookSecret` from the Polar client configuration or the `POLAR_WEBHOOK_SECRET` environment variable.',
          },
          {
            note: '#### syncProducts',
            code: `Sync existing products from Polar (must be run inside an action):

export const syncProducts = action({
  args: {},
  handler: async (ctx) => {
    await polar.syncProducts(ctx);
  },
});`,
          },
        ],
      },
    ],
  },
  {
    id: 'autumn',
    title: 'Autumn',
    description: 'Autumn is your application\'s pricing and billing database.',
    icon: <Receipt size={48} />,
    ...getGradient(5, 'Integrations'),
    weeklyDownloads: 912,
    developer: 'useautumn',
    category: 'Integrations' as ComponentCategory,
    npmPackage: '@useautumn/convex',
    repoUrl: 'https://github.com/useautumn/typescript',
    packageUrl: 'https://www.npmjs.com/package/@useautumn/convex',
    docsUrl: 'https://github.com/useautumn/typescript/blob/main/convex/README.md',
    docsLinks: [
      { label: 'Autumn website', url: 'https://useautumn.com/' },
      { label: 'API reference: checkout', url: 'https://docs.useautumn.com/api-reference/core/checkout' },
      { label: 'API reference: useCustomer', url: 'https://docs.useautumn.com/api-reference/hooks/useCustomer' },
      { label: 'Shadcn components', url: 'https://docs.useautumn.com/setup/shadcn' },
    ],
    bugReportUrl: 'https://github.com/useautumn/typescript/issues',
    exampleCommands: [
      'npm install @useautumn/convex autumn-js',
      'npx convex env set AUTUMN_SECRET_KEY=am_sk_xxx',
      'npx convex dev',
    ],
    longDescription: 'Autumn is your pricing and customer database—an abstraction over Stripe that lets you model any pricing (subscriptions, usage-based, seats, trials, credits) and implement it in your codebase in just three functions: check for access, track for metering, and checkout for purchases.',
    features: [
      'Model any pricing structure (subscriptions, usage-based, seats, trials, credits).',
      'Three core functions: check for access, track for metering, and checkout for purchases.',
      'React hooks and components for frontend integration.',
      'Full customization with shadcn components.',
      'Check feature access on the backend.',
      'Track feature usage for metering.',
      'Handle checkout flows for purchases.',
      'Manage customer subscriptions and billing.',
      'Setup payment methods.',
      'Create and manage referral codes.',
      'Entity-based billing support.',
    ],
    documentationSections: [
      {
        heading: 'Introduction',
        paragraphs: [
          'Autumn is your pricing and customer database—an abstraction over Stripe that lets you model any pricing (subscriptions, usage-based, seats, trials, credits) and implement it in your codebase in just three functions: check for access, track for metering, and checkout for purchases.',
        ],
      },
      {
        heading: 'Setup',
        paragraphs: [
          'Note: You\'ll need Convex v1.25.0+ and autumn-js v0.1.24+.',
        ],
        subsections: [
          {
            subheading: 'Step 1: Install the packages',
            paragraphs: [
              'Install the packages:',
            ],
            code: 'npm install @useautumn/convex autumn-js',
          },
          {
            subheading: 'Step 2: Set the Autumn secret key',
            paragraphs: [
              'Set the Autumn secret key in your Convex environment:',
            ],
            code: 'npx convex env set AUTUMN_SECRET_KEY=am_sk_xxx',
          },
          {
            subheading: 'Step 3: Add the component to your application',
            paragraphs: [
              'Add the Autumn Convex component to `convex/convex.config.ts`:',
            ],
            code: `import { defineApp } from "convex/server";
import autumn from "@useautumn/convex/convex.config";

const app = defineApp();
app.use(autumn);

export default app;`,
          },
          {
            subheading: 'Step 4: Initialize the Autumn client',
            paragraphs: [
              'In `convex/autumn.ts`, add the following code:',
            ],
            code: `import { components } from "./_generated/api";
import { Autumn } from "@useautumn/convex";

export const autumn = new Autumn(components.autumn, {
  secretKey: process.env.AUTUMN_SECRET_KEY ?? "",
  identify: async (ctx: any) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) return null;

    const userId = user.subject.split("|")[0];
    return {
      customerId: userId,
      customerData: {
        name: user.name as string,
        email: user.email as string,
      },
    };
  },
});

export const {
  track,
  cancel,
  query,
  attach,
  check,
  checkout,
  usage,
  setupPayment,
  createCustomer,
  listProducts,
  billingPortal,
  createReferralCode,
  redeemReferralCode,
  createEntity,
  getEntity,
} = autumn.api();`,
          },
          {
            subheading: 'Step 5: Set up AutumnProvider on your frontend',
            paragraphs: [
              'Add `AutumnWrapper.tsx` to enable hooks and components:',
            ],
            code: `"use client";

import { AutumnProvider } from "autumn-js/react";
import { api } from "../convex/_generated/api";
import { useConvex } from "convex/react";

export function AutumnWrapper({ children }: { children: React.ReactNode }) {
  const convex = useConvex();

  return (
    <AutumnProvider convex={convex} convexApi={(api as any).autumn}>
      {children}
    </AutumnProvider>
  );
}`,
          },
        ],
        codeBlocks: [
          {
            note: 'The example above uses Convex auth as an example. Visit [this page](https://github.com/useautumn/typescript/blob/main/convex/README.md) to see code snippets for other providers like Clerk / Better Auth',
          },
          {
            note: 'Note: The `identify()` function determines which customer is making the request. Customize it for your use case (e.g. use an organization ID as customerId for entity billing). You may need to change `user.subject` to `user.id` depending on your auth provider.',
          },
          {
            note: 'Note: If you use Autumn only on the backend, you can skip this step.',
          },
        ],
      },
      {
        heading: 'Using hooks and components on the frontend',
        paragraphs: [
          'The quickest way to get started is to use our `<PricingTable/>` component:',
        ],
        code: `<PricingTable/>

import { PricingTable } from "autumn-js/react";

export default function Home() {
  return <PricingTable />;
}`,
        codeBlocks: [
          {
            note: 'Components are available as shadcn components and are fully customizable: [https://docs.useautumn.com/setup/shadcn](https://docs.useautumn.com/setup/shadcn)',
          },
        ],
      },
      {
        heading: 'useCustomer hook',
        paragraphs: [
          'We also provide a `useCustomer` hook which lets you easily access your customer data and interact with the Autumn API directly from your frontend. For example, to upgrade a user:',
        ],
        code: `import { useCustomer, CheckoutDialog } from "autumn-js/react";

export default function Home() {
  const { customer, track, check, checkout } = useCustomer();

  return (
    <button
      onClick={() =>
        checkout({
          productId: "pro",
          dialog: CheckoutDialog,
        })
      }
    >
      Upgrade to Pro
    </button>
  );
}`,
        codeBlocks: [
          {
            note: 'You can use all `useCustomer()` and `useEntity()` features as usual. Learn more about our [react hooks here](https://docs.useautumn.com/api-reference/hooks/useCustomer).',
          },
        ],
      },
      {
        heading: 'Using Autumn on the backend',
        paragraphs: [
          'You will also need to use Autumn on your backend for actions such as tracking or gating usage of a feature. To do so, you can use our Autumn client:',
        ],
      },
      {
        heading: 'Check feature access',
        paragraphs: [
          'Check if a user has access to a feature:',
        ],
        code: `import { autumn } from "convex/autumn";

const { data, error } = await autumn.check(ctx, {
  featureId: "messages",
});

if (data.allowed) {
  // Action to perform if user is allowed messages
}`,
      },
      {
        heading: 'Track feature usage',
        paragraphs: [
          'Track usage of a feature for metering:',
        ],
        code: `import { autumn } from "convex/autumn";

const { data, error } = await autumn.track(ctx, {
  featureId: "messages",
  value: 10,
});`,
        codeBlocks: [
          {
            note: 'These are the most common functions, but others like `checkout` and `attach` are also available. [API reference](https://docs.useautumn.com/api-reference/core/checkout)',
          },
        ],
      },
    ],
  },
  {
    id: 'twilio-sms',
    title: 'Twilio SMS',
    description: 'Easily send and receive SMS via Twilio. Easily query message status from your query function.',
    icon: <MessageSquare size={48} />,
    ...getGradient(6, 'Integrations'),
    weeklyDownloads: 890,
    developer: 'get-convex',
    category: 'Integrations' as ComponentCategory,
    npmPackage: '@convex-dev/twilio',
    repoUrl: 'https://github.com/get-convex/twilio',
    packageUrl: 'https://www.npmjs.com/package/@convex-dev/twilio',
    docsUrl: 'https://github.com/get-convex/twilio#readme',
    docsLinks: [
      { label: 'Twilio Console', url: 'https://console.twilio.com/' },
      { label: 'Twilio availability and reliability', url: 'https://www.twilio.com/docs/usage/security/availability-reliability' },
      { label: 'Message status values', url: 'https://www.twilio.com/docs/messaging/api/message-resource#message-status-values' },
      { label: 'Phone numbers docs', url: 'https://www.twilio.com/docs/phone-numbers' },
    ],
    bugReportUrl: 'https://github.com/get-convex/twilio/issues',
    exampleCommands: [
      'git clone https://github.com/get-convex/twilio.git',
      'cd twilio/example',
      'npm install',
      'npm run dev',
    ],
    longDescription: 'Send and receive SMS messages in your Convex app using Twilio. The component handles message sending, receiving, status tracking, and webhook management automatically.',
    features: [
      'Send SMS messages from Convex actions.',
      'Receive incoming SMS messages via webhooks.',
      'Automatic message status tracking and updates.',
      'Query messages by status, phone number, or message SID.',
      'List incoming and outgoing messages separately.',
      'Get messages by counterparty (all messages to/from a number).',
      'Custom webhook callbacks for incoming messages.',
      'Automatic webhook route registration.',
      'Configurable default "from" phone number.',
      'Full integration with Twilio\'s messaging API.',
    ],
    documentationSections: [
      {
        heading: 'Overview',
        paragraphs: [
          'Send and receive SMS messages in your Convex app using Twilio.',
        ],
        code: `import { Twilio } from "@convex-dev/twilio";

import { components } from "./_generated/api";

export const twilio = new Twilio(components.twilio, {
  defaultFrom: process.env.TWILIO_PHONE_NUMBER!,
});

export const sendSms = internalAction({
  handler: async (ctx, args) => {
    return await twilio.sendMessage(ctx, {
      to: "+14151234567",
      body: "Hello, world!",
    });
  },
});`,
      },
      {
        heading: 'Prerequisites',
        subsections: [
          {
            subheading: 'Twilio Phone Number',
            paragraphs: [
              'Create a Twilio account and, if you haven\'t already, create a Twilio Phone Number.',
              'Note the Phone Number SID of the phone number you\'ll be using, you\'ll need it in a moment.',
            ],
          },
          {
            subheading: 'Convex App',
            paragraphs: [
              'You\'ll need a Convex App to use the component. Follow any of the [Convex quickstarts](https://docs.convex.dev/home) to set one up.',
            ],
          },
        ],
      },
      {
        heading: 'Installation',
        subsections: [
          {
            subheading: 'Step 1: Install the package',
            paragraphs: [
              'Install the component package:',
            ],
            code: 'npm install @convex-dev/twilio',
          },
          {
            subheading: 'Step 2: Install the component',
            paragraphs: [
              'Create a `convex.config.ts` file in your app\'s `convex/` folder and install the component by calling use:',
            ],
            code: `// convex/convex.config.ts

import { defineApp } from "convex/server";
import twilio from "@convex-dev/twilio/convex.config.js";

const app = defineApp();
app.use(twilio);

export default app;`,
          },
          {
            subheading: 'Step 3: Set your API credentials',
            paragraphs: [
              'Set your API credentials:',
            ],
            code: `npx convex env set TWILIO_ACCOUNT_SID=ACxxxxx
npx convex env set TWILIO_AUTH_TOKEN=xxxxx`,
          },
          {
            subheading: 'Step 4: Instantiate the Twilio client',
            paragraphs: [
              'Instantiate a Twilio Component client in a file in your app\'s `convex/` folder:',
            ],
            code: `// convex/example.ts

import { Twilio } from "@convex-dev/twilio";
import { components } from "./_generated/api";

export const twilio = new Twilio(components.twilio, {
  // optionally pass in the default "from" phone number you'll be using
  // this must be a phone number you've created with Twilio
  defaultFrom: process.env.TWILIO_PHONE_NUMBER!,
});`,
          },
          {
            subheading: 'Step 5: Register webhook handlers',
            paragraphs: [
              'Register Twilio webhook handlers by creating an `http.ts` file in your `convex/` folder and use the client you\'ve exported above:',
            ],
            code: `// http.ts

import { twilio } from "./example";
import { httpRouter } from "convex/server";

const http = httpRouter();

// this call registers the routes necessary for the component
twilio.registerRoutes(http);

export default http;`,
          },
        ],
      },
      {
        heading: 'Sending Messages',
        paragraphs: [
          'To send a message use the Convex action `sendMessage`:',
        ],
        code: `// convex/messages.ts

import { v } from "convex/values";
import { internalAction } from "./_generated/server";

export const sendSms = internalAction({
  handler: async (ctx, args) => {
    const status = await twilio.sendMessage(ctx, {
      to: "+14158675309",
      body: "Hey Jenny",
    });
  },
});`,
        codeBlocks: [
          {
            note: 'By querying the message (see below) you can check for the status ([Twilio Statuses](https://www.twilio.com/docs/messaging/api/message-resource#message-status-values)). The component subscribes to status updates and writes the most up-to-date status into the database.',
          },
        ],
      },
      {
        heading: 'Receiving Messages',
        paragraphs: [
          'To receive messages, you will associate a webhook handler provided by the component with the Twilio phone number you\'d like to use.',
          '`twilio.registerRoutes` registers two webhook HTTP handlers in your your Convex app\'s deployment:',
        ],
        codeBlocks: [
          {
            note: '• `YOUR_CONVEX_SITE_URL/twilio/message-status` - capture and store delivery status of messages you send.',
          },
          {
            note: '• `YOUR_CONVEX_SITE_URL/twilio/incoming-message` - capture and store messages sent to your Twilio phone number.',
          },
          {
            note: 'Note: You may pass a custom `httpPrefix` to Twilio if you want to route Twilio endpoints somewhere other than `YOUR_CONVEX_SITE_URL/twilio/*`.',
          },
          {
            note: 'For instance, to route to `YOUR_CONVEX_SITE_URL/custom-twilio/message-status`, set:',
            code: `export const twilio = new Twilio(components.twilio, {
  httpPrefix: "/custom-twilio",
});`,
          },
        ],
      },
      {
        heading: 'Configuring incoming message webhook',
        paragraphs: [
          'You can associate it with your Twilio phone number in two ways:',
        ],
        codeBlocks: [
          {
            note: '1. Using the [Twilio console](https://console.twilio.com/) in the "Configure" tab of the phone number, under "Messaging Configuration" -> "A messsage comes in" -> "URL".',
          },
          {
            note: '2. By calling `registerIncomingSmsHandler` exposed by the component client, passing it the phone number\'s SID:',
            code: `export const registerIncomingSmsHandler = internalAction({
  args: {},
  handler: async (ctx) => {
    return await twilio.registerIncomingSmsHandler(ctx, {
      sid: "YOUR_TWILIO_PHONE_NUMBER_SID",
    });
  },
});`,
          },
          {
            note: 'Once it is configured, incoming messages will be captured by the component and logged in the messages table.',
          },
        ],
      },
      {
        heading: 'Custom incoming message callback',
        paragraphs: [
          'You can execute your own logic upon receiving an incoming message, by providing a callback when instantiating the Twilio Component client:',
        ],
        code: `// convex/example.ts

import { Twilio, messageValidator } from "@convex-dev/twilio";

const twilio = new Twilio(components.twilio);

twilio.incomingMessageCallback = internal.example.handleIncomingMessage;

export const handleIncomingMessage = internalMutation({
  args: {
    message: messageValidator,
  },
  handler: async (ctx, message) => {
    // Use ctx here to update the database or schedule other actions.
    // This is in the same transaction as the component's message insertion.
    console.log("Incoming message", message);
  },
});`,
        codeBlocks: [
          {
            note: 'If the `handleIncomingMessage` callback throws an error, the message will not be saved and the webhook will throw an error. Twilio does not retry webhook requests, but you can replay them manually from the Twilio "Error logs" console.',
          },
        ],
      },
      {
        heading: 'Querying Messages',
        paragraphs: [
          'To list all the messages, use the `list` method in your Convex function.',
          'To list all the incoming or outgoing messages, use `listIncoming` and `listOutgoing` methods:',
        ],
        code: `// convex/messages.ts

// ...

export const list = query({
  args: {},
  handler: async (ctx) => {
    const allMessages = await twilio.list(ctx);
    const receivedMessages = await twilio.listIncoming(ctx);
    const sentMessages = await twilio.listOutgoing(ctx);

    return { allMessages, receivedMessages, sentMessages };
  },
});`,
      },
      {
        heading: 'Get message by SID',
        paragraphs: [
          'To get a single message by its sid, use `getMessageBySid`:',
        ],
        code: `export const getMessageBySid = query({
  args: {
    sid: v.string(),
  },
  handler: async (ctx, args) => {
    return await twilio.getMessageBySid(ctx, args);
  },
});`,
      },
      {
        heading: 'Get messages by phone number',
        paragraphs: [
          'Get messages by the "to" phone number:',
        ],
        code: `export const getMessagesTo = query({
  args: {
    to: v.string(),
  },
  handler: async (ctx, args) => {
    return await twilio.getMessagesTo(ctx, args);
  },
});`,
        codeBlocks: [
          {
            note: 'Get messages by the "from" phone number:',
            code: `export const getMessagesFrom = query({
  args: {
    from: v.string(),
  },
  handler: async (ctx, args) => {
    return await twilio.getMessagesFrom(ctx, args);
  },
});`,
          },
          {
            note: 'You can also get all messages to and from a particular number:',
            code: `export const getMessagesByCounterparty = query({
  args: {
    from: v.string(),
  },
  handler: async (ctx, args) => {
    return await twilio.getMessagesByCounterparty(ctx, args);
  },
});`,
          },
        ],
      },
    ],
  },
  {
    id: 'oss-stats',
    title: 'OSS Stats',
    description: 'Keep GitHub and npm data for your open source projects synced to your Convex database.',
    icon: <Github size={48} />,
    ...getGradient(7, 'Integrations'),
    weeklyDownloads: 448,
    developer: 'erquhart',
    category: 'Integrations' as ComponentCategory,
    npmPackage: '@erquhart/convex-oss-stats',
    repoUrl: 'https://github.com/erquhart/convex-oss-stats',
    packageUrl: 'https://www.npmjs.com/package/@erquhart/convex-oss-stats',
    docsUrl: 'https://github.com/erquhart/convex-oss-stats#readme',
    docsLinks: [
      { label: 'Convex Dashboard - Deployment Settings', url: 'https://dashboard.convex.dev/deployment/settings' },
    ],
    bugReportUrl: 'https://github.com/erquhart/convex-oss-stats/issues',
    exampleCommands: [
      'git clone https://github.com/erquhart/convex-oss-stats.git',
      'cd convex-oss-stats/example',
      'npm install',
      'npm run dev',
    ],
    longDescription: 'Keep GitHub and npm data for your open source projects synced to your Convex database. Track star counts, download statistics, dependent counts, and more with automatic webhook updates or manual syncing.',
    features: [
      'Sync GitHub repository data (stars, dependents).',
      'Sync npm package download statistics.',
      'Track data for entire GitHub owners/orgs or individual repos.',
      'Track data for npm orgs or individual packages.',
      'Real-time updates via GitHub webhooks for star counts.',
      'Query data from frontend using React hooks.',
      'Query data from backend in queries, mutations, and actions.',
      'React hook for forecasted download counts with animations.',
      'Day-of-week averages for download patterns.',
      'Manual sync via cron jobs or HTTP endpoints.',
      'Combine stats across multiple repos or packages.',
    ],
    documentationSections: [
      {
        heading: 'Overview',
        paragraphs: [
          'Keep GitHub and npm data for your open source projects synced to your Convex database.',
        ],
        code: `// convex/stats.ts

import { components } from "./_generated/api";
import { OssStats } from "@erquhart/convex-oss-stats";

export const ossStats = new OssStats(components.ossStats, {
  // Get stats for entire owners / orgs
  githubOwners: ["get-convex"],
  npmOrgs: ["convex-dev"],
  // Or individual repos / packages
  githubRepos: ["get-convex/convex-js"],
  npmPackages: ["@convex-dev/convex-js"],
});

export const {
  sync,
  clearAndSync,
  getGithubOwner,
  getNpmOrg,
  getGithubRepo,
  getGithubRepos,
  getNpmPackage,
  getNpmPackages,
} = ossStats.api();

// src/OssStats.tsx

import { useQuery } from "convex/react";
import { useNpmDownloadCounter } from "@erquhart/convex-oss-stats/react";
import { api } from "../convex/_generated/api";

const OssStats = () => {
  const githubOwner = useQuery(api.stats.getGithubOwner, {
    owner: "get-convex",
  });
  const npmOrg = useQuery(api.stats.getNpmOrg, {
    org: "convex-dev",
  });

  // Use this hook to get a forecasted download count for an npm package or org
  const liveNpmDownloadCount = useNpmDownloadCounter(npmOrg);

  return (
    <>
      {/* If webhook is registered, this will update in realtime 🔥 */}
      <div>{githubOwner.starCount}</div>
      <div>{liveNpmDownloadCount.count}</div>
    </>
  );
};`,
      },
      {
        heading: 'Prerequisites',
        subsections: [
          {
            subheading: 'Convex App',
            paragraphs: [
              'You\'ll need a Convex App to use the component. Follow any of the [Convex quickstarts](https://docs.convex.dev/home) to set one up.',
            ],
          },
          {
            subheading: 'GitHub Account (if syncing GitHub data)',
            paragraphs: [
              'From your GitHub account, get the following credentials:',
              '**Access Token**',
              'Go to account settings and generate a new access token with read access to public repositories.',
              '**Webhook Secret**: do this for each org or repo.',
              'Note: this is optional. Without it, you won\'t get live star counts. See how to manually sync data below.',
              'Go to the settings for the org/repo and create a new webhook.',
              'Get the HTTP Actions URL for your **Production** Convex deployment settings: [https://dashboard.convex.dev/deployment/settings](https://dashboard.convex.dev/deployment/settings) > HTTP Actions URL',
              'Payload URL: `<http-actions-url>/events/github`',
              'Content type: `application/json`',
              'Generate a secret to share between your Convex deployment and GitHub',
              'Which events? > Select individual > Stars only',
            ],
          },
        ],
        codeBlocks: [
          {
            note: '### Note on npm data',
          },
          {
            note: 'npm data accessed by this component is public and doesn\'t require any credentials.',
          },
        ],
      },
      {
        heading: 'Installation',
        subsections: [
          {
            subheading: 'Step 1: Install the package',
            paragraphs: [
              'Install the component package:',
            ],
            code: 'npm install @erquhart/convex-oss-stats',
          },
          {
            subheading: 'Step 2: Install the component',
            paragraphs: [
              'Create a `convex.config.ts` file in your app\'s `convex/` folder and install the component by calling `use`:',
            ],
            code: `// convex/convex.config.ts

import { defineApp } from "convex/server";
import ossStats from "@erquhart/convex-oss-stats/convex.config";

const app = defineApp();
app.use(ossStats);

export default app;`,
          },
          {
            subheading: 'Step 3: Set your API credentials',
            paragraphs: [
              'Set your API credentials:',
            ],
            code: `npx convex env set GITHUB_ACCESS_TOKEN=xxxxx
npx convex env set GITHUB_WEBHOOK_SECRET=xxxxx`,
          },
          {
            subheading: 'Step 4: Instantiate the OssStats client',
            paragraphs: [
              'If you haven\'t been running `npx convex dev` yet, you\'ll need to start it now. It will generate code for the component in your `convex/_generated/api` folder, and will deploy changes automatically as you change files in `convex/`.',
              'Instantiate an OssStats Component client in a file in your app\'s `convex/` folder:',
            ],
            code: `// convex/example.ts

import { OssStats } from "@erquhart/convex-oss-stats";
import { components } from "./_generated/api";

export const ossStats = new OssStats(components.ossStats, {
  githubOwners: ["get-convex"],
  npmOrgs: ["convex-dev"],
});

// Re-export functions for direct access from your convex instance
export const { sync, getGithubOwner, getNpmOrg } = ossStats.api();`,
          },
          {
            subheading: 'Step 5: Register webhook handlers',
            paragraphs: [
              'Register GitHub webhook handlers by creating an `http.ts` file in your `convex/` folder and use the client you\'ve exported above:',
            ],
            code: `// http.ts

import { ossStats } from "./example";
import { httpRouter } from "convex/server";

const http = httpRouter();

ossStats.registerRoutes(http);
export default http;`,
          },
        ],
      },
      {
        heading: 'Querying data from the frontend',
        paragraphs: [
          'Use the `useQuery` hook to get data from the component. Here\'s an example of how to get data for a GitHub owner (org or user) and an npm package or org:',
        ],
        code: `// src/OssStats.tsx

import { useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'

const OssStats = () => {
  const githubOwner = useQuery(api.stats.getGithubOwner, {
    owner: 'get-convex',
  })
  const npmOrg = useQuery(api.stats.getNpmOrg, {
    org: 'convex-dev',
  })

  return (
    <>
      {/* If webhook is registered, this will update in realtime 🔥 */}
      <div>{githubOwner.starCount}</div>
      <div>{npmOrg.downloadCount}</div>
    </>
  )
}`,
      },
      {
        heading: 'Available queries',
        subsections: [
          {
            subheading: 'stats.getGithubOwner',
            code: `const { starCount, dependentCount, dayOfWeekAverages, updatedAt } = useQuery(
  api.stats.getGithubOwner,
  { owner: "get-convex" }
);`,
          },
          {
            subheading: 'stats.getNpmOrg',
            code: `const { downloadCount, dayOfWeekAverages, updatedAt } = useQuery(
  api.stats.getNpmOrg,
  { org: "convex-dev" }
);`,
          },
          {
            subheading: 'stats.getGithubRepo',
            code: `const { starCount, dependentCount, dayOfWeekAverages, updatedAt } = useQuery(
  api.stats.getGithubRepo,
  { name: "get-convex/convex-js" }
);`,
          },
          {
            subheading: 'stats.getGithubRepos',
            code: `const { starCount, dependentCount, dayOfWeekAverages, updatedAt } = useQuery(
  api.stats.getGithubRepos,
  { names: ["get-convex/convex-js", "get-convex/convex-helpers"] }
);`,
          },
          {
            subheading: 'stats.getNpmPackage',
            code: `const { downloadCount, dayOfWeekAverages, updatedAt } = useQuery(
  api.stats.getNpmPackage,
  { name: "@convex-dev/convex-js" }
);`,
          },
          {
            subheading: 'stats.getNpmPackages',
            code: `const { downloadCount, dayOfWeekAverages, updatedAt } = useQuery(
  api.stats.getNpmPackages,
  { names: ["@convex-dev/convex-js", "@convex-dev/convex-helpers"] }
);`,
          },
        ],
      },
      {
        heading: 'React hooks',
        subsections: [
          {
            subheading: 'useNpmDownloadCounter',
            paragraphs: [
              'Provides a forecasted download count for an npm package or org that updates on an interval.',
              'Args:',
              '• `npmPackageOrOrg`: npmPackageOrOrg object returned from the `getNpmPackage` or `getNpmOrg` query',
              '• `options`: optional options object',
              '  - `intervalMs`: override the calculated interval',
              'Returns:',
              '• `count`: regularly updated download count',
              '• `intervalMs`: the interval at which the count is updated (useful for configuring client animations, such as a NumberFlow component)',
            ],
            code: `import { useNpmDownloadCounter } from "@erquhart/convex-oss-stats/react";
import NumberFlow from '@number-flow/react'

const npmOrg = useQuery(api.stats.getNpmOrg, { org: "convex-dev" });

const { count, intervalMs } = useNpmDownloadCounter(npmOrg)

return (
  <NumberFlow
    transformTiming={{
      duration: intervalMs,
      easing: 'linear',
    }}
    value={count}
    trend={1}
    continuous
    willChange
  />
)`,
          },
        ],
      },
      {
        heading: 'Querying data from the backend',
        paragraphs: [
          'You can also query data from the backend using the `ossStats` object. Note: the data will only be available for the owners and npm orgs you configured and have synced.',
        ],
        code: `// Within a Convex query, mutation, or action:
// All of the owners you configured when initializing the OssStats object
const githubOwners = await ossStats.getAllGithubOwners(ctx);
// A single owner
const githubOwner = await ossStats.getGithubOwner(ctx, "get-convex");
// All of the npm orgs you configured when initializing the OssStats object
const npmOrgs = await ossStats.getAllNpmOrgs(ctx);
// A single npm org
const npmOrg = await ossStats.getNpmOrg(ctx, "convex-dev");
// A single github repo
const githubRepo = await ossStats.getGithubRepo(ctx, "get-convex/convex-js");
// Combined stats for a list of github repos
const githubRepos = await ossStats.getGithubRepos(ctx, [
  "get-convex/convex-js",
  "get-convex/convex-helpers",
]);
// A single npm package
const npmPackage = await ossStats.getNpmPackage(ctx, "@convex-dev/convex-js");
// Combined stats for a list of npm packages
const npmPackages = await ossStats.getNpmPackages(ctx, [
  "@convex-dev/convex-js",
  "@convex-dev/convex-helpers",
]);`,
      },
      {
        heading: 'Options and configuration',
        subsections: [
          {
            subheading: 'Manually syncing data',
            paragraphs: [
              'If you don\'t want to use the webhook, you can use a cron job to sync data:',
            ],
            code: `// In convex/crons.ts

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

export const syncStars = internalAction(async (ctx) => {
  await ossStats.sync(ctx);
});

const crons = cronJobs();

crons.interval("syncStars", { minutes: 15 }, internal.stats.syncStars);

export default crons;`,
          },
        ],
        codeBlocks: [
          {
            note: 'You could alternatively call this from the CLI or dashboard:',
            code: 'npx convex run crons:syncStars',
          },
          {
            note: 'Or call it via an http endpoint:',
            code: `// In convex/http.ts

import { httpAction } from "./_generated/server";
//...
http.route({
  path: "/syncStars",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (request.headers.get("x-api-key") !== process.env.API_KEY) {
      return new Response("Unauthorized", { status: 401 });
    }
    await ossStats.sync(ctx);
    return new Response("ok", { status: 200 });
  }),
});`,
          },
          {
            note: '`API_KEY` can be set in the dashboard or via `npx convex env set API_KEY=...`',
          },
        ],
      },
      {
        heading: 'Override the default webhook path',
        paragraphs: [
          'You can override the default `/events/github` path:',
        ],
        code: `ossStats.registerRoutes(http, {
  path: "/my/github/webhook",
});`,
      },
    ],
  },
  {
    id: 'launchdarkly-feature-flags',
    title: 'LaunchDarkly Feature Flags',
    description: 'Sync your LaunchDarkly feature flags with your Convex backend for use in your Convex functions.',
    icon: <Flag size={48} />,
    ...getGradient(8, 'Integrations'),
    weeklyDownloads: 268,
    developer: 'get-convex',
    category: 'Integrations' as ComponentCategory,
    npmPackage: '@convex-dev/launchdarkly',
    repoUrl: 'https://github.com/get-convex/launchdarkly',
    packageUrl: 'https://www.npmjs.com/package/@convex-dev/launchdarkly',
    docsUrl: 'https://github.com/get-convex/launchdarkly#readme',
    docsLinks: [
      { label: 'LaunchDarkly Dashboard', url: 'https://app.launchdarkly.com/' },
      { label: 'Convex Environment Variables', url: 'https://dashboard.convex.dev/deployment/settings/environment-variables' },
      { label: 'LaunchDarkly Convex Integration', url: 'https://app.launchdarkly.com/settings/integrations/convex/new' },
      { label: 'Convex Deployment Settings', url: 'https://dashboard.convex.dev/deployment/settings' },
    ],
    bugReportUrl: 'https://github.com/get-convex/launchdarkly/issues',
    exampleCommands: [
      'git clone https://github.com/get-convex/launchdarkly.git',
      'cd launchdarkly/example',
      'npm install',
      'npm run dev',
    ],
    longDescription: 'This is a Convex component for feature flagging and experimentation using LaunchDarkly. It syncs your LaunchDarkly environment to your Convex deployment, allowing you to use your feature flags in Convex functions.',
    features: [
      'Use feature flags in your Convex backend functions.',
      'Run A/B tests and feature experiments in Convex.',
      'Real-time updates: flags and segments synced automatically.',
      'No additional API requests needed in your app.',
      'Full LaunchDarkly SDK support in Convex queries, mutations, and actions.',
      'Support for multiple LaunchDarkly environments in one Convex app.',
      'Webhook-based sync for instant flag updates.',
      'Secure token-based authentication.',
      'Production-ready configuration.',
      'Beta: some features may be unsupported.',
    ],
    documentationSections: [
      {
        heading: 'Overview',
        paragraphs: [
          'This is a Convex component for feature flagging and experimentation using LaunchDarkly.',
          'It syncs your LaunchDarkly environment to your Convex deployment, allowing you to use your feature flags in Convex.',
        ],
      },
      {
        heading: 'Why use LaunchDarkly with Convex?',
        paragraphs: [
          '• **Feature flags in your backend**: Use feature flags in your Convex functions to dynamically control the behavior of your app.',
          '• **Experimentation**: Run A/B tests and feature experiments in Convex using LaunchDarkly.',
          '• **Real-time updates**: Your LaunchDarkly flags and segments are synced to Convex in real-time, so you can use them in your app without needing to make additional API requests.',
        ],
      },
      {
        heading: 'Prerequisites',
        subsections: [
          {
            subheading: 'LaunchDarkly account',
            paragraphs: [
              'To use this component you must have a LaunchDarkly account.',
            ],
          },
          {
            subheading: 'Convex App',
            paragraphs: [
              'You\'ll need an existing Convex project to use the component. Convex is a hosted backend platform, including a database, serverless functions, and a ton more you can learn about [here](https://docs.convex.dev/home).',
              'Run `npm create convex` or follow any of the quickstarts to set one up.',
            ],
          },
        ],
      },
      {
        heading: 'Installation',
        subsections: [
          {
            subheading: 'Step 1: Install and configure the component package',
            paragraphs: [
              'Install the component package:',
            ],
            code: 'npm install @convex-dev/launchdarkly',
          },
          {
            subheading: 'Step 2: Install the component',
            paragraphs: [
              'Create a `convex.config.ts` file in your app\'s `convex/` folder and install the component by calling `use`:',
            ],
            code: `// convex/convex.config.ts

import { defineApp } from "convex/server";
import launchdarkly from "@convex-dev/launchdarkly/convex.config.js";

const app = defineApp();
app.use(launchdarkly);

export default app;`,
          },
          {
            subheading: 'Step 3: Push changes to Convex',
            paragraphs: [
              'Once you\'ve installed the component, make sure you push your changes to your Convex app:',
            ],
            code: 'npx convex dev',
          },
          {
            subheading: 'Step 4: Register webhooks',
            paragraphs: [
              'Register webhooks by creating an `http.ts` file in your `convex/` folder:',
            ],
            code: `// convex/http.ts

import { httpRouter } from "convex/server";
import { registerRoutes } from "@convex-dev/launchdarkly";
import { components } from "./_generated/api";

const http = httpRouter();

// You may pass a third parameter here to override the default path of \`/ld/webhook\`
registerRoutes(components.launchdarkly, http);

export default http;`,
          },
        ],
        codeBlocks: [
          {
            note: 'This will register two webhook HTTP handlers in your your Convex app\'s deployment:',
          },
          {
            note: '• `GET YOUR_CONVEX_SITE_URL/ld/webhook` - LaunchDarkly will use this endpoint to verify the installation of your component.',
          },
          {
            note: '• `PUT YOUR_CONVEX_SITE_URL/ld/webhook` - LaunchDarkly will send your flag and segment data to this endpoint.',
          },
        ],
      },
      {
        heading: 'Configure the LaunchDarkly integration',
        paragraphs: [
          'Now, you\'ll need to copy your LaunchDarkly environment\'s SDK Key and store it in the component. You can copy your LaunchDarkly SDK by loading the [LaunchDarkly dashboard](https://app.launchdarkly.com/). From there visit your project\'s settings and copy the SDK key for your environment.',
          'The value you copied should start with `sdk-`.',
          'Store the SDK key you copied as an environment variable named `LAUNCHDARKLY_SDK_KEY` in your Convex deployment. You can do so on the [environment variables page](https://dashboard.convex.dev/deployment/settings/environment-variables) or via `npx convex env set LAUNCHDARKLY_SDK_KEY sdk-***` from the CLI.',
        ],
        codeBlocks: [
          {
            note: 'You can now configure the LaunchDarkly integration. On the [Integrations page](https://app.launchdarkly.com/settings/integrations/convex/new) of the LaunchDarkly dashboard, search for Convex and click "Add Integration".',
          },
          {
            note: 'Each of your Convex deployments (e.g. Production and other developer\'s environments) will need their own integration configured in LaunchDarkly.',
          },
          {
            note: 'Select a name and environment for the integration.',
          },
          {
            note: 'For "Webhook URL", use your deployment\'s HTTP Actions URL suffixed with the path provided to the `registerRoutes` call in your `http.ts` file. By default, the path is `/ld/webhook`. You can retrieve your HTTP Actions URL on the [Deployment Settings page](https://dashboard.convex.dev/deployment/settings) of the Convex dashboard. Example: `https://techno-kitten-138.convex.site/ld/webhook`',
          },
          {
            note: 'For "Component API Token", generate a shared secret to be used by the LaunchDarkly integration. This will ensure the payloads sent to your webhook are coming from LaunchDarkly.',
            code: 'npx convex run --component=launchdarkly tokens:generate --push',
          },
          {
            note: 'Once you save, you can open the integration form again and click the Validate button to test the connection. If you encounter errors, check the logs page in the Convex dashboard for more information.',
          },
        ],
      },
      {
        heading: 'Using the LaunchDarkly component',
        paragraphs: [
          'You may initialize the LaunchDarkly class with the component configuration and use the LaunchDarkly SDK as you would in a normal JavaScript application.',
        ],
        code: `import { LaunchDarkly } from "@convex-dev/launchdarkly";
import { components } from "./_generated/api";
import { query } from "./_generated/server";

const launchdarkly = new LaunchDarkly(components.launchdarkly);

export const myQuery = query({
  args: {},
  handler: async ({ ctx }) => {
    const ld = launchdarkly.sdk(ctx);
    const isFlagOn = await ld.boolVariation(
      "my-flag",
      { key: "myUser" },
      false,
    );
    if (isFlagOn) {
      // Do something when flag is on
    } else {
      // Do something when flag is off
    }
  },
});`,
        codeBlocks: [
          {
            note: 'You can run the example in the examples folder to see how the LaunchDarkly component works.',
          },
        ],
      },
      {
        heading: 'Production',
        paragraphs: [
          'When you\'re ready to deploy your app to production with LaunchDarkly, be sure to follow all the setup steps for production, including adding the `LAUNCHDARKLY_SDK_KEY` environment variable and configuring an additional shared secret and integration for Production. You\'ll want this to be configured before any of your code relies on the LaunchDarkly flags.',
        ],
        code: 'npx convex run --component=launchdarkly --prod tokens:generate',
        codeBlocks: [
          {
            note: 'You may use this command to generate your production secret.',
          },
        ],
      },
      {
        heading: 'Syncing multiple LaunchDarkly environments in one Convex app',
        paragraphs: [
          'If you have multiple LaunchDarkly environments, you can create a separate component configuration for each environment.',
        ],
        code: `// convex/convex.config.js

import { defineApp } from "convex/server";
import launchdarkly from "@convex-dev/launchdarkly/convex.config.js";

const app = defineApp();

app.use(launchdarkly, {
  name: "first",
});

app.use(launchdarkly, {
  name: "second",
});

export default app;`,
        codeBlocks: [
          {
            note: 'Be sure to also update your `http.ts` file to register the routes for each component:',
            code: `// convex/http.ts

import { httpRouter } from "convex/server";
import { registerRoutes } from "@convex-dev/launchdarkly";
import { components } from "./_generated/api";

const http = httpRouter();

registerRoutes(components.first, http, "/ld/first");
registerRoutes(components.second, http, "/ld/second");

export default http;`,
          },
          {
            note: 'Then you can generate a separate shared secret for each environment:',
            code: `npx convex run --component=first tokens:generate
npx convex run --component=second tokens:generate`,
          },
          {
            note: 'Also, store the appropriate SDK keys in your Convex deployment for each LaunchDarkly environment:',
          },
          {
            note: 'These secrets can be plugged into separate integration configurations in LaunchDarkly.',
          },
          {
            note: 'Once configured, you may initialize `LaunchDarkly` with the appropriate component configuration:',
            code: `import { LaunchDarkly } from "@convex-dev/launchdarkly";

const launchDarklyFirst = new LaunchDarkly(components.first, {
  LAUNCHDARKLY_SDK_KEY: process.env.LAUNCHDARKLY_SDK_KEY_FIRST!,
});

const launchDarklySecond = new LaunchDarkly(components.second, {
  LAUNCHDARKLY_SDK_KEY: process.env.LAUNCHDARKLY_SDK_KEY_SECOND!,
});

export const myQuery = query({
  args: {},
  handler: async ({ ctx }) => {
    const ldFirst = launchdarklyFirst.sdk(ctx);
    const ldSecond = launchDarklySecond.sdk(ctx);
    ...
  },
});`,
          },
        ],
      },
      {
        heading: 'Unsupported LaunchDarkly features',
        paragraphs: [
          'The LaunchDarkly component for Convex is in beta, and may not support all functionality available in the LaunchDarkly SDK. If you encounter any issues or need help with a specific feature, please [file an issue](https://github.com/get-convex/launchdarkly/issues) in the GitHub repository.',
        ],
        codeBlocks: [
          {
            note: '• Sending events in Convex queries is not supported. If you would like to have the SDK send events to LaunchDarkly (e.g. flag evaluation insights and for experimentation), you should use LaunchDarkly in a mutation or action instead.',
          },
          {
            note: '• Big segments',
          },
          {
            note: '• Diagnostic events',
          },
        ],
      },
    ],
  },
  {
    id: 'dodo-payments',
    title: 'Dodo Payments',
    description: 'Dodo Payments is your complete solution for billing and payments, purpose-built for AI and SaaS applications.',
    icon: <Wallet size={48} />,
    ...getGradient(9, 'Integrations'),
    weeklyDownloads: 117,
    developer: 'dodopayments',
    category: 'Integrations' as ComponentCategory,
    npmPackage: '@dodopayments/convex',
    repoUrl: 'https://github.com/dodopayments/dodo-adapters/tree/main/packages/convex',
    packageUrl: 'https://www.npmjs.com/package/@dodopayments/convex',
    docsUrl: 'https://docs.dodopayments.com/developer-resources/convex-component',
    docsLinks: [
      { label: 'Dodo Payments website', url: 'https://dodopayments.com/' },
      { label: 'Dodo Payments Convex Component docs', url: 'https://docs.dodopayments.com/developer-resources/convex-component' },
    ],
    bugReportUrl: 'https://github.com/dodopayments/dodo-adapters/issues',
    exampleCommands: [
      'npm install @dodopayments/convex',
      'npx convex dashboard',
      'npx convex dev',
    ],
    longDescription: 'This component is the official way to integrate Dodo Payments in your Convex project. It provides Checkout Session integration, Customer Portal functionality, and efficient webhook handling with automatic verification.',
    features: [
      'Checkout Session: Integrate Dodo Payments Checkout with a couple of lines of code.',
      'Customer Portal: Allow customers to manage subscriptions and details.',
      'Webhooks: Handle webhooks efficiently with automatic verification.',
      'Session-based checkout with full feature support.',
      'Multiple billing models (usage-based, subscriptions, one-time payments).',
      'Global Merchant of Record support.',
      'Support for 150+ countries and 80+ currencies.',
      '30+ payment methods supported.',
      'Automatic webhook signature verification.',
      'Full TypeScript support.',
    ],
    documentationSections: [
      {
        heading: 'Overview',
        paragraphs: [
          'This component is the official way to integrate Dodo Payments in your Convex project.',
        ],
        codeBlocks: [
          {
            note: 'Features:',
          },
          {
            note: '• **Checkout Session**: Integrate Dodo Payments Checkout with a couple of lines of code.',
          },
          {
            note: '• **Customer Portal**: Allow customers to manage subscriptions and details.',
          },
          {
            note: '• **Webhooks**: Handle webhooks efficiently. Just write your business logic and handle the events you want. Webhook verification is taken care by us.',
          },
          {
            note: 'Detailed documentation can be found at [Dodo Payments Convex Component](https://docs.dodopayments.com/developer-resources/convex-component)',
          },
        ],
      },
      {
        heading: 'Prerequisites',
        subsections: [
          {
            subheading: 'Dodo Payments account',
            paragraphs: [
              'Create a [Dodo Payments](https://dodopayments.com/) account and get the `API_KEY` and `WEBHOOK_SECRET`.',
            ],
          },
          {
            subheading: 'Convex App',
            paragraphs: [
              'You\'ll need a Convex App to use the component. Follow any of the [Convex quickstarts](https://docs.convex.dev/home) to set one up.',
            ],
          },
        ],
        codeBlocks: [
          {
            note: '**Note:** This component does not define a schema. Define your own schema based on your application\'s needs.',
          },
        ],
      },
      {
        heading: 'Installation',
        subsections: [
          {
            subheading: 'Step 1: Install the package',
            paragraphs: [
              'Install the component package:',
            ],
            code: 'npm install @dodopayments/convex',
          },
          {
            subheading: 'Step 2: Add component to Convex config',
            paragraphs: [
              'Add the component to your Convex configuration:',
            ],
            code: `// convex/convex.config.ts

import { defineApp } from "convex/server";
import dodopayments from "@dodopayments/convex/convex.config";

const app = defineApp();
app.use(dodopayments);
export default app;`,
          },
          {
            subheading: 'Step 3: Set up environment variables',
            paragraphs: [
              'Add your environment variables in the Convex dashboard (**Settings** → **Environment Variables**). You can open the dashboard by running:',
            ],
            code: 'npx convex dashboard',
          },
        ],
        codeBlocks: [
          {
            note: 'Set the following variables:',
          },
          {
            note: '• `DODO_PAYMENTS_API_KEY=your-api-key`',
          },
          {
            note: '• `DODO_PAYMENTS_ENVIRONMENT=test_mode`',
          },
          {
            note: '• `DODO_PAYMENTS_WEBHOOK_SECRET=your-webhook-secret` (if using webhooks)',
          },
          {
            note: '**Note:** Convex backend functions only read environment variables set in the Convex dashboard. `.env` files are ignored. Always set secrets in the Convex dashboard for both production and development.',
          },
        ],
      },
      {
        heading: 'Component setup',
        subsections: [
          {
            subheading: 'Step 1: Create internal query',
            paragraphs: [
              'First, create an internal query to fetch customers from your database. This will be used in the payment functions to identify customers.',
            ],
            code: `// convex/customers.ts

import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Internal query to fetch customer by auth ID
// Customize this based on your database schema and authentication provider
export const getByAuthId = internalQuery({
  args: { authId: v.string() },
  handler: async (ctx, { authId }) => {
    return await ctx.db
      .query("customers")
      .withIndex("by_auth_id", (q) => q.eq("authId", authId))
      .first();
  },
});`,
          },
          {
            subheading: 'Step 2: Configure DodoPayments component',
            paragraphs: [
              'Configure the DodoPayments component:',
            ],
            code: `// convex/dodo.ts

import { DodoPayments, DodoPaymentsClientConfig } from "@dodopayments/convex";
import { components } from "./_generated/api";
import { internal } from "./_generated/api";

export const dodo = new DodoPayments(components.dodopayments, {
  // This function maps your Convex customer to a Dodo Payments customer
  // Customize it based on your authentication provider and customer database
  identify: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null; // Customer is not logged in
    }

    // Use ctx.runQuery() to lookup customer from your database
    const customer = await ctx.runQuery(internal.customers.getByAuthId, {
      authId: identity.subject,
    });

    if (!customer) {
      return null; // Customer not found in database
    }

    return {
      dodoCustomerId: customer.dodoCustomerId, // Replace customer.dodoCustomerId with your field storing Dodo Payments customer ID
    };
  },
  apiKey: process.env.DODO_PAYMENTS_API_KEY!,
  environment: process.env.DODO_PAYMENTS_ENVIRONMENT as
    | "test_mode"
    | "live_mode",
} as DodoPaymentsClientConfig);

// Export the API methods for use in your app
export const { checkout, customerPortal } = dodo.api();`,
          },
        ],
      },
      {
        heading: 'Checkout function',
        paragraphs: [
          'The Dodo Payments Convex component uses session-based checkout, providing a secure, customizable checkout experience with pre-configured product carts and customer details. This is the recommended approach for all payment flows.',
        ],
        subsections: [
          {
            subheading: 'Define payment actions',
            paragraphs: [
              'Create actions that use the checkout function:',
            ],
            code: `// convex/payments.ts

import { action } from "./_generated/server";
import { v } from "convex/values";
import { checkout } from "./dodo";

export const createCheckout = action({
  args: {
    product_cart: v.array(
      v.object({
        product_id: v.string(),
        quantity: v.number(),
      }),
    ),
    returnUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await checkout(ctx, {
      payload: {
        product_cart: args.product_cart,
        return_url: args.returnUrl,
        billing_currency: "USD",
        feature_flags: {
          allow_discount_code: true,
        },
      },
    });
  },
});`,
          },
          {
            subheading: 'Frontend usage',
            paragraphs: [
              'Use the checkout function from your React components:',
            ],
            code: `import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";

export function CheckoutButton() {
  const createCheckout = useAction(api.payments.createCheckout);

  const handleCheckout = async () => {
    const { checkout_url } = await createCheckout({
      product_cart: [{ product_id: "prod_123", quantity: 1 }],
    });
    window.location.href = checkout_url;
  };

  return <button onClick={handleCheckout}>Buy Now</button>;
}`,
          },
        ],
        codeBlocks: [
          {
            note: '**Usage:**',
            code: `const result = await checkout(ctx, {
  payload: {
    product_cart: [{ product_id: "prod_123", quantity: 1 }],
    customer: { email: "[email protected]" },
    return_url: "https://example.com/success"
  }
});`,
          },
          {
            note: '**Response Format:**',
            code: `{
  "checkout_url": "https://checkout.dodopayments.com/session/..."
}`,
          },
          {
            note: 'Refer to [Checkout Sessions](https://docs.dodopayments.com/developer-resources/checkout-session) for more details and a complete list of supported fields.',
          },
        ],
      },
      {
        heading: 'Customer portal function',
        paragraphs: [
          'The Customer Portal Function enables you to seamlessly integrate the Dodo Payments customer portal into your Convex application.',
        ],
        code: `// convex/payments.ts (add to existing file)

import { action } from "./_generated/server";
import { v } from "convex/values";
import { customerPortal } from "./dodo";

export const getCustomerPortal = action({
  args: {
    send_email: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await customerPortal(ctx, args);
  },
});`,
        codeBlocks: [
          {
            note: '**Usage:**',
            code: `const result = await customerPortal(ctx, {
  send_email: false
});`,
          },
          {
            note: '**Parameters:**',
          },
          {
            note: '• `send_email`: boolean - If set to `true`, sends an email to the customer with the portal link.',
          },
          {
            note: 'The customer is automatically identified using the `identify` function configured in your DodoPayments setup. This function should return the customer\'s `dodoCustomerId`.',
          },
          {
            note: '**Frontend usage:**',
            code: `import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";

export function CustomerPortalButton() {
  const getPortal = useAction(api.payments.getCustomerPortal);

  const handlePortal = async () => {
    const { portal_url } = await getPortal({ send_email: false });
    window.location.href = portal_url;
  };

  return <button onClick={handlePortal}>Manage Subscription</button>;
}`,
          },
        ],
      },
      {
        heading: 'Webhook handler',
        paragraphs: [
          'For handling Dodo Payments webhooks, create a file `convex/http.ts`:',
        ],
        code: `// convex/http.ts

import { createDodoWebhookHandler } from "@dodopayments/convex";
import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/dodopayments-webhook",
  method: "POST",
  handler: createDodoWebhookHandler({
    // Handle successful payments
    onPaymentSucceeded: async (ctx, payload) => {
      console.log("🎉 Payment Succeeded!");
      // Use Convex context to persist payment data
      await ctx.runMutation(internal.webhooks.createPayment, {
        paymentId: payload.data.payment_id,
        businessId: payload.business_id,
        customerEmail: payload.data.customer.email,
        amount: payload.data.total_amount,
        currency: payload.data.currency,
        status: payload.data.status,
        webhookPayload: JSON.stringify(payload),
      });
    },

    // Handle subscription activation
    onSubscriptionActive: async (ctx, payload) => {
      console.log("🎉 Subscription Activated!");
      // Use Convex context to persist subscription data
      await ctx.runMutation(internal.webhooks.createSubscription, {
        subscriptionId: payload.data.subscription_id,
        businessId: payload.business_id,
        customerEmail: payload.data.customer.email,
        status: payload.data.status,
        webhookPayload: JSON.stringify(payload),
      });
    },
    // Add other event handlers as needed
  }),
});

export default http;`,
        codeBlocks: [
          {
            note: '**Important:** Make sure to define the corresponding database mutations in your Convex backend for each webhook event you want to handle. For example, create a `createPayment` mutation to record successful payments or a `createSubscription` mutation to manage subscription state.',
          },
          {
            note: '**Important:** All webhook handlers receive the Convex `ActionCtx` as the first parameter, allowing you to use `ctx.runQuery()` and `ctx.runMutation()` to interact with your database.',
          },
          {
            note: 'Add your webhook secret in the Convex dashboard (**Settings** → **Environment Variables**):',
          },
          {
            note: '• `DODO_PAYMENTS_WEBHOOK_SECRET=your-webhook-secret`',
          },
        ],
      },
      {
        heading: 'Supported webhook events',
        paragraphs: [
          'The webhook handler supports the following events:',
        ],
        codeBlocks: [
          {
            note: '• `onPaymentSucceeded` - Payment successfully completed',
          },
          {
            note: '• `onPaymentFailed` - Payment failed',
          },
          {
            note: '• `onPaymentProcessing` - Payment is being processed',
          },
          {
            note: '• `onPaymentCancelled` - Payment was cancelled',
          },
          {
            note: '• `onRefundSucceeded` - Refund successfully processed',
          },
          {
            note: '• `onRefundFailed` - Refund failed',
          },
          {
            note: '• `onSubscriptionActive` - Subscription activated',
          },
          {
            note: '• `onSubscriptionOnHold` - Subscription put on hold',
          },
          {
            note: '• `onSubscriptionRenewed` - Subscription renewed',
          },
          {
            note: '• `onSubscriptionPlanChanged` - Subscription plan changed',
          },
          {
            note: '• `onSubscriptionCancelled` - Subscription cancelled',
          },
          {
            note: '• `onSubscriptionFailed` - Subscription payment failed',
          },
          {
            note: '• `onSubscriptionExpired` - Subscription expired',
          },
          {
            note: '• `onDisputeOpened` - Dispute opened',
          },
          {
            note: '• `onLicenseKeyCreated` - License key created',
          },
          {
            note: 'And more...',
          },
          {
            note: '**Webhook Handler Features:**',
          },
          {
            note: '• **Method**: Only POST requests are supported. Other methods return 405.',
          },
          {
            note: '• **Signature Verification**: Verifies the webhook signature using `DODO_PAYMENTS_WEBHOOK_SECRET`. Returns 401 if verification fails.',
          },
          {
            note: '• **Payload Validation**: Validated with Zod. Returns 400 for invalid payloads.',
          },
          {
            note: '• **Error Handling**:',
          },
          {
            note: '  - 401: Invalid signature',
          },
          {
            note: '  - 400: Invalid payload',
          },
          {
            note: '  - 500: Internal error during verification',
          },
          {
            note: '• **Event Routing**: Calls the appropriate event handler based on the payload type.',
          },
        ],
      },
      {
        heading: 'Run convex dev',
        paragraphs: [
          'After setting up the component, run `npx convex dev` to generate the necessary types:',
        ],
        code: 'npx convex dev',
      },
    ],
  },
  {
    id: 'loops',
    title: 'Loops',
    description: 'Integrate with Loops.so email marketing platform. Send transactional emails, manage contacts, trigger loops, and monitor operations with built-in spam detection and rate limiting.',
    icon: <Mail size={48} />,
    gradientFrom: '#fed7aa',
    gradientTo: '#fde68a',
    weeklyDownloads: 0,
    developer: 'devwithbobby',
    category: 'Integrations' as ComponentCategory,
    npmPackage: '@devwithbobby/loops',
    repoUrl: 'https://github.com/robertalv/loops',
    packageUrl: 'https://www.npmjs.com/package/@devwithbobby/loops',
    docsUrl: 'https://github.com/robertalv/loops#readme',
    docsLinks: [
      { label: 'Loops.so Documentation', url: 'https://loops.so/docs' },
      { label: 'Loops.so API Settings', url: 'https://app.loops.so/settings/api' },
      { label: 'Convex Environment Variables', url: 'https://docs.convex.dev/production/environment-variables' },
      { label: 'Convex Actions', url: 'https://docs.convex.dev/functions/actions' },
    ],
    bugReportUrl: 'https://github.com/robertalv/loops/issues',
    exampleCommands: [
      'git clone https://github.com/robertalv/loops.git',
      'cd loops/example',
      'npm install',
      'npm run dev',
    ],
    longDescription: 'A Convex component for integrating with Loops.so email marketing platform. Send transactional emails, manage contacts, trigger loops, and monitor email operations with built-in spam detection and rate limiting. Perfect for SaaS applications that need reliable email delivery with comprehensive monitoring and abuse prevention.',
    features: [
      'Contact Management - Create, update, find, and delete contacts.',
      'Transactional Emails - Send one-off emails with templates.',
      'Events - Trigger email workflows based on events.',
      'Loops - Trigger automated email sequences.',
      'Monitoring - Track all email operations with spam detection.',
      'Rate Limiting - Built-in rate limiting queries for abuse prevention.',
      'Spam Detection - Identify suspicious activity by recipient or actor.',
      'Email Statistics - Comprehensive analytics and operation tracking.',
      'Type-Safe - Full TypeScript support with Zod validation.',
      'Secure - Environment variable-based API key management.',
    ],
    documentationSections: [
      {
        heading: 'Overview',
        paragraphs: [
          'This Convex component provides a complete integration with Loops.so, a modern email marketing platform designed for software companies. Whether you need to send transactional emails, manage your contact list, trigger automated email sequences, or monitor email operations, this component has you covered.',
          'The component includes built-in monitoring, spam detection, and rate limiting capabilities to help prevent abuse and ensure reliable email delivery. All email operations are automatically logged for analytics and compliance purposes.',
        ],
        codeBlocks: [
          {
            note: 'Get your API key from the [Loops.so Dashboard](https://app.loops.so/settings/api) to get started.',
          },
        ],
      },
      {
        heading: 'Prerequisites',
        subsections: [
          {
            subheading: 'Loops.so Account',
            paragraphs: [
              'You\'ll need a Loops.so account and API key to use this component. Sign up at [Loops.so](https://loops.so/) and get your API key from the [API settings page](https://app.loops.so/settings/api).',
            ],
          },
          {
            subheading: 'Convex App',
            paragraphs: [
              'You\'ll need an existing Convex project to use the component. Convex is a hosted backend platform, including a database, serverless functions, and a ton more you can learn about [here](https://docs.convex.dev/home).',
              'Run `npm create convex` or follow any of the quickstarts to set one up.',
            ],
          },
        ],
      },
      {
        heading: 'Installation',
        subsections: [
          {
            subheading: 'Step 1: Install the package',
            paragraphs: [
              'Install the component package:',
            ],
            code: 'npm install @devwithbobby/loops',
          },
          {
            subheading: 'Step 2: Install the component',
            paragraphs: [
              'Create a `convex.config.ts` file in your app\'s `convex/` folder and install the component by calling `use`:',
            ],
            code: `// convex/convex.config.ts

import { defineApp } from "convex/server";
import loops from "@devwithbobby/loops/convex.config";

const app = defineApp();
app.use(loops);

export default app;`,
          },
          {
            subheading: 'Step 3: Set up environment variables',
            paragraphs: [
              '**⚠️ IMPORTANT:** Set your Loops API key before using the component. Get your API key from the [Loops.so Dashboard](https://app.loops.so/settings/api).',
              'Set the environment variable using the Convex CLI:',
            ],
            code: 'npx convex env set LOOPS_API_KEY "your-loops-api-key-here"',
          },
        ],
        codeBlocks: [
          {
            note: 'Or via Convex Dashboard: Go to Settings → Environment Variables and add `LOOPS_API_KEY` with your Loops.so API key.',
          },
          {
            note: '**⚠️ Security:** Never pass the API key directly in code or via function options in production. Always use environment variables.',
          },
        ],
      },
      {
        heading: 'Usage',
        paragraphs: [
          'Initialize the Loops client and create functions to use the component. All functions should be wrapped with authentication checks in production:',
        ],
        code: `import { Loops } from "@devwithbobby/loops";
import { components } from "./_generated/api";
import { action } from "./_generated/server";
import { v } from "convex/values";

// Initialize the Loops client
const loops = new Loops(components.loops);

// Export functions wrapped with auth (required in production)
export const addContact = action({
  args: {
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Add authentication check
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    return await loops.addContact(ctx, args);
  },
});

export const sendWelcomeEmail = action({
  args: {
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Send transactional email
    return await loops.sendTransactional(ctx, {
      transactionalId: "welcome-email-template-id",
      email: args.email,
      dataVariables: {
        name: args.name,
      },
    });
  },
});`,
      },
      {
        heading: 'Contact Management',
        paragraphs: [
          'Manage your contact list with create, update, find, and delete operations:',
        ],
        code: `// Add or update a contact
await loops.addContact(ctx, {
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
  userId: "user123",
  source: "webapp",
  subscribed: true,
  userGroup: "premium",
});

// Update a contact
await loops.updateContact(ctx, "user@example.com", {
  firstName: "Jane",
  userGroup: "vip",
});

// Find a contact
const contact = await loops.findContact(ctx, "user@example.com");

// Delete a contact
await loops.deleteContact(ctx, "user@example.com");

// Batch create contacts
await loops.batchCreateContacts(ctx, {
  contacts: [
    { email: "user1@example.com", firstName: "John" },
    { email: "user2@example.com", firstName: "Jane" },
  ],
});

// Unsubscribe or resubscribe
await loops.unsubscribeContact(ctx, "user@example.com");
await loops.resubscribeContact(ctx, "user@example.com");`,
        codeBlocks: [
          {
            note: 'You can also count contacts with filters:',
            code: `// Count all contacts
const total = await loops.countContacts(ctx, {});

// Count by filter
const premium = await loops.countContacts(ctx, {
  userGroup: "premium",
  subscribed: true,
});`,
          },
        ],
      },
      {
        heading: 'Email Sending',
        paragraphs: [
          'Send transactional emails, trigger events, or start automated email sequences:',
        ],
        code: `// Send transactional email
await loops.sendTransactional(ctx, {
  transactionalId: "template-id-from-loops",
  email: "user@example.com",
  dataVariables: {
    name: "John",
    orderId: "12345",
  },
});

// Send event (triggers workflows)
await loops.sendEvent(ctx, {
  email: "user@example.com",
  eventName: "purchase_completed",
  eventProperties: {
    product: "Premium Plan",
    amount: 99.99,
  },
});

// Trigger loop (automated sequence)
await loops.triggerLoop(ctx, {
  loopId: "loop-id-from-loops",
  email: "user@example.com",
  dataVariables: {
    onboardingStep: "welcome",
  },
});`,
      },
      {
        heading: 'Monitoring & Analytics',
        paragraphs: [
          'The component automatically logs all email operations. Use built-in queries to monitor email statistics and detect spam patterns:',
        ],
        code: `// Get email statistics
const stats = await loops.getEmailStats(ctx, {
  timeWindowMs: 3600000, // Last hour
});

console.log(stats.totalOperations); // Total emails sent
console.log(stats.successfulOperations); // Successful sends
console.log(stats.failedOperations); // Failed sends
console.log(stats.operationsByType); // Breakdown by type
console.log(stats.uniqueRecipients); // Unique email addresses

// Detect spam patterns
const spamRecipients = await loops.detectRecipientSpam(ctx, {
  timeWindowMs: 3600000,
  maxEmailsPerRecipient: 10,
});

const spamActors = await loops.detectActorSpam(ctx, {
  timeWindowMs: 3600000,
  maxEmailsPerActor: 50,
});

const rapidFire = await loops.detectRapidFirePatterns(ctx, {
  timeWindowMs: 60000, // Last minute
  maxEmailsPerWindow: 5,
});`,
      },
      {
        heading: 'Rate Limiting',
        paragraphs: [
          'Prevent abuse with built-in rate limiting capabilities. Check limits before sending emails:',
        ],
        code: `// Check recipient rate limit
const recipientCheck = await loops.checkRecipientRateLimit(ctx, {
  email: "user@example.com",
  timeWindowMs: 3600000, // 1 hour
  maxEmails: 10,
});

if (!recipientCheck.allowed) {
  throw new Error(\`Rate limit exceeded. Try again after \${recipientCheck.retryAfter}ms\`);
}

// Check actor rate limit
const actorCheck = await loops.checkActorRateLimit(ctx, {
  actorId: "user123",
  timeWindowMs: 60000, // 1 minute
  maxEmails: 20,
});

// Check global rate limit
const globalCheck = await loops.checkGlobalRateLimit(ctx, {
  timeWindowMs: 60000,
  maxEmails: 1000,
});`,
        codeBlocks: [
          {
            note: 'Example: Rate-limited email sending',
            code: `export const sendTransactionalWithRateLimit = action({
  args: {
    transactionalId: v.string(),
    email: v.string(),
    actorId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const actorId = args.actorId ?? identity.subject;

    // Check rate limit before sending
    const rateLimitCheck = await loops.checkActorRateLimit(ctx, {
      actorId,
      timeWindowMs: 60000, // 1 minute
      maxEmails: 10,
    });

    if (!rateLimitCheck.allowed) {
      throw new Error(
        \`Rate limit exceeded. Please try again after \${rateLimitCheck.retryAfter}ms.\`
      );
    }

    // Send email
    return await loops.sendTransactional(ctx, {
      ...args,
      actorId,
    });
  },
});`,
          },
        ],
      },
      {
        heading: 'Security Best Practices',
        paragraphs: [
          'When using this component in production, follow these security best practices:',
        ],
        subsections: [
          {
            subheading: 'Authentication',
            paragraphs: [
              'Always wrap all functions with authentication checks. Never expose Loops functions directly without verifying the user identity:',
            ],
            code: `export const addContact = action({
  args: { email: v.string(), ... },
  handler: async (ctx, args) => {
    // Add authentication check
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    // Add authorization checks if needed
    // if (!isAdmin(identity)) throw new Error("Forbidden");
    
    return await loops.addContact(ctx, args);
  },
});`,
          },
          {
            subheading: 'Environment Variables',
            paragraphs: [
              'Store your Loops API key in Convex environment variables. Never hardcode API keys or pass them via function arguments.',
            ],
          },
          {
            subheading: 'Rate Limiting',
            paragraphs: [
              'Use the built-in rate limiting queries to prevent abuse. Implement recipient, actor, and global rate limits based on your use case.',
            ],
          },
          {
            subheading: 'Monitoring',
            paragraphs: [
              'Monitor for spam patterns and unusual activity using the built-in spam detection queries. Set up alerts for suspicious behavior.',
            ],
          },
        ],
      },
      {
        heading: 'Using the API Helper',
        paragraphs: [
          'The component exports an `api()` helper for easier re-exporting of all functions:',
        ],
        code: `import { Loops } from "@devwithbobby/loops";
import { components } from "./_generated/api";

const loops = new Loops(components.loops);

// Export all functions at once
export const {
  addContact,
  updateContact,
  sendTransactional,
  sendEvent,
  triggerLoop,
  countContacts,
  // ... all other functions
} = loops.api();`,
        codeBlocks: [
          {
            note: '**⚠️ Security Warning:** The `api()` helper exports functions without authentication. Always wrap these functions with auth checks in production as shown in the Security Best Practices section.',
          },
        ],
      },
    ],
  },

  // Backend
  {
    id: 'rate-limiter',
    title: 'Rate Limiter',
    description: 'Define and use application-layer rate limits. Type-safe, transactional, fair, safe, and configurable sharding to scale.',
    icon: <Gauge size={48} />,
    ...getGradient(0, 'Backend'),
    weeklyDownloads: 21208,
    developer: 'get-convex',
    category: 'Backend',
    npmPackage: '@convex-dev/rate-limiter',
    repoUrl: 'https://github.com/get-convex/rate-limiter',
    packageUrl: 'https://www.npmjs.com/package/@convex-dev/rate-limiter',
    docsUrl: 'https://github.com/get-convex/rate-limiter#readme',
    docsLinks: [
      { label: 'Rate limiting Stack post', url: 'https://stack.convex.dev/rate-limiting' },
      { label: 'How Convex works: Read and write sets', url: 'https://stack.convex.dev/how-convex-works#read-and-write-sets' },
      { label: 'Thundering herd problem', url: 'https://en.wikipedia.org/wiki/Thundering_herd_problem' },
    ],
    bugReportUrl: 'https://github.com/get-convex/rate-limiter/issues',
    exampleCommands: [
      'git clone https://github.com/get-convex/rate-limiter.git',
      'cd rate-limiter/example',
      'npm install',
      'npm run dev',
    ],
    longDescription: 'This component provides application-layer rate limiting. It allows you to control how often actions can be performed with type-safe, transactional, fair, and scalable rate limiting using token bucket or fixed window algorithms.',
    features: [
      'Type-safe usage: prevent misspelling rate limit names.',
      'Configurable for fixed window or token bucket algorithms.',
      'Efficient storage and compute: storage is not proportional to requests.',
      'Configurable sharding for scalability.',
      'Transactional evaluation: all rate limit changes roll back if mutation fails.',
      'Fairness guarantees via credit "reservation" to avoid exponential backoff.',
      'Opt-in "rollover" or "burst" allowance via configurable capacity.',
      'Fails closed, not open: avoid cascading failure.',
      'React hook for checking rate limits in browser code.',
      'Per-user or global rate limits.',
      'Custom count consumption.',
      'Automatic retry timing calculation.',
    ],
    documentationSections: [
      {
        heading: 'Overview',
        paragraphs: [
          'This component provides application-layer rate limiting.',
        ],
        code: `const rateLimiter = new RateLimiter(components.rateLimiter, {
  freeTrialSignUp: { kind: "fixed window", rate: 100, period: HOUR },
  sendMessage: { kind: "token bucket", rate: 10, period: MINUTE, capacity: 3 },
});

// Restrict how fast free users can sign up to deter bots
const status = await rateLimiter.limit(ctx, "freeTrialSignUp");

// Limit how fast a user can send messages
const status = await rateLimiter.limit(ctx, "sendMessage", { key: userId });

// Use the React hook to check the rate limit
const { status, check } = useRateLimit(api.example.getRateLimit, { count });`,
      },
      {
        heading: 'What is rate limiting?',
        paragraphs: [
          'Rate limiting is the technique of controlling how often actions can be performed, typically on a server. There are a host of options for achieving this, most of which operate at the network layer.',
        ],
      },
      {
        heading: 'What is application-layer rate limiting?',
        paragraphs: [
          'Application-layer rate limiting happens in your app\'s code where you are handling authentication, authorization, and other business logic. It allows you to define nuanced rules, and enforce policies more fairly. It is not the first line of defense for a sophisticated DDOS attack (which thankfully are extremely rare), but will serve most real-world use cases.',
        ],
      },
      {
        heading: 'What differentiates this approach?',
        paragraphs: [
          '• **Type-safe usage**: you won\'t accidentally misspell a rate limit name.',
          '• **Configurable for fixed window or token bucket algorithms**.',
          '• **Efficient storage and compute**: storage is not proportional to requests.',
          '• **Configurable sharding for scalability**.',
          '• **Transactional evaluation**: all rate limit changes will roll back if your mutation fails.',
          '• **Fairness guarantees via credit "reservation"**: save yourself from exponential backoff.',
          '• **Opt-in "rollover" or "burst" allowance**: via a configurable capacity.',
          '• **Fails closed, not open**: avoid cascading failure when traffic overwhelms your rate limits.',
        ],
        codeBlocks: [
          {
            note: 'See the [associated Stack post](https://stack.convex.dev/rate-limiting) for more details and background.',
          },
        ],
      },
      {
        heading: 'Prerequisites',
        subsections: [
          {
            subheading: 'Convex App',
            paragraphs: [
              'You\'ll need an existing Convex project to use the component. Convex is a hosted backend platform, including a database, serverless functions, and a ton more you can learn about [here](https://docs.convex.dev/home).',
              'Run `npm create convex` or follow any of the quickstarts to set one up.',
            ],
          },
        ],
      },
      {
        heading: 'Installation',
        subsections: [
          {
            subheading: 'Step 1: Install the package',
            paragraphs: [
              'Install the component package:',
            ],
            code: 'npm install @convex-dev/rate-limiter',
          },
          {
            subheading: 'Step 2: Install the component',
            paragraphs: [
              'Create a `convex.config.ts` file in your app\'s `convex/` folder and install the component by calling `use`:',
            ],
            code: `// convex/convex.config.ts

import { defineApp } from "convex/server";
import rateLimiter from "@convex-dev/rate-limiter/convex.config.js";

const app = defineApp();
app.use(rateLimiter);

export default app;`,
          },
        ],
      },
      {
        heading: 'Define your rate limits',
        paragraphs: [
          'Define your rate limits by creating a RateLimiter instance:',
        ],
        code: `import { RateLimiter, MINUTE, HOUR } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";

const rateLimiter = new RateLimiter(components.rateLimiter, {
  // One global / singleton rate limit, using a "fixed window" algorithm.
  freeTrialSignUp: { kind: "fixed window", rate: 100, period: HOUR },
  // A per-user limit, allowing one every ~6 seconds.
  // Allows up to 3 in quick succession if they haven't sent many recently.
  sendMessage: { kind: "token bucket", rate: 10, period: MINUTE, capacity: 3 },
  failedLogins: { kind: "token bucket", rate: 10, period: HOUR },
  // Use sharding to increase throughput without compromising on correctness.
  llmTokens: { kind: "token bucket", rate: 40000, period: MINUTE, shards: 10 },
  llmRequests: { kind: "fixed window", rate: 1000, period: MINUTE, shards: 10 },
});`,
        codeBlocks: [
          {
            note: 'You can safely generate multiple instances if you want to define different rates in separate places, provided the keys don\'t overlap.',
          },
          {
            note: 'The units for `period` are milliseconds. `MINUTE` above is 60000.',
          },
        ],
      },
      {
        heading: 'Strategies',
        subsections: [
          {
            subheading: 'Token bucket',
            paragraphs: [
              'The token bucket approach provides guarantees for overall consumption via the rate per period at which tokens are added, while also allowing unused tokens to accumulate (like "rollover" minutes) up to some capacity value. So if you could normally send 10 per minute, with a capacity of 20, then every two minutes you could send 20, or if in the last two minutes you only sent 5, you can send 15 now.',
            ],
          },
          {
            subheading: 'Fixed window',
            paragraphs: [
              'The fixed window approach differs in that the tokens are granted all at once, every `period` milliseconds. It similarly allows accumulating "rollover" tokens up to a capacity (defaults to the rate for both rate limit strategies). You can specify a custom start time if e.g. you want the period to reset at a specific time of day. By default it will be random to help space out requests that are retrying.',
            ],
          },
        ],
      },
      {
        heading: 'Usage',
        subsections: [
          {
            subheading: 'Using a simple global rate limit',
            paragraphs: [
              'Limit a global operation:',
              'Note: If you have many clients using the `retryAfter` to decide when to retry, defend against a [thundering herd](https://en.wikipedia.org/wiki/Thundering_herd_problem) by adding some jitter. Or use the reserve functionality discussed below.',
            ],
            code: `const { ok, retryAfter } = await rateLimiter.limit(ctx, "freeTrialSignUp");

// ok is whether it successfully consumed the resource
// retryAfter is when it would have succeeded in the future.`,
          },
          {
            subheading: 'Per-user rate limit',
            paragraphs: [
              'Use `key` to use a rate limit specific to some user / team / session ID / etc.',
            ],
            code: `const status = await rateLimiter.limit(ctx, "sendMessage", { key: userId });`,
          },
          {
            subheading: 'Consume a custom count',
            paragraphs: [
              'By default, each call to `limit` counts as one unit. Pass `count` to customize.',
            ],
            code: `// Consume multiple in one request to prevent rate limits on an LLM API.
const status = await rateLimiter.limit(ctx, "llmTokens", { count: tokens });`,
          },
          {
            subheading: 'Throw automatically',
            paragraphs: [
              'By default it will return `{ ok, retryAfter }`. To have it throw automatically when the limit is exceeded, use `throws`. It throws a `ConvexError` with `RateLimitError` data (`data: {kind, name, retryAfter}`) instead of returning when `ok` is `false`.',
            ],
            code: `// Automatically throw an error if the rate limit is hit
await rateLimiter.limit(ctx, "failedLogins", { key: userId, throws: true });`,
          },
          {
            subheading: 'Check a rate limit without consuming it',
            paragraphs: [
              'Check whether a rate limit would succeed without actually consuming tokens:',
            ],
            code: `const status = await rateLimiter.check(ctx, "failedLogins", { key: userId });`,
          },
          {
            subheading: 'Reset a rate limit',
            paragraphs: [
              'Reset a rate limit (useful after successful login):',
            ],
            code: `// Reset a rate limit on successful login
await rateLimiter.reset(ctx, "failedLogins", { key: userId });`,
          },
          {
            subheading: 'Define a rate limit inline / dynamically',
            paragraphs: [
              'Use a one-off rate limit config when not named on initialization:',
            ],
            code: `// Use a one-off rate limit config (when not named on initialization)
const config = { kind: "fixed window", rate: 1, period: SECOND };
const status = await rateLimiter.limit(ctx, "oneOffName", { config });`,
          },
        ],
      },
      {
        heading: 'Using the React hook',
        paragraphs: [
          'You can use the React hook to check the rate limit in your browser code.',
          'First, define the server API to get the rate limit value:',
        ],
        code: `// In convex/example.ts

export const { getRateLimit, getServerTime } = rateLimiter.hookAPI(
  "sendMessage",
  // Optionally provide a key function to get the key for the rate limit
  { key: async (ctx) => getUserId(ctx) },
);`,
        codeBlocks: [
          {
            note: 'Then, use the React hook to check the rate limit:',
            code: `function App() {
  const { status: { ok, retryAt }, check } = useRateLimit(api.example.getRateLimit, {
    // [recommended] Allows the hook to sync the browser and server clocks
    getServerTimeMutation: getServerTime,
    // [optional] The number of tokens to wait on
    count: 1,
  });

  // If you want to check at specific times and get the concrete value:
  const { value, ts, config, ok, retryAt } = check(Date.now(), count);
}`,
          },
        ],
      },
      {
        heading: 'Fetching the current value directly',
        paragraphs: [
          'You can fetch the current value of a rate limit directly, if you want to know the concrete value and timestamp it was last updated.',
        ],
        code: `const { config, value, ts } = await rateLimiter.getValue(ctx, "sendMessage", {
  key: userId,
});`,
        codeBlocks: [
          {
            note: 'And you can use `calculateRateLimit` to calculate the value at a given timestamp:',
            code: `import { calculateRateLimit } from "@convex-dev/rate-limiter";

const { config, value, ts } = calculateRateLimit(
  { value, ts },
  config,
  Date.now(),
  count || 0,
);`,
          },
        ],
      },
      {
        heading: 'Scaling rate limiting with shards',
        paragraphs: [
          'When many requests are happening at once, they can all be trying to modify the same values in the database. Because Convex provides strong transactions, they will never overwrite each other, so you don\'t have to worry about the rate limiter succeeding more often than it should. However, when there is high contention for these values, it causes optimistic concurrency control conflicts. Convex automatically retries these a number of times with backoff, but it\'s still best to avoid them.',
          'Not to worry! To provide high throughput, we can use a technique called "sharding" where we break up the total capacity into individual buckets, or "shards". When we go to use some of that capacity, we check a random shard. While sometimes we\'ll get unlucky and get rate limited when there was capacity elsewhere, we\'ll never violate the rate limit\'s upper bound.',
        ],
        code: `const rateLimiter = new RateLimiter(components.rateLimiter, {
  // Use sharding to increase throughput without compromising on correctness.
  llmTokens: { kind: "token bucket", rate: 40000, period: MINUTE, shards: 10 },
  llmRequests: { kind: "fixed window", rate: 1000, period: MINUTE, shards: 10 },
});`,
        codeBlocks: [
          {
            note: 'Here we\'re using 10 shards to handle 1,000 QPM. If you want some rough math to guess at how many shards to add, take the max queries per second you expect and divide by two. It\'s also useful for each shard to have five (ideally ten) or more capacity. In this case, we have ten (rate / shards) and don\'t expect normal traffic to exceed ~20 QPS.',
          },
          {
            note: 'Tip: If you want a rate like `{ rate: 100, period: SECOND }` and you are flexible in the overall period, then you can shard this by increasing the rate and period proportionally to get enough shards and capacity per shard: `{ shards: 50, rate: 250, period: 2.5 * SECOND }` or even better: `{ shards: 50, rate: 1000, period: 10 * SECOND }`.',
          },
          {
            note: '**Power of two:**',
          },
          {
            note: 'We\'re actually going one step further and checking two shards and using the one with more capacity, to keep them relatively balanced, based on the power of two technique. We will also combine the capacity of the two shards if neither has enough on their own.',
          },
        ],
      },
      {
        heading: 'Reserving capacity',
        paragraphs: [
          'You can also allow it to reserve capacity to avoid starvation on larger requests.',
          'When you reserve capacity ahead of time, the contract is that you can run your operation at the specified time (via the `retryAfter` field), at which point you don\'t have to re-check the rate limit. Your capacity has been "ear-marked".',
          'With this, you can queue up many operations and they will be run at spaced-out intervals, maximizing the utilization of the rate limit.',
        ],
        code: `const myAction = internalAction({
  args: {
    //...
    skipCheck: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (!args.skipCheck) {
      // Reserve future capacity instead of just failing now
      const status = await rateLimiter.limit(ctx, "llmRequests", {
        reserve: true,
      });
      if (status.retryAfter) {
        return ctx.scheduler.runAfter(
          status.retryAfter,
          internal.foo.myAction,
          {
            // When we run in the future, we can skip the rate limit check,
            // since we've just reserved that capacity.
            skipCheck: true,
          },
        );
      }
    }
    // do the operation
  },
});`,
        codeBlocks: [
          {
            note: 'Details in the [Stack post](https://stack.convex.dev/rate-limiting).',
          },
        ],
      },
      {
        heading: 'Adding jitter',
        paragraphs: [
          'When too many users show up at once, it can cause network congestion, database contention, and consume other shared resources at an unnecessarily high rate. Instead we can return a random time within the next period to retry. Hopefully this is infrequent. This technique is referred to as adding "jitter."',
        ],
        code: `const retryAfter = status.retryAfter + Math.random() * period;`,
        codeBlocks: [
          {
            note: 'For the fixed window, we also introduce randomness by picking the start time of the window (from which all subsequent windows are based) randomly if `config.start` wasn\'t provided. This helps from all clients flooding requests at midnight and paging you.',
          },
        ],
      },
      {
        heading: 'Common use cases',
        paragraphs: [
          'Here are some common patterns for using rate limits:',
        ],
        subsections: [
          {
            subheading: 'Failed logins',
            paragraphs: [
              'Allow 5 failed requests in an hour. Because it\'s a bucket implementation, the user will be able to try 5 times immediately if they haven\'t tried in an hour, and then can try again every 6 minutes afterwards.',
            ],
            code: `const rateLimiter = new RateLimiter(components.rateLimiter, {
  failedLogins: { kind: "token bucket", rate: 10, period: HOUR },
});

await rateLimiter.check(ctx, "failedLogins", { key: userId, throws: true });
const success = await logInAttempt(ctx, userId, otp);
if (success) {
  // If we successfully logged in, stop limiting us in the future
  await rateLimiter.reset(ctx, "failedLogins", { key: userId });
} else {
  const { retryAfter } = await rateLimiter.limit(ctx, "failedLogins", { key: userId });
  return { retryAfter }; // So the client can indicated to the user when to try again
}`,
          },
          {
            subheading: 'Account creation via global limit',
            paragraphs: [
              'To prevent a flood of spam accounts, you can set a global limit on signing up for a free trial. This limits sign-ups to an average of 100 per hour.',
            ],
            code: `await rateLimiter.limit(ctx, "freeTrialSignUp", {
  config: { kind: "token bucket", rate: 100, period: HOUR },
  throws: true,
});`,
          },
          {
            subheading: 'Sending messages per user',
            paragraphs: [
              'Limit how fast a user can send messages:',
            ],
            code: `const { ok, retryAfter } = await rateLimiter.limit(ctx, "sendMessage", {
  key: userId,
  config: { kind: "token bucket", rate: 10, period: MINUTE, capacity: 20 },
});`,
          },
        ],
      },
      {
        heading: 'More resources',
        paragraphs: [
          'Check out a [full example here](https://github.com/get-convex/rate-limiter/blob/main/example/convex/example.ts).',
        ],
        codeBlocks: [
          {
            note: 'See [this article](https://stack.convex.dev/rate-limiting) for more information on usage and advanced patterns, for example:',
          },
          {
            note: '• How the different rate limiting strategies work under the hood.',
          },
          {
            note: '• Using multiple rate limits in a single transaction.',
          },
          {
            note: '• Rate limiting anonymous users.',
          },
        ],
      },
    ],
  },
  {
    id: 'action-cache',
    title: 'Action Cache',
    description: 'Cache action results, like expensive AI calls, with optional expiration times.',
    icon: <Zap size={48} />,
    ...getGradient(2, 'Backend'),
    weeklyDownloads: 2588,
    developer: 'get-convex',
    category: 'Backend',
    npmPackage: '@convex-dev/action-cache',
    repoUrl: 'https://github.com/get-convex/action-cache',
    packageUrl: 'https://www.npmjs.com/package/@convex-dev/action-cache',
    docsUrl: 'https://github.com/get-convex/action-cache#readme',
    docsLinks: [
      { label: 'Convex Environment Variables', url: 'https://docs.convex.dev/production/environment-variables' },
      { label: 'Convex Actions', url: 'https://docs.convex.dev/functions/actions' },
      { label: 'Convex Vector Search', url: 'https://docs.convex.dev/search/vector-search' },
    ],
    bugReportUrl: 'https://github.com/get-convex/action-cache/issues',
    exampleCommands: [
      'git clone https://github.com/get-convex/action-cache.git',
      'cd action-cache/example',
      'npm install',
      'npm run dev',
    ],
    longDescription: 'Sometimes your app needs to fetch information from a third-party API that is slow or costs money. Caching can help! This is a Convex component that can cache the results of expensive functions and set an optional TTL. Expired entries are cleaned up via a cron job once a day.',
    features: [
      'Cache results of expensive action calls.',
      'Optional TTL (Time-To-Live) for cache entries.',
      'Automatic cleanup of expired entries via daily cron job.',
      'Cache key based on ActionCache name and action arguments.',
      'Force cache refresh with the `force` option.',
      'Remove individual entries or all entries by name.',
      'Remove all entries across all names.',
      'Perfect for expensive API calls like embeddings or LLM responses.',
      'Reduce latency and costs for repeated operations.',
      'Type-safe cache operations.',
    ],
    documentationSections: [
      {
        heading: 'Overview',
        paragraphs: [
          'Sometimes your app needs to fetch information from a third-party API that is slow or costs money. Caching can help! This is a Convex component that can cache the results of expensive functions and set an optional TTL. Expired entries are cleaned up via a cron job once a day.',
          'The cache key is the ActionCache\'s name (defaults to function name) and the arguments to the action that generates the cache values.',
        ],
        code: `import { action } from "./_generated/server";
import { components } from "./_generated/api";
import { ActionCache } from "@convex-dev/action-cache";

const cache = new ActionCache(components.actionCache, {
  action: internal.example.myExpensiveAction,
});

export const myFunction = action({
  // NOTE: If we're returning the result, we need explicitly type the return value.
  // Refer to https://docs.convex.dev/functions/actions#dealing-with-circular-type-inference for more info.
  handler: async (ctx, args): Promise<{ text: string }> => {
    // Call it with the parameters to \`myExpensiveAction\`
    const result = await cache.fetch(ctx, { foo: "bar" });
    // Do something with the result or just return it
    return result;
  },
});

export const myExpensiveAction = internalAction({
  args: { foo: v.string() },
  handler: async (ctx, args): Promise<{ text: string }> {
    const data = await generateLLMResponse(ctx, args);
    return data;
  }
})`,
        codeBlocks: [
          {
            note: 'To invalidate the cache, you can set a new name explicitly and/or clear cached values by name.',
          },
        ],
      },
      {
        heading: 'Prerequisites',
        subsections: [
          {
            subheading: 'Convex App',
            paragraphs: [
              'You\'ll need an existing Convex project to use the component. Convex is a hosted backend platform, including a database, serverless functions, and a ton more you can learn about [here](https://docs.convex.dev/home).',
              'Run `npm create convex` or follow any of the quickstarts to set one up.',
            ],
          },
        ],
      },
      {
        heading: 'Installation',
        subsections: [
          {
            subheading: 'Step 1: Install the package',
            paragraphs: [
              'Install the component package:',
            ],
            code: 'npm install @convex-dev/action-cache',
          },
          {
            subheading: 'Step 2: Install the component',
            paragraphs: [
              'Create a `convex.config.ts` file in your app\'s `convex/` folder and install the component by calling `use`:',
            ],
            code: `// convex/convex.config.ts

import { defineApp } from "convex/server";
import cache from "@convex-dev/action-cache/convex.config.js";

const app = defineApp();
app.use(cache);

export default app;`,
          },
          {
            subheading: 'Step 3: Create an ActionCache instance',
            paragraphs: [
              'Finally, create a new ActionCache with optional name and expiration within your Convex project, and point it to the installed component.',
              'The `name` field can be used for identifying the function or version being used to create the values in the cache and can also be used for grouping entries to remove.',
              'The `ttl` (Time-To-Live) field determines how long the cache entries are valid, in milliseconds.',
            ],
            code: `import { ActionCache } from "@convex-dev/action-cache";
import { components } from "./_generated/api";

const cache = new ActionCache(components.actionCache, {
  action: internal.example.myExpensiveAction,
  name: "myExpensiveActionV1",
  ttl: 1000 * 60 * 60 * 24 * 7, // 7 days
});`,
          },
        ],
        codeBlocks: [
          {
            note: 'If no `ttl` is provided, the cache entries are kept indefinitely.',
          },
          {
            note: 'If a `ttl` is provided, expired cache entries are deleted when they are retrieved and in a daily cron job.',
          },
        ],
      },
      {
        heading: 'Example',
        paragraphs: [
          'Suppose you\'re building an app that uses vector search. Calculating embeddings is often expensive - in our case, we are using OpenAI\'s API which adds latency to every search and costs money to use. We can reduce the number of API calls by caching the results!',
          'Start by defining the Convex action that calls the API to create embeddings. Feel free to substitute your favorite embeddings API. You may need to adjust the vector dimensions in the schema in `example/schema.ts` accordingly.',
        ],
        code: `export const embed = internalAction({
  args: { text: v.string() },
  handler: async (_ctx, { text }) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable not set!");
    }

    const req = { input: text, model: "text-embedding-ada-002" };
    const resp = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: \`Bearer \${apiKey}\`,
      },
      body: JSON.stringify(req),
    });

    if (!resp.ok) {
      const msg = await resp.text();
      throw new Error(\`OpenAI API error: \${msg}\`);
    }

    const json = await resp.json();
    const vector = json["data"][0]["embedding"];
    console.log(\`Computed embedding of "\${text}": \${vector.length} dimensions\`);
    return vector as number[];
  },
});`,
        codeBlocks: [
          {
            note: 'Set your API key environment variable:',
            code: 'npx convex env set OPENAI_API_KEY <your-api-key>',
          },
        ],
      },
      {
        heading: 'Using the cache',
        paragraphs: [
          'Create the embeddings cache:',
        ],
        code: `const embeddingsCache = new ActionCache(components.actionCache, {
  action: internal.example.embed,
  name: "embed-v1",
});`,
        codeBlocks: [
          {
            note: 'Use the cache when you run a vector search:',
            code: `export const vectorSearch = action({
  args: { query: v.string(), cuisines: v.array(v.string()) },
  handler: async (ctx, args) => {
    const embedding = await embeddingsCache.fetch(ctx, {
      text: args.query,
    });

    const results = await ctx.vectorSearch("foods", "by_embedding", {
      vector: embedding,
      limit: 16,
      filter: (q) =>
        q.or(...args.cuisines.map((cuisine) => q.eq("cuisine", cuisine))),
    });

    const rows: SearchResult[] = await ctx.runQuery(
      internal.example.fetchResults,
      { results },
    );

    return rows;
  },
});`,
          },
        ],
      },
      {
        heading: 'Defining multiple caches',
        paragraphs: [
          'You can use the same component for multiple actions, or multiple versions of the same action. You can specify a custom `name` argument to denote which cache you want to use, or change the name to start fresh, like `embed-v2`.',
        ],
        codeBlocks: [
          {
            note: 'If the return value changes, it is important to change the name so you don\'t get unexpected values.',
          },
        ],
      },
      {
        heading: 'Updating the cache before it expires',
        paragraphs: [
          'It\'s convenient to lazily run the action when there is a cache miss. However, this means that some requests will be slow, and many competing requests may race to all run the action and populate the cache.',
          'You can avoid this by calling `fetch` with the `force` option. This will force the action to run and update the cache, even if there is a cache hit. In the meantime, other requests will get a cache hit.',
        ],
        code: `await cache.fetch(ctx, { text: "query" }, { force: true });`,
        codeBlocks: [
          {
            note: 'If you call this from a cron job, the cache will always have an entry (unless the action fails).',
          },
        ],
      },
      {
        heading: 'Clearing values',
        paragraphs: [
          'To clear old values, you can:',
        ],
        code: `// Remove one entry by arguments.
await embeddingsCache.remove(ctx, { text: "target text" });

// Remove all entries for the current name (defaults to function name).
// This is useful if you updated the implementation and want to clear
await embeddingsCache.removeAllForName(ctx);

// Remove all entries in the component, including all names.
await embeddingsCache.removeAll(ctx);`,
        codeBlocks: [
          {
            note: 'See more example usage in [example.ts](https://github.com/get-convex/action-cache/blob/main/example/convex/example.ts).',
          },
        ],
      },
    ],
  },
  {
    id: 'persistent-text-streaming',
    title: 'Persistent Text Streaming',
    description: 'Stream text like AI chat to the browser in real-time while also efficiently storing it to the database.',
    icon: <Type size={48} />,
    ...getGradient(3, 'Backend'),
    weeklyDownloads: 1618,
    developer: 'get-convex',
    category: 'Backend' as ComponentCategory,
    npmPackage: '@convex-dev/persistent-text-streaming',
    repoUrl: 'https://github.com/get-convex/persistent-text-streaming',
    packageUrl: 'https://www.npmjs.com/package/@convex-dev/persistent-text-streaming',
    docsUrl: 'https://github.com/get-convex/persistent-text-streaming#readme',
    stackPostUrl: 'https://stack.convex.dev/ai-chat-with-http-streaming',
    docsLinks: [
      { label: 'Convex HTTP Actions', url: 'https://docs.convex.dev/functions/http-actions' },
      { label: 'Convex Queries', url: 'https://docs.convex.dev/functions/queries' },
      { label: 'Convex Mutations', url: 'https://docs.convex.dev/functions/mutations' },
    ],
    bugReportUrl: 'https://github.com/get-convex/persistent-text-streaming/issues',
    exampleCommands: [
      'git clone https://github.com/get-convex/persistent-text-streaming.git',
      'cd persistent-text-streaming/example',
      'npm install',
      'npm run dev',
    ],
    longDescription: 'This Convex component enables persistent text streaming. It provides a React hook for streaming text from HTTP actions while simultaneously storing the data in the database. This persistence allows the text to be accessed after the stream ends or by other users. The most common use case is for AI chat applications.',
    features: [
      'Stream text from HTTP actions in real-time to the browser.',
      'Simultaneously store streamed text in the database for persistence.',
      'Access streamed text after the stream ends or by other users.',
      'React hook for easy client-side integration.',
      'Balances HTTP streaming performance with database persistence.',
      'Perfect for AI chat applications and other streaming use cases.',
      'Original browser gets character-by-character streaming.',
      'Other users see updates via database subscriptions.',
      'Efficient bandwidth usage with periodic database updates.',
      'Type-safe stream operations.',
    ],
    documentationSections: [
      {
        heading: 'Overview',
        paragraphs: [
          'This Convex component enables persistent text streaming. It provides a React hook for streaming text from HTTP actions while simultaneously storing the data in the database. This persistence allows the text to be accessed after the stream ends or by other users.',
          'The most common use case is for AI chat applications. The example app (found in the example directory) is a simple chat app that demonstrates use of the component.',
          'The component balances HTTP streaming with database persistence to maximize the benefits of both approaches. The original browser that makes the request gets a high-performance streaming experience with character-by-character updates, while the text is also stored in the database for access by other users or after the stream ends.',
        ],
        codeBlocks: [
          {
            note: 'The left browser window streams the chat body to the client, and the right browser window is subscribed to the chat body via a database query. The message is only updated in the database on sentence boundaries, whereas the HTTP stream sends tokens as they come.',
          },
        ],
      },
      {
        heading: 'Prerequisites',
        subsections: [
          {
            subheading: 'Convex App',
            paragraphs: [
              'You\'ll need an existing Convex project to use the component. Convex is a hosted backend platform, including a database, serverless functions, and a ton more you can learn about [here](https://docs.convex.dev/home).',
              'Run `npm create convex` or follow any of the quickstarts to set one up.',
            ],
          },
        ],
      },
      {
        heading: 'Installation',
        subsections: [
          {
            subheading: 'Step 1: Install the package',
            paragraphs: [
              'Install the component package:',
            ],
            code: 'npm install @convex-dev/persistent-text-streaming',
          },
          {
            subheading: 'Step 2: Install the component',
            paragraphs: [
              'Create a `convex.config.ts` file in your app\'s `convex/` folder and install the component by calling `use`:',
            ],
            code: `// convex/convex.config.ts

import { defineApp } from "convex/server";
import persistentTextStreaming from "@convex-dev/persistent-text-streaming/convex.config.js";

const app = defineApp();
app.use(persistentTextStreaming);

export default app;`,
          },
        ],
      },
      {
        heading: 'Usage',
        paragraphs: [
          'Here\'s a simple example of how to use the component:',
        ],
        code: `import { PersistentTextStreaming, StreamId, StreamIdValidator } from "@convex-dev/persistent-text-streaming";
import { components } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const persistentTextStreaming = new PersistentTextStreaming(
  components.persistentTextStreaming,
);

// Create a stream using the component and store the id in the database with
// our chat message.
export const createChat = mutation({
  args: {
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    const streamId = await persistentTextStreaming.createStream(ctx);
    const chatId = await ctx.db.insert("chats", {
      title: "...",
      prompt: args.prompt,
      stream: streamId,
    });
    return chatId;
  },
});

// Create a query that returns the chat body.
export const getChatBody = query({
  args: {
    streamId: StreamIdValidator,
  },
  handler: async (ctx, args) => {
    return await persistentTextStreaming.getStreamBody(
      ctx,
      args.streamId as StreamId,
    );
  },
});`,
      },
      {
        heading: 'HTTP Action for Streaming',
        paragraphs: [
          'Create an HTTP action that generates chunks of the chat body and uses the component to stream them to the client and save them to the database:',
        ],
        code: `// convex/chat.ts
import { httpAction } from "./_generated/server";
import { PersistentTextStreaming } from "@convex-dev/persistent-text-streaming";
import { StreamId } from "@convex-dev/persistent-text-streaming";

export const streamChat = httpAction(async (ctx, request) => {
  const body = (await request.json()) as { streamId: string };

  const generateChat = async (ctx, request, streamId, chunkAppender) => {
    await chunkAppender("Hi there!");
    await chunkAppender("How are you?");
    await chunkAppender("Pretend I'm an AI or something!");
  };

  const response = await persistentTextStreaming.stream(
    ctx,
    request,
    body.streamId as StreamId,
    generateChat,
  );

  // Set CORS headers appropriately.
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Vary", "Origin");
  return response;
});`,
        codeBlocks: [
          {
            note: 'You need to expose this HTTP endpoint in your backend, so in `convex/http.ts`:',
            code: `import { httpRouter } from "convex/server";
import { streamChat } from "./chat";

const http = httpRouter();
http.route({
  path: "/chat-stream",
  method: "POST",
  handler: streamChat,
});

export default http;`,
          },
        ],
      },
      {
        heading: 'Client-Side Usage',
        paragraphs: [
          'In your app, you can now create chats and subscribe to them via stream and/or database query as optimal:',
        ],
        code: `// chat-input.tsx
import { useMutation } from "convex/react";
import { api } from "./_generated/api";

const createChat = useMutation(api.chat.createChat);

const formSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const chatId = await createChat({
    prompt: inputValue,
  });
};`,
        codeBlocks: [
          {
            note: 'In your message component:',
            code: `// chat-message.tsx
import { useStream } from "@convex-dev/persistent-text-streaming/react";
import { api } from "./_generated/api";
import { StreamId } from "@convex-dev/persistent-text-streaming";

// In our component:
const convexSiteUrl = import.meta.env.VITE_CONVEX_URL.replace(
  /\.cloud$/,
  ".site"
);

const { text, status } = useStream(
  api.chat.getChatBody, // The query to call for the full stream body
  new URL(\`\${convexSiteUrl}/chat-stream\`), // The HTTP endpoint for streaming
  driven, // True if this browser session created this chat and should generate the stream
  chat.streamId as StreamId, // The streamId from the chat database record
);`,
          },
        ],
      },
      {
        heading: 'Design Philosophy',
        paragraphs: [
          'This component balances HTTP streaming with database persistence to try to maximize the benefits of both. To understand why this balance is beneficial, let\'s examine each approach in isolation.',
        ],
        subsections: [
          {
            subheading: 'HTTP streaming only',
            paragraphs: [
              'If your app only uses HTTP streaming, then the original browser that made the request will have a great, high-performance streaming experience. But if that HTTP connection is lost, if the browser window is reloaded, if other users want to view the same chat, or this users wants to revisit the conversation later, it won\'t be possible. The conversation is only ephemeral because it was never stored on the server.',
            ],
          },
          {
            subheading: 'Database Persistence Only',
            paragraphs: [
              'If your app only uses database persistence, it\'s true that the conversation will be available for as long as you want. Additionally, Convex\'s subscriptions will ensure the chat message is updated as new text chunks are generated. However, there are a few downsides: one, the entire chat body needs to be resent every time it is changed, which is a lot redundant bandwidth to push into the database and over the websockets to all connected clients. Two, you\'ll need to make a difficult tradeoff between interactivity and efficiency. If you write every single small chunk to the database, this will get quite slow and expensive. But if you batch up the chunks into, say, paragraphs, then the user experience will feel laggy.',
            ],
          },
          {
            subheading: 'Best of Both Worlds',
            paragraphs: [
              'This component combines the best of both worlds. The original browser that makes the request will still have a great, high-performance streaming experience. But the chat body is also stored in the database, so it can be accessed by the client even after the stream has finished, or by other users, etc.',
            ],
          },
        ],
      },
      {
        heading: 'Background',
        paragraphs: [
          'This component is largely based on the Stack post [AI Chat with HTTP Streaming](https://stack.convex.dev/ai-chat-with-http-streaming).',
        ],
        codeBlocks: [
          {
            note: 'See the full example in the [example directory](https://github.com/get-convex/persistent-text-streaming/tree/main/example) for a working chat app that demonstrates all features.',
          },
        ],
      },
    ],
  },
];

export const ALL_COMPONENTS: ComponentInfo[] = componentsData.map(addImageUrl);
