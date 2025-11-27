import { SortDirection } from "src/types";

export const LogsIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="-mt-1">
    <path d="M3.89949 5.50002C3.89949 5.27911 3.7204 5.10003 3.49949 5.10003C3.27857 5.10003 3.09949 5.27911 3.09949 5.50002L3.09949 12.5343L1.78233 11.2172C1.62612 11.061 1.37285 11.061 1.21664 11.2172C1.06043 11.3734 1.06043 11.6267 1.21664 11.7829L3.21664 13.7829C3.29166 13.8579 3.3934 13.9 3.49949 13.9C3.60557 13.9 3.70732 13.8579 3.78233 13.7829L5.78233 11.7829C5.93854 11.6267 5.93854 11.3734 5.78233 11.2172C5.62612 11.061 5.37285 11.061 5.21664 11.2172L3.89949 12.5343L3.89949 5.50002ZM8.49998 13C8.22383 13 7.99998 12.7762 7.99998 12.5C7.99998 12.2239 8.22383 12 8.49998 12H14.5C14.7761 12 15 12.2239 15 12.5C15 12.7762 14.7761 13 14.5 13H8.49998C8.22383 10 7.99998 9.77617 7.99998 9.50002ZM7.99998 6.50002C7.99998 6.77617 8.22383 7.00002 8.49998 7.00002H14.5C14.7761 7.00002 15 6.77617 15 6.50002C15 6.22388 14.7761 6.00002 14.5 6.00002H8.49998C8.22383 6.00002 7.99998 6.22388 7.99998 6.50002Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
  </svg>
);

export const DataIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 2H12.5C12.7761 2 13 2.22386 13 2.5V5H8V2ZM7 5V2H2.5C2.22386 2 2 2.22386 2 2.5V5H7ZM2 6V9H7V6H2ZM8 6H13V9H8V6ZM8 10H13V12.5C13 12.7761 12.7761 13 12.5 13H8V10ZM2 12.5V10H7V13H2.5C2.22386 13 2 12.7761 2 12.5ZM1 2.5C1 1.67157 1.67157 1 2.5 1H12.5C13.3284 1 14 1.67157 14 2.5V12.5C14 13.3284 13.3284 14 12.5 14H2.5C1.67157 14 1 13.3284 1 12.5V2.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
  </svg>
);

export const HealthIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill="currentColor" d="M9.002 2.5a.75.75 0 01.691.464l6.302 15.305 2.56-6.301a.75.75 0 01.695-.468h4a.75.75 0 010 1.5h-3.495l-3.06 7.532a.75.75 0 01-1.389.004L8.997 5.21l-3.054 7.329A.75.75 0 015.25 13H.75a.75.75 0 010-1.5h4l3.558-8.538a.75.75 0 01.694-.462z" />
  </svg>
); 

export const ConvexLogo = ({ width = 36, height = 36 }: { width?: number, height?: number }) => (
  <svg width={width} height={height} viewBox="0 0 184 188" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M108.092 130.021C126.258 128.003 143.385 118.323 152.815 102.167C148.349 142.128 104.653 167.385 68.9858 151.878C65.6992 150.453 62.8702 148.082 60.9288 145.034C52.9134 132.448 50.2786 116.433 54.0644 101.899C64.881 120.567 86.8748 132.01 108.092 130.021Z" fill="#F3B01C"/>
    <path d="M53.4012 90.1735C46.0375 107.191 45.7186 127.114 54.7463 143.51C22.9759 119.608 23.3226 68.4578 54.358 44.7949C57.2286 42.6078 60.64 41.3097 64.2178 41.1121C78.9312 40.336 93.8804 46.0225 104.364 56.6193C83.0637 56.831 62.318 70.4756 53.4012 90.1735Z" fill="#8D2676"/>
    <path d="M114.637 61.8552C103.89 46.8701 87.0686 36.6684 68.6387 36.358C104.264 20.1876 148.085 46.4045 152.856 85.1654C153.3 88.7635 152.717 92.4322 151.122 95.6775C144.466 109.195 132.124 119.679 117.702 123.559C128.269 103.96 126.965 80.0151 114.637 61.8552Z" fill="#EE342F"/>
  </svg>
);

