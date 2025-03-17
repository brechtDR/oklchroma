// components/ShareLink.tsx
import { useState } from "react";

interface ShareLinkProps {
    url: string;
    onCopy: () => void;
}

export default function ShareLink({ url, onCopy }: ShareLinkProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        // Copy to clipboard
        navigator.clipboard
            .writeText(url)
            .then(() => {
                setCopied(true);

                // Call the parent's onCopy callback
                onCopy();

                // Reset after 3 seconds
                setTimeout(() => {
                    setCopied(false);
                }, 3000);
            })
            .catch((error) => {
                console.error("Failed to copy URL to clipboard:", error);
            });
    };

    return (
        <div className="share-container">
            <h2 className="subtitle">Share Link</h2>
            <div className="share-input-container">
                <input
                    type="text"
                    readOnly
                    value={url}
                    className="share-input"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    aria-label="Shareable URL for your color patterns"
                />
                <button
                    className={`share-button ${copied ? "copied" : ""}`}
                    onClick={handleCopy}
                    aria-label="Copy URL to clipboard"
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
                            <span>Copy URL</span>
                        </>
                    )}
                </button>
            </div>
            {copied && (
                <div className="copy-success-message" role="status" aria-live="polite">
                    URL copied to clipboard successfully!
                </div>
            )}
            <p className="share-description">
                This URL contains all your pattern configurations. Share it to let others see your color patterns.
            </p>
        </div>
    );
}
