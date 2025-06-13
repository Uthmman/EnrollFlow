
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, FormProvider, Controller, useFieldArray, useWatch, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { User, CreditCard, CheckCircle, ArrowRight, ArrowLeft, Loader2, CalendarIcon, Users, PlusCircle, Trash2, UserCog, UserPlus, UserCheck, BookOpenText, Baby, GraduationCap, Briefcase } from 'lucide-react';
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
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { format } from "date-fns";
import { useIsMobile } from '@/hooks/use-mobile';

import { HAFSA_PROGRAMS, HafsaProgram, ProgramField, HAFSA_PAYMENT_METHODS } from '@/lib/constants';
import type { EnrollmentFormData, ParentInfoData, ChildInfoData, AdultTraineeData, RegistrationData, EnrolledChildData } from '@/types';
import { EnrollmentFormSchema, ChildInfoSchema as EnrolledChildInfoSchema } from '@/types'; // Renamed to avoid conflict
import { handlePaymentVerification } from '@/app/actions';
import Receipt from '@/components/receipt';

const defaultChildValues: ChildInfoData = {
  childFirstName: '',
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
          <UserCheck className="mr-2 h-5 w-5"/> {title}
        </CardTitle>
        <CardDescription>Please provide details for the main contact person for this registration.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-2 pt-1">
        <div>
          <Label htmlFor={`${fieldPrefix}.${nameField}`}>{nameLabel}</Label>
          <Input id={`${fieldPrefix}.${nameField}`} {...register(`${fieldPrefix}.${nameField}` as any)} placeholder={nameLabel} />
          {(currentErrors as any)[nameField] && <p className="text-sm text-destructive mt-1">{(currentErrors as any)[nameField].message}</p>}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        setValue(`${fieldPrefix}.usePhone2ForTelegram` as any, false);
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
                        setValue(`${fieldPrefix}.usePhone1ForTelegram` as any, false);
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

const ChildParticipantFields: React.FC<{ 
    programSpecificFields?: ProgramField[];
    onSave: (data: ChildInfoData) => void; 
    onCancel: () => void;
    isLoading: boolean;
    selectedProgramLabel?: string;
}> = ({ programSpecificFields, onSave, onCancel, isLoading, selectedProgramLabel }) => {
  
  const { control, register, handleSubmit: handleChildSubmit, formState: { errors: childErrors }, reset: resetChildForm } = useForm<ChildInfoData>({
    resolver: zodResolver(EnrolledChildInfoSchema), 
    defaultValues: defaultChildValues, 
  });

  const actualOnSave = (data: ChildInfoData) => {
    onSave(data);
    resetChildForm(defaultChildValues); 
  };

  return (
    <Card className="mb-4 sm:mb-6 p-3 sm:p-4 border-dashed">
      <CardHeader className="flex flex-row justify-between items-center p-2 pb-1">
        <CardTitle className="text-lg sm:text-xl font-headline">Add New Child for {selectedProgramLabel || "Program"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-2 pt-1">
        <div>
          <Label htmlFor={`childInfo.childFirstName`}>First Name</Label>
          <Input id={`childInfo.childFirstName`} {...register(`childFirstName`)} placeholder="Child's First Name" />
          {childErrors.childFirstName && <p className="text-sm text-destructive mt-1">{childErrors.childFirstName.message}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <Label htmlFor={`childInfo.gender`}>Gender</Label>
                <Controller
                    name={`gender`}
                    control={control}
                    render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id={`childInfo.gender`}><SelectValue placeholder="Select gender" /></SelectTrigger>
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
                <Label htmlFor={`childInfo.dateOfBirth`}>Date of Birth</Label>
                <Controller
                    name={`dateOfBirth`}
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
                          <Calendar mode="single" selected={field.value ? new Date(field.value): undefined} onSelect={field.onChange} initialFocus disabled={(date) => date > new Date() || date < new Date("2000-01-01")} />
                        </PopoverContent>
                    </Popover>
                    )}
                />
                {childErrors.dateOfBirth && <p className="text-sm text-destructive mt-1">{childErrors.dateOfBirth.message}</p>}
            </div>
        </div>
        {programSpecificFields?.map(fieldInfo => (
          <div key={fieldInfo.name}>
            <Label htmlFor={`childInfo.${fieldInfo.name}`}>{fieldInfo.label}</Label>
            {fieldInfo.type === 'text' && (
              <Textarea id={`childInfo.${fieldInfo.name}`} {...register(fieldInfo.name as any)} placeholder={fieldInfo.label} />
            )}
            {fieldInfo.type === 'select' && (
              <Controller
                name={fieldInfo.name as any}
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id={`childInfo.${fieldInfo.name}`}><SelectValue placeholder={`Select ${fieldInfo.label.toLowerCase()}`} /></SelectTrigger>
                    <SelectContent>{fieldInfo.options?.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                  </Select>
                )}
              />
            )}
            {(childErrors as any)[fieldInfo.name] && <p className="text-sm text-destructive mt-1">{(childErrors as any)[fieldInfo.name].message}</p>}
          </div>
        ))}
      </CardContent>
      <CardFooter className="flex justify-end gap-2 p-2 pt-1">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancel</Button>
          <Button type="button" onClick={handleChildSubmit(actualOnSave)} disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin mr-2"/> : <PlusCircle className="mr-2 h-4 w-4" />} Save Student
          </Button>
      </CardFooter>
    </Card>
  );
};


