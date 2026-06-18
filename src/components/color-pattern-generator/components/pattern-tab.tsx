import type { Pattern } from "../types.ts";
import type { CSSProperties } from "react";

interface PatternTabProps {
    pattern: Pattern;
    isActive: boolean;
    onClick: () => void;
    onRemove?: () => void;
    canRemove?: boolean;
    displayColor: string;
}

export default function PatternTab({ pattern, isActive, onClick, onRemove, canRemove = false, displayColor }: PatternTabProps) {
    return (
        <div
            className="tab-wrapper"
            style={
                {
                    "--tab-color": displayColor,
                } as CSSProperties
            }
        >
            <button className={`tab ${isActive ? "active-tab" : ""}`} title={pattern.name} onClick={onClick}>
                <span className="tab-dot" aria-hidden="true" />
                <span className="tab-label">{pattern.name}</span>
            </button>
            {canRemove && onRemove ? (
                <button
                    type="button"
                    className="tab-remove"
                    onClick={(event) => {
                        event.stopPropagation();
                        onRemove();
                    }}
                    aria-label={`Remove ${pattern.name} pattern`}
                    title={`Remove ${pattern.name}`}
                >
                    ×
                </button>
            ) : null}
        </div>
    );
}
