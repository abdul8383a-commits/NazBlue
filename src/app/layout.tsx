import type { Metadata } from "next";
import { Geist, Geist_Mono, Amiri, Playfair_Display } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StoreLayoutWrapper from "@/components/StoreLayoutWrapper";
import AnalyticsWrapper from "@/components/AnalyticsWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const amiri = Amiri({
  variable: "--font-arabic",
  weight: ["400", "700"],
  subsets: ["arabic"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BLUE ناز | Premium Apparel for Men & Women",
  description: "Discover the latest premium fashion collections for men and women at BLUE ناز.",
  openGraph: {
    title: "BLUE ناز | Premium Apparel",
    description: "Discover the latest premium fashion collections at BLUE ناز.",
    url: "https://blue-naz.com",
    siteName: "BLUE ناز",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${amiri.variable} ${playfair.variable} antialiased min-h-screen flex flex-col font-sans selection:bg-primary/10`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <CartProvider>
            <AnalyticsWrapper>
              <StoreLayoutWrapper navbar={<Navbar />} footer={<Footer />}>
                {children}
              </StoreLayoutWrapper>
            </AnalyticsWrapper>
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