const EnrollmentForm: React.FC = () => {
  const [currentView, setCurrentView] = useState<'accountCreation' | 'dashboard' | 'addParticipant' | 'confirmation'>('accountCreation');
  const [activeDashboardTab, setActiveDashboardTab] = useState<'enrollments' | 'account' | 'payment'>('enrollments');
  const [isLoading, setIsLoading] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [programForNewParticipant, setProgramForNewParticipant] = useState<HafsaProgram | null>(null);
  const [adultDOB, setAdultDOB] = useState<Date | undefined>(undefined);


  const methods = useForm<EnrollmentFormData>({
    resolver: zodResolver(EnrollmentFormSchema),
    defaultValues: {
      parentInfo: { parentFullName: '', parentPhone1: '', telegramPhoneNumber: '' },
      adultTraineeInfo: undefined, 
      children: [],
      agreeToTerms: false,
      couponCode: '',
      paymentProof: { paymentType: HAFSA_PAYMENT_METHODS[0]?.value || '' },
    },
  });

  const { control, handleSubmit, formState: { errors }, setValue, getValues, trigger, watch, reset, register: formRegister } = methods;


  const { fields: childFields, append: appendChild, remove: removeChild } = useFieldArray({
    control,
    name: "children",
  });
  
  const watchedChildren = watch('children');
  const watchedPaymentType = watch('paymentProof.paymentType');
  const watchedAdultTraineeInfo = watch('adultTraineeInfo');


 useEffect(() => {
    let total = 0;
    
    if (watchedChildren) {
      watchedChildren.forEach(enrolledChild => {
        const program = HAFSA_PROGRAMS.find(p => p.id === enrolledChild.programId);
        if (program) {
          total += program.price;
        }
      });
    }
    
    const adultProgramId = getValues('adultTraineeInfo.programId');
    if (adultProgramId) {
      const program = HAFSA_PROGRAMS.find(p => p.id === adultProgramId);
      if (program) {
        total += program.price;
      }
    }
    setCalculatedPrice(total);
  }, [watchedChildren, getValues, watchedAdultTraineeInfo]);


  const handleAccountCreation = async () => {
    const fieldsToValidate: (keyof ParentInfoData)[] = ['parentFullName', 'parentPhone1', 'telegramPhoneNumber'];
    
    const isValid = await trigger(fieldsToValidate.map(f => `parentInfo.${f}` as const));
    if (isValid) {
        setActiveDashboardTab('enrollments');
        setCurrentView('dashboard');
    } else {
      toast({ title: "Validation Error", description: "Please check your entries and try again.", variant: "destructive" });
    }
  };

  const handleAddParticipantClick = () => {
    setProgramForNewParticipant(null); 
    setAdultDOB(undefined);
    setCurrentView('addParticipant');
  };

  const handleSaveChild = (childData: ChildInfoData) => {
    if (!programForNewParticipant) {
        toast({ title: "Error", description: "No program selected.", variant: "destructive" });
        return;
    }
    const newEnrolledChild: EnrolledChildData = {
        programId: programForNewParticipant.id,
        childInfo: childData,
    };
    appendChild(newEnrolledChild);
    setCurrentView('dashboard');
    setActiveDashboardTab('enrollments');
    toast({title: "Child Added", description: `${childData.childFirstName} has been added for ${programForNewParticipant.label}.`})
  };

  const handleSaveAdultEnrollment = () => {
    if (!programForNewParticipant || programForNewParticipant.isChildProgram) {
      toast({ title: "Error", description: "Invalid program selection for adult.", variant: "destructive" });
      return;
    }
    if (!adultDOB) {
      toast({ title: "Date of Birth Required", description: "Please provide your date of birth for this program.", variant: "destructive" });
      return;
    }

    const existingAdultEnrollment = getValues('adultTraineeInfo');
    if (existingAdultEnrollment && existingAdultEnrollment.programId && existingAdultEnrollment.programId !== programForNewParticipant.id) {
        toast({
            title: "Enrollment Updated",
            description: `Your enrollment has been updated to ${programForNewParticipant.label}. You can only be enrolled in one adult program at a time.`,
            variant: "default",
            duration: 7000,
        });
    } else if (existingAdultEnrollment && existingAdultEnrollment.programId === programForNewParticipant.id) {
         toast({
            title: "Already Enrolled",
            description: `You are already enrolled in ${programForNewParticipant.label}.`,
            variant: "default",
        });
        setCurrentView('dashboard');
        setActiveDashboardTab('enrollments');
        return;
    }


    setValue('adultTraineeInfo', {
      programId: programForNewParticipant.id,
      dateOfBirth: adultDOB,
    });
    setCurrentView('dashboard');
    setActiveDashboardTab('enrollments');
    toast({ title: "Adult Program Enrolled", description: `You have been enrolled in ${programForNewParticipant.label}.` });
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
          adultTraineeInfo: data.adultTraineeInfo,
          children: data.children,
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
          <p className="text-muted-foreground mb-4 text-sm">Choose a program to enroll a participant or yourself.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {HAFSA_PROGRAMS.map(prog => {
              let IconComponent;
              switch(prog.category) {
                case 'daycare': IconComponent = Baby; break;
                case 'quran_kids': IconComponent = GraduationCap; break; 
                case 'arabic_women': IconComponent = Briefcase; break; 
                default: IconComponent = BookOpenText;
              }
              const isEnrolledAsAdult = watchedAdultTraineeInfo?.programId === prog.id;
              const cantEnrollSelfAgain = !prog.isChildProgram && watchedAdultTraineeInfo?.programId && watchedAdultTraineeInfo?.programId !== prog.id;

              return (
                <Card 
                  key={prog.id} 
                  className={cn(
                    "hover:shadow-lg transition-shadow cursor-pointer flex flex-col",
                    isEnrolledAsAdult && "ring-2 ring-accent",
                    cantEnrollSelfAgain && "opacity-60 cursor-not-allowed"
                  )}
                  onClick={() => {
                    if (cantEnrollSelfAgain) {
                        toast({title: "Limit Reached", description: "You can only enroll yourself in one adult program at a time.", variant:"destructive"});
                        return;
                    }
                    setProgramForNewParticipant(prog);
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center space-x-3 mb-1">
                        <IconComponent className="h-6 w-6 text-primary" />
                        <CardTitle className="text-lg sm:text-xl text-primary">{prog.label}</CardTitle>
                    </div>
                    <CardDescription className="text-xs sm:text-sm">{prog.description}</CardDescription>
                     {isEnrolledAsAdult && <span className="text-xs text-accent font-semibold mt-1 block">You are enrolled in this program.</span>}
                     {cantEnrollSelfAgain && <span className="text-xs text-destructive font-semibold mt-1 block">You are already in another adult program.</span>}
                  </CardHeader>
                  <CardContent className="text-xs sm:text-sm flex-grow">
                    {prog.ageRange && <p><strong>Age:</strong> {prog.ageRange}</p>}
                    {prog.duration && <p><strong>Duration:</strong> {prog.duration}</p>}
                    {prog.schedule && <p><strong>Schedule:</strong> {prog.schedule}</p>}
                  </CardContent>
                  <CardFooter className="pt-2">
                    <p className="text-base sm:text-lg font-semibold text-accent">${prog.price.toFixed(2)}</p>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
          <Button type="button" variant="outline" onClick={() => { setCurrentView('dashboard'); setActiveDashboardTab('enrollments');}} className="w-full mt-6">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </div>
      ) : (
        <>
          {programForNewParticipant.isChildProgram ? (
             <ChildParticipantFields 
                programSpecificFields={programForNewParticipant.specificFields}
                onSave={handleSaveChild}
                onCancel={() => { setProgramForNewParticipant(null);}}
                isLoading={isLoading}
                selectedProgramLabel={programForNewParticipant.label}
            />
          ) : ( 
            <Card className="mb-4 sm:mb-6 p-3 sm:p-4 border-dashed">
                <CardHeader>
                    <CardTitle className="text-lg sm:text-xl font-headline">Enroll in {programForNewParticipant.label}</CardTitle>
                    <CardDescription>Please provide your date of birth for this program.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-2 pt-1">
                     <div>
                        <Label htmlFor="adultDOB">Your Date of Birth</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !adultDOB && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {adultDOB ? format(adultDOB, "PPP") : <span>Pick your date of birth</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={adultDOB} onSelect={setAdultDOB} initialFocus disabled={(date) => date > new Date() || date < new Date("1940-01-01")} />
                            </PopoverContent>
                        </Popover>
                        {!adultDOB && getValues('adultTraineeInfo.programId') === programForNewParticipant.id && errors.adultTraineeInfo?.dateOfBirth && (
                           <p className="text-sm text-destructive mt-1">{errors.adultTraineeInfo.dateOfBirth.message}</p>
                        )}
                         {!adultDOB && <p className="text-sm text-muted-foreground mt-1">Date of birth is required for this program.</p>}
                    </div>
                </CardContent>
                 <CardFooter className="flex justify-end gap-2 p-2 pt-1">
                    <Button type="button" variant="outline" onClick={() => { setProgramForNewParticipant(null);}} disabled={isLoading}>Back to Program Selection</Button>
                    <Button type="button" onClick={handleSaveAdultEnrollment} disabled={isLoading || !adultDOB}>
                        {isLoading ? <Loader2 className="animate-spin mr-2"/> : <UserPlus className="mr-2 h-4 w-4" />} Confirm My Enrollment
                    </Button>
                </CardFooter>
            </Card>
          )}
           <Button type="button" variant="outline" onClick={() => { setProgramForNewParticipant(null);}} className="w-full mt-2 sm:hidden">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Program Selection
            </Button>
        </>
      )}
    </div>
  );
  

  const renderDashboard = () => (
    <Tabs value={activeDashboardTab} onValueChange={(value) => setActiveDashboardTab(value as any)} className="w-full">
        {!isMobile && ( 
            <TabsList className="grid w-full grid-cols-3 mb-6 p-0 gap-1 bg-transparent border-b rounded-none">
                <TabsTrigger value="enrollments" className="text-sm sm:text-base py-3 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none border-b-2 border-transparent hover:border-muted-foreground/50 transition-colors duration-150">
                    <Users className="mr-2 h-4 w-4 sm:h-5 sm:w-5 inline-block" /> 
                    <span className="sr-only sm:not-sr-only">Manage Enrollments</span>
                </TabsTrigger>
                <TabsTrigger value="account" className="text-sm sm:text-base py-3 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none border-b-2 border-transparent hover:border-muted-foreground/50 transition-colors duration-150">
                    <UserCog className="mr-2 h-4 w-4 sm:h-5 sm:w-5 inline-block" /> 
                    <span className="sr-only sm:not-sr-only">Account</span>
                </TabsTrigger>
                <TabsTrigger value="payment" className="text-sm sm:text-base py-3 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none border-b-2 border-transparent hover:border-muted-foreground/50 transition-colors duration-150">
                    <CreditCard className="mr-2 h-4 w-4 sm:h-5 sm:w-5 inline-block" /> 
                    <span className="sr-only sm:not-sr-only">Payment</span>
                </TabsTrigger>
            </TabsList>
        )}

        <TabsContent value="enrollments" className="space-y-4 pt-2">
            <h3 className="text-xl font-semibold text-primary sr-only sm:not-sr-only">Manage Enrollments</h3>
            
            {watchedAdultTraineeInfo && watchedAdultTraineeInfo.programId && (
                <Card className="p-3 mb-3 bg-primary/10 border-primary/30">
                     <div className="flex justify-between items-start">
                        <div>
                            <p className="font-semibold text-md text-primary">Your Enrollment (Primary Registrant)</p>
                            <p className="text-sm text-foreground/90">
                                {HAFSA_PROGRAMS.find(p => p.id === watchedAdultTraineeInfo.programId)?.label || 'Unknown Program'}
                                {' - $'}{(HAFSA_PROGRAMS.find(p => p.id === watchedAdultTraineeInfo.programId)?.price || 0).toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">Date of Birth: {watchedAdultTraineeInfo.dateOfBirth ? format(new Date(watchedAdultTraineeInfo.dateOfBirth), "PPP") : 'N/A'}</p>
                        </div>
                         <Button type="button" variant="ghost" size="sm" onClick={() => { setValue('adultTraineeInfo', undefined); toast({title: "Your Enrollment Removed"});}} className="text-destructive hover:text-destructive/80">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </Card>
            )}

            {childFields.map((field, index) => {
                const enrolledChild = field as unknown as EnrolledChildData;
                const program = HAFSA_PROGRAMS.find(p => p.id === enrolledChild.programId);
                return (
                <Card key={field.id} className="p-3 mb-2">
                    <div className="flex justify-between items-start">
                    <div>
                        <p className="font-semibold text-md">{enrolledChild.childInfo.childFirstName}</p>
                        <p className="text-xs text-muted-foreground">{program?.label || 'Unknown Program'} - ${program?.price.toFixed(2)}</p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeChild(index)} className="text-destructive hover:text-destructive/80">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    </div>
                </Card>
                );
            })}
            
            {(childFields.length === 0 && (!watchedAdultTraineeInfo || !watchedAdultTraineeInfo.programId)) && (
                <div className="text-center py-6">
                    <p className="text-muted-foreground mb-4">No participants added yet. Click below to add an enrollment.</p>
                </div>
            )}

            <Button type="button" variant="default" onClick={handleAddParticipantClick} className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Participant / Enrollment
            </Button>
        </TabsContent>

        <TabsContent value="account" className="space-y-4 pt-2">
            <h3 className="text-xl font-semibold text-primary sr-only sm:not-sr-only">Account Information</h3>
            {getValues('parentInfo') && (
                <Card className="p-4 space-y-2">
                    <p><strong>Full Name:</strong> {getValues('parentInfo.parentFullName')}</p>
                    <p><strong>Primary Phone:</strong> {getValues('parentInfo.parentPhone1')}</p>
                    {getValues('parentInfo.parentPhone2') && <p><strong>Secondary Phone:</strong> {getValues('parentInfo.parentPhone2')}</p>}
                    <p><strong>Telegram Phone:</strong> {getValues('parentInfo.telegramPhoneNumber')}</p>
                </Card>
            )}
        </TabsContent>

        <TabsContent value="payment" className="space-y-4 sm:space-y-6 pt-2">
            <h3 className="text-xl font-semibold text-primary sr-only sm:not-sr-only">Payment & Verification</h3>
            <div className="p-3 sm:p-4 border rounded-lg bg-primary/10">
                <h3 className="text-lg sm:text-xl font-semibold font-headline text-primary">Payment Summary</h3>
                <p className="mt-2 sm:mt-4 text-xl sm:text-2xl font-bold text-primary">Total Amount Due: ${calculatedPrice.toFixed(2)}</p>
            </div>
            <div>
                <Label htmlFor="couponCode">Coupon Code (Optional)</Label>
                <div className="flex items-center gap-2 mt-1">
                    <Input id="couponCode" {...methods.register('couponCode')} placeholder="Enter coupon code" className="flex-grow"/>
                    <Button type="button" variant="outline" size="sm" onClick={() => toast({title: "Coupon Applied!", description:"(Example: 10% off - not functional yet)"})}>Apply</Button>
                </div>
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
                    </SelectContent>
                    </Select>
                )}
                />
                {errors.paymentProof?.paymentType && <p className="text-sm text-destructive mt-1">{errors.paymentProof.paymentType.message}</p>}
            </div>
            { (HAFSA_PAYMENT_METHODS.some(pm => pm.value === watchedPaymentType && pm.value !== 'screenshot_ai_verification')) && (
            <div>
                <Label htmlFor="paymentProof.transactionId" className="text-base sm:text-lg">Transaction ID / Reference</Label>
                <Input id="paymentProof.transactionId" {...formRegister('paymentProof.transactionId')} className="mt-1 text-xs sm:text-sm" placeholder="Enter your transaction ID or reference"/>
                {errors.paymentProof?.transactionId && <p className="text-sm text-destructive mt-1">{errors.paymentProof.transactionId.message}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                    Please make your payment to the designated Hafsa Madrassa account for {HAFSA_PAYMENT_METHODS.find(pm => pm.value === watchedPaymentType)?.label}
                    and enter the transaction reference number here. Payment instructions will be provided.
                </p>
            </div>
            )}
             {watchedPaymentType === 'screenshot_ai_verification' && (
              <div>
                <Label htmlFor="paymentProof.screenshot" className="text-base sm:text-lg">Upload Payment Screenshot</Label>
                <Input 
                    id="paymentProof.screenshot" 
                    type="file" 
                    accept="image/*" 
                    className="mt-1"
                    {...formRegister('paymentProof.screenshot')}
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
                    <div className="flex items-center space-x-2 sm:space-x-3 mt-3">
                        <Checkbox id="agreeToTermsDashboard" checked={field.value} onCheckedChange={field.onChange} />
                        <Label htmlFor="agreeToTermsDashboard" className="text-sm font-normal">I agree to the <a href="/terms" target="_blank" className="text-primary hover:underline">terms and conditions</a> of Hafsa Madrassa.</Label>
                    </div>
                    )}
                />
                {errors.agreeToTerms && <p className="text-sm text-destructive mt-1">{errors.agreeToTerms.message}</p>}
            </div>
        </TabsContent>

        {isMobile && currentView === 'dashboard' && ( 
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-auto">
                <div className="flex items-center justify-center space-x-1 bg-primary text-primary-foreground p-2 rounded-full shadow-xl border border-primary-foreground/20">
                    <button
                        onClick={() => setActiveDashboardTab('enrollments')}
                        className={cn(
                            "p-3 rounded-full transition-all duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-primary",
                            activeDashboardTab === 'enrollments' ? "bg-primary-foreground text-primary scale-110 shadow-md" : "hover:bg-white/20"
                        )}
                        aria-label="Manage Enrollments"
                        type="button"
                    >
                        <Users className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => setActiveDashboardTab('account')}
                        className={cn(
                            "p-3 rounded-full transition-all duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-primary",
                            activeDashboardTab === 'account' ? "bg-primary-foreground text-primary scale-110 shadow-md" : "hover:bg-white/20"
                        )}
                        aria-label="Account Settings"
                        type="button"
                    >
                        <UserCog className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => setActiveDashboardTab('payment')}
                        className={cn(
                            "p-3 rounded-full transition-all duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-primary",
                            activeDashboardTab === 'payment' ? "bg-primary-foreground text-primary scale-110 shadow-md" : "hover:bg-white/20"
                        )}
                        aria-label="Payment"
                        type="button"
                    >
                        <CreditCard className="h-5 w-5" />
                    </button>
                </div>
            </div>
        )}
    </Tabs>
  );
  

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
        <Card className="w-full max-w-2xl mx-auto shadow-xl">
          
           <CardContent className={cn("min-h-[300px] sm:min-h-[350px] p-4 sm:p-6", isMobile && currentView === 'dashboard' && "pb-24")}>
            {currentView === 'accountCreation' && renderAccountCreation()}
            {currentView === 'dashboard' && renderDashboard()}
            {currentView === 'addParticipant' && renderAddParticipant()}
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row justify-between pt-4 sm:pt-6 p-4 sm:p-6 space-y-2 sm:space-y-0">
            {currentView === 'dashboard' && (
                <>
                    <Button type="button" variant="outline" onClick={() => setCurrentView('accountCreation')} disabled={isLoading} className="w-full sm:w-auto order-last sm:order-none mt-2 sm:mt-0">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Account Details
                    </Button>
                    {activeDashboardTab !== 'payment' ? (
                        <Button 
                            type="button" 
                            onClick={() => {
                                if (childFields.length === 0 && !getValues('adultTraineeInfo.programId')) {
                                    toast({title: "No Enrollments", description: "Please add at least one participant or enroll yourself in an adult program before proceeding to payment.", variant: "destructive"});
                                    return;
                                }
                                setActiveDashboardTab('payment')
                            }} 
                            disabled={isLoading || (childFields.length === 0 && !getValues('adultTraineeInfo.programId'))} 
                            className="w-full sm:ml-auto"
                        >
                            Proceed to Payment <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button type="submit" 
                            disabled={isLoading || !getValues('agreeToTerms') || calculatedPrice <= 0} 
                            className="w-full sm:ml-auto"
                        >
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                            Submit Registration (${calculatedPrice.toFixed(2)})
                        </Button>
                    )}
                </>
            )}
            { (currentView === 'addParticipant' && !programForNewParticipant) && 
                 <Button type="button" variant="outline" onClick={() => { setCurrentView('dashboard'); setActiveDashboardTab('enrollments');}} disabled={isLoading} className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>
            }
            { (currentView === 'addParticipant' && programForNewParticipant) &&
                 <Button type="button" variant="outline" onClick={() => setProgramForNewParticipant(null)} disabled={isLoading} className="w-full sm:w-auto order-first sm:order-none">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Program Selection
                </Button>
            }
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
  );
};

export default EnrollmentForm;

