// Define types for color spaces
export type ColorSpace =
    // Default
    | "oklab"
    // Cylindrical
    | "lch"
    | "oklch"
    | "hsl"
    | "hwb"
    // Cartesian
    | "lab"
    | "srgb"
    | "xyz"
    | "display-p3"
    | "a98-rgb"
    | "prophoto-rgb"
    | "rec2020";

// Define color components for each color space
export interface ColorComponentRange {
    min: number;
    max: number;
    step: number;
    unit?: string;
    label?: string;
}

export interface ColorSpaceDefinition {
    components: string[];
    ranges: { [key: string]: ColorComponentRange };
}

export interface ColorComponents {
    [key: string]: ColorSpaceDefinition;
}

// Define pattern interface
export interface Pattern {
    id: number;
    name: string;
    colorSpace: ColorSpace;
    colorValues: Record<string, number>;
    baseModifier: number;
}
