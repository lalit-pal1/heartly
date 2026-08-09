import type { Metadata } from "next";
import { Sora, Inter, Playfair_Display, Outfit } from "next/font/google";
import { HeartlyProvider } from "@/context/HeartlyContext";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Heartly | Premium Emotional Surprise Experiences",
  description: "Make your loved ones smile in the most unforgettable way with a personalized premium surprise link.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${inter.variable} ${playfair.variable} ${outfit.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-brand-black text-foreground antialiased flex flex-col">
        <AuthProvider>
          <HeartlyProvider>
            {children}
          </HeartlyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
