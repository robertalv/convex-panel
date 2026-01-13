interface ConvexLogoProps {
  size?: number;
  className?: string;
  monochrome?: boolean;
  colors?: {
    yellow?: string;
    purple?: string;
    red?: string;
  };
}

export function ConvexLogo({
  size = 64,
  className,
  monochrome = false,
  colors: customColors,
}: ConvexLogoProps) {
  const defaultColors = monochrome
    ? { yellow: "currentColor", purple: "currentColor", red: "currentColor" }
    : {
        yellow: "rgb(245,176,26)",
        purple: "rgb(141,37,118)",
        red: "rgb(238,52,47)",
      };
  
  const colors = customColors
    ? { ...defaultColors, ...customColors }
    : defaultColors;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 367 370"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g transform="matrix(1,0,0,1,-129.225,-127.948)">
        <g transform="matrix(4.16667,0,0,4.16667,0,0)">
          <g transform="matrix(1,0,0,1,86.6099,107.074)">
            <path
              d="M0,-6.544C13.098,-7.973 25.449,-14.834 32.255,-26.287C29.037,2.033 -2.48,19.936 -28.196,8.94C-30.569,7.925 -32.605,6.254 -34.008,4.088C-39.789,-4.83 -41.69,-16.18 -38.963,-26.48C-31.158,-13.247 -15.3,-5.131 0,-6.544"
              fill={colors.yellow}
            />
          </g>
          <g transform="matrix(1,0,0,1,47.1708,74.7779)">
            <path
              d="M0,-2.489C-5.312,9.568 -5.545,23.695 0.971,35.316C-21.946,18.37 -21.692,-17.876 0.689,-34.65C2.754,-36.197 5.219,-37.124 7.797,-37.257C18.41,-37.805 29.19,-33.775 36.747,-26.264C21.384,-26.121 6.427,-16.446 0,-2.489"
              fill={colors.purple}
            />
          </g>
          <g transform="matrix(1,0,0,1,91.325,66.4152)">
            <path
              d="M0,-14.199C-7.749,-24.821 -19.884,-32.044 -33.173,-32.264C-7.482,-43.726 24.112,-25.143 27.557,2.322C27.877,4.876 27.458,7.469 26.305,9.769C21.503,19.345 12.602,26.776 2.203,29.527C9.838,15.64 8.889,-1.328 0,-14.199"
              fill={colors.red}
            />
          </g>
        </g>
      </g>
    </svg>
  );
}

export default ConvexLogo;

interface ConvexTrayLogoProps {
  size?: number;
  className?: string;
  color?: string;
}

export function ConvexTrayLogo({
  size = 44,
  className,
  color = "currentColor",
}: ConvexTrayLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="22.976 20.188 130.324 147.197"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M108.092 130.021C126.258 128.003 143.385 118.323 152.815 102.167C148.349 142.127 104.653 167.385 68.9858 151.878C65.6992 150.453 62.8702 148.082 60.9288 145.034C52.9134 132.448 50.2786 116.433 54.0644 101.899C64.881 120.567 86.8748 132.01 108.092 130.021Z"
        fill={color}
      />
      <path
        d="M53.4012 90.1735C46.0375 107.19 45.7186 127.114 54.7463 143.51C22.9759 119.608 23.3226 68.4578 54.358 44.7949C57.2286 42.6078 60.64 41.3096 64.2178 41.1121C78.9312 40.336 93.8804 46.0225 104.364 56.6193C83.0637 56.8309 62.318 70.4756 53.4012 90.1735Z"
        fill={color}
      />
      <path
        d="M114.637 61.8552C103.89 46.8701 87.0686 36.6684 68.6387 36.358C104.264 20.1876 148.085 46.4045 152.856 85.1654C153.3 88.7635 152.717 92.4322 151.122 95.6775C144.466 109.195 132.124 119.679 117.702 123.559C128.269 103.96 126.965 80.0151 114.637 61.8552Z"
        fill={color}
      />
    </svg>
  );
}
