import convexLogo from '../../../../../shared/assets/logos/convex.webp';
import devwithbobbyLogo from '../../../../../shared/assets/logos/devwithbobby.png';
import dodoLogo from '../../../../../shared/assets/logos/dodo.webp';
import autumnLogo from '../../../../../shared/assets/logos/autumn.webp';
import erquhartLogo from '../../../../../shared/assets/logos/erquhart.webp';

export const DEVELOPER_LOGOS: Record<string, string> = {
  'get-convex': convexLogo,
  'devwithbobby': devwithbobbyLogo,
  'dodopayments': dodoLogo,
  'useautumn': autumnLogo,
  'erquhart': erquhartLogo,
};

export function getDeveloperLogoUrl(developer: string): string | undefined {
  return DEVELOPER_LOGOS[developer];
}
