
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, FormProvider, Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { User, CreditCard, CheckCircle, ArrowRight, Loader2, CalendarIcon, Users, PlusCircle, Trash2, UserCog, BookOpenText, Baby, GraduationCap, Briefcase, LayoutList, Copy, ArrowLeft, LogIn, Eye, EyeOff, Phone, Mail, ShieldQuestion } from 'lucide-react';
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

import { HAFSA_PROGRAMS, HafsaProgram, ProgramField, HAFSA_PAYMENT_METHODS } from '@/lib/constants';
import type { EnrollmentFormData, ParentInfoData, ParticipantInfoData, EnrolledParticipantData, RegistrationData } from '@/types';
import { EnrollmentFormSchema, ParentInfoSchema as RHFParentInfoSchema, ParticipantInfoSchema as RHFParticipantInfoSchema } from '@/types';
import { handlePaymentVerification } from '@/app/actions';
import Receipt from '@/components/receipt';


const defaultParentValues: ParentInfoData = {
  parentFullName: '',
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


const ParentInfoFields: React.FC = () => {
  const { register, formState: { errors } } = useFormContext<EnrollmentFormData>(); // Use useFormContext
  
  const currentErrors = errors.parentInfo || {};
  
  const title = "Primary Account Information";
  const nameLabel = "Full Name";
  const nameField = "parentInfo.parentFullName";
  const phone1Field = "parentInfo.parentPhone1";
  const passwordField = "parentInfo.password";
  const confirmPasswordField = "parentInfo.confirmPassword";


  return (
    <Card className="mb-4 sm:mb-6 p-3 sm:p-4 border-primary/20 border shadow-none">
      <CardHeader className="p-2 pb-1">
        <CardTitle className="text-lg sm:text-xl font-headline text-primary flex items-center">
          <User className="mr-2 h-5 w-5"/> {title}
        </CardTitle>
        <CardDescription>Details for the main account holder. This information will be used for login.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-2 pt-1">
        <div>
          <Label htmlFor={nameField}>{nameLabel}</Label>
          <Input id={nameField} {...register(nameField as any)} placeholder={nameLabel} />
          {(currentErrors as any)?.parentFullName && <p className="text-sm text-destructive mt-1">{(currentErrors as any).parentFullName.message}</p>}
        </div>
        
        <div>
            <Label htmlFor={phone1Field}>Primary Phone Number (used for login)</Label>
            <Input id={phone1Field} {...register(phone1Field as any)} type="tel" placeholder="e.g., 0911XXXXXX" />
            {(currentErrors as any)?.parentPhone1 && <p className="text-sm text-destructive mt-1">{(currentErrors as any).parentPhone1.message}</p>}
        </div>
       
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
                <Label htmlFor={passwordField}>Password</Label>
                <Input id={passwordField} {...register(passwordField as any)} type="password" placeholder="Create a password" />
                {(currentErrors as any)?.password && <p className="text-sm text-destructive mt-1">{(currentErrors as any).password.message}</p>}
            </div>
            <div>
                <Label htmlFor={confirmPasswordField}>Confirm Password</Label>
                <Input id={confirmPasswordField} {...register(confirmPasswordField as any)} type="password" placeholder="Confirm your password" />
                {(currentErrors as any)?.confirmPassword && <p className="text-sm text-destructive mt-1">{(currentErrors as any).confirmPassword.message}</p>}
            </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ParticipantDetailFields: React.FC<{ 
    programSpecificFields?: ProgramField[];
    onSave: (data: ParticipantInfoData) => void; 
    onCancel: () => void;
    isLoading: boolean;
    selectedProgramLabel?: string;
}> = ({ programSpecificFields, onSave, onCancel, isLoading, selectedProgramLabel }) => {
  
  const { control, register, handleSubmit: handleParticipantSubmit, formState: { errors: participantErrors }, reset: resetParticipantForm, setValue, watch: watchParticipantForm } = useForm<ParticipantInfoData>({
    resolver: zodResolver(RHFParticipantInfoSchema), 
    defaultValues: defaultParticipantValues, 
  });

  const mainFormMethods = useFormContext<EnrollmentFormData>();

  useEffect(() => {
    const primaryRegistrantInfo = mainFormMethods.getValues('parentInfo');
    if (primaryRegistrantInfo.parentFullName) {
        setValue('guardianFullName', primaryRegistrantInfo.parentFullName);
    }
    if (primaryRegistrantInfo.parentPhone1) {
        setValue('guardianPhone1', primaryRegistrantInfo.parentPhone1);
        setValue('guardianTelegramPhoneNumber', primaryRegistrantInfo.parentPhone1); 
    }
    setValue('firstName', defaultParticipantValues.firstName);
    setValue('gender', defaultParticipantValues.gender);
    setValue('dateOfBirth', defaultParticipantValues.dateOfBirth);
    setValue('specialAttention', defaultParticipantValues.specialAttention);
    setValue('schoolGrade', defaultParticipantValues.schoolGrade);
    setValue('quranLevel', defaultParticipantValues.quranLevel);
    setValue('guardianPhone2', defaultParticipantValues.guardianPhone2);
    setValue('guardianUsePhone1ForTelegram', defaultParticipantValues.guardianUsePhone1ForTelegram);
    setValue('guardianUsePhone2ForTelegram', defaultParticipantValues.guardianUsePhone2ForTelegram);

  }, [selectedProgramLabel, mainFormMethods, setValue]); 


  const guardianPhone1 = watchParticipantForm('guardianPhone1');
  const guardianPhone2 = watchParticipantForm('guardianPhone2');

  const actualOnSave = (data: ParticipantInfoData) => {
    onSave(data);
    resetParticipantForm(defaultParticipantValues); 
  };

  return (
    <Card className="mb-4 sm:mb-6 p-3 sm:p-4 border-dashed">
      <CardHeader className="flex flex-row justify-between items-center p-2 pb-1">
        <CardTitle className="text-lg sm:text-xl font-headline">Add Details for {selectedProgramLabel || "Program"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-2 pt-1">
        <p className="text-sm text-primary font-medium flex items-center"><User className="mr-2 h-4 w-4" /> Participant's Information</p>
        <div>
          <Label htmlFor="firstName">Participant's First Name</Label>
          <Input id="firstName" {...register("firstName")} placeholder="Participant's First Name" />
          {participantErrors.firstName && <p className="text-sm text-destructive mt-1">{participantErrors.firstName.message}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
                <Label htmlFor="gender">Gender</Label>
                <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="gender"><SelectValue placeholder="Select gender" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                    </Select>
                    )}
                />
                {participantErrors.gender && <p className="text-sm text-destructive mt-1">{participantErrors.gender.message}</p>}
            </div>
            <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Controller
                    name="dateOfBirth"
                    control={control}
                    render={({ field }) => (
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
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
        {programSpecificFields?.map(fieldInfo => (
          <div key={fieldInfo.name}>
            <Label htmlFor={fieldInfo.name as string}>{fieldInfo.label}</Label>
            {fieldInfo.type === 'text' && (
              <Textarea id={fieldInfo.name as string} {...register(fieldInfo.name as any)} placeholder={fieldInfo.label} />
            )}
            {fieldInfo.type === 'select' && (
              <Controller
                name={fieldInfo.name as any}
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id={fieldInfo.name as string}><SelectValue placeholder={`Select ${fieldInfo.label.toLowerCase()}`} /></SelectTrigger>
                    <SelectContent>{fieldInfo.options?.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                  </Select>
                )}
              />
            )}
            {(participantErrors as any)[fieldInfo.name] && <p className="text-sm text-destructive mt-1">{(participantErrors as any)[fieldInfo.name].message}</p>}
          </div>
        ))}

        <Separator className="my-4" />
        <p className="text-sm text-primary font-medium flex items-center"><ShieldQuestion className="mr-2 h-4 w-4" /> Guardian's Contact (for this participant)</p>
         <div>
          <Label htmlFor="guardianFullName">Guardian's Full Name</Label>
          <Input id="guardianFullName" {...register("guardianFullName")} placeholder="Guardian's Full Name" />
          {participantErrors.guardianFullName && <p className="text-sm text-destructive mt-1">{participantErrors.guardianFullName.message}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <Label htmlFor="guardianPhone1">Guardian's Primary Phone</Label>
            <Input id="guardianPhone1" {...register("guardianPhone1")} type="tel" placeholder="e.g., 0911XXXXXX" />
            {participantErrors.guardianPhone1 && <p className="text-sm text-destructive mt-1">{participantErrors.guardianPhone1.message}</p>}
          </div>
          <div>
            <Label htmlFor="guardianPhone2">Guardian's Secondary Phone (Optional)</Label>
            <Input id="guardianPhone2" {...register("guardianPhone2")} type="tel" placeholder="e.g., 0912XXXXXX" />
            {participantErrors.guardianPhone2 && <p className="text-sm text-destructive mt-1">{participantErrors.guardianPhone2.message}</p>}
          </div>
        </div>
        <div>
          <Label htmlFor="guardianTelegramPhoneNumber">Guardian's Telegram Phone</Label>
          <Input id="guardianTelegramPhoneNumber" {...register("guardianTelegramPhoneNumber")} type="tel" placeholder="For Telegram updates" />
          {participantErrors.guardianTelegramPhoneNumber && <p className="text-sm text-destructive mt-1">{participantErrors.guardianTelegramPhoneNumber.message}</p>}
          <div className="mt-2 space-y-1 text-sm">
            <Controller name="guardianUsePhone1ForTelegram" control={control} render={({field}) => (
                <div className="flex items-center gap-2">
                    <Checkbox id="guardianUsePhone1ForTelegram" checked={field.value} onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked && guardianPhone1) setValue('guardianTelegramPhoneNumber', guardianPhone1);
                        if (checked) setValue('guardianUsePhone2ForTelegram', false);
                    }} disabled={!guardianPhone1}/>
                    <Label htmlFor="guardianUsePhone1ForTelegram" className="font-normal">Use Guardian's Primary Phone for Telegram</Label>
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
                    <Label htmlFor="guardianUsePhone2ForTelegram" className="font-normal">Use Guardian's Secondary Phone for Telegram</Label>
                </div>
            )}/>}
          </div>
        </div>

      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 p-2 pt-1">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="w-full sm:w-auto">Cancel</Button>
          <Button type="button" onClick={handleParticipantSubmit(actualOnSave)} disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? <Loader2 className="animate-spin mr-2"/> : <PlusCircle className="mr-2 h-4 w-4" />} Save Participant
          </Button>
      </CardFooter>
    </Card>
  );
};

interface EnrollmentFormProps {
  onStageChange: (stage: 'initial' | 'accountCreated') => void;
  showAccountDialogFromParent: boolean;
  onCloseAccountDialog: () => void;
}

type DashboardTab = 'enrollments' | 'programs' | 'payment';


const EnrollmentForm: React.FC<EnrollmentFormProps> = ({ onStageChange, showAccountDialogFromParent, onCloseAccountDialog }) => {
  const [currentView, setCurrentView] = useState<'accountCreation' | 'dashboard' | 'addParticipant' | 'confirmation'>('accountCreation');
  const [activeDashboardTab, setActiveDashboardTab] = useState<DashboardTab>('enrollments');
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [isLoading, setIsLoading] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [programForNewParticipant, setProgramForNewParticipant] = useState<HafsaProgram | null>(null);
  const [showPasswordInDialog, setShowPasswordInDialog] = useState(false);
  
  const methods = useForm<EnrollmentFormData>({
    resolver: zodResolver(EnrollmentFormSchema),
    defaultValues: {
      parentInfo: defaultParentValues,
      participants: [],
      agreeToTerms: false,
      couponCode: '',
      paymentProof: { paymentType: HAFSA_PAYMENT_METHODS[0]?.value || '', proofSubmissionType: 'transactionId' },
      loginIdentifier: '',
      loginPassword: '',
    },
  });

  const { control, handleSubmit, formState: { errors }, setValue, getValues, trigger, watch, reset, register } = methods;

  const { fields: participantFields, append: appendParticipant, remove: removeParticipant } = useFieldArray({
    control,
    name: "participants",
  });
  
  const watchedParticipants = watch('participants');
  const watchedPaymentType = watch('paymentProof.paymentType');
  const watchedProofSubmissionType = watch('paymentProof.proofSubmissionType');

  const dashboardTabsConfig = [
    { value: 'enrollments' as DashboardTab, desktopLabel: 'Manage Enrollments', mobileLabel: 'Enroll', icon: Users },
    { value: 'programs' as DashboardTab, desktopLabel: 'View Programs', mobileLabel: 'Programs', icon: LayoutList },
    { value: 'payment' as DashboardTab, desktopLabel: 'Payment & Submission', mobileLabel: 'Payment', icon: CreditCard },
  ];

  useEffect(() => {
    let total = 0;
    if (watchedParticipants) {
      watchedParticipants.forEach(enrolledParticipant => {
        const program = HAFSA_PROGRAMS.find(p => p.id === enrolledParticipant.programId);
        if (program) {
          total += program.price;
        }
      });
    }
    setCalculatedPrice(total);
  }, [watchedParticipants]);

  const handleAccountCreation = async () => {
    const fieldsToValidate: (keyof ParentInfoData)[] = ['parentFullName', 'parentPhone1', 'password', 'confirmPassword'];
    const mainFormTrigger = methods.trigger; 
    const isValid = await mainFormTrigger(fieldsToValidate.map(f => `parentInfo.${f}` as `parentInfo.${keyof ParentInfoData}` ));

    if (isValid) {
        setActiveDashboardTab('enrollments');
        setCurrentView('dashboard');
        onStageChange('accountCreated'); 
    } else {
      toast({ title: "Validation Error", description: "Please check your entries in Primary Account Information and try again.", variant: "destructive" });
    }
  };

  const handleLoginAttempt = async () => {
    const isValid = await trigger(['loginIdentifier', 'loginPassword']);
    if (isValid) {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000)); 
      const { loginIdentifier, loginPassword } = getValues();
      const registeredParentInfo = getValues('parentInfo');

      let loginSuccess = false;

      if (registeredParentInfo && registeredParentInfo.password && registeredParentInfo.parentPhone1 === loginIdentifier && registeredParentInfo.password === loginPassword) {
        loginSuccess = true;
      } 
      else if (loginIdentifier === "0911223344" && loginPassword === "password") {
        loginSuccess = true;
         setValue('parentInfo', { 
            parentFullName: 'Hafsa Admin (Stubbed)', 
            parentPhone1: loginIdentifier, 
            password: loginPassword, 
            confirmPassword: loginPassword, 
        });
      }


      if (loginSuccess) {
        toast({ title: "Login Successful!", description: "Welcome back!" });
        setActiveDashboardTab('enrollments');
        setCurrentView('dashboard');
        onStageChange('accountCreated'); 
      } else {
        toast({ title: "Login Failed", description: "Invalid credentials. (Hint: 0911223344 / password, or use registered details if you just created an account).", variant: "destructive" });
      }
      setIsLoading(false);
    } else {
      toast({ title: "Validation Error", description: "Please fill in your login phone number and password.", variant: "destructive" });
    }
  };

  const handleAddParticipantClick = () => {
    setProgramForNewParticipant(null); 
    setCurrentView('addParticipant');
  };

  const handleSaveParticipant = (participantData: ParticipantInfoData) => {
    if (!programForNewParticipant) {
        toast({ title: "Error", description: "No program selected.", variant: "destructive" });
        return;
    }
    const newEnrolledParticipant: EnrolledParticipantData = {
        programId: programForNewParticipant.id,
        participantInfo: participantData,
    };
    appendParticipant(newEnrolledParticipant);
    setCurrentView('dashboard');
    setActiveDashboardTab('enrollments');
    toast({title: "Participant Added", description: `${participantData.firstName} has been added for ${programForNewParticipant.label}.`})
  };
  
  const onSubmit = async (data: EnrollmentFormData) => {
    setIsLoading(true);
    try {
      if (data.participants && data.participants.length > 0 && !data.paymentProof) {
        toast({ title: "Payment Information Missing", description: "Please provide payment details.", variant: "destructive" });
        setIsLoading(false);
        setActiveDashboardTab('payment'); 
        return;
      }
      
      if (data.paymentProof && !data.paymentProof.proofSubmissionType) {
        toast({ title: "Proof Submission Missing", description: "Please select how you will provide payment proof.", variant: "destructive" });
        setIsLoading(false);
        setActiveDashboardTab('payment');
        await trigger('paymentProof.proofSubmissionType');
        return;
      }

      let screenshotDataUri: string | undefined;
      if (data.paymentProof?.proofSubmissionType === 'screenshot' && data.paymentProof?.screenshot) {
        screenshotDataUri = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(data.paymentProof!.screenshot as File);
        });
        setValue('paymentProof.screenshotDataUri', screenshotDataUri); 
        if(data.paymentProof) data.paymentProof.screenshotDataUri = screenshotDataUri; 
      } else if (data.paymentProof?.proofSubmissionType === 'screenshot' && data.paymentProof?.screenshotDataUri) {
        screenshotDataUri = data.paymentProof.screenshotDataUri;
      }
      
      const selectedBankDetails = HAFSA_PAYMENT_METHODS.find(m => m.value === data.paymentProof?.paymentType);
      const verificationInput = {
        paymentProof: {
            ...data.paymentProof!,
            screenshotDataUri: screenshotDataUri, 
        },
        expectedAmount: calculatedPrice,
      };

      const result = await handlePaymentVerification(verificationInput);

      if (result.isPaymentValid) {
        toast({
          title: "Payment Submitted!",
          description: result.message || "Your payment information has been submitted for processing.",
          variant: "default",
          className: "bg-accent text-accent-foreground",
        });
        
        const finalRegistrationData: RegistrationData = {
          parentInfo: data.parentInfo,
          participants: data.participants || [],
          agreeToTerms: data.agreeToTerms,
          couponCode: data.couponCode,
          paymentProof: data.paymentProof!,
          calculatedPrice: calculatedPrice,
          paymentVerified: result.isPaymentValid,
          paymentVerificationDetails: result,
          registrationDate: new Date(),
        };
        setRegistrationData(finalRegistrationData);
        setCurrentView('confirmation');
      } else {
        toast({
          title: "Payment Issue",
          description: result.message || result.reason || "Please check your payment details and try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Submission error:", error);
      const errorMessage = error.message || "An unexpected error occurred. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (currentView === 'confirmation' && registrationData) {
    return <Receipt data={registrationData} />;
  }

  const renderAccountCreation = () => (
    <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as 'register' | 'login')} className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="register">Register New Account</TabsTrigger>
        <TabsTrigger value="login">Login to Existing Account</TabsTrigger>
      </TabsList>
      <TabsContent value="register" className="space-y-4 sm:space-y-6">
        <ParentInfoFields />
        <Button type="button" onClick={handleAccountCreation} disabled={isLoading} className="w-full">
            Create Account & Proceed <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </TabsContent>
      <TabsContent value="login" className="space-y-4 sm:space-y-6">
        <Card className="p-3 sm:p-4 border-primary/20">
          <CardHeader className="p-2 pb-1">
            <CardTitle className="text-lg sm:text-xl font-headline text-primary flex items-center">
              <LogIn className="mr-2 h-5 w-5"/> Login
            </CardTitle>
            <CardDescription>Enter your credentials to access your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-2 pt-1">
            <div>
              <Label htmlFor="loginIdentifier">Phone Number (used for registration)</Label>
              <Input id="loginIdentifier" {...register('loginIdentifier')} placeholder="e.g., 0911XXXXXX" type="tel"/>
              {errors.loginIdentifier && <p className="text-sm text-destructive mt-1">{errors.loginIdentifier.message}</p>}
            </div>
            <div>
              <Label htmlFor="loginPassword">Password</Label>
              <Input id="loginPassword" {...register('loginPassword')} type="password" placeholder="Enter your password" />
              {errors.loginPassword && <p className="text-sm text-destructive mt-1">{errors.loginPassword.message}</p>}
            </div>
          </CardContent>
        </Card>
        <Button type="button" onClick={handleLoginAttempt} disabled={isLoading} className="w-full">
          Login & Proceed <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </TabsContent>
    </Tabs>
  );

  const renderAddParticipant = () => (
    <div className="space-y-4 sm:space-y-6">
      {!programForNewParticipant ? (
        <div>
          <h3 className="text-xl sm:text-2xl font-semibold mb-1 text-primary">Select a Program</h3>
          <p className="text-muted-foreground mb-4 text-sm">Choose a program to enroll a participant.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {HAFSA_PROGRAMS.map(prog => {
              let IconComponent;
              switch(prog.category) {
                case 'daycare': IconComponent = Baby; break;
                case 'quran_kids': IconComponent = GraduationCap; break; 
                case 'arabic_women': IconComponent = Briefcase; break; 
                default: IconComponent = BookOpenText;
              }
              
              return (
                <Card 
                  key={prog.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col p-0"
                  onClick={() => setProgramForNewParticipant(prog)}
                >
                  <CardHeader className="pb-2 pt-3 px-3 sm:px-4">
                    <div className="flex items-center space-x-2 sm:space-x-3 mb-1">
                        <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                        <CardTitle className="text-base sm:text-lg text-primary">{prog.label}</CardTitle>
                    </div>
                    <CardDescription className="text-xs sm:text-sm">{prog.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs sm:text-sm flex-grow px-3 sm:px-4 pb-2">
                    {prog.ageRange && <p><strong>Age:</strong> {prog.ageRange}</p>}
                    {prog.duration && <p><strong>Duration:</strong> {prog.duration}</p>}
                    {prog.schedule && <p><strong>Schedule:</strong> {prog.schedule}</p>}
                  </CardContent>
                  <CardFooter className="pt-2 px-3 sm:px-4 pb-3">
                    <p className="text-sm sm:text-base font-semibold text-accent">${prog.price.toFixed(2)}</p>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
           <Button type="button" variant="outline" onClick={() => { setCurrentView('dashboard'); setActiveDashboardTab('enrollments');}} className="w-full mt-4 sm:mt-6">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </div>
      ) : (
        <>
          <ParticipantDetailFields 
              programSpecificFields={programForNewParticipant.specificFields}
              onSave={handleSaveParticipant}
              onCancel={() => { setProgramForNewParticipant(null);}}
              isLoading={isLoading}
              selectedProgramLabel={programForNewParticipant.label}
          />
           <Button type="button" variant="outline" onClick={() => { setProgramForNewParticipant(null);}} className="w-full sm:w-auto mt-2">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Program Selection
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
                <div className="flex items-center justify-center space-x-2 sm:space-x-3 bg-muted p-1.5 rounded-lg shadow-sm mx-auto max-w-2xl">
                    {dashboardTabsConfig.map(tab => (
                    <button
                        key={tab.value}
                        onClick={() => setActiveDashboardTab(tab.value)}
                        className={cn(
                        "flex-1 flex items-center justify-center gap-2 sm:gap-2.5 px-3 py-2.5 sm:px-4 sm:py-3 rounded-md transition-colors duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-muted text-sm sm:text-base font-medium",
                        activeDashboardTab === tab.value
                            ? "bg-primary text-primary-foreground shadow"
                            : "text-muted-foreground hover:bg-background hover:text-primary"
                        )}
                        aria-label={tab.desktopLabel}
                        type="button"
                    >
                        <tab.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span>{tab.desktopLabel}</span>
                    </button>
                    ))}
                </div>
            </div>
        )}

        <TabsContent value="enrollments" className="space-y-3 sm:space-y-4 pt-1 sm:pt-2">
            <h3 className="text-xl font-semibold text-primary">Manage Enrollments</h3>
            
            {participantFields.map((field, index) => {
                const enrolledParticipant = field as unknown as EnrolledParticipantData;
                const program = HAFSA_PROGRAMS.find(p => p.id === enrolledParticipant.programId);
                return (
                <Card key={field.id} className="p-3 mb-2 bg-background/80">
                    <div className="flex justify-between items-start">
                    <div>
                        <p className="font-semibold text-md">{enrolledParticipant.participantInfo.firstName}</p>
                        <p className="text-xs text-muted-foreground">{program?.label || 'Unknown Program'} - ${program?.price.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground mt-1">Guardian: {enrolledParticipant.participantInfo.guardianFullName} ({enrolledParticipant.participantInfo.guardianPhone1})</p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeParticipant(index)} className="text-destructive hover:text-destructive/80 p-1.5 h-auto">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    </div>
                </Card>
                );
            })}
            
            {(participantFields.length === 0) && (
                <div className="text-center py-4 sm:py-6">
                    <p className="text-muted-foreground mb-3 sm:mb-4 text-sm">No participants added yet. Click below to add an enrollment.</p>
                </div>
            )}

            <Button type="button" variant="default" onClick={handleAddParticipantClick} className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Participant / Enrollment
            </Button>
        </TabsContent>
        
        <TabsContent value="programs" className="space-y-3 sm:space-y-4 pt-1 sm:pt-2">
            <h3 className="text-xl font-semibold text-primary mb-2">Available Programs</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {HAFSA_PROGRAMS.map(prog => {
                let IconComponent;
                switch(prog.category) {
                    case 'daycare': IconComponent = Baby; break;
                    case 'quran_kids': IconComponent = GraduationCap; break; 
                    case 'arabic_women': IconComponent = Briefcase; break; 
                    default: IconComponent = BookOpenText;
                }
                return (
                    <Card key={prog.id} className="flex flex-col p-0">
                    <CardHeader className="pb-2 pt-3 px-3 sm:px-4">
                        <div className="flex items-center space-x-2 sm:space-x-3 mb-1">
                            <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                            <CardTitle className="text-base sm:text-lg text-primary">{prog.label}</CardTitle>
                        </div>
                        <CardDescription className="text-xs sm:text-sm">{prog.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-xs sm:text-sm flex-grow px-3 sm:px-4 pb-2">
                        {prog.ageRange && <p><strong>Age:</strong> {prog.ageRange}</p>}
                        {prog.duration && <p><strong>Duration:</strong> {prog.duration}</p>}
                        {prog.schedule && <p><strong>Schedule:</strong> {prog.schedule}</p>}
                    </CardContent>
                    <CardFooter className="pt-2 px-3 sm:px-4 pb-3">
                        <p className="text-sm sm:text-base font-semibold text-accent">${prog.price.toFixed(2)}</p>
                    </CardFooter>
                    </Card>
                );
                })}
            </div>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4 sm:space-y-6 pt-1 sm:pt-2">
            <h3 className="text-xl font-semibold text-primary">Payment & Verification</h3>
            <div className="p-3 sm:p-4 border rounded-lg bg-primary/10">
                <h3 className="text-base sm:text-lg font-semibold font-headline text-primary">Payment Summary</h3>
                <p className="mt-1 sm:mt-2 text-lg sm:text-xl font-bold text-primary">Total Amount Due: ${calculatedPrice.toFixed(2)}</p>
            </div>
            <div>
                <Label htmlFor="couponCode">Coupon Code (Optional)</Label>
                <div className="flex items-center gap-2 mt-1">
                    <Input id="couponCode" {...register('couponCode')} placeholder="Enter coupon code" className="flex-grow"/>
                    <Button type="button" variant="outline" size="sm" onClick={() => toast({title: "Coupon Applied!", description:"(Example: 10% off - not functional yet)"})}>Apply</Button>
                </div>
                 {errors.couponCode && <p className="text-sm text-destructive mt-1">{errors.couponCode.message}</p>}
            </div>
            <div>
                <Label htmlFor="paymentProof.paymentType" className="text-sm sm:text-base">Select Payment Method (Bank)</Label>
                <Controller
                name="paymentProof.paymentType"
                control={control}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="paymentProof.paymentType" className="mt-1"><SelectValue placeholder="Choose payment method" /></SelectTrigger>
                    <SelectContent>
                        {HAFSA_PAYMENT_METHODS.map(method => <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>)}
                    </SelectContent>
                    </Select>
                )}
                />
                {errors.paymentProof?.paymentType && <p className="text-sm text-destructive mt-1">{errors.paymentProof.paymentType.message}</p>}
            </div>

            {selectedMethodDetails && selectedMethodDetails.accountNumber && (
                 <Card className="mt-4 p-3 sm:p-4 border-primary/20">
                    <CardHeader className="p-0 pb-2 sm:pb-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                        {selectedMethodDetails.logoPlaceholder && (
                            <Image 
                                src={selectedMethodDetails.logoPlaceholder} 
                                alt={`${selectedMethodDetails.label} logo`} 
                                width={24} 
                                height={24} 
                                data-ai-hint={selectedMethodDetails.dataAiHint || 'bank logo'} 
                                className="rounded h-6 w-6 object-contain"
                            />
                        )}
                        <CardTitle className="text-md text-primary">{selectedMethodDetails.label}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-1.5 p-0 text-xs sm:text-sm">
                        {selectedMethodDetails.accountName && <p><span className="font-medium">Account Name:</span> {selectedMethodDetails.accountName}</p>}
                        {selectedMethodDetails.accountNumber && (
                        <div className="flex items-center justify-between">
                            <p><span className="font-medium">Account Number:</span> <span className="font-bold font-mono">{selectedMethodDetails.accountNumber}</span></p>
                            <Button
                                variant="ghost"
                                size="sm"
                                type="button"
                                onClick={async () => {
                                    try {
                                    await navigator.clipboard.writeText(selectedMethodDetails.accountNumber!);
                                    toast({ title: "Copied!", description: "Account number copied to clipboard." });
                                    } catch (err) {
                                    toast({ title: "Failed to copy", description: "Could not copy account number.", variant: "destructive" });
                                    }
                                }}
                                className="p-1 h-auto text-xs"
                            >
                                <Copy className="mr-1 h-3 w-3" /> Copy
                            </Button>
                        </div>
                        )}
                        {selectedMethodDetails.additionalInstructions && <p className="text-muted-foreground italic mt-1 text-xs">{selectedMethodDetails.additionalInstructions}</p>}
                    </CardContent>
                 </Card>
            )}
            
            {watchedPaymentType && (
              <div className="mt-4 space-y-3">
                <Label className="text-sm sm:text-base">Proof Submission Method</Label>
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
                        <Label htmlFor="proofTransactionId" className="font-normal">Transaction ID / Reference</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="screenshot" id="proofScreenshot" />
                        <Label htmlFor="proofScreenshot" className="font-normal">Upload Screenshot</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pdfLink" id="proofPdfLink" />
                        <Label htmlFor="proofPdfLink" className="font-normal">Provide PDF Link</Label>
                      </div>
                    </RadioGroup>
                  )}
                />
                {errors.paymentProof?.proofSubmissionType && <p className="text-sm text-destructive mt-1">{errors.paymentProof.proofSubmissionType.message}</p>}

                {watchedProofSubmissionType === 'transactionId' && (
                  <div>
                    <Label htmlFor="paymentProof.transactionId" className="text-sm">Enter Transaction ID / Reference</Label>
                    <Input id="paymentProof.transactionId" {...register('paymentProof.transactionId')} className="mt-1 text-xs sm:text-sm" placeholder="e.g., TRN123456789"/>
                    {errors.paymentProof?.transactionId && <p className="text-sm text-destructive mt-1">{errors.paymentProof.transactionId.message}</p>}
                  </div>
                )}
                {watchedProofSubmissionType === 'screenshot' && (
                  <div>
                    <Label htmlFor="paymentProof.screenshot" className="text-sm">Upload Payment Screenshot</Label>
                    <Input 
                        id="paymentProof.screenshot" 
                        type="file" 
                        accept="image/*" 
                        className="mt-1"
                        {...register('paymentProof.screenshot')}
                    />
                    {errors.paymentProof?.screenshot && <p className="text-sm text-destructive mt-1">{(errors.paymentProof.screenshot as any).message}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                        Upload a clear screenshot of your payment receipt for AI verification.
                    </p>
                  </div>
                )}
                {watchedProofSubmissionType === 'pdfLink' && (
                  <div>
                    <Label htmlFor="paymentProof.pdfLink" className="text-sm">Enter PDF Link to Receipt</Label>
                    <Input id="paymentProof.pdfLink" {...register('paymentProof.pdfLink')} className="mt-1 text-xs sm:text-sm" placeholder="https://example.com/receipt.pdf"/>
                    {errors.paymentProof?.pdfLink && <p className="text-sm text-destructive mt-1">{errors.paymentProof.pdfLink.message}</p>}
                  </div>
                )}
              </div>
            )}

             <div>
                <Controller
                    name="agreeToTerms"
                    control={control}
                    render={({ field }) => (
                    <div className="flex items-center space-x-2 sm:space-x-3 mt-3 sm:mt-4">
                        <Checkbox id="agreeToTermsDashboard" checked={field.value} onCheckedChange={field.onChange} />
                        <Label htmlFor="agreeToTermsDashboard" className="text-xs sm:text-sm font-normal">I agree to the <a href="/terms" target="_blank" className="text-primary hover:underline">terms and conditions</a> of Hafsa Madrassa.</Label>
                    </div>
                    )}
                />
                {errors.agreeToTerms && <p className="text-sm text-destructive mt-1">{errors.agreeToTerms.message}</p>}
            </div>
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
                            aria-label={tab.mobileLabel}
                            type="button"
                        >
                            <tab.icon className="h-5 w-5 mb-0.5" />
                            <span className="text-xs font-medium">{tab.mobileLabel}</span>
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
                                toast({title: "No Enrollments", description: "Please add at least one participant before proceeding to payment.", variant: "destructive"});
                                return;
                            }
                            setActiveDashboardTab('payment')
                        }} 
                        disabled={isLoading || (participantFields.length === 0)} 
                        className="w-full sm:ml-auto sm:w-auto"
                    >
                        Proceed to Payment <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                ) : (
                    <Button type="submit" 
                        disabled={isLoading || !getValues('agreeToTerms') || calculatedPrice <= 0 || !getValues('paymentProof.paymentType') || !getValues('paymentProof.proofSubmissionType')} 
                        className="w-full sm:ml-auto sm:w-auto"
                    >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                        Submit Registration (${calculatedPrice.toFixed(2)})
                    </Button>
                )}
            </CardFooter>
          )}
        </Card>
      </form>
       <Dialog open={showAccountDialogFromParent} onOpenChange={(isOpen) => { if (!isOpen) { setShowPasswordInDialog(false); } onCloseAccountDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center"><UserCog className="mr-2 h-5 w-5 text-primary"/>Account Information</DialogTitle>
            <DialogDescription>
              Details of the primary account holder. {authMode === 'login' && parentInfoForDialog && parentInfoForDialog.parentFullName === 'Hafsa Admin (Stubbed)' && "(Logged In - Stubbed)"}
            </DialogDescription>
          </DialogHeader>
          {parentInfoForDialog && (
            <div className="space-y-2 py-2 text-sm">
              <p><strong>Full Name:</strong> {parentInfoForDialog.parentFullName || 'N/A'}</p>
              <p><strong>Primary Phone:</strong> {parentInfoForDialog.parentPhone1 || 'N/A'}</p>
              {parentInfoForDialog.password && (
                <div className="flex items-center justify-between">
                    <p><strong>Password:</strong> {showPasswordInDialog ? parentInfoForDialog.password : '••••••••'}</p>
                    <Button variant="ghost" size="icon" onClick={() => setShowPasswordInDialog(!showPasswordInDialog)} className="h-7 w-7">
                        {showPasswordInDialog ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
              )}
            </div>
          )}
          <Button onClick={() => { setShowPasswordInDialog(false); onCloseAccountDialog(); }} className="mt-2 w-full">Close</Button>
        </DialogContent>
      </Dialog>
    </FormProvider>
  );
};

export default EnrollmentForm;
    
