
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, FormProvider, Controller, useFieldArray, useWatch, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { School, User, BookOpen, CreditCard, FileText, CheckCircle, ArrowRight, ArrowLeft, Loader2, AlertTriangle, CalendarIcon, Users, PlusCircle, Trash2, Settings, Building, FileImage, LinkIcon, FingerprintIcon, UserCheck, Info, Percent, Phone, UserCog, LogOut, Edit3 } from 'lucide-react';
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
import type { EnrollmentFormData, ParentInfoData, ChildInfoData, AdultTraineeData, RegistrationData, EnrolledChildData } from '@/types';
import { EnrollmentFormSchema, ChildInfoSchema as EnrolledChildInfoSchema, AdultTraineeSchema } from '@/types'; // Renamed to avoid conflict
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

const defaultAdultTraineeValues: AdultTraineeData = {
  traineeFullName: '',
  dateOfBirth: undefined as any,
  phone1: '',
  telegramPhoneNumber: '',
  programId: '',
};

const ParentInfoFields: React.FC<{ isAdultTrainee?: boolean }> = ({ isAdultTrainee = false }) => {
  const { control, register, formState: { errors }, watch, setValue } = useFormContext<EnrollmentFormData>();
  const fieldPrefix = isAdultTrainee ? 'adultTraineeInfo' : 'parentInfo';
  const currentErrors = isAdultTrainee ? errors.adultTraineeInfo || {} : errors.parentInfo || {};
  
  const phone1 = watch(`${fieldPrefix}.phone1` as any) || watch(`${fieldPrefix}.parentPhone1` as any);
  const phone2 = watch(`${fieldPrefix}.phone2` as any) || watch(`${fieldPrefix}.parentPhone2` as any);
  const title = isAdultTrainee ? "Trainee Information" : "Parent/Guardian Information";
  const nameLabel = isAdultTrainee ? "Trainee's Full Name" : "Parent's Full Name";
  const nameField = isAdultTrainee ? "traineeFullName" : "parentFullName";
  const phone1Field = isAdultTrainee ? "phone1" : "parentPhone1";
  const phone2Field = isAdultTrainee ? "phone2" : "parentPhone2";


  return (
    <Card className="mb-4 sm:mb-6 p-3 sm:p-4 border-primary/20 border">
      <CardHeader className="p-2 pb-1">
        <CardTitle className="text-lg sm:text-xl font-headline text-primary flex items-center">
          {isAdultTrainee ? <User className="mr-2 h-5 w-5"/> : <UserCheck className="mr-2 h-5 w-5"/>} {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-2 pt-1">
        <div>
          <Label htmlFor={`${fieldPrefix}.${nameField}`}>{nameLabel}</Label>
          <Input id={`${fieldPrefix}.${nameField}`} {...register(`${fieldPrefix}.${nameField}` as any)} placeholder={nameLabel} />
          {(currentErrors as any)[nameField] && <p className="text-sm text-destructive mt-1">{(currentErrors as any)[nameField].message}</p>}
        </div>
        
        {isAdultTrainee && (
           <div>
            <Label htmlFor={`${fieldPrefix}.dateOfBirth`}>Date of Birth</Label>
            <Controller
                name={`${fieldPrefix}.dateOfBirth` as any}
                control={control}
                render={({ field }) => (
                <Popover>
                    <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? new Date(field.value) : undefined} onSelect={field.onChange} initialFocus disabled={(date) => date > new Date() || date < new Date("1940-01-01")} /></PopoverContent>
                </Popover>
                )}
            />
            {(currentErrors as any).dateOfBirth && <p className="text-sm text-destructive mt-1">{(currentErrors as any).dateOfBirth.message}</p>}
            </div>
        )}

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
          <Input id={`${fieldPrefix}.telegramPhoneNumber}`} {...register(`${fieldPrefix}.telegramPhoneNumber` as any)} type="tel" placeholder="For Telegram updates" />
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
}> = ({ programSpecificFields, onSave, onCancel, isLoading }) => {
  
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
        <CardTitle className="text-lg sm:text-xl font-headline">Add New Child</CardTitle>
      </CardHeader>
      {/* Removed nested <form> tag here */}
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
          {/* Changed button type to "button" and onClick to trigger local form submission */}
          <Button type="button" onClick={handleChildSubmit(actualOnSave)} disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin mr-2"/> : <PlusCircle className="mr-2 h-4 w-4" />} Save Student
          </Button>
      </CardFooter>
      {/* Removed closing </form> tag */}
    </Card>
  );
};


