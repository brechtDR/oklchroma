// components/ShareLink.tsx
interface ShareLinkProps {
    url: string;
    onCopy: () => void;
}

export default function ShareLink({ url, onCopy }: ShareLinkProps) {
    return (
        <div className="share-container">
            <h3 className="subtitle">Share Link</h3>
            <div className="share-input-container">
                <input
                    type="text"
                    readOnly
                    value={url}
                    className="share-input"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button className="share-button" onClick={onCopy}>
                    Copy URL
                </button>
            </div>
            <p className="share-description">
                This URL contains all your pattern configurations. Share it to let others see your color patterns.
            </p>
        </div>
    );
}
