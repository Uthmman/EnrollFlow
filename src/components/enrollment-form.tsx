
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, FormProvider, Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { User, CreditCard, CheckCircle, ArrowRight, Loader2, CalendarIcon, Users, PlusCircle, Trash2, UserCog, BookOpenText, Baby, GraduationCap, Briefcase, LayoutList, Copy, ArrowLeft, LogIn, Eye, EyeOff, Mail, ShieldQuestion, KeyRound, Phone, FileText, ShieldCheck, ShieldAlert, UploadCloud, BarChart3, FileUp } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation'; 

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { format } from "date-fns";
import { useIsMobile } from '@/hooks/use-mobile';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

import { db, auth } from '@/lib/firebaseConfig';
import { collection, addDoc, query, where, getDocs, orderBy } from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';

import { SCHOOL_GRADES, QURAN_LEVELS } from '@/lib/constants';
import type { HafsaProgram, HafsaPaymentMethod } from '@/types';
import { fetchProgramsFromFirestore } from '@/lib/programService';
import { fetchPaymentMethodsFromFirestore } from '@/lib/paymentMethodService';
import type { EnrollmentFormData, ParentInfoData, ParticipantInfoData, EnrolledParticipantData, RegistrationData, PaymentProofData as FormPaymentProofData } from '@/types';
import { EnrollmentFormSchema, ParentInfoSchema as RHFParentInfoSchema, ParticipantInfoSchema as RHFParticipantInfoSchema } from '@/types';
import { handlePaymentVerification } from '@/app/actions';
import Receipt from '@/components/receipt';
import { getTranslationsForLanguage, getTranslatedText } from '@/lib/translationService';
import type { LanguageCode } from '@/locales';

const LOCALSTORAGE_PARENT_KEY = 'enrollmentFormParentInfo_v_email_phone_v2';
const LOCALSTORAGE_PARTICIPANTS_KEY = 'enrollmentFormParticipants_v_email_phone_v2';

const defaultParentValues: ParentInfoData = {
  parentFullName: '',
  parentEmail: '',
  parentPhone1: '',
  password: '',
  confirmPassword: '',
};

const defaultParticipantValues: ParticipantInfoData = {
  firstName: '',
  gender: 'male' as 'male' | 'female',
  dateOfBirth: undefined as any,
  specialAttention: '',
  schoolGrade: '',
  quranLevel: '',
  guardianFullName: '',
  guardianPhone1: '',
  guardianPhone2: '',
  guardianTelegramPhoneNumber: '',
  guardianUsePhone1ForTelegram: false,
  guardianUsePhone2ForTelegram: false,
  certificateFile: undefined,
  certificateDataUri: undefined,
};

const defaultPaymentProofValues: FormPaymentProofData = {
    paymentType: '',
    proofSubmissionType: 'transactionId',
    transactionId: '',
    pdfLink: '',
    screenshot: undefined,
    screenshotDataUri: undefined,
};


const ParticipantDetailFields: React.FC<{
    selectedProgram: HafsaProgram;
    onSave: (data: ParticipantInfoData) => void;
    onCancel: () => void;
    isLoading: boolean;
    currentLanguage: LanguageCode;
}> = ({ selectedProgram, onSave, onCancel, isLoading, currentLanguage }) => {

  const { control, register, handleSubmit: handleParticipantSubmit, formState: { errors: participantErrors }, reset: resetParticipantForm, setValue, watch: watchParticipantForm } = useForm<ParticipantInfoData>({
    resolver: zodResolver(RHFParticipantInfoSchema),
    defaultValues: defaultParticipantValues,
  });

  const mainFormMethods = useFormContext<EnrollmentFormData>();
  const parentAccountInfo = mainFormMethods.getValues('parentInfo');
  const [t, setT] = useState<Record<string, string>>({});
  const [selectedCertificateFileName, setSelectedCertificateFileName] = useState<string | null>(null);
  const certificateFileInputRef = React.useRef<HTMLInputElement>(null);


  const translateParticipantDetailFieldsContent = useCallback((lang: LanguageCode) => {
    const newTranslations = getTranslationsForLanguage(lang);
    setT(newTranslations);
  }, []);

  useEffect(() => {
    translateParticipantDetailFieldsContent(currentLanguage);
  }, [currentLanguage, translateParticipantDetailFieldsContent]);


  useEffect(() => {
    if (selectedProgram.category === 'arabic_women') {
        setValue('firstName', parentAccountInfo.parentFullName || '');
        setValue('guardianFullName', parentAccountInfo.parentFullName || '');
        setValue('guardianPhone1', parentAccountInfo.parentPhone1 || '');
        setValue('guardianTelegramPhoneNumber', parentAccountInfo.parentPhone1 || '');
        setValue('guardianUsePhone1ForTelegram', !!parentAccountInfo.parentPhone1);
        setValue('gender', 'female');
        setValue('dateOfBirth', defaultParticipantValues.dateOfBirth);
    } else if (selectedProgram.isChildProgram) {
        setValue('guardianFullName', parentAccountInfo.parentFullName || '');
        setValue('guardianPhone1', parentAccountInfo.parentPhone1 || '');
        setValue('firstName', defaultParticipantValues.firstName);
        setValue('gender', defaultParticipantValues.gender);
        setValue('dateOfBirth', defaultParticipantValues.dateOfBirth);
    } else {
        setValue('firstName', parentAccountInfo.parentFullName || '');
        setValue('guardianFullName', parentAccountInfo.parentFullName || '');
        setValue('guardianPhone1', parentAccountInfo.parentPhone1 || '');
        setValue('dateOfBirth', defaultParticipantValues.dateOfBirth);
        setValue('gender', defaultParticipantValues.gender);
    }

    setValue('specialAttention', defaultParticipantValues.specialAttention);
    setValue('schoolGrade', defaultParticipantValues.schoolGrade);
    setValue('quranLevel', defaultParticipantValues.quranLevel);
    setValue('guardianPhone2', defaultParticipantValues.guardianPhone2);
    setValue('certificateFile', defaultParticipantValues.certificateFile);
    setValue('certificateDataUri', defaultParticipantValues.certificateDataUri);
    setSelectedCertificateFileName(null);


    if (selectedProgram.category !== 'arabic_women' || !parentAccountInfo.parentPhone1) {
      setValue('guardianTelegramPhoneNumber', defaultParticipantValues.guardianTelegramPhoneNumber);
      setValue('guardianUsePhone1ForTelegram', defaultParticipantValues.guardianUsePhone1ForTelegram);
    }
    setValue('guardianUsePhone2ForTelegram', defaultParticipantValues.guardianUsePhone2ForTelegram);

  }, [selectedProgram, parentAccountInfo, setValue]);


  const guardianPhone1 = watchParticipantForm('guardianPhone1');
  const guardianPhone2 = watchParticipantForm('guardianPhone2');

  const actualOnSave = (data: ParticipantInfoData) => {
    onSave(data);
    resetParticipantForm(defaultParticipantValues);
    setSelectedCertificateFileName(null);
  };

  const handleCertificateFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setValue('certificateFile', file, { shouldValidate: true });
      setSelectedCertificateFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setValue('certificateDataUri', reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setValue('certificateFile', null);
      setSelectedCertificateFileName(null);
      setValue('certificateDataUri', undefined);
    }
  };


  const isArabicWomenProgram = selectedProgram.category === 'arabic_women';
  const isQuranKidsProgram = selectedProgram.category === 'quran_kids';

  const programSpecificFieldsLabel = selectedProgram.translations[currentLanguage]?.label || selectedProgram.translations.en.label;
  const participantLabel = isArabicWomenProgram ? (t.pdfTraineeInfo) : (t.pdfParticipantInfo);
  const contactLabel = isArabicWomenProgram ? (t.pdfTraineeContactInfo) : (t.pdfGuardianContactInfo);


  return (
    <Card className="mb-4 sm:mb-6 p-3 sm:p-4 border-dashed">
      <CardHeader className="flex flex-row justify-between items-center p-2 pb-1">
        <CardTitle className="text-lg sm:text-xl font-headline">{t.pdfAddDetailsFor} {programSpecificFieldsLabel}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-2 pt-1">
        <p className="text-sm text-primary font-medium flex items-center"><User className="mr-2 h-4 w-4" /> {participantLabel}</p>
        <div>
          <Label htmlFor="firstName">{isArabicWomenProgram ? t.pdfTraineeFullNameLabel : t.pdfParticipantFullNameLabel}</Label>
          <Input id="firstName" {...register("firstName")} placeholder={isArabicWomenProgram ? t.pdfTraineeFullNameLabel : t.pdfParticipantFullNameLabel} />
          {participantErrors.firstName && <p className="text-sm text-destructive mt-1">{getTranslatedText(participantErrors.firstName.message || "fallback.error", currentLanguage)}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
                <Label htmlFor="gender">{t.pdfGenderLabel}</Label>
                <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={isArabicWomenProgram && field.value === 'female'}>
                        <SelectTrigger id="gender"><SelectValue placeholder={t.pdfSelectGenderPlaceholder} /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="male">{t.pdfMaleOption}</SelectItem>
                            <SelectItem value="female">{t.pdfFemaleOption}</SelectItem>
                        </SelectContent>
                    </Select>
                    )}
                />
                {participantErrors.gender && <p className="text-sm text-destructive mt-1">{getTranslatedText(participantErrors.gender.message || "fallback.error", currentLanguage)}</p>}
            </div>
            <div>
                <Label htmlFor="dateOfBirth">{isArabicWomenProgram ? t.pdfTraineeDOBLabel : t.pdfParticipantDOBLabel}</Label>
                <Controller
                    name="dateOfBirth"
                    control={control}
                    render={({ field }) => (
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(new Date(field.value), "PPP") : <span>{t.pdfPickDatePlaceholder}</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={field.value ? new Date(field.value): undefined} onSelect={field.onChange} initialFocus disabled={(date) => date > new Date() || date < new Date("1920-01-01")} />
                        </PopoverContent>
                    </Popover>
                    )}
                />
                {participantErrors.dateOfBirth && <p className="text-sm text-destructive mt-1">{getTranslatedText(participantErrors.dateOfBirth.message || "fallback.error", currentLanguage)}</p>}
            </div>
        </div>

        {selectedProgram.specificFields?.map(field => {
            const translatedLabel = getTranslatedText(field.labelKey, currentLanguage);

            if (field.name === 'specialAttention') {
                return (
                    <div key={field.name}>
                        <Label htmlFor={field.name}>{translatedLabel}</Label>
                        <Textarea id={field.name} {...register(field.name as "specialAttention")} placeholder={translatedLabel} />
                        {participantErrors[field.name as keyof ParticipantInfoData] && <p className="text-sm text-destructive mt-1">{getTranslatedText(participantErrors[field.name as keyof ParticipantInfoData]?.message || "fallback.error", currentLanguage)}</p>}
                    </div>
                )
            }
            if (field.name === 'schoolGrade' || field.name === 'quranLevel') {
                 const options = field.name === 'schoolGrade' ? SCHOOL_GRADES : QURAN_LEVELS;
                 return (
                    <div key={field.name}>
                        <Label htmlFor={field.name}>{translatedLabel}</Label>
                         <Controller
                            name={field.name as "schoolGrade" | "quranLevel"}
                            control={control}
                            render={({ field: controllerField }) => (
                            <Select onValueChange={controllerField.onChange} value={controllerField.value}>
                                <SelectTrigger id={field.name}><SelectValue placeholder={`${t.pdfSelectPlaceholderPrefix}${translatedLabel.toLowerCase()}`} /></SelectTrigger>
                                <SelectContent>{options.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                            </Select>
                            )}
                        />
                        {participantErrors[field.name as keyof ParticipantInfoData] && <p className="text-sm text-destructive mt-1">{getTranslatedText(participantErrors[field.name as keyof ParticipantInfoData]?.message || "fallback.error", currentLanguage)}</p>}
                    </div>
                 )
            }
            return null;
        })}

        {isQuranKidsProgram && (
            <div>
                <Label htmlFor="certificateFile">{t.efCertificateUploadLabel || "Recent/Last Year Certificate (Optional)"}</Label>
                <div 
                    className="mt-1 flex items-center justify-center w-full p-3 border-2 border-dashed rounded-md cursor-pointer border-primary/30 hover:border-primary/50 bg-background hover:bg-muted/50 transition-colors"
                    onClick={() => certificateFileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        id="certificateFile"
                        accept="image/*,application/pdf"
                        className="hidden"
                        ref={certificateFileInputRef}
                        onChange={handleCertificateFileSelect}
                    />
                    <div className="text-center">
                        <FileUp className="w-8 h-8 mx-auto text-primary/60 mb-1" />
                        {selectedCertificateFileName ? (
                            <>
                                <p className="text-xs font-medium text-primary">{t.efFileSelectedLabel || "File Selected:"}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">{selectedCertificateFileName}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{t.efClickOrDragToChangeLabel || "Click to change"}</p>
                            </>
                        ) : (
                            <>
                                <p className="text-xs font-medium text-primary">{t.efClickToUploadCertificate || "Click to upload certificate"}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{t.efPdfOrImageLabel || "PDF or Image"}</p>
                            </>
                        )}
                    </div>
                </div>
                {participantErrors.certificateFile && <p className="text-sm text-destructive mt-1">{getTranslatedText(participantErrors.certificateFile.message || "fallback.error", currentLanguage)}</p>}
            </div>
        )}


        <Separator className="my-4" />
        <p className="text-sm text-primary font-medium flex items-center"><ShieldQuestion className="mr-2 h-4 w-4" /> {contactLabel}</p>
         <div>
          <Label htmlFor="guardianFullName">{isArabicWomenProgram ? t.pdfTraineeFullNameLabel : t.pdfGuardianFullNameLabel}</Label>
          <Input id="guardianFullName" {...register("guardianFullName")} placeholder={isArabicWomenProgram ? t.pdfTraineeFullNameLabel : t.pdfGuardianFullNameLabel} />
          {participantErrors.guardianFullName && <p className="text-sm text-destructive mt-1">{getTranslatedText(participantErrors.guardianFullName.message || "fallback.error", currentLanguage)}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <Label htmlFor="guardianPhone1">{isArabicWomenProgram ? t.pdfTraineePrimaryPhoneLabel : t.pdfGuardianPrimaryPhoneLabel}</Label>
            <Input id="guardianPhone1" {...register("guardianPhone1")} type="tel" placeholder={t.pdfPhonePlaceholder} />
            {participantErrors.guardianPhone1 && <p className="text-sm text-destructive mt-1">{getTranslatedText(participantErrors.guardianPhone1.message || "fallback.error", currentLanguage)}</p>}
          </div>
          <div>
            <Label htmlFor="guardianPhone2">{isArabicWomenProgram ? t.pdfTraineeSecondaryPhoneLabel : t.pdfGuardianSecondaryPhoneLabel}</Label>
            <Input id="guardianPhone2" {...register("guardianPhone2")} type="tel" placeholder={t.pdfPhonePlaceholder} />
            {participantErrors.guardianPhone2 && <p className="text-sm text-destructive mt-1">{getTranslatedText(participantErrors.guardianPhone2.message || "fallback.error", currentLanguage)}</p>}
          </div>
        </div>
        <div>
          <Label htmlFor="guardianTelegramPhoneNumber">{isArabicWomenProgram ? t.pdfTraineeTelegramPhoneLabel : t.pdfGuardianTelegramPhoneLabel}</Label>
          <Input id="guardianTelegramPhoneNumber" {...register("guardianTelegramPhoneNumber")} type="tel" placeholder={t.pdfTelegramPlaceholder} />
          {participantErrors.guardianTelegramPhoneNumber && <p className="text-sm text-destructive mt-1">{getTranslatedText(participantErrors.guardianTelegramPhoneNumber.message || "fallback.error", currentLanguage)}</p>}
          <div className="mt-2 space-y-1 text-sm">
            <Controller name="guardianUsePhone1ForTelegram" control={control} render={({field}) => (
                <div className="flex items-center gap-2">
                    <Checkbox id="guardianUsePhone1ForTelegram" checked={field.value} onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked && guardianPhone1) setValue('guardianTelegramPhoneNumber', guardianPhone1);
                        if (checked) setValue('guardianUsePhone2ForTelegram', false);
                    }} disabled={!guardianPhone1}/>
                    <Label htmlFor="guardianUsePhone1ForTelegram" className="font-normal">{isArabicWomenProgram ? t.pdfUseTraineePrimaryTelegramLabel : t.pdfUseGuardianPrimaryTelegramLabel}</Label>
                </div>
            )}/>
            {guardianPhone2 &&
            <Controller name="guardianUsePhone2ForTelegram" control={control} render={({field}) => (
                 <div className="flex items-center gap-2">
                    <Checkbox id="guardianUsePhone2ForTelegram" checked={field.value} onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked && guardianPhone2) setValue('guardianTelegramPhoneNumber', guardianPhone2);
                        if (checked) setValue('guardianUsePhone1ForTelegram', false);
                    }} disabled={!guardianPhone2}/>
                    <Label htmlFor="guardianUsePhone2ForTelegram" className="font-normal">{isArabicWomenProgram ? t.pdfUseTraineeSecondaryTelegramLabel : t.pdfUseGuardianSecondaryTelegramLabel}</Label>
                </div>
            )}/>}
          </div>
        </div>

      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 p-2 pt-1">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="w-full sm:w-auto">{t.pdfCancelButton}</Button>
          <Button type="button" onClick={handleParticipantSubmit(actualOnSave)} disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? <Loader2 className="animate-spin mr-2"/> : <PlusCircle className="mr-2 h-4 w-4" />} {isArabicWomenProgram ? t.pdfSaveTraineeButton : t.pdfSaveParticipantButton}
          </Button>
      </CardFooter>
    </Card>
  );
};

