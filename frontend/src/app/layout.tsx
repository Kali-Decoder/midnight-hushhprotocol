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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: {canonical: "/"},
  title: "Hushh Protocol · send silently.",
  description:
    "Own your .night name, link your X, and send NIGHT on Midnight. Tips are sealed to the recipient and claimed with a zero-knowledge proof.",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Hushh Protocol",
    title: "Hushh Protocol · send silently.",
    description: "Own a .night name with Midnight Passport, link your X and email, and get paid privately in NIGHT.",
  },
  twitter: {
    card: "summary",
    site: "@hushhprotocol",
    creator: "@hushhprotocol",
    title: "Hushh Protocol · send silently.",
    description: "Own a .night name with Midnight Passport, link your X and email, and get paid privately in NIGHT.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
