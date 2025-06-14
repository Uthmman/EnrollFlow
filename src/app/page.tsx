
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import EnrollmentForm from '@/components/enrollment-form';
import AppHeader from '@/components/app-header';
import { UserPlus } from 'lucide-react';
import { getTranslationsForLanguage, getTranslatedText } from '@/lib/translationService';
import type { LanguageCode } from '@/locales';

const LS_LANGUAGE_KEY = 'hafsaMadrassaPreferredLanguage';

export default function HomePage() {
  const [formStage, setFormStage] = useState<'initial' | 'accountCreated'>('initial');
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>('en');
  const [t, setT] = useState<Record<string, string>>({});
  const [currentYear, setCurrentYear] = useState('');

  useEffect(() => {
    setCurrentYear(new Date().getFullYear().toString());
    const storedLang = localStorage.getItem(LS_LANGUAGE_KEY) as LanguageCode | null;
    if (storedLang) {
      setCurrentLanguage(storedLang);
    }
  }, []);

  const loadTranslations = useCallback((lang: LanguageCode) => {
    setT(getTranslationsForLanguage(lang));
  }, []);

  useEffect(() => {
    loadTranslations(currentLanguage);
  }, [currentLanguage, loadTranslations]);

  const handleLanguageChange = (lang: LanguageCode) => {
    setCurrentLanguage(lang);
    localStorage.setItem(LS_LANGUAGE_KEY, lang);
  };
  
  const handleFormStageChange = (stage: 'initial' | 'accountCreated') => {
    setFormStage(stage);
  };

  const handleAccountIconClick = () => {
    setShowAccountDialog(true);
  };

  const handleCloseAccountDialog = () => {
    setShowAccountDialog(false);
  };

  const getFooterMessage1 = () => {
    const prefix = getTranslatedText('footerMessage1Prefix', currentLanguage);
    const suffix = getTranslatedText('footerMessage1Suffix', currentLanguage);
    return `${prefix}${currentYear}${suffix}`;
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
              {t.welcomeMessage || "Welcome..."}
            </h1>
            <p className="mt-2 sm:mt-3 text-md sm:text-lg md:text-xl text-foreground/80">
              {t.subMessage || "Begin by..."}
            </p>
          </header>
        )}
        
        <EnrollmentForm 
          onStageChange={handleFormStageChange}
          showAccountDialogFromParent={showAccountDialog}
          onCloseAccountDialog={handleCloseAccountDialog}
          currentLanguage={currentLanguage}
        />

        {currentYear && (
          <footer className="mt-10 sm:mt-12 text-center text-xs sm:text-sm text-muted-foreground">
            <p>{getFooterMessage1()}</p>
            <p>{t.footerMessage2 || "Quality Islamic Education"}</p>
          </footer>
        )}
      </div>
    </main>
  );
}
