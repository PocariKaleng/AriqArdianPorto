import type { Metadata } from "next";
import "./globals.css";
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import 'katex/dist/katex.min.css';
import './notebook.css';

export const metadata: Metadata = {
  title: "Ariq Ardian — Portfolio",
  description: "Cryptography, blockchain, and notes from the things I build.",
  icons: {
    icon: "/favicon.svg?v=portrait-1",
    shortcut: "/favicon.svg?v=portrait-1",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "try{if(localStorage.getItem('portfolio-theme')==='light')document.documentElement.dataset.theme='light'}catch(e){}" }} />
        <link rel="stylesheet" href="/style.css" />
        <link rel="stylesheet" href="/silk.css?v=quiet-roles-8" />
        <link rel="stylesheet" href="/navigation.css?v=masthead-3" />
        <link rel="stylesheet" href="/site-chrome.css?v=notebook-1" />
        <link rel="stylesheet" href="/typography.css?v=notebook-1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
