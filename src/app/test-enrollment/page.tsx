
"use client";

import React from 'react';
import TestEnrollmentForm from '@/components/test-enrollment-form';
import AppHeader from '@/components/app-header'; // Assuming you want the standard header

export default function TestEnrollmentPage() {
  // Minimal state for this test page, language can be hardcoded or passed if needed
  const [currentLanguage, setCurrentLanguage] = React.useState<'en' | 'am' | 'ar'>('en');

  const handleLanguageChange = (lang: 'en' | 'am' | 'ar') => {
    setCurrentLanguage(lang);
    // In a real scenario, you'd update translations here
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-gradient-to-br from-background to-primary/10">
      <AppHeader
        showAccountIcon={false} // No account features for this simple form
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
      />
      <div className="w-full max-w-xl p-4 sm:p-8 md:p-12 lg:p-16 pt-2 sm:pt-4 md:pt-6 lg:pt-8">
        <header className="mb-6 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">
            Test Enrollment Form
          </h1>
          <p className="mt-1 text-md text-foreground/80">
            A simplified form for testing Firestore data creation.
          </p>
        </header>
        <TestEnrollmentForm />
      </div>
    </main>
  );
}
