import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const SITE_URL = "https://usecanopic.com";
const TITLE = "Canopic | Oracle-priced tokenized stocks on Robinhood Chain";
const DESCRIPTION =
  "Buy and sell Stock Tokens for USDG on Robinhood Chain without giving up custody. Quotes track the live Chainlink mid, the spread and fee appear as separate lines on each ticket, and every trade clears on-chain.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s | Canopic",
  },
  description: DESCRIPTION,
  applicationName: "Canopic",
  keywords: [
    "Canopic",
    "Robinhood Chain",
    "tokenized stocks",
    "RWA swap",
    "real-world assets",
    "USDG",
    "tokenized equities",
    "DeFi",
  ],
  authors: [{ name: "Canopic", url: SITE_URL }],
  creator: "Canopic",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Canopic",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@usecanopic",
    creator: "@usecanopic",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f6f3",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${instrumentSerif.variable} ${geistMono.variable}`}
    >
      <body className="min-h-screen bg-cp-canvas text-cp-ink antialiased">{children}</body>
    </html>
  );
}
