import type { Pattern, ColorSpace } from "../types.ts";
import { colorSpaceGroups } from "../utils/constants.ts";
import ColorControls from "./color-controls.tsx";
import ModifierCurveEditor from "./modifier-curve-editor.tsx";

interface PatternEditorProps {
    pattern: Pattern;
    isVisible: boolean;
    onUpdatePattern: (id: number, field: keyof Pattern, value: any) => void;
    onUpdateColorValue: (id: number, component: string, value: number) => void;
    onRemovePattern: (id: number) => void;
    displayColor: string;
    nameError: string;
    patterns: Pattern[];
    onAddHarmonyPattern: (id: number, harmony: "complementary" | "analogous" | "split" | "triadic") => void;
    onFitGamut: (id: number, target: "srgb" | "p3") => void;
}

export default function PatternEditor({
    pattern,
    isVisible,
    onUpdatePattern,
    onUpdateColorValue,
    onRemovePattern,
    displayColor,
    nameError,
    patterns,
    onAddHarmonyPattern,
    onFitGamut,
}: PatternEditorProps) {
    const supportsHueControls = ["oklch", "lch", "hsl", "hwb"].includes(pattern.colorSpace);
    const sourceHue = pattern.colorValues.h ?? 0;
    const harmonyOptions: Array<{
        id: "complementary" | "analogous" | "split" | "triadic";
        label: string;
        shift: number;
    }> = [
        { id: "complementary", label: "Complement", shift: 180 },
        { id: "triadic", label: "Triad", shift: 120 },
        { id: "split", label: "Split", shift: 150 },
        { id: "analogous", label: "Analogous", shift: 30 },
    ];

    return (
        <div className={`pattern-editor ${isVisible ? "visible" : "hidden"}`}>
            <button
                className="remove-button"
                onClick={() => onRemovePattern(pattern.id)}
                disabled={patterns.length <= 1}
            >
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
                        d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                </svg>
                Remove<span className="visually-hidden-mobile"> pattern</span>
            </button>

            {/* Source Color */}
            <div className="editor-card">
                <h2 className="subtitle">Source Color</h2>
                <p className="input-help">Anchor color for the scale.</p>

                <div className="pattern-form-row">
                    <div className="color-space-selector">
                        <label className="field" htmlFor={`space-${pattern.id}`}>
                            <span className="field-prefix">Space</span>
                            <select
                                id={`space-${pattern.id}`}
                                value={pattern.colorSpace}
                                onChange={(e) => onUpdatePattern(pattern.id, "colorSpace", e.target.value as ColorSpace)}
                                className="field-control color-space-select"
                            >
                                {Object.entries(colorSpaceGroups).map(([group, spaces]) => (
                                    <optgroup key={group} label={group}>
                                        {spaces.map((space) => (
                                            <option key={space} value={space}>
                                                {space}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className="pattern-name-container">
                        <label className={`field ${nameError ? "field--error" : ""}`} htmlFor={`name-${pattern.id}`}>
                            <span className="field-prefix">Name</span>
                            <input
                                id={`name-${pattern.id}`}
                                type="text"
                                value={pattern.name}
                                onChange={(e) => onUpdatePattern(pattern.id, "name", e.target.value)}
                                className="field-control text-input"
                                placeholder="primary"
                            />
                        </label>
                        {nameError && <div className="error-message">{nameError}</div>}
                    </div>
                </div>

                <ColorControls pattern={pattern} onColorValueChange={onUpdateColorValue} />

                <div className="hue-shift-control">
                    <p className="eyebrow-label">Scale Behaviour</p>
                    <div className="control-row">
                        <label className="input-label">
                            Hue Shift <span className="input-label-note">across scale</span>
                        </label>
                        <span className="control-value is-accent">
                            {pattern.hueShift > 0 ? "+" : ""}
                            {pattern.hueShift.toFixed(0)}&deg;
                        </span>
                    </div>
                    <input
                        type="range"
                        min="-90"
                        max="90"
                        step="1"
                        value={pattern.hueShift}
                        onChange={(e) => onUpdatePattern(pattern.id, "hueShift", parseFloat(e.target.value))}
                        className="range-input"
                        disabled={!supportsHueControls}
                    />
                    <p className="input-help">
                        Rotates hue from lightest to darkest stop. 0&deg; = monochromatic.
                    </p>
                    {!supportsHueControls && (
                        <p className="input-help">Unavailable in this color space. Try OKLCH, LCH, HSL, or HWB.</p>
                    )}
                </div>
            </div>

            {/* Scale Modifier */}
            <ModifierCurveEditor
                baseModifier={pattern.baseModifier}
                curve={pattern.modifierCurve}
                displayColor={displayColor}
                onBaseModifierChange={(value) => onUpdatePattern(pattern.id, "baseModifier", value)}
                onCurveChange={(curve) => onUpdatePattern(pattern.id, "modifierCurve", curve)}
            />

            {/* Harmony */}
            <div className="editor-card harmony-tools">
                <h2 className="subtitle">Harmony</h2>
                <p className="input-help">Add related patterns in one click.</p>
                {supportsHueControls ? (
                    <div className="harmony-buttons">
                        {harmonyOptions.map((option) => {
                            const targetHue = (((sourceHue + option.shift) % 360) + 360) % 360;
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    className="harmony-button"
                                    onClick={() => onAddHarmonyPattern(pattern.id, option.id)}
                                    disabled={patterns.length >= 10}
                                    title={`${option.label} -> hue ${targetHue.toFixed(0)}deg`}
                                >
                                    <span
                                        className="harmony-preview-dot"
                                        style={{ backgroundColor: `oklch(65% 0.13 ${targetHue})` }}
                                        aria-hidden="true"
                                    />
                                    <span>{option.label}</span>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <p className="input-help">Harmony quick add is available in hue-based spaces like OKLCH, LCH, HSL, and HWB.</p>
                )}
            </div>

            {/* Gamut Controls */}
            <div className="editor-card gamut-tools">
                <h2 className="subtitle">Gamut Adjustment</h2>
                <p className="input-help">Automatically optimize palette values to fit within standard display gamuts.</p>
                <div className="harmony-buttons">
                    <button
                        type="button"
                        className="harmony-button"
                        onClick={() => onFitGamut(pattern.id, "srgb")}
                        title="Reduce chroma and base modifier to fit fully within the sRGB gamut"
                    >
                        <span
                            className="harmony-preview-dot"
                            style={{ backgroundColor: "#f59e0b" }}
                            aria-hidden="true"
                        />
                        <span>Fit to sRGB</span>
                    </button>
                    <button
                        type="button"
                        className="harmony-button"
                        onClick={() => onFitGamut(pattern.id, "p3")}
                        title="Reduce chroma and base modifier to fit fully within the Display P3 gamut"
                    >
                        <span
                            className="harmony-preview-dot"
                            style={{ backgroundColor: "#ef4444" }}
                            aria-hidden="true"
                        />
                        <span>Fit to Display P3</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
