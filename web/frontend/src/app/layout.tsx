import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Lakwedha – Ayurvedic E-Channeling Platform",
  description: "Ayurvedic E-Channeling Platform",
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background min-h-screen text-secondary font-sans antialiased">
        <Script 
          src="https://sandbox.payhere.lk/lib/payhere.js" 
          strategy="beforeInteractive"
        />
        {children}
      </body>
    </html>
  );
}