export const ConvexText = () => (
  <svg width="126" height="20" viewBox="0 0 126 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="fill-neutral-white hover:fill-neutral-white/90"><g clip-path="url(#clip0_5_2)"><path d="M3.18483 17.4674C1.30005 15.782 0.357666 13.2908 0.357666 10.0003C0.357666 6.70977 1.31835 4.2186 3.24278 2.53321C5.16415 0.847812 7.79308 0.00350952 11.1265 0.00350952C12.5111 0.00350952 13.7341 0.103028 14.7985 0.308486C15.8629 0.510733 16.8815 0.854231 17.8544 1.34219V6.68088C16.3417 5.92646 14.6246 5.54765 12.7033 5.54765C11.0106 5.54765 9.76021 5.88473 8.95506 6.55889C8.14686 7.23304 7.74429 8.37911 7.74429 10.0003C7.74429 11.5669 8.14076 12.7001 8.93676 13.4C9.72971 14.103 10.9862 14.453 12.7063 14.453C14.527 14.453 16.2563 14.0067 17.8971 13.1175V18.7034C16.0763 19.5669 13.8073 19.9971 11.0899 19.9971C7.70159 19.9971 5.06961 19.1528 3.18483 17.4674Z"></path><path d="M19.538 9.99679C19.538 6.73194 20.4224 4.2504 22.1913 2.54896C23.9602 0.847512 26.6257 0 30.1909 0C33.7805 0 36.4644 0.850722 38.2485 2.54896C40.0296 4.24719 40.9201 6.73194 40.9201 9.99679C40.9201 16.6613 37.3427 19.9936 30.1909 19.9936C23.0879 19.9968 19.538 16.6645 19.538 9.99679ZM32.7497 13.3997C33.2743 12.6966 33.5365 11.5634 33.5365 10C33.5365 8.46228 33.2743 7.33547 32.7497 6.61958C32.2251 5.90369 31.3712 5.54735 30.1909 5.54735C29.0381 5.54735 28.2024 5.9069 27.6901 6.61958C27.1777 7.33547 26.9215 8.46228 26.9215 10C26.9215 11.5666 27.1777 12.6998 27.6901 13.3997C28.2024 14.1027 29.035 14.4526 30.1909 14.4526C31.3712 14.4526 32.2221 14.0995 32.7497 13.3997Z"></path><path d="M42.6029 0.404494H49.3704L49.5626 1.86196C50.3067 1.32263 51.2552 0.876404 52.408 0.526485C53.5608 0.176565 54.7533 0 55.9854 0C58.2667 0 59.9319 0.5939 60.9841 1.7817C62.0363 2.9695 62.5608 4.80257 62.5608 7.28732V19.5923H55.3328V8.05458C55.3328 7.19101 55.1467 6.57143 54.7747 6.19262C54.4026 5.8138 53.7804 5.62761 52.9082 5.62761C52.3714 5.62761 51.8194 5.75602 51.2552 6.01284C50.691 6.26966 50.2183 6.60032 49.8309 7.00482V19.5923H42.6029V0.404494Z"></path><path d="M62.5818 0.404617H70.1178L73.5794 11.6566L77.0409 0.404617H84.5769L77.3855 19.5924H69.7702L62.5818 0.404617Z"></path><path d="M86.8523 17.9422C84.6809 16.2279 83.6653 13.252 83.6653 10.0385C83.6653 6.90851 84.4735 4.33066 86.3186 2.54896C88.1637 0.767255 90.9757 0 94.5256 0C97.792 0 100.36 0.796147 102.236 2.38844C104.108 3.98074 105.047 6.15409 105.047 8.9053V12.2665H91.302C91.6436 13.2648 92.0766 13.9872 93.141 14.4334C94.2054 14.8796 95.6907 15.1011 97.5907 15.1011C98.7252 15.1011 99.8841 15.008 101.061 14.8186C101.476 14.7512 102.159 14.6453 102.519 14.565V19.2295C100.723 19.7432 98.3287 20 95.6297 20C91.9973 19.9968 89.0238 19.6565 86.8523 17.9422ZM97.4534 8.13804C97.4534 7.1878 96.4135 5.14286 94.3243 5.14286C92.4396 5.14286 91.1952 7.1557 91.1952 8.13804H97.4534Z"></path><path d="M110.723 9.8364L103.955 0.404617H111.799L125.642 19.5924H117.722L114.645 15.3003L111.567 19.5924H103.684L110.723 9.8364Z"></path><path d="M117.548 0.404617H125.356L119.363 8.8059L115.398 3.42227L117.548 0.404617Z"></path></g><defs><clipPath id="clip0_5_2"><rect width="126" height="20"></rect></clipPath></defs></svg>
);

export const PanelCollapseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M6 3.5H13M6 7.5H13M6 11.5H13M4 3.5L2 5.5L4 7.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const PanelExpandIcon = () => (
  <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M9 3.5H2M9 7.5H2M9 11.5H2M11 3.5L13 5.5L11 7.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ConvexFavicon = () => (
  <svg className="w-6" width="100%" height="100%" viewBox="0 0 367 370" version="1.1" xmlns="http://www.w3.org/2000/svg">
    <g transform="matrix(1,0,0,1,-129.225,-127.948)">
      <g transform="matrix(4.16667,0,0,4.16667,0,0)">
        <g transform="matrix(1,0,0,1,86.6099,107.074)">
          <path d="M0,-6.544C13.098,-7.973 25.449,-14.834 32.255,-26.287C29.037,2.033 -2.48,19.936 -28.196,8.94C-30.569,7.925 -32.605,6.254 -34.008,4.088C-39.789,-4.83 -41.69,-16.18 -38.963,-26.48C-31.158,-13.247 -15.3,-5.131 0,-6.544" fill="rgb(245,176,26)" fillRule="nonzero" />
        </g>
        <g transform="matrix(1,0,0,1,47.1708,74.7779)">
          <path d="M0,-2.489C-5.312,9.568 -5.545,23.695 0.971,35.316C-21.946,18.37 -21.692,-17.876 0.689,-34.65C2.754,-36.197 5.219,-37.124 7.797,-37.257C18.41,-37.805 29.19,-33.775 36.747,-26.264C21.384,-26.121 6.427,-16.446 0,-2.489" fill="rgb(141,37,118)" fillRule="nonzero" />
        </g>
        <g transform="matrix(1,0,0,1,91.325,66.4152)">
          <path d="M0,-14.199C-7.749,-24.821 -19.884,-32.044 -33.173,-32.264C-7.482,-43.726 24.112,-25.143 27.557,2.322C27.877,4.876 27.458,7.469 26.305,9.769C21.503,19.345 12.602,26.776 2.203,29.527C9.838,15.64 8.889,-1.328 0,-14.199" fill="rgb(238,52,47)" fillRule="nonzero" />
        </g>
      </g>
    </g>
  </svg>
);

export const LiveIndicatorIcon = () => (
  <svg className="convex-panel-live-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="convex-panel-clear-filters-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export const FilterIcon = ({ isActive }: { isActive?: boolean } = {}) => (
  <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M1 1L6 8V13L9 14V8L14 1H1Z"
      stroke={isActive ? "#4a9cff" : "currentColor"}
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg width="12" height="12" viewBox="0 0 15 15" fill="none" className={className}>
    <path d="M3.5 5.5L7.5 9.5L11.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg width="12" height="12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);

// @ts-ignore
export const RedXIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const ChartIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.85355 2.14645C5.04882 2.34171 5.04882 2.65829 4.85355 2.85355L3.70711 4H9C11.4853 4 13.5 6.01472 13.5 8.5C13.5 10.9853 11.4853 13 9 13H5C4.72386 13 4.5 12.7761 4.5 12.5C4.5 12.2239 4.72386 12 5 12H9C10.933 12 12.5 10.433 12.5 8.5C12.5 6.567 10.933 5 9 5H3.70711L4.85355 6.14645C5.04882 6.34171 5.04882 6.65829 4.85355 6.85355C4.65829 7.04882 4.34171 7.04882 4.14645 6.85355L2.14645 4.85355C1.95118 4.65829 1.95118 4.34171 2.14645 4.14645L4.14645 2.14645C4.34171 1.95118 4.65829 1.95118 4.85355 2.14645Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd">
    </path>
  </svg>
);

export const RevertIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.5 1C11.7761 1 12 1.22386 12 1.5V13.5C12 13.7761 11.7761 14 11.5 14C11.2239 14 11 13.7761 11 13.5V1.5C11 1.22386 11.2239 1 11.5 1ZM9.5 3C9.77614 3 10 3.22386 10 3.5V13.5C10 13.7761 9.77614 14 9.5 14C9.22386 14 9 13.7761 9 13.5V3.5C9 3.22386 9.22386 3 9.5 3ZM13.5 3C13.7761 3 14 3.22386 14 3.5V13.5C14 13.7761 13.7761 14 13.5 14C13.2239 14 13 13.7761 13 13.5V3.5C13 3.22386 13.2239 3 13.5 3ZM5.5 4C5.77614 4 6 4.22386 6 4.5V13.5C6 13.7761 5.77614 14 5.5 14C5.22386 14 5 13.7761 5 13.5V4.5C5 4.22386 5.22386 4 5.5 4ZM1.5 5C1.77614 5 2 5.22386 2 5.5V13.5C2 13.7761 1.77614 14 1.5 14C1.22386 14 1 13.7761 1 13.5V5.5C1 5.22386 1.22386 5 1.5 5ZM7.5 5C7.77614 5 8 5.22386 8 5.5V13.5C8 13.7761 7.77614 14 7.5 14C7.22386 14 7 13.7761 7 13.5V5.5C7 5.22386 7.22386 5 7.5 5ZM3.5 7C3.77614 7 4 7.22386 4 7.5V13.5C4 13.7761 3.77614 14 3.5 14C3.22386 14 3 13.7761 3 13.5V7.5C3 7.22386 3.22386 7 3.5 7Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd">
    </path>
  </svg>
);

export const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export const RefreshIcon = () => (
  <svg className="convex-panel-refresh-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

export const SettingsIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="14" 
    height="14" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

export const DevToolsIcon = () => (
<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-code">
  <polyline points="16 18 22 12 16 6"/>
  <polyline points="8 6 2 12 8 18"/>
</svg>
);

export const ConsoleIcon = () => (
<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevrons-left-right-ellipsis">
  <path d="m18 8 4 4-4 4"/>
  <path d="m6 8-4 4 4 4"/>
  <path d="M8 12h.01"/>
  <path d="M16 12h.01"/>
</svg>
);

export const NetworkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-network">
    <rect x="16" y="16" width="6" height="6" rx="1"/>
    <rect x="2" y="16" width="6" height="6" rx="1"/>
    <rect x="9" y="2" width="6" height="6" rx="1"/>
    <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/>
    <path d="M12 12V8"/>
  </svg>
);

export const ApplicationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-grid">
    <rect width="7" height="7" x="3" y="3" rx="1"/>
    <rect width="7" height="7" x="14" y="3" rx="1"/>
    <rect width="7" height="7" x="14" y="14" rx="1"/>
    <rect width="7" height="7" x="3" y="14" rx="1"/>
  </svg>
); 

