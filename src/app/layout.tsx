
"use client"; // Add this if not present, for useEffect

import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; 
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import React, { useEffect } from 'react'; // Import useEffect
import { ensureInitialDataInFirestore } from '@/lib/firebaseConfig'; // Import the seeding function

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

// Metadata can remain static or be moved if client-side rendering affects it significantly
// For this example, assuming it's fine here.
// export const metadata: Metadata = { 
//   title: 'EnrollFlow - School Registration',
//   description: 'Register for school and verify payment seamlessly with EnrollFlow.',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  useEffect(() => {
    // This effect runs once on the client when the layout mounts
    const attemptSeed = async () => {
      console.log("Attempting to ensure initial Firestore data exists...");
      await ensureInitialDataInFirestore();
    };
    
    if (typeof window !== 'undefined') { // Ensure it runs only on the client
        attemptSeed();
    }
  }, []); // Empty dependency array ensures it runs only once on mount

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* It's generally better to let Next.js handle metadata through the `metadata` export */}
        {/* but if you need dynamic head tags based on client-side logic, this is one way */}
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
