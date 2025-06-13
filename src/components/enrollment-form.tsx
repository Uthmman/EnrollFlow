
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, FormProvider, Controller, useFieldArray, useWatch, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { School, User, BookOpen, CreditCard, FileText, CheckCircle, ArrowRight, ArrowLeft, Loader2, AlertTriangle, CalendarIcon, Users, PlusCircle, Trash2, Settings, Building, FileImage, LinkIcon, FingerprintIcon, UserCheck, Info, Percent, Phone } from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { format } from "date-fns";

import { HAFSA_PROGRAMS, HAFSA_PAYMENT_METHODS, HafsaProgram, ProgramField, SCHOOL_GRADES, QURAN_LEVELS } from '@/lib/constants';
import type { EnrollmentFormData, ParentInfoData, ChildInfoData, AdultTraineeData, RegistrationData } from '@/types';
import { EnrollmentFormSchema } from '@/types';
import { handlePaymentVerification } from '@/app/actions'; // This action will need updates for new payment methods/logic
import Receipt from '@/components/receipt';

const overallStages = [
  { id: 'programSelection', title: 'Select Program', icon: <BookOpen className="h-5 w-5" /> },
  { id: 'participantInfo', title: 'Participant Information', icon: <Users className="h-5 w-5" /> },
  { id: 'payment', title: 'Payment & Confirmation', icon: <CreditCard className="h-5 w-5" /> },
  { id: 'receipt', title: 'Registration Complete', icon: <CheckCircle className="h-5 w-5" /> },
];

const defaultChildValues: ChildInfoData = {
  childFirstName: '',
  gender: 'male' as 'male' | 'female', // default, but should be selected
  dateOfBirth: undefined as any,
  specialAttention: '',
  schoolGrade: '',
  quranLevel: '',
};

const defaultAdultTraineeValues: AdultTraineeData = {
  traineeFullName: '',
  dateOfBirth: undefined as any,
  phone1: '',
  telegramPhoneNumber: '',
};

