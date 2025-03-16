import { isColorDark } from "@components/color-pattern-generator/utils/color";
import type { Pattern } from "../types.ts";

interface PatternTabProps {
    pattern: Pattern;
    isActive: boolean;
    onClick: () => void;
    displayColor: string;
}

export default function PatternTab({ pattern, isActive, onClick, displayColor }: PatternTabProps) {
    const isDark = isColorDark(pattern.colorSpace, pattern.colorValues);

    return (
        <button
            className={`tab ${isActive ? "active-tab" : ""}`}
            title={pattern.name}
            style={
                {
                    "--tab-color": displayColor,
                    color: isActive && isDark ? "white" : isActive ? "black" : "inherit",
                } as React.CSSProperties
            }
            onClick={onClick}
        >
            {pattern.name}
        </button>
    );
}
