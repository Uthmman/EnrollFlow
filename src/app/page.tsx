
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

  // Original English strings
  const O_WELCOME_MESSAGE = "Welcome to Hafsa Madrassa Programs";
  const O_SUB_MESSAGE = "Begin by creating a primary account. Then, you can add participants or enroll yourself in our programs.";
  const O_FOOTER_MESSAGE_1_PREFIX = "© ";
  const O_FOOTER_MESSAGE_1_SUFFIX = " Hafsa Madrassa. All rights reserved.";
  const O_FOOTER_MESSAGE_2 = "Quality Islamic Education";

  // Translated content states
  const [translatedWelcomeMessage, setTranslatedWelcomeMessage] = useState(O_WELCOME_MESSAGE);
  const [translatedSubMessage, setTranslatedSubMessage] = useState(O_SUB_MESSAGE);
  const [translatedFooter1, setTranslatedFooter1] = useState(`${O_FOOTER_MESSAGE_1_PREFIX}${new Date().getFullYear()}${O_FOOTER_MESSAGE_1_SUFFIX}`);
  const [translatedFooter2, setTranslatedFooter2] = useState(O_FOOTER_MESSAGE_2);


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
      setTranslatedWelcomeMessage(O_WELCOME_MESSAGE);
      setTranslatedSubMessage(O_SUB_MESSAGE);
      setTranslatedFooter1(`${O_FOOTER_MESSAGE_1_PREFIX}${new Date().getFullYear()}${O_FOOTER_MESSAGE_1_SUFFIX}`);
      setTranslatedFooter2(O_FOOTER_MESSAGE_2);
    } else {
      setTranslatedWelcomeMessage(await getTranslatedText(O_WELCOME_MESSAGE, lang, 'en'));
      setTranslatedSubMessage(await getTranslatedText(O_SUB_MESSAGE, lang, 'en'));
      const translatedPrefix = await getTranslatedText(O_FOOTER_MESSAGE_1_PREFIX, lang, 'en');
      const translatedSuffix = await getTranslatedText(O_FOOTER_MESSAGE_1_SUFFIX, lang, 'en');
      setTranslatedFooter1(`${translatedPrefix}${new Date().getFullYear()}${translatedSuffix}`);
      setTranslatedFooter2(await getTranslatedText(O_FOOTER_MESSAGE_2, lang, 'en'));
    }
  }, [O_WELCOME_MESSAGE, O_SUB_MESSAGE, O_FOOTER_MESSAGE_1_PREFIX, O_FOOTER_MESSAGE_1_SUFFIX, O_FOOTER_MESSAGE_2]);

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
          currentLanguage={currentLanguage}
        />

        <footer className="mt-10 sm:mt-12 text-center text-xs sm:text-sm text-muted-foreground">
          <p>{translatedFooter1}</p>
          <p>{translatedFooter2}</p>
        </footer>
      </div>
    </main>
  );
}
