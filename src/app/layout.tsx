import type { Metadata } from "next";
import { Fira_Sans, Fira_Code } from "next/font/google";
import "./globals.css";

const firaSans = Fira_Sans({
  variable: "--font-fira-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/** Application metadata used for SEO, OpenGraph previews, and document title. */
export const metadata: Metadata = {
  title: "Urban Air Quality Assistant | PromptWars Challenge 06",
  description:
    "Interactive GenAI assistant for tailored low-emission daily routines, winter smog indoor air hacks, and transparent health & environmental impact insights.",
  keywords: [
    "air quality",
    "AQI",
    "low emission",
    "indoor air quality",
    "winter smog",
    "sustainability",
    "Gemini AI",
  ],
};

/**
 * Root HTML layout configuring Fira Sans and Fira Code typography,
 * dark color scheme defaults, and hydration safety.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${firaSans.variable} ${firaCode.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col font-sans"
      >
        {children}
      </body>
    </html>
  );
}
