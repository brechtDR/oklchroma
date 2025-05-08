import { useState } from "react";

interface CSSOutputProps {
    css: string;
}

export default function CssOutput({ css }: CSSOutputProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard
            .writeText(css)
            .then(() => {
                setCopied(true);

                // Reset after 3 seconds
                setTimeout(() => {
                    setCopied(false);
                }, 3000);
            })
            .catch((error) => {
                console.error("Failed to copy CSS to clipboard:", error);
            });
    };

    return (
        <div className="output-container">
            <div className="output-header">
                <h2 className="subtitle">
                    <span className="visually-hidden-mobile">Generated </span>CSS
                </h2>
                <button
                    className={`copy-button ${copied ? "copied" : ""}`}
                    onClick={handleCopy}
                    aria-label="Copy CSS to clipboard"
                >
                    {copied ? (
                        <>
                            <span className="copy-icon" aria-hidden="true">
                                ✓
                            </span>
                            <span>Copied!</span>
                        </>
                    ) : (
                        <>
                            <span className="copy-icon" aria-hidden="true"></span>
                            <span>Copy to Clipboard</span>
                        </>
                    )}
                </button>
            </div>
            <textarea
                readOnly
                value={css}
                className="css-output"
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                aria-label="Generated CSS code"
            />
            {copied && (
                <div className="copy-success-message css-copied-message" role="status" aria-live="polite">
                    CSS copied to clipboard successfully!
                </div>
            )}
        </div>
    );
}
