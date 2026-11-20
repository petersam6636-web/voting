import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ContextFile from "@/lib/ContextFile";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "votesphere",
  description: "Your votesphere application",
};



export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full  antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ContextFile>{children}</ContextFile>
      </body>
    </html>
  );
}

