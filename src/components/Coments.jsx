import React, { useState, useEffect } from "react";
import sanitizeHTML from "sanitize-html";

const webmentionskey = "L3A7c40bG_CoxTdmiE_U_A";

function WebmentionList({ mentionUrl }) {
    const [filteredData, setFilteredData] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchWebmentions = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Try with the exact URL first
                const exactUrl = new URL("https://webmention.io/api/mentions.jf2");
                exactUrl.searchParams.set("token", webmentionskey);
                exactUrl.searchParams.set("target", mentionUrl);
                ["like-of", "repost-of", "mention-of"].forEach((property) => {
                    exactUrl.searchParams.append("wm-property[]", property);
                });

                console.log("Fetching webmentions for:", mentionUrl);
                console.log("API URL:", exactUrl.toString());

                const response = await fetch(exactUrl.toString());
                const body = await response.json();
                let myWebmentions = body.children || [];

                // If no mentions found for the subdomain, try the domain-only approach
                if (myWebmentions.length === 0) {
                    console.log("No mentions found for subdomain, trying domain-only approach");

                    // Extract domain from the URL
                    const urlObj = new URL(mentionUrl);
                    const domain = urlObj.hostname.split(".").slice(-2).join(".");

                    const domainUrl = new URL("https://webmention.io/api/mentions.jf2");
                    domainUrl.searchParams.set("token", webmentionskey);
                    domainUrl.searchParams.set("domain", domain);
                    ["like-of", "repost-of", "mention-of"].forEach((property) => {
                        domainUrl.searchParams.append("wm-property[]", property);
                    });

                    console.log("Trying with domain:", domain);
                    console.log("Domain API URL:", domainUrl.toString());

                    const domainResponse = await fetch(domainUrl.toString());
                    const domainBody = await domainResponse.json();
                    myWebmentions = domainBody.children || [];

                    // Filter mentions to those potentially related to your subdomain
                    // This is a rough approach - might need refinement
                    const subdomainPart = urlObj.hostname.split(".")[0];
                    myWebmentions = myWebmentions.filter((mention) => {
                        const source = mention["wm-source"] || "";
                        return (
                            source.includes(subdomainPart) ||
                            (mention.content &&
                                mention.content.text &&
                                mention.content.text.toLowerCase().includes(subdomainPart))
                        );
                    });
                }

                console.log("Found webmentions:", myWebmentions.length);

                const data = webmentionsByUrl(myWebmentions);
                setFilteredData(data);
            } catch (err) {
                console.error("Error fetching webmentions:", err);
                setError("Failed to fetch webmentions");
            } finally {
                setIsLoading(false);
            }
        };

        // Only fetch data if mentionUrl is available
        if (mentionUrl) {
            void fetchWebmentions();
        }
    }, [mentionUrl]);

    if (isLoading) {
        return <div className="webmentions-loading">Loading webmentions...</div>;
    }

    if (error) {
        return <div className="webmentions-error">Error: {error}</div>;
    }

    if (!Object.entries(filteredData).length) {
        return (
            <div className="webmentions-empty">
                <h3>Be the first to share this page!</h3>
                <p>
                    Share on{" "}
                    <a
                        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(mentionUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Twitter
                    </a>{" "}
                    or{" "}
                    <a
                        href={`https://mastodon.social/share?text=${encodeURIComponent(mentionUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Mastodon
                    </a>
                </p>
            </div>
        );
    }

    return (
        <section className="comments">
            <h3>Special thanks for the:</h3>
            {Object.entries(filteredData).map(([type, mentions]) => (
                <div key={type}>
                    {type === "like-of" ? (
                        <h4>
                            Likes
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                                className="icon like"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                                />
                            </svg>
                        </h4>
                    ) : type === "repost-of" ? (
                        <h4>
                            Boosts
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                                className="icon boost"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"
                                />
                            </svg>
                        </h4>
                    ) : (
                        <h4>
                            Mentions
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                                className="icon globe"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"
                                />
                            </svg>
                        </h4>
                    )}

                    <ul className="comments-avatars">
                        {mentions.map((content) => {
                            // if (content.sanitized) {
                            //     return (
                            //         <li
                            //             key={content["wm-id"]}
                            //             dangerouslySetInnerHTML={{
                            //                 __html: content.sanitized,
                            //             }}
                            //         />
                            //     );
                            // }
                            return (
                                <li key={content["wm-id"]}>
                                    {content["wm-property"] === "mention-of" ? (
                                        <a
                                            href={content["wm-source"]}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title={content.author.name}
                                            className={
                                                content.author.photo ? "comments-avatar" : "comments-avatar placeholder"
                                            }
                                        >
                                            {content.author.photo && content.author.photo !== "" ? (
                                                <img
                                                    src={content.author.photo}
                                                    alt={content.author.name}
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth="1.5"
                                                    stroke="currentColor"
                                                    className="icon globe placeholder-globe"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"
                                                    />
                                                </svg>
                                            )}
                                        </a>
                                    ) : (
                                        <a
                                            href={content.author.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title={content.author.name}
                                            className="comments-avatar"
                                        >
                                            {content.author.photo && content.author.photo !== "" ? (
                                                <img
                                                    src={content.author.photo}
                                                    alt={content.author.name}
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth="1.5"
                                                    stroke="currentColor"
                                                    className="icon globe placeholder-globe"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"
                                                    />
                                                </svg>
                                            )}
                                        </a>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ))}
            <small>
                (Based on{" "}
                <svg>
                    <use xlinkHref="#mastodon" />
                </svg>{" "}
                and{" "}
                <svg>
                    <use xlinkHref="#bluesky" />
                </svg>
                )
            </small>
        </section>
    );
}

function webmentionsByUrl(webmentions) {
    const hasRequiredFields = (entry) => {
        const { author, published, content } = entry;
        return author?.name && published && content; // Use optional chaining for potential undefined values
    };

    return webmentions.reduce((acc, m) => {
        const property = m["wm-property"];
        const isReply = property === "in-reply-to";
        const isValidReply = isReply && hasRequiredFields(m);
        if (isValidReply) {
            // Assuming a sanitizeHTML function exists for security
            m.sanitized = sanitizeHTML(m.content.html);
        }

        return {
            ...acc,
            [property]: acc[property]?.length ? [m, ...acc[property]] : [m],
        };
    }, {});
}

export default WebmentionList;
