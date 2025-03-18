import { useState, useEffect } from "react";

interface WebmentionAuthor {
    name: string;
    url: string;
    photo: string;
}

interface Webmention {
    id: string;
    author: WebmentionAuthor;
    url: string;
    published: string;
    content?: {
        text: string;
        html: string;
    };
    "wm-property": "mention" | "like" | "repost" | "bookmark" | "reply" | "rsvp";
    "wm-received": string;
    "wm-id": number;
    "wm-source": string;
    "wm-target": string;
}

interface WebmentionsProps {
    domain?: string;
    path?: string;
    limit?: number;
    className?: string;
}

export default function Webmentions({
    domain = "oklchroma.utilitybend.com",
    path,
    limit = 30,
    className = "",
}: WebmentionsProps) {
    const [mentions, setMentions] = useState<Webmention[]>([]);
    const [likes, setLikes] = useState<Webmention[]>([]);
    const [reposts, setReposts] = useState<Webmention[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchWebmentions() {
            setIsLoading(true);
            setError(null);

            try {
                // Construct the target URL
                let targetUrl = `https://${domain}`;
                if (path) {
                    // Make sure path starts with a slash
                    if (!path.startsWith("/")) {
                        targetUrl += "/";
                    }
                    targetUrl += path;
                }

                // Encode the URL for the API request
                const encodedTarget = encodeURIComponent(targetUrl);

                // Fetch webmentions from webmention.io
                const apiUrl = `https://webmention.io/api/mentions.jf2?target=${encodedTarget}&per-page=${limit}`;
                const response = await fetch(apiUrl);

                if (!response.ok) {
                    throw new Error(`Failed to fetch webmentions: ${response.statusText}`);
                }

                const data = await response.json();

                if (data && data.children) {
                    // Filter mentions by type
                    const allMentions = data.children as Webmention[];

                    setLikes(allMentions.filter((mention) => mention["wm-property"] === "like"));
                    setReposts(allMentions.filter((mention) => mention["wm-property"] === "repost"));
                    setMentions(allMentions.filter((mention) => ["mention", "reply"].includes(mention["wm-property"])));
                }
            } catch (err) {
                console.error("Error fetching webmentions:", err);
                setError(err instanceof Error ? err.message : "Failed to fetch webmentions");
            } finally {
                setIsLoading(false);
            }
        }

        fetchWebmentions();
    }, [domain, path, limit]);

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    if (isLoading) {
        return <div className="webmentions-loading">Loading webmentions...</div>;
    }

    if (error) {
        return <div className="webmentions-error">Error: {error}</div>;
    }

    const hasWebmentions = mentions.length > 0 || likes.length > 0 || reposts.length > 0;

    if (!hasWebmentions) {
        return (
            <div className={`webmentions-container ${className}`}>
                <h2>Webmentions</h2>
                <p className="webmentions-empty">
                    No webmentions yet. Be the first to{" "}
                    <a
                        href={`https://twitter.com/intent/tweet?url=https://${domain}${path || ""}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        share this page
                    </a>
                    !
                </p>
            </div>
        );
    }

    return (
        <div className={`webmentions-container ${className}`}>
            <h2>Webmentions</h2>

            {/* Likes */}
            {likes.length > 0 && (
                <div className="webmentions-likes">
                    <h3>Likes ({likes.length})</h3>
                    <div className="webmentions-avatars">
                        {likes.map((like) => (
                            <a
                                key={like["wm-id"]}
                                href={like.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`${like.author.name} liked this`}
                            >
                                <img
                                    src={like.author.photo}
                                    alt={like.author.name}
                                    className="webmentions-avatar"
                                    loading="lazy"
                                    onError={(e) => {
                                        // Fallback for broken images
                                        (e.target as HTMLImageElement).src =
                                            "https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png";
                                    }}
                                />
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Reposts */}
            {reposts.length > 0 && (
                <div className="webmentions-reposts">
                    <h3>Reposts ({reposts.length})</h3>
                    <div className="webmentions-avatars">
                        {reposts.map((repost) => (
                            <a
                                key={repost["wm-id"]}
                                href={repost.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`${repost.author.name} reposted this`}
                            >
                                <img
                                    src={repost.author.photo}
                                    alt={repost.author.name}
                                    className="webmentions-avatar"
                                    loading="lazy"
                                    onError={(e) => {
                                        // Fallback for broken images
                                        (e.target as HTMLImageElement).src =
                                            "https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png";
                                    }}
                                />
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Mentions and Replies */}
            {mentions.length > 0 && (
                <div className="webmentions-mentions">
                    <h3>Mentions & Replies ({mentions.length})</h3>
                    <ul className="webmentions-list">
                        {mentions.map((mention) => (
                            <li key={mention["wm-id"]} className="webmention-item">
                                <div className="webmention-meta">
                                    <a
                                        href={mention.author.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="webmention-author"
                                    >
                                        <img
                                            src={mention.author.photo}
                                            alt={mention.author.name}
                                            className="webmention-avatar"
                                            loading="lazy"
                                            onError={(e) => {
                                                // Fallback for broken images
                                                (e.target as HTMLImageElement).src =
                                                    "https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png";
                                            }}
                                        />
                                        <span className="webmention-author-name">{mention.author.name}</span>
                                    </a>
                                    <a
                                        href={mention.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="webmention-date"
                                    >
                                        {mention.published
                                            ? formatDate(mention.published)
                                            : formatDate(mention["wm-received"])}
                                    </a>
                                </div>

                                {mention.content && (
                                    <div
                                        className="webmention-content"
                                        dangerouslySetInnerHTML={{
                                            __html: mention.content.html || mention.content.text,
                                        }}
                                    />
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