const EnrollmentForm: React.FC = () => {
  const [currentView, setCurrentView] = useState<'accountTypeSelection' | 'accountCreation' | 'dashboard' | 'addStudent' | 'confirmation'>('accountTypeSelection');
  const [activeDashboardTab, setActiveDashboardTab] = useState<'students' | 'settings' | 'payment'>('students');
  const [isLoading, setIsLoading] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
  const { toast } = useToast();
  
  const [programForNewStudent, setProgramForNewStudent] = useState<HafsaProgram | null>(null);

  const methods = useForm<EnrollmentFormData>({
    resolver: zodResolver(EnrollmentFormSchema),
    defaultValues: {
      accountHolderType: undefined,
      parentInfo: { parentFullName: '', parentPhone1: '', telegramPhoneNumber: '' },
      adultTraineeInfo: defaultAdultTraineeValues,
      children: [],
      agreeToTerms: false,
      couponCode: '',
      paymentProof: { paymentType: HAFSA_PAYMENT_METHODS[0]?.value || '' },
    },
  });

  const { control, handleSubmit, formState: { errors }, setValue, getValues, trigger, watch, reset, register } = methods;

  const { fields: childFields, append: appendChild, remove: removeChild } = useFieldArray({
    control,
    name: "children",
  });
  
  const watchedChildren = watch('children');
  const watchedPaymentType = watch('paymentProof.paymentType');
  const watchedAccountHolderType = watch('accountHolderType');
  const watchedAdultProgramId = watch('adultTraineeInfo.programId');

  useEffect(() => {
    let total = 0;
    const accountType = getValues('accountHolderType');
    
    if (accountType === 'parent' && watchedChildren) {
      watchedChildren.forEach(enrolledChild => {
        const program = HAFSA_PROGRAMS.find(p => p.id === enrolledChild.programId);
        if (program) {
          total += program.price;
        }
      });
    } else if (accountType === 'adult_trainee') {
      const adultProgramId = getValues('adultTraineeInfo.programId');
      const program = HAFSA_PROGRAMS.find(p => p.id === adultProgramId);
      if (program) {
        total += program.price;
      }
    }
    setCalculatedPrice(total);
  }, [watchedChildren, getValues, watchedAccountHolderType, watchedAdultProgramId]);


  const handleAccountTypeSelection = (type: 'parent' | 'adult_trainee') => {
    setValue('accountHolderType', type);
    setCurrentView('accountCreation');
  };

  const handleAccountCreation = async () => {
    const fieldsToValidate: (keyof EnrollmentFormData | `parentInfo.${keyof ParentInfoData}` | `adultTraineeInfo.${keyof AdultTraineeData}`)[] = ['accountHolderType'];
    const accountType = getValues('accountHolderType');

    if (accountType === 'parent') {
        fieldsToValidate.push('parentInfo.parentFullName', 'parentInfo.parentPhone1', 'parentInfo.telegramPhoneNumber');
    } else if (accountType === 'adult_trainee') {
        fieldsToValidate.push('adultTraineeInfo.traineeFullName', 'adultTraineeInfo.dateOfBirth', 'adultTraineeInfo.phone1', 'adultTraineeInfo.telegramPhoneNumber', 'adultTraineeInfo.programId');
    }
    
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
        if (accountType === 'adult_trainee') {
            setActiveDashboardTab('payment'); 
        } else {
            setActiveDashboardTab('students');
        }
        setCurrentView('dashboard');
    } else {
      toast({ title: "Validation Error", description: "Please check your entries and try again.", variant: "destructive" });
      // Log detailed errors
      const currentErrors = methods.formState.errors;
      console.log("Validation errors:", currentErrors);
      if(accountType === 'parent' && currentErrors.parentInfo) console.log("Parent Info Errors:", currentErrors.parentInfo);
      if(accountType === 'adult_trainee' && currentErrors.adultTraineeInfo) console.log("Adult Trainee Info Errors:", currentErrors.adultTraineeInfo);

    }
  };

  const handleAddStudentClick = () => {
    setProgramForNewStudent(null); 
    setCurrentView('addStudent');
  };

  const handleSaveStudent = (childData: ChildInfoData) => {
    if (!programForNewStudent) {
        toast({ title: "Error", description: "No program selected for the child.", variant: "destructive" });
        return;
    }
    const newEnrolledChild: EnrolledChildData = {
        programId: programForNewStudent.id,
        childInfo: childData,
    };
    appendChild(newEnrolledChild);
    setCurrentView('dashboard');
    setActiveDashboardTab('students');
    toast({title: "Student Added", description: `${childData.childFirstName} has been added for ${programForNewStudent.label}.`})
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
          accountHolderType: data.accountHolderType,
          parentInfo: data.accountHolderType === 'parent' ? data.parentInfo : undefined,
          adultTraineeInfo: data.accountHolderType === 'adult_trainee' ? data.adultTraineeInfo : undefined,
          children: data.accountHolderType === 'parent' ? data.children : undefined,
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
        {getValues('accountHolderType') === 'parent' && <ParentInfoFields />}
        {getValues('accountHolderType') === 'adult_trainee' && (
            <>
                <div className="mb-4">
                    <Label htmlFor="adultProgramSelection" className="text-base sm:text-lg">Select Program for Trainee</Label>
                    <Controller
                        name="adultTraineeInfo.programId"
                        control={control}
                        render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger id="adultProgramSelection" className="mt-1"><SelectValue placeholder="Choose a program" /></SelectTrigger>
                            <SelectContent>
                            {HAFSA_PROGRAMS.filter(p => !p.isChildProgram).map(prog => <SelectItem key={prog.id} value={prog.id}>{prog.label} - {prog.description}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        )}
                    />
                    {errors.adultTraineeInfo?.programId && <p className="text-sm text-destructive mt-1">{errors.adultTraineeInfo.programId.message}</p>}
                </div>
                <ParentInfoFields isAdultTrainee={true} />
            </>
        )}
        <div className="flex flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={() => setCurrentView('accountTypeSelection')} disabled={isLoading} className="w-full sm:w-auto">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button type="button" onClick={handleAccountCreation} disabled={isLoading} className="w-full">
                Proceed <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </div>
    </div>
  );

  const renderAddStudent = () => (
    <div className="space-y-4 sm:space-y-6">
        <div>
            <Label htmlFor="programForNewStudent" className="text-base sm:text-lg">Select Program for Child</Label>
            <Select 
                onValueChange={(programId) => setProgramForNewStudent(HAFSA_PROGRAMS.find(p => p.id === programId && p.isChildProgram) || null)} 
                value={programForNewStudent?.id || ''}
            >
                <SelectTrigger id="programForNewStudent" className="mt-1"><SelectValue placeholder="Choose a program" /></SelectTrigger>
                <SelectContent>
                {HAFSA_PROGRAMS.filter(p => p.isChildProgram).map(prog => <SelectItem key={prog.id} value={prog.id}>{prog.label} - {prog.description} (${prog.price})</SelectItem>)}
                </SelectContent>
            </Select>
            {!programForNewStudent && getValues('children').length > 0 && <p className="text-sm text-muted-foreground mt-1">Select a program to add another student.</p>}
            {!programForNewStudent && getValues('children').length === 0 && <p className="text-sm text-destructive mt-1">Please select a program for the first child.</p>}

        </div>
        {programForNewStudent && (
             <ChildParticipantFields 
                programSpecificFields={programForNewStudent.specificFields}
                onSave={handleSaveStudent}
                onCancel={() => setCurrentView('dashboard')}
                isLoading={isLoading}
            />
        )}
         {!programForNewStudent && (
            <Button type="button" variant="outline" onClick={() => setCurrentView('dashboard')} className="w-full">
                Cancel
            </Button>
        )}
    </div>
  );

  const renderDashboard = () => (
    <Tabs value={activeDashboardTab} onValueChange={(value) => setActiveDashboardTab(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3">
            {getValues('accountHolderType') === 'parent' && <TabsTrigger value="students"><Users className="mr-1 sm:mr-2 h-4 w-4"/>My Students</TabsTrigger>}
            <TabsTrigger value="settings"><UserCog className="mr-1 sm:mr-2 h-4 w-4"/>Account</TabsTrigger>
            <TabsTrigger value="payment"><CreditCard className="mr-1 sm:mr-2 h-4 w-4"/>Payment</TabsTrigger>
        </TabsList>

        {getValues('accountHolderType') === 'parent' && (
            <TabsContent value="students" className="space-y-4 pt-4">
                <h3 className="text-xl font-semibold text-primary">Registered Students</h3>
                {childFields.length === 0 && (
                    <div className="text-center py-6">
                        <p className="text-muted-foreground mb-4">No students added yet. Click below to add your first student.</p>
                         <Button type="button" variant="default" onClick={handleAddStudentClick} className="w-full sm:w-auto">
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Student
                        </Button>
                    </div>
                )}
                {childFields.length > 0 && (
                    <>
                        <div className="space-y-3">
                        {childFields.map((field, index) => {
                            const enrolledChild = field as unknown as EnrolledChildData;
                            const program = HAFSA_PROGRAMS.find(p => p.id === enrolledChild.programId);
                            return (
                            <Card key={field.id} className="p-3">
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
                        </div>
                        <Button type="button" variant="outline" onClick={handleAddStudentClick} className="w-full sm:w-auto">
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Another Student
                        </Button>
                    </>
                )}
                 <div className="mt-4 text-right space-y-1">
                    <p className="text-xl sm:text-2xl font-bold font-headline text-primary">Total Estimated Price: ${calculatedPrice.toFixed(2)}</p>
                </div>
            </TabsContent>
        )}

        <TabsContent value="settings" className="space-y-4 pt-4">
            <h3 className="text-xl font-semibold text-primary">Account Information</h3>
            {getValues('accountHolderType') === 'parent' && getValues('parentInfo') && (
                <Card className="p-4 space-y-2">
                    <p><strong>Full Name:</strong> {getValues('parentInfo.parentFullName')}</p>
                    <p><strong>Primary Phone:</strong> {getValues('parentInfo.parentPhone1')}</p>
                    {getValues('parentInfo.parentPhone2') && <p><strong>Secondary Phone:</strong> {getValues('parentInfo.parentPhone2')}</p>}
                    <p><strong>Telegram Phone:</strong> {getValues('parentInfo.telegramPhoneNumber')}</p>
                </Card>
            )}
            {getValues('accountHolderType') === 'adult_trainee' && getValues('adultTraineeInfo') && (
                 <Card className="p-4 space-y-2">
                    <p><strong>Full Name:</strong> {getValues('adultTraineeInfo.traineeFullName')}</p>
                    <p><strong>Date of Birth:</strong> {format(new Date(getValues('adultTraineeInfo.dateOfBirth')), "PPP")}</p>
                    <p><strong>Primary Phone:</strong> {getValues('adultTraineeInfo.phone1')}</p>
                    {getValues('adultTraineeInfo.phone2') && <p><strong>Secondary Phone:</strong> {getValues('adultTraineeInfo.phone2')}</p>}
                    <p><strong>Telegram Phone:</strong> {getValues('adultTraineeInfo.telegramPhoneNumber')}</p>
                    <p><strong>Selected Program:</strong> {HAFSA_PROGRAMS.find(p => p.id === getValues('adultTraineeInfo.programId'))?.label || 'N/A'} (${HAFSA_PROGRAMS.find(p => p.id === getValues('adultTraineeInfo.programId'))?.price.toFixed(2)})</p>
                </Card>
            )}
        </TabsContent>

        <TabsContent value="payment" className="space-y-4 sm:space-y-6 pt-4">
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
            { (HAFSA_PAYMENT_METHODS.some(pm => pm.value === watchedPaymentType)) && (
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
    </Tabs>
  );
  

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
        <Card className="w-full max-w-2xl mx-auto shadow-xl">
          <CardHeader>
            <div className="flex items-center space-x-2 mb-2 sm:mb-4">
                <Image src="https://placehold.co/40x40.png" alt="Hafsa Madrassa Logo" width={40} height={40} data-ai-hint="islamic education logo" className="rounded-md"/>
                <CardTitle className="text-2xl sm:text-3xl font-headline">Hafsa Madrassa Registration</CardTitle>
            </div>
             <CardDescription className="text-sm">
                {currentView === 'accountTypeSelection' && "Select your registration type."}
                {currentView === 'accountCreation' && `Step 1: Create Your ${getValues('accountHolderType') === 'parent' ? 'Parent/Guardian' : 'Trainee'} Account.`}
                {currentView === 'dashboard' && `Step 2: Manage Enrollments & Payment.`}
                {currentView === 'addStudent' && `Add New Student for ${programForNewStudent?.label || 'Selected Program'}.`}
             </CardDescription>
          </CardHeader>

          <CardContent className="min-h-[300px] sm:min-h-[350px] p-4 sm:p-6">
            {currentView === 'accountTypeSelection' && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-center mb-6">How are you registering today?</h2>
                    <Button onClick={() => handleAccountTypeSelection('parent')} className="w-full text-lg py-6" variant="outline">
                        <Users className="mr-3 h-6 w-6"/> As a Parent/Guardian (for children)
                    </Button>
                    <Button onClick={() => handleAccountTypeSelection('adult_trainee')} className="w-full text-lg py-6" variant="outline">
                        <User className="mr-3 h-6 w-6"/> As an Adult Trainee (for myself)
                    </Button>
                </div>
            )}
            {currentView === 'accountCreation' && renderAccountCreation()}
            {currentView === 'dashboard' && renderDashboard()}
            {currentView === 'addStudent' && renderAddStudent()}
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row justify-between pt-4 sm:pt-6 p-4 sm:p-6 space-y-2 sm:space-y-0">
            {currentView === 'dashboard' && (
                <>
                    <Button type="button" variant="outline" onClick={() => setCurrentView('accountCreation')} disabled={isLoading} className="w-full sm:w-auto order-last sm:order-none">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Account Details
                    </Button>
                    {activeDashboardTab !== 'payment' ? (
                        <Button 
                            type="button" 
                            onClick={() => {
                                if (getValues('accountHolderType') === 'parent' && childFields.length === 0) {
                                    toast({title: "No Students", description: "Please add at least one student before proceeding to payment.", variant: "destructive"});
                                    return;
                                }
                                setActiveDashboardTab('payment')
                            }} 
                            disabled={isLoading || (getValues('accountHolderType') === 'parent' && childFields.length === 0 && activeDashboardTab === 'students')} 
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
            { (currentView !== 'accountTypeSelection' && currentView !== 'accountCreation' && currentView !== 'dashboard' && currentView !== 'confirmation') &&
                 <Button type="button" variant="outline" onClick={() => setCurrentView('dashboard')} disabled={isLoading} className="w-full sm:w-auto order-first sm:order-none">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>
            }
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
  );
};

export default EnrollmentForm;

    

    