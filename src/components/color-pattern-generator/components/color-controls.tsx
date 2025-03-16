// components/ColorControls.tsx
import { getSliderClassName, getRGBSliderVars } from "@components/color-pattern-generator/utils/color";
import { useState } from "react";
import type { Pattern } from "../types.ts";
import { colorSpaceComponents } from "../utils/constants.ts";
import { componentColors } from "../utils/constants.ts";

interface ColorControlsProps {
    pattern: Pattern;
    onColorValueChange: (id: number, component: string, value: number) => void;
    displayColor: string;
}

export default function ColorControls({ pattern, onColorValueChange, displayColor }: ColorControlsProps) {
    const [copied, setCopied] = useState(false);

    // Function to copy the primary color value to clipboard
    const copyPrimaryColor = () => {
        // Get the variable name
        const varName = `--${pattern.name}`;

        // Copy the display color or variable name
        navigator.clipboard
            .writeText(displayColor)
            .then(() => {
                setCopied(true);

                // Reset the copied status after 2 seconds
                setTimeout(() => {
                    setCopied(false);
                }, 2000);
            })
            .catch((err) => {
                console.error("Failed to copy color to clipboard:", err);
            });
    };

    return (
        <div className="color-space-controls">
            <div className="color-preview-box">
                <button
                    className={`color-preview ${copied ? "copied" : ""}`}
                    onClick={copyPrimaryColor}
                    title={`Click to copy ${displayColor}`}
                    aria-label={`Copy primary color value ${displayColor} to clipboard`}
                    style={{ backgroundColor: displayColor }}
                >
                    {copied && (
                        <span className="copied-indicator" aria-hidden="true">
                            ✓
                        </span>
                    )}
                </button>
                <div className="color-value-container">
                    <div className="color-value">
                        <code>{displayColor}</code>
                    </div>
                    {copied && (
                        <div className="copy-message" role="status" aria-live="polite">
                            Copied!
                        </div>
                    )}
                </div>
                <button
                    className="copy-button small-copy-button"
                    onClick={copyPrimaryColor}
                    aria-label="Copy color value to clipboard"
                >
                    Copy
                </button>
            </div>

            <div className="color-parameters">
                {colorSpaceComponents[pattern.colorSpace].components.map((component) => {
                    const range = colorSpaceComponents[pattern.colorSpace].ranges[component];
                    const value = pattern.colorValues[component];
                    const sliderClassName = getSliderClassName(component, pattern.colorSpace);
                    const sliderVars = getRGBSliderVars(component, pattern);

                    // Determine label color
                    const labelColor = componentColors[component] || "inherit";
                    const labelStyle = {
                        color: labelColor && !labelColor.includes("gradient") ? labelColor : "inherit",
                    };

                    return (
                        <div key={component} className="color-parameter">
                            <label className="slider-label" style={labelStyle}>
                                {range.label || component.toUpperCase()}: {value.toFixed(range.step < 0.1 ? 3 : 1)}
                                {range.unit || ""}
                            </label>
                            <input
                                type="range"
                                min={range.min}
                                max={range.max}
                                step={range.step}
                                value={value}
                                onChange={(e) => onColorValueChange(pattern.id, component, parseFloat(e.target.value))}
                                className={sliderClassName}
                                style={sliderVars}
                                data-component={component}
                                data-color-space={pattern.colorSpace}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
