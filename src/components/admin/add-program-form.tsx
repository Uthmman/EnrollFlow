
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';
import type { HafsaProgram, HafsaProgramCategory } from '@/lib/constants';
import { getTranslationsForLanguage as getTranslations, getTranslatedText } from '@/lib/translationService';
import type { LanguageCode } from '@/locales';

const programCategories: HafsaProgramCategory[] = ['daycare', 'quran_kids', 'arabic_women', 'general_islamic_studies'];

const ProgramFormSchema = z.object({
  id: z.string().min(3, "Program ID must be at least 3 characters (e.g., 'quran_adv_01').").regex(/^[a-z0-9_]+$/, "ID can only contain lowercase letters, numbers, and underscores."),
  price: z.coerce.number().min(0, "Price must be a positive number."),
  category: z.enum(programCategories, { required_error: "Category is required." }),
  ageRange: z.string().optional(),
  duration: z.string().optional(),
  schedule: z.string().optional(),
  isChildProgram: z.boolean().default(false),
  enLabel: z.string().min(1, "English label is required."),
  enDescription: z.string().min(1, "English description is required."),
  enTerms: z.string().min(1, "English terms are required."),
  amLabel: z.string().optional(),
  amDescription: z.string().optional(),
  amTerms: z.string().optional(),
  arLabel: z.string().optional(),
  arDescription: z.string().optional(),
  arTerms: z.string().optional(),
});

export type ProgramFormData = z.infer<typeof ProgramFormSchema>;

interface AddProgramFormProps {
  onSubmit: (data: ProgramFormData) => Promise<void>;
  initialData?: HafsaProgram | null;
  onCancel: () => void;
  currentLanguage: LanguageCode;
}

