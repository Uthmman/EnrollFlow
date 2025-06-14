
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, FormProvider, Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { User, CreditCard, CheckCircle, ArrowRight, Loader2, CalendarIcon, Users, PlusCircle, Trash2, UserCog, BookOpenText, Baby, GraduationCap, Briefcase, LayoutList, Copy, ArrowLeft, LogIn, Eye, EyeOff, Mail, ShieldQuestion, KeyRound, Phone } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { format } from "date-fns";
import { useIsMobile } from '@/hooks/use-mobile';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from '@/components/ui/skeleton';

import { db, auth } from '@/lib/firebaseConfig'; 
import { collection, addDoc } from "firebase/firestore"; 
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';


import { HAFSA_PAYMENT_METHODS, HAFSA_PROGRAMS, SCHOOL_GRADES, QURAN_LEVELS, type HafsaProgram } from '@/lib/constants';
import type { EnrollmentFormData, ParentInfoData, ParticipantInfoData, EnrolledParticipantData, RegistrationData, ProgramField } from '@/types';
import { EnrollmentFormSchema, ParentInfoSchema as RHFParentInfoSchema, ParticipantInfoSchema as RHFParticipantInfoSchema } from '@/types';
import { handlePaymentVerification } from '@/app/actions';
import Receipt from '@/components/receipt';
import { getTranslatedText } from '@/lib/translationService';

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
};

const defaultPaymentProofValues: PaymentProofData = {
    paymentType: HAFSA_PAYMENT_METHODS[0]?.value || '',
    proofSubmissionType: 'transactionId',
    transactionId: '',
    pdfLink: '',
    screenshot: undefined,
    screenshotDataUri: undefined,
};

// Original English strings for ParticipantDetailFields
const O_PDF_ADD_DETAILS_FOR = "Add Details for ";
const O_PDF_PARTICIPANT_INFO = "Participant's Information";
const O_PDF_TRAINEE_INFO = "Trainee's Information";
const O_PDF_PARTICIPANT_FULL_NAME_LABEL = "Participant's Full Name";
const O_PDF_TRAINEE_FULL_NAME_LABEL = "Trainee's Full Name";
const O_PDF_GENDER_LABEL = "Gender";
const O_PDF_SELECT_GENDER_PLACEHOLDER = "Select gender";
const O_PDF_MALE_OPTION = "Male";
const O_PDF_FEMALE_OPTION = "Female";
const O_PDF_DOB_LABEL = "Date of Birth"; // Generic, will be prefixed
const O_PDF_PARTICIPANT_DOB_LABEL = "Participant's Date of Birth";
const O_PDF_TRAINEE_DOB_LABEL = "Trainee's Date of Birth";
const O_PDF_PICK_DATE_PLACEHOLDER = "Pick a date";
const O_PDF_GUARDIAN_CONTACT_INFO = "Guardian's Contact (for this participant)";
const O_PDF_TRAINEE_CONTACT_INFO = "Trainee's Contact (for this trainee)";
const O_PDF_GUARDIAN_FULL_NAME_LABEL = "Guardian's Full Name";
// Trainee's Full Name label already defined
const O_PDF_GUARDIAN_PRIMARY_PHONE_LABEL = "Guardian's Primary Phone";
const O_PDF_TRAINEE_PRIMARY_PHONE_LABEL = "Trainee's Primary Phone";
const O_PDF_PHONE_PLACEHOLDER = "e.g., 0911XXXXXX";
const O_PDF_GUARDIAN_SECONDARY_PHONE_LABEL = "Guardian's Secondary Phone (Optional)";
const O_PDF_TRAINEE_SECONDARY_PHONE_LABEL = "Trainee's Secondary Phone (Optional)";
const O_PDF_GUARDIAN_TELEGRAM_PHONE_LABEL = "Guardian's Telegram Phone";
const O_PDF_TRAINEE_TELEGRAM_PHONE_LABEL = "Trainee's Telegram Phone";
const O_PDF_TELEGRAM_PLACEHOLDER = "For Telegram updates";
const O_PDF_USE_GUARDIAN_PRIMARY_TELEGRAM_LABEL = "Use Guardian's Primary Phone for Telegram";
const O_PDF_USE_TRAINEE_PRIMARY_TELEGRAM_LABEL = "Use Trainee's Primary Phone for Telegram";
const O_PDF_USE_GUARDIAN_SECONDARY_TELEGRAM_LABEL = "Use Guardian's Secondary Phone for Telegram";
const O_PDF_USE_TRAINEE_SECONDARY_TELEGRAM_LABEL = "Use Trainee's Secondary Phone for Telegram";
const O_PDF_CANCEL_BUTTON = "Cancel";
const O_PDF_SAVE_PARTICIPANT_BUTTON = "Save Participant";
const O_PDF_SAVE_TRAINEE_BUTTON = "Save Trainee";


const ParticipantDetailFields: React.FC<{
    selectedProgram: HafsaProgram;
    onSave: (data: ParticipantInfoData) => void;
    onCancel: () => void;
    isLoading: boolean;
    currentLanguage: string;
}> = ({ selectedProgram, onSave, onCancel, isLoading, currentLanguage }) => {

  const { control, register, handleSubmit: handleParticipantSubmit, formState: { errors: participantErrors }, reset: resetParticipantForm, setValue, watch: watchParticipantForm } = useForm<ParticipantInfoData>({
    resolver: zodResolver(RHFParticipantInfoSchema),
    defaultValues: defaultParticipantValues,
  });

  const mainFormMethods = useFormContext<EnrollmentFormData>();
  const parentAccountInfo = mainFormMethods.getValues('parentInfo');

  // Translated states for ParticipantDetailFields
  const [tAddDetailsFor, setTAddDetailsFor] = useState(O_PDF_ADD_DETAILS_FOR);
  const [tParticipantInfo, setTParticipantInfo] = useState(O_PDF_PARTICIPANT_INFO);
  const [tTraineeInfo, setTTraineeInfo] = useState(O_PDF_TRAINEE_INFO);
  const [tParticipantFullNameLabel, setTParticipantFullNameLabel] = useState(O_PDF_PARTICIPANT_FULL_NAME_LABEL);
  const [tTraineeFullNameLabel, setTTraineeFullNameLabel] = useState(O_PDF_TRAINEE_FULL_NAME_LABEL);
  const [tGenderLabel, setTGenderLabel] = useState(O_PDF_GENDER_LABEL);
  const [tSelectGenderPlaceholder, setTSelectGenderPlaceholder] = useState(O_PDF_SELECT_GENDER_PLACEHOLDER);
  const [tMaleOption, setTMaleOption] = useState(O_PDF_MALE_OPTION);
  const [tFemaleOption, setTFemaleOption] = useState(O_PDF_FEMALE_OPTION);
  const [tParticipantDOBLabel, setTParticipantDOBLabel] = useState(O_PDF_PARTICIPANT_DOB_LABEL);
  const [tTraineeDOBLabel, setTTraineeDOBLabel] = useState(O_PDF_TRAINEE_DOB_LABEL);
  const [tPickDatePlaceholder, setTPickDatePlaceholder] = useState(O_PDF_PICK_DATE_PLACEHOLDER);
  const [tGuardianContactInfo, setTGuardianContactInfo] = useState(O_PDF_GUARDIAN_CONTACT_INFO);
  const [tTraineeContactInfo, setTTraineeContactInfo] = useState(O_PDF_TRAINEE_CONTACT_INFO);
  const [tGuardianFullNameLabel, setTGuardianFullNameLabel] = useState(O_PDF_GUARDIAN_FULL_NAME_LABEL);
  // Trainee full name label already covered
  const [tGuardianPrimaryPhoneLabel, setTGuardianPrimaryPhoneLabel] = useState(O_PDF_GUARDIAN_PRIMARY_PHONE_LABEL);
  const [tTraineePrimaryPhoneLabel, setTTraineePrimaryPhoneLabel] = useState(O_PDF_TRAINEE_PRIMARY_PHONE_LABEL);
  const [tPhonePlaceholder, setTPhonePlaceholder] = useState(O_PDF_PHONE_PLACEHOLDER);
  const [tGuardianSecondaryPhoneLabel, setTGuardianSecondaryPhoneLabel] = useState(O_PDF_GUARDIAN_SECONDARY_PHONE_LABEL);
  const [tTraineeSecondaryPhoneLabel, setTTraineeSecondaryPhoneLabel] = useState(O_PDF_TRAINEE_SECONDARY_PHONE_LABEL);
  const [tGuardianTelegramPhoneLabel, setTGuardianTelegramPhoneLabel] = useState(O_PDF_GUARDIAN_TELEGRAM_PHONE_LABEL);
  const [tTraineeTelegramPhoneLabel, setTTraineeTelegramPhoneLabel] = useState(O_PDF_TRAINEE_TELEGRAM_PHONE_LABEL);
  const [tTelegramPlaceholder, setTTelegramPlaceholder] = useState(O_PDF_TELEGRAM_PLACEHOLDER);
  const [tUseGuardianPrimaryTelegramLabel, setTUseGuardianPrimaryTelegramLabel] = useState(O_PDF_USE_GUARDIAN_PRIMARY_TELEGRAM_LABEL);
  const [tUseTraineePrimaryTelegramLabel, setTUseTraineePrimaryTelegramLabel] = useState(O_PDF_USE_TRAINEE_PRIMARY_TELEGRAM_LABEL);
  const [tUseGuardianSecondaryTelegramLabel, setTUseGuardianSecondaryTelegramLabel] = useState(O_PDF_USE_GUARDIAN_SECONDARY_TELEGRAM_LABEL);
  const [tUseTraineeSecondaryTelegramLabel, setTUseTraineeSecondaryTelegramLabel] = useState(O_PDF_USE_TRAINEE_SECONDARY_TELEGRAM_LABEL);
  const [tCancelButton, setTCancelButton] = useState(O_PDF_CANCEL_BUTTON);
  const [tSaveParticipantButton, setTSaveParticipantButton] = useState(O_PDF_SAVE_PARTICIPANT_BUTTON);
  const [tSaveTraineeButton, setTSaveTraineeButton] = useState(O_PDF_SAVE_TRAINEE_BUTTON);
  const [tProgramSpecificLabels, setTProgramSpecificLabels] = useState<Record<string, string>>({});


  const translateParticipantDetailFieldsContent = useCallback(async (lang: string) => {
    if (lang === 'en') {
        setTAddDetailsFor(O_PDF_ADD_DETAILS_FOR);
        setTParticipantInfo(O_PDF_PARTICIPANT_INFO);
        setTTraineeInfo(O_PDF_TRAINEE_INFO);
        setTParticipantFullNameLabel(O_PDF_PARTICIPANT_FULL_NAME_LABEL);
        setTTraineeFullNameLabel(O_PDF_TRAINEE_FULL_NAME_LABEL);
        setTGenderLabel(O_PDF_GENDER_LABEL);
        setTSelectGenderPlaceholder(O_PDF_SELECT_GENDER_PLACEHOLDER);
        setTMaleOption(O_PDF_MALE_OPTION);
        setTFemaleOption(O_PDF_FEMALE_OPTION);
        setTParticipantDOBLabel(O_PDF_PARTICIPANT_DOB_LABEL);
        setTTraineeDOBLabel(O_PDF_TRAINEE_DOB_LABEL);
        setTPickDatePlaceholder(O_PDF_PICK_DATE_PLACEHOLDER);
        setTGuardianContactInfo(O_PDF_GUARDIAN_CONTACT_INFO);
        setTTraineeContactInfo(O_PDF_TRAINEE_CONTACT_INFO);
        setTGuardianFullNameLabel(O_PDF_GUARDIAN_FULL_NAME_LABEL);
        setTGuardianPrimaryPhoneLabel(O_PDF_GUARDIAN_PRIMARY_PHONE_LABEL);
        setTTraineePrimaryPhoneLabel(O_PDF_TRAINEE_PRIMARY_PHONE_LABEL);
        setTPhonePlaceholder(O_PDF_PHONE_PLACEHOLDER);
        setTGuardianSecondaryPhoneLabel(O_PDF_GUARDIAN_SECONDARY_PHONE_LABEL);
        setTTraineeSecondaryPhoneLabel(O_PDF_TRAINEE_SECONDARY_PHONE_LABEL);
        setTGuardianTelegramPhoneLabel(O_PDF_GUARDIAN_TELEGRAM_PHONE_LABEL);
        setTTraineeTelegramPhoneLabel(O_PDF_TRAINEE_TELEGRAM_PHONE_LABEL);
        setTTelegramPlaceholder(O_PDF_TELEGRAM_PLACEHOLDER);
        setTUseGuardianPrimaryTelegramLabel(O_PDF_USE_GUARDIAN_PRIMARY_TELEGRAM_LABEL);
        setTUseTraineePrimaryTelegramLabel(O_PDF_USE_TRAINEE_PRIMARY_TELEGRAM_LABEL);
        setTUseGuardianSecondaryTelegramLabel(O_PDF_USE_GUARDIAN_SECONDARY_TELEGRAM_LABEL);
        setTUseTraineeSecondaryTelegramLabel(O_PDF_USE_TRAINEE_SECONDARY_TELEGRAM_LABEL);
        setTCancelButton(O_PDF_CANCEL_BUTTON);
        setTSaveParticipantButton(O_PDF_SAVE_PARTICIPANT_BUTTON);
        setTSaveTraineeButton(O_PDF_SAVE_TRAINEE_BUTTON);

        const originalSpecificLabels: Record<string, string> = {};
        selectedProgram.specificFields?.forEach(field => {
            originalSpecificLabels[field.name] = field.label;
        });
        setTProgramSpecificLabels(originalSpecificLabels);

    } else {
        setTAddDetailsFor(await getTranslatedText(O_PDF_ADD_DETAILS_FOR, lang, 'en'));
        setTParticipantInfo(await getTranslatedText(O_PDF_PARTICIPANT_INFO, lang, 'en'));
        setTTraineeInfo(await getTranslatedText(O_PDF_TRAINEE_INFO, lang, 'en'));
        setTParticipantFullNameLabel(await getTranslatedText(O_PDF_PARTICIPANT_FULL_NAME_LABEL, lang, 'en'));
        setTTraineeFullNameLabel(await getTranslatedText(O_PDF_TRAINEE_FULL_NAME_LABEL, lang, 'en'));
        setTGenderLabel(await getTranslatedText(O_PDF_GENDER_LABEL, lang, 'en'));
        setTSelectGenderPlaceholder(await getTranslatedText(O_PDF_SELECT_GENDER_PLACEHOLDER, lang, 'en'));
        setTMaleOption(await getTranslatedText(O_PDF_MALE_OPTION, lang, 'en'));
        setTFemaleOption(await getTranslatedText(O_PDF_FEMALE_OPTION, lang, 'en'));
        setTParticipantDOBLabel(await getTranslatedText(O_PDF_PARTICIPANT_DOB_LABEL, lang, 'en'));
        setTTraineeDOBLabel(await getTranslatedText(O_PDF_TRAINEE_DOB_LABEL, lang, 'en'));
        setTPickDatePlaceholder(await getTranslatedText(O_PDF_PICK_DATE_PLACEHOLDER, lang, 'en'));
        setTGuardianContactInfo(await getTranslatedText(O_PDF_GUARDIAN_CONTACT_INFO, lang, 'en'));
        setTTraineeContactInfo(await getTranslatedText(O_PDF_TRAINEE_CONTACT_INFO, lang, 'en'));
        setTGuardianFullNameLabel(await getTranslatedText(O_PDF_GUARDIAN_FULL_NAME_LABEL, lang, 'en'));
        setTGuardianPrimaryPhoneLabel(await getTranslatedText(O_PDF_GUARDIAN_PRIMARY_PHONE_LABEL, lang, 'en'));
        setTTraineePrimaryPhoneLabel(await getTranslatedText(O_PDF_TRAINEE_PRIMARY_PHONE_LABEL, lang, 'en'));
        setTPhonePlaceholder(await getTranslatedText(O_PDF_PHONE_PLACEHOLDER, lang, 'en'));
        setTGuardianSecondaryPhoneLabel(await getTranslatedText(O_PDF_GUARDIAN_SECONDARY_PHONE_LABEL, lang, 'en'));
        setTTraineeSecondaryPhoneLabel(await getTranslatedText(O_PDF_TRAINEE_SECONDARY_PHONE_LABEL, lang, 'en'));
        setTGuardianTelegramPhoneLabel(await getTranslatedText(O_PDF_GUARDIAN_TELEGRAM_PHONE_LABEL, lang, 'en'));
        setTTraineeTelegramPhoneLabel(await getTranslatedText(O_PDF_TRAINEE_TELEGRAM_PHONE_LABEL, lang, 'en'));
        setTTelegramPlaceholder(await getTranslatedText(O_PDF_TELEGRAM_PLACEHOLDER, lang, 'en'));
        setTUseGuardianPrimaryTelegramLabel(await getTranslatedText(O_PDF_USE_GUARDIAN_PRIMARY_TELEGRAM_LABEL, lang, 'en'));
        setTUseTraineePrimaryTelegramLabel(await getTranslatedText(O_PDF_USE_TRAINEE_PRIMARY_TELEGRAM_LABEL, lang, 'en'));
        setTUseGuardianSecondaryTelegramLabel(await getTranslatedText(O_PDF_USE_GUARDIAN_SECONDARY_TELEGRAM_LABEL, lang, 'en'));
        setTUseTraineeSecondaryTelegramLabel(await getTranslatedText(O_PDF_USE_TRAINEE_SECONDARY_TELEGRAM_LABEL, lang, 'en'));
        setTCancelButton(await getTranslatedText(O_PDF_CANCEL_BUTTON, lang, 'en'));
        setTSaveParticipantButton(await getTranslatedText(O_PDF_SAVE_PARTICIPANT_BUTTON, lang, 'en'));
        setTSaveTraineeButton(await getTranslatedText(O_PDF_SAVE_TRAINEE_BUTTON, lang, 'en'));

        const translatedSpecificLabels: Record<string, string> = {};
        if (selectedProgram.specificFields) {
            for (const field of selectedProgram.specificFields) {
                translatedSpecificLabels[field.name] = await getTranslatedText(field.label, lang, 'en');
            }
        }
        setTProgramSpecificLabels(translatedSpecificLabels);
    }
  }, [selectedProgram.specificFields]);

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
  };

  const isArabicWomenProgram = selectedProgram.category === 'arabic_women';
  const participantLabel = isArabicWomenProgram ? tTraineeInfo : tParticipantInfo;
  const contactLabel = isArabicWomenProgram ? tTraineeInfo : tGuardianContactInfo;


  return (
    <Card className="mb-4 sm:mb-6 p-3 sm:p-4 border-dashed">
      <CardHeader className="flex flex-row justify-between items-center p-2 pb-1">
        <CardTitle className="text-lg sm:text-xl font-headline">{tAddDetailsFor} {selectedProgram.label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-2 pt-1">
        <p className="text-sm text-primary font-medium flex items-center"><User className="mr-2 h-4 w-4" /> {participantLabel}</p>
        <div>
          <Label htmlFor="firstName">{isArabicWomenProgram ? tTraineeFullNameLabel : tParticipantFullNameLabel}</Label>
          <Input id="firstName" {...register("firstName")} placeholder={isArabicWomenProgram ? tTraineeFullNameLabel : tParticipantFullNameLabel} />
          {participantErrors.firstName && <p className="text-sm text-destructive mt-1">{participantErrors.firstName.message}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
                <Label htmlFor="gender">{tGenderLabel}</Label>
                <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={isArabicWomenProgram && field.value === 'female'}>
                        <SelectTrigger id="gender"><SelectValue placeholder={tSelectGenderPlaceholder} /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="male">{tMaleOption}</SelectItem>
                            <SelectItem value="female">{tFemaleOption}</SelectItem>
                        </SelectContent>
                    </Select>
                    )}
                />
                {participantErrors.gender && <p className="text-sm text-destructive mt-1">{participantErrors.gender.message}</p>}
            </div>
            <div>
                <Label htmlFor="dateOfBirth">{isArabicWomenProgram ? tTraineeDOBLabel : tParticipantDOBLabel}</Label>
                <Controller
                    name="dateOfBirth"
                    control={control}
                    render={({ field }) => (
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(new Date(field.value), "PPP") : <span>{tPickDatePlaceholder}</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={field.value ? new Date(field.value): undefined} onSelect={field.onChange} initialFocus disabled={(date) => date > new Date() || date < new Date("1920-01-01")} />
                        </PopoverContent>
                    </Popover>
                    )}
                />
                {participantErrors.dateOfBirth && <p className="text-sm text-destructive mt-1">{participantErrors.dateOfBirth.message}</p>}
            </div>
        </div>

        {selectedProgram.specificFields?.map(field => {
            const translatedLabel = tProgramSpecificLabels[field.name] || field.label;
            if (field.name === 'specialAttention') {
                return (
                    <div key={field.name}>
                        <Label htmlFor={field.name}>{translatedLabel}</Label>
                        <Textarea id={field.name} {...register(field.name as "specialAttention")} placeholder={translatedLabel} />
                        {participantErrors[field.name as keyof ParticipantInfoData] && <p className="text-sm text-destructive mt-1">{participantErrors[field.name as keyof ParticipantInfoData]?.message}</p>}
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
                                <SelectTrigger id={field.name}><SelectValue placeholder={`${getTranslatedText('Select', currentLanguage, 'en')} ${translatedLabel.toLowerCase()}`} /></SelectTrigger>
                                <SelectContent>{options.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                            </Select>
                            )}
                        />
                        {participantErrors[field.name as keyof ParticipantInfoData] && <p className="text-sm text-destructive mt-1">{participantErrors[field.name as keyof ParticipantInfoData]?.message}</p>}
                    </div>
                 )
            }
            return null;
        })}
        
        <Separator className="my-4" />
        <p className="text-sm text-primary font-medium flex items-center"><ShieldQuestion className="mr-2 h-4 w-4" /> {contactLabel}</p>
         <div>
          <Label htmlFor="guardianFullName">{isArabicWomenProgram ? tTraineeFullNameLabel : tGuardianFullNameLabel}</Label>
          <Input id="guardianFullName" {...register("guardianFullName")} placeholder={isArabicWomenProgram ? tTraineeFullNameLabel : tGuardianFullNameLabel} />
          {participantErrors.guardianFullName && <p className="text-sm text-destructive mt-1">{participantErrors.guardianFullName.message}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <Label htmlFor="guardianPhone1">{isArabicWomenProgram ? tTraineePrimaryPhoneLabel : tGuardianPrimaryPhoneLabel}</Label>
            <Input id="guardianPhone1" {...register("guardianPhone1")} type="tel" placeholder={tPhonePlaceholder} />
            {participantErrors.guardianPhone1 && <p className="text-sm text-destructive mt-1">{participantErrors.guardianPhone1.message}</p>}
          </div>
          <div>
            <Label htmlFor="guardianPhone2">{isArabicWomenProgram ? tTraineeSecondaryPhoneLabel : tGuardianSecondaryPhoneLabel}</Label>
            <Input id="guardianPhone2" {...register("guardianPhone2")} type="tel" placeholder={tPhonePlaceholder} />
            {participantErrors.guardianPhone2 && <p className="text-sm text-destructive mt-1">{participantErrors.guardianPhone2.message}</p>}
          </div>
        </div>
        <div>
          <Label htmlFor="guardianTelegramPhoneNumber">{isArabicWomenProgram ? tTraineeTelegramPhoneLabel : tGuardianTelegramPhoneLabel}</Label>
          <Input id="guardianTelegramPhoneNumber" {...register("guardianTelegramPhoneNumber")} type="tel" placeholder={tTelegramPlaceholder} />
          {participantErrors.guardianTelegramPhoneNumber && <p className="text-sm text-destructive mt-1">{participantErrors.guardianTelegramPhoneNumber.message}</p>}
          <div className="mt-2 space-y-1 text-sm">
            <Controller name="guardianUsePhone1ForTelegram" control={control} render={({field}) => (
                <div className="flex items-center gap-2">
                    <Checkbox id="guardianUsePhone1ForTelegram" checked={field.value} onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked && guardianPhone1) setValue('guardianTelegramPhoneNumber', guardianPhone1);
                        if (checked) setValue('guardianUsePhone2ForTelegram', false);
                    }} disabled={!guardianPhone1}/>
                    <Label htmlFor="guardianUsePhone1ForTelegram" className="font-normal">{isArabicWomenProgram ? tUseTraineePrimaryTelegramLabel : tUseGuardianPrimaryTelegramLabel}</Label>
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
                    <Label htmlFor="guardianUsePhone2ForTelegram" className="font-normal">{isArabicWomenProgram ? tUseTraineeSecondaryTelegramLabel : tUseGuardianSecondaryTelegramLabel}</Label>
                </div>
            )}/>}
          </div>
        </div>

      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 p-2 pt-1">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="w-full sm:w-auto">{tCancelButton}</Button>
          <Button type="button" onClick={handleParticipantSubmit(actualOnSave)} disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? <Loader2 className="animate-spin mr-2"/> : <PlusCircle className="mr-2 h-4 w-4" />} {isArabicWomenProgram ? tSaveTraineeButton : tSaveParticipantButton}
          </Button>
      </CardFooter>
    </Card>
  );
};

interface EnrollmentFormProps {
  onStageChange: (stage: 'initial' | 'accountCreated') => void;
  showAccountDialogFromParent: boolean;
  onCloseAccountDialog: () => void;
  currentLanguage: string;
}

type DashboardTab = 'enrollments' | 'programs' | 'payment';

// Original English strings for EnrollmentForm main component
const O_EF_WELCOME_BACK_TOAST_TITLE = "Welcome Back!";
const O_EF_GUEST_SESSION_LOADED_TOAST_DESC = "Your previous guest session details have been loaded. Login to save permanently.";
const O_EF_AUTH_ERROR_TOAST_TITLE = "Authentication Error";
const O_EF_AUTH_INIT_FAILED_TOAST_DESC = "Firebase Auth is not initialized.";
const O_EF_ACCOUNT_CREATED_TOAST_TITLE = "Account Created!";
const O_EF_WELCOME_USER_TOAST_DESC = (name: string) => `Welcome ${name}! You can now enroll participants.`;
const O_EF_REGISTRATION_ERROR_TOAST_TITLE = "Registration Error";
const O_EF_REGISTRATION_FAILED_TOAST_DESC = "Registration failed. Please try again.";
const O_EF_EMAIL_IN_USE_TOAST_DESC = "This email is already registered. Please log in or use a different email.";
const O_EF_WEAK_PASSWORD_TOAST_DESC = "Password is too weak. Please choose a stronger password.";
const O_EF_VALIDATION_ERROR_TOAST_TITLE = "Validation Error";
const O_EF_CHECK_ENTRIES_TOAST_DESC = "Please check your entries and try again.";
const O_EF_LOGIN_SUCCESSFUL_TOAST_TITLE = "Login Successful!";
const O_EF_WELCOME_BACK_USER_TOAST_DESC = (nameOrEmail: string) => `Welcome back, ${nameOrEmail}!`;
const O_EF_LOGIN_FAILED_TOAST_TITLE = "Login Failed";
const O_EF_INVALID_EMAIL_PASSWORD_TOAST_DESC = "Invalid email or password. Please try again.";
const O_EF_FILL_EMAIL_PASSWORD_TOAST_DESC = "Please fill in your email and password.";
const O_EF_PROGRAMS_LOADING_TOAST_TITLE = "Programs Loading";
const O_EF_WAIT_PROGRAMS_LOADED_TOAST_DESC = "Please wait until programs are loaded.";
const O_EF_NO_PROGRAMS_TOAST_TITLE = "No Programs Available";
const O_EF_NO_PROGRAMS_DESC = "There are no programs to enroll in at the moment.";
const O_EF_PARTICIPANT_ADDED_TOAST_TITLE = "Participant Added";
const O_EF_PARTICIPANT_FOR_PROGRAM_TOAST_DESC = (name: string, program: string) => `${name} has been added for ${program}.`;
const O_EF_PAYMENT_INFO_MISSING_TOAST_TITLE = "Payment Information Missing";
const O_EF_PROVIDE_PAYMENT_DETAILS_TOAST_DESC = "Please provide payment details.";
const O_EF_PROOF_SUBMISSION_MISSING_TOAST_TITLE = "Proof Submission Missing";
const O_EF_SELECT_PROOF_METHOD_TOAST_DESC = "Please select how you will provide payment proof.";
const O_EF_PAYMENT_SUBMITTED_SAVED_TOAST_TITLE = "Payment Submitted & Registration Saved!";
const O_EF_PAYMENT_VERIFIED_SAVED_TOAST_DESC = "Payment verified and registration data saved.";
const O_EF_DB_ERROR_TOAST_TITLE = "Database Error";
const O_EF_FIRESTORE_INIT_FAILED_TOAST_DESC = "Firestore is not initialized. Cannot save registration.";
const O_EF_SAVING_ERROR_TOAST_TITLE = "Saving Error";
const O_EF_REG_SUBMITTED_DB_FAIL_TOAST_DESC = (message: string) => `Registration submitted, but failed to save to database: ${message}. Please contact support.`;
const O_EF_PAYMENT_ISSUE_TOAST_TITLE = "Payment Issue";
const O_EF_PAYMENT_VERIFICATION_FAILED_TOAST_DESC = "Payment verification failed.";
const O_EF_ERROR_TOAST_TITLE = "Error";
const O_EF_UNEXPECTED_ERROR_TOAST_DESC = "An unexpected error occurred. Please try again.";
const O_EF_NO_PROGRAM_SELECTED_TOAST_DESC = "No program selected.";
const O_EF_READY_NEW_ENROLLMENT_TOAST_TITLE = "Ready for New Enrollment";
const O_EF_PREVIOUS_ENROLLMENT_CLEARED_TOAST_DESC = "Previous enrollment details cleared.";
const O_EF_LOGGED_OUT_TOAST_TITLE = "Logged Out";
const O_EF_LOGGED_OUT_SUCCESS_TOAST_DESC = "You have been successfully logged out.";
const O_EF_LOGOUT_ERROR_TOAST_TITLE = "Logout Error";
const O_EF_LOGOUT_FAILED_TOAST_DESC = "Failed to log out.";
const O_EF_REGISTER_NEW_ACCOUNT_TAB = "Register New Account";
const O_EF_LOGIN_EXISTING_ACCOUNT_TAB = "Login to Existing Account";
const O_EF_PRIMARY_ACCOUNT_INFO_TITLE = "Primary Account Information";
const O_EF_PRIMARY_ACCOUNT_INFO_DESC = "Details for the main account holder. This information will be used for login.";
const O_EF_FULL_NAME_LABEL = "Full Name";
const O_EF_EMAIL_LOGIN_LABEL = "Email Address (used for login)";
const O_EF_EMAIL_PLACEHOLDER = "e.g., user@example.com";
const O_EF_PRIMARY_PHONE_LABEL = "Primary Phone Number (for records)";
const O_EF_PHONE_PLACEHOLDER_EF = "e.g., 0911XXXXXX";
const O_EF_PASSWORD_LABEL = "Password";
const O_EF_CREATE_PASSWORD_PLACEHOLDER = "Create a password";
const O_EF_CONFIRM_PASSWORD_LABEL = "Confirm Password";
const O_EF_CONFIRM_PASSWORD_PLACEHOLDER = "Confirm your password";
const O_EF_CREATE_ACCOUNT_BUTTON = "Create Account & Proceed";
const O_EF_LOGIN_TITLE = "Login";
const O_EF_LOGIN_DESC = "Enter your email and password to access your account.";
const O_EF_EMAIL_LABEL = "Email Address";
const O_EF_LOGIN_PASSWORD_PLACEHOLDER = "Enter your password";
const O_EF_LOGIN_BUTTON = "Login & Proceed";
const O_EF_SELECT_PROGRAM_TITLE = "Select a Program";
const O_EF_CHOOSE_PROGRAM_DESC = "Choose a program to enroll a participant.";
const O_EF_NO_PROGRAMS_AVAILABLE_MSG = "No programs are currently available for enrollment. Please check back later or contact administration.";
const O_EF_BACK_TO_DASHBOARD_BUTTON = "Back to Dashboard";
const O_EF_BACK_TO_PROGRAM_SELECTION_BUTTON = "Back to Program Selection";
const O_EF_DASH_MANAGE_ENROLLMENTS_LABEL = "Manage Enrollments";
const O_EF_DASH_VIEW_PROGRAMS_LABEL = "View Programs";
const O_EF_DASH_PAYMENT_SUBMISSION_LABEL = "Payment & Submission";
const O_EF_DASH_ENROLL_TAB_LABEL = "Enroll";
const O_EF_DASH_PROGRAMS_TAB_LABEL = "Programs";
const O_EF_DASH_PAYMENT_TAB_LABEL = "Payment";
const O_EF_MANAGE_ENROLLMENTS_TITLE = "Manage Enrollments";
const O_EF_UNKNOWN_PROGRAM_TEXT = "Unknown Program";
const O_EF_CONTACT_LABEL = "Contact";
const O_EF_NO_PARTICIPANTS_MSG = "No participants added yet. Click below to add an enrollment.";
const O_EF_ADD_PARTICIPANT_BUTTON = "Add Participant / Enrollment";
const O_EF_AVAILABLE_PROGRAMS_TITLE = "Available Programs";
const O_EF_NO_PROGRAMS_VIEWING_MSG = "No programs are currently available for viewing. Please check back later or contact administration.";
const O_EF_AGE_LABEL = "Age";
const O_EF_DURATION_LABEL = "Duration";
const O_EF_SCHEDULE_LABEL = "Schedule";
const O_EF_TERMS_CONDITIONS_TITLE = "Terms and Conditions";
const O_EF_TERMS_FOR_PROGRAM_PREFIX = "Terms for ";
const O_EF_GENERAL_TERMS_DESC_P1 = "Please enroll in a program to view specific terms and conditions. General terms: Hafsa Madrassa is committed to providing quality education and services.";
const O_EF_GENERAL_TERMS_DESC_P2 = "All fees are non-refundable once a program has commenced. Parents/guardians are responsible for ensuring timely drop-off and pick-up of participants.";
const O_EF_GENERAL_TERMS_DESC_P3 = "Hafsa Madrassa reserves the right to modify program schedules or content with prior notice.";
const O_EF_TERMS_AGREEMENT_P1 = "By proceeding with enrollment and payment, you acknowledge that you have read, understood, and agree to be bound by the applicable terms and conditions for the selected programs.";
const O_EF_TERMS_AGREEMENT_P2 = "I agree to the terms and conditions of Hafsa Madrassa.";
const O_EF_AGREE_TERMS_CHECKBOX_LABEL = "I agree to all applicable terms and conditions of Hafsa Madrassa.";
const O_EF_PAYMENT_SUMMARY_TITLE = "Payment Summary";
const O_EF_TOTAL_AMOUNT_DUE_LABEL = "Total Amount Due";
const O_EF_COUPON_CODE_LABEL = "Coupon Code (Optional)";
const O_EF_COUPON_PLACEHOLDER = "Enter coupon code";
const O_EF_APPLY_BUTTON = "Apply";
const O_EF_COUPON_APPLIED_TOAST_TITLE = "Coupon Applied!";
const O_EF_COUPON_EXAMPLE_TOAST_DESC = "(Example: 10% off - not functional yet)";
const O_EF_SELECT_PAYMENT_METHOD_LABEL = "Select Payment Method (Bank)";
const O_EF_CHOOSE_PAYMENT_METHOD_PLACEHOLDER = "Choose payment method";
const O_EF_COPIED_TOAST_TITLE = "Copied!";
const O_EF_ACCOUNT_COPIED_TOAST_DESC = "Account number copied to clipboard.";
const O_EF_COPY_FAILED_TOAST_TITLE = "Failed to copy";
const O_EF_COPY_ACCOUNT_FAILED_TOAST_DESC = "Could not copy account number.";
const O_EF_COPY_BUTTON = "Copy";
const O_EF_PROOF_SUBMISSION_METHOD_LABEL = "Proof Submission Method";
const O_EF_TRANSACTION_ID_OPTION = "Transaction ID / Reference";
const O_EF_UPLOAD_SCREENSHOT_OPTION = "Upload Screenshot";
const O_EF_PROVIDE_PDF_LINK_OPTION = "Provide PDF Link";
const O_EF_TRANSACTION_ID_LABEL = "Enter Transaction ID / Reference";
const O_EF_TRANSACTION_ID_PLACEHOLDER = "e.g., TRN123456789";
const O_EF_UPLOAD_SCREENSHOT_LABEL = "Upload Payment Screenshot";
const O_EF_SCREENSHOT_DESC = "Upload a clear screenshot or PDF of your payment receipt for AI verification.";
const O_EF_PDF_LINK_LABEL = "Enter PDF Link to Receipt";
const O_EF_PDF_LINK_PLACEHOLDER = "https://example.com/receipt.pdf";
const O_EF_PROCEED_TO_PAYMENT_BUTTON = "Proceed to Payment";
const O_EF_SUBMIT_REGISTRATION_BUTTON_PREFIX = "Submit Registration (Br";
const O_EF_NO_ENROLLMENTS_TOAST_TITLE = "No Enrollments";
const O_EF_ADD_PARTICIPANT_BEFORE_PAYMENT_TOAST_DESC = "Please add at least one participant before proceeding to payment.";
const O_EF_ACCOUNT_REQUIRED_TOAST_TITLE = "Account Required";
const O_EF_CREATE_OR_LOGIN_TOAST_DESC = "Please create an account or log in before proceeding.";
const O_EF_ACCOUNT_INFO_DIALOG_TITLE = "Account Information";
const O_EF_LOGGED_IN_AS_PREFIX = "Logged in as ";
const O_EF_PRIMARY_ACCOUNT_GUEST_PREFIX = "Primary Account (Local Guest Session): ";
const O_EF_PRIMARY_ACCOUNT_INCOMPLETE_PREFIX = "Primary Account (Incomplete Session): ";
const O_EF_NO_ACCOUNT_ACTIVE_MSG = "No account active. Please register or log in.";
const O_EF_DIALOG_FULL_NAME_LABEL = "Full Name:";
const O_EF_DIALOG_EMAIL_LABEL = "Email:";
const O_EF_DIALOG_PHONE_LABEL = "Phone:";
const O_EF_DIALOG_PASSWORD_LABEL = "Password:";
const O_EF_DIALOG_LOGOUT_BUTTON = "Logout";
const O_EF_DIALOG_CLOSE_BUTTON = "Close";


const EnrollmentForm: React.FC<EnrollmentFormProps> = ({ onStageChange, showAccountDialogFromParent, onCloseAccountDialog, currentLanguage }) => {
  const [currentView, setCurrentView] = useState<'accountCreation' | 'dashboard' | 'addParticipant' | 'confirmation'>('accountCreation');
  const [activeDashboardTab, setActiveDashboardTab] = useState<DashboardTab>('enrollments');
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [isLoading, setIsLoading] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [availablePrograms, setAvailablePrograms] = useState<HafsaProgram[]>(HAFSA_PROGRAMS);
  const [translatedAvailablePrograms, setTranslatedAvailablePrograms] = useState<HafsaProgram[]>(HAFSA_PROGRAMS);

  const [programsLoading, setProgramsLoading] = useState<boolean>(false); // Kept for future Firestore integration if needed
  const [programForNewParticipant, setProgramForNewParticipant] = useState<HafsaProgram | null>(null);
  const [showPasswordInDialog, setShowPasswordInDialog] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  // Translated states for EnrollmentForm
  const [t, setT] = useState<Record<string, string>>({});

  const translateEnrollmentFormContent = useCallback(async (lang: string) => {
    const newT: Record<string, string> = {};
    const keysToTranslate: Record<string, string | ((...args: any[]) => string)> = {
        welcomeBackToastTitle: O_EF_WELCOME_BACK_TOAST_TITLE,
        guestSessionLoadedToastDesc: O_EF_GUEST_SESSION_LOADED_TOAST_DESC,
        authErrorToastTitle: O_EF_AUTH_ERROR_TOAST_TITLE,
        authInitFailedToastDesc: O_EF_AUTH_INIT_FAILED_TOAST_DESC,
        accountCreatedToastTitle: O_EF_ACCOUNT_CREATED_TOAST_TITLE,
        welcomeUserToastDesc: O_EF_WELCOME_USER_TOAST_DESC("..."), // Placeholder for dynamic part
        registrationErrorToastTitle: O_EF_REGISTRATION_ERROR_TOAST_TITLE,
        registrationFailedToastDesc: O_EF_REGISTRATION_FAILED_TOAST_DESC,
        emailInUseToastDesc: O_EF_EMAIL_IN_USE_TOAST_DESC,
        weakPasswordToastDesc: O_EF_WEAK_PASSWORD_TOAST_DESC,
        validationErrorToastTitle: O_EF_VALIDATION_ERROR_TOAST_TITLE,
        checkEntriesToastDesc: O_EF_CHECK_ENTRIES_TOAST_DESC,
        loginSuccessfulToastTitle: O_EF_LOGIN_SUCCESSFUL_TOAST_TITLE,
        welcomeBackUserToastDesc: O_EF_WELCOME_BACK_USER_TOAST_DESC("..."), // Placeholder
        loginFailedToastTitle: O_EF_LOGIN_FAILED_TOAST_TITLE,
        invalidEmailPasswordToastDesc: O_EF_INVALID_EMAIL_PASSWORD_TOAST_DESC,
        fillEmailPasswordToastDesc: O_EF_FILL_EMAIL_PASSWORD_TOAST_DESC,
        programsLoadingToastTitle: O_EF_PROGRAMS_LOADING_TOAST_TITLE,
        waitProgramsLoadedToastDesc: O_EF_WAIT_PROGRAMS_LOADED_TOAST_DESC,
        noProgramsToastTitle: O_EF_NO_PROGRAMS_TOAST_TITLE,
        noProgramsDesc: O_EF_NO_PROGRAMS_DESC,
        participantAddedToastTitle: O_EF_PARTICIPANT_ADDED_TOAST_TITLE,
        participantForProgramToastDesc: O_EF_PARTICIPANT_FOR_PROGRAM_TOAST_DESC("...", "..."), // Placeholders
        paymentInfoMissingToastTitle: O_EF_PAYMENT_INFO_MISSING_TOAST_TITLE,
        providePaymentDetailsToastDesc: O_EF_PROVIDE_PAYMENT_DETAILS_TOAST_DESC,
        proofSubmissionMissingToastTitle: O_EF_PROOF_SUBMISSION_MISSING_TOAST_TITLE,
        selectProofMethodToastDesc: O_EF_SELECT_PROOF_METHOD_TOAST_DESC,
        paymentSubmittedSavedToastTitle: O_EF_PAYMENT_SUBMITTED_SAVED_TOAST_TITLE,
        paymentVerifiedSavedToastDesc: O_EF_PAYMENT_VERIFIED_SAVED_TOAST_DESC,
        dbErrorToastTitle: O_EF_DB_ERROR_TOAST_TITLE,
        firestoreInitFailedToastDesc: O_EF_FIRESTORE_INIT_FAILED_TOAST_DESC,
        savingErrorToastTitle: O_EF_SAVING_ERROR_TOAST_TITLE,
        regSubmittedDbFailToastDesc: O_EF_REG_SUBMITTED_DB_FAIL_TOAST_DESC("..."), // Placeholder
        paymentIssueToastTitle: O_EF_PAYMENT_ISSUE_TOAST_TITLE,
        paymentVerificationFailedToastDesc: O_EF_PAYMENT_VERIFICATION_FAILED_TOAST_DESC,
        errorToastTitle: O_EF_ERROR_TOAST_TITLE,
        unexpectedErrorToastDesc: O_EF_UNEXPECTED_ERROR_TOAST_DESC,
        noProgramSelectedToastDesc: O_EF_NO_PROGRAM_SELECTED_TOAST_DESC,
        readyNewEnrollmentToastTitle: O_EF_READY_NEW_ENROLLMENT_TOAST_TITLE,
        previousEnrollmentClearedToastDesc: O_EF_PREVIOUS_ENROLLMENT_CLEARED_TOAST_DESC,
        loggedOutToastTitle: O_EF_LOGGED_OUT_TOAST_TITLE,
        loggedOutSuccessToastDesc: O_EF_LOGGED_OUT_SUCCESS_TOAST_DESC,
        logoutErrorToastTitle: O_EF_LOGOUT_ERROR_TOAST_TITLE,
        logoutFailedToastDesc: O_EF_LOGOUT_FAILED_TOAST_DESC,
        registerNewAccountTab: O_EF_REGISTER_NEW_ACCOUNT_TAB,
        loginExistingAccountTab: O_EF_LOGIN_EXISTING_ACCOUNT_TAB,
        primaryAccountInfoTitle: O_EF_PRIMARY_ACCOUNT_INFO_TITLE,
        primaryAccountInfoDesc: O_EF_PRIMARY_ACCOUNT_INFO_DESC,
        fullNameLabel: O_EF_FULL_NAME_LABEL,
        emailLoginLabel: O_EF_EMAIL_LOGIN_LABEL,
        emailPlaceholder: O_EF_EMAIL_PLACEHOLDER,
        primaryPhoneLabel: O_EF_PRIMARY_PHONE_LABEL,
        phonePlaceholderEF: O_EF_PHONE_PLACEHOLDER_EF,
        passwordLabel: O_EF_PASSWORD_LABEL,
        createPasswordPlaceholder: O_EF_CREATE_PASSWORD_PLACEHOLDER,
        confirmPasswordLabel: O_EF_CONFIRM_PASSWORD_LABEL,
        confirmPasswordPlaceholder: O_EF_CONFIRM_PASSWORD_PLACEHOLDER,
        createAccountButton: O_EF_CREATE_ACCOUNT_BUTTON,
        loginTitle: O_EF_LOGIN_TITLE,
        loginDesc: O_EF_LOGIN_DESC,
        emailLabel: O_EF_EMAIL_LABEL,
        loginPasswordPlaceholder: O_EF_LOGIN_PASSWORD_PLACEHOLDER,
        loginButton: O_EF_LOGIN_BUTTON,
        selectProgramTitle: O_EF_SELECT_PROGRAM_TITLE,
        chooseProgramDesc: O_EF_CHOOSE_PROGRAM_DESC,
        noProgramsAvailableMsg: O_EF_NO_PROGRAMS_AVAILABLE_MSG,
        backToDashboardButton: O_EF_BACK_TO_DASHBOARD_BUTTON,
        backToProgramSelectionButton: O_EF_BACK_TO_PROGRAM_SELECTION_BUTTON,
        dashManageEnrollmentsLabel: O_EF_DASH_MANAGE_ENROLLMENTS_LABEL,
        dashViewProgramsLabel: O_EF_DASH_VIEW_PROGRAMS_LABEL,
        dashPaymentSubmissionLabel: O_EF_DASH_PAYMENT_SUBMISSION_LABEL,
        dashEnrollTabLabel: O_EF_DASH_ENROLL_TAB_LABEL,
        dashProgramsTabLabel: O_EF_DASH_PROGRAMS_TAB_LABEL,
        dashPaymentTabLabel: O_EF_DASH_PAYMENT_TAB_LABEL,
        manageEnrollmentsTitle: O_EF_MANAGE_ENROLLMENTS_TITLE,
        unknownProgramText: O_EF_UNKNOWN_PROGRAM_TEXT,
        contactLabel: O_EF_CONTACT_LABEL,
        noParticipantsMsg: O_EF_NO_PARTICIPANTS_MSG,
        addParticipantButton: O_EF_ADD_PARTICIPANT_BUTTON,
        availableProgramsTitle: O_EF_AVAILABLE_PROGRAMS_TITLE,
        noProgramsViewingMsg: O_EF_NO_PROGRAMS_VIEWING_MSG,
        ageLabel: O_EF_AGE_LABEL,
        durationLabel: O_EF_DURATION_LABEL,
        scheduleLabel: O_EF_SCHEDULE_LABEL,
        termsConditionsTitle: O_EF_TERMS_CONDITIONS_TITLE,
        termsForProgramPrefix: O_EF_TERMS_FOR_PROGRAM_PREFIX,
        generalTermsDescP1: O_EF_GENERAL_TERMS_DESC_P1,
        generalTermsDescP2: O_EF_GENERAL_TERMS_DESC_P2,
        generalTermsDescP3: O_EF_GENERAL_TERMS_DESC_P3,
        termsAgreementP1: O_EF_TERMS_AGREEMENT_P1,
        termsAgreementP2: O_EF_TERMS_AGREEMENT_P2,
        agreeTermsCheckboxLabel: O_EF_AGREE_TERMS_CHECKBOX_LABEL,
        paymentSummaryTitle: O_EF_PAYMENT_SUMMARY_TITLE,
        totalAmountDueLabel: O_EF_TOTAL_AMOUNT_DUE_LABEL,
        couponCodeLabel: O_EF_COUPON_CODE_LABEL,
        couponPlaceholder: O_EF_COUPON_PLACEHOLDER,
        applyButton: O_EF_APPLY_BUTTON,
        couponAppliedToastTitle: O_EF_COUPON_APPLIED_TOAST_TITLE,
        couponExampleToastDesc: O_EF_COUPON_EXAMPLE_TOAST_DESC,
        selectPaymentMethodLabel: O_EF_SELECT_PAYMENT_METHOD_LABEL,
        choosePaymentMethodPlaceholder: O_EF_CHOOSE_PAYMENT_METHOD_PLACEHOLDER,
        copiedToastTitle: O_EF_COPIED_TOAST_TITLE,
        accountCopiedToastDesc: O_EF_ACCOUNT_COPIED_TOAST_DESC,
        copyFailedToastTitle: O_EF_COPY_FAILED_TOAST_TITLE,
        copyAccountFailedToastDesc: O_EF_COPY_ACCOUNT_FAILED_TOAST_DESC,
        copyButton: O_EF_COPY_BUTTON,
        proofSubmissionMethodLabel: O_EF_PROOF_SUBMISSION_METHOD_LABEL,
        transactionIdOption: O_EF_TRANSACTION_ID_OPTION,
        uploadScreenshotOption: O_EF_UPLOAD_SCREENSHOT_OPTION,
        providePdfLinkOption: O_EF_PROVIDE_PDF_LINK_OPTION,
        transactionIdLabel: O_EF_TRANSACTION_ID_LABEL,
        transactionIdPlaceholder: O_EF_TRANSACTION_ID_PLACEHOLDER,
        uploadScreenshotLabel: O_EF_UPLOAD_SCREENSHOT_LABEL,
        screenshotDesc: O_EF_SCREENSHOT_DESC,
        pdfLinkLabel: O_EF_PDF_LINK_LABEL,
        pdfLinkPlaceholder: O_EF_PDF_LINK_PLACEHOLDER,
        proceedToPaymentButton: O_EF_PROCEED_TO_PAYMENT_BUTTON,
        submitRegistrationButtonPrefix: O_EF_SUBMIT_REGISTRATION_BUTTON_PREFIX,
        noEnrollmentsToastTitle: O_EF_NO_ENROLLMENTS_TOAST_TITLE,
        addParticipantBeforePaymentToastDesc: O_EF_ADD_PARTICIPANT_BEFORE_PAYMENT_TOAST_DESC,
        accountRequiredToastTitle: O_EF_ACCOUNT_REQUIRED_TOAST_TITLE,
        createOrLoginToastDesc: O_EF_CREATE_OR_LOGIN_TOAST_DESC,
        accountInfoDialogTitle: O_EF_ACCOUNT_INFO_DIALOG_TITLE,
        loggedInAsPrefix: O_EF_LOGGED_IN_AS_PREFIX,
        primaryAccountGuestPrefix: O_EF_PRIMARY_ACCOUNT_GUEST_PREFIX,
        primaryAccountIncompletePrefix: O_EF_PRIMARY_ACCOUNT_INCOMPLETE_PREFIX,
        noAccountActiveMsg: O_EF_NO_ACCOUNT_ACTIVE_MSG,
        dialogFullNameLabel: O_EF_DIALOG_FULL_NAME_LABEL,
        dialogEmailLabel: O_EF_DIALOG_EMAIL_LABEL,
        dialogPhoneLabel: O_EF_DIALOG_PHONE_LABEL,
        dialogPasswordLabel: O_EF_DIALOG_PASSWORD_LABEL,
        dialogLogoutButton: O_EF_DIALOG_LOGOUT_BUTTON,
        dialogCloseButton: O_EF_DIALOG_CLOSE_BUTTON,
    };

    if (lang === 'en') {
        for (const key in keysToTranslate) {
            const value = keysToTranslate[key];
            newT[key] = typeof value === 'function' ? value() : value;
        }
    } else {
        for (const key in keysToTranslate) {
            const value = keysToTranslate[key];
            newT[key] = await getTranslatedText(typeof value === 'function' ? value() : value, lang, 'en');
        }
    }
    setT(newT);

    // Translate available programs
    const translatedProgs = await Promise.all(
        HAFSA_PROGRAMS.map(async (prog) => ({
            ...prog,
            label: await getTranslatedText(prog.label, lang, 'en'),
            description: await getTranslatedText(prog.description, lang, 'en'),
            termsAndConditions: await getTranslatedText(prog.termsAndConditions, lang, 'en'),
            specificFields: prog.specificFields ? await Promise.all(
                prog.specificFields.map(async (field) => ({
                    ...field,
                    label: await getTranslatedText(field.label, lang, 'en')
                }))
            ) : undefined,
        }))
    );
    setTranslatedAvailablePrograms(translatedProgs);

  }, [ HAFSA_PROGRAMS]); // Removed HAFSA_PROGRAMS from dep array for static data

  useEffect(() => {
    translateEnrollmentFormContent(currentLanguage);
  }, [currentLanguage, translateEnrollmentFormContent]);


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

  const { fields: participantFields, append: appendParticipant, remove: removeParticipant } = useFieldArray({
    control,
    name: "participants",
  });

  const clearLocalStorageData = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCALSTORAGE_PARENT_KEY);
      localStorage.removeItem(LOCALSTORAGE_PARTICIPANTS_KEY);
    }
  }, []);

  useEffect(() => {
    if (!auth) return; 

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user && user.email) {
        const savedParentInfoRaw = localStorage.getItem(LOCALSTORAGE_PARENT_KEY);
        let parentName = "Registered User";
        let parentPhone = '';

        if (savedParentInfoRaw) {
            try {
                const savedParentInfo = JSON.parse(savedParentInfoRaw) as ParentInfoData;
                if (savedParentInfo.parentEmail === user.email) {
                    parentName = savedParentInfo.parentFullName || parentName;
                    parentPhone = savedParentInfo.parentPhone1 || parentPhone;
                    setValue('parentInfo.parentFullName', savedParentInfo.parentFullName);
                    setValue('parentInfo.parentEmail', savedParentInfo.parentEmail);
                    setValue('parentInfo.parentPhone1', savedParentInfo.parentPhone1);
                } else {
                    localStorage.removeItem(LOCALSTORAGE_PARENT_KEY);
                    setValue('parentInfo.parentFullName', user.displayName || parentName);
                    setValue('parentInfo.parentEmail', user.email);
                    setValue('parentInfo.parentPhone1', '');
                }
            } catch (e) {
                console.error("Error parsing parent info from LS on auth change", e);
                localStorage.removeItem(LOCALSTORAGE_PARENT_KEY);
                setValue('parentInfo.parentFullName', user.displayName || parentName);
                setValue('parentInfo.parentEmail', user.email);
                setValue('parentInfo.parentPhone1', '');
            }
        } else {
            setValue('parentInfo.parentFullName', user.displayName || parentName);
            setValue('parentInfo.parentEmail', user.email);
            setValue('parentInfo.parentPhone1', '');
        }

        const savedParticipantsRaw = localStorage.getItem(LOCALSTORAGE_PARTICIPANTS_KEY);
        if (savedParticipantsRaw) {
            try {
                const savedParticipants = JSON.parse(savedParticipantsRaw) as {parentEmail: string, data: EnrolledParticipantData[]};
                if (savedParticipants.parentEmail === user.email) {
                     setValue('participants', savedParticipants.data.map((p: EnrolledParticipantData) => ({
                        ...p,
                        participantInfo: {
                            ...p.participantInfo,
                            dateOfBirth: p.participantInfo.dateOfBirth ? new Date(p.participantInfo.dateOfBirth) : undefined,
                        }
                    })));
                } else {
                    localStorage.removeItem(LOCALSTORAGE_PARTICIPANTS_KEY); 
                }
            } catch (e) {
                console.error("Error parsing participants from LS on auth change", e);
                localStorage.removeItem(LOCALSTORAGE_PARTICIPANTS_KEY);
            }
        }

        if(currentView === 'accountCreation' || currentView === 'confirmation') { 
             setCurrentView('dashboard');
             setActiveDashboardTab('enrollments');
        }
        onStageChange('accountCreated');
      } else {
        if (currentView === 'dashboard') { 
            setValue('parentInfo', defaultParentValues); 
            setValue('participants', []); 
            clearLocalStorageData(); 
            setCurrentView('accountCreation');
            onStageChange('initial');
        }
      }
    });
    return () => unsubscribe();
  }, [auth, setValue, onStageChange, currentView, reset, clearLocalStorageData]); 


 useEffect(() => {
    if (typeof window !== 'undefined' && !firebaseUser) { 
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
        
        if (loadedParentInfo?.parentEmail && loadedParentInfo?.password) { // Indicates a previous "account created" like state for guest
          setCurrentView('dashboard');
          onStageChange('accountCreated');
          setActiveDashboardTab('enrollments');
          toast({ title: t['welcomeBackToastTitle'] || O_EF_WELCOME_BACK_TOAST_TITLE, description: t['guestSessionLoadedToastDesc'] || O_EF_GUEST_SESSION_LOADED_TOAST_DESC });

           if (savedParticipantsRaw) {
             const localParticipants = JSON.parse(savedParticipantsRaw) as {parentEmail: string, data: EnrolledParticipantData[]};
             if(localParticipants.parentEmail === loadedParentInfo.parentEmail) {
                setValue('participants', localParticipants.data.map((p: EnrolledParticipantData) => ({
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
        clearLocalStorageData();
      }
    }
  }, [setValue, onStageChange, toast, clearLocalStorageData, firebaseUser, t]);


  const watchedParticipants = watch('participants');
  const watchedPaymentType = watch('paymentProof.paymentType');
  const watchedProofSubmissionType = watch('paymentProof.proofSubmissionType');

  const dashboardTabsConfig = [
    { value: 'enrollments' as DashboardTab, desktopLabelKey: 'dashManageEnrollmentsLabel', mobileLabelKey: 'dashEnrollTabLabel', icon: Users },
    { value: 'programs' as DashboardTab, desktopLabelKey: 'dashViewProgramsLabel', mobileLabelKey: 'dashProgramsTabLabel', icon: LayoutList },
    { value: 'payment' as DashboardTab, desktopLabelKey: 'dashPaymentSubmissionLabel', mobileLabelKey: 'dashPaymentTabLabel', icon: CreditCard },
  ];

  useEffect(() => {
    let total = 0;
    if (watchedParticipants && translatedAvailablePrograms.length > 0) {
      watchedParticipants.forEach(enrolledParticipant => {
        const program = translatedAvailablePrograms.find(p => p.id === enrolledParticipant.programId);
        if (program) {
          total += program.price;
        }
      });
    }
    setCalculatedPrice(total);
  }, [watchedParticipants, translatedAvailablePrograms]);

  const handleAccountCreation = async () => {
    if (!auth) {
        toast({ title: t['authErrorToastTitle'] || O_EF_AUTH_ERROR_TOAST_TITLE, description: t['authInitFailedToastDesc'] || O_EF_AUTH_INIT_FAILED_TOAST_DESC, variant: "destructive"});
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
            toast({ title: t['accountCreatedToastTitle'] || O_EF_ACCOUNT_CREATED_TOAST_TITLE, description: (t['welcomeUserToastDesc'] || O_EF_WELCOME_USER_TOAST_DESC)(parentFullName) });
        } catch (error: any) {
            console.error("Firebase registration error:", error);
            let errorMessage = t['registrationFailedToastDesc'] || O_EF_REGISTRATION_FAILED_TOAST_DESC;
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = t['emailInUseToastDesc'] || O_EF_EMAIL_IN_USE_TOAST_DESC;
            } else if (error.code === 'auth/weak-password') {
                errorMessage = t['weakPasswordToastDesc'] || O_EF_WEAK_PASSWORD_TOAST_DESC;
            }
            toast({ title: t['registrationErrorToastTitle'] || O_EF_REGISTRATION_ERROR_TOAST_TITLE, description: errorMessage, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    } else {
      toast({ title: t['validationErrorToastTitle'] || O_EF_VALIDATION_ERROR_TOAST_TITLE, description: t['checkEntriesToastDesc'] || O_EF_CHECK_ENTRIES_TOAST_DESC, variant: "destructive" });
    }
  };

  const handleLoginAttempt = async () => {
    if (!auth) {
        toast({ title: t['authErrorToastTitle'] || O_EF_AUTH_ERROR_TOAST_TITLE, description: t['authInitFailedToastDesc'] || O_EF_AUTH_INIT_FAILED_TOAST_DESC, variant: "destructive"});
        return;
    }
    const isValid = await trigger(['loginEmail', 'loginPassword']);
    if (isValid) {
      setIsLoading(true);
      const { loginEmail, loginPassword } = getValues();

      try {
        const userCredential = await signInWithEmailAndPassword(auth, loginEmail!, loginPassword!);
        const user = userCredential.user;

        let parentName = user.displayName || "Registered User";
        let parentPhone = ''; 
        const storedParentInfoRaw = typeof window !== 'undefined' ? localStorage.getItem(LOCALSTORAGE_PARENT_KEY) : null;
        if (storedParentInfoRaw) {
            try {
                const storedParentInfo = JSON.parse(storedParentInfoRaw) as ParentInfoData;
                if (storedParentInfo.parentEmail === user.email) { 
                    parentName = storedParentInfo.parentFullName || parentName;
                    parentPhone = storedParentInfo.parentPhone1 || '';
                    setValue('parentInfo.parentFullName', parentName);
                    setValue('parentInfo.parentEmail', user.email!);
                    setValue('parentInfo.parentPhone1', parentPhone);
                    setValue('parentInfo.password', loginPassword!); 
                    setValue('parentInfo.confirmPassword', loginPassword!);
                } else {
                    setValue('parentInfo.parentFullName', user.displayName || parentName);
                    setValue('parentInfo.parentEmail', user.email!);
                    setValue('parentInfo.parentPhone1', ''); 
                    setValue('parentInfo.password', loginPassword!);
                    setValue('parentInfo.confirmPassword', loginPassword!);
                }
            } catch(e) {
                console.error("Error parsing LS data during login", e);
                setValue('parentInfo.parentFullName', user.displayName || parentName);
                setValue('parentInfo.parentEmail', user.email!);
                setValue('parentInfo.parentPhone1', '');
                setValue('parentInfo.password', loginPassword!);
                setValue('parentInfo.confirmPassword', loginPassword!);
            }
        } else {
            setValue('parentInfo.parentFullName', user.displayName || parentName);
            setValue('parentInfo.parentEmail', user.email!);
            setValue('parentInfo.parentPhone1', '');
            setValue('parentInfo.password', loginPassword!);
            setValue('parentInfo.confirmPassword', loginPassword!);
        }
        const currentParentInfo = getValues('parentInfo');
         if (typeof window !== 'undefined') {
            localStorage.setItem(LOCALSTORAGE_PARENT_KEY, JSON.stringify(currentParentInfo));
        }

        toast({ title: t['loginSuccessfulToastTitle'] || O_EF_LOGIN_SUCCESSFUL_TOAST_TITLE, description: (t['welcomeBackUserToastDesc'] || O_EF_WELCOME_BACK_USER_TOAST_DESC)(currentParentInfo.parentFullName || user.email!) });
      } catch (error: any) {
        console.error("Firebase login error:", error);
        let errorMessage = t['invalidEmailPasswordToastDesc'] || O_EF_INVALID_EMAIL_PASSWORD_TOAST_DESC;
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            errorMessage = t['invalidEmailPasswordToastDesc'] || O_EF_INVALID_EMAIL_PASSWORD_TOAST_DESC;
        }
        toast({ title: t['loginFailedToastTitle'] || O_EF_LOGIN_FAILED_TOAST_TITLE, description: errorMessage, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    } else {
      toast({ title: t['validationErrorToastTitle'] || O_EF_VALIDATION_ERROR_TOAST_TITLE, description: t['fillEmailPasswordToastDesc'] || O_EF_FILL_EMAIL_PASSWORD_TOAST_DESC, variant: "destructive" });
    }
  };

  const handleAddParticipantClick = () => {
    if (programsLoading) {
        toast({ title: t['programsLoadingToastTitle'] || O_EF_PROGRAMS_LOADING_TOAST_TITLE, description: t['waitProgramsLoadedToastDesc'] || O_EF_WAIT_PROGRAMS_LOADED_TOAST_DESC});
        return;
    }
    if (translatedAvailablePrograms.length === 0) {
        toast({ title: t['noProgramsToastTitle'] || O_EF_NO_PROGRAMS_TOAST_TITLE, description: t['noProgramsDesc'] || O_EF_NO_PROGRAMS_DESC, variant: "destructive"});
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
        toast({ title: t['errorToastTitle'] || O_EF_ERROR_TOAST_TITLE, description: t['noProgramSelectedToastDesc'] || O_EF_NO_PROGRAM_SELECTED_TOAST_DESC, variant: "destructive" });
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
    const programLabel = translatedAvailablePrograms.find(p => p.id === programForNewParticipant.id)?.label || programForNewParticipant.label;
    toast({title: t['participantAddedToastTitle'] || O_EF_PARTICIPANT_ADDED_TOAST_TITLE, description: (t['participantForProgramToastDesc'] || O_EF_PARTICIPANT_FOR_PROGRAM_TOAST_DESC)(participantData.firstName, programLabel)})
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
    setIsLoading(true);
    try {
      if (data.participants && data.participants.length > 0 && !data.paymentProof) {
        toast({ title: t['paymentInfoMissingToastTitle'] || O_EF_PAYMENT_INFO_MISSING_TOAST_TITLE, description: t['providePaymentDetailsToastDesc'] || O_EF_PROVIDE_PAYMENT_DETAILS_TOAST_DESC, variant: "destructive" });
        setIsLoading(false);
        setActiveDashboardTab('payment');
        return;
      }

      if (data.paymentProof && !data.paymentProof.proofSubmissionType) {
        toast({ title: t['proofSubmissionMissingToastTitle'] || O_EF_PROOF_SUBMISSION_MISSING_TOAST_TITLE, description: t['selectProofMethodToastDesc'] || O_EF_SELECT_PROOF_METHOD_TOAST_DESC, variant: "destructive" });
        setIsLoading(false);
        setActiveDashboardTab('payment');
        await trigger('paymentProof.proofSubmissionType');
        return;
      }

      let screenshotDataUriForAI: string | undefined;
      if (data.paymentProof?.proofSubmissionType === 'screenshot') {
         if (data.paymentProof?.screenshot && data.paymentProof.screenshot.length > 0) {
            const fileToUpload = data.paymentProof.screenshot[0];
            if (fileToUpload instanceof File) {
                screenshotDataUriForAI = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(fileToUpload);
                });
                setValue('paymentProof.screenshotDataUri', screenshotDataUriForAI, { shouldValidate: true });
            } else {
                console.warn("Screenshot field did not contain a File object at submission.");
            }
         } else if (data.paymentProof?.screenshotDataUri) {
            screenshotDataUriForAI = data.paymentProof.screenshotDataUri;
         }
      }


      const verificationInput = {
        paymentProof: {
            ...data.paymentProof!,
            screenshotDataUri: screenshotDataUriForAI,
        },
        expectedAmount: calculatedPrice,
      };

      const result = await handlePaymentVerification(verificationInput);
      
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

      if (result.isPaymentValid) {
        if (!db) {
            toast({ title: t['dbErrorToastTitle'] || O_EF_DB_ERROR_TOAST_TITLE, description: t['firestoreInitFailedToastDesc'] || O_EF_FIRESTORE_INIT_FAILED_TOAST_DESC, variant: "destructive" });
            setIsLoading(false);
            return;
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
                    }
                })),
            };
            await addDoc(collection(db, "registrations"), firestoreReadyData);
            console.log("Registration data saved to Firestore:", firestoreReadyData);

            toast({
              title: t['paymentSubmittedSavedToastTitle'] || O_EF_PAYMENT_SUBMITTED_SAVED_TOAST_TITLE,
              description: result.message || (t['paymentVerifiedSavedToastDesc'] || O_EF_PAYMENT_VERIFIED_SAVED_TOAST_DESC),
              variant: "default",
              className: "bg-accent text-accent-foreground",
            });
            setRegistrationData(finalRegistrationData); 
            setCurrentView('confirmation');
            clearLocalStorageData(); 

        } catch (firestoreError: any) {
            console.error("Error saving registration to Firestore:", firestoreError);
            toast({
                title: t['savingErrorToastTitle'] || O_EF_SAVING_ERROR_TOAST_TITLE,
                description: (t['regSubmittedDbFailToastDesc'] || O_EF_REG_SUBMITTED_DB_FAIL_TOAST_DESC)(firestoreError.message),
                variant: "destructive",
            });
            setRegistrationData(finalRegistrationData);
            setCurrentView('confirmation');
            clearLocalStorageData(); 
        }

      } else {
        let failureMessage = result.message || (t['paymentVerificationFailedToastDesc'] || O_EF_PAYMENT_VERIFICATION_FAILED_TOAST_DESC);
        if (result.reason && result.reason !== result.message) {
            failureMessage += ` Reason: ${result.reason}`;
        }
        toast({
          title: t['paymentIssueToastTitle'] || O_EF_PAYMENT_ISSUE_TOAST_TITLE,
          description: failureMessage,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Submission error:", error);
      const errorMessage = error.message || (t['unexpectedErrorToastDesc'] || O_EF_UNEXPECTED_ERROR_TOAST_DESC);
      toast({
        title: t['errorToastTitle'] || O_EF_ERROR_TOAST_TITLE,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  interface VerificationResult extends Partial<VerifyPaymentFromScreenshotOutput> {
    isPaymentValid: boolean;
    message: string;
  }
  type VerifyPaymentFromScreenshotOutput = import('@/ai/flows/payment-verification').VerifyPaymentFromScreenshotOutput;


  const handleBackFromReceipt = () => {
    setRegistrationData(null);
    resetField('participants');
    setValue('participants', []);
    setValue('agreeToTerms', false);
    setValue('couponCode', '');
    resetField('paymentProof');
    setValue('paymentProof', defaultPaymentProofValues);

    clearLocalStorageData();

    if (!firebaseUser) { 
        resetField('parentInfo');
        setValue('parentInfo', defaultParentValues);
        setCurrentView('accountCreation');
        onStageChange('initial');
    } else { 
        setCurrentView('dashboard');
        setActiveDashboardTab('enrollments');
    }
    toast({ title: t['readyNewEnrollmentToastTitle'] || O_EF_READY_NEW_ENROLLMENT_TOAST_TITLE, description: t['previousEnrollmentClearedToastDesc'] || O_EF_PREVIOUS_ENROLLMENT_CLEARED_TOAST_DESC });
  };

  const getUniqueSelectedProgramsTerms = () => {
    if (!watchedParticipants || watchedParticipants.length === 0 || translatedAvailablePrograms.length === 0) {
        return [];
    }
    const uniqueProgramIds = new Set<string>();
    const terms: { programId: string; label: string; terms: string }[] = [];
    watchedParticipants.forEach(enrolled => {
        if (!uniqueProgramIds.has(enrolled.programId)) {
            const program = translatedAvailablePrograms.find(p => p.id === enrolled.programId);
            if (program && program.termsAndConditions) {
                terms.push({ programId: program.id, label: program.label, terms: program.termsAndConditions });
                uniqueProgramIds.add(program.id);
            }
        }
    });
    return terms;
  };

  const uniqueProgramTerms = getUniqueSelectedProgramsTerms();


  if (currentView === 'confirmation' && registrationData) {
    return <Receipt data={registrationData} onBack={handleBackFromReceipt} allPrograms={translatedAvailablePrograms} currentLanguage={currentLanguage} />;
  }

  const renderAccountCreation = () => (
    <>
        <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as 'register' | 'login')} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="register">{t['registerNewAccountTab'] || O_EF_REGISTER_NEW_ACCOUNT_TAB}</TabsTrigger>
            <TabsTrigger value="login">{t['loginExistingAccountTab'] || O_EF_LOGIN_EXISTING_ACCOUNT_TAB}</TabsTrigger>
        </TabsList>
        <TabsContent value="register" className="space-y-4 sm:space-y-6">
             <Card className="mb-4 sm:mb-6 p-3 sm:p-4 border-primary/20 border shadow-none">
                <CardHeader className="p-2 pb-1">
                    <CardTitle className="text-lg sm:text-xl font-headline text-primary flex items-center">
                    <User className="mr-2 h-5 w-5"/> {t['primaryAccountInfoTitle'] || O_EF_PRIMARY_ACCOUNT_INFO_TITLE}
                    </CardTitle>
                    <CardDescription>{t['primaryAccountInfoDesc'] || O_EF_PRIMARY_ACCOUNT_INFO_DESC}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-2 pt-1">
                    <div>
                        <Label htmlFor="parentInfo.parentFullName">{t['fullNameLabel'] || O_EF_FULL_NAME_LABEL}</Label>
                        <Input id="parentInfo.parentFullName" {...register("parentInfo.parentFullName")} placeholder={t['fullNameLabel'] || O_EF_FULL_NAME_LABEL} />
                        {errors.parentInfo?.parentFullName && <p className="text-sm text-destructive mt-1">{errors.parentInfo.parentFullName.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="parentInfo.parentEmail">{t['emailLoginLabel'] || O_EF_EMAIL_LOGIN_LABEL}</Label>
                        <Input id="parentInfo.parentEmail" {...register("parentInfo.parentEmail")} type="email" placeholder={t['emailPlaceholder'] || O_EF_EMAIL_PLACEHOLDER} />
                        {errors.parentInfo?.parentEmail && <p className="text-sm text-destructive mt-1">{errors.parentInfo.parentEmail.message}</p>}
                    </div>
                     <div>
                        <Label htmlFor="parentInfo.parentPhone1">{t['primaryPhoneLabel'] || O_EF_PRIMARY_PHONE_LABEL}</Label>
                        <Input id="parentInfo.parentPhone1" {...register("parentInfo.parentPhone1")} type="tel" placeholder={t['phonePlaceholderEF'] || O_EF_PHONE_PLACEHOLDER_EF} />
                        {errors.parentInfo?.parentPhone1 && <p className="text-sm text-destructive mt-1">{errors.parentInfo.parentPhone1.message}</p>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <Label htmlFor="parentInfo.password">{t['passwordLabel'] || O_EF_PASSWORD_LABEL}</Label>
                            <Input id="parentInfo.password" {...register("parentInfo.password")} type="password" placeholder={t['createPasswordPlaceholder'] || O_EF_CREATE_PASSWORD_PLACEHOLDER} />
                            {errors.parentInfo?.password && <p className="text-sm text-destructive mt-1">{errors.parentInfo.password.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="parentInfo.confirmPassword">{t['confirmPasswordLabel'] || O_EF_CONFIRM_PASSWORD_LABEL}</Label>
                            <Input id="parentInfo.confirmPassword" {...register("parentInfo.confirmPassword")} type="password" placeholder={t['confirmPasswordPlaceholder'] || O_EF_CONFIRM_PASSWORD_PLACEHOLDER} />
                            {errors.parentInfo?.confirmPassword && <p className="text-sm text-destructive mt-1">{errors.parentInfo.confirmPassword.message}</p>}
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Button type="button" onClick={handleAccountCreation} disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="animate-spin mr-2"/> : <Mail className="mr-2 h-4 w-4" />} {t['createAccountButton'] || O_EF_CREATE_ACCOUNT_BUTTON} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </TabsContent>
        <TabsContent value="login" className="space-y-4 sm:space-y-6">
            <Card className="p-3 sm:p-4 border-primary/20">
            <CardHeader className="p-2 pb-1">
                <CardTitle className="text-lg sm:text-xl font-headline text-primary flex items-center">
                <LogIn className="mr-2 h-5 w-5"/> {t['loginTitle'] || O_EF_LOGIN_TITLE}
                </CardTitle>
                <CardDescription>{t['loginDesc'] || O_EF_LOGIN_DESC}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-2 pt-1">
                <div>
                <Label htmlFor="loginEmail">{t['emailLabel'] || O_EF_EMAIL_LABEL}</Label>
                <Input id="loginEmail" {...register('loginEmail')} placeholder={t['emailPlaceholder'] || O_EF_EMAIL_PLACEHOLDER} type="email"/>
                {errors.loginEmail && <p className="text-sm text-destructive mt-1">{errors.loginEmail.message}</p>}
                </div>
                <div>
                <Label htmlFor="loginPassword">{t['passwordLabel'] || O_EF_PASSWORD_LABEL}</Label>
                <Input id="loginPassword" {...register('loginPassword')} type="password" placeholder={t['loginPasswordPlaceholder'] || O_EF_LOGIN_PASSWORD_PLACEHOLDER} />
                {errors.loginPassword && <p className="text-sm text-destructive mt-1">{errors.loginPassword.message}</p>}
                </div>
            </CardContent>
            </Card>
            <Button type="button" onClick={handleLoginAttempt} disabled={isLoading} className="w-full">
             {isLoading ? <Loader2 className="animate-spin mr-2"/> : <KeyRound className="mr-2 h-4 w-4" />} {t['loginButton'] || O_EF_LOGIN_BUTTON} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </TabsContent>
        </Tabs>
    </>
  );

  const renderAddParticipant = () => (
    <div className="space-y-4 sm:space-y-6">
      {!programForNewParticipant ? (
        <div>
          <h3 className="text-xl sm:text-2xl font-semibold mb-1 text-primary">{t['selectProgramTitle'] || O_EF_SELECT_PROGRAM_TITLE}</h3>
          <p className="text-muted-foreground mb-4 text-sm">{t['chooseProgramDesc'] || O_EF_CHOOSE_PROGRAM_DESC}</p>
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
          {!programsLoading && translatedAvailablePrograms.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {translatedAvailablePrograms.map(prog => {
                let IconComponent;
                switch(prog.category) {
                  case 'daycare': IconComponent = Baby; break;
                  case 'quran_kids': IconComponent = GraduationCap; break;
                  case 'quran_bootcamp': IconComponent = GraduationCap; break;
                  case 'arabic_women': IconComponent = Briefcase; break;
                  default: IconComponent = BookOpenText;
                }

                return (
                  <Card
                    key={prog.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col p-0"
                    onClick={() => handleProgramCardClick(prog)}
                  >
                    <CardHeader className="pb-2 pt-3 px-3 sm:px-4">
                      <div className="flex items-center space-x-2 sm:space-x-3 mb-1">
                          <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                          <CardTitle className="text-base sm:text-lg text-primary">{prog.label}</CardTitle>
                      </div>
                      <CardDescription className="text-xs sm:text-sm">{prog.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-xs sm:text-sm flex-grow px-3 sm:px-4 pb-2">
                      {prog.ageRange && <p><strong>{t['ageLabel'] || O_EF_AGE_LABEL}:</strong> {prog.ageRange}</p>}
                      {prog.duration && <p><strong>{t['durationLabel'] || O_EF_DURATION_LABEL}:</strong> {prog.duration}</p>}
                      {prog.schedule && <p><strong>{t['scheduleLabel'] || O_EF_SCHEDULE_LABEL}:</strong> {prog.schedule}</p>}
                    </CardContent>
                    <CardFooter className="pt-2 px-3 sm:px-4 pb-3">
                      <p className="text-sm sm:text-base font-semibold text-accent">Br{prog.price.toFixed(2)}</p>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
           )}
           {!programsLoading && translatedAvailablePrograms.length === 0 && (
             <p className="text-muted-foreground text-center py-4">{t['noProgramsAvailableMsg'] || O_EF_NO_PROGRAMS_AVAILABLE_MSG}</p>
           )}
           <Button type="button" variant="outline" onClick={() => { setCurrentView('dashboard'); setActiveDashboardTab('enrollments');}} className="w-full mt-4 sm:mt-6">
              <ArrowLeft className="mr-2 h-4 w-4" /> {t['backToDashboardButton'] || O_EF_BACK_TO_DASHBOARD_BUTTON}
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
              <ArrowLeft className="mr-2 h-4 w-4" /> {t['backToProgramSelectionButton'] || O_EF_BACK_TO_PROGRAM_SELECTION_BUTTON}
            </Button>
        </>
      )}
    </div>
  );

  const selectedMethodDetails = HAFSA_PAYMENT_METHODS.find(m => m.value === watchedPaymentType);

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
                        aria-label={t[tab.desktopLabelKey] || (tab.desktopLabelKey === 'dashManageEnrollmentsLabel' ? O_EF_DASH_MANAGE_ENROLLMENTS_LABEL : tab.desktopLabelKey === 'dashViewProgramsLabel' ? O_EF_DASH_VIEW_PROGRAMS_LABEL : O_EF_DASH_PAYMENT_SUBMISSION_LABEL)}
                        type="button"
                    >
                        <tab.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span>{t[tab.desktopLabelKey] || (tab.desktopLabelKey === 'dashManageEnrollmentsLabel' ? O_EF_DASH_MANAGE_ENROLLMENTS_LABEL : tab.desktopLabelKey === 'dashViewProgramsLabel' ? O_EF_DASH_VIEW_PROGRAMS_LABEL : O_EF_DASH_PAYMENT_SUBMISSION_LABEL)}</span>
                    </button>
                    ))}
                </div>
            </div>
        )}

        <TabsContent value="enrollments" className="space-y-3 sm:space-y-4 pt-1 sm:pt-2">
            <h3 className="text-xl font-semibold text-primary">{t['manageEnrollmentsTitle'] || O_EF_MANAGE_ENROLLMENTS_TITLE}</h3>

            {participantFields.map((field, index) => {
                const enrolledParticipant = field as unknown as EnrolledParticipantData;
                const program = translatedAvailablePrograms.find(p => p.id === enrolledParticipant.programId);
                return (
                <Card key={field.id} className="p-3 mb-2 bg-background/80">
                    <div className="flex justify-between items-start">
                    <div>
                        <p className="font-semibold text-md">{enrolledParticipant.participantInfo.firstName}</p>
                        <p className="text-xs text-muted-foreground">{program?.label || (t['unknownProgramText'] || O_EF_UNKNOWN_PROGRAM_TEXT)} - Br{program?.price.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t['contactLabel'] || O_EF_CONTACT_LABEL}: {enrolledParticipant.participantInfo.guardianFullName} ({enrolledParticipant.participantInfo.guardianPhone1})</p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveParticipant(index)} className="text-destructive hover:text-destructive/80 p-1.5 h-auto">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    </div>
                </Card>
                );
            })}

            {(participantFields.length === 0) && (
                <div className="text-center py-4 sm:py-6">
                    <p className="text-muted-foreground mb-3 sm:mb-4 text-sm">{t['noParticipantsMsg'] || O_EF_NO_PARTICIPANTS_MSG}</p>
                </div>
            )}

            <Button type="button" variant="default" onClick={handleAddParticipantClick} className="w-full sm:w-auto" disabled={programsLoading || translatedAvailablePrograms.length === 0}>
                 {programsLoading ? <Loader2 className="animate-spin mr-2"/> : <PlusCircle className="mr-2 h-4 w-4" />} {t['addParticipantButton'] || O_EF_ADD_PARTICIPANT_BUTTON}
            </Button>
        </TabsContent>

        <TabsContent value="programs" className="space-y-3 sm:space-y-4 pt-1 sm:pt-2">
            <h3 className="text-xl font-semibold text-primary mb-2">{t['availableProgramsTitle'] || O_EF_AVAILABLE_PROGRAMS_TITLE}</h3>
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
            {!programsLoading && translatedAvailablePrograms.length > 0 && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {translatedAvailablePrograms.map(prog => {
                    let IconComponent;
                    switch(prog.category) {
                        case 'daycare': IconComponent = Baby; break;
                        case 'quran_kids': IconComponent = GraduationCap; break;
                        case 'quran_bootcamp': IconComponent = GraduationCap; break;
                        case 'arabic_women': IconComponent = Briefcase; break;
                        default: IconComponent = BookOpenText;
                    }
                    return (
                        <Card
                          key={prog.id}
                          className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col p-0"
                          onClick={() => handleProgramCardClick(prog)}
                        >
                        <CardHeader className="pb-2 pt-3 px-3 sm:px-4">
                            <div className="flex items-center space-x-2 sm:space-x-3 mb-1">
                                <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                                <CardTitle className="text-base sm:text-lg text-primary">{prog.label}</CardTitle>
                            </div>
                            <CardDescription className="text-xs sm:text-sm">{prog.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="text-xs sm:text-sm flex-grow px-3 sm:px-4 pb-2">
                            {prog.ageRange && <p><strong>{t['ageLabel'] || O_EF_AGE_LABEL}:</strong> {prog.ageRange}</p>}
                            {prog.duration && <p><strong>{t['durationLabel'] || O_EF_DURATION_LABEL}:</strong> {prog.duration}</p>}
                            {prog.schedule && <p><strong>{t['scheduleLabel'] || O_EF_SCHEDULE_LABEL}:</strong> {prog.schedule}</p>}
                        </CardContent>
                        <CardFooter className="pt-2 px-3 sm:px-4 pb-3">
                            <p className="text-sm sm:text-base font-semibold text-accent">Br{prog.price.toFixed(2)}</p>
                        </CardFooter>
                        </Card>
                    );
                    })}
                </div>
            )}
           {!programsLoading && translatedAvailablePrograms.length === 0 && (
             <p className="text-muted-foreground text-center py-4">{t['noProgramsViewingMsg'] || O_EF_NO_PROGRAMS_VIEWING_MSG}</p>
           )}
        </TabsContent>

        <TabsContent value="payment" className="space-y-4 sm:space-y-6 pt-1 sm:pt-2">
             <Card className="mb-4">
              <CardHeader className="p-3 sm:p-4 pb-2">
                <CardTitle className="text-md sm:text-lg">{t['termsConditionsTitle'] || O_EF_TERMS_CONDITIONS_TITLE}</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                {uniqueProgramTerms.length > 0 ? (
                   <Accordion type="multiple" className="w-full">
                    {uniqueProgramTerms.map((programTerm, index) => (
                      <AccordionItem value={`item-${index}`} key={programTerm.programId}>
                        <AccordionTrigger className="text-sm sm:text-base text-primary hover:no-underline">
                          {(t['termsForProgramPrefix'] || O_EF_TERMS_FOR_PROGRAM_PREFIX)} {programTerm.label}
                        </AccordionTrigger>
                        <AccordionContent className="text-xs sm:text-sm text-muted-foreground">
                          {programTerm.terms}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t['generalTermsDescP1'] || O_EF_GENERAL_TERMS_DESC_P1} <br/>
                    {t['generalTermsDescP2'] || O_EF_GENERAL_TERMS_DESC_P2} <br/>
                    {t['generalTermsDescP3'] || O_EF_GENERAL_TERMS_DESC_P3}
                  </p>
                )}
                <p className="text-xs sm:text-sm text-muted-foreground mt-3">
                  {t['termsAgreementP1'] || O_EF_TERMS_AGREEMENT_P1} <br/>
                  {t['termsAgreementP2'] || O_EF_TERMS_AGREEMENT_P2}
                </p>
                <div className="mt-3">
                    <Controller
                        name="agreeToTerms"
                        control={control}
                        render={({ field }) => (
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            <Checkbox id="agreeToTermsDashboard" checked={field.value} onCheckedChange={field.onChange} />
                            <Label htmlFor="agreeToTermsDashboard" className="text-xs sm:text-sm font-normal">{t['agreeTermsCheckboxLabel'] || O_EF_AGREE_TERMS_CHECKBOX_LABEL}</Label>
                        </div>
                        )}
                    />
                    {errors.agreeToTerms && <p className="text-sm text-destructive mt-1">{errors.agreeToTerms.message}</p>}
                </div>
              </CardContent>
            </Card>

            <div className="p-3 sm:p-4 border rounded-lg bg-primary/10">
                <h3 className="text-base sm:text-lg font-semibold font-headline text-primary">{t['paymentSummaryTitle'] || O_EF_PAYMENT_SUMMARY_TITLE}</h3>
                <p className="mt-1 sm:mt-2 text-lg sm:text-xl font-bold text-primary">{t['totalAmountDueLabel'] || O_EF_TOTAL_AMOUNT_DUE_LABEL}: Br{calculatedPrice.toFixed(2)}</p>
            </div>
            <div>
                <Label htmlFor="couponCode">{t['couponCodeLabel'] || O_EF_COUPON_CODE_LABEL}</Label>
                <div className="flex items-center gap-2 mt-1">
                    <Input id="couponCode" {...register('couponCode')} placeholder={t['couponPlaceholder'] || O_EF_COUPON_PLACEHOLDER} className="flex-grow"/>
                    <Button type="button" variant="outline" size="sm" onClick={() => toast({title: t['couponAppliedToastTitle'] || O_EF_COUPON_APPLIED_TOAST_TITLE, description: t['couponExampleToastDesc'] || O_EF_COUPON_EXAMPLE_TOAST_DESC})}>{t['applyButton'] || O_EF_APPLY_BUTTON}</Button>
                </div>
                 {errors.couponCode && <p className="text-sm text-destructive mt-1">{errors.couponCode.message}</p>}
            </div>
            <div>
                <Label htmlFor="paymentProof.paymentType" className="text-sm sm:text-base">{t['selectPaymentMethodLabel'] || O_EF_SELECT_PAYMENT_METHOD_LABEL}</Label>
                <Controller
                name="paymentProof.paymentType"
                control={control}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="paymentProof.paymentType" className="mt-1"><SelectValue placeholder={t['choosePaymentMethodPlaceholder'] || O_EF_CHOOSE_PAYMENT_METHOD_PLACEHOLDER} /></SelectTrigger>
                    <SelectContent>
                        {HAFSA_PAYMENT_METHODS.map(method => <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>)}
                    </SelectContent>
                    </Select>
                )}
                />
                {errors.paymentProof?.paymentType && <p className="text-sm text-destructive mt-1">{errors.paymentProof.paymentType.message}</p>}
            </div>

            {selectedMethodDetails && selectedMethodDetails.accountNumber && (
                 <Card className="mt-4 p-3 sm:p-4 border-primary/20 bg-card shadow-sm rounded-lg">
                    <div className="flex items-center gap-3 sm:gap-4">
                      {selectedMethodDetails.logoPlaceholder && (
                        <Image
                          src={selectedMethodDetails.logoPlaceholder}
                          alt={`${selectedMethodDetails.label} logo`}
                          width={48}
                          height={48}
                          data-ai-hint={selectedMethodDetails.dataAiHint || 'bank logo'}
                          className="rounded-lg h-12 w-12 object-contain flex-shrink-0"
                        />
                      )}
                      <div className="flex-grow space-y-0">
                        <p className="text-lg font-medium text-foreground">{selectedMethodDetails.label}</p>
                        <p className="text-xl font-bold font-mono text-primary">{selectedMethodDetails.accountNumber}</p>
                        {selectedMethodDetails.accountName && (
                          <p className="text-sm text-muted-foreground">{selectedMethodDetails.accountName}</p>
                        )}
                      </div>
                      {selectedMethodDetails.accountNumber && (
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(selectedMethodDetails.accountNumber!);
                              toast({ title: t['copiedToastTitle'] || O_EF_COPIED_TOAST_TITLE, description: t['accountCopiedToastDesc'] || O_EF_ACCOUNT_COPIED_TOAST_DESC });
                            } catch (err) {
                              toast({ title: t['copyFailedToastTitle'] || O_EF_COPY_FAILED_TOAST_TITLE, description: t['copyAccountFailedToastDesc'] || O_EF_COPY_ACCOUNT_FAILED_TOAST_DESC, variant: "destructive" });
                            }
                          }}
                          className="p-1.5 sm:p-2 h-auto text-sm self-center text-primary hover:bg-primary/10 flex-shrink-0"
                          aria-label="Copy account number"
                        >
                          <Copy className="mr-1 h-4 w-4 sm:mr-1.5 sm:h-4 sm:w-4" />
                          {t['copyButton'] || O_EF_COPY_BUTTON}
                        </Button>
                      )}
                    </div>
                    {selectedMethodDetails.additionalInstructions && (
                      <p className="text-xs text-muted-foreground italic mt-3 pt-3 border-t border-border/50">
                        {selectedMethodDetails.additionalInstructions}
                      </p>
                    )}
                 </Card>
            )}

            {watchedPaymentType && (
              <div className="mt-4 space-y-3">
                <Label className="text-sm sm:text-base">{t['proofSubmissionMethodLabel'] || O_EF_PROOF_SUBMISSION_METHOD_LABEL}</Label>
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
                        <Label htmlFor="proofTransactionId" className="font-normal">{t['transactionIdOption'] || O_EF_TRANSACTION_ID_OPTION}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="screenshot" id="proofScreenshot" />
                        <Label htmlFor="proofScreenshot" className="font-normal">{t['uploadScreenshotOption'] || O_EF_UPLOAD_SCREENSHOT_OPTION}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pdfLink" id="proofPdfLink" />
                        <Label htmlFor="proofPdfLink" className="font-normal">{t['providePdfLinkOption'] || O_EF_PROVIDE_PDF_LINK_OPTION}</Label>
                      </div>
                    </RadioGroup>
                  )}
                />
                {errors.paymentProof?.proofSubmissionType && <p className="text-sm text-destructive mt-1">{errors.paymentProof.proofSubmissionType.message}</p>}

                {watchedProofSubmissionType === 'transactionId' && (
                  <div>
                    <Label htmlFor="paymentProof.transactionId" className="text-sm">{t['transactionIdLabel'] || O_EF_TRANSACTION_ID_LABEL}</Label>
                    <Input id="paymentProof.transactionId" {...register('paymentProof.transactionId')} className="mt-1 text-xs sm:text-sm" placeholder={t['transactionIdPlaceholder'] || O_EF_TRANSACTION_ID_PLACEHOLDER}/>
                    {errors.paymentProof?.transactionId && <p className="text-sm text-destructive mt-1">{errors.paymentProof.transactionId.message}</p>}
                  </div>
                )}
                {watchedProofSubmissionType === 'screenshot' && (
                  <div>
                    <Label htmlFor="paymentProof.screenshot" className="text-sm">{t['uploadScreenshotLabel'] || O_EF_UPLOAD_SCREENSHOT_LABEL}</Label>
                    <Input
                        id="paymentProof.screenshot"
                        type="file"
                        accept="image/*,application/pdf"
                        className="mt-1"
                        {...register('paymentProof.screenshot')}
                    />
                    {errors.paymentProof?.screenshot && <p className="text-sm text-destructive mt-1">{(errors.paymentProof.screenshot as any).message}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                        {t['screenshotDesc'] || O_EF_SCREENSHOT_DESC}
                    </p>
                  </div>
                )}
                {watchedProofSubmissionType === 'pdfLink' && (
                  <div>
                    <Label htmlFor="paymentProof.pdfLink" className="text-sm">{t['pdfLinkLabel'] || O_EF_PDF_LINK_LABEL}</Label>
                    <Input id="paymentProof.pdfLink" {...register('paymentProof.pdfLink')} className="mt-1 text-xs sm:text-sm" placeholder={t['pdfLinkPlaceholder'] || O_EF_PDF_LINK_PLACEHOLDER}/>
                    {errors.paymentProof?.pdfLink && <p className="text-sm text-destructive mt-1">{errors.paymentProof.pdfLink.message}</p>}
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
                                "flex flex-col items-center justify-center p-2 rounded-full transition-all duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-primary w-[70px] h-14 sm:w-auto",
                                activeDashboardTab === tab.value
                                    ? "bg-primary-foreground text-primary scale-105 shadow-md"
                                    : "hover:bg-white/20"
                            )}
                            aria-label={t[tab.mobileLabelKey] || (tab.mobileLabelKey === 'dashEnrollTabLabel' ? O_EF_DASH_ENROLL_TAB_LABEL : tab.mobileLabelKey === 'dashProgramsTabLabel' ? O_EF_DASH_PROGRAMS_TAB_LABEL : O_EF_DASH_PAYMENT_TAB_LABEL)}
                            type="button"
                        >
                            <tab.icon className="h-5 w-5 mb-0.5" />
                            <span className="text-xs font-medium">{t[tab.mobileLabelKey] || (tab.mobileLabelKey === 'dashEnrollTabLabel' ? O_EF_DASH_ENROLL_TAB_LABEL : tab.mobileLabelKey === 'dashProgramsTabLabel' ? O_EF_DASH_PROGRAMS_TAB_LABEL : O_EF_DASH_PAYMENT_TAB_LABEL)}</span>
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
                                toast({title: t['noEnrollmentsToastTitle'] || O_EF_NO_ENROLLMENTS_TOAST_TITLE, description: t['addParticipantBeforePaymentToastDesc'] || O_EF_ADD_PARTICIPANT_BEFORE_PAYMENT_TOAST_DESC, variant: "destructive"});
                                return;
                            }
                             if (!firebaseUser && !localStorage.getItem(LOCALSTORAGE_PARENT_KEY)) { 
                                toast({title: t['accountRequiredToastTitle'] || O_EF_ACCOUNT_REQUIRED_TOAST_TITLE, description: t['createOrLoginToastDesc'] || O_EF_CREATE_OR_LOGIN_TOAST_DESC, variant: "destructive"});
                                setCurrentView('accountCreation');
                                return;
                            }
                            setActiveDashboardTab('payment')
                        }}
                        disabled={isLoading || (participantFields.length === 0)}
                        className="w-full sm:ml-auto sm:w-auto"
                    >
                        {t['proceedToPaymentButton'] || O_EF_PROCEED_TO_PAYMENT_BUTTON} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                ) : (
                    <Button type="submit"
                        disabled={isLoading || !getValues('agreeToTerms') || calculatedPrice <= 0 || !getValues('paymentProof.paymentType') || !getValues('paymentProof.proofSubmissionType')}
                        className="w-full sm:ml-auto sm:w-auto"
                    >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                        {(t['submitRegistrationButtonPrefix'] || O_EF_SUBMIT_REGISTRATION_BUTTON_PREFIX)}{calculatedPrice.toFixed(2)})
                    </Button>
                )}
            </CardFooter>
          )}
        </Card>
      </form>
       <Dialog open={showAccountDialogFromParent} onOpenChange={(isOpen) => { if (!isOpen) { setShowPasswordInDialog(false); } onCloseAccountDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center"><UserCog className="mr-2 h-5 w-5 text-primary"/>{t['accountInfoDialogTitle'] || O_EF_ACCOUNT_INFO_DIALOG_TITLE}</DialogTitle>
            <DialogDescription>
                {firebaseUser ? `${t['loggedInAsPrefix'] || O_EF_LOGGED_IN_AS_PREFIX}${firebaseUser.email}` :
                 (parentInfoForDialog?.parentEmail && parentInfoForDialog.password ? `${t['primaryAccountGuestPrefix'] || O_EF_PRIMARY_ACCOUNT_GUEST_PREFIX}${parentInfoForDialog.parentEmail}` : 
                  parentInfoForDialog?.parentEmail ? `${t['primaryAccountIncompletePrefix'] || O_EF_PRIMARY_ACCOUNT_INCOMPLETE_PREFIX}${parentInfoForDialog.parentEmail}` : 
                  (t['noAccountActiveMsg'] || O_EF_NO_ACCOUNT_ACTIVE_MSG))}
            </DialogDescription>
          </DialogHeader>
          { (firebaseUser || (parentInfoForDialog?.parentEmail && parentInfoForDialog.password)) && (
            <div className="space-y-2 py-2 text-sm">
              <p><strong>{t['dialogFullNameLabel'] || O_EF_DIALOG_FULL_NAME_LABEL}</strong> {parentInfoForDialog?.parentFullName || firebaseUser?.displayName || 'N/A'}</p>
              <p><strong>{t['dialogEmailLabel'] || O_EF_DIALOG_EMAIL_LABEL}</strong> {parentInfoForDialog?.parentEmail || firebaseUser?.email || 'N/A'}</p>
              {parentInfoForDialog?.parentPhone1 && <p><strong>{t['dialogPhoneLabel'] || O_EF_DIALOG_PHONE_LABEL}</strong> {parentInfoForDialog.parentPhone1}</p>}

              {parentInfoForDialog?.password && !firebaseUser && ( 
                <div className="flex items-center justify-between">
                    <p><strong>{t['dialogPasswordLabel'] || O_EF_DIALOG_PASSWORD_LABEL}</strong> {showPasswordInDialog ? parentInfoForDialog.password : '••••••••'}</p>
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
                        toast({title: t['loggedOutToastTitle'] || O_EF_LOGGED_OUT_TOAST_TITLE, description: t['loggedOutSuccessToastDesc'] || O_EF_LOGGED_OUT_SUCCESS_TOAST_DESC});
                        setValue('parentInfo', defaultParentValues);
                        setValue('participants', []);
                        resetField('loginEmail'); 
                        resetField('loginPassword');
                        clearLocalStorageData(); 
                        setCurrentView('accountCreation');
                        onStageChange('initial');
                        onCloseAccountDialog();
                    } catch (error) {
                        toast({title: t['logoutErrorToastTitle'] || O_EF_LOGOUT_ERROR_TOAST_TITLE, description: t['logoutFailedToastDesc'] || O_EF_LOGOUT_FAILED_TOAST_DESC, variant: "destructive"});
                    }
                }
             }} variant="outline" className="mt-2 w-full">{t['dialogLogoutButton'] || O_EF_DIALOG_LOGOUT_BUTTON}</Button>
          )}
          <Button onClick={() => { setShowPasswordInDialog(false); onCloseAccountDialog(); }} className="mt-2 w-full">{t['dialogCloseButton'] || O_EF_DIALOG_CLOSE_BUTTON}</Button>
        </DialogContent>
      </Dialog>
    </FormProvider>
  );
};

export default EnrollmentForm;
