import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

import DevAuthTrigger from "@/components/DevAuthTrigger";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
<<<<<<< HEAD
      <body className="bg-background min-h-screen text-secondary font-sans antialiased">
=======
      <body className="bg-sand min-h-screen text-earth font-sans antialiased">
>>>>>>> origin/pharmacy
        {children}
        <DevAuthTrigger />
      </body>
    </html>
  );
}