const ParentInfoFields: React.FC = () => {
  const { control, register, formState: { errors }, watch, setValue } = useFormContext<EnrollmentFormData>();
  const parentInfoErrors = errors.parentInfo || {};

  const phone1 = watch('parentInfo.parentPhone1');
  const phone2 = watch('parentInfo.parentPhone2');

  return (
    <Card className="mb-4 sm:mb-6 p-3 sm:p-4 border-primary/20 border">
      <CardHeader className="p-2 pb-1">
        <CardTitle className="text-lg sm:text-xl font-headline text-primary flex items-center"><UserCheck className="mr-2 h-5 w-5"/> Parent/Guardian Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-2 pt-1">
        <div>
          <Label htmlFor="parentInfo.parentFullName">Full Name</Label>
          <Input id="parentInfo.parentFullName" {...register('parentInfo.parentFullName')} placeholder="Parent's Full Name" />
          {parentInfoErrors.parentFullName && <p className="text-sm text-destructive mt-1">{parentInfoErrors.parentFullName.message}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="parentInfo.parentPhone1">Primary Phone Number</Label>
            <Input id="parentInfo.parentPhone1" {...register('parentInfo.parentPhone1')} type="tel" placeholder="e.g., 0911XXXXXX" />
            {parentInfoErrors.parentPhone1 && <p className="text-sm text-destructive mt-1">{parentInfoErrors.parentPhone1.message}</p>}
          </div>
          <div>
            <Label htmlFor="parentInfo.parentPhone2">Secondary Phone Number (Optional)</Label>
            <Input id="parentInfo.parentPhone2" {...register('parentInfo.parentPhone2')} type="tel" placeholder="e.g., 0912XXXXXX" />
            {parentInfoErrors.parentPhone2 && <p className="text-sm text-destructive mt-1">{parentInfoErrors.parentPhone2.message}</p>}
          </div>
        </div>
        <div>
          <Label htmlFor="parentInfo.telegramPhoneNumber">Telegram Phone Number</Label>
          <Input id="parentInfo.telegramPhoneNumber" {...register('parentInfo.telegramPhoneNumber')} type="tel" placeholder="For Telegram updates" />
          {parentInfoErrors.telegramPhoneNumber && <p className="text-sm text-destructive mt-1">{parentInfoErrors.telegramPhoneNumber.message}</p>}
          <div className="mt-2 space-y-1 text-sm">
            <Controller name="parentInfo.usePhone1ForTelegram" control={control} render={({field}) => (
                <div className="flex items-center gap-2">
                    <Checkbox id="usePhone1ForTelegram" checked={field.value} onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked && phone1) setValue('parentInfo.telegramPhoneNumber', phone1);
                        setValue('parentInfo.usePhone2ForTelegram', false);
                    }} disabled={!phone1}/>
                    <Label htmlFor="usePhone1ForTelegram" className="font-normal">Use Primary Phone for Telegram</Label>
                </div>
            )}/>
            {phone2 && 
            <Controller name="parentInfo.usePhone2ForTelegram" control={control} render={({field}) => (
                 <div className="flex items-center gap-2">
                    <Checkbox id="usePhone2ForTelegram" checked={field.value} onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked && phone2) setValue('parentInfo.telegramPhoneNumber', phone2);
                        setValue('parentInfo.usePhone1ForTelegram', false);
                    }} disabled={!phone2}/>
                    <Label htmlFor="usePhone2ForTelegram" className="font-normal">Use Secondary Phone for Telegram</Label>
                </div>
            )}/>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ChildParticipantFields: React.FC<{ childIndex: number; removeChild: (index: number) => void; programSpecificFields?: ProgramField[] }> = ({ childIndex, removeChild, programSpecificFields }) => {
  const { control, register, formState: { errors } } = useFormContext<EnrollmentFormData>();
  const pathPrefix = `children.${childIndex}` as const;
  const childErrors = errors.children?.[childIndex] || {};

  return (
    <Card className="mb-4 sm:mb-6 p-3 sm:p-4 border-dashed">
      <CardHeader className="flex flex-row justify-between items-center p-2 pb-1">
        <CardTitle className="text-lg sm:text-xl font-headline">Child {childIndex + 1}</CardTitle>
        <Button type="button" variant="ghost" size="sm" onClick={() => removeChild(childIndex)} className="text-destructive hover:text-destructive/80">
          <Trash2 className="h-4 w-4 mr-1" /> Remove
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-2 pt-1">
        <div>
          <Label htmlFor={`${pathPrefix}.childFirstName`}>First Name</Label>
          <Input id={`${pathPrefix}.childFirstName`} {...register(`${pathPrefix}.childFirstName`)} placeholder="Child's First Name" />
          {childErrors.childFirstName && <p className="text-sm text-destructive mt-1">{childErrors.childFirstName.message}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <Label htmlFor={`${pathPrefix}.gender`}>Gender</Label>
                <Controller
                    name={`${pathPrefix}.gender`}
                    control={control}
                    render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id={`${pathPrefix}.gender`}><SelectValue placeholder="Select gender" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                    </Select>
                    )}
                />
                {childErrors.gender && <p className="text-sm text-destructive mt-1">{childErrors.gender.message}</p>}
            </div>
            <div>
                <Label htmlFor={`${pathPrefix}.dateOfBirth`}>Date of Birth</Label>
                <Controller
                    name={`${pathPrefix}.dateOfBirth`}
                    control={control}
                    render={({ field }) => (
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus disabled={(date) => date > new Date() || date < new Date("2000-01-01")} /></PopoverContent>
                    </Popover>
                    )}
                />
                {childErrors.dateOfBirth && <p className="text-sm text-destructive mt-1">{childErrors.dateOfBirth.message}</p>}
            </div>
        </div>
        {programSpecificFields?.map(fieldInfo => (
          <div key={fieldInfo.name}>
            <Label htmlFor={`${pathPrefix}.${fieldInfo.name}`}>{fieldInfo.label}</Label>
            {fieldInfo.type === 'text' && (
              <Textarea id={`${pathPrefix}.${fieldInfo.name}`} {...register(`${pathPrefix}.${fieldInfo.name}` as any)} placeholder={fieldInfo.label} />
            )}
            {fieldInfo.type === 'select' && (
              <Controller
                name={`${pathPrefix}.${fieldInfo.name}` as any}
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id={`${pathPrefix}.${fieldInfo.name}`}><SelectValue placeholder={`Select ${fieldInfo.label.toLowerCase()}`} /></SelectTrigger>
                    <SelectContent>{fieldInfo.options.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                  </Select>
                )}
              />
            )}
             {(childErrors as any)[fieldInfo.name] && <p className="text-sm text-destructive mt-1">{(childErrors as any)[fieldInfo.name].message}</p>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

const AdultTraineeFields: React.FC = () => {
  const { control, register, formState: { errors }, watch, setValue } = useFormContext<EnrollmentFormData>();
  const adultErrors = errors.adultTraineeInfo || {};
  const phone1 = watch('adultTraineeInfo.phone1');
  const phone2 = watch('adultTraineeInfo.phone2');

  return (
    <Card className="mb-4 sm:mb-6 p-3 sm:p-4 border-primary/20 border">
      <CardHeader className="p-2 pb-1">
        <CardTitle className="text-lg sm:text-xl font-headline text-primary flex items-center"><User className="mr-2 h-5 w-5"/> Trainee Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-2 pt-1">
        <div>
          <Label htmlFor="adultTraineeInfo.traineeFullName">Full Name</Label>
          <Input id="adultTraineeInfo.traineeFullName" {...register('adultTraineeInfo.traineeFullName')} placeholder="Trainee's Full Name" />
          {adultErrors.traineeFullName && <p className="text-sm text-destructive mt-1">{adultErrors.traineeFullName.message}</p>}
        </div>
        <div>
          <Label htmlFor="adultTraineeInfo.dateOfBirth">Date of Birth</Label>
          <Controller
            name="adultTraineeInfo.dateOfBirth"
            control={control}
            render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus disabled={(date) => date > new Date() || date < new Date("1940-01-01")} /></PopoverContent>
              </Popover>
            )}
          />
          {adultErrors.dateOfBirth && <p className="text-sm text-destructive mt-1">{adultErrors.dateOfBirth.message}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="adultTraineeInfo.phone1">Primary Phone Number</Label>
            <Input id="adultTraineeInfo.phone1" {...register('adultTraineeInfo.phone1')} type="tel" placeholder="e.g., 0911XXXXXX" />
            {adultErrors.phone1 && <p className="text-sm text-destructive mt-1">{adultErrors.phone1.message}</p>}
          </div>
          <div>
            <Label htmlFor="adultTraineeInfo.phone2">Secondary Phone Number (Optional)</Label>
            <Input id="adultTraineeInfo.phone2" {...register('adultTraineeInfo.phone2')} type="tel" placeholder="e.g., 0912XXXXXX" />
            {adultErrors.phone2 && <p className="text-sm text-destructive mt-1">{adultErrors.phone2.message}</p>}
          </div>
        </div>
        <div>
          <Label htmlFor="adultTraineeInfo.telegramPhoneNumber">Telegram Phone Number</Label>
          <Input id="adultTraineeInfo.telegramPhoneNumber" {...register('adultTraineeInfo.telegramPhoneNumber')} type="tel" placeholder="For Telegram updates" />
          {adultErrors.telegramPhoneNumber && <p className="text-sm text-destructive mt-1">{adultErrors.telegramPhoneNumber.message}</p>}
          <div className="mt-2 space-y-1 text-sm">
             <Controller name="adultTraineeInfo.usePhone1ForTelegram" control={control} render={({field}) => (
                <div className="flex items-center gap-2">
                    <Checkbox id="adultUsePhone1ForTelegram" checked={field.value} onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked && phone1) setValue('adultTraineeInfo.telegramPhoneNumber', phone1);
                        setValue('adultTraineeInfo.usePhone2ForTelegram', false);
                    }} disabled={!phone1}/>
                    <Label htmlFor="adultUsePhone1ForTelegram" className="font-normal">Use Primary Phone for Telegram</Label>
                </div>
            )}/>
            {phone2 &&
            <Controller name="adultTraineeInfo.usePhone2ForTelegram" control={control} render={({field}) => (
                 <div className="flex items-center gap-2">
                    <Checkbox id="adultUsePhone2ForTelegram" checked={field.value} onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked && phone2) setValue('adultTraineeInfo.telegramPhoneNumber', phone2);
                        setValue('adultTraineeInfo.usePhone1ForTelegram', false);
                    }} disabled={!phone2}/>
                    <Label htmlFor="adultUsePhone2ForTelegram" className="font-normal">Use Secondary Phone for Telegram</Label>
                </div>
            )}/>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


