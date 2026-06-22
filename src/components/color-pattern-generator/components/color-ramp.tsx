import { formatHex } from "culori";
import { identify } from "chromonym";
import { useMemo, useState } from "react";
import type { Pattern } from "../types.ts";
import { computeScaleOklch, computeScaleAnalysis } from "../utils/color.ts";

interface ColorRampProps {
    pattern: Pattern;
    displayColor: string;
    getPreviewVarName: (pattern: Pattern, percentage: number) => string;
    cssVariables?: Record<string, string>;
}

const SHADE_STEPS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
const ACTIVE_STEP = 50;

export default function ColorRamp({ pattern, displayColor, getPreviewVarName, cssVariables = {} }: ColorRampProps) {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [showNames, setShowNames] = useState(false);

    const swatchNames = useMemo(() => {
        const names: Record<number, string | null> = {};
        SHADE_STEPS.forEach((percentage) => {
            const oklch = computeScaleOklch(pattern, percentage);
            if (!oklch) {
                names[percentage] = null;
                return;
            }
            const hex = formatHex(oklch);
            names[percentage] = identify(hex);
        });
        return names;
    }, [pattern]);

    const gamutAnalysis = useMemo(() => {
        return computeScaleAnalysis(pattern);
    }, [pattern]);

    const copyToClipboard = (percentage: number) => {
        const varName = `--${pattern.name}-${percentage}`;
        const colorValue = cssVariables[varName] || varName;

        navigator.clipboard
            .writeText(colorValue)
            .then(() => {
                setCopiedIndex(percentage);
                setTimeout(() => setCopiedIndex(null), 2000);
            })
            .catch((err) => {
                console.error("Failed to copy color to clipboard:", err);
            });
    };

    return (
        <div className="color-ramp-sticky-container">
                <section className="color-ramp" aria-label={`Color ramp for ${pattern.name}`}>
                <div className="color-ramp-header">
                    <div className="color-ramp-identity">
                        <span className="pattern-color-chip" style={{ backgroundColor: displayColor }} aria-hidden="true" />
                        <div className="pattern-meta">
                            <h2 className="subtitle">{pattern.name}</h2>
                            <p className="pattern-value">{displayColor}</p>
                        </div>
                    </div>
                    <div className="color-ramp-actions">
                        <button
                            type="button"
                            className={`preview-mode-button ${showNames ? "active" : ""}`}
                            onClick={() => setShowNames((value) => !value)}
                            aria-pressed={showNames}
                        >
                            Names
                        </button>
                        <span className="color-ramp-hint">click any to copy</span>
                    </div>
                </div>

                <div className="color-swatches" role="grid" aria-label="Color shades for pattern">
                    {SHADE_STEPS.map((i) => {
                        const varName = `--${pattern.name}-${i}`;
                        const isCopied = copiedIndex === i;
                        const swatchAnalysis = gamutAnalysis.find((a) => a.percentage === i);
                        const isOutOfSrgb = swatchAnalysis?.outOfSrgb ?? false;
                        const isOutOfP3 = swatchAnalysis?.outOfP3 ?? false;

                        return (
                            <button
                                key={i}
                                className={`color-swatch ${isCopied ? "copied" : ""} ${i === ACTIVE_STEP ? "is-marked" : ""}`}
                                title={
                                    isOutOfP3 
                                        ? `Click to copy ${varName} (Out of P3 Gamut)` 
                                        : isOutOfSrgb 
                                            ? `Click to copy ${varName} (Out of sRGB Gamut)` 
                                            : `Click to copy ${varName}`
                                }
                                aria-label={`Copy color ${varName} to clipboard, shade ${i}`}
                                onClick={() => copyToClipboard(i)}
                                style={{ backgroundColor: getPreviewVarName(pattern, i) }}
                            >
                                {isOutOfSrgb && (
                                    <span 
                                        className={`gamut-warning ${isOutOfP3 ? "out-of-p3" : "out-of-srgb"}`}
                                        aria-hidden="true"
                                    />
                                )}
                                {isCopied && (
                                    <span className="copied-indicator" aria-hidden="true">
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
                                                d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75"
                                            />
                                        </svg>
                                    </span>
                                )}
                                {showNames && swatchNames[i] && <span className="color-swatch-name">{swatchNames[i]}</span>}
                                <span className="visually-hidden">{isCopied ? "Copied!" : `${i}% shade`}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="swatch-scale" aria-hidden="true">
                    {SHADE_STEPS.map((step) => (
                        <span key={step} className={step === ACTIVE_STEP ? "is-active" : ""}>
                            {step}
                        </span>
                    ))}
                </div>

                <div className="gamut-legend">
                    <span className="gamut-legend-item">
                        <span className="gamut-legend-dot out-of-srgb" aria-hidden="true" />
                        <span>Out of sRGB (Standard Display)</span>
                    </span>
                    <span className="gamut-legend-item">
                        <span className="gamut-legend-dot out-of-p3" aria-hidden="true" />
                        <span>Out of Display P3 (Wide Gamut Display)</span>
                    </span>
                </div>

                <div className="copy-message" role="status" aria-live="polite">
                    {copiedIndex !== null && (
                        <>
                            Copied{" "}
                            <code>
                                --{pattern.name}-{copiedIndex}
                            </code>{" "}
                            to clipboard!
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}