export const EllipsisIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="6" r="2" fill="#a0a0a0" />
  <circle cx="12" cy="12" r="2" fill="#a0a0a0" />
    <circle cx="12" cy="18" r="2" fill="#a0a0a0" />
  </svg>
); 

export const SortArrowDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-down-a-z">
    <path d="m3 16 4 4 4-4"/>
    <path d="M7 20V4"/>
    <path d="M20 8h-5"/>
    <path d="M15 10V6.5a2.5 2.5 0 0 1 5 0V10"/>
    <path d="M15 14h5l-5 6h5"/>
  </svg>
);

export const SortArrowUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-up-a-z">
    <path d="m3 8 4-4 4 4"/>
    <path d="M7 4v16"/>
    <path d="M20 8h-5"/>
    <path d="M15 10V6.5a2.5 2.5 0 0 1 5 0V10"/>
    <path d="M15 14h5l-5 6h5"/>
  </svg>
);

export const ArrowUpDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-up-down">
    <path d="m21 16-4 4-4-4"/>
    <path d="M17 20V4"/>
    <path d="m3 8 4-4 4 4"/>
    <path d="M7 4v16"/>
  </svg>
);

export const SortIcon = ({ direction, isHovered }: { direction: SortDirection | null, isHovered: boolean }) => {
  // Only show the icon if sorting is active or the header is hovered
  if (direction === null && !isHovered) {
    return null;
  }
  
  if (direction === null) {
    return (
      <span className="convex-panel-sort-icon convex-panel-sort-icon-inactive">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2.5 3.5L5 1L7.5 3.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2.5 6.5L5 9L7.5 6.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    );
  }
  
  if (direction === 'asc') {
    return (
      <span className="convex-panel-sort-icon convex-panel-sort-icon-asc">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2.5 3.5L5 1L7.5 3.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    );
  }
  
  return (
    <span className="convex-panel-sort-icon convex-panel-sort-icon-desc">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2.5 6.5L5 9L7.5 6.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  );
};

