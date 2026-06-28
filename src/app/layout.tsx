import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
});

export const metadata: Metadata = {
  title: "Stock Opname — SPPG Gampong Mulia",
  description: "Sistem pencatatan stok harian & opname fisik untuk gudang basah dan kering",
  manifest: "/manifest.json",
  icons: [{ rel: "icon", url: "/bgn.svg", type: "image/svg+xml" }],
  appleWebApp: {
    capable: true,
    title: "SCB Stock",
    statusBarStyle: "black-translucent",
 },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} h-full antialiased`}>
      <head>
        <meta name="theme-color" content="#092F54" />
        <meta name="application-name" content="SCB Stock" />
        <link rel="apple-touch-icon" href="/bgn.svg" />
      </head>
      <body className="min-h-full font-sans">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
