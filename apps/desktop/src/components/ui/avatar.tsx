import { useId, useMemo } from "react";
import { hashString, parseHslToRgb, colorSchemes } from "../../utils/avatar";

interface AvatarProps {
  name: string;
  hashKey?: string | number;
  size?: number;
  className?: string;
}

export function Avatar({ 
  name, 
  hashKey, 
  size = 32,
  className = "",
}: AvatarProps) {
  const uniqueId = useId();
  
  // Calculate hash once outside useMemo
  const key = hashKey !== undefined ? String(hashKey) : name;
  const hash = hashString(key);
  const gradientId = `gradient-${hash}-${uniqueId.replace(/:/g, "-")}`;
  
  const { initial, gradientElement } = useMemo(() => {
    // Determine pattern and color scheme (matching dashboard logic)
    const patternIdx = hash % 4;
    const colorSchemeIdx = Math.floor(hash / 4) % colorSchemes.length;
    const baseColors = colorSchemes[colorSchemeIdx];
    const rotationDeg = hash % 360;

    // Get initial letters (2 letters if name has spaces, otherwise first 2 chars)
    const initial =
      name.split(" ").length > 1
        ? name.split(" ")[0][0] + name.split(" ")[1][0]
        : name.slice(0, 2).toUpperCase();

    // Convert HSL colors to RGB for web
    const colors = baseColors.map(parseHslToRgb);
    
    // Calculate gradient coordinates
    let x1 = 0, y1 = 0, x2 = 1, y2 = 0;
    let cx = 0.5, cy = 0.5, r = 0.5;
    let gradientType: "linear" | "radial" = "linear";
    let stops: Array<{ offset: string; color: string }> = [];

    switch (patternIdx) {
      case 0: {
        // Linear gradient left to right
        const theta = (rotationDeg / 180) * Math.PI;
        x1 = 0.5 - 0.5 * Math.cos(theta);
        y1 = 0.5 - 0.5 * Math.sin(theta);
        x2 = 0.5 + 0.5 * Math.cos(theta);
        y2 = 0.5 + 0.5 * Math.sin(theta);
        gradientType = "linear";
        stops = [
          { offset: "0%", color: colors[0] },
          { offset: "100%", color: colors[1] },
        ];
        break;
      }
      case 1: {
        // Linear gradient diagonal
        const theta = ((45 + rotationDeg) / 180) * Math.PI;
        x1 = 0.5 - 0.5 * Math.cos(theta);
        y1 = 0.5 - 0.5 * Math.sin(theta);
        x2 = 0.5 + 0.5 * Math.cos(theta);
        y2 = 0.5 + 0.5 * Math.sin(theta);
        gradientType = "linear";
        stops = [
          { offset: "0%", color: colors[2] },
          { offset: "100%", color: colors[3] },
        ];
        break;
      }
      case 2: {
        // Diagonal multi-stop gradient
        const theta = ((135 + rotationDeg) / 180) * Math.PI;
        x1 = 0.5 - 0.5 * Math.cos(theta);
        y1 = 0.5 - 0.5 * Math.sin(theta);
        x2 = 0.5 + 0.5 * Math.cos(theta);
        y2 = 0.5 + 0.5 * Math.sin(theta);
        gradientType = "linear";
        stops = [
          { offset: "0%", color: colors[2] },
          { offset: "60%", color: colors[0] },
          { offset: "100%", color: colors[1] },
        ];
        break;
      }
      case 3: {
        // Radial gradient
        const theta = (rotationDeg / 180) * Math.PI;
        const r_offset = 0.3;
        cx = 0.5 + r_offset * Math.cos(theta);
        cy = 0.5 + r_offset * Math.sin(theta);
        gradientType = "radial";
        stops = [
          { offset: "0%", color: colors[0] },
          { offset: "80%", color: colors[1] },
          { offset: "100%", color: colors[2] },
        ];
        break;
      }
      default: {
        gradientType = "linear";
        stops = [
          { offset: "0%", color: colors[0] },
          { offset: "100%", color: colors[1] },
        ];
      }
    }

    const gradientElement = gradientType === "linear" ? (
      <linearGradient id={gradientId} x1={x1} y1={y1} x2={x2} y2={y2}>
        {stops.map((stop, idx) => (
          <stop key={idx} offset={stop.offset} stopColor={stop.color} />
        ))}
      </linearGradient>
    ) : (
      <radialGradient id={gradientId} cx={cx} cy={cy} r={r}>
        {stops.map((stop, idx) => (
          <stop key={idx} offset={stop.offset} stopColor={stop.color} />
        ))}
      </radialGradient>
    );

    return { initial, gradientElement };
  }, [name, hash, gradientId]);

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
      }}
    >
      <svg
        width={size}
        height={size}
        className="absolute inset-0"
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <defs>
          {gradientElement}
        </defs>
        <rect width={size} height={size} fill={`url(#${gradientId})`} />
      </svg>
      {/* Overlay for contrast */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
      />
      {/* Initial text */}
      <span
        className="relative font-medium text-white select-none"
        style={{
          fontSize: size * 0.4,
          textShadow: "0 0 3px rgba(0, 0, 0, 0.5)",
        }}
      >
        {initial}
      </span>
    </div>
  );
}
