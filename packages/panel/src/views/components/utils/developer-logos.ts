import convexLogo from '../../../../../shared/assets/logos/convex.webp';
import devwithbobbyLogo from '../../../../../shared/assets/logos/devwithbobby.png';
import dodoLogo from '../../../../../shared/assets/logos/dodo.webp';
import autumnLogo from '../../../../../shared/assets/logos/autumn.webp';
import erquhartLogo from '../../../../../shared/assets/logos/erquhart.webp';

// Store whatever the bundler gives us (string in Vite, StaticImageData in Next, etc.)
export const DEVELOPER_LOGOS: Record<string, unknown> = {
  'get-convex': convexLogo,
  'devwithbobby': devwithbobbyLogo,
  'dodopayments': dodoLogo,
  'useautumn': autumnLogo,
  'erquhart': erquhartLogo,
};

export function getDeveloperLogoUrl(developer: string): string | undefined {
  const img = DEVELOPER_LOGOS[developer];
  if (!img) return undefined;

  if (typeof img === 'string') {
    return img;
  }

  // Handle Next.js StaticImageData (which has a .src string field)
  if (typeof img === 'object' && 'src' in (img as any) && typeof (img as any).src === 'string') {
    return (img as any).src;
  }

  return undefined;
}
