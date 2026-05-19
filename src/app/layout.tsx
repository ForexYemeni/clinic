import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "نظام إدارة العيادة",
  description: "تطبيق احترافي لإدارة العيادة - مرضى، زيارات، خدمات، فواتير",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "العيادة",
  },
  applicationName: "نظام إدارة العيادة",
  formatDetection: {
    telephone: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#059669", // Updated dynamically by ThemeUpdater
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`${geistSans.variable} antialiased bg-background text-foreground`}>
        {children}
        <Toaster 
          position="top-center" 
          dir="rtl"
          richColors
          closeButton
          toastOptions={{
            style: { fontFamily: 'var(--font-geist-sans)' }
          }}
        />
      </body>
    </html>
  );
}
