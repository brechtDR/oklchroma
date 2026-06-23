import { useState } from "react";

interface ShareLinkProps {
    url: string;
    onCopy: () => string;
}

export default function ShareLink({ url, onCopy }: ShareLinkProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        // Ensure the URL reflects the latest patterns before copying.
        const freshUrl = onCopy() || window.location.href;

        navigator.clipboard
            .writeText(freshUrl)
            .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 3000);
            })
            .catch((error) => {
                console.error("Failed to copy URL to clipboard:", error);
            });
    };

    return (
        <div className="share-container">
            <button
                type="button"
                className={`share-button ${copied ? "copied" : ""}`}
                onClick={handleCopy}
                aria-label="Copy shareable palette link to clipboard"
            >
                <span className="copy-icon" aria-hidden="true">
                    {copied ? "✓" : "🔗"}
                </span>
                <span>{copied ? "Link copied!" : "Share palette link"}</span>
            </button>
            <p className="share-description">URL encodes all patterns — share to restore.</p>
        </div>
    );
}
