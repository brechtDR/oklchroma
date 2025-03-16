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
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke-width="1.5"
                                stroke="currentColor"
                                className="icon"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75"
                                />
                            </svg>
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
