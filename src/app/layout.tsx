import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using next/font for Inter
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

// If you have specific font weights and styles, configure them here
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'EnrollFlow - School Registration',
  description: 'Register for school and verify payment seamlessly with EnrollFlow.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Fonts link for Inter can be removed if using next/font exclusively */}
        {/* <link rel="preconnect" href="https://fonts.googleapis.com" /> */}
        {/* <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" /> */}
        {/* <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" /> */}
      </head>
      <body className={`${inter.variable} font-body antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
