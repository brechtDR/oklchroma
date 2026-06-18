import { useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import { getCurveMultiplier, MODIFIER_CURVE_PRESETS, sanitizeModifierCurve } from "../utils/color";

interface ModifierCurveEditorProps {
    baseModifier: number;
    curve: [number, number, number, number];
    displayColor?: string;
    onBaseModifierChange: (value: number) => void;
    onCurveChange: (curve: [number, number, number, number]) => void;
}

const SVG_WIDTH = 300;
const SVG_HEIGHT = 130;
const PADDING = 14;

type HandleName = "cp1" | "cp2" | null;

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function toSvgPoint(x: number, y: number): { x: number; y: number } {
    return {
        x: PADDING + x * (SVG_WIDTH - PADDING * 2),
        y: SVG_HEIGHT - PADDING - y * (SVG_HEIGHT - PADDING * 2),
    };
}

function toNormalizedPoint(clientX: number, clientY: number, bounds: DOMRect): { x: number; y: number } {
    const relativeX = (clientX - bounds.left - PADDING) / (bounds.width - PADDING * 2);
    const relativeY = (bounds.bottom - clientY - PADDING) / (bounds.height - PADDING * 2);

    return {
        x: clamp(relativeX, 0, 1),
        y: clamp(relativeY, 0, 1),
    };
}

export default function ModifierCurveEditor({
    baseModifier,
    curve,
    displayColor,
    onBaseModifierChange,
    onCurveChange,
}: ModifierCurveEditorProps) {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const [draggingHandle, setDraggingHandle] = useState<HandleName>(null);
    const safeCurve = sanitizeModifierCurve(curve);

    const cp1 = useMemo(() => toSvgPoint(safeCurve[0], safeCurve[1]), [safeCurve]);
    const cp2 = useMemo(() => toSvgPoint(safeCurve[2], safeCurve[3]), [safeCurve]);

    const path = `M ${PADDING} ${SVG_HEIGHT - PADDING} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${SVG_WIDTH - PADDING} ${PADDING}`;

    const moveHandle = (clientX: number, clientY: number, target: HandleName) => {
        if (!svgRef.current || !target) {
            return;
        }

        const bounds = svgRef.current.getBoundingClientRect();
        const point = toNormalizedPoint(clientX, clientY, bounds);
        const next = [...safeCurve] as [number, number, number, number];

        if (target === "cp1") {
            next[0] = point.x;
            next[1] = point.y;
        } else {
            next[2] = point.x;
            next[3] = point.y;
        }

        onCurveChange(next);
    };

    const handleMouseDown = (event: MouseEvent<SVGCircleElement>, handleName: HandleName) => {
        event.preventDefault();
        setDraggingHandle(handleName);
    };

    const handleMouseMove = (event: MouseEvent<SVGSVGElement>) => {
        if (!draggingHandle) {
            return;
        }
        moveHandle(event.clientX, event.clientY, draggingHandle);
    };

    const stopDragging = () => {
        setDraggingHandle(null);
    };

    const isActivePreset = (preset: [number, number, number, number]): boolean =>
        preset.every((value, index) => Math.abs(value - safeCurve[index]) < 0.001);
    const hasActivePreset = Object.values(MODIFIER_CURVE_PRESETS).some((preset) => isActivePreset(preset));

    return (
        <div className="editor-card curve-editor" style={{ "--curve-color": displayColor } as CSSProperties}>
            <div className="card-header">
                <h2 className="subtitle">Scale Modifier</h2>
                <div className="segmented" role="group" aria-label="Curve preset">
                    {Object.entries(MODIFIER_CURVE_PRESETS).map(([label, preset]) => (
                        <button
                            key={label}
                            type="button"
                            className={`segmented-button ${isActivePreset(preset) ? "is-active" : ""}`}
                            onClick={() => onCurveChange(preset)}
                        >
                            {label}
                        </button>
                    ))}
                    <span className={`segmented-button is-readonly ${hasActivePreset ? "" : "is-active"}`} aria-hidden="true">
                        Custom
                    </span>
                </div>
            </div>

            <svg
                ref={svgRef}
                viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                className={`curve-canvas ${draggingHandle ? "is-dragging" : ""}`}
                onMouseMove={handleMouseMove}
                onMouseUp={stopDragging}
                onMouseLeave={stopDragging}
                onMouseDown={(event) => {
                    if (event.target === event.currentTarget) {
                        stopDragging();
                    }
                }}
            >
                <line
                    x1={PADDING}
                    y1={SVG_HEIGHT - PADDING}
                    x2={SVG_WIDTH - PADDING}
                    y2={SVG_HEIGHT - PADDING}
                    className="curve-axis"
                />
                <line x1={PADDING} y1={SVG_HEIGHT - PADDING} x2={PADDING} y2={PADDING} className="curve-axis" />
                <path d={path} className="curve-path" />

                {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((step) => {
                    const x = (11 - step / 10) * 0.1;
                    const y = getCurveMultiplier(step, safeCurve);
                    const point = toSvgPoint(x, y);
                    return <circle key={step} cx={point.x} cy={point.y} r="1.5" className="curve-guide-dot" />;
                })}

                <line x1={PADDING} y1={SVG_HEIGHT - PADDING} x2={cp1.x} y2={cp1.y} className="curve-handle-line" />
                <line
                    x1={SVG_WIDTH - PADDING}
                    y1={PADDING}
                    x2={cp2.x}
                    y2={cp2.y}
                    className="curve-handle-line"
                />

                <circle
                    cx={cp1.x}
                    cy={cp1.y}
                    r="5"
                    className="curve-handle"
                    onMouseDown={(event) => handleMouseDown(event, "cp1")}
                />
                <circle
                    cx={cp2.x}
                    cy={cp2.y}
                    r="5"
                    className="curve-handle"
                    onMouseDown={(event) => handleMouseDown(event, "cp2")}
                />
            </svg>

            <p className="input-help">Drag handles to reshape lightness spread across the scale.</p>

            <div className="chroma-floor-control">
                <p className="eyebrow-label">Chroma Floor</p>
                <div className="control-row">
                    <label className="input-label">
                        Base Chroma Floor <span className="input-label-note">min at extremes</span>
                    </label>
                    <span className="control-value">{baseModifier.toFixed(2)}</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={baseModifier}
                    onChange={(event) => onBaseModifierChange(parseFloat(event.target.value))}
                    className="range-input"
                />
                <p className="input-help">
                    Prevents extremes from going completely gray. Raises the chroma minimum at stops 10 and 100.
                </p>
            </div>
        </div>
    );
}
