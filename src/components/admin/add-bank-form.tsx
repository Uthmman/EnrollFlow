
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DialogFooter } from '@/components/ui/dialog';
import { getTranslationsForLanguage as getTranslations, getTranslatedText } from '@/lib/translationService';
import type { LanguageCode } from '@/locales';
import type { HafsaPaymentMethod } from '@/types';

const BankDetailFormSchema = z.object({
  value: z.string().min(3, "Bank ID must be at least 3 characters (e.g., 'cbe_branch_x').").regex(/^[a-z0-9_]+$/, "ID can only contain lowercase letters, numbers, and underscores."),
  logoPlaceholder: z.string().url({ message: "Please enter a valid URL for the logo placeholder." }).optional().or(z.literal('')),
  dataAiHint: z.string().optional(),
  accountNumber: z.string().min(5, "Account number must be at least 5 digits.").optional().or(z.literal('')),
  enLabel: z.string().min(1, "English label (Bank Name) is required."),
  enAccountName: z.string().optional(),
  enAdditionalInstructions: z.string().optional(),
  amLabel: z.string().optional(),
  amAccountName: z.string().optional(),
  amAdditionalInstructions: z.string().optional(),
  arLabel: z.string().optional(),
  arAccountName: z.string().optional(),
  arAdditionalInstructions: z.string().optional(),
});

export type BankDetailFormData = z.infer<typeof BankDetailFormSchema>;

interface AddBankFormProps {
  onSubmit: (data: BankDetailFormData) => Promise<void>;
  initialData?: HafsaPaymentMethod | null;
  onCancel: () => void;
  currentLanguage: LanguageCode;
}

export const AddBankForm: React.FC<AddBankFormProps> = ({ onSubmit, initialData, onCancel, currentLanguage }) => {
  const [t, setT] = useState<Record<string, string>>({});
  const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset } = useForm<BankDetailFormData>({
    resolver: zodResolver(BankDetailFormSchema),
    defaultValues: initialData ? {
      value: initialData.value,
      logoPlaceholder: initialData.logoPlaceholder || '',
      dataAiHint: initialData.dataAiHint || '',
      accountNumber: initialData.accountNumber || '',
      enLabel: initialData.translations.en.label,
      enAccountName: initialData.translations.en.accountName || '',
      enAdditionalInstructions: initialData.translations.en.additionalInstructions || '',
      amLabel: initialData.translations.am?.label || '',
      amAccountName: initialData.translations.am?.accountName || '',
      amAdditionalInstructions: initialData.translations.am?.additionalInstructions || '',
      arLabel: initialData.translations.ar?.label || '',
      arAccountName: initialData.translations.ar?.accountName || '',
      arAdditionalInstructions: initialData.translations.ar?.additionalInstructions || '',
    } : {
      value: '',
      logoPlaceholder: 'https://placehold.co/48x48.png',
      dataAiHint: 'bank logo',
      accountNumber: '',
      enLabel: '',
      enAccountName: '',
      enAdditionalInstructions: '',
      amLabel: '',
      amAccountName: '',
      amAdditionalInstructions: '',
      arLabel: '',
      arAccountName: '',
      arAdditionalInstructions: '',
    },
  });

  const loadTranslations = useCallback((lang: LanguageCode) => {
    setT(getTranslations(lang));
  }, []);

  useEffect(() => {
    loadTranslations(currentLanguage);
  }, [currentLanguage, loadTranslations]);
  
  useEffect(() => {
    if (initialData) {
        reset({
            value: initialData.value,
            logoPlaceholder: initialData.logoPlaceholder || '',
            dataAiHint: initialData.dataAiHint || '',
            accountNumber: initialData.accountNumber || '',
            enLabel: initialData.translations.en.label,
            enAccountName: initialData.translations.en.accountName || '',
            enAdditionalInstructions: initialData.translations.en.additionalInstructions || '',
            amLabel: initialData.translations.am?.label || '',
            amAccountName: initialData.translations.am?.accountName || '',
            amAdditionalInstructions: initialData.translations.am?.additionalInstructions || '',
            arLabel: initialData.translations.ar?.label || '',
            arAccountName: initialData.translations.ar?.accountName || '',
            arAdditionalInstructions: initialData.translations.ar?.additionalInstructions || '',
        });
    } else {
        reset({
            value: '',
            logoPlaceholder: 'https://placehold.co/48x48.png',
            dataAiHint: 'bank logo',
            accountNumber: '',
            enLabel: '',
            enAccountName: '',
            enAdditionalInstructions: '',
            amLabel: '',
            amAccountName: '',
            amAdditionalInstructions: '',
            arLabel: '',
            arAccountName: '',
            arAdditionalInstructions: '',
        });
    }
  }, [initialData, reset]);


  const handleFormSubmit = async (data: BankDetailFormData) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="value">{t['apBankIdLabel'] || "Bank ID (Unique Identifier)"}</Label>
        <Input id="value" {...register("value")} placeholder={t['apBankIdPlaceholder'] || "e.g., cbe_main_branch"} disabled={!!initialData} />
        {errors.value && <p className="text-sm text-destructive mt-1">{errors.value.message}</p>}
        {initialData && <p className="text-xs text-muted-foreground mt-1">{t['apBankIdFixed'] || "ID cannot be changed after creation."}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="accountNumber">{t['apAccountNumberLabel'] || "Account Number"}</Label>
          <Input id="accountNumber" {...register("accountNumber")} placeholder={t['apAccountNumberPlaceholder'] || "Enter account number"}/>
          {errors.accountNumber && <p className="text-sm text-destructive mt-1">{errors.accountNumber.message}</p>}
        </div>
         <div>
          <Label htmlFor="logoPlaceholder">{t['apLogoPlaceholderLabel'] || "Logo Placeholder URL"}</Label>
          <Input id="logoPlaceholder" {...register("logoPlaceholder")} placeholder="https://placehold.co/48x48.png" />
          {errors.logoPlaceholder && <p className="text-sm text-destructive mt-1">{errors.logoPlaceholder.message}</p>}
        </div>
      </div>
       <div>
          <Label htmlFor="dataAiHint">{t['apLogoAiHintLabel'] || "Logo AI Hint (for image generation)"}</Label>
          <Input id="dataAiHint" {...register("dataAiHint")} placeholder={t['apLogoAiHintPlaceholder'] || "e.g., cbe logo, bank icon"} />
        </div>
      
      <div className="space-y-3 pt-2 border-t">
        <h4 className="text-md font-semibold text-primary">{t['apEnglishTranslationsLabel'] || "English Translations"}</h4>
        <div>
          <Label htmlFor="enLabel">{t['apBankEnLabel'] || "English Label (Bank Name)"}</Label>
          <Input id="enLabel" {...register("enLabel")} />
          {errors.enLabel && <p className="text-sm text-destructive mt-1">{errors.enLabel.message}</p>}
        </div>
        <div>
          <Label htmlFor="enAccountName">{t['apBankEnAccountName'] || "English Account Name (Holder)"}</Label>
          <Input id="enAccountName" {...register("enAccountName")} />
        </div>
        <div>
          <Label htmlFor="enAdditionalInstructions">{t['apBankEnInstructions'] || "English Additional Instructions"}</Label>
          <Textarea id="enAdditionalInstructions" {...register("enAdditionalInstructions")} />
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t">
        <h4 className="text-md font-semibold text-primary">{t['apAmharicTranslationsLabel'] || "Amharic Translations (Optional)"}</h4>
        <div>
          <Label htmlFor="amLabel">{t['apBankAmLabel'] || "Amharic Label (Bank Name)"}</Label>
          <Input id="amLabel" {...register("amLabel")} />
        </div>
        <div>
          <Label htmlFor="amAccountName">{t['apBankAmAccountName'] || "Amharic Account Name (Holder)"}</Label>
          <Input id="amAccountName" {...register("amAccountName")} />
        </div>
         <div>
          <Label htmlFor="amAdditionalInstructions">{t['apBankAmInstructions'] || "Amharic Additional Instructions"}</Label>
          <Textarea id="amAdditionalInstructions" {...register("amAdditionalInstructions")} />
        </div>
      </div>
      
      <div className="space-y-3 pt-2 border-t">
        <h4 className="text-md font-semibold text-primary">{t['apArabicTranslationsLabel'] || "Arabic Translations (Optional)"}</h4>
        <div>
          <Label htmlFor="arLabel">{t['apBankArLabel'] || "Arabic Label (Bank Name)"}</Label>
          <Input id="arLabel" {...register("arLabel")} />
        </div>
        <div>
          <Label htmlFor="arAccountName">{t['apBankArAccountName'] || "Arabic Account Name (Holder)"}</Label>
          <Input id="arAccountName" {...register("arAccountName")} />
        </div>
        <div>
          <Label htmlFor="arAdditionalInstructions">{t['apBankArInstructions'] || "Arabic Additional Instructions"}</Label>
          <Textarea id="arAdditionalInstructions" {...register("arAdditionalInstructions")} />
        </div>
      </div>

      <DialogFooter className="pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {t['apCancelButton'] || "Cancel"}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (t['apSavingButton'] || "Saving...") : (initialData ? (t['apUpdateBankButton'] || "Update Bank Account") : (t['apAddBankDetailButton'] || "Add Bank Account"))}
        </Button>
      </DialogFooter>
    </form>
  );
};

    