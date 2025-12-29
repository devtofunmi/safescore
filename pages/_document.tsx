import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  const setInitialTheme = `(function(){if(typeof window!=="undefined"){try{var e=localStorage.getItem("theme");if(e==="dark"||!e&&window.matchMedia("(prefers-color-scheme: dark)").matches){document.documentElement.classList.add("dark")}else{document.documentElement.classList.remove("dark")}}catch(e){console.warn("failed to set initial theme from localStorage",e)}}})()`;
  return (
    <Html lang="en">
      <Head>
        <meta name="application-name" content="SafeScore" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SafeScore" />
        <meta name="description" content="SafeScore - Smart Football Predictions" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#000000" />

        <link rel="apple-touch-icon" sizes="180x180" href="/logo-192x192-black.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* Recommended for Google: 48px multiples (48, 96, 144, 192, etc.) */}
        <link rel="icon" type="image/png" sizes="192x192" href="/logo-192x192-black.png" />

        {/* Fallbacks */}
        <link rel="icon" type="image/png" sizes="32x32" href="/logo-192x192-black.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/logo-192x192-black.png" />
        <link rel="shortcut icon" href="/logo-192x192-black.png" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap" rel="stylesheet" />

        <script dangerouslySetInnerHTML={{ __html: setInitialTheme }} />
      </Head>

      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}