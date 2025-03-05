// ColorPatternGenerator.tsx
import CSSOutput from "@components/color-pattern-generator/components/css-output.tsx";
import PatternEditor from "@components/color-pattern-generator/components/pattern-editor.tsx";
import PatternTab from "@components/color-pattern-generator/components/pattern-tab.tsx";
import ShareLink from "@components/color-pattern-generator/components/share-link.tsx";
import {
    getDefaultColorValues,
    formatColor,
    sanitizePatternName,
} from "@components/color-pattern-generator/utils/color";
import { encodePatterns, loadPatternsFromURL } from "@components/color-pattern-generator/utils/url";
import { useState, useEffect, useRef } from "react";
import "../../styles/ColorPatternGenerator.css";
import type { Pattern, ColorSpace } from "./types";

export default function ColorPatternGenerator(): React.ReactElement {
    const [patterns, setPatterns] = useState<Pattern[]>([
        {
            id: 1,
            name: "primary",
            colorSpace: "oklch",
            colorValues: getDefaultColorValues("oklch"),
            baseModifier: 0.05,
        },
    ]);
    const [activeTab, setActiveTab] = useState<number>(1);
    const [outputCSS, setOutputCSS] = useState<string>("");
    const [currentUrl, setCurrentUrl] = useState<string>("");
    const [nameError, setNameError] = useState<string>("");
    const [cssVariables, setCssVariables] = useState<Record<string, string>>({});

    // Ref for debouncing URL updates
    const urlUpdateTimeoutRef = useRef<number | null>(null);

    // Safe initialization that works with SSR
    useEffect(() => {
        // Load patterns from URL
        const loadedPatterns = loadPatternsFromURL();
        if (loadedPatterns.length > 0) {
            setPatterns(loadedPatterns);
        }

        // Generate initial CSS
        generateCSS();
    }, []);

    useEffect(() => {
        if (typeof window !== "undefined") {
            generateCSS();
            // Don't update URL here - we'll do it with debounce
        }
    }, [patterns]);

    // Debounced URL update function
    const debouncedUpdateURL = (): void => {
        if (urlUpdateTimeoutRef.current) {
            clearTimeout(urlUpdateTimeoutRef.current);
        }

        urlUpdateTimeoutRef.current = setTimeout(() => {
            updateURLParam();
        }, 1000); // 1 second debounce
    };

    // Update URL using query parameter instead of hash
    const updateURLParam = (): void => {
        if (typeof window === "undefined") return;

        // Encode patterns to compact format
        const encodedPatterns = encodePatterns(patterns);

        // Create URL with query parameter
        const url = new URL(window.location.href);
        url.searchParams.set("p", encodedPatterns);

        // Update URL without refreshing page
        window.history.replaceState({}, "", url.toString());

        // Update display URL
        setCurrentUrl(url.toString());
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
                baseModifier: 0.05,
            },
        ];

        setPatterns(newPatterns);
        setActiveTab(newId);
        debouncedUpdateURL();
    };

    const removePattern = (id: number): void => {
        if (patterns.length <= 1) return;

        const newPatterns = patterns.filter((p) => p.id !== id);
        setPatterns(newPatterns);

        // Set active tab to first pattern if the active one was removed
        if (activeTab === id) {
            setActiveTab(newPatterns[0]?.id || 0);
        }

        debouncedUpdateURL();
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
            const { name, colorSpace, colorValues, baseModifier } = pattern;
            const color = formatColor(colorSpace, colorValues);

            css += `  --${name}: ${color};\n`;
            css += `  --${name}-base: ${baseModifier};\n`;

            // Store the base variables
            cssVars[`--${name}`] = color;
            cssVars[`--${name}-base`] = baseModifier.toString();

            for (let i = 10; i <= 100; i += 10) {
                // Calculate the sin multiplier with fixed precision to avoid floating point issues
                const multiplier = ((11 - i / 10) * 0.1).toFixed(1);

                // Define the variable for this shade
                const variableName = `--${name}-${i}`;
                const variableValue = `oklch(from var(--${name}) ${i}% calc(var(--${name}-base) + (sin(${multiplier} * pi) * c)) h)`;

                css += `  ${variableName}: ${variableValue};\n`;

                // Store the variable for use in the swatches
                cssVars[variableName] = variableValue;
            }

            css += "\n";
        });

        css += `}`;
        setOutputCSS(css);
        setCssVariables(cssVars);
    };

    const copyToClipboard = (): void => {
        if (typeof navigator !== "undefined") {
            navigator.clipboard
                .writeText(outputCSS)
                .then(() => {
                    alert("CSS copied to clipboard!");
                })
                .catch((err) => {
                    console.error("Failed to copy CSS", err);
                });
        }
    };

    const copyUrl = (): void => {
        // Make sure URL is updated before copying
        updateURLParam();

        if (typeof navigator !== "undefined") {
            navigator.clipboard
                .writeText(currentUrl)
                .then(() => {
                    alert("URL copied to clipboard!");
                })
                .catch((err) => {
                    console.error("Failed to copy URL", err);
                });
        }
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

    // Create a style block with our CSS variables for the preview
    const styleBlock = Object.entries(cssVariables)
        .map(([name, value]) => `${name}: ${value};`)
        .join("\n");

    return (
        <div className="container">
            {/* Add a style element with our CSS variables */}
            <style dangerouslySetInnerHTML={{ __html: `:root {\n${styleBlock}\n}` }} />

            <h1 className="title">Color Pattern Generator</h1>

            {/* Pattern Tabs */}
            <div className="tabs">
                {patterns.map((pattern) => (
                    <PatternTab
                        key={pattern.id}
                        pattern={pattern}
                        isActive={activeTab === pattern.id}
                        onClick={() => setActiveTab(pattern.id)}
                        displayColor={getDisplayColor(pattern)}
                    />
                ))}

                {patterns.length < 10 && (
                    <button className="add-tab-button" onClick={addPattern}>
                        + Add Pattern
                    </button>
                )}
            </div>

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
                    getPreviewVarName={getPreviewVarName}
                    nameError={nameError}
                    patterns={patterns}
                />
            ))}

            {/* CSS Output */}
            <CSSOutput css={outputCSS} onCopy={copyToClipboard} />

            {/* Share Link */}
            <ShareLink url={currentUrl} onCopy={copyUrl} />
        </div>
    );
}
