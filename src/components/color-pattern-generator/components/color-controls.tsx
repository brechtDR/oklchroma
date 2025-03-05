// components/ColorControls.tsx
// components/ColorControls.tsx
import { getSliderClassName, getRGBSliderVars } from "@components/color-pattern-generator/utils/color";
import type { Pattern } from "../types.ts";
import { colorSpaceComponents } from "../utils/constants.ts";
import { componentColors } from "../utils/constants.ts";

interface ColorControlsProps {
    pattern: Pattern;
    onColorValueChange: (id: number, component: string, value: number) => void;
    displayColor: string;
}

export default function ColorControls({ pattern, onColorValueChange, displayColor }: ColorControlsProps) {
    return (
        <div className="color-space-controls">
            <div className="color-preview-box">
                <div className="color-preview" style={{ backgroundColor: displayColor }} />
                <div className="color-value">
                    <code>{displayColor}</code>
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
