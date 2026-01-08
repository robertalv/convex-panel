// Import all component images
import agentImage from '../../../../../shared/assets/components/agent.webp';
import workpoolImage from '../../../../../shared/assets/components/workpool.webp';
import workflowImage from '../../../../../shared/assets/components/workflow.webp';
import actionRetrierImage from '../../../../../shared/assets/components/action-retrier.webp';
import cronsImage from '../../../../../shared/assets/components/crons.webp';
import migrationsImage from '../../../../../shared/assets/components/migrations.webp';
import aggregateImage from '../../../../../shared/assets/components/aggregate.webp';
import presenceImage from '../../../../../shared/assets/components/presence.webp';
import ragImage from '../../../../../shared/assets/components/rag.webp';
import shardedCounterImage from '../../../../../shared/assets/components/sharded-counter.webp';
import geospatialImage from '../../../../../shared/assets/components/geospatial.webp';
import resendImage from '../../../../../shared/assets/components/resend.webp';
import cloudflareR2Image from '../../../../../shared/assets/components/cloudflare-r2.webp';
import collaborativeEditorImage from '../../../../../shared/assets/components/collaborative-editor.webp';
import expoPushNotificationsImage from '../../../../../shared/assets/components/expo-push-notifications.webp';
import polarImage from '../../../../../shared/assets/components/polar.webp';
import autumnImage from '../../../../../shared/assets/components/autumn.webp';
import twilioSmsImage from '../../../../../shared/assets/components/twilio-sms.webp';
import ossStatsImage from '../../../../../shared/assets/components/oss-stats.webp';
import launchDarklyImage from '../../../../../shared/assets/components/launch-darkly.webp';
import dodoImage from '../../../../../shared/assets/components/dodo.webp';
import rateLimiterImage from '../../../../../shared/assets/components/rate-limiter.webp';
import actionCacheImage from '../../../../../shared/assets/components/action-cache.webp';
import persistentTextStreamingImage from '../../../../../shared/assets/components/persistent-text-streaming.webp';

// Note: values are typed as `any` so this stays framework-agnostic:
// - In Vite/webpack builds these imports are usually strings
// - In Next.js they are `StaticImageData`
// Using `any` keeps the library portable while allowing consumers to
// narrow the type as needed (e.g. for <img> vs <Image>).
export const COMPONENT_IMAGES: Record<string, any> = {
  'ai-agent': agentImage,
  'workpool': workpoolImage,
  'workflow': workflowImage,
  'action-retrier': actionRetrierImage,
  'crons': cronsImage,
  'migrations': migrationsImage,
  'aggregate': aggregateImage,
  'presence-db': presenceImage,
  'rag': ragImage,
  'sharded-counter': shardedCounterImage,
  'geospatial': geospatialImage,
  'resend': resendImage,
  'cloudflare-r2': cloudflareR2Image,
  'collaborative-text-editor': collaborativeEditorImage,
  'expo-push-notifications': expoPushNotificationsImage,
  'polar': polarImage,
  'autumn': autumnImage,
  'twilio-sms': twilioSmsImage,
  'oss-stats': ossStatsImage,
  'launchdarkly-feature-flags': launchDarklyImage,
  'dodo-payments': dodoImage,
  'rate-limiter': rateLimiterImage,
  'ai-agent-backend': agentImage, // Reuse agent image
  'action-cache': actionCacheImage,
  'persistent-text-streaming': persistentTextStreamingImage,
};

export function getComponentImageUrl(componentId: string): any {
  return COMPONENT_IMAGES[componentId];
}
