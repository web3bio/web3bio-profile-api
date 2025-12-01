import { getPlatform, resolveIdentity } from "web3bio-profile-kit/utils";
import type { Platform } from "web3bio-profile-kit/types";

const SIZE = 80;
const ELEMENTS = 3;

// Utility functions for avatar
const getDigit = (number: number, ntn: number): number => {
  return Math.floor((number / Math.pow(10, ntn)) % 10);
};

const getUnit = (number: number, range: number, index?: number): number => {
  const value = number % range;
  if (index && getDigit(number, index) % 2 === 0) {
    return -value;
  }
  return value;
};

const getRandomColor = (
  number: number,
  colors: string[],
  range: number,
): string => {
  return colors[number % range];
};

function generateRandomColors(
  name: string,
  platformColor: string,
  count: number = 5,
): string[] {
  const hash = hashCode(name);
  const colors: string[] = [];

  // Parse platform color to HSL
  let platformHSL = [0, 0.7, 0.65];
  if (platformColor.startsWith("#")) {
    const r = parseInt(platformColor.slice(1, 3), 16) / 255;
    const g = parseInt(platformColor.slice(3, 5), 16) / 255;
    const b = parseInt(platformColor.slice(5, 7), 16) / 255;
    platformHSL = rgbToHsl(r * 255, g * 255, b * 255);
  }

  const baseHue = platformHSL[0] * 360;
  const baseSat = platformHSL[1];

  for (let i = 0; i < count; i++) {
    const seed = hash * (i + 1) + i * 137;
    let h, s, l;

    if (i === 0) {
      // Primary: Very close to platform color (slight brightening only)
      h = baseHue;
      s = Math.min(0.9, baseSat) * 100; // Use platform saturation (max 90%)
      l = Math.min(85, Math.max(65, platformHSL[2] * 100 + 5)); // Close to platform lightness, but ensure bright
    } else if (i === 1) {
      // Analogous: Close hue neighbor (+/- 30 degrees)
      const shift = (seed % 2 === 0 ? 1 : -1) * (20 + (seed % 30));
      h = (baseHue + shift + 360) % 360;
      s = Math.min(0.8, baseSat + 0.05) * 100;
      l = 68 + ((seed >> 8) % 17); // 68-85%
    } else if (i === 2) {
      // Complementary or split-complementary
      const shift = 150 + ((seed >> 4) % 60); // 150-210 degrees
      h = (baseHue + shift) % 360;
      s = Math.min(0.75, baseSat) * 100;
      l = 65 + ((seed >> 12) % 20); // 65-85%
    } else {
      // Triadic or additional harmony
      const shift = i === 3 ? 120 : 240;
      h = (baseHue + shift + ((seed >> 6) % 30)) % 360;
      s = Math.min(0.75, baseSat + 0.05) * 100;
      l = 67 + ((seed >> 10) % 18); // 67-85%
    }

    const hue = h / 360;
    const sat = s / 100;
    const light = l / 100;

    const [r, g, b] = hslToRgb(hue, sat, light);
    colors.push(rgbToHex(Math.round(r), Math.round(g), Math.round(b)));
  }

  return colors;
}

function generateProperties(name: string, colors: string[]) {
  const numFromName = hashCode(name);
  const range = colors?.length || 3;

  return Array.from({ length: ELEMENTS }, (_, i) => ({
    color: getRandomColor(numFromName + i, colors, range),
    translateX: getUnit(numFromName * (i + 1), SIZE / 10, 1),
    translateY: getUnit(numFromName * (i + 1), SIZE / 10, 2),
    scale: 1.2 + getUnit(numFromName * (i + 1), SIZE / 20) / 10,
    rotate: getUnit(numFromName * (i + 1), 360, 1),
  }));
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
  const platformColor = platform
    ? getPlatform(platform).color || "#7c66ff"
    : "#7c66ff";

  const colors = generateRandomColors(name, platformColor, 5);
  const properties = generateProperties(name, colors);
  const maskID = String(hashCode(name));

  const svg = `
    <svg
      viewBox="0 0 ${SIZE} ${SIZE}"
      fill="none"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      width="${size}"
      height="${size}"
    >
      <mask
        id="${maskID}"
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="${SIZE}"
        height="${SIZE}"
      >
        <rect width="${SIZE}" height="${SIZE}" rx="${SIZE * 2}" fill="#FFFFFF" />
      </mask>
      <g mask="url(#${maskID})">
        <rect width="${SIZE}" height="${SIZE}" fill="${properties[0].color}" />
        <path
          filter="url(#filter_${maskID})"
          d="M32.414 59.35L50.376 70.5H72.5v-71H33.728L26.5 13.381l19.057 27.08L32.414 59.35z"
          fill="${properties[1].color}"
          transform="translate(${properties[1].translateX} ${properties[1].translateY}) rotate(${properties[1].rotate} ${SIZE / 2} ${SIZE / 2}) scale(${properties[2].scale})"
        />
        <path
          filter="url(#filter_${maskID})"
          style="mix-blend-mode: overlay"
          d="M22.216 24L0 46.75l14.108 38.129L78 86l-3.081-59.276-22.378 4.005 12.972 20.186-23.35 27.395L22.215 24z"
          fill="${properties[2].color}"
          transform="translate(${properties[2].translateX} ${properties[2].translateY}) rotate(${properties[2].rotate} ${SIZE / 2} ${SIZE / 2}) scale(${properties[2].scale})"
        />
      </g>
      <defs>
        <filter
          id="filter_${maskID}"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="7" result="effect1_foregroundBlur" />
        </filter>
      </defs>
    </svg>
  `.trim();

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control":
        "public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400",
    },
  });
};
