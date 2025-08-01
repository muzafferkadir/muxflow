import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MuxFlow - AI Workflow Builder",
  description: "Open-source library for building AI workflow applications, inspired by Google Opal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