interface EnrollmentFormProps {
  onStageChange: (stage: 'initial' | 'accountCreated') => void;
  showAccountDialogFromParent: boolean;
  onCloseAccountDialog: () => void;
  currentLanguage: LanguageCode;
}

type DashboardTab = 'enrollments' | 'programs' | 'payment';

interface UserRegistrationRecord extends RegistrationData {
  id: string; // Firestore document ID
}

const ADMIN_EMAIL_FROM_ENV = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

const EnrollmentForm: React.FC<EnrollmentFormProps> = ({ onStageChange, showAccountDialogFromParent, onCloseAccountDialog, currentLanguage }) => {
  const [currentView, setCurrentView] = useState<'accountCreation' | 'dashboard' | 'addParticipant' | 'confirmation'>('accountCreation');
  const [activeDashboardTab, setActiveDashboardTab] = useState<DashboardTab>('enrollments');
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [isLoading, setIsLoading] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [registrationDataForReceipt, setRegistrationDataForReceipt] = useState<RegistrationData | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const router = useRouter();

  const [availablePrograms, setAvailablePrograms] = useState<HafsaProgram[]>([]);
  const [programsLoading, setProgramsLoading] = useState<boolean>(true);
  const [paymentMethods, setPaymentMethods] = useState<HafsaPaymentMethod[]>([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState<boolean>(true);
  
  const [userRegistrations, setUserRegistrations] = useState<UserRegistrationRecord[]>([]);
  const [isLoadingUserRegistrations, setIsLoadingUserRegistrations] = useState(false);


  const [programForNewParticipant, setProgramForNewParticipant] = useState<HafsaProgram | null>(null);
  const [showPasswordInDialog, setShowPasswordInDialog] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [t, setT] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);


  const methods = useForm<EnrollmentFormData>({
    resolver: zodResolver(EnrollmentFormSchema),
    defaultValues: {
      parentInfo: defaultParentValues,
      participants: [],
      agreeToTerms: false,
      couponCode: '',
      paymentProof: defaultPaymentProofValues,
      loginEmail: '',
      loginPassword: '',
    },
  });

  const { control, handleSubmit, formState: { errors }, setValue, getValues, trigger, watch, reset, register, resetField } = methods;


  const translateEnrollmentFormContent = useCallback((lang: LanguageCode) => {
    const newTranslations = getTranslationsForLanguage(lang);
    setT(newTranslations);
  }, []);

  useEffect(() => {
    translateEnrollmentFormContent(currentLanguage);
  }, [currentLanguage, translateEnrollmentFormContent]);

  const fetchUserRegistrations = useCallback(async (userId: string) => {
    if (!db) {
      console.error("[Form] Firestore not initialized. Cannot fetch user registrations.");
      return;
    }
    setIsLoadingUserRegistrations(true);
    try {
      const regsCollection = collection(db, 'registrations');
      const q = query(regsCollection, where('firebaseUserId', '==', userId), orderBy('registrationDate', 'desc'));
      
      const querySnapshot = await getDocs(q);
      const fetchedRegs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserRegistrationRecord));
      
      setUserRegistrations(fetchedRegs);
      console.log(`[Form] Fetched ${fetchedRegs.length} registrations for user ${userId}`);
    } catch (error: any) {
      console.error("[Form] Error fetching user registrations:", error);
      if (error.code === 'failed-precondition') {
          toast({ title: t.efErrorToastTitle || "Error", description: "A Firestore index is required for fetching your registrations. Please ask the admin to create it. Fetching unsorted data for now.", variant: "destructive", duration: 10000});
           try {
                const regsCollection = collection(db, 'registrations');
                // Fallback query without sorting
                const qFallback = query(regsCollection, where('firebaseUserId', '==', userId));
                const querySnapshotFallback = await getDocs(qFallback);
                const fetchedRegsFallback = querySnapshotFallback.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserRegistrationRecord));
                // Client-side sort as a fallback
                fetchedRegsFallback.sort((a, b) => {
                    const dateA = a.registrationDate ? new Date(a.registrationDate as string | Date).getTime() : 0;
                    const dateB = b.registrationDate ? new Date(b.registrationDate as string | Date).getTime() : 0;
                    return dateB - dateA;
                });
                setUserRegistrations(fetchedRegsFallback); 
           } catch (fallbackError) {
               console.error("[Form] Error fetching user registrations (fallback without sort):", fallbackError);
                toast({ title: t.efErrorToastTitle || "Error", description: t.efFetchUserRegErrorToastDesc || "Failed to fetch your registrations even with fallback.", variant: "destructive"});
           }
      } else {
        toast({ title: t.efErrorToastTitle || "Error", description: t.efFetchUserRegErrorToastDesc || "Failed to fetch your registrations.", variant: "destructive"});
      }
    } finally {
      setIsLoadingUserRegistrations(false);
    }
  }, [toast, t.efErrorToastTitle, t.efFetchUserRegErrorToastDesc]);


  useEffect(() => {
    const loadInitialData = async () => {
      console.log("[Form] loadInitialData: Starting to load programs and payment methods.");
      setProgramsLoading(true);
      setPaymentMethodsLoading(true);
      try {
        const fetchedPrograms = await fetchProgramsFromFirestore();
        console.log("[Form] loadInitialData: Fetched programs in useEffect", fetchedPrograms);
        setAvailablePrograms(fetchedPrograms);

        const fetchedPaymentMethods = await fetchPaymentMethodsFromFirestore();
        console.log("[Form] loadInitialData: Fetched payment methods in useEffect", fetchedPaymentMethods);
        setPaymentMethods(fetchedPaymentMethods);
        if (fetchedPaymentMethods.length > 0 && !getValues('paymentProof.paymentType')) {
           setValue('paymentProof.paymentType', fetchedPaymentMethods[0].value);
        }

      } catch (error) {
        console.error("[Form] loadInitialData: Error loading initial data:", error);
        if (Object.keys(t).length > 0) {
            toast({ title: t.efErrorToastTitle || "Error", description: t.efLoadDataErrorToastDesc || "Failed to load initial data.", variant: "destructive" });
        } else {
            toast({ title: "Error", description: "Failed to load initial data.", variant: "destructive" });
        }
      } finally {
        setProgramsLoading(false);
        setPaymentMethodsLoading(false);
        console.log("[Form] loadInitialData: Finished loading programs and payment methods.");
      }
    };
    loadInitialData();
  }, [toast, setValue, getValues, currentLanguage, t.efErrorToastTitle, t.efLoadDataErrorToastDesc]);


  const { fields: participantFields, append: appendParticipant, remove: removeParticipant, replace: replaceParticipants } = useFieldArray({
    control,
    name: "participants",
  });

  const clearLocalStorageData = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCALSTORAGE_PARENT_KEY);
      localStorage.removeItem(LOCALSTORAGE_PARTICIPANTS_KEY);
      setValue('parentInfo', defaultParentValues);
      replaceParticipants([]); // Use replace to clear the array
    }
  }, [setValue, replaceParticipants]);

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user && user.email) {
        fetchUserRegistrations(user.uid); 
        const savedParentInfoRaw = localStorage.getItem(LOCALSTORAGE_PARENT_KEY);

        if (savedParentInfoRaw) {
            try {
                const savedParentInfo = JSON.parse(savedParentInfoRaw) as ParentInfoData;
                if (savedParentInfo.parentEmail === user.email) {
                    setValue('parentInfo.parentFullName', savedParentInfo.parentFullName);
                    setValue('parentInfo.parentEmail', savedParentInfo.parentEmail);
                    setValue('parentInfo.parentPhone1', savedParentInfo.parentPhone1);
                } else {
                    localStorage.removeItem(LOCALSTORAGE_PARENT_KEY);
                    setValue('parentInfo.parentFullName', user.displayName || "");
                    setValue('parentInfo.parentEmail', user.email);
                    setValue('parentInfo.parentPhone1', '');
                }
            } catch (e) {
                console.error("Error parsing parent info from LS on auth change", e);
                localStorage.removeItem(LOCALSTORAGE_PARENT_KEY);
                setValue('parentInfo.parentFullName', user.displayName || "");
                setValue('parentInfo.parentEmail', user.email);
                setValue('parentInfo.parentPhone1', '');
            }
        } else {
            setValue('parentInfo.parentFullName', user.displayName || "");
            setValue('parentInfo.parentEmail', user.email);
            setValue('parentInfo.parentPhone1', '');
        }

        const savedParticipantsRaw = localStorage.getItem(LOCALSTORAGE_PARTICIPANTS_KEY);
        if (savedParticipantsRaw) {
            try {
                const savedParticipants = JSON.parse(savedParticipantsRaw) as {parentEmail: string, data: EnrolledParticipantData[]};
                if (savedParticipants.parentEmail === user.email) {
                     replaceParticipants(savedParticipants.data.map((p: EnrolledParticipantData) => ({
                        ...p,
                        participantInfo: {
                            ...p.participantInfo,
                            dateOfBirth: p.participantInfo.dateOfBirth ? new Date(p.participantInfo.dateOfBirth) : undefined,
                        }
                    })));
                } else {
                    localStorage.removeItem(LOCALSTORAGE_PARTICIPANTS_KEY);
                     replaceParticipants([]);
                }
            } catch (e) {
                console.error("Error parsing participants from LS on auth change", e);
                localStorage.removeItem(LOCALSTORAGE_PARTICIPANTS_KEY);
                replaceParticipants([]);
            }
        }
        
        const effectiveAdminEmail = ADMIN_EMAIL_FROM_ENV || 'admin@example.com';
        if (user.email === effectiveAdminEmail && router && typeof router.push === 'function' && !window.location.pathname.startsWith('/admin')) {
          console.log(`[EnrollmentForm] Admin user ${user.email} detected on non-admin page, redirecting to /admin.`);
          router.push('/admin');
        } else if (currentView === 'accountCreation' || currentView === 'confirmation') {
             setCurrentView('dashboard');
             setActiveDashboardTab('enrollments');
        }
        onStageChange('accountCreated');
      } else {
        if (currentView === 'dashboard') {
            clearLocalStorageData();
            setUserRegistrations([]); 
            setCurrentView('accountCreation');
            onStageChange('initial');
        }
      }
    });
    return () => unsubscribe();
  }, [auth, setValue, onStageChange, currentView, reset, clearLocalStorageData, currentLanguage, getValues, router, fetchUserRegistrations, replaceParticipants]);


 useEffect(() => {
    if (typeof window !== 'undefined' && !firebaseUser && Object.keys(t).length > 0) {
      try {
        const savedParentInfoRaw = localStorage.getItem(LOCALSTORAGE_PARENT_KEY);
        const savedParticipantsRaw = localStorage.getItem(LOCALSTORAGE_PARTICIPANTS_KEY);

        let loadedParentInfo: ParentInfoData | null = null;

        if (savedParentInfoRaw) {
          loadedParentInfo = JSON.parse(savedParentInfoRaw);
           setValue('parentInfo.parentFullName', loadedParentInfo?.parentFullName || '');
           setValue('parentInfo.parentEmail', loadedParentInfo?.parentEmail || '');
           setValue('parentInfo.parentPhone1', loadedParentInfo?.parentPhone1 || '');
        }

        if (loadedParentInfo?.parentEmail && loadedParentInfo?.password) {
          setCurrentView('dashboard');
          onStageChange('accountCreated');
          setActiveDashboardTab('enrollments');
          toast({ title: t.efWelcomeBackToastTitle || "Welcome Back!", description: t.efGuestSessionLoadedToastDesc || "Guest session loaded." });

           if (savedParticipantsRaw) {
             const localParticipants = JSON.parse(savedParticipantsRaw) as {parentEmail: string, data: EnrolledParticipantData[]};
             if(localParticipants.parentEmail === loadedParentInfo.parentEmail) {
                replaceParticipants(localParticipants.data.map((p: EnrolledParticipantData) => ({
                    ...p,
                    participantInfo: {
                        ...p.participantInfo,
                        dateOfBirth: p.participantInfo.dateOfBirth ? new Date(p.participantInfo.dateOfBirth) : undefined,
                    }
                })));
             }
           }
        }
      } catch (error) {
        console.error("Error loading data from localStorage:", error);
      }
    }
  }, [setValue, onStageChange, toast, firebaseUser, currentLanguage, t, replaceParticipants]);


  const watchedParticipants = watch('participants');
  const watchedPaymentType = watch('paymentProof.paymentType');
  const watchedProofSubmissionType = watch('paymentProof.proofSubmissionType');

  const dashboardTabsConfig = [
    { value: 'enrollments' as DashboardTab, desktopLabelKey: 'efDashManageEnrollmentsLabel', mobileLabelKey: 'efDashEnrollmentsTabLabel', icon: Users },
    { value: 'programs' as DashboardTab, desktopLabelKey: 'efDashViewProgramsLabel', mobileLabelKey: 'efDashProgramsTabLabel', icon: LayoutList },
    { value: 'payment' as DashboardTab, desktopLabelKey: 'efDashPaymentSubmissionLabel', mobileLabelKey: 'efDashPaymentTabLabel', icon: CreditCard },
  ];

  useEffect(() => {
    let total = 0;
    if (watchedParticipants && availablePrograms.length > 0) {
      watchedParticipants.forEach(enrolledParticipant => {
        const program = availablePrograms.find(p => p.id === enrolledParticipant.programId);
        if (program) {
          total += program.price;
        }
      });
    }
    setCalculatedPrice(total);
  }, [watchedParticipants, availablePrograms]);

  const handleAccountCreation = async () => {
    if (!auth) {
        toast({ title: t.efAuthErrorToastTitle || "Auth Error", description: t.efAuthInitFailedToastDesc || "Auth not initialized", variant: "destructive"});
        return;
    }
    const fieldsToValidate: (keyof ParentInfoData)[] = ['parentFullName', 'parentEmail', 'parentPhone1', 'password', 'confirmPassword'];
    const isValid = await trigger(fieldsToValidate.map(f => `parentInfo.${f}` as `parentInfo.${keyof ParentInfoData}` ));

    if (isValid) {
        setIsLoading(true);
        const { parentFullName, parentEmail, password, parentPhone1 } = getValues('parentInfo');
        try {
            await createUserWithEmailAndPassword(auth, parentEmail, password!);

            const currentParentInfo: ParentInfoData = { parentFullName, parentEmail, parentPhone1, password, confirmPassword: password! };
            if (typeof window !== 'undefined') {
                localStorage.setItem(LOCALSTORAGE_PARENT_KEY, JSON.stringify(currentParentInfo));
            }
            const desc = getTranslatedText('efWelcomeUserToastDescTpl', currentLanguage, {name: parentFullName});
            toast({ title: t.efAccountCreatedToastTitle || "Account Created!", description: desc });
        } catch (error: any) {
            console.error("Firebase registration error:", error);
            let errorMessage = t.efRegistrationFailedToastDesc || "Registration failed.";
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = t.efEmailInUseToastDesc || "Email already in use.";
            } else if (error.code === 'auth/weak-password') {
                errorMessage = t.efWeakPasswordToastDesc || "Password too weak.";
            }
            toast({ title: t.efRegistrationErrorToastTitle || "Registration Error", description: errorMessage, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    } else {
      toast({ title: t.efValidationErrorToastTitle || "Validation Error", description: t.efCheckEntriesToastDesc || "Check entries.", variant: "destructive" });
    }
  };

  const handleLoginAttempt = async () => {
    if (!auth) {
        toast({ title: t.efAuthErrorToastTitle || "Auth Error", description: t.efAuthInitFailedToastDesc || "Auth not initialized", variant: "destructive"});
        return;
    }
    const isValid = await trigger(['loginEmail', 'loginPassword']);
    if (isValid) {
      setIsLoading(true);
      const { loginEmail, loginPassword } = getValues();

      try {
        const userCredential = await signInWithEmailAndPassword(auth, loginEmail!, loginPassword!);
        const user = userCredential.user;
        const currentParentInfo = getValues('parentInfo'); 

        if (typeof window !== 'undefined') {
            localStorage.setItem(LOCALSTORAGE_PARENT_KEY, JSON.stringify({...currentParentInfo, parentEmail: user.email!, password: loginPassword, confirmPassword: loginPassword }));
        }
        
        const effectiveAdminEmail = ADMIN_EMAIL_FROM_ENV || 'admin@example.com';
        if (user && user.email === effectiveAdminEmail) {
          console.log(`[EnrollmentForm] Admin user ${user.email} logged in successfully. Redirecting to /admin.`);
          toast({ title: t.efLoginSuccessfulToastTitle || "Login Successful!", description: getTranslatedText('efAdminRedirectToastDesc', currentLanguage, { defaultValue: "Redirecting to admin panel..."}) });
          router.push('/admin');
        } else {
          const desc = getTranslatedText('efWelcomeBackUserToastDescTpl', currentLanguage, {nameOrEmail: user.displayName || user.email! });
          toast({ title: t.efLoginSuccessfulToastTitle || "Login Successful!", description: desc });
        }
      } catch (error: any) {
        console.error("Firebase login error:", error);
        let errorMessage = t.efInvalidEmailPasswordToastDesc || "Invalid credentials.";
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            errorMessage = t.efInvalidEmailPasswordToastDesc || "Invalid credentials.";
        }
        toast({ title: t.efLoginFailedToastTitle || "Login Failed", description: errorMessage, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    } else {
      toast({ title: t.efValidationErrorToastTitle || "Validation Error", description: t.efFillEmailPasswordToastDesc || "Fill email/password.", variant: "destructive" });
    }
  };

  const handleAddParticipantClick = () => {
    if (programsLoading) {
        toast({ title: t.efProgramsLoadingToastTitle || "Programs Loading", description: t.efWaitProgramsLoadedToastDesc || "Wait for programs."});
        return;
    }
    if (availablePrograms.length === 0) {
        toast({ title: t.efNoProgramsToastTitle || "No Programs", description: t.efNoProgramsDesc || "No programs available.", variant: "destructive"});
        return;
    }
    setProgramForNewParticipant(null);
    setCurrentView('addParticipant');
  };

  const handleProgramCardClick = (program: HafsaProgram) => {
    setProgramForNewParticipant(program);
    setCurrentView('addParticipant');
  };

  const handleSaveParticipant = (participantData: ParticipantInfoData) => {
    if (!programForNewParticipant) {
        toast({ title: t.efErrorToastTitle || "Error", description: t.efNoProgramSelectedToastDesc || "No program selected.", variant: "destructive" });
        return;
    }
    const newEnrolledParticipant: EnrolledParticipantData = {
        programId: programForNewParticipant.id,
        participantInfo: participantData,
    };
    appendParticipant(newEnrolledParticipant);
    const currentParentEmail = getValues('parentInfo.parentEmail');
     if (typeof window !== 'undefined' && currentParentEmail) {
        localStorage.setItem(LOCALSTORAGE_PARTICIPANTS_KEY, JSON.stringify({parentEmail: currentParentEmail, data: getValues('participants')}));
    }
    setCurrentView('dashboard');
    setActiveDashboardTab('enrollments');
    const programDisplayLabel = programForNewParticipant.translations[currentLanguage]?.label || programForNewParticipant.translations.en.label;
    const desc = getTranslatedText('efParticipantForProgramToastDescTpl', currentLanguage, {name: participantData.firstName, program: programDisplayLabel});
    toast({title: t.efParticipantAddedToastTitle || "Participant Added", description: desc});
  };

  const handleRemoveParticipant = (index: number) => {
    removeParticipant(index);
    const currentParticipants = getValues('participants');
    const currentParentEmail = getValues('parentInfo.parentEmail');
    if (typeof window !== 'undefined' && currentParentEmail) {
      localStorage.setItem(LOCALSTORAGE_PARTICIPANTS_KEY, JSON.stringify({parentEmail: currentParentEmail, data: currentParticipants}));
    }
  };

  const onSubmit = async (data: EnrollmentFormData) => {
    setIsLoading(true); // Moved to the very beginning
    console.log("[Form] onSubmit triggered. Data:", JSON.stringify(data, null, 2));
    try {
      if (data.participants && data.participants.length > 0 && !data.paymentProof) {
        toast({ title: t.efPaymentInfoMissingToastTitle || "Payment Info Missing", description: t.efProvidePaymentDetailsToastDesc || "Provide payment details.", variant: "destructive" });
        setActiveDashboardTab('payment');
        return; // Return early, isLoading will be reset in finally
      }

      if (data.paymentProof && !data.paymentProof.proofSubmissionType) {
        toast({ title: t.efProofSubmissionMissingToastTitle || "Proof Submission Missing", description: t.efSelectProofMethodToastDesc || "Select proof method.", variant: "destructive" });
        setActiveDashboardTab('payment');
        await trigger('paymentProof.proofSubmissionType');
        return; // Return early
      }

      let screenshotDataUriForAI: string | undefined = data.paymentProof?.screenshotDataUri;
      if (data.paymentProof?.proofSubmissionType === 'screenshot' && selectedFile) {
          screenshotDataUriForAI = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
          });
          setValue('paymentProof.screenshotDataUri', screenshotDataUriForAI, { shouldValidate: true });
      }


      const selectedBankMethod = paymentMethods.find(m => m.value === data.paymentProof?.paymentType);
      const selectedBankDetails = selectedBankMethod ? (selectedBankMethod.translations[currentLanguage] || selectedBankMethod.translations.en) : undefined;


      const verificationInput = {
        paymentProof: {
            ...data.paymentProof!,
            screenshotDataUri: screenshotDataUriForAI, 
        },
        expectedAmount: calculatedPrice,
        expectedAccountName: selectedBankDetails?.accountName,
        expectedAccountNumber: selectedBankMethod?.accountNumber,
      };
      console.log("[Form] Calling handlePaymentVerification with input:", verificationInput);
      const result = await handlePaymentVerification(verificationInput);
      console.log("[Form] handlePaymentVerification result:", result);


      const finalRegistrationData: RegistrationData = {
        parentInfo: data.parentInfo,
        participants: data.participants || [],
        agreeToTerms: data.agreeToTerms,
        couponCode: data.couponCode,
        paymentProof: {
            ...data.paymentProof!,
            screenshotDataUri: screenshotDataUriForAI 
        },
        calculatedPrice: calculatedPrice,
        paymentVerified: result.isPaymentValid,
        paymentVerificationDetails: result,
        registrationDate: new Date(),
        firebaseUserId: firebaseUser ? firebaseUser.uid : undefined,
      };
      console.log("[Form] Final registration data prepared:", finalRegistrationData);


      if (result.isPaymentValid) {
        if (!db) {
            toast({ title: t.efDbErrorToastTitle || "DB Error", description: t.efFirestoreInitFailedToastDesc || "Firestore not initialized.", variant: "destructive" });
            return; // Return early
        }
        try {
            const firestoreReadyData = {
                ...finalRegistrationData,
                registrationDate: finalRegistrationData.registrationDate.toISOString(),
                parentInfo: {
                    parentFullName: finalRegistrationData.parentInfo.parentFullName || '',
                    parentEmail: finalRegistrationData.parentInfo.parentEmail || '',
                    parentPhone1: finalRegistrationData.parentInfo.parentPhone1 || '',
                },
                participants: finalRegistrationData.participants.map(p => ({
                    ...p,
                    participantInfo: {
                        ...p.participantInfo,
                        dateOfBirth: p.participantInfo.dateOfBirth instanceof Date ? p.participantInfo.dateOfBirth.toISOString() : p.participantInfo.dateOfBirth,
                         certificateDataUri: p.participantInfo.certificateDataUri || undefined, // Ensure it's there or undefined
                    }
                })),
            };
            console.log("[Form] Attempting to save to Firestore (payment valid). Data:", JSON.stringify(firestoreReadyData, null, 2));
            const docRef = await addDoc(collection(db, "registrations"), firestoreReadyData);
            console.log("[Form] Registration data saved to Firestore. Document ID:", docRef.id);

            toast({
              title: t.efPaymentSubmittedSavedToastTitle || "Payment Submitted & Saved",
              description: result.message || (t.efPaymentVerifiedSavedToastDesc || "Payment verified and saved."),
              variant: "default",
              className: "bg-accent text-accent-foreground",
            });
            setRegistrationDataForReceipt(finalRegistrationData);
            setCurrentView('confirmation');
            clearLocalStorageData(); 
            setSelectedFile(null); 
            if (firebaseUser) fetchUserRegistrations(firebaseUser.uid); 

        } catch (firestoreError: any) {
            console.error("[Form] Error saving registration to Firestore (payment valid):", firestoreError);
            const desc = getTranslatedText('efRegSubmittedDbFailToastDescTpl', currentLanguage, {message: firestoreError.message});
            toast({
                title: t.efSavingErrorToastTitle || "Saving Error",
                description: desc,
                variant: "destructive",
            });
            setRegistrationDataForReceipt(finalRegistrationData); 
            setCurrentView('confirmation');
        }

      } else {
        let failureMessage = result.message || (t.efPaymentVerificationFailedToastDesc || "Payment verification failed.");
        if (result.reason && result.reason !== result.message) {
            failureMessage += ` Reason: ${result.reason}`;
        }
        toast({
          title: t.efPaymentIssueToastTitle || "Payment Issue",
          description: failureMessage,
          variant: "destructive",
        });
        if (db && (firebaseUser || getValues('parentInfo.parentEmail')) ) { 
           try {
                const firestoreReadyData = {
                    ...finalRegistrationData, 
                    registrationDate: finalRegistrationData.registrationDate.toISOString(),
                     parentInfo: {
                        parentFullName: finalRegistrationData.parentInfo.parentFullName || '',
                        parentEmail: finalRegistrationData.parentInfo.parentEmail || '',
                        parentPhone1: finalRegistrationData.parentInfo.parentPhone1 || '',
                    },
                    participants: finalRegistrationData.participants.map(p => ({
                        ...p,
                        participantInfo: {
                            ...p.participantInfo,
                            dateOfBirth: p.participantInfo.dateOfBirth instanceof Date ? p.participantInfo.dateOfBirth.toISOString() : p.participantInfo.dateOfBirth,
                            certificateDataUri: p.participantInfo.certificateDataUri || undefined,
                        }
                    })),
                };
                console.log("[Form] Attempting to save to Firestore (payment NOT valid). Data:", JSON.stringify(firestoreReadyData, null, 2));
                const docRef = await addDoc(collection(db, "registrations"), firestoreReadyData);
                console.log("[Form] Registration data (payment NOT valid) saved to Firestore. Document ID:", docRef.id);
                toast({ title: t.efRegSubmittedForReviewToastTitle || "Submitted for Review", description: t.efRegSubmittedForReviewToastDesc || "Your registration is submitted and will be reviewed."});
                setRegistrationDataForReceipt(finalRegistrationData);
                setCurrentView('confirmation');
                clearLocalStorageData();
                setSelectedFile(null);
                if (firebaseUser) fetchUserRegistrations(firebaseUser.uid);
           } catch (dbError: any) {
                console.error("[Form] Error saving non-verified registration to Firestore:", dbError);
                toast({ title: t.efSavingErrorToastTitle, description: getTranslatedText('efRegSubmittedDbFailToastDescTpl', currentLanguage, {message: dbError.message}), variant: "destructive" });
           }
        } else {
             console.warn("[Form] DB not available or user not logged in/no email, cannot save non-verified registration.");
        }
      }
    } catch (error: any) {
      console.error("[Form] Submission error:", error);
      const errorMessage = error.message || (t.efUnexpectedErrorToastDesc || "Unexpected error.");
      toast({
        title: t.efErrorToastTitle || "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false); // Ensure isLoading is reset
    }
  };

  const handleBackFromReceipt = () => {
    setRegistrationDataForReceipt(null);
    replaceParticipants([]); 
    setValue('agreeToTerms', false);
    setValue('couponCode', '');
    resetField('paymentProof');
    setValue('paymentProof', {...defaultPaymentProofValues, paymentType: paymentMethods[0]?.value || '' });
    setSelectedFile(null);


    if (!firebaseUser) {
        clearLocalStorageData();
        setCurrentView('accountCreation');
        onStageChange('initial');
    } else {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(LOCALSTORAGE_PARTICIPANTS_KEY); 
        }
        const effectiveAdminEmail = ADMIN_EMAIL_FROM_ENV || 'admin@example.com';
        if (firebaseUser.email === effectiveAdminEmail) {
          router.push('/admin');
        } else {
          setCurrentView('dashboard');
          setActiveDashboardTab('enrollments');
          fetchUserRegistrations(firebaseUser.uid); 
        }
    }
    toast({ title: t.efReadyNewEnrollmentToastTitle || "Ready for New Enrollment", description: t.efPreviousEnrollmentClearedToastDesc || "Previous enrollment cleared." });
  };

  const handleViewReceipt = (registration: UserRegistrationRecord) => {
    const receiptData: RegistrationData = {
        ...registration,
        registrationDate: new Date(registration.registrationDate as string | Date), 
        participants: registration.participants.map(p => ({
            ...p,
            participantInfo: {
                ...p.participantInfo,
                dateOfBirth: new Date(p.participantInfo.dateOfBirth as string | Date) 
            }
        }))
    };
    setRegistrationDataForReceipt(receiptData);
    setCurrentView('confirmation');
  };

  const getUniqueSelectedProgramsTerms = () => {
    if (!watchedParticipants || watchedParticipants.length === 0 || availablePrograms.length === 0) {
        return [];
    }
    const uniqueProgramIds = new Set<string>();
    const terms: { programId: string; label: string; terms: string }[] = [];
    watchedParticipants.forEach(enrolled => {
        if (!uniqueProgramIds.has(enrolled.programId)) {
            const program = availablePrograms.find(p => p.id === enrolled.programId);
            if (program && program.translations) {
                const translatedProgram = program.translations[currentLanguage] || program.translations.en;
                if (translatedProgram.termsAndConditions) {
                    terms.push({
                        programId: program.id,
                        label: translatedProgram.label,
                        terms: translatedProgram.termsAndConditions
                    });
                    uniqueProgramIds.add(program.id);
                }
            }
        }
    });
    return terms;
  };

  const uniqueProgramTerms = getUniqueSelectedProgramsTerms();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        setValue('paymentProof.screenshot', event.target.files, { shouldValidate: true });
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setValue('paymentProof.screenshotDataUri', reader.result as string);
        };
        reader.readAsDataURL(file);
    } else {
        setValue('paymentProof.screenshot', null);
        setSelectedFile(null);
        setValue('paymentProof.screenshotDataUri', undefined);
    }
  };

  if (currentView === 'confirmation' && registrationDataForReceipt) {
    return <Receipt data={registrationDataForReceipt} onBack={handleBackFromReceipt} allPrograms={availablePrograms} paymentMethods={paymentMethods} currentLanguage={currentLanguage} />;
  }

  const renderAccountCreation = () => (
    <>
        <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as 'register' | 'login')} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="register">{t.efRegisterNewAccountTab}</TabsTrigger>
            <TabsTrigger value="login">{t.efLoginExistingAccountTab}</TabsTrigger>
        </TabsList>
        <TabsContent value="register" className="space-y-4 sm:space-y-6">
             <Card className="mb-4 sm:mb-6 p-3 sm:p-4 border-primary/20 border shadow-none">
                <CardHeader className="p-2 pb-1">
                    <CardTitle className="text-lg sm:text-xl font-headline text-primary flex items-center">
                    <User className="mr-2 h-5 w-5"/> {t.efPrimaryAccountInfoTitle}
                    </CardTitle>
                    <CardDescription>{t.efPrimaryAccountInfoDesc}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-2 pt-1">
                    <div>
                        <Label htmlFor="parentInfo.parentFullName">{t.efFullNameLabel}</Label>
                        <Input id="parentInfo.parentFullName" {...register("parentInfo.parentFullName")} placeholder={t.efFullNameLabel} />
                        {errors.parentInfo?.parentFullName && <p className="text-sm text-destructive mt-1">{getTranslatedText(errors.parentInfo.parentFullName.message || "fallback.error", currentLanguage)}</p>}
                    </div>
                    <div>
                        <Label htmlFor="parentInfo.parentEmail">{t.efEmailLoginLabel}</Label>
                        <Input id="parentInfo.parentEmail" {...register("parentInfo.parentEmail")} type="email" placeholder={t.efEmailPlaceholder} />
                        {errors.parentInfo?.parentEmail && <p className="text-sm text-destructive mt-1">{getTranslatedText(errors.parentInfo.parentEmail.message || "fallback.error", currentLanguage)}</p>}
                    </div>
                     <div>
                        <Label htmlFor="parentInfo.parentPhone1">{t.efPrimaryPhoneLabelEF}</Label>
                        <Input id="parentInfo.parentPhone1" {...register("parentInfo.parentPhone1")} type="tel" placeholder={t.efPhonePlaceholderEF} />
                        {errors.parentInfo?.parentPhone1 && <p className="text-sm text-destructive mt-1">{getTranslatedText(errors.parentInfo.parentPhone1.message || "fallback.error", currentLanguage)}</p>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <Label htmlFor="parentInfo.password">{t.efPasswordLabel}</Label>
                            <Input id="parentInfo.password" {...register("parentInfo.password")} type="password" placeholder={t.efCreatePasswordPlaceholder} />
                            {errors.parentInfo?.password && <p className="text-sm text-destructive mt-1">{getTranslatedText(errors.parentInfo.password.message || "fallback.error", currentLanguage)}</p>}
                        </div>
                        <div>
                            <Label htmlFor="parentInfo.confirmPassword">{t.efConfirmPasswordLabel}</Label>
                            <Input id="parentInfo.confirmPassword" {...register("parentInfo.confirmPassword")} type="password" placeholder={t.efConfirmPasswordPlaceholder} />
                            {errors.parentInfo?.confirmPassword && <p className="text-sm text-destructive mt-1">{getTranslatedText(errors.parentInfo.confirmPassword.message || "fallback.error", currentLanguage)}</p>}
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Button type="button" onClick={handleAccountCreation} disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="animate-spin mr-2"/> : <Mail className="mr-2 h-4 w-4" />} {t.efCreateAccountButton} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </TabsContent>
        <TabsContent value="login" className="space-y-4 sm:space-y-6">
            <Card className="p-3 sm:p-4 border-primary/20">
            <CardHeader className="p-2 pb-1">
                <CardTitle className="text-lg sm:text-xl font-headline text-primary flex items-center">
                <LogIn className="mr-2 h-5 w-5"/> {t.efLoginTitle}
                </CardTitle>
                <CardDescription>{t.efLoginDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-2 pt-1">
                <div>
                <Label htmlFor="loginEmail">{t.efEmailLabel}</Label>
                <Input id="loginEmail" {...register('loginEmail')} placeholder={t.efEmailPlaceholder} type="email"/>
                {errors.loginEmail && <p className="text-sm text-destructive mt-1">{getTranslatedText(errors.loginEmail.message || "fallback.error", currentLanguage)}</p>}
                </div>
                <div>
                <Label htmlFor="loginPassword">{t.efPasswordLabel}</Label>
                <Input id="loginPassword" {...register('loginPassword')} type="password" placeholder={t.efLoginPasswordPlaceholder} />
                {errors.loginPassword && <p className="text-sm text-destructive mt-1">{getTranslatedText(errors.loginPassword.message || "fallback.error", currentLanguage)}</p>}
                </div>
            </CardContent>
            </Card>
            <Button type="button" onClick={handleLoginAttempt} disabled={isLoading} className="w-full">
             {isLoading ? <Loader2 className="animate-spin mr-2"/> : <KeyRound className="mr-2 h-4 w-4" />} {t.efLoginButton} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </TabsContent>
        </Tabs>
    </>
  );

  const renderAddParticipant = () => (
    <div className="space-y-4 sm:space-y-6">
      {!programForNewParticipant ? (
        <div>
          <h3 className="text-xl sm:text-2xl font-semibold mb-1 text-primary">{t.efSelectProgramTitle}</h3>
          <p className="text-muted-foreground mb-4 text-sm">{t.efChooseProgramDesc}</p>
          {programsLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="p-0">
                        <CardHeader className="pb-2 pt-3 px-3 sm:px-4">
                            <Skeleton className="h-6 w-3/4 mb-1" />
                            <Skeleton className="h-4 w-full" />
                        </CardHeader>
                        <CardContent className="text-xs sm:text-sm flex-grow px-3 sm:px-4 pb-2 space-y-1">
                            <Skeleton className="h-3 w-1/2" />
                            <Skeleton className="h-3 w-2/3" />
                        </CardContent>
                        <CardFooter className="pt-2 px-3 sm:px-4 pb-3">
                            <Skeleton className="h-5 w-1/4" />
                        </CardFooter>
                    </Card>
                ))}
            </div>
          )}
          {!programsLoading && availablePrograms.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {availablePrograms.map(prog => {
                let IconComponent;
                switch(prog.category) {
                  case 'daycare': IconComponent = Baby; break;
                  case 'quran_kids': IconComponent = GraduationCap; break;
                  case 'arabic_women': IconComponent = Briefcase; break;
                  default: IconComponent = BookOpenText;
                }
                const progTranslated = prog.translations[currentLanguage] || prog.translations.en;

                return (
                  <Card
                    key={prog.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col p-0"
                    onClick={() => handleProgramCardClick(prog)}
                  >
                    <CardHeader className="pb-2 pt-3 px-3 sm:px-4">
                      <div className="flex items-center space-x-2 sm:space-x-3 mb-1">
                          <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                          <CardTitle className="text-base sm:text-lg text-primary">{progTranslated.label}</CardTitle>
                      </div>
                      <CardDescription className="text-xs sm:text-sm">{progTranslated.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-xs sm:text-sm flex-grow px-3 sm:px-4 pb-2">
                      {prog.ageRange && <p><strong>{t.efAgeLabel}:</strong> {prog.ageRange}</p>}
                      {prog.duration && <p><strong>{t.efDurationLabel}:</strong> {prog.duration}</p>}
                      {prog.schedule && <p><strong>{t.efScheduleLabel}:</strong> {prog.schedule}</p>}
                    </CardContent>
                    <CardFooter className="pt-2 px-3 sm:px-4 pb-3">
                      <p className="text-sm sm:text-base font-semibold text-accent">Br{prog.price.toFixed(2)}</p>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
           )}
           {!programsLoading && availablePrograms.length === 0 && (
             <p className="text-muted-foreground text-center py-4">{t.efNoProgramsAvailableMsg}</p>
           )}
           <Button type="button" variant="outline" onClick={() => { setCurrentView('dashboard'); setActiveDashboardTab('enrollments');}} className="w-full mt-4 sm:mt-6">
              <ArrowLeft className="mr-2 h-4 w-4" /> {t.efBackToDashboardButton}
          </Button>
        </div>
      ) : (
        <>
          <ParticipantDetailFields
              selectedProgram={programForNewParticipant}
              onSave={handleSaveParticipant}
              onCancel={() => { setProgramForNewParticipant(null);}}
              isLoading={isLoading}
              currentLanguage={currentLanguage}
          />
           <Button type="button" variant="outline" onClick={() => { setProgramForNewParticipant(null);}} className="w-full sm:w-auto mt-2">
              <ArrowLeft className="mr-2 h-4 w-4" /> {t.efBackToProgramSelectionButton}
            </Button>
        </>
      )}
    </div>
  );

  const selectedMethodObject = paymentMethods.find(m => m.value === watchedPaymentType);
  const selectedMethodDetails = selectedMethodObject ? (selectedMethodObject.translations[currentLanguage] || selectedMethodObject.translations.en) : undefined;


  const renderDashboard = () => (
    <Tabs value={activeDashboardTab} onValueChange={(value) => setActiveDashboardTab(value as DashboardTab)} className="w-full">
        {!isMobile && (
             <div className="mb-4 sm:mb-6 w-full">
                <div className="flex items-center justify-center space-x-2 sm:space-x-3 bg-muted p-1.5 rounded-lg shadow-sm mx-auto max-w-xl">
                    {dashboardTabsConfig.map(tab => (
                    <button
                        key={tab.value}
                        onClick={() => setActiveDashboardTab(tab.value)}
                        className={cn(
                        "flex-1 flex items-center justify-center gap-2 sm:gap-2.5 px-4 py-2.5 sm:px-6 sm:py-3 rounded-md transition-colors duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-muted text-sm sm:text-base font-medium",
                        activeDashboardTab === tab.value
                            ? "bg-primary text-primary-foreground shadow"
                            : "text-muted-foreground hover:bg-background hover:text-primary"
                        )}
                        aria-label={t[tab.desktopLabelKey]}
                        type="button"
                    >
                        <tab.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span>{t[tab.desktopLabelKey]}</span>
                    </button>
                    ))}
                </div>
            </div>
        )}

        <TabsContent value="enrollments" className="space-y-3 sm:space-y-4 pt-1 sm:pt-2">
            <h3 className="text-xl font-semibold text-primary">{t.efManageEnrollmentsTitle}</h3>
            {isLoadingUserRegistrations && <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
            {!isLoadingUserRegistrations && userRegistrations.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-md font-medium text-muted-foreground">{t.efYourSubmittedEnrollments || "Your Submitted Enrollments:"}</h4>
                    {userRegistrations.map((reg) => (
                        <Card key={reg.id} className="p-3 bg-background/70">
                           <div className="flex justify-between items-start mb-1">
                             <p className="text-xs text-muted-foreground">{t.rRegistrationDateLabel} {reg.registrationDate ? format(new Date(reg.registrationDate as string | Date), "MMM d, yyyy HH:mm") : "N/A"}</p>
                                {reg.paymentVerified ? (
                                <Badge variant="default" className="bg-accent text-accent-foreground hover:bg-accent/90">
                                    <ShieldCheck className="mr-1 h-3.5 w-3.5" /> {t['apVerifiedBadge'] || "Verified"}
                                </Badge>
                                ) : reg.paymentVerificationDetails?.message && (reg.paymentVerificationDetails.message as string).toLowerCase().includes("human review") ? (
                                <Badge variant="outline" className="border-orange-500 text-orange-600">
                                    <ShieldAlert className="mr-1 h-3.5 w-3.5" /> {t['apPendingReviewBadge'] || "Pending Review"}
                                </Badge>
                                ) : (
                                <Badge variant="destructive">
                                    <ShieldAlert className="mr-1 h-3.5 w-3.5" />
                                    {t['apNotVerifiedBadge'] || "Not Verified"}
                                </Badge>
                                )}
                           </div>
                            {reg.participants.map((p, idx) => {
                                const program = availablePrograms.find(prog => prog.id === p.programId);
                                const progTranslated = program ? (program.translations[currentLanguage] || program.translations.en) : { label: t.efUnknownProgramText };
                                return (
                                    <div key={`${reg.id}-${idx}`} className="py-1">
                                        <p><span className="font-semibold">{p.participantInfo.firstName}</span> - {progTranslated.label} (Br{program?.price.toFixed(2)})</p>
                                    </div>
                                );
                            })}
                             <Button size="sm" variant="outline" onClick={() => handleViewReceipt(reg)} className="mt-2">
                                <FileText className="mr-2 h-4 w-4"/> {t.efViewReceiptButton || "View Receipt"}
                            </Button>
                        </Card>
                    ))}
                </div>
            )}

            {participantFields.length > 0 && (
                 <div className="mt-4">
                    <h4 className="text-md font-medium text-muted-foreground">{t.efInProgressEnrollment || "Enrollment in Progress:"}</h4>
                    {participantFields.map((field, index) => {
                        const enrolledParticipant = field as unknown as EnrolledParticipantData;
                        const program = availablePrograms.find(p => p.id === enrolledParticipant.programId);
                        const progTranslated = program ? (program.translations[currentLanguage] || program.translations.en) : { label: t.efUnknownProgramText || "Unknown Program" };
                        return (
                        <Card key={field.id} className="p-3 mb-2 bg-background/80 border-dashed">
                            <div className="flex justify-between items-start">
                            <div>
                                <p className="font-semibold text-md">{enrolledParticipant.participantInfo.firstName}</p>
                                <p className="text-xs text-muted-foreground">{progTranslated.label} - Br{program?.price.toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground mt-1">{t.efContactLabel}: {enrolledParticipant.participantInfo.guardianFullName} ({enrolledParticipant.participantInfo.guardianPhone1})</p>
                            </div>
                            <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveParticipant(index)} className="text-destructive hover:text-destructive/80 p-1.5 h-auto">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            </div>
                        </Card>
                        );
                    })}
                 </div>
            )}

            {(participantFields.length === 0 && userRegistrations.length === 0 && !isLoadingUserRegistrations) && (
                <div className="text-center py-4 sm:py-6">
                    <p className="text-muted-foreground mb-3 sm:mb-4 text-sm">{t.efNoParticipantsMsg}</p>
                </div>
            )}

            <Button type="button" variant="default" onClick={handleAddParticipantClick} className="w-full sm:w-auto mt-4" disabled={programsLoading || availablePrograms.length === 0}>
                 {programsLoading ? <Loader2 className="animate-spin mr-2"/> : <PlusCircle className="mr-2 h-4 w-4" />} {t.efAddNewEnrollmentButton || "Start New Enrollment"}
            </Button>
        </TabsContent>

        <TabsContent value="programs" className="space-y-3 sm:space-y-4 pt-1 sm:pt-2">
            <h3 className="text-xl font-semibold text-primary mb-2">{t.efAvailableProgramsTitle}</h3>
             {programsLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i} className="p-0">
                            <CardHeader className="pb-2 pt-3 px-3 sm:px-4">
                                <Skeleton className="h-6 w-3/4 mb-1" />
                                <Skeleton className="h-4 w-full" />
                            </CardHeader>
                            <CardContent className="text-xs sm:text-sm flex-grow px-3 sm:px-4 pb-2 space-y-1">
                                <Skeleton className="h-3 w-1/2" />
                                <Skeleton className="h-3 w-2/3" />
                            </CardContent>
                            <CardFooter className="pt-2 px-3 sm:px-4 pb-3">
                                <Skeleton className="h-5 w-1/4" />
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
            {!programsLoading && availablePrograms.length > 0 && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {availablePrograms.map(prog => {
                    let IconComponent;
                    switch(prog.category) {
                        case 'daycare': IconComponent = Baby; break;
                        case 'quran_kids': IconComponent = GraduationCap; break;
                        case 'arabic_women': IconComponent = Briefcase; break;
                        default: IconComponent = BookOpenText;
                    }
                    const progTranslated = prog.translations[currentLanguage] || prog.translations.en;
                    return (
                        <Card
                          key={prog.id}
                          className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col p-0"
                          onClick={() => handleProgramCardClick(prog)}
                        >
                        <CardHeader className="pb-2 pt-3 px-3 sm:px-4">
                            <div className="flex items-center space-x-2 sm:space-x-3 mb-1">
                                <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                                <CardTitle className="text-base sm:text-lg text-primary">{progTranslated.label}</CardTitle>
                            </div>
                            <CardDescription className="text-xs sm:text-sm">{progTranslated.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="text-xs sm:text-sm flex-grow px-3 sm:px-4 pb-2">
                            {prog.ageRange && <p><strong>{t.efAgeLabel}:</strong> {prog.ageRange}</p>}
                            {prog.duration && <p><strong>{t.efDurationLabel}:</strong> {prog.duration}</p>}
                            {prog.schedule && <p><strong>{t.efScheduleLabel}:</strong> {prog.schedule}</p>}
                        </CardContent>
                        <CardFooter className="pt-2 px-3 sm:px-4 pb-3">
                            <p className="text-sm sm:text-base font-semibold text-accent">Br{prog.price.toFixed(2)}</p>
                        </CardFooter>
                        </Card>
                    );
                    })}
                </div>
            )}
           {!programsLoading && availablePrograms.length === 0 && (
             <p className="text-muted-foreground text-center py-4">{t.efNoProgramsViewingMsg}</p>
           )}
        </TabsContent>

        <TabsContent value="payment" className="space-y-4 sm:space-y-6 pt-1 sm:pt-2">
             <Card className="mb-4">
              <CardHeader className="p-3 sm:p-4 pb-2">
                <CardTitle className="text-md sm:text-lg">{t.efTermsConditionsTitle}</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0 space-y-3">
                {uniqueProgramTerms.length > 0 ? (
                   uniqueProgramTerms.map((programTerm, index) => (
                      <div key={programTerm.programId} className={cn(index > 0 && "mt-3 pt-3 border-t")}>
                        <h4 className="text-sm sm:text-base font-semibold text-primary mb-1">
                          {t.efTermsForProgramPrefix} {programTerm.label}
                        </h4>
                        <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap">
                          {programTerm.terms}
                        </p>
                      </div>
                    ))
                ) : (
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t.efGeneralTermsDescP1} <br/>
                    {t.efGeneralTermsDescP2} <br/>
                    {t.efGeneralTermsDescP3}
                  </p>
                )}
                <p className="text-xs sm:text-sm text-muted-foreground mt-3">
                  {t.efTermsAgreementP1} <br/>
                  {t.efTermsAgreementP2}
                </p>
                <div className="mt-3">
                    <Controller
                        name="agreeToTerms"
                        control={control}
                        render={({ field }) => (
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            <Checkbox id="agreeToTermsDashboard" checked={field.value} onCheckedChange={field.onChange} />
                            <Label htmlFor="agreeToTermsDashboard" className="text-xs sm:text-sm font-normal">{t.efAgreeTermsCheckboxLabel}</Label>
                        </div>
                        )}
                    />
                    {errors.agreeToTerms && <p className="text-sm text-destructive mt-1">{getTranslatedText(errors.agreeToTerms.message || "fallback.error", currentLanguage)}</p>}
                </div>
              </CardContent>
            </Card>

            <div className="p-3 sm:p-4 border rounded-lg bg-primary/10">
                <h3 className="text-base sm:text-lg font-semibold font-headline text-primary">{t.efPaymentSummaryTitle}</h3>
                <p className="mt-1 sm:mt-2 text-lg sm:text-xl font-bold text-primary">{t.efTotalAmountDueLabel}: Br{calculatedPrice.toFixed(2)}</p>
            </div>
            <div>
                <Label htmlFor="couponCode">{t.efCouponCodeLabel}</Label>
                <div className="flex items-center gap-2 mt-1">
                    <Input id="couponCode" {...register('couponCode')} placeholder={t.efCouponPlaceholder} className="flex-grow"/>
                    <Button type="button" variant="outline" size="sm" onClick={() => toast({title: t.efCouponAppliedToastTitle || "Coupon Applied!", description: t.efCouponExampleToastDesc || "Example discount"})}>{t.efApplyButton}</Button>
                </div>
                 {errors.couponCode && <p className="text-sm text-destructive mt-1">{getTranslatedText(errors.couponCode.message || "fallback.error", currentLanguage)}</p>}
            </div>
            <div>
                <Label htmlFor="paymentProof.paymentType" className="text-sm sm:text-base">{t.efSelectPaymentMethodLabel}</Label>
                {paymentMethodsLoading ? (
                    <Skeleton className="h-10 w-full mt-1" />
                ) : paymentMethods.length > 0 ? (
                    <Controller
                    name="paymentProof.paymentType"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value || paymentMethods[0]?.value} >
                        <SelectTrigger id="paymentProof.paymentType" className="mt-1"><SelectValue placeholder={t.efChoosePaymentMethodPlaceholder} /></SelectTrigger>
                        <SelectContent>
                            {paymentMethods.map(method => {
                                const methodTranslated = method.translations[currentLanguage] || method.translations.en;
                                return <SelectItem key={method.value} value={method.value}>{methodTranslated.label}</SelectItem>;
                            })}
                        </SelectContent>
                        </Select>
                    )}
                    />
                ) : (
                    <p className="text-sm text-muted-foreground mt-1">{t.efNoPaymentMethodsConfigured || "No payment methods configured."}</p>
                )}
                {errors.paymentProof?.paymentType && <p className="text-sm text-destructive mt-1">{getTranslatedText(errors.paymentProof.paymentType.message || "fallback.error", currentLanguage)}</p>}
            </div>

            {selectedMethodObject && (selectedMethodObject.accountNumber || selectedMethodDetails?.accountName) && (
                 <Card className="mt-4 p-3 sm:p-4 border-primary/20 bg-card shadow-sm rounded-lg">
                    <div className="flex items-center gap-3 sm:gap-4">
                      {selectedMethodObject.logoPlaceholder && (
                        <Image
                          src={selectedMethodObject.logoPlaceholder}
                          alt={`${selectedMethodDetails?.label || selectedMethodObject.value} logo`}
                          width={48}
                          height={48}
                          data-ai-hint={selectedMethodObject.dataAiHint || 'bank logo'}
                          className="rounded-lg h-12 w-12 object-contain flex-shrink-0"
                        />
                      )}
                      <div className="flex-grow space-y-0">
                        <p className="text-lg font-medium text-foreground">{selectedMethodDetails?.label || selectedMethodObject.value}</p>
                        {selectedMethodObject.accountNumber && <p className="text-xl font-bold font-mono text-primary">{selectedMethodObject.accountNumber}</p>}
                        {selectedMethodDetails?.accountName && (
                          <p className="text-sm text-muted-foreground">{selectedMethodDetails.accountName}</p>
                        )}
                      </div>
                      {selectedMethodObject.accountNumber && (
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(selectedMethodObject.accountNumber!);
                              toast({ title: t.efCopiedToastTitle || "Copied!", description: t.efAccountCopiedToastDesc || "Account copied." });
                            } catch (err) {
                              toast({ title: t.efCopyFailedToastTitle || "Copy Failed", description: t.efCopyAccountFailedToastDesc || "Could not copy.", variant: "destructive" });
                            }
                          }}
                          className="p-1.5 sm:p-2 h-auto text-sm self-center text-primary hover:bg-primary/10 flex-shrink-0"
                          aria-label={t.efCopyButton || "Copy account number"}
                        >
                          <Copy className="mr-1 h-4 w-4 sm:mr-1.5 sm:h-4 sm:w-4" />
                          {t.efCopyButton}
                        </Button>
                      )}
                    </div>
                    {selectedMethodDetails?.additionalInstructions && (
                      <p className="text-xs text-muted-foreground italic mt-3 pt-3 border-t border-border/50">
                        {selectedMethodDetails.additionalInstructions}
                      </p>
                    )}
                 </Card>
            )}

            {watchedPaymentType && (
              <div className="mt-4 space-y-3">
                <Label className="text-sm sm:text-base">{t.efProofSubmissionMethodLabel}</Label>
                <Controller
                  name="paymentProof.proofSubmissionType"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-col sm:flex-row gap-2 sm:gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="transactionId" id="proofTransactionId" />
                        <Label htmlFor="proofTransactionId" className="font-normal">{t.efTransactionIdOption}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="screenshot" id="proofScreenshot" />
                        <Label htmlFor="proofScreenshot" className="font-normal">{t.efUploadScreenshotOption}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pdfLink" id="proofPdfLink" />
                        <Label htmlFor="proofPdfLink" className="font-normal">{t.efProvidePdfLinkOption}</Label>
                      </div>
                    </RadioGroup>
                  )}
                />
                {errors.paymentProof?.proofSubmissionType && <p className="text-sm text-destructive mt-1">{getTranslatedText(errors.paymentProof.proofSubmissionType.message || "fallback.error", currentLanguage)}</p>}

                {watchedProofSubmissionType === 'transactionId' && (
                  <div>
                    <Label htmlFor="paymentProof.transactionId" className="text-sm">{t.efTransactionIdLabel}</Label>
                    <Input id="paymentProof.transactionId" {...register('paymentProof.transactionId')} className="mt-1 text-xs sm:text-sm" placeholder={t.efTransactionIdPlaceholder}/>
                    {errors.paymentProof?.transactionId && <p className="text-sm text-destructive mt-1">{getTranslatedText(errors.paymentProof.transactionId.message || "fallback.error", currentLanguage)}</p>}
                  </div>
                )}
                 {watchedProofSubmissionType === 'screenshot' && (
                  <div className="space-y-2">
                    <Label htmlFor="paymentProof.screenshotFile" className="text-sm">{t.efUploadScreenshotLabel}</Label>
                    <div 
                        className="flex items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer border-primary/50 hover:border-primary bg-background hover:bg-muted transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                setValue('paymentProof.screenshot', e.dataTransfer.files, { shouldValidate: true });
                                setSelectedFile(e.dataTransfer.files[0]);
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                    setValue('paymentProof.screenshotDataUri', reader.result as string);
                                };
                                reader.readAsDataURL(e.dataTransfer.files[0]);
                            }
                        }}
                    >
                        <input
                            type="file"
                            id="paymentProof.screenshotFile"
                            accept="image/*,application/pdf"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                        />
                        <div className="text-center">
                            <UploadCloud className="w-10 h-10 mx-auto text-primary/70 mb-2" />
                            {selectedFile ? (
                                <>
                                    <p className="text-sm font-medium text-primary">{t.efFileSelectedLabel || "File Selected:"}</p>
                                    <p className="text-xs text-muted-foreground truncate max-w-xs">{selectedFile.name}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{t.efClickOrDragToChangeLabel || "Click or drag to change"}</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm font-medium text-primary">{t.efDragDropOrClickLabel || "Drag 'n' drop a file here, or click to select"}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{t.efScreenshotDesc}</p>
                                </>
                            )}
                        </div>
                    </div>
                    {errors.paymentProof?.screenshot && <p className="text-sm text-destructive mt-1">{getTranslatedText((errors.paymentProof.screenshot as any).message || "fallback.error", currentLanguage)}</p>}
                  </div>
                )}
                {watchedProofSubmissionType === 'pdfLink' && (
                  <div>
                    <Label htmlFor="paymentProof.pdfLink" className="text-sm">{t.efPdfLinkLabel}</Label>
                    <Input id="paymentProof.pdfLink" {...register('paymentProof.pdfLink')} className="mt-1 text-xs sm:text-sm" placeholder={t.efPdfLinkPlaceholder}/>
                    {errors.paymentProof?.pdfLink && <p className="text-sm text-destructive mt-1">{getTranslatedText(errors.paymentProof.pdfLink.message || "fallback.error", currentLanguage)}</p>}
                  </div>
                )}
              </div>
            )}
        </TabsContent>

        {isMobile && currentView === 'dashboard' && (
             <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-auto">
                <div className="flex items-center justify-center space-x-1 bg-primary text-primary-foreground p-1.5 rounded-full shadow-xl border border-primary-foreground/20">
                    {dashboardTabsConfig.map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => setActiveDashboardTab(tab.value)}
                            className={cn(
                                "flex flex-col items-center justify-center p-2 rounded-full transition-all duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-primary h-14 sm:w-auto",
                                "w-[80px]", 
                                activeDashboardTab === tab.value
                                    ? "bg-primary-foreground text-primary scale-105 shadow-md"
                                    : "hover:bg-white/20"
                            )}
                            aria-label={t[tab.mobileLabelKey]}
                            type="button"
                        >
                            <tab.icon className="h-5 w-5 mb-0.5" />
                            <span className="text-xs font-medium">{t[tab.mobileLabelKey]}</span>
                        </button>
                    ))}
                </div>
            </div>
        )}
    </Tabs>
  );

  const parentInfoForDialog = getValues('parentInfo');

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
        <Card className="w-full max-w-2xl mx-auto shadow-xl border-none sm:border sm:rounded-lg">

           <CardContent className={cn("min-h-[300px] sm:min-h-[350px] p-3 sm:p-6", isMobile && currentView === 'dashboard' && "pb-24")}>
            {currentView === 'accountCreation' && renderAccountCreation()}
            {currentView === 'dashboard' && renderDashboard()}
            {currentView === 'addParticipant' && renderAddParticipant()}
          </CardContent>

          {currentView === 'dashboard' && (
            <CardFooter className="flex flex-col sm:flex-row justify-center items-center pt-3 sm:pt-4 p-3 sm:p-6 gap-y-2 sm:gap-y-0">
                {activeDashboardTab !== 'payment' ? (
                    <Button
                        type="button"
                        onClick={() => {
                            if (participantFields.length === 0 ) {
                                toast({title: t.efNoEnrollmentsToastTitle || "No Enrollments", description: t.efAddParticipantBeforePaymentToastDesc || "Add participant first.", variant: "destructive"});
                                return;
                            }
                             if (!firebaseUser && !localStorage.getItem(LOCALSTORAGE_PARENT_KEY)) {
                                toast({title: t.efAccountRequiredToastTitle || "Account Required", description: t.efCreateOrLoginToastDesc || "Create or login first.", variant: "destructive"});
                                setCurrentView('accountCreation');
                                return;
                            }
                            setActiveDashboardTab('payment')
                        }}
                        disabled={isLoading || (participantFields.length === 0) || paymentMethodsLoading}
                        className="w-full sm:ml-auto sm:w-auto"
                    >
                        {paymentMethodsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {t.efProceedToPaymentButton} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                ) : (
                    <Button type="submit"
                        disabled={isLoading || !getValues('agreeToTerms') || calculatedPrice <= 0 || !getValues('paymentProof.paymentType') || !getValues('paymentProof.proofSubmissionType') || paymentMethodsLoading || participantFields.length === 0}
                        className="w-full sm:ml-auto sm:w-auto"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t.efSubmittingButton || "Verifying & Submitting..."}
                            </>
                        ) : (
                            <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                {t.efSubmitRegistrationButtonPrefix}{calculatedPrice.toFixed(2)})
                            </>
                        )}
                    </Button>
                )}
            </CardFooter>
          )}
        </Card>
      </form>
       <Dialog open={showAccountDialogFromParent} onOpenChange={(isOpen) => { if (!isOpen) { setShowPasswordInDialog(false); } onCloseAccountDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center"><UserCog className="mr-2 h-5 w-5 text-primary"/>{t.efAccountInfoDialogTitle}</DialogTitle>
            <DialogDescription>
                {firebaseUser ? `${t.efLoggedInAsPrefix}${(firebaseUser.displayName || firebaseUser.email)}` :
                 (parentInfoForDialog?.parentEmail && parentInfoForDialog.password ? `${t.efPrimaryAccountGuestPrefix}${parentInfoForDialog.parentEmail}` :
                  parentInfoForDialog?.parentEmail ? `${t.efPrimaryAccountIncompletePrefix}${parentInfoForDialog.parentEmail}` :
                  t.efNoAccountActiveMsg)}
            </DialogDescription>
          </DialogHeader>
          { (firebaseUser || (parentInfoForDialog?.parentEmail && parentInfoForDialog.password)) && (
            <div className="space-y-2 py-2 text-sm">
              <p><strong>{t.efDialogFullNameLabel}</strong> {parentInfoForDialog?.parentFullName || firebaseUser?.displayName || 'N/A'}</p>
              <p><strong>{t.efDialogEmailLabel}</strong> {parentInfoForDialog?.parentEmail || firebaseUser?.email || 'N/A'}</p>
              {parentInfoForDialog?.parentPhone1 && <p><strong>{t.efDialogPhoneLabel}</strong> {parentInfoForDialog.parentPhone1}</p>}

              {parentInfoForDialog?.password && !firebaseUser && (
                <div className="flex items-center justify-between">
                    <p><strong>{t.efDialogPasswordLabel}</strong> {showPasswordInDialog ? parentInfoForDialog.password : '••••••••'}</p>
                    <Button variant="ghost" size="icon" onClick={() => setShowPasswordInDialog(!showPasswordInDialog)} className="h-7 w-7">
                        {showPasswordInDialog ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
              )}
            </div>
          )}
          {firebaseUser && (
             <Button onClick={async () => {
                if (auth) {
                    try {
                        await signOut(auth);
                        toast({title: t.efLoggedOutToastTitle || "Logged Out", description: t.efLoggedOutSuccessToastDesc || "Successfully logged out."});
                        onCloseAccountDialog();
                    } catch (error) {
                        toast({title: t.efLogoutErrorToastTitle || "Logout Error", description: t.efLogoutFailedToastDesc || "Failed to log out.", variant: "destructive"});
                    }
                }
             }} variant="outline" className="mt-2 w-full">{t.efDialogLogoutButton}</Button>
          )}
          <Button onClick={() => { setShowPasswordInDialog(false); onCloseAccountDialog(); }} className="mt-2 w-full">{t.efDialogCloseButton}</Button>
        </DialogContent>
      </Dialog>
    </FormProvider>
  );
};

export default EnrollmentForm;

