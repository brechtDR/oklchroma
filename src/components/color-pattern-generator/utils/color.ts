// utils/colorUtils.ts
import type { ColorSpace } from "../types.ts";
import { colorSpaceComponents } from "./constants.ts";

// Helper function to sanitize pattern name for valid CSS custom property
export function sanitizePatternName(name: string): string {
    // Allow only letters, numbers, hyphens and underscores
    // Replace any invalid character with a hyphen
    return name.replace(/[^a-zA-Z0-9_-]/g, "-");
}

// Helper function to format color values based on color space
export function formatColor(colorSpace: ColorSpace, values: Record<string, number>): string {
    const components = colorSpaceComponents[colorSpace].components;
    const ranges = colorSpaceComponents[colorSpace].ranges;

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

// Helper function to determine if a color is dark (for contrast)
export function isColorDark(colorSpace: ColorSpace, values: Record<string, number>): boolean {
    // For color spaces with lightness component
    if (["oklab", "lch", "oklch", "lab"].includes(colorSpace)) {
        const lightness = values["l"];
        const maxLightness = colorSpaceComponents[colorSpace].ranges["l"].max;
        return lightness < maxLightness * 0.6;
    }

    // For HSL
    if (colorSpace === "hsl") {
        return values["l"] < 60;
    }

    // For HWB
    if (colorSpace === "hwb") {
        return values["w"] < 60;
    }

    // For RGB-based color spaces
    if (["srgb", "display-p3", "a98-rgb", "prophoto-rgb", "rec2020"].includes(colorSpace)) {
        const r = values["r"];
        const g = values["g"];
        const b = values["b"];

        // Normalize values to 0-1 range if needed
        const rNorm = colorSpace === "srgb" ? r / 255 : r;
        const gNorm = colorSpace === "srgb" ? g / 255 : g;
        const bNorm = colorSpace === "srgb" ? b / 255 : b;

        // Calculate perceived brightness
        const brightness = 0.299 * rNorm + 0.587 * gNorm + 0.114 * bNorm;
        return brightness < 0.6;
    }

    // For XYZ
    if (colorSpace === "xyz") {
        return values["y"] < 0.6; // Y component represents luminance
    }

    return false;
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
            values[component] = 240; // Default hue to blue
        } else if (["r", "g"].includes(component)) {
            values[component] = range.min; // Default red and green to minimum
        } else if (component === "b") {
            values[component] = range.max; // Default blue to maximum
        } else if (["l", "y"].includes(component)) {
            values[component] = range.max * 0.5; // Default lightness/Y to middle
        } else if (["c", "s"].includes(component)) {
            values[component] = range.max * 0.5; // Default chroma/saturation to middle
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
