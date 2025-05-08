import type { Pattern, ColorSpace } from "../types.ts";
import { colorSpaceGroups } from "../utils/constants.ts";
import ColorControls from "./color-controls.tsx";
import ColorSwatches from "./color-swatches.tsx";

interface PatternEditorProps {
    pattern: Pattern;
    isVisible: boolean;
    onUpdatePattern: (id: number, field: keyof Pattern, value: any) => void;
    onUpdateColorValue: (id: number, component: string, value: number) => void;
    onRemovePattern: (id: number) => void;
    displayColor: string;
    getPreviewVarName: (pattern: Pattern, percentage: number) => string;
    nameError: string;
    patterns: Pattern[];
    cssVariables?: Record<string, string>; // Add this prop
}

export default function PatternEditor({
    pattern,
    isVisible,
    onUpdatePattern,
    onUpdateColorValue,
    onRemovePattern,
    displayColor,
    getPreviewVarName,
    nameError,
    patterns,
    cssVariables = {}, // Default to empty object
}: PatternEditorProps) {
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
            <div className="pattern-header">
                <div className="pattern-name-container">
                    <label className="input-label">Pattern Name</label>
                    <input
                        type="text"
                        value={pattern.name}
                        onChange={(e) => onUpdatePattern(pattern.id, "name", e.target.value)}
                        className={`text-input ${nameError ? "error-input" : ""}`}
                        placeholder="Enter a name (letters, numbers, hyphens, underscores)"
                    />
                    {nameError && <div className="error-message">{nameError}</div>}
                    <div className="input-help">Only letters, numbers, hyphens (-) and underscores (_) are allowed</div>
                </div>
            </div>

            {/* Color Space Selector */}
            <div className="color-space-selector">
                <label className="input-label">Color Space</label>
                <select
                    value={pattern.colorSpace}
                    onChange={(e) => onUpdatePattern(pattern.id, "colorSpace", e.target.value as ColorSpace)}
                    className="color-space-select"
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
            </div>

            {/* Color Controls */}
            <ColorControls pattern={pattern} onColorValueChange={onUpdateColorValue} displayColor={displayColor} />

            {/* Base Modifier */}
            <div className="base-modifier">
                <label className="input-label">Base Modifier: {pattern.baseModifier}</label>
                <input
                    type="range"
                    min="0"
                    max="1.0"
                    step="0.01"
                    value={pattern.baseModifier}
                    onChange={(e) => onUpdatePattern(pattern.id, "baseModifier", parseFloat(e.target.value))}
                    className="range-input"
                />
            </div>

            {/* Color Swatch Preview */}
            <ColorSwatches pattern={pattern} getPreviewVarName={getPreviewVarName} cssVariables={cssVariables} />

            {/* Pattern Variable Preview */}
            <div className="variable-preview">
                <h2 className="subtitle">CSS Variable Names</h2>
                <p className="variable-list">
                    Base: <code>--{pattern.name}</code>, <code>--{pattern.name}-base</code>
                    <br />
                    Scale:{" "}
                    {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((i) => (
                        <span key={i}>
                            <code>
                                --{pattern.name}-{i}
                            </code>
                            {i < 100 ? ", " : ""}
                        </span>
                    ))}
                </p>
            </div>
        </div>
    );
}
