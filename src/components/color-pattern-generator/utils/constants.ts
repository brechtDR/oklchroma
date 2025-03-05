import type { ColorComponents, ColorSpace } from "../types.ts";

// Group color spaces for select element
export const colorSpaceGroups = {
    Default: ["oklab"],
    Cylindrical: ["lch", "oklch", "hsl", "hwb"],
    Cartesian: ["lab", "srgb", "xyz", "display-p3", "a98-rgb", "prophoto-rgb", "rec2020"],
};

// Define color components for each color space
export const colorSpaceComponents: ColorComponents = {
    oklab: {
        components: ["l", "a", "b"],
        ranges: {
            l: { min: 0, max: 1, step: 0.01, label: "Lightness" },
            a: { min: -0.4, max: 0.4, step: 0.001, label: "Green-Red" },
            b: { min: -0.4, max: 0.4, step: 0.001, label: "Blue-Yellow" },
        },
    },
    lch: {
        components: ["l", "c", "h"],
        ranges: {
            l: { min: 0, max: 100, step: 0.1, unit: "%", label: "Lightness" },
            c: { min: 0, max: 150, step: 0.1, label: "Chroma" },
            h: { min: 0, max: 360, step: 1, unit: "°", label: "Hue" },
        },
    },
    oklch: {
        components: ["l", "c", "h"],
        ranges: {
            l: { min: 0, max: 100, step: 0.1, unit: "%", label: "Lightness" },
            c: { min: 0, max: 0.4, step: 0.001, label: "Chroma" },
            h: { min: 0, max: 360, step: 1, unit: "°", label: "Hue" },
        },
    },
    hsl: {
        components: ["h", "s", "l"],
        ranges: {
            h: { min: 0, max: 360, step: 1, unit: "°", label: "Hue" },
            s: { min: 0, max: 100, step: 0.1, unit: "%", label: "Saturation" },
            l: { min: 0, max: 100, step: 0.1, unit: "%", label: "Lightness" },
        },
    },
    hwb: {
        components: ["h", "w", "b"],
        ranges: {
            h: { min: 0, max: 360, step: 1, unit: "°", label: "Hue" },
            w: { min: 0, max: 100, step: 0.1, unit: "%", label: "Whiteness" },
            b: { min: 0, max: 100, step: 0.1, unit: "%", label: "Blackness" },
        },
    },
    lab: {
        components: ["l", "a", "b"],
        ranges: {
            l: { min: 0, max: 100, step: 0.1, label: "Lightness" },
            a: { min: -128, max: 127, step: 0.1, label: "Green-Red" },
            b: { min: -128, max: 127, step: 0.1, label: "Blue-Yellow" },
        },
    },
    srgb: {
        components: ["r", "g", "b"],
        ranges: {
            r: { min: 0, max: 255, step: 1, label: "Red" },
            g: { min: 0, max: 255, step: 1, label: "Green" },
            b: { min: 0, max: 255, step: 1, label: "Blue" },
        },
    },
    xyz: {
        components: ["x", "y", "z"],
        ranges: {
            x: { min: 0, max: 1, step: 0.001, label: "X" },
            y: { min: 0, max: 1, step: 0.001, label: "Y" },
            z: { min: 0, max: 1, step: 0.001, label: "Z" },
        },
    },
    "display-p3": {
        components: ["r", "g", "b"],
        ranges: {
            r: { min: 0, max: 1, step: 0.001, label: "Red" },
            g: { min: 0, max: 1, step: 0.001, label: "Green" },
            b: { min: 0, max: 1, step: 0.001, label: "Blue" },
        },
    },
    "a98-rgb": {
        components: ["r", "g", "b"],
        ranges: {
            r: { min: 0, max: 1, step: 0.001, label: "Red" },
            g: { min: 0, max: 1, step: 0.001, label: "Green" },
            b: { min: 0, max: 1, step: 0.001, label: "Blue" },
        },
    },
    "prophoto-rgb": {
        components: ["r", "g", "b"],
        ranges: {
            r: { min: 0, max: 1, step: 0.001, label: "Red" },
            g: { min: 0, max: 1, step: 0.001, label: "Green" },
            b: { min: 0, max: 1, step: 0.001, label: "Blue" },
        },
    },
    rec2020: {
        components: ["r", "g", "b"],
        ranges: {
            r: { min: 0, max: 1, step: 0.001, label: "Red" },
            g: { min: 0, max: 1, step: 0.001, label: "Green" },
            b: { min: 0, max: 1, step: 0.001, label: "Blue" },
        },
    },
};

// Map color spaces to short codes for URL
export const colorSpaceToCode: Record<ColorSpace, string> = {
    oklab: "ol",
    lch: "lc",
    oklch: "ok",
    hsl: "hs",
    hwb: "hw",
    lab: "lb",
    srgb: "sr",
    xyz: "xy",
    "display-p3": "p3",
    "a98-rgb": "a9",
    "prophoto-rgb": "pp",
    rec2020: "r2",
};

// Map short codes back to color spaces
export const codeToColorSpace: Record<string, ColorSpace> = Object.entries(colorSpaceToCode).reduce(
    (acc, [space, code]) => ({ ...acc, [code]: space as ColorSpace }),
    {} as Record<string, ColorSpace>,
);

// Define component colors for sliders
export const componentColors: { [key: string]: string } = {
    r: "#ff5555",
    g: "#55ff55",
    b: "#5555ff",
    h: "", // We'll use the CSS class for hue
    l: "#aaaaaa",
    c: "#ff9900",
    s: "#ff9900",
    w: "#ffffff",
    a: "#ff5555", // Red component
    x: "#ff8800",
    y: "#88ff00",
    z: "#0088ff",
};
