// components/ColorSwatches.tsx
import { useState } from "react";
import type { Pattern } from "../types.ts";

interface ColorSwatchesProps {
    pattern: Pattern;
    getPreviewVarName: (pattern: Pattern, percentage: number) => string;
    cssVariables?: Record<string, string>; // Make it optional
}

export default function ColorSwatches({ pattern, getPreviewVarName, cssVariables = {} }: ColorSwatchesProps) {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    // Function to copy color value to clipboard
    const copyToClipboard = (percentage: number) => {
        // Get the actual CSS variable name
        const varName = `--${pattern.name}-${percentage}`;

        // Get the value from cssVariables or use the variable name as fallback
        const colorValue = cssVariables[varName] || varName;

        navigator.clipboard
            .writeText(colorValue)
            .then(() => {
                // Set this index as copied for feedback
                setCopiedIndex(percentage);

                // Reset the copied status after 2 seconds
                setTimeout(() => {
                    setCopiedIndex(null);
                }, 2000);
            })
            .catch((err) => {
                console.error("Failed to copy color to clipboard:", err);
            });
    };

    return (
        <div className="preview-container">
            <h3 className="subtitle">Preview</h3>
            <p className="preview-help">Click on a color to copy its CSS value to clipboard</p>
            <div className="color-swatches" role="grid" aria-label="Color shades for pattern">
                {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((i) => {
                    const varName = `--${pattern.name}-${i}`;
                    const isCopied = copiedIndex === i;

                    return (
                        <button
                            key={i}
                            className={`color-swatch ${isCopied ? "copied" : ""}`}
                            title={`Click to copy ${varName}`}
                            aria-label={`Copy color ${varName} to clipboard, shade ${i}`}
                            onClick={() => copyToClipboard(i)}
                            style={{
                                backgroundColor: getPreviewVarName(pattern, i),
                            }}
                        >
                            {isCopied && (
                                <span className="copied-indicator" aria-hidden="true">
                                    ✓
                                </span>
                            )}
                            <span className="visually-hidden">{isCopied ? "Copied!" : `${i}% shade`}</span>
                        </button>
                    );
                })}
            </div>
            {copiedIndex !== null && (
                <div className="copy-message" role="status" aria-live="polite">
                    Copied{" "}
                    <code>
                        --{pattern.name}-{copiedIndex}
                    </code>{" "}
                    to clipboard!
                </div>
            )}
        </div>
    );
}