export const CodeIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
  </svg>
);

export const MagnifyingGlassIcon = ({ className }: { className?: string }) => (
  <svg width="15" height="15" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);

export const ArrowPathIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3" />
  </svg>
);

export const PlayIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
  </svg>
);

export const CodeBracketIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
  </svg>
);

export const FolderIcon = ({ className, style, width = 15, height = 15 }: { className?: string, style?: React.CSSProperties, width?: number, height?: number }) => (
  <svg style={style} width={width} height={height} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
  </svg>
);

export const FolderOpenIcon = ({ className, style, width = 15, height = 15 }: { className?: string, style?: React.CSSProperties, width?: number, height?: number }) => (
  <svg style={style} width={width} height={height} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776" />
  </svg>
);

export const FunctionIcon = ({ className }: { className?: string }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" stroke="none" strokeWidth="1.5" fill="currentColor" className={className}>
    <path d="M4.77207 20C4.22502 20 3.79437 19.8619 3.48012 19.5858C3.16004 19.3096 3 18.9759 3 18.5847C3 18.3028 3.09602 18.0755 3.28807 17.9029C3.4743 17.7303 3.68671 17.644 3.92532 17.644C4.1581 17.644 4.3676 17.7217 4.55383 17.877C4.73424 18.0381 4.82444 18.2539 4.82444 18.5243C4.82444 18.6681 4.77789 18.8091 4.68477 18.9471C4.58584 19.091 4.53637 19.1888 4.53637 19.2406C4.53637 19.3038 4.56838 19.3528 4.6324 19.3873C4.69059 19.4218 4.76334 19.4391 4.85063 19.4391C5.29874 19.4391 5.63919 19.0852 5.87197 18.3776C6.10475 17.6757 6.58778 15.6217 7.32105 12.2157L8.05432 9.1521H6.74491L6.91077 8.41855H8.22017C8.32493 7.9813 8.54607 7.38871 8.88361 6.64078C9.22696 5.88709 9.66343 5.28012 10.193 4.81985C10.8332 4.27328 11.4908 4 12.1659 4C12.7071 4 13.1494 4.12082 13.4927 4.36246C13.8419 4.6041 14.0165 4.96368 14.0165 5.44121C14.0165 5.72312 13.9263 5.95038 13.7459 6.12298C13.5713 6.28982 13.3618 6.37325 13.1174 6.37325C12.8788 6.37325 12.6722 6.28982 12.4976 6.12298C12.323 5.95613 12.2357 5.76052 12.2357 5.53614C12.2357 5.3808 12.2823 5.22258 12.3754 5.06149C12.4743 4.89464 12.5238 4.79684 12.5238 4.76807C12.5238 4.7278 12.5034 4.67602 12.4627 4.61273C12.4161 4.5552 12.3346 4.52643 12.2182 4.52643C11.8923 4.52643 11.5955 4.75081 11.3278 5.19957C11.066 5.64833 10.8215 6.30421 10.5946 7.16721L10.2629 8.41855H11.9214L11.7556 9.1521H10.1406C9.29098 13.283 8.58972 15.9928 8.03686 17.2816C7.25703 19.0939 6.16877 20 4.77207 20Z">
    </path>
    <path d="M12.0786 16.3495L13.676 10.7055C13.7401 10.4754 13.7866 10.2941 13.8157 10.1618C13.8739 9.91442 13.903 9.74182 13.903 9.64401C13.903 9.43114 13.8361 9.29881 13.7022 9.24703C13.5684 9.19525 13.3094 9.16361 12.9253 9.1521V8.68608C13.6702 8.64006 14.2493 8.58828 14.6625 8.53074C15.0757 8.47321 15.6925 8.36677 16.5131 8.21143L15.4306 11.4822L15.4743 11.5081C15.4452 11.5369 15.6198 11.2751 15.9981 10.7228C16.3763 10.1647 16.7371 9.71305 17.0805 9.36785C17.418 9.0169 17.7701 8.73786 18.1368 8.53074C18.5092 8.31787 18.8991 8.21143 19.3065 8.21143C19.6848 8.21143 20.0049 8.31787 20.2667 8.53074C20.5344 8.74362 20.6683 9.09169 20.6683 9.57497C20.6683 10.0237 20.4064 11.0133 19.8826 12.5437C19.3531 14.0683 19.0883 14.8853 19.0883 14.9946C19.0883 15.0982 19.1203 15.1787 19.1843 15.2362C19.2483 15.288 19.3123 15.3139 19.3763 15.3139C19.5335 15.3139 19.7662 15.1183 20.0747 14.7271C20.2376 14.52 20.4151 14.2639 20.6072 13.959L21 14.2093C20.5577 14.9169 20.1823 15.4261 19.8739 15.7368C19.3385 16.2718 18.7711 16.5394 18.1717 16.5394C17.8516 16.5394 17.5635 16.4473 17.3075 16.2632C17.0572 16.0791 16.9321 15.7886 16.9321 15.3916C16.9321 15.1384 16.9932 14.7702 17.1154 14.2869C17.2376 13.8037 17.386 13.306 17.5606 12.794L18.451 10.1532C18.4685 10.0899 18.483 10.0352 18.4947 9.98921C18.5063 9.94319 18.5121 9.89716 18.5121 9.85113C18.5121 9.71881 18.4656 9.62675 18.3725 9.57497C18.2852 9.52319 18.1891 9.4973 18.0844 9.4973C17.7177 9.4973 17.3104 9.77922 16.8623 10.343C16.4142 10.9011 16.0475 11.4592 15.7624 12.0173C15.4539 12.6214 15.195 13.2341 14.9855 13.8554C14.7759 14.4768 14.5257 15.3082 14.2347 16.3495H12.0786Z">
    </path>
  </svg>
);

export const LockIcon = ({ className }: { className?: string }) => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M5 4.63601C5 3.76031 5.24219 3.1054 5.64323 2.67357C6.03934 2.24705 6.64582 1.9783 7.5014 1.9783C8.35745 1.9783 8.96306 2.24652 9.35823 2.67208C9.75838 3.10299 10 3.75708 10 4.63325V5.99999H5V4.63601ZM4 5.99999V4.63601C4 3.58148 4.29339 2.65754 4.91049 1.99307C5.53252 1.32329 6.42675 0.978302 7.5014 0.978302C8.57583 0.978302 9.46952 1.32233 10.091 1.99162C10.7076 2.65557 11 3.57896 11 4.63325V5.99999H12C12.5523 5.99999 13 6.44771 13 6.99999V13C13 13.5523 12.5523 14 12 14H3C2.44772 14 2 13.5523 2 13V6.99999C2 6.44771 2.44772 5.99999 3 5.99999H4ZM3 6.99999H12V13H3V6.99999Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd">
  </path>
  </svg>
);

export function ClipboardIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  );
} 