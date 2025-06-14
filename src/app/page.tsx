
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import EnrollmentForm from '@/components/enrollment-form';
import AppHeader from '@/components/app-header';
import { UserPlus } from 'lucide-react';
import { getTranslatedText } from '@/lib/translationService';

const LS_LANGUAGE_KEY = 'hafsaMadrassaPreferredLanguage';

export default function HomePage() {
  const [formStage, setFormStage] = useState<'initial' | 'accountCreated'>('initial');
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');

  // Translated content states
  const originalWelcomeMessage = "Welcome to Hafsa Madrassa Programs";
  const originalSubMessage = "Begin by creating a primary account. Then, you can add participants or enroll yourself in our programs.";
  const originalFooterMessage1 = `© ${new Date().getFullYear()} Hafsa Madrassa. All rights reserved.`;
  const originalFooterMessage2 = "Quality Islamic Education";


  const [translatedWelcomeMessage, setTranslatedWelcomeMessage] = useState(originalWelcomeMessage);
  const [translatedSubMessage, setTranslatedSubMessage] = useState(originalSubMessage);
  const [translatedFooter1, setTranslatedFooter1] = useState(originalFooterMessage1);
  const [translatedFooter2, setTranslatedFooter2] = useState(originalFooterMessage2);


  useEffect(() => {
    const storedLang = localStorage.getItem(LS_LANGUAGE_KEY);
    if (storedLang) {
      setCurrentLanguage(storedLang);
    }
  }, []);

  const handleLanguageChange = (lang: string) => {
    setCurrentLanguage(lang);
    localStorage.setItem(LS_LANGUAGE_KEY, lang);
  };
  
  const translatePageContent = useCallback(async (lang: string) => {
    if (lang === 'en') {
      setTranslatedWelcomeMessage(originalWelcomeMessage);
      setTranslatedSubMessage(originalSubMessage);
      setTranslatedFooter1(originalFooterMessage1);
      setTranslatedFooter2(originalFooterMessage2);
    } else {
      setTranslatedWelcomeMessage(await getTranslatedText(originalWelcomeMessage, lang, 'en'));
      setTranslatedSubMessage(await getTranslatedText(originalSubMessage, lang, 'en'));
      setTranslatedFooter1(await getTranslatedText(originalFooterMessage1, lang, 'en'));
      setTranslatedFooter2(await getTranslatedText(originalFooterMessage2, lang, 'en'));
    }
  }, [originalWelcomeMessage, originalSubMessage, originalFooterMessage1, originalFooterMessage2]);

  useEffect(() => {
    translatePageContent(currentLanguage);
  }, [currentLanguage, translatePageContent]);


  const handleFormStageChange = (stage: 'initial' | 'accountCreated') => {
    setFormStage(stage);
  };

  const handleAccountIconClick = () => {
    setShowAccountDialog(true);
  };

  const handleCloseAccountDialog = () => {
    setShowAccountDialog(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-gradient-to-br from-background to-primary/10">
      <AppHeader 
        showAccountIcon={formStage === 'accountCreated'} 
        onAccountClick={handleAccountIconClick}
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
      />
      
      <div className="w-full max-w-4xl p-4 sm:p-8 md:p-12 lg:p-24 pt-2 sm:pt-4 md:pt-6 lg:pt-8">
        {formStage === 'initial' && (
          <header className="mb-8 sm:mb-10 text-center">
            <div className="inline-flex items-center justify-center p-3 bg-primary text-primary-foreground rounded-full mb-3 sm:mb-4 shadow-lg">
              <UserPlus size={30} className="sm:size-36" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-headline text-primary">
              {translatedWelcomeMessage}
            </h1>
            <p className="mt-2 sm:mt-3 text-md sm:text-lg md:text-xl text-foreground/80">
              {translatedSubMessage}
            </p>
          </header>
        )}
        
        <EnrollmentForm 
          onStageChange={handleFormStageChange}
          showAccountDialogFromParent={showAccountDialog}
          onCloseAccountDialog={handleCloseAccountDialog}
          currentLanguage={currentLanguage} // Pass language to form if needed for its content
        />

        <footer className="mt-10 sm:mt-12 text-center text-xs sm:text-sm text-muted-foreground">
          <p>{translatedFooter1}</p>
          <p>{translatedFooter2}</p>
        </footer>
      </div>
    </main>
  );
}
