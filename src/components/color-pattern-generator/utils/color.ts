import { converter, inGamut } from "culori";
import type { ColorSpace, Pattern } from "../types.ts";
import { colorSpaceComponents } from "./constants.ts";

export const SHADE_STEPS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100] as const;
export const DEFAULT_MODIFIER_CURVE: [number, number, number, number] = [0.33, 0.33, 0.67, 0.67];

export const MODIFIER_CURVE_PRESETS: Record<string, [number, number, number, number]> = {
    Linear: [0.33, 0.33, 0.67, 0.67],
    "Ease out": [0.0, 0.0, 0.58, 1.0],
};

const toOklch = converter("oklch");
const isSrgbGamut = inGamut("rgb");
const isP3Gamut = inGamut("p3");

export interface OklchColor {
    mode: "oklch";
    l: number;
    c: number;
    h: number;
}

export interface ShadeAnalysis {
    percentage: number;
    outOfSrgb: boolean;
    outOfP3: boolean;
}

// Helper function to sanitize pattern name for valid CSS custom property
export function sanitizePatternName(name: string): string {
    // Allow only letters, numbers, hyphens and underscores
    // Replace any invalid character with a hyphen
    return name.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function clamp01(value: number): number {
    return Math.max(0, Math.min(1, value));
}

function normalizeHue(hue: number): number {
    const normalized = hue % 360;
    return normalized < 0 ? normalized + 360 : normalized;
}

export function sanitizeModifierCurve(curve?: [number, number, number, number]): [number, number, number, number] {
    if (!curve || curve.length !== 4 || curve.some((value) => Number.isNaN(value))) {
        return DEFAULT_MODIFIER_CURVE;
    }

    return [clamp01(curve[0]), clamp01(curve[1]), clamp01(curve[2]), clamp01(curve[3])];
}

function cubicBezierYAtX(x: number, curve: [number, number, number, number]): number {
    const [cp1x, cp1y, cp2x, cp2y] = sanitizeModifierCurve(curve);
    const epsilon = 1e-6;

    const sampleCurveX = (t: number): number => {
        const inv = 1 - t;
        return 3 * inv * inv * t * cp1x + 3 * inv * t * t * cp2x + t * t * t;
    };

    const sampleCurveY = (t: number): number => {
        const inv = 1 - t;
        return 3 * inv * inv * t * cp1y + 3 * inv * t * t * cp2y + t * t * t;
    };

    const sampleCurveDerivativeX = (t: number): number => {
        const inv = 1 - t;
        return 3 * inv * inv * cp1x + 6 * inv * t * (cp2x - cp1x) + 3 * t * t * (1 - cp2x);
    };

    let t = clamp01(x);
    for (let i = 0; i < 6; i += 1) {
        const currentX = sampleCurveX(t) - x;
        if (Math.abs(currentX) < epsilon) {
            break;
        }
        const derivative = sampleCurveDerivativeX(t);
        if (Math.abs(derivative) < epsilon) {
            break;
        }
        t -= currentX / derivative;
        t = clamp01(t);
    }

    let lower = 0;
    let upper = 1;
    for (let i = 0; i < 8; i += 1) {
        const currentX = sampleCurveX(t);
        if (Math.abs(currentX - x) < epsilon) {
            break;
        }
        if (x > currentX) {
            lower = t;
        } else {
            upper = t;
        }
        t = (lower + upper) * 0.5;
    }

    return clamp01(sampleCurveY(t));
}

export function getPatternColorAsOklch(pattern: Pattern): OklchColor | null {
    const { colorSpace, colorValues } = pattern;
    const colorBySpace: Record<ColorSpace, unknown> = {
        oklab: { mode: "oklab", l: colorValues.l, a: colorValues.a, b: colorValues.b },
        lch: { mode: "lch", l: colorValues.l, c: colorValues.c, h: colorValues.h },
        oklch: { mode: "oklch", l: colorValues.l / 100, c: colorValues.c, h: colorValues.h },
        hsl: { mode: "hsl", h: colorValues.h, s: colorValues.s / 100, l: colorValues.l / 100 },
        hwb: { mode: "hwb", h: colorValues.h, w: colorValues.w / 100, b: colorValues.b / 100 },
        lab: { mode: "lab", l: colorValues.l, a: colorValues.a, b: colorValues.b },
        srgb: { mode: "rgb", r: colorValues.r / 255, g: colorValues.g / 255, b: colorValues.b / 255 },
        xyz: { mode: "xyz65", x: colorValues.x, y: colorValues.y, z: colorValues.z },
        "display-p3": { mode: "p3", r: colorValues.r, g: colorValues.g, b: colorValues.b },
        "a98-rgb": { mode: "a98", r: colorValues.r, g: colorValues.g, b: colorValues.b },
        "prophoto-rgb": { mode: "prophoto", r: colorValues.r, g: colorValues.g, b: colorValues.b },
        rec2020: { mode: "rec2020", r: colorValues.r, g: colorValues.g, b: colorValues.b },
    };

    const converted = toOklch(colorBySpace[colorSpace] as any) as OklchColor | undefined;
    if (!converted || converted.l === undefined || converted.c === undefined || converted.h === undefined) {
        return null;
    }

    return { mode: "oklch", l: converted.l, c: converted.c, h: converted.h };
}

export function getPatternLightnessAnchor(pattern: Pattern): number {
    const oklch = getPatternColorAsOklch(pattern);
    if (!oklch) {
        return 0.5;
    }

    return clamp01(oklch.l);
}

export function getCurveMultiplier(percentage: number, curve: [number, number, number, number]): number {
    const x = clamp01((11 - percentage / 10) * 0.1);
    return cubicBezierYAtX(x, curve);
}

export function computeScaleOklch(pattern: Pattern, percentage: number, darkMode = false): OklchColor | null {
    const baseOklch = getPatternColorAsOklch(pattern);
    if (!baseOklch) {
        return null;
    }

    const sourcePercentage = darkMode ? 110 - percentage : percentage;
    
    // Lightness Interpolation (prevents clipping)
    let lightness: number;
    if (sourcePercentage === 50) {
        lightness = baseOklch.l;
    } else if (sourcePercentage < 50) {
        const t = sourcePercentage / 50;
        lightness = baseOklch.l * t;
    } else {
        const t = (sourcePercentage - 50) / 50;
        lightness = baseOklch.l + (1 - baseOklch.l) * t;
    }
    lightness = clamp01(lightness);

    // Chroma Tapering (prevents neon colors near black/white poles)
    const curveMultiplier = getCurveMultiplier(percentage, pattern.modifierCurve);
    const chromaMultiplier = darkMode ? 0.85 : 1;
    const rawChroma = Math.max(0, pattern.baseModifier + curveMultiplier * baseOklch.c * chromaMultiplier);
    const taper = 4 * lightness * (1 - lightness);
    const chroma = rawChroma * taper;

    const hueOffset = pattern.hueShift * (1 - lightness);
    const hue = normalizeHue(baseOklch.h + hueOffset);

    return {
        mode: "oklch",
        l: lightness,
        c: chroma,
        h: hue,
    };
}

export function computeScaleAnalysis(pattern: Pattern, darkMode = false): ShadeAnalysis[] {
    const analysis: ShadeAnalysis[] = [];

    SHADE_STEPS.forEach((percentage) => {
        const oklch = computeScaleOklch(pattern, percentage, darkMode);
        if (!oklch) {
            analysis.push({
                percentage,
                outOfSrgb: false,
                outOfP3: false,
            });
            return;
        }

        analysis.push({
            percentage,
            outOfSrgb: !isSrgbGamut(oklch as any),
            outOfP3: !isP3Gamut(oklch as any),
        });
    });

    return analysis;
}

type GamutTarget = "srgb" | "p3";

function isInTargetGamut(pattern: Pattern, target: GamutTarget): boolean {
    const analysis = computeScaleAnalysis(pattern);
    return analysis.every((entry) => (target === "p3" ? !entry.outOfP3 : !entry.outOfSrgb));
}

export function autoFitPatternToGamut(pattern: Pattern, target: GamutTarget): Pattern {
    if (isInTargetGamut(pattern, target)) {
        return pattern;
    }

    const hasChroma = Object.prototype.hasOwnProperty.call(pattern.colorValues, "c");
    const hasSaturation = Object.prototype.hasOwnProperty.call(pattern.colorValues, "s");
    const step = 0.02;

    for (let factor = 0.98; factor >= 0; factor -= step) {
        const candidate: Pattern = {
            ...pattern,
            baseModifier: Math.max(0, pattern.baseModifier * factor),
            colorValues: {
                ...pattern.colorValues,
                ...(hasChroma ? { c: pattern.colorValues.c * factor } : {}),
                ...(hasSaturation ? { s: pattern.colorValues.s * factor } : {}),
            },
        };

        if (isInTargetGamut(candidate, target)) {
            return candidate;
        }
    }

    return {
        ...pattern,
        baseModifier: 0,
        hueShift: 0,
        colorValues: {
            ...pattern.colorValues,
            ...(hasChroma ? { c: pattern.colorValues.c * 0.2 } : {}),
            ...(hasSaturation ? { s: pattern.colorValues.s * 0.3 } : {}),
        },
    };
}

// Helper function to format color values based on color space
export function formatColor(colorSpace: ColorSpace, values: Record<string, number>): string {
    const components = colorSpaceComponents[colorSpace].components;

    // Format values based on color space
    switch (colorSpace) {
        case "oklab":
            return `oklab(${values[components[0]].toFixed(2)} ${values[components[1]].toFixed(3)} ${values[components[2]].toFixed(3)})`;
        case "lch":
            return `lch(${values[components[0]].toFixed(1)}% ${values[components[1]].toFixed(1)} ${values[components[2]].toFixed(0)})`;
        case "oklch":
            return `oklch(${values[components[0]].toFixed(1)}% ${values[components[1]].toFixed(3)} ${values[components[2]].toFixed(0)})`;
        case "hsl":
            return `hsl(${values[components[0]].toFixed(0)}deg ${values[components[1]].toFixed(1)}% ${values[components[2]].toFixed(1)}%)`;
        case "hwb":
            return `hwb(${values[components[0]].toFixed(0)}deg ${values[components[1]].toFixed(1)}% ${values[components[2]].toFixed(1)}%)`;
        case "lab":
            return `lab(${values[components[0]].toFixed(1)}% ${values[components[1]].toFixed(1)} ${values[components[2]].toFixed(1)})`;
        case "srgb":
            return `rgb(${Math.round(values[components[0]])}, ${Math.round(values[components[1]])}, ${Math.round(values[components[2]])})`;
        case "xyz":
            return `color(xyz ${values[components[0]].toFixed(3)} ${values[components[1]].toFixed(3)} ${values[components[2]].toFixed(3)})`;
        case "display-p3":
            return `color(display-p3 ${values[components[0]].toFixed(3)} ${values[components[1]].toFixed(3)} ${values[components[2]].toFixed(3)})`;
        case "a98-rgb":
            return `color(a98-rgb ${values[components[0]].toFixed(3)} ${values[components[1]].toFixed(3)} ${values[components[2]].toFixed(3)})`;
        case "prophoto-rgb":
            return `color(prophoto-rgb ${values[components[0]].toFixed(3)} ${values[components[1]].toFixed(3)} ${values[components[2]].toFixed(3)})`;
        case "rec2020":
            return `color(rec2020 ${values[components[0]].toFixed(3)} ${values[components[1]].toFixed(3)} ${values[components[2]].toFixed(3)})`;
        default:
            return "";
    }
}

// Helper function to get default color values for a color space
export function getDefaultColorValues(colorSpace: ColorSpace): Record<string, number> {
    const components = colorSpaceComponents[colorSpace].components;
    const ranges = colorSpaceComponents[colorSpace].ranges;

    const values: Record<string, number> = {};

    // Set default values for each component
    components.forEach((component) => {
        const range = ranges[component];

        if (component === "h") {
            values[component] = colorSpace === "oklch" ? 260 : 240; // Bias OKLCH to blue-violet for smoother default ramps
        } else if (["r", "g"].includes(component)) {
            values[component] = range.min; // Default red and green to minimum
        } else if (component === "b") {
            values[component] = range.max; // Default blue to maximum
        } else if (["l", "y"].includes(component)) {
            values[component] = range.max * 0.5; // Default lightness/Y to middle
        } else if (component === "c") {
            values[component] = range.max * 0.3; // Lower default chroma to keep initial ramps more often in sRGB gamut
        } else if (component === "s") {
            values[component] = range.max * 0.5; // Keep saturation defaults in the middle for HSL
        } else if (["w", "a", "x", "z"].includes(component)) {
            values[component] = range.min; // Default to minimum
        } else {
            values[component] = (range.min + range.max) / 2; // Default to middle of range
        }
    });

    return values;
}

// Helper function to handle backward compatibility for color space changes
export function handleColorSpaceChange(oldSpace: string, newSpace: ColorSpace): ColorSpace {
    // If the old space is srgb-linear, convert to a supported space
    if (oldSpace === "srgb-linear") {
        return "srgb";
    }

    // Check if the old space exists in our current options
    if (Object.keys(colorSpaceComponents).includes(oldSpace)) {
        return oldSpace as ColorSpace;
    }

    // Default fallback
    return newSpace;
}

// Function to get slider class name based on component and color space
export function getSliderClassName(component: string, colorSpace: ColorSpace): string {
    // Base class for all sliders
    let className = "range-input";

    // Add component-specific class
    className += ` slider-${component}`;

    // Add color space specific class
    className += ` ${colorSpace}-${component}-slider`;

    // Add special classes for specific components across color spaces
    if (component === "h") {
        className += " hue-slider";
    } else if (component === "r" && ["srgb", "display-p3", "a98-rgb", "prophoto-rgb", "rec2020"].includes(colorSpace)) {
        className += " red-slider";
    } else if (component === "g" && ["srgb", "display-p3", "a98-rgb", "prophoto-rgb", "rec2020"].includes(colorSpace)) {
        className += " green-slider";
    } else if (component === "b" && ["srgb", "display-p3", "a98-rgb", "prophoto-rgb", "rec2020"].includes(colorSpace)) {
        className += " blue-slider";
    } else if (component === "w" && colorSpace === "hwb") {
        className += " whiteness-slider";
    } else if (component === "b" && colorSpace === "hwb") {
        className += " blackness-slider";
    } else if (component === "a" && ["lab", "oklab"].includes(colorSpace)) {
        className += " green-red-slider";
    } else if (component === "b" && ["lab", "oklab"].includes(colorSpace)) {
        className += " blue-yellow-slider";
    }

    return className;
}

// Function to get CSS variables for RGB-based sliders
export function getRGBSliderVars(component: string, pattern: any): Record<string, string> {
    if (!["srgb", "display-p3", "a98-rgb", "prophoto-rgb", "rec2020"].includes(pattern.colorSpace)) {
        return {};
    }

    const colorSpace = pattern.colorSpace;
    const values = pattern.colorValues;
    const components = colorSpaceComponents[colorSpace].components;
    const otherComponents = components.filter((c) => c !== component);

    // Get current values of other components
    const value1 = values[otherComponents[0]];
    const value2 = values[otherComponents[1]];

    // Normalize values for non-sRGB color spaces
    const v1 = colorSpace === "srgb" ? Math.round(value1) : value1.toFixed(3);
    const v2 = colorSpace === "srgb" ? Math.round(value2) : value2.toFixed(3);

    if (component === "r") {
        return {
            "--slider-color1": `rgb(0, ${v1}, ${v2})`,
            "--slider-color2": `rgb(255, ${v1}, ${v2})`,
        };
    } else if (component === "g") {
        return {
            "--slider-color1": `rgb(${v1}, 0, ${v2})`,
            "--slider-color2": `rgb(${v1}, 255, ${v2})`,
        };
    } else if (component === "b") {
        return {
            "--slider-color1": `rgb(${v1}, ${v2}, 0)`,
            "--slider-color2": `rgb(${v1}, ${v2}, 255)`,
        };
    }

    return {};
}
