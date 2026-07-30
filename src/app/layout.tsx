import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Promptly-AI — AI Assistant",
  description: "Chat with Promptly-AI. Fast, smart, and beautiful.",
};

import { ThemeProvider } from "@/components/theme-provider";

import { SpotlightBackground } from "@/components/ui/spotlight-background";

import { SmoothScroll } from "@/components/smooth-scroll";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SpotlightBackground>
            <SmoothScroll>
              {children}
            </SmoothScroll>
          </SpotlightBackground>
        </ThemeProvider>
      </body>
    </html>
  );
}
