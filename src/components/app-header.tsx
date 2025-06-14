
"use client";

import type { FC } from 'react';
import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { UserCog, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getTranslatedText } from '@/lib/translationService';

interface AppHeaderProps {
  showAccountIcon: boolean;
  onAccountClick?: () => void;
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
}

const AppHeader: FC<AppHeaderProps> = ({ showAccountIcon, onAccountClick, currentLanguage, onLanguageChange }) => {
  // Original English strings
  const O_HEADER_TITLE = "Hafsa Madrassa";
  const O_CHANGE_LANGUAGE_LABEL = "Change language";
  const O_ACCOUNT_SETTINGS_LABEL = "Account settings";
  const O_ENGLISH_LABEL = "English";
  const O_AMHARIC_LABEL = "Amharic (አማርኛ)";
  const O_ARABIC_LABEL = "Arabic (العربية)";

  // Translated state
  const [tHeaderTitle, setTHeaderTitle] = useState(O_HEADER_TITLE);
  const [tChangeLangLabel, setTChangeLangLabel] = useState(O_CHANGE_LANGUAGE_LABEL);
  const [tAccountSettingsLabel, setTAccountSettingsLabel] = useState(O_ACCOUNT_SETTINGS_LABEL);
  const [tEnglish, setTEnglish] = useState(O_ENGLISH_LABEL);
  const [tAmharic, setTAmharic] = useState(O_AMHARIC_LABEL);
  const [tArabic, setTArabic] = useState(O_ARABIC_LABEL);

  const translateContent = useCallback(async (lang: string) => {
    if (lang === 'en') {
      setTHeaderTitle(O_HEADER_TITLE);
      setTChangeLangLabel(O_CHANGE_LANGUAGE_LABEL);
      setTAccountSettingsLabel(O_ACCOUNT_SETTINGS_LABEL);
      setTEnglish(O_ENGLISH_LABEL);
      setTAmharic(O_AMHARIC_LABEL);
      setTArabic(O_ARABIC_LABEL);
    } else {
      setTHeaderTitle(await getTranslatedText(O_HEADER_TITLE, lang, 'en'));
      setTChangeLangLabel(await getTranslatedText(O_CHANGE_LANGUAGE_LABEL, lang, 'en'));
      setTAccountSettingsLabel(await getTranslatedText(O_ACCOUNT_SETTINGS_LABEL, lang, 'en'));
      setTEnglish(await getTranslatedText(O_ENGLISH_LABEL, lang, 'en')); // Although "English" might not need translation always
      setTAmharic(await getTranslatedText(O_AMHARIC_LABEL, lang, 'en'));
      setTArabic(await getTranslatedText(O_ARABIC_LABEL, lang, 'en'));
    }
  }, [O_HEADER_TITLE, O_CHANGE_LANGUAGE_LABEL, O_ACCOUNT_SETTINGS_LABEL, O_ENGLISH_LABEL, O_AMHARIC_LABEL, O_ARABIC_LABEL]);

  useEffect(() => {
    translateContent(currentLanguage);
  }, [currentLanguage, translateContent]);

  const handleLanguageSelect = (lang: string) => {
    onLanguageChange(lang);
  };

  return (
    <header className="flex items-center justify-between p-3 sm:p-4 border-b bg-card sticky top-0 z-40 w-full">
      <div className="flex items-center gap-2 sm:gap-3">
        <Image
          src="https://placehold.co/40x40.png"
          alt="Hafsa Madrassa Logo"
          width={32}
          height={32}
          data-ai-hint="islamic education logo"
          className="h-8 w-8 rounded-md"
        />
        <h1 className="text-md sm:text-lg font-semibold text-primary truncate">
          {tHeaderTitle}
        </h1>
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={tChangeLangLabel}>
              <Languages className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => handleLanguageSelect('en')} disabled={currentLanguage === 'en'}>
              {tEnglish}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleLanguageSelect('am')} disabled={currentLanguage === 'am'}>
              {tAmharic}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleLanguageSelect('ar')} disabled={currentLanguage === 'ar'}>
              {tArabic}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {showAccountIcon && (
          <Button variant="ghost" size="icon" onClick={onAccountClick} aria-label={tAccountSettingsLabel}>
            <UserCog className="h-5 w-5" />
          </Button>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
