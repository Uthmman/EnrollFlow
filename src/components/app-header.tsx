
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
import { getTranslationsForLanguage } from '@/lib/translationService';
import type { LanguageCode } from '@/locales';

interface AppHeaderProps {
  showAccountIcon: boolean;
  onAccountClick?: () => void;
  currentLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
}

const AppHeader: FC<AppHeaderProps> = ({ showAccountIcon, onAccountClick, currentLanguage, onLanguageChange }) => {
  const [t, setT] = useState<Record<string, string>>({});

  const loadTranslations = useCallback((lang: LanguageCode) => {
    setT(getTranslationsForLanguage(lang));
  }, []);

  useEffect(() => {
    loadTranslations(currentLanguage);
  }, [currentLanguage, loadTranslations]);

  const handleLanguageSelect = (lang: LanguageCode) => {
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
          {t.headerTitle || "Hafsa Madrassa"}
        </h1>
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t.changeLanguageLabel || "Change language"}>
              <Languages className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => handleLanguageSelect('en')} disabled={currentLanguage === 'en'}>
              {t.englishLabel || "English"}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleLanguageSelect('am')} disabled={currentLanguage === 'am'}>
              {t.amharicLabel || "Amharic (አማርኛ)"}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleLanguageSelect('ar')} disabled={currentLanguage === 'ar'}>
              {t.arabicLabel || "Arabic (العربية)"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {showAccountIcon && (
          <Button variant="ghost" size="icon" onClick={onAccountClick} aria-label={t.accountSettingsLabel || "Account settings"}>
            <UserCog className="h-5 w-5" />
          </Button>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