const EnrollmentForm: React.FC = () => {
  const [currentStage, setCurrentStage] = useState(0); // 0: Program Selection, 1: Participant Info, 2: Payment, 3: Receipt
  const [isLoading, setIsLoading] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
  const { toast } = useToast();

  const methods = useForm<EnrollmentFormData>({
    resolver: zodResolver(EnrollmentFormSchema),
    defaultValues: {
      selectedProgramId: '',
      parentInfo: { parentFullName: '', parentPhone1: '', telegramPhoneNumber: '' },
      children: [], // Start with no children, add dynamically
      adultTraineeInfo: defaultAdultTraineeValues,
      agreeToTerms: false,
      couponCode: '',
      paymentProof: { paymentType: HAFSA_PAYMENT_METHODS[0]?.value || '' },
    },
  });

  const { control, handleSubmit, formState: { errors }, setValue, getValues, trigger, watch, register } = methods;

  const { fields: childFields, append: appendChild, remove: removeChild } = useFieldArray({
    control,
    name: "children",
  });
  
  const selectedProgramId = watch('selectedProgramId');
  const watchedChildren = watch('children'); // for price calculation
  const watchedPaymentType = watch('paymentProof.paymentType'); // for AI logic if still used

  const selectedProgram = useMemo(() => {
    return HAFSA_PROGRAMS.find(p => p.id === selectedProgramId);
  }, [selectedProgramId]);

  useEffect(() => {
    // Reset participant info when program changes
    setValue('children', []);
    setValue('parentInfo', { parentFullName: '', parentPhone1: '', telegramPhoneNumber: '' });
    setValue('adultTraineeInfo', defaultAdultTraineeValues);
    if (selectedProgram && selectedProgram.isChildProgram && getValues('children').length === 0) {
        appendChild(defaultChildValues); // Add one child by default if it's a child program
    }
    // Recalculate price
    let total = 0;
    if (selectedProgram) {
      total = selectedProgram.price;
      if (selectedProgram.isChildProgram) {
        const numChildren = getValues('children')?.length || 0;
        total = selectedProgram.price * Math.max(1, numChildren); // Price per child
      }
    }
    setCalculatedPrice(total);
  }, [selectedProgram, setValue, getValues, appendChild]);

  useEffect(() => { // Price calculation based on number of children for child programs
    if (selectedProgram && selectedProgram.isChildProgram) {
      const numChildren = watchedChildren?.length || 0;
      setCalculatedPrice(selectedProgram.price * Math.max(1, numChildren));
    } else if (selectedProgram) {
      setCalculatedPrice(selectedProgram.price);
    } else {
      setCalculatedPrice(0);
    }
  }, [watchedChildren, selectedProgram]);


  const handleNextStage = async () => {
    let isValid = false;
    if (currentStage === 0) { // Program Selection -> Participant Info
      isValid = await trigger(['selectedProgramId', 'agreeToTerms']);
      if(isValid && !selectedProgram) isValid = false; // Ensure program is actually found
    } else if (currentStage === 1) { // Participant Info -> Payment
      const fieldsToValidate: (keyof EnrollmentFormData)[] = ['selectedProgramId', 'agreeToTerms'];
      if (selectedProgram?.requiresParentInfo) fieldsToValidate.push('parentInfo');
      if (selectedProgram?.isChildProgram) fieldsToValidate.push('children');
      else fieldsToValidate.push('adultTraineeInfo');
      isValid = await trigger(fieldsToValidate);
    }
    
    if (isValid) {
      setCurrentStage(s => s + 1);
    } else {
      toast({ title: "Validation Error", description: "Please check your entries and try again.", variant: "destructive" });
    }
  };

  const handlePreviousStage = () => {
    setCurrentStage(s => s - 1);
  };
  
  const onSubmit = async (data: EnrollmentFormData) => {
    if (!selectedProgram) {
        toast({ title: "Error", description: "No program selected.", variant: "destructive" });
        return;
    }
    setIsLoading(true);
    try {
      // AI verification for 'screenshot' type if still relevant
      let screenshotDataUri: string | undefined;
      if (data.paymentProof.paymentType === 'screenshot_ai_verification' && data.paymentProof.screenshot) { // Assuming a specific value for AI
        screenshotDataUri = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(data.paymentProof.screenshot as File);
        });
        setValue('paymentProof.screenshotDataUri', screenshotDataUri); 
        data.paymentProof.screenshotDataUri = screenshotDataUri; 
      }
      
      // For Hafsa payment methods, AI verification might not apply directly.
      // The `handlePaymentVerification` action would need to be adapted or bypassed.
      // For now, we'll assume basic submission or a modified AI flow.
      const verificationInput = {
        paymentProof: {
          paymentType: data.paymentProof.paymentType, // This is now 'cbe', 'telebirr', etc.
          screenshotDataUri: data.paymentProof.screenshotDataUri, // May be undefined
          pdfLink: data.paymentProof.pdfLink, // May be undefined
          transactionId: data.paymentProof.transactionId, // May be undefined
        },
        expectedAmount: calculatedPrice, // Add coupon logic here if implemented
      };

      // TODO: Coupon code discount logic before calling handlePaymentVerification
      // let effectivePrice = calculatedPrice;
      // if (data.couponCode === "DISCOUNT10") effectivePrice *= 0.9;
      // verificationInput.expectedAmount = effectivePrice;


      // The existing handlePaymentVerification might need significant changes
      // For now, let's assume it's adapted or for some methods it's a direct pass
      const result = await handlePaymentVerification(verificationInput);


      if (result.isPaymentValid) { // Or for manual methods, assume valid for now
        toast({
          title: "Payment Submitted!", // Or "Verified" if AI was used
          description: result.message || "Your payment information has been submitted for processing.",
          variant: "default",
          className: "bg-accent text-accent-foreground",
        });
        const finalRegistrationData: RegistrationData = {
          selectedProgramLabel: selectedProgram.label,
          parentInfo: selectedProgram.requiresParentInfo ? data.parentInfo : undefined,
          children: selectedProgram.isChildProgram ? data.children : undefined,
          adultTraineeInfo: !selectedProgram.isChildProgram ? data.adultTraineeInfo : undefined,
          agreeToTerms: data.agreeToTerms,
          couponCode: data.couponCode,
          paymentProof: data.paymentProof,
          calculatedPrice: calculatedPrice, // Store original price before coupon
          paymentVerified: result.isPaymentValid, // This flag's meaning might change
          paymentVerificationDetails: result,
          registrationDate: new Date(),
        };
        setRegistrationData(finalRegistrationData);
        setCurrentStage(3); // Move to receipt stage
      } else {
        toast({
          title: "Payment Issue",
          description: result.reason || result.message || "Please check your payment details and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (currentStage === 3 && registrationData) {
    return <Receipt data={registrationData} />;
  }

  const getCurrentStageTitle = () => overallStages[currentStage]?.title || "Registration";

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
        <Card className="w-full max-w-2xl mx-auto shadow-xl">
          <CardHeader>
            <div className="flex items-center space-x-2 mb-2 sm:mb-4">
              <School className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <CardTitle className="text-2xl sm:text-3xl font-headline">Hafsa Madrassa Registration</CardTitle>
            </div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center space-y-1 sm:space-y-0">
               <CardDescription className="text-sm">{getCurrentStageTitle()}</CardDescription>
                <div className="flex space-x-1">
                {overallStages.map((stage, index) => (
                    <div key={stage.id} className={cn("h-2 w-6 sm:w-8 rounded-full", currentStage >= index ? "bg-primary" : "bg-muted")} />
                ))}
                </div>
            </div>
          </CardHeader>

          <CardContent className="min-h-[300px] sm:min-h-[350px] p-4 sm:p-6">
            {/* STAGE 0: Program Selection */}
            {currentStage === 0 && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <Label htmlFor="selectedProgramId" className="text-base sm:text-lg">Select Program</Label>
                  <Controller
                    name="selectedProgramId"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="selectedProgramId" className="mt-1"><SelectValue placeholder="Choose a program" /></SelectTrigger>
                        <SelectContent>
                          {HAFSA_PROGRAMS.map(prog => <SelectItem key={prog.id} value={prog.id}>{prog.label} - {prog.description}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.selectedProgramId && <p className="text-sm text-destructive mt-1">{errors.selectedProgramId.message}</p>}
                </div>
                {selectedProgram && (
                  <Card className="bg-primary/5 p-3 sm:p-4">
                    <CardHeader className="p-0 pb-2">
                      <CardTitle className="text-lg sm:text-xl text-primary">{selectedProgram.label}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 text-sm space-y-1">
                      <p>{selectedProgram.description}</p>
                      {selectedProgram.ageRange && <p><strong>Age:</strong> {selectedProgram.ageRange}</p>}
                      {selectedProgram.duration && <p><strong>Duration:</strong> {selectedProgram.duration}</p>}
                      {selectedProgram.schedule && <p><strong>Schedule:</strong> {selectedProgram.schedule}</p>}
                      <p className="font-semibold"><strong>Price:</strong> ${selectedProgram.price.toFixed(2)} {selectedProgram.isChildProgram ? "/participant" : ""}</p>
                      {selectedProgram.termsLink && <a href={selectedProgram.termsLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">View Terms for this program</a>}
                    </CardContent>
                  </Card>
                )}
                <div>
                  <Controller
                    name="agreeToTerms"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center space-x-2 sm:space-x-3 mt-3">
                        <Checkbox id="agreeToTerms" checked={field.value} onCheckedChange={field.onChange} />
                        <Label htmlFor="agreeToTerms" className="text-sm font-normal">I agree to the terms and conditions of Hafsa Madrassa. (General T&C link can be added here)</Label>
                      </div>
                    )}
                  />
                  {errors.agreeToTerms && <p className="text-sm text-destructive mt-1">{errors.agreeToTerms.message}</p>}
                </div>
              </div>
            )}

            {/* STAGE 1: Participant Information */}
            {currentStage === 1 && selectedProgram && (
              <div className="space-y-4 sm:space-y-6">
                {selectedProgram.requiresParentInfo && <ParentInfoFields />}
                
                {selectedProgram.isChildProgram && (
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-primary flex items-center"><Users className="mr-2 h-5 w-5" /> Child(ren) Information</h3>
                    {childFields.map((field, index) => (
                      <ChildParticipantFields key={field.id} childIndex={index} removeChild={removeChild} programSpecificFields={selectedProgram.specificFields}/>
                    ))}
                    {errors.children && typeof errors.children === 'object' && !Array.isArray(errors.children) && (errors.children as any).message && (
                        <p className="text-sm text-destructive mt-1">{(errors.children as any).message}</p>
                    )}
                    <Button type="button" variant="outline" onClick={() => appendChild(defaultChildValues)} className="w-full sm:w-auto mt-2">
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Another Child
                    </Button>
                  </div>
                )}

                {!selectedProgram.isChildProgram && <AdultTraineeFields />}
                
                <Separator className="my-4 sm:my-6"/>
                <div className="text-right space-y-1">
                    <p className="text-xl sm:text-2xl font-bold font-headline text-primary">Total Estimated Price: ${calculatedPrice.toFixed(2)}</p>
                </div>
              </div>
            )}

            {/* STAGE 2: Payment Information */}
            {currentStage === 2 && selectedProgram && (
                <div className="space-y-4 sm:space-y-6">
                    <div className="p-3 sm:p-4 border rounded-lg bg-primary/10">
                      <h3 className="text-lg sm:text-xl font-semibold font-headline text-primary">Payment Summary</h3>
                      <p><strong>Program:</strong> {selectedProgram.label}</p>
                      {selectedProgram.isChildProgram && <p><strong>Number of Children:</strong> {getValues('children')?.length || 0}</p>}
                      <p className="mt-2 sm:mt-4 text-xl sm:text-2xl font-bold text-primary">Total Amount Due: ${calculatedPrice.toFixed(2)}</p>
                    </div>
                    
                    <div>
                        <Label htmlFor="couponCode">Coupon Code (Optional)</Label>
                        <div className="flex items-center gap-2 mt-1">
                            <Input id="couponCode" {...register('couponCode')} placeholder="Enter coupon code" className="flex-grow"/>
                            <Button type="button" variant="outline" size="sm" onClick={() => {/* TODO: Validate coupon */ toast({title: "Coupon Applied!", description:"(Example: 10% off - not functional yet)"})}}>Apply</Button>
                        </div>
                         {/* Placeholder for coupon validation message */}
                    </div>

                    <div>
                      <Label htmlFor="paymentProof.paymentType" className="text-base sm:text-lg">Select Payment Method</Label>
                      <Controller
                        name="paymentProof.paymentType"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger id="paymentProof.paymentType" className="mt-1"><SelectValue placeholder="Choose payment method" /></SelectTrigger>
                            <SelectContent>
                              {HAFSA_PAYMENT_METHODS.map(method => <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>)}
                              {/* Option for AI verified screenshot if needed */}
                              {/* <SelectItem value="screenshot_ai_verification">Upload Screenshot (AI Verified)</SelectItem> */}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.paymentProof?.paymentType && <p className="text-sm text-destructive mt-1">{errors.paymentProof.paymentType.message}</p>}
                    </div>

                    {/* Conditional fields for specific payment types if needed, e.g., screenshot upload */}
                    {/* For now, assuming these methods might require providing a transaction ID or a note */}
                     {watchedPaymentType && !['cbe', 'telebirr', 'zamzam', 'hijra', 'abyssinia'].includes(watchedPaymentType) && ( // Example if we re-add screenshot
                         <div>
                            <Label htmlFor="paymentProof.screenshotFile" className="text-base sm:text-lg">Upload Payment Screenshot</Label>
                            <Controller
                                name="paymentProof.screenshot"
                                control={control}
                                render={({ field: { onChange, value, ...restField } }) => (
                                    <Input id="paymentProof.screenshotFile" type="file" accept="image/*"
                                        onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)}
                                        {...restField} className="mt-1 text-xs sm:text-sm file:text-primary file:font-semibold" />
                                )} />
                            {errors.paymentProof?.screenshot && <p className="text-sm text-destructive mt-1">{errors.paymentProof.screenshot.message as string}</p>}
                         </div>
                     )}
                     { (HAFSA_PAYMENT_METHODS.map(pm => pm.value).includes(watchedPaymentType)) && (
                        <div>
                            <Label htmlFor="paymentProof.transactionId" className="text-base sm:text-lg">Transaction ID / Reference</Label>
                            <Input id="paymentProof.transactionId" {...register('paymentProof.transactionId')} className="mt-1 text-xs sm:text-sm" placeholder="Enter your transaction ID or reference"/>
                            {errors.paymentProof?.transactionId && <p className="text-sm text-destructive mt-1">{errors.paymentProof.transactionId.message}</p>}
                            <p className="text-xs text-muted-foreground mt-1">
                                Please make your payment to the designated Hafsa Madrassa account for {HAFSA_PAYMENT_METHODS.find(pm => pm.value === watchedPaymentType)?.label}
                                and enter the transaction reference number here. Payment instructions will be provided.
                            </p>
                        </div>
                     )}


                    {calculatedPrice === 0 && selectedProgramId && (
                        <div className="flex items-start sm:items-center p-2 sm:p-3 rounded-md bg-destructive/10 text-destructive text-xs sm:text-sm">
                            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 shrink-0 mt-0.5 sm:mt-0" />
                            <p>Total amount is $0.00. Please ensure selections are correct. Payment verification might be skipped if this is a free program.</p>
                        </div>
                    )}
                </div>
            )}

          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row sm:justify-between pt-4 sm:pt-6 p-4 sm:p-6 space-y-2 sm:space-y-0">
            {currentStage > 0 && currentStage < 3 && (
                <Button type="button" variant="outline" onClick={handlePreviousStage} disabled={isLoading} className="w-full sm:w-auto">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
            )}
            {currentStage < 2 && (
                 <Button type="button" onClick={handleNextStage} disabled={isLoading || !selectedProgramId} className="w-full sm:ml-auto">
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            )}
            {currentStage === 2 && (
                <Button type="submit" disabled={isLoading || calculatedPrice < 0 || !selectedProgramId} className="w-full sm:ml-auto">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    Submit Registration
                </Button>
            )}
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
  );
};

export default EnrollmentForm;
