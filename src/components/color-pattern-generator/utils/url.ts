import type { Pattern, ColorSpace } from "../types.ts";
import { DEFAULT_MODIFIER_CURVE, getDefaultColorValues, handleColorSpaceChange } from "./color.ts";
import { colorSpaceToCode, codeToColorSpace, colorSpaceComponents } from "./constants.ts";

// Helper function to encode patterns to a compact URL format
export function encodePatterns(patterns: Pattern[]): string {
    const parts: string[] = [];

    patterns.forEach((pattern) => {
        // Encode pattern name
        const name = encodeURIComponent(pattern.name);

        // Encode color space (use short code)
        const spaceCode = colorSpaceToCode[pattern.colorSpace] || "ok";

        // Encode color values (rounded to 3 decimal places max)
        const components = colorSpaceComponents[pattern.colorSpace].components;
        const values = components
            .map((c) =>
                // Round to fewer decimal places for smaller URLs
                pattern.colorValues[c].toFixed(3).replace(/\.?0+$/, ""),
            )
            .join(",");

        // Encode base modifier (rounded to 2 decimal places)
        const base = pattern.baseModifier.toFixed(2).replace(/\.?0+$/, "");

        const curve = pattern.modifierCurve.map((point) => point.toFixed(3).replace(/\.?0+$/, "")).join(",");
        const hueShift = pattern.hueShift.toFixed(1).replace(/\.?0+$/, "");

        // Combine all parts with a separator
        parts.push(`${name}:${spaceCode}:${values}:${base}:${curve}:${hueShift}`);
    });

    return parts.join("|");
}

// Helper function to decode patterns from a compact URL format
export function decodePatterns(encoded: string): Pattern[] {
    if (!encoded) return [];

    const patterns: Pattern[] = [];
    const parts = encoded.split("|");

    parts.forEach((part, index) => {
        try {
            const [name, spaceCode, valuesStr, baseStr, curveStr, hueShiftStr] = part.split(":");

            // Get color space from code
            const colorSpace = codeToColorSpace[spaceCode] || "oklch";

            // Parse color values
            const components = colorSpaceComponents[colorSpace].components;
            const valuesParts = valuesStr.split(",");
            const colorValues: Record<string, number> = {};

            // Map values to components
            components.forEach((component, i) => {
                if (i < valuesParts.length) {
                    colorValues[component] = parseFloat(valuesParts[i]);
                } else {
                    // If missing, use default
                    const range = colorSpaceComponents[colorSpace].ranges[component];
                    colorValues[component] = (range.min + range.max) / 2;
                }
            });

            // Parse base modifier
            const baseModifier = parseFloat(baseStr) || 0.05;
            const modifierCurve = curveStr
                ? (curveStr.split(",").map((value) => parseFloat(value)) as [number, number, number, number])
                : DEFAULT_MODIFIER_CURVE;
            const hueShift = hueShiftStr ? parseFloat(hueShiftStr) : 0;

            // Add pattern
            patterns.push({
                id: index + 1,
                name: decodeURIComponent(name),
                colorSpace,
                colorValues,
                baseModifier,
                modifierCurve:
                    modifierCurve.length === 4 && modifierCurve.every((value) => !Number.isNaN(value))
                        ? modifierCurve
                        : DEFAULT_MODIFIER_CURVE,
                hueShift: Number.isNaN(hueShift) ? 0 : hueShift,
            });
        } catch (e) {
            console.error("Failed to parse pattern:", part, e);
        }
    });

    // If no valid patterns, return a default
    if (patterns.length === 0) {
        patterns.push({
            id: 1,
            name: "primary",
            colorSpace: "oklch",
            colorValues: getDefaultColorValues("oklch"),
            baseModifier: 0.05,
            modifierCurve: DEFAULT_MODIFIER_CURVE,
            hueShift: 0,
        });
    }

    return patterns;
}

// Load patterns from URL or hash
export function loadPatternsFromURL(): Pattern[] {
    if (typeof window === "undefined") return getDefaultPatterns();

    // Check for URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const patternParam = urlParams.get("p");

    if (patternParam) {
        // Use new compact format
        try {
            return decodePatterns(patternParam);
        } catch (e) {
            console.error("Failed to load patterns from URL", e);
        }
    } else if (window.location.hash) {
        // Backward compatibility with old hash format
        try {
            const decoded = atob(window.location.hash.substring(1));
            const loadedPatterns = JSON.parse(decoded) as Pattern[];

            // Ensure backward compatibility with old format
            return loadedPatterns.map((p) => {
                // Handle older versions of the data
                if (!p.colorSpace) {
                    return {
                        ...p,
                        colorSpace: "oklch" as ColorSpace,
                        colorValues: getDefaultColorValues("oklch"),
                        baseModifier: p.baseModifier ?? 0.05,
                        modifierCurve: p.modifierCurve ?? DEFAULT_MODIFIER_CURVE,
                        hueShift: p.hueShift ?? 0,
                    };
                }

                // Handle case where the color space is no longer supported
                const safeColorSpace = handleColorSpaceChange(p.colorSpace, "oklch");

                // Handle case where colorValues might not match the current color space
                const components = colorSpaceComponents[safeColorSpace].components;
                let updatedValues = { ...p.colorValues };

                // Check if all necessary components exist
                let needsDefaultValues = false;
                for (const component of components) {
                    if (updatedValues[component] === undefined) {
                        needsDefaultValues = true;
                        break;
                    }
                }

                // If missing components, use default values
                if (needsDefaultValues) {
                    updatedValues = getDefaultColorValues(safeColorSpace);
                }

                return {
                    ...p,
                    colorSpace: safeColorSpace,
                    colorValues: updatedValues,
                    baseModifier: p.baseModifier ?? 0.05,
                    modifierCurve: p.modifierCurve ?? DEFAULT_MODIFIER_CURVE,
                    hueShift: p.hueShift ?? 0,
                };
            });
        } catch (e) {
            console.error("Failed to load patterns from URL hash", e);
        }
    }

    return getDefaultPatterns();
}

// Get default patterns
function getDefaultPatterns(): Pattern[] {
    return [
        {
            id: 1,
            name: "primary",
            colorSpace: "oklch",
            colorValues: getDefaultColorValues("oklch"),
            baseModifier: 0.05,
            modifierCurve: DEFAULT_MODIFIER_CURVE,
            hueShift: 0,
        },
    ];
}