export const AddProgramForm: React.FC<AddProgramFormProps> = ({ onSubmit, initialData, onCancel, currentLanguage }) => {
  const [t, setT] = useState<Record<string, string>>({});
  const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset, setValue } = useForm<ProgramFormData>({
    resolver: zodResolver(ProgramFormSchema),
    defaultValues: initialData ? {
      id: initialData.id,
      price: initialData.price,
      category: initialData.category,
      ageRange: initialData.ageRange || '',
      duration: initialData.duration || '',
      schedule: initialData.schedule || '',
      isChildProgram: initialData.isChildProgram,
      enLabel: initialData.translations.en.label,
      enDescription: initialData.translations.en.description,
      enTerms: initialData.translations.en.termsAndConditions,
      amLabel: initialData.translations.am?.label || '',
      amDescription: initialData.translations.am?.description || '',
      amTerms: initialData.translations.am?.termsAndConditions || '',
      arLabel: initialData.translations.ar?.label || '',
      arDescription: initialData.translations.ar?.description || '',
      arTerms: initialData.translations.ar?.termsAndConditions || '',
    } : {
      id: '',
      price: 0,
      category: programCategories[0],
      isChildProgram: false,
      enLabel: '',
      enDescription: '',
      enTerms: '',
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
            id: initialData.id,
            price: initialData.price,
            category: initialData.category,
            ageRange: initialData.ageRange || '',
            duration: initialData.duration || '',
            schedule: initialData.schedule || '',
            isChildProgram: initialData.isChildProgram,
            enLabel: initialData.translations.en.label,
            enDescription: initialData.translations.en.description,
            enTerms: initialData.translations.en.termsAndConditions,
            amLabel: initialData.translations.am?.label || '',
            amDescription: initialData.translations.am?.description || '',
            amTerms: initialData.translations.am?.termsAndConditions || '',
            arLabel: initialData.translations.ar?.label || '',
            arDescription: initialData.translations.ar?.description || '',
            arTerms: initialData.translations.ar?.termsAndConditions || '',
        });
    } else {
        reset({
            id: '',
            price: 0,
            category: programCategories[0],
            isChildProgram: false,
            enLabel: '',
            enDescription: '',
            enTerms: '',
            amLabel: '',
            amDescription: '',
            amTerms: '',
            arLabel: '',
            arDescription: '',
            arTerms: '',
        });
    }
  }, [initialData, reset]);


  const handleFormSubmit = async (data: ProgramFormData) => {
    await onSubmit(data);
    // Optionally reset form here if dialog doesn't close automatically or if staying open for more additions
    // reset(); 
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="id">{t['apProgramIdLabel'] || "Program ID (Unique Identifier)"}</Label>
        <Input id="id" {...register("id")} placeholder={t['apProgramIdPlaceholder'] || "e.g., quran_kids_level1"} disabled={!!initialData} />
        {errors.id && <p className="text-sm text-destructive mt-1">{errors.id.message}</p>}
         {initialData && <p className="text-xs text-muted-foreground mt-1">{t['apProgramIdFixed'] || "ID cannot be changed after creation."}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">{t['apProgramPriceLabel'] || "Price (ETB)"}</Label>
          <Input id="price" type="number" {...register("price")} placeholder="0.00" />
          {errors.price && <p className="text-sm text-destructive mt-1">{errors.price.message}</p>}
        </div>
        <div>
          <Label htmlFor="category">{t['apProgramCategoryLabel'] || "Category"}</Label>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="category"><SelectValue placeholder={t['apSelectCategoryPlaceholder'] || "Select category"} /></SelectTrigger>
                <SelectContent>
                  {programCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{t[`programCategory_${cat}`] || cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.category && <p className="text-sm text-destructive mt-1">{errors.category.message}</p>}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="ageRange">{t['apProgramAgeRangeLabel'] || "Age Range (Optional)"}</Label>
          <Input id="ageRange" {...register("ageRange")} placeholder={t['apProgramAgeRangePlaceholder'] || "e.g., 4-7 years"} />
        </div>
        <div>
          <Label htmlFor="duration">{t['apProgramDurationLabel'] || "Duration (Optional)"}</Label>
          <Input id="duration" {...register("duration")} placeholder={t['apProgramDurationPlaceholder'] || "e.g., 1 hour, 3 times/week"} />
        </div>
        <div>
          <Label htmlFor="schedule">{t['apProgramScheduleLabel'] || "Schedule (Optional)"}</Label>
          <Input id="schedule" {...register("schedule")} placeholder={t['apProgramSchedulePlaceholder'] || "e.g., Mon, Wed, Fri (4-5 PM)"} />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Controller
            name="isChildProgram"
            control={control}
            render={({ field }) => (
                <Checkbox
                    id="isChildProgram"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                />
            )}
        />
        <Label htmlFor="isChildProgram" className="font-normal">{t['apIsChildProgramLabel'] || "This is a child's program (requires guardian info during enrollment)"}</Label>
      </div>
      
      <div className="space-y-3 pt-2 border-t">
        <h4 className="text-md font-semibold text-primary">{t['apEnglishTranslationsLabel'] || "English Translations"}</h4>
        <div>
          <Label htmlFor="enLabel">{t['apProgramEnLabel'] || "English Label"}</Label>
          <Input id="enLabel" {...register("enLabel")} />
          {errors.enLabel && <p className="text-sm text-destructive mt-1">{errors.enLabel.message}</p>}
        </div>
        <div>
          <Label htmlFor="enDescription">{t['apProgramEnDesc'] || "English Description"}</Label>
          <Textarea id="enDescription" {...register("enDescription")} />
          {errors.enDescription && <p className="text-sm text-destructive mt-1">{errors.enDescription.message}</p>}
        </div>
        <div>
          <Label htmlFor="enTerms">{t['apProgramEnTerms'] || "English Terms & Conditions"}</Label>
          <Textarea id="enTerms" {...register("enTerms")} />
          {errors.enTerms && <p className="text-sm text-destructive mt-1">{errors.enTerms.message}</p>}
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t">
        <h4 className="text-md font-semibold text-primary">{t['apAmharicTranslationsLabel'] || "Amharic Translations (Optional)"}</h4>
        <div>
          <Label htmlFor="amLabel">{t['apProgramAmLabel'] || "Amharic Label"}</Label>
          <Input id="amLabel" {...register("amLabel")} />
        </div>
        <div>
          <Label htmlFor="amDescription">{t['apProgramAmDesc'] || "Amharic Description"}</Label>
          <Textarea id="amDescription" {...register("amDescription")} />
        </div>
        <div>
          <Label htmlFor="amTerms">{t['apProgramAmTerms'] || "Amharic Terms & Conditions"}</Label>
          <Textarea id="amTerms" {...register("amTerms")} />
        </div>
      </div>
      
      <div className="space-y-3 pt-2 border-t">
        <h4 className="text-md font-semibold text-primary">{t['apArabicTranslationsLabel'] || "Arabic Translations (Optional)"}</h4>
        <div>
          <Label htmlFor="arLabel">{t['apProgramArLabel'] || "Arabic Label"}</Label>
          <Input id="arLabel" {...register("arLabel")} />
        </div>
        <div>
          <Label htmlFor="arDescription">{t['apProgramArDesc'] || "Arabic Description"}</Label>
          <Textarea id="arDescription" {...register("arDescription")} />
        </div>
        <div>
          <Label htmlFor="arTerms">{t['apProgramArTerms'] || "Arabic Terms & Conditions"}</Label>
          <Textarea id="arTerms" {...register("arTerms")} />
        </div>
      </div>

      <DialogFooter className="pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {t['apCancelButton'] || "Cancel"}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (t['apSavingButton'] || "Saving...") : (initialData ? (t['apUpdateProgramButton'] || "Update Program") : (t['apAddProgramButton'] || "Add Program"))}
        </Button>
      </DialogFooter>
    </form>
  );
};

    