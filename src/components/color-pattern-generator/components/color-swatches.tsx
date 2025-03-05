// components/ColorSwatches.tsx
// components/ColorSwatches.tsx
import type { Pattern } from "../types.ts";

interface ColorSwatchesProps {
    pattern: Pattern;
    getPreviewVarName: (pattern: Pattern, percentage: number) => string;
}

export default function ColorSwatches({ pattern, getPreviewVarName }: ColorSwatchesProps) {
    return (
        <div className="preview-container">
            <h3 className="subtitle">Preview</h3>
            <div className="color-swatches">
                {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((i) => (
                    <div
                        key={i}
                        className="color-swatch"
                        title={`--${pattern.name}-${i}`}
                        style={{
                            backgroundColor: getPreviewVarName(pattern, i),
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
