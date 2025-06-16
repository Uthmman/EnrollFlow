
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DialogFooter } from '@/components/ui/dialog';
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from '@/lib/utils';
import { CouponFormSchema as RHFCouponFormSchema, type CouponData } from '@/types'; // Use schema from types
import { getTranslationsForLanguage as getTranslations } from '@/lib/translationService';
import type { LanguageCode } from '@/locales';

export type CouponFormData = z.infer<typeof RHFCouponFormSchema>;

interface AddCouponFormProps {
  onSubmit: (data: CouponFormData) => Promise<void>;
  initialData?: CouponData | null;
  onCancel: () => void;
  currentLanguage: LanguageCode;
}

export const AddCouponForm: React.FC<AddCouponFormProps> = ({ onSubmit, initialData, onCancel, currentLanguage }) => {
  const [t, setT] = useState<Record<string, string>>({});
  const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset, setValue } = useForm<CouponFormData>({
    resolver: zodResolver(RHFCouponFormSchema),
    defaultValues: initialData ? {
      id: initialData.id,
      couponCode: initialData.couponCode,
      discountType: initialData.discountType,
      discountValue: initialData.discountValue,
      description: initialData.description || '',
      expiryDate: initialData.expiryDate ? new Date(initialData.expiryDate) : undefined,
      isActive: initialData.isActive,
    } : {
      id: '',
      couponCode: '',
      discountType: 'percentage',
      discountValue: 0,
      description: '',
      expiryDate: undefined,
      isActive: true,
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
            couponCode: initialData.couponCode,
            discountType: initialData.discountType,
            discountValue: initialData.discountValue,
            description: initialData.description || '',
            expiryDate: initialData.expiryDate ? new Date(initialData.expiryDate) : undefined,
            isActive: initialData.isActive,
        });
    } else {
        reset({ // Ensure default values for new form
            id: '',
            couponCode: '',
            discountType: 'percentage',
            discountValue: 0,
            description: '',
            expiryDate: undefined,
            isActive: true,
        });
    }
  }, [initialData, reset]);


  const handleFormSubmit = async (data: CouponFormData) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <Label htmlFor="id">{t['apCouponIdLabel'] || "Coupon ID (Unique, no spaces)"}</Label>
            <Input id="id" {...register("id")} placeholder={t['apCouponIdPlaceholder'] || "e.g., SUMMER2024"} disabled={!!initialData} />
            {errors.id && <p className="text-sm text-destructive mt-1">{errors.id.message}</p>}
            {initialData && <p className="text-xs text-muted-foreground mt-1">{t['apCouponIdFixed'] || "ID cannot be changed after creation."}</p>}
        </div>
        <div>
            <Label htmlFor="couponCode">{t['apCouponCodeLabel'] || "Coupon Code (User enters this)"}</Label>
            <Input id="couponCode" {...register("couponCode")} placeholder={t['apCouponCodePlaceholder'] || "e.g., SAVE10"} />
            {errors.couponCode && <p className="text-sm text-destructive mt-1">{errors.couponCode.message}</p>}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="discountType">{t['apDiscountTypeLabel'] || "Discount Type"}</Label>
          <Controller
            name="discountType"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="discountType"><SelectValue placeholder={t['apSelectDiscountTypePlaceholder'] || "Select type"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">{t['apDiscountTypePercentage'] || "Percentage"}</SelectItem>
                  <SelectItem value="fixed_amount">{t['apDiscountTypeFixed'] || "Fixed Amount"}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.discountType && <p className="text-sm text-destructive mt-1">{errors.discountType.message}</p>}
        </div>
        <div>
          <Label htmlFor="discountValue">{t['apDiscountValueLabel'] || "Discount Value"}</Label>
          <Input id="discountValue" type="number" {...register("discountValue")} placeholder={t['apDiscountValuePlaceholder'] || "e.g., 10 or 100"} />
          {errors.discountValue && <p className="text-sm text-destructive mt-1">{errors.discountValue.message}</p>}
        </div>
      </div>
      
      <div>
        <Label htmlFor="description">{t['apCouponDescriptionLabel'] || "Description (Optional)"}</Label>
        <Textarea id="description" {...register("description")} placeholder={t['apCouponDescriptionPlaceholder'] || "e.g., 10% off for new students"}/>
      </div>

      <div>
        <Label htmlFor="expiryDate">{t['apCouponExpiryDateLabel'] || "Expiry Date (Optional)"}</Label>
        <Controller
            name="expiryDate"
            control={control}
            render={({ field }) => (
            <Popover>
                <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? format(field.value, "PPP") : <span>{t['apPickDatePlaceholder'] || "Pick a date"}</span>}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                </PopoverContent>
            </Popover>
            )}
        />
        {errors.expiryDate && <p className="text-sm text-destructive mt-1">{errors.expiryDate.message}</p>}
      </div>
      
      <div className="flex items-center space-x-2">
        <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
                <Checkbox
                    id="isActive"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                />
            )}
        />
        <Label htmlFor="isActive" className="font-normal">{t['apCouponIsActiveLabel'] || "Coupon is active"}</Label>
      </div>

      <DialogFooter className="pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {t['apCancelButton'] || "Cancel"}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (t['apSavingButton'] || "Saving...") : (initialData ? (t['apUpdateCouponButton'] || "Update Coupon") : (t['apAddCouponButton'] || "Add Coupon"))}
        </Button>
      </DialogFooter>
    </form>
  );
};
