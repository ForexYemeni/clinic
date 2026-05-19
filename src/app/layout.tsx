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
  description: "تطبيق احترافي لإدارة العيادة",
  manifest: "/manifest.json",
  icons: { icon: "/logo.svg" },
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
