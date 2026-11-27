import type {Metadata, Viewport} from "next";
import {Geist_Mono, Plus_Jakarta_Sans} from "next/font/google";
import {AppChrome} from "@/components/AppChrome";
import {MidnightProvider} from "@/providers/MidnightProvider";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans-ui",
  weight: ["400", "500", "600", "700", "800"],
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

/** Production domain. Override with NEXT_PUBLIC_SITE_URL for previews. */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hushh.accuracy.wtf";

const TITLE = "Hushh Protocol · Pay anyone by @name";
const DESCRIPTION =
  "Own a .night name with a passkey, link your X, and get paid in NIGHT on Midnight. Tips are sealed to you and claimed with a zero-knowledge proof.";
const SHARE_DESCRIPTION =
  "Pay anyone by @name. Own a .night name, get tips sealed to you, and claim them with a zero-knowledge proof on Midnight.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "Hushh Protocol",
  title: {default: TITLE, template: "%s · Hushh Protocol"},
  description: DESCRIPTION,
  keywords: [
    "Hushh Protocol",
    "Midnight",
    "Midnight Network",
    "NIGHT",
    ".night name",
    "Midnight Passport",
    "private payments",
    "zero-knowledge",
    "tips",
  ],
  authors: [{name: "Hushh Protocol", url: SITE_URL}],
  creator: "Hushh Protocol",
  publisher: "Hushh Protocol",
  category: "finance",
  formatDetection: {telephone: false, email: false, address: false},
  // Image URLs come from app/opengraph-image.tsx and app/twitter-image.tsx;
  // icons from app/icon.png and app/apple-icon.png.
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Hushh Protocol",
    title: TITLE,
    description: SHARE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    site: "@hushhprotocol",
    creator: "@hushhprotocol",
    title: TITLE,
    description: SHARE_DESCRIPTION,
  },
  appleWebApp: {title: "Hushh", statusBarStyle: "black-translucent"},
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body
        className={`${sans.variable} ${geistMono.variable} paper-surface min-h-dvh font-sans text-ink antialiased`}
      >
        <MidnightProvider>
          <AppChrome>{children}</AppChrome>
        </MidnightProvider>
      </body>
    </html>
  );
}
