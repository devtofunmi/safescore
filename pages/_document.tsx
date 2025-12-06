import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  const setInitialTheme = `(function(){if(typeof window!=="undefined"){try{var e=localStorage.getItem("theme");if(e==="dark"||!e&&window.matchMedia("(prefers-color-scheme: dark)").matches){document.documentElement.classList.add("dark")}else{document.documentElement.classList.remove("dark")}}catch(e){console.warn("failed to set initial theme from localStorage",e)}}})()`;
  return (
    <Html lang="en">
      <Head>
        <script dangerouslySetInnerHTML={{ __html: setInitialTheme }} />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
