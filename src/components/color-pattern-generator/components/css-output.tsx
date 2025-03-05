// components/CSSOutput.tsx
interface CSSOutputProps {
    css: string;
    onCopy: () => void;
}

export default function CssOutput({ css, onCopy }: CSSOutputProps) {
    return (
        <div className="output-container">
            <div className="output-header">
                <h3 className="subtitle">Generated CSS</h3>
                <button className="copy-button" onClick={onCopy}>
                    Copy to Clipboard
                </button>
            </div>
            <textarea
                readOnly
                value={css}
                className="css-output"
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
        </div>
    );
}
