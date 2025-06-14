
"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { getTranslationsForLanguage } from '@/lib/translationService';
import type { LanguageCode } from '@/locales';
import { useState, useEffect, useCallback } from "react";

export default function AccessDeniedPage() {
  // For simplicity, using 'en' for this page, could be made dynamic
  const [currentLanguage] = useState<LanguageCode>('en'); 
  const [t, setT] = useState<Record<string, string>>({});

  const loadTranslations = useCallback(() => {
    setT(getTranslationsForLanguage(currentLanguage));
  }, [currentLanguage]);

  useEffect(() => {
    loadTranslations();
  }, [loadTranslations]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <AlertTriangle className="h-16 w-16 text-destructive mb-6" />
      <h1 className="text-3xl font-bold text-destructive mb-3">
        {t['apAccessDeniedTitle'] || "Access Denied"}
      </h1>
      <p className="text-lg text-muted-foreground mb-8 text-center max-w-md">
        {t['apAccessDeniedMessage'] || "You do not have permission to view this page. Please contact an administrator if you believe this is an error."}
      </p>
      <Link href="/" passHref>
        <Button variant="outline">
          {t['apGoHomeButton'] || "Go to Homepage"}
        </Button>
      </Link>
    </div>
  );
}
