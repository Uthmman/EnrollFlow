
"use client";

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import React, { useEffect } from 'react';
// import { ensureInitialDataInFirestore } from '@/lib/firebaseConfig'; // Removed automatic seeding

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  useEffect(() => {
    // const attemptSeed = async () => {
    //   console.log("[Layout] RootLayout: Attempting to ensure initial Firestore data exists...");
    //   await ensureInitialDataInFirestore(); // Automatic seeding removed
    //   console.log("[Layout] RootLayout: ensureInitialDataInFirestore completed.");
    // };

    // if (typeof window !== 'undefined') {
    //     // attemptSeed(); // Automatic seeding removed
    // }
    console.log("[Layout] RootLayout: Automatic Firestore data seeding on startup has been disabled.");
  }, []); // Empty dependency array ensures it runs only once on mount

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>EnrollFlow - School Registration</title>
        <meta name="description" content="Register for school and verify payment seamlessly with EnrollFlow." />
      </head>
      <body className={`${inter.variable} font-body antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
