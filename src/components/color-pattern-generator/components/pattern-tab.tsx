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
            <button className={`tab ${isActive ? "active-tab" : ""} ${canRemove ? "tab-removable" : ""}`} title={pattern.name} onClick={onClick}>
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
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2.5"
                        stroke="currentColor"
                        className="icon"
                        style={{ width: "9px", height: "9px", display: "block" }}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            ) : null}
        </div>
    );
}
