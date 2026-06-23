import ColorRamp from "@components/color-pattern-generator/components/color-ramp.tsx";
import CSSOutput from "@components/color-pattern-generator/components/css-output.tsx";
import PatternEditor from "@components/color-pattern-generator/components/pattern-editor.tsx";
import PatternTab from "@components/color-pattern-generator/components/pattern-tab.tsx";
import ShareLink from "@components/color-pattern-generator/components/share-link.tsx";
import {
    DEFAULT_MODIFIER_CURVE,
    getDefaultColorValues,
    formatColor,
    getCurveMultiplier,
    getPatternLightnessAnchor,
    getPatternColorAsOklch,
    autoFitPatternToGamut,
    SHADE_STEPS,
    sanitizePatternName,
} from "@components/color-pattern-generator/utils/color";
import { encodePatterns, loadPatternsFromURL } from "@components/color-pattern-generator/utils/url";
import { useState, useEffect, useRef } from "react";
import type { Pattern, ColorSpace } from "./types";

export default function ColorPatternGenerator(): React.ReactElement {
    const [patterns, setPatterns] = useState<Pattern[]>([
        {
            id: 1,
            name: "primary",
            colorSpace: "oklch",
            colorValues: getDefaultColorValues("oklch"),
            baseModifier: 0.015,
            modifierCurve: DEFAULT_MODIFIER_CURVE,
            hueShift: 20,
        },
    ]);
    const [activeTab, setActiveTab] = useState<number>(1);
    const [outputCSS, setOutputCSS] = useState<string>("");
    const [currentUrl, setCurrentUrl] = useState<string>("");
    const [nameError, setNameError] = useState<string>("");
    const [cssVariables, setCssVariables] = useState<Record<string, string>>({});

    // Ref for debouncing URL updates
    const urlUpdateTimeoutRef = useRef<number | null>(null);

    // Safe initialization
    useEffect(() => {
        // Load patterns from URL
        const loadedPatterns = loadPatternsFromURL();
        const normalizedPatterns =
            loadedPatterns.length > 0
                ? loadedPatterns.map((pattern) => ({
                      ...pattern,
                      modifierCurve: pattern.modifierCurve ?? DEFAULT_MODIFIER_CURVE,
                      hueShift: pattern.hueShift ?? 0,
                  }))
                : null;

        if (normalizedPatterns) {
            setPatterns(normalizedPatterns);
        }

        if (window.location.search.includes("p=")) {
            setCurrentUrl(window.location.href);
        }

        // Generate initial CSS
        generateCSS();
    }, []);

    useEffect(() => {
        if (typeof window !== "undefined") {
            generateCSS();
            // Don't update URL here - as that became buggy, which is why a little timeout set below to create a debounce
        }
    }, [patterns]);

    // Debounced URL update function
    const debouncedUpdateURL = (): void => {
        if (urlUpdateTimeoutRef.current) {
            clearTimeout(urlUpdateTimeoutRef.current);
        }

        urlUpdateTimeoutRef.current = setTimeout(() => {
            updateURLParam(patterns);
        }, 1000); // 1 second debounce
    };

    // Update URL using query parameter instead of hash
    const updateURLParam = (patternsToEncode: Pattern[] = patterns): string => {
        if (typeof window === "undefined") return "";

        // Encode patterns to compact format
        const encodedPatterns = encodePatterns(patternsToEncode);

        // Create URL with query parameter
        const url = new URL(window.location.href);
        url.searchParams.set("p", encodedPatterns);

        const nextUrl = url.toString();

        // Update URL without refreshing page
        window.history.replaceState({}, "", nextUrl);

        // Update display URL
        setCurrentUrl(nextUrl);

        return nextUrl;
    };

    const addPattern = (): void => {
        if (patterns.length >= 10) return; // Increased limit to 10

        const newId = Math.max(...patterns.map((p) => p.id), 0) + 1;
        const newPatterns = [
            ...patterns,
            {
                id: newId,
                name: `color${patterns.length + 1}`,
                colorSpace: "oklch" as ColorSpace, // Add explicit type cast here
                colorValues: getDefaultColorValues("oklch"),
                baseModifier: 0.015,
                modifierCurve: DEFAULT_MODIFIER_CURVE,
                hueShift: 20,
            },
        ];

        setPatterns(newPatterns);
        setActiveTab(newId);
        updateURLParam(newPatterns);
    };

    const removePattern = (id: number): void => {
        if (patterns.length <= 1) return;

        const newPatterns = patterns.filter((p) => p.id !== id);
        setPatterns(newPatterns);

        // Set active tab to first pattern if the active one was removed
        if (activeTab === id) {
            setActiveTab(newPatterns[0]?.id || 0);
        }

        updateURLParam(newPatterns);
    };

    const updatePattern = (id: number, field: keyof Pattern, value: any): void => {
        if (field === "name") {
            // Sanitize the name for CSS variable compatibility
            const sanitizedName = sanitizePatternName(value);

            // Check if name is empty after sanitization
            if (!sanitizedName) {
                setNameError("Name cannot be empty or contain only special characters");
                return;
            }

            // Check for duplicate names
            const isDuplicate = patterns.some((p) => p.id !== id && p.name === sanitizedName);
            if (isDuplicate) {
                setNameError("This name is already in use");
                return;
            }

            setNameError("");
            value = sanitizedName;
        }

        if (field === "colorSpace") {
            // When changing color space, update color values to defaults for the new space
            const newColorSpace = value as ColorSpace;
            const newColorValues = getDefaultColorValues(newColorSpace);

            setPatterns(
                patterns.map((p) =>
                    p.id === id
                        ? {
                              ...p,
                              colorSpace: newColorSpace,
                              colorValues: newColorValues,
                          }
                        : p,
                ),
            );

            debouncedUpdateURL();
            return;
        }

        setPatterns(patterns.map((p) => (p.id === id ? { ...p, [field]: value } : p)));

        debouncedUpdateURL();
    };

    const updateColorValue = (id: number, component: string, value: number): void => {
        setPatterns(
            patterns.map((p) => {
                if (p.id === id) {
                    return {
                        ...p,
                        colorValues: {
                            ...p.colorValues,
                            [component]: value,
                        },
                    };
                }
                return p;
            }),
        );

        // Debounce URL update for slider interactions
        debouncedUpdateURL();
    };

    const generateCSS = (): void => {
        let css = `:root {\n`;
        const cssVars: Record<string, string> = {};

        patterns.forEach((pattern) => {
            const { name, colorSpace, colorValues, baseModifier, hueShift } = pattern;
            const color = formatColor(colorSpace, colorValues);
            const lightnessAnchor = getPatternLightnessAnchor(pattern);
            const lightnessAnchorPercent = (lightnessAnchor * 100).toFixed(2);

            // Compute fallback oklch string to ensure hue is never `none`
            const baseOklchColor = getPatternColorAsOklch(pattern);
            const baseOklchStr = baseOklchColor 
                ? `oklch(${(baseOklchColor.l * 100).toFixed(1)}% ${baseOklchColor.c.toFixed(3)} ${baseOklchColor.h.toFixed(0)})`
                : color;

            css += `  --${name}: ${color};\n`;
            css += `  --${name}-oklch: ${baseOklchStr};\n`;
            css += `  --${name}-base: ${baseModifier};\n`;
            css += `  --${name}-hue-shift: ${hueShift};\n`;
            css += `  --${name}-lightness-anchor: ${lightnessAnchorPercent}%;\n`;

            cssVars[`--${name}`] = color;
            cssVars[`--${name}-oklch`] = baseOklchStr;
            cssVars[`--${name}-base`] = baseModifier.toString();
            cssVars[`--${name}-hue-shift`] = hueShift.toString();
            cssVars[`--${name}-lightness-anchor`] = `${lightnessAnchorPercent}%`;

            SHADE_STEPS.forEach((i) => {
                const curveMultiplier = getCurveMultiplier(i, pattern.modifierCurve).toFixed(3);
                const hueOffset = (hueShift * (1 - i / 100)).toFixed(2);
                
                let lightnessValue: string;
                if (i === 50) {
                    lightnessValue = `var(--${name}-lightness-anchor)`;
                } else if (i < 50) {
                    const t = (i / 50).toFixed(2);
                    lightnessValue = `calc(var(--${name}-lightness-anchor) * ${t})`;
                } else {
                    const t = ((i - 50) / 50).toFixed(2);
                    lightnessValue = `calc(var(--${name}-lightness-anchor) + (100% - var(--${name}-lightness-anchor)) * ${t})`;
                }

                // Taper chroma dynamically in CSS based on actual lightness
                const taperFormula = `calc(4 * (${lightnessValue} / 100%) * (1 - (${lightnessValue} / 100%)))`;
                const chromaFormula = `calc((var(--${name}-base) + (${curveMultiplier} * c)) * ${taperFormula})`;

                const variableName = `--${name}-${i}`;
                const variableValue = `oklch(from var(--${name}-oklch) ${lightnessValue} ${chromaFormula} calc(h + ${hueOffset}))`;

                css += `  ${variableName}: ${variableValue};\n`;
                cssVars[variableName] = variableValue;
            });

            css += "\n";
        });

        css += "}\n";
        setOutputCSS(css);
        setCssVariables(cssVars);
    };

    const copyUrl = (): string => {
        // Make sure URL is updated before copying
        return updateURLParam();
    };

    const fitPatternToGamut = (id: number, target: "srgb" | "p3"): void => {
        setPatterns((prevPatterns) =>
            prevPatterns.map((p) => {
                if (p.id === id) {
                    return autoFitPatternToGamut(p, target);
                }
                return p;
            })
        );
        debouncedUpdateURL();
    };

    const addHarmonyPattern = (id: number, harmony: "complementary" | "analogous" | "split" | "triadic"): void => {
        if (patterns.length >= 10) {
            return;
        }

        const sourcePattern = patterns.find((pattern) => pattern.id === id);
        if (!sourcePattern) {
            return;
        }

        const hue = sourcePattern.colorValues.h;
        if (hue === undefined) {
            return;
        }

        const harmonyShift = {
            complementary: 180,
            analogous: 30,
            split: 150,
            triadic: 120,
        }[harmony];

        const newHue = ((hue + harmonyShift) % 360 + 360) % 360;
        const newPatternId = Math.max(...patterns.map((pattern) => pattern.id), 0) + 1;
        const safeName = sanitizePatternName(`${sourcePattern.name}-${harmony}`);
        const uniqueName = patterns.some((pattern) => pattern.name === safeName) ? `${safeName}-${newPatternId}` : safeName;

        const nextPattern: Pattern = {
            ...sourcePattern,
            id: newPatternId,
            name: uniqueName,
            colorValues: {
                ...sourcePattern.colorValues,
                h: newHue,
            },
        };

        const nextPatterns = [...patterns, nextPattern];

        setPatterns(nextPatterns);
        setActiveTab(newPatternId);
        updateURLParam(nextPatterns);
    };

    // Function to get color for display based on the pattern's color space
    const getDisplayColor = (pattern: Pattern): string => {
        return formatColor(pattern.colorSpace, pattern.colorValues);
    };

    // Function to get a preview color for a specific shade
    // This now returns the actual CSS variable name for use in the style attribute
    const getPreviewVarName = (pattern: Pattern, percentage: number): string => {
        return `var(--${pattern.name}-${percentage})`;
    };

    const activePattern = patterns.find((pattern) => pattern.id === activeTab) ?? patterns[0];

    return (
        <div className="container app-content" style={cssVariables as React.CSSProperties}>

            {/* Pattern Tabs */}
            <div className="tabs">
                {patterns.map((pattern) => (
                    <PatternTab
                        key={pattern.id}
                        pattern={pattern}
                        isActive={activeTab === pattern.id}
                        onClick={() => setActiveTab(pattern.id)}
                        canRemove={patterns.length > 1}
                        onRemove={() => removePattern(pattern.id)}
                        displayColor={getDisplayColor(pattern)}
                    />
                ))}

                {patterns.length < 10 && (
                    <button className="add-tab-button" onClick={addPattern}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="icon"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                            />
                        </svg>
                        <span className="visually-hidden-mobile">Add Pattern</span>
                    </button>
                )}
            </div>

            {activePattern && (
                <ColorRamp
                    pattern={activePattern}
                    displayColor={getDisplayColor(activePattern)}
                    getPreviewVarName={getPreviewVarName}
                    cssVariables={cssVariables}
                />
            )}

            <div className="generator-layout">
                <div className="generator-controls">
                    {/* Active Pattern Editor */}
                    {patterns.map((pattern) => (
                        <PatternEditor
                            key={pattern.id}
                            pattern={pattern}
                            isVisible={activeTab === pattern.id}
                            onUpdatePattern={updatePattern}
                            onUpdateColorValue={updateColorValue}
                            onRemovePattern={removePattern}
                            displayColor={getDisplayColor(pattern)}
                            nameError={nameError}
                            patterns={patterns}
                            onAddHarmonyPattern={addHarmonyPattern}
                            onFitGamut={fitPatternToGamut}
                        />
                    ))}
                </div>

                <aside className="css-output-panel" id="share-link">
                    <CSSOutput css={outputCSS} />
                    <ShareLink url={currentUrl} onCopy={copyUrl} />
                </aside>
            </div>
        </div>
    );
}
