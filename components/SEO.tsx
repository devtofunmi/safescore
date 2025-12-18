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
    image = "https://safescore.vercel.app/og-image.png", // Using the logo as default, ideally use a specific 1200x630 image
    url = "https://safescore.vercel.app",
}: SEOProps) => {
    const siteTitle = title.includes("SafeScore") ? title : `${title} | SafeScore`;

    return (
        <Head>
            {/* Standard Meta Tags */}
            <title>{siteTitle}</title>
            <meta name="description" content={description} />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <link rel="icon" href="/logo.png" />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:url" content={url} />
            <meta property="og:title" content={siteTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={url} />
            <meta property="twitter:title" content={siteTitle} />
            <meta property="twitter:description" content={description} />
            <meta property="twitter:image" content={image} />
            <meta property="twitter:site" content="@codebreak_er" />
            <meta property="twitter:creator" content="@codebreak_er" />
        </Head>
    );
};

export default SEO;
