import { getPlatform, resolveIdentity } from "web3bio-profile-kit/utils";
import type { Platform } from "web3bio-profile-kit/types";

const ITEMS = 12;
const SIZE = 480;
const ELEMENTS = 144;
const UNIT = 40;

type AvatarPixelProps = {
  colors: string[];
  title: string;
  size: number;
};

const AvatarPixel = ({ colors, title, size }: AvatarPixelProps) => {
  const pixelColors = generateColors(title, colors);
  const maskID = String(hashCode(title));

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      fill="none"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
    >
      <mask
        id={maskID}
        maskUnits="userSpaceOnUse"
        x={0}
        y={0}
        width={SIZE}
        height={SIZE}
      >
        <rect width={SIZE} height={SIZE} fill="#FFFFFF" />
      </mask>
      <g mask={`url(#${maskID})`}>
        <rect width={SIZE} height={SIZE} fill={colors[0]} />
        {Array.from({ length: ELEMENTS }, (_, index) => {
          const row = Math.floor(index / ITEMS);
          const col = index % ITEMS;
          return (
            <rect
              key={index}
              x={col * UNIT}
              y={row * UNIT}
              width={UNIT}
              height={UNIT}
              fill={pixelColors[index]}
            />
          );
        })}
      </g>
    </svg>
  );
};

function generateColors(name: string, colors: string[]): string[] {
  const numFromName = hashCode(name);
  const validColors = colors?.length
    ? colors
    : ["#92A1C6", "#146A7C", "#F0AB3D", "#C271B4"];

  return Array.from({ length: ELEMENTS }, (_, i) => {
    const hash = (numFromName % (i + 1)) * (i + 11);
    const baseColorIndex = Math.abs(hash) % validColors.length;
    const baseColor = validColors[baseColorIndex];

    // Only process hex colors
    if (!/^#[A-Fa-f0-9]{6}$/.test(baseColor)) {
      return baseColor;
    }

    const r = parseInt(baseColor.slice(1, 3), 16);
    const g = parseInt(baseColor.slice(3, 5), 16);
    const b = parseInt(baseColor.slice(5, 7), 16);

    const variationFactor = 1 + 0.25 * (((hash & 0xff) / 255) * 2 - 1);

    const newR = Math.min(255, Math.max(0, Math.round(r * variationFactor)));
    const newG = Math.min(255, Math.max(0, Math.round(g * variationFactor)));
    const newB = Math.min(255, Math.max(0, Math.round(b * variationFactor)));

    return `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
  });
}

const hashCode = (name: string): number => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const character = name.charCodeAt(i);
    hash = (hash << 10) - hash + character;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

export const getThemeColor = (
  input: string,
  color: string,
  range: number = 30,
): string[] => {
  // Generate hash from input string
  const hash = Array.from(input).reduce((acc, char, index) => {
    return (acc * 31 + char.charCodeAt(0) * (index + 1)) & 0xffffffff;
  }, 0);

  // Parse hex color
  let r = 0,
    g = 0,
    b = 0;
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    }
  }

  // Create variations using hash
  const adjustedRange = range + (Math.abs(hash) % 30);
  const halfRange = adjustedRange / 2;

  r = Math.max(
    0,
    Math.min(255, r + ((hash & 0xff) % adjustedRange) - halfRange),
  );
  g = Math.max(
    0,
    Math.min(255, g + (((hash >> 8) & 0xff) % adjustedRange) - halfRange),
  );
  b = Math.max(
    0,
    Math.min(255, b + (((hash >> 16) & 0xff) % adjustedRange) - halfRange),
  );

  // Generate secondary color
  const secondaryVariance = 15 + (Math.abs(hash) % 15);
  const halfSecondary = secondaryVariance / 2;

  const r2 = Math.max(
    0,
    Math.min(255, r + ((hash >> 24) % secondaryVariance) - halfSecondary),
  );
  const g2 = Math.max(
    0,
    Math.min(255, g + ((hash >> 20) % secondaryVariance) - halfSecondary),
  );
  const b2 = Math.max(
    0,
    Math.min(255, b + ((hash >> 28) % secondaryVariance) - halfSecondary),
  );

  // Convert to HSL and create variations
  const [h, s, l] = rgbToHsl(r, g, b);
  const [h2, s2, l2] = rgbToHsl(r2, g2, b2);

  const primaryLightness = Math.min(0.7, l + 0.12);
  const [rPrimary, gPrimary, bPrimary] = hslToRgb(h, s, primaryLightness);

  const secondaryLightness = Math.min(0.75, l2 + 0.15);
  const [rSecondary, gSecondary, bSecondary] = hslToRgb(
    h2,
    s2,
    secondaryLightness,
  );

  // Tertiary color with hue shift
  const hueShift = ((hash & 0xff) % 5) / 100;
  const newHue = (h + hueShift) % 1.0;
  const newSat = Math.max(0.1, s * 0.4);
  const newLight = Math.min(0.92, 0.7 + (((hash >> 4) & 0xff) % 12) / 100);

  const [r3, g3, b3] = hslToRgb(newHue, newSat, newLight);

  return [
    rgbToHex(Math.round(rPrimary), Math.round(gPrimary), Math.round(bPrimary)),
    rgbToHex(
      Math.round(rSecondary),
      Math.round(gSecondary),
      Math.round(bSecondary),
    ),
    rgbToHex(Math.round(r3), Math.round(g3), Math.round(b3)),
  ];
};

// Helper functions for color conversion
function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    r.toString(16).padStart(2, "0") +
    g.toString(16).padStart(2, "0") +
    b.toString(16).padStart(2, "0")
  );
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [r * 255, g * 255, b * 255];
}

export const respondWithSVG = async (
  name: string,
  size: number,
): Promise<Response> => {
  const id = resolveIdentity(name);
  const platform = id?.split(",")[0] as Platform;
  const themecolorbase = platform
    ? getPlatform(platform).color || "#000"
    : "#000";

  const colors = getThemeColor(name, themecolorbase);
  const { renderToString } = await import("react-dom/server");

  const svg = renderToString(
    <AvatarPixel colors={colors} title={name} size={size} />,
  );

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control":
        "public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400",
    },
  });
};
