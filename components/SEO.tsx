import React from 'react';
import Head from 'next/head';

interface SEOProps {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
}

const SEO = ({
    title = "SafeScore - High-Probability Football Predictions",
    description = "SafeScore uses data-driven algorithms to analyze 14+ global leagues for high-probability football predictions. Stop guessing and start making informed picks.",
    image = "https://www.safescore.pro/og-image.png",
    url = "https://www.safescore.pro",
}: SEOProps) => {
    const siteTitle = title.includes("SafeScore") ? title : `${title} | SafeScore`;

    return (
        <Head>
            {/* Standard Meta Tags */}
            <title>{siteTitle}</title>
            <meta name="description" content={description} />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <meta name="robots" content="index, follow" />
            <link rel="icon" href="/favicon.png" />
            <link rel="canonical" href={url} />
            <meta name="keywords" content="football predictions, soccer betting tips, high probability bets, data driven football analysis, safescore, sports betting data, soccer stats, betting algorithms" />

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebSite",
                        "name": "SafeScore",
                        "url": url,
                        "description": description,
                        "image": image,
                        "sameAs": [
                            "https://twitter.com/codebreak_er"
                        ]
                    })
                }}
            />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:url" content={url} />
            <meta property="og:title" content={siteTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:alt" content="SafeScore Preview" />
            <meta property="og:image:type" content="image/png" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:domain" content="safescore.pro" />
            <meta name="twitter:url" content={url} />
            <meta name="twitter:title" content={siteTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />
            <meta name="twitter:site" content="@codebreak_er" />
            <meta name="twitter:creator" content="@codebreak_er" />
        </Head>
    );
};

export default SEO;