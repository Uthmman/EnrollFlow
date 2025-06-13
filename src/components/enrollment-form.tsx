
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, FormProvider, Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { User, CreditCard, CheckCircle, ArrowRight, ArrowLeft, Loader2, CalendarIcon, Users, PlusCircle, Trash2, UserCog, BookOpenText, Baby, GraduationCap, Briefcase, LayoutList, Copy } from 'lucide-react';
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
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { format } from "date-fns";
import { useIsMobile } from '@/hooks/use-mobile';

import { HAFSA_PROGRAMS, HafsaProgram, ProgramField, HAFSA_PAYMENT_METHODS, HafsaPaymentMethod } from '@/lib/constants';
import type { EnrollmentFormData, ParentInfoData, ParticipantInfoData, EnrolledParticipantData, RegistrationData } from '@/types';
import { EnrollmentFormSchema, ParticipantInfoSchema as RHFParticipantInfoSchema } from '@/types'; // Renamed to avoid conflict
import { handlePaymentVerification } from '@/app/actions';
import Receipt from '@/components/receipt';


const defaultParentValues: ParentInfoData = {
  parentFullName: '',
  parentPhone1: '',
  telegramPhoneNumber: '',
  parentPhone2: '',
  usePhone1ForTelegram: false,
  usePhone2ForTelegram: false,
};

const defaultParticipantValues: ParticipantInfoData = {
  firstName: '',
  gender: 'male' as 'male' | 'female',
  dateOfBirth: undefined as any, 
  specialAttention: '',
  schoolGrade: '',
  quranLevel: '',
};


const ParentInfoFields: React.FC = () => {
  const { control, register, formState: { errors }, watch, setValue } = useFormContext<EnrollmentFormData>();
  const fieldPrefix = 'parentInfo';
  const currentErrors = errors.parentInfo || {};
  
  const phone1 = watch(`${fieldPrefix}.parentPhone1`);
  const phone2 = watch(`${fieldPrefix}.parentPhone2`);
  const title = "Primary Registrant Information";
  const nameLabel = "Full Name";
  const nameField = "parentFullName";
  const phone1Field = "parentPhone1";
  const phone2Field = "parentPhone2";

  return (
    <Card className="mb-4 sm:mb-6 p-3 sm:p-4 border-primary/20 border">
      <CardHeader className="p-2 pb-1">
        <CardTitle className="text-lg sm:text-xl font-headline text-primary flex items-center">
          <User className="mr-2 h-5 w-5"/> {title}
        </CardTitle>
        <CardDescription>Please provide details for the main contact person for this registration.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-2 pt-1">
        <div>
          <Label htmlFor={`${fieldPrefix}.${nameField}`}>{nameLabel}</Label>
          <Input id={`${fieldPrefix}.${nameField}`} {...register(`${fieldPrefix}.${nameField}` as any)} placeholder={nameLabel} />
          {(currentErrors as any)[nameField] && <p className="text-sm text-destructive mt-1">{(currentErrors as any)[nameField].message}</p>}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <Label htmlFor={`${fieldPrefix}.${phone1Field}`}>Primary Phone Number</Label>
            <Input id={`${fieldPrefix}.${phone1Field}`} {...register(`${fieldPrefix}.${phone1Field}` as any)} type="tel" placeholder="e.g., 0911XXXXXX" />
            {(currentErrors as any)[phone1Field] && <p className="text-sm text-destructive mt-1">{(currentErrors as any)[phone1Field].message}</p>}
          </div>
          <div>
            <Label htmlFor={`${fieldPrefix}.${phone2Field}`}>Secondary Phone Number (Optional)</Label>
            <Input id={`${fieldPrefix}.${phone2Field}`} {...register(`${fieldPrefix}.${phone2Field}` as any)} type="tel" placeholder="e.g., 0912XXXXXX" />
            {(currentErrors as any)[phone2Field] && <p className="text-sm text-destructive mt-1">{(currentErrors as any)[phone2Field].message}</p>}
          </div>
        </div>
        <div>
          <Label htmlFor={`${fieldPrefix}.telegramPhoneNumber`}>Telegram Phone Number</Label>
          <Input id={`${fieldPrefix}.telegramPhoneNumber`} {...register(`${fieldPrefix}.telegramPhoneNumber` as any)} type="tel" placeholder="For Telegram updates" />
          {(currentErrors as any).telegramPhoneNumber && <p className="text-sm text-destructive mt-1">{(currentErrors as any).telegramPhoneNumber.message}</p>}
          <div className="mt-2 space-y-1 text-sm">
            <Controller name={`${fieldPrefix}.usePhone1ForTelegram` as any} control={control} render={({field}) => (
                <div className="flex items-center gap-2">
                    <Checkbox id={`${fieldPrefix}UsePhone1`} checked={field.value} onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked && phone1) setValue(`${fieldPrefix}.telegramPhoneNumber` as any, phone1);
                        if (checked) setValue(`${fieldPrefix}.usePhone2ForTelegram` as any, false);
                    }} disabled={!phone1}/>
                    <Label htmlFor={`${fieldPrefix}UsePhone1`} className="font-normal">Use Primary Phone for Telegram</Label>
                </div>
            )}/>
            {phone2 && 
            <Controller name={`${fieldPrefix}.usePhone2ForTelegram` as any} control={control} render={({field}) => (
                 <div className="flex items-center gap-2">
                    <Checkbox id={`${fieldPrefix}UsePhone2`} checked={field.value} onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked && phone2) setValue(`${fieldPrefix}.telegramPhoneNumber` as any, phone2);
                        if (checked) setValue(`${fieldPrefix}.usePhone1ForTelegram` as any, false);
                    }} disabled={!phone2}/>
                    <Label htmlFor={`${fieldPrefix}UsePhone2`} className="font-normal">Use Secondary Phone for Telegram</Label>
                </div>
            )}/>}
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
  
  const { control, register, handleSubmit: handleParticipantSubmit, formState: { errors: participantErrors }, reset: resetParticipantForm } = useForm<ParticipantInfoData>({
    resolver: zodResolver(RHFParticipantInfoSchema), 
    defaultValues: defaultParticipantValues, 
  });

  const actualOnSave = (data: ParticipantInfoData) => {
    onSave(data);
    resetParticipantForm(defaultParticipantValues); 
  };

  return (
    <Card className="mb-4 sm:mb-6 p-3 sm:p-4 border-dashed">
      <CardHeader className="flex flex-row justify-between items-center p-2 pb-1">
        <CardTitle className="text-lg sm:text-xl font-headline">Add Participant for {selectedProgramLabel || "Program"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-2 pt-1">
        <div>
          <Label htmlFor="firstName">First Name</Label>
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
  const [isLoading, setIsLoading] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [programForNewParticipant, setProgramForNewParticipant] = useState<HafsaProgram | null>(null);
  
  const methods = useForm<EnrollmentFormData>({
    resolver: zodResolver(EnrollmentFormSchema),
    defaultValues: {
      parentInfo: defaultParentValues,
      participants: [],
      agreeToTerms: false,
      couponCode: '',
      paymentProof: { paymentType: HAFSA_PAYMENT_METHODS[0]?.value || '' },
    },
  });

  const { control, handleSubmit, formState: { errors }, setValue, getValues, trigger, watch, reset, register } = methods;


  const { fields: participantFields, append: appendParticipant, remove: removeParticipant } = useFieldArray({
    control,
    name: "participants",
  });
  
  const watchedParticipants = watch('participants');
  const watchedPaymentType = watch('paymentProof.paymentType');


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
    const fieldsToValidate: (keyof ParentInfoData)[] = ['parentFullName', 'parentPhone1', 'telegramPhoneNumber'];
    
    const isValid = await trigger(fieldsToValidate.map(f => `parentInfo.${f}` as const));
    if (isValid) {
        setActiveDashboardTab('enrollments');
        setCurrentView('dashboard');
        onStageChange('accountCreated'); 
    } else {
      toast({ title: "Validation Error", description: "Please check your entries and try again.", variant: "destructive" });
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
      let screenshotDataUri: string | undefined;
      if (data.paymentProof?.paymentType === 'screenshot_ai_verification' && data.paymentProof?.screenshot) {
        screenshotDataUri = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(data.paymentProof!.screenshot as File);
        });
        setValue('paymentProof.screenshotDataUri', screenshotDataUri); 
        if(data.paymentProof) data.paymentProof.screenshotDataUri = screenshotDataUri; 
      }
      
      const verificationInput = {
        paymentProof: {
          paymentType: data.paymentProof!.paymentType,
          screenshotDataUri: data.paymentProof!.screenshotDataUri,
          pdfLink: data.paymentProof!.pdfLink,
          transactionId: data.paymentProof!.transactionId,
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
          participants: data.participants,
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
  
  if (currentView === 'confirmation' && registrationData) {
    return <Receipt data={registrationData} />;
  }

  const renderAccountCreation = () => (
    <div className="space-y-4 sm:space-y-6">
        <ParentInfoFields />
        <div className="flex flex-col sm:flex-row gap-2">
            <Button type="button" onClick={handleAccountCreation} disabled={isLoading} className="w-full">
                Create Account & Proceed <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </div>
    </div>
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
            <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 p-0 gap-1 bg-transparent border-b rounded-none">
                <TabsTrigger value="enrollments" className="text-sm sm:text-base py-2.5 sm:py-3 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none border-b-2 border-transparent hover:border-muted-foreground/50 transition-colors duration-150">
                    <Users className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 inline-block" /> 
                     <span className="hidden sm:inline">Manage Enrollments</span>
                     <span className="sm:hidden">Enroll</span>
                </TabsTrigger>
                 <TabsTrigger value="programs" className="text-sm sm:text-base py-2.5 sm:py-3 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none border-b-2 border-transparent hover:border-muted-foreground/50 transition-colors duration-150">
                    <LayoutList className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 inline-block" /> 
                    <span className="hidden sm:inline">View Programs</span>
                     <span className="sm:hidden">Programs</span>
                </TabsTrigger>
                <TabsTrigger value="payment" className="text-sm sm:text-base py-2.5 sm:py-3 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none border-b-2 border-transparent hover:border-muted-foreground/50 transition-colors duration-150">
                    <CreditCard className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 inline-block" /> 
                     <span className="hidden sm:inline">Payment</span>
                     <span className="sm:hidden">Payment</span>
                </TabsTrigger>
            </TabsList>
        )}

        <TabsContent value="enrollments" className="space-y-3 sm:space-y-4 pt-1 sm:pt-2">
            <h3 className="text-xl font-semibold text-primary sr-only sm:not-sr-only">Manage Enrollments</h3>
            
            {participantFields.map((field, index) => {
                const enrolledParticipant = field as unknown as EnrolledParticipantData;
                const program = HAFSA_PROGRAMS.find(p => p.id === enrolledParticipant.programId);
                return (
                <Card key={field.id} className="p-3 mb-2 bg-background/80">
                    <div className="flex justify-between items-start">
                    <div>
                        <p className="font-semibold text-md">{enrolledParticipant.participantInfo.firstName}</p>
                        <p className="text-xs text-muted-foreground">{program?.label || 'Unknown Program'} - ${program?.price.toFixed(2)}</p>
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
            <h3 className="text-xl font-semibold text-primary sr-only sm:not-sr-only mb-2">Available Programs</h3>
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
            <h3 className="text-xl font-semibold text-primary sr-only sm:not-sr-only">Payment & Verification</h3>
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
                <Label htmlFor="paymentProof.paymentType" className="text-sm sm:text-base">Select Payment Method</Label>
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
                                width={40} 
                                height={40} 
                                data-ai-hint={selectedMethodDetails.dataAiHint || 'bank logo'} 
                                className="rounded h-8 w-8 sm:h-10 sm:w-10 object-contain"
                            />
                        )}
                        <CardTitle className="text-md sm:text-lg text-primary">{selectedMethodDetails.label} Details</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-1 sm:space-y-1.5 p-0 text-xs sm:text-sm">
                        {selectedMethodDetails.accountName && <p><strong>Account Name:</strong> {selectedMethodDetails.accountName}</p>}
                        {selectedMethodDetails.accountNumber && (
                        <div className="flex items-center justify-between">
                            <p><strong>Account Number:</strong> <span className="font-mono">{selectedMethodDetails.accountNumber}</span></p>
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
                                className="p-1.5 h-auto text-xs"
                            >
                                <Copy className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" /> Copy
                            </Button>
                        </div>
                        )}
                        {selectedMethodDetails.additionalInstructions && <p className="text-muted-foreground italic mt-1">{selectedMethodDetails.additionalInstructions}</p>}
                    </CardContent>
                 </Card>
            )}
            
            { selectedMethodDetails && selectedMethodDetails.accountNumber && (
            <div>
                <Label htmlFor="paymentProof.transactionId" className="text-sm sm:text-base">Transaction ID / Reference</Label>
                <Input id="paymentProof.transactionId" {...register('paymentProof.transactionId')} className="mt-1 text-xs sm:text-sm" placeholder="Enter your transaction ID or reference"/>
                {errors.paymentProof?.transactionId && <p className="text-sm text-destructive mt-1">{errors.paymentProof.transactionId.message}</p>}
            </div>
            )}

             {watchedPaymentType === 'screenshot_ai_verification' && (
              <div>
                <Label htmlFor="paymentProof.screenshot" className="text-sm sm:text-base">Upload Payment Screenshot</Label>
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
                    {[
                        { value: 'enrollments', label: 'Enroll', icon: Users },
                        { value: 'programs', label: 'Programs', icon: LayoutList },
                        { value: 'payment', label: 'Payment', icon: CreditCard },
                    ].map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => setActiveDashboardTab(tab.value as DashboardTab)}
                            className={cn(
                                "flex flex-col items-center justify-center p-2.5 rounded-full transition-all duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-primary w-[70px] h-14 sm:w-20", 
                                activeDashboardTab === tab.value 
                                    ? "bg-primary-foreground text-primary scale-105 shadow-md" 
                                    : "hover:bg-white/20"
                            )}
                            aria-label={tab.label}
                            type="button"
                        >
                            <tab.icon className="h-5 w-5 mb-0.5" />
                            <span className="text-xs font-medium">{tab.label}</span>
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

          {currentView !== 'accountCreation' && currentView !== 'addParticipant' && (
            <CardFooter className="flex flex-col sm:flex-row justify-between items-center pt-3 sm:pt-4 p-3 sm:p-6 gap-y-2 sm:gap-y-0">
                {currentView === 'dashboard' && (
                    <>
                        <Button type="button" variant="outline" onClick={() => { setCurrentView('accountCreation'); onStageChange('initial');}} disabled={isLoading} className="w-full sm:w-auto order-last sm:order-first mt-2 sm:mt-0">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Account Details
                        </Button>
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
                                disabled={isLoading || !getValues('agreeToTerms') || calculatedPrice <= 0} 
                                className="w-full sm:ml-auto sm:w-auto"
                            >
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                Submit Registration (${calculatedPrice.toFixed(2)})
                            </Button>
                        )}
                    </>
                )}
            </CardFooter>
          )}
        </Card>
      </form>
       <Dialog open={showAccountDialogFromParent} onOpenChange={onCloseAccountDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center"><UserCog className="mr-2 h-5 w-5 text-primary"/>Account Information</DialogTitle>
            <DialogDescription>
              Details of the primary registrant.
            </DialogDescription>
          </DialogHeader>
          {parentInfoForDialog && (
            <div className="space-y-2 py-2 text-sm">
              <p><strong>Full Name:</strong> {parentInfoForDialog.parentFullName}</p>
              <p><strong>Primary Phone:</strong> {parentInfoForDialog.parentPhone1}</p>
              {parentInfoForDialog.parentPhone2 && <p><strong>Secondary Phone:</strong> {parentInfoForDialog.parentPhone2}</p>}
              <p><strong>Telegram Phone:</strong> {parentInfoForDialog.telegramPhoneNumber}</p>
            </div>
          )}
          <Button onClick={onCloseAccountDialog} className="mt-2 w-full">Close</Button>
        </DialogContent>
      </Dialog>
    </FormProvider>
  );
};

export default EnrollmentForm;
