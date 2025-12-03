import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ConvexProvider } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Convex Panel - Next.js Demo",
  description: "Demo Next.js app using Convex Panel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ConvexProvider>
          {children}
        </ConvexProvider>
      </body>
    </html>
  );
}

