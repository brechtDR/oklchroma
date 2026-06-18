import { getSliderClassName, getRGBSliderVars } from "@components/color-pattern-generator/utils/color";
import type { Pattern } from "../types.ts";
import { colorSpaceComponents } from "../utils/constants.ts";

interface ColorControlsProps {
    pattern: Pattern;
    onColorValueChange: (id: number, component: string, value: number) => void;
}

export default function ColorControls({ pattern, onColorValueChange }: ColorControlsProps) {
    return (
        <div className="color-space-controls">
            <div className="color-parameters">
                {colorSpaceComponents[pattern.colorSpace].components.map((component) => {
                    const range = colorSpaceComponents[pattern.colorSpace].ranges[component];
                    const value = pattern.colorValues[component];
                    const sliderClassName = getSliderClassName(component, pattern.colorSpace);
                    const sliderVars = getRGBSliderVars(component, pattern);

                    return (
                        <div key={component} className="color-parameter">
                            <div className="control-row">
                                <label className="slider-label" title={range.label || component.toUpperCase()}>
                                    {component.toUpperCase()}
                                </label>
                                <span className="control-value">
                                    {value.toFixed(range.step < 0.1 ? 3 : 1)}
                                    {range.unit || ""}
                                </span>
                            </div>
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
