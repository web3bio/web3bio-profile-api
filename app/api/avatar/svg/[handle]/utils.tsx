import { getPlatform } from "@/utils/platform";
import type { Platform } from "web3bio-profile-kit/types";
import { resolveIdentity } from "web3bio-profile-kit/utils";

const ITEMS = 12;
const SIZE = 480;
const ELEMENTS = ITEMS * ITEMS;
const UNIT = SIZE / ITEMS;

type AvatarPixelProps = {
  colors: string[];
  title: string;
  size: number;
  name: string;
};

const AvatarPixel = (props: AvatarPixelProps) => {
  const { colors, title, size, ...otherProps } = props;
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
      {...otherProps}
    >
      <mask
        id={maskID}
        mask-type="alpha"
        maskUnits="userSpaceOnUse"
        x={0}
        y={0}
        width={SIZE}
        height={SIZE}
      >
        <rect width={SIZE} height={SIZE} rx={0} fill="#FFFFFF" />
      </mask>
      <g mask={`url(#${maskID})`}>
        <rect width={SIZE} height={SIZE} rx={0} fill={colors[0]} />
        {Array.from({ length: ITEMS }).map((_, row) =>
          Array.from({ length: ITEMS }).map((_, col) => {
            const index = row * ITEMS + col;
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
          }),
        )}
      </g>
    </svg>
  );
};

function generateColors(name: string, colors: string[]): string[] {
  const numFromName = hashCode(name);

  if (!colors || colors.length === 0) {
    colors = ["#92A1C6", "#146A7C", "#F0AB3D", "#C271B4"];
  }

  const colorList = Array.from({ length: ELEMENTS }, (_, i) => {
    const hash = (numFromName % (i + 1)) * (i + 11);

    const baseColorIndex = Math.abs(hash) % colors.length;
    const baseColor = colors[baseColorIndex];

    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(baseColor)) {
      const r = parseInt(baseColor.substring(1, 3), 16);
      const g = parseInt(baseColor.substring(3, 5), 16);
      const b = parseInt(baseColor.substring(5, 7), 16);

      // Create variation (±25% of original value)
      const variation = 0.25;
      const variationFactor = 1 + variation * (((hash & 0xff) / 255) * 2 - 1);

      const newR = Math.min(255, Math.max(0, Math.round(r * variationFactor)));
      const newG = Math.min(255, Math.max(0, Math.round(g * variationFactor)));
      const newB = Math.min(255, Math.max(0, Math.round(b * variationFactor)));

      return `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
    }

    return baseColor;
  });

  return colorList;
}

const hashCode = (name: string) => {
  var hash = 0;
  for (var i = 0; i < name.length; i++) {
    var character = name.charCodeAt(i);
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
  // Generate a more distinctive hash from the input string
  const hashCode = Array.from(input).reduce((acc, char, index) => {
    // Multiply by prime number and add position influence to increase variance
    return (acc * 31 + char.charCodeAt(0) * (index + 1)) & 0xffffffff;
  }, 0);

  // Parse the color string (supports hex format)
  let r = 0,
    g = 0,
    b = 0;

  if (color.startsWith("#")) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    }
  }

  // Use hash to create variations for each color channel
  const adjustedRange = range + (Math.abs(hashCode) % 30);
  const rVariation = ((hashCode & 0xff) % adjustedRange) - adjustedRange / 2;
  const gVariation =
    (((hashCode >> 8) & 0xff) % adjustedRange) - adjustedRange / 2;
  const bVariation =
    (((hashCode >> 16) & 0xff) % adjustedRange) - adjustedRange / 2;

  // Apply variations to each channel
  r = Math.max(0, Math.min(255, r + rVariation));
  g = Math.max(0, Math.min(255, g + gVariation));
  b = Math.max(0, Math.min(255, b + bVariation));

  // Generate a secondary color with variations
  const secondaryVariance = 15 + (Math.abs(hashCode) % 15);
  const r2 = Math.max(
    0,
    Math.min(
      255,
      r + ((hashCode >> 24) % secondaryVariance) - secondaryVariance / 2,
    ),
  );
  const g2 = Math.max(
    0,
    Math.min(
      255,
      g + ((hashCode >> 20) % secondaryVariance) - secondaryVariance / 2,
    ),
  );
  const b2 = Math.max(
    0,
    Math.min(
      255,
      b + ((hashCode >> 28) % secondaryVariance) - secondaryVariance / 2,
    ),
  );

  // Convert primary colors to HSL for better control over lightness
  const [h, s, l] = rgbToHsl(r, g, b);

  // Apply moderate lightness increase to primary color
  const primaryLightness = Math.min(0.7, l + 0.12);
  const [rPrimary, gPrimary, bPrimary] = hslToRgb(h, s, primaryLightness);

  // Convert secondary colors to HSL
  const [h2, s2, l2] = rgbToHsl(r2, g2, b2);

  // Apply moderate lightness increase to secondary color
  const secondaryLightness = Math.min(0.75, l2 + 0.15);
  const [rSecondary, gSecondary, bSecondary] = hslToRgb(
    h2,
    s2,
    secondaryLightness,
  );

  // Generate tertiary color with a hue shift and slightly higher lightness
  const hueShift = ((hashCode & 0xff) % 10) / 100;
  const newHue = (h + hueShift) % 1.0;
  const newSat = Math.max(0.15, s * 0.7);
  const newLight = Math.min(
    0.75,
    l + 0.2 + (((hashCode >> 4) & 0xff) % 20) / 100,
  );

  const [r3, g3, b3] = hslToRgb(newHue, newSat, newLight);

  const primaryColor = rgbToHex(
    Math.round(rPrimary),
    Math.round(gPrimary),
    Math.round(bPrimary),
  );
  const secondaryColor = rgbToHex(
    Math.round(rSecondary),
    Math.round(gSecondary),
    Math.round(bSecondary),
  );
  const tertiaryColor = rgbToHex(
    Math.round(r3),
    Math.round(g3),
    Math.round(b3),
  );

  return [primaryColor, secondaryColor, tertiaryColor];
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

export const respondWithSVG = async (name: string, size: number) => {
  const id = resolveIdentity(name);
  // Use default color directly without unnecessary variable
  const platform = id?.split(",")[0] as Platform;
  const themecolorbase = platform
    ? getPlatform(platform).color || "#000"
    : "#000";

  // Create avatar props directly
  const colors = getThemeColor(name, themecolorbase);
  const encodedName = encodeURIComponent(name);

  const { renderToString } = await import("react-dom/server");

  const svg = renderToString(
    <AvatarPixel colors={colors} title={name} size={size} name={encodedName} />,
  );

  // Simplify encoding with try-catch
  let encoded;
  try {
    encoded = new TextEncoder().encode(svg);
  } catch {
    encoded = svg;
  }

  // Return response with the proper headers
  return new Response(encoded, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control":
        "public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400",
    },
  });
};
