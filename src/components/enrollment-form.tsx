
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, FormProvider, Controller, useFieldArray, useWatch, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { School, User, BookOpen, CreditCard, FileText, CheckCircle, ArrowRight, ArrowLeft, Loader2, AlertTriangle, CalendarIcon, Users, PlusCircle, Trash2, Settings, Building } from 'lucide-react';
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
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { format } from "date-fns";

import { SCHOOL_LEVELS, PROGRAMS_BY_LEVEL, PAYMENT_TYPES, Course, Program } from '@/lib/constants';
import type { EnrollmentFormData, RegistrationData, ChildEnrollmentData, ParentInfoData } from '@/types';
import { EnrollmentFormSchema } from '@/types';
import { handlePaymentVerification } from '@/app/actions';
import Receipt from '@/components/receipt';

const accountCreationSteps = [
  { id: 'parent', title: 'Create Parent Account' },
];

const dashboardStepsConfig = [
  { id: 'enrollmentDetails', title: "Enrollment Details", icon: <Users className="h-5 w-5" /> },
  { id: 'payment', title: 'Payment & Verification', icon: <CreditCard className="h-5 w-5" /> },
  { id: 'confirmation', title: 'Confirmation', icon: <CheckCircle className="h-5 w-5" /> },
];

const defaultChildValues: ChildEnrollmentData = {
  fullName: '',
  dateOfBirth: undefined as any, 
  schoolLevel: '',
  program: '',
  selectedCourses: [],
};

const ChildEnrollmentFields: React.FC<{ childIndex: number; removeChild: (index: number) => void }> = ({ childIndex, removeChild }) => {
  const { control, setValue, getValues, formState: { errors } } = useFormContext<EnrollmentFormData>();
  
  const pathPrefix = `children.${childIndex}` as const;

  const watchedSchoolLevel = useWatch({ control, name: `${pathPrefix}.schoolLevel` });
  const watchedProgram = useWatch({ control, name: `${pathPrefix}.program` });

  const availablePrograms = useMemo(() => {
    return watchedSchoolLevel ? PROGRAMS_BY_LEVEL[watchedSchoolLevel] || [] : [];
  }, [watchedSchoolLevel]);

  const currentProgramDetails = useMemo(() => {
    return availablePrograms.find(p => p.value === watchedProgram);
  }, [availablePrograms, watchedProgram]);

  const availableCourses = useMemo(() => {
    return currentProgramDetails?.courses || [];
  }, [currentProgramDetails]);

  useEffect(() => {
    if (watchedSchoolLevel) {
      setValue(`${pathPrefix}.program`, '');
      setValue(`${pathPrefix}.selectedCourses`, []);
    }
  }, [watchedSchoolLevel, setValue, pathPrefix]);

  useEffect(() => {
    if (watchedProgram) {
       setValue(`${pathPrefix}.selectedCourses`, []);
    }
  }, [watchedProgram, setValue, pathPrefix]);

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
          <Label htmlFor={`${pathPrefix}.fullName`} className="text-base sm:text-lg">Full Name</Label>
          <Controller
            name={`${pathPrefix}.fullName`}
            control={control}
            render={({ field }) => <Input {...field} id={`${pathPrefix}.fullName`} className="mt-1" placeholder="Child's Full Name" />}
          />
          {childErrors.fullName && <p className="text-sm text-destructive mt-1">{(childErrors.fullName as any).message}</p>}
        </div>
        <div>
          <Label htmlFor={`${pathPrefix}.dateOfBirth`} className="text-base sm:text-lg">Date of Birth</Label>
          <Controller
            name={`${pathPrefix}.dateOfBirth`}
            control={control}
            render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal mt-1", !field.value && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus disabled={(date) => date > new Date() || date < new Date("1900-01-01")} /></PopoverContent>
              </Popover>
            )}
          />
          {childErrors.dateOfBirth && <p className="text-sm text-destructive mt-1">{(childErrors.dateOfBirth as any).message}</p>}
        </div>
        <div>
          <Label htmlFor={`${pathPrefix}.schoolLevel`} className="text-base sm:text-lg">School Level</Label>
          <Controller
            name={`${pathPrefix}.schoolLevel`}
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id={`${pathPrefix}.schoolLevel`} className="mt-1"><SelectValue placeholder="Select school level" /></SelectTrigger>
                <SelectContent>{SCHOOL_LEVELS.map(level => <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>)}</SelectContent>
              </Select>
            )}
          />
          {childErrors.schoolLevel && <p className="text-sm text-destructive mt-1">{(childErrors.schoolLevel as any).message}</p>}
        </div>
        {watchedSchoolLevel && (
          <div>
            <Label htmlFor={`${pathPrefix}.program`} className="text-base sm:text-lg">Program/Grade</Label>
            <Controller
              name={`${pathPrefix}.program`}
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id={`${pathPrefix}.program`} className="mt-1"><SelectValue placeholder="Select program/grade" /></SelectTrigger>
                  <SelectContent>{availablePrograms.map(prog => <SelectItem key={prog.value} value={prog.value}>{prog.label}</SelectItem>)}</SelectContent>
                </Select>
              )}
            />
            {childErrors.program && <p className="text-sm text-destructive mt-1">{(childErrors.program as any).message}</p>}
          </div>
        )}
         {watchedProgram && availableCourses.length > 0 && (
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-md sm:text-lg font-semibold">Available Courses for {currentProgramDetails?.label}</h3>
            <Controller
              name={`${pathPrefix}.selectedCourses`}
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  {availableCourses.map((course: Course) => (
                    <div key={course.value} className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 border rounded-md hover:bg-muted/50 transition-colors">
                      <Checkbox
                        id={`${pathPrefix}.course.${course.value}`}
                        checked={field.value?.includes(course.value)}
                        onCheckedChange={(checked) => {
                          const newValue = checked ? [...(field.value || []), course.value] : (field.value || []).filter((v) => v !== course.value);
                          field.onChange(newValue);
                        }}
                      />
                      <Label htmlFor={`${pathPrefix}.course.${course.value}`} className="flex-grow text-sm sm:text-md cursor-pointer">{course.label}</Label>
                      <span className="text-xs sm:text-sm text-foreground/80">${course.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};


const EnrollmentForm: React.FC = () => {
  const [currentView, setCurrentView] = useState<'createAccount' | 'enrollmentDashboard'>('createAccount');
  const [currentDashboardStep, setCurrentDashboardStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
  const { toast } = useToast();

  const methods = useForm<EnrollmentFormData>({
    resolver: zodResolver(EnrollmentFormSchema),
    defaultValues: {
      parentInfo: {
        parentFullName: '',
        parentEmail: '',
        parentPhone: '',
      },
      children: [defaultChildValues],
      paymentProof: {
        paymentType: 'screenshot',
      },
    },
  });

  const { control, handleSubmit, formState: { errors }, setValue, getValues, trigger, watch, register } = methods;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "children",
  });

  const watchedChildren = watch('children'); 
  const watchedPaymentType = watch('paymentProof.paymentType');

  useEffect(() => {
    const calculateTotal = () => {
      let total = 0;
      const childrenData = getValues("children") || [];
      childrenData.forEach(child => {
        const programDetails = PROGRAMS_BY_LEVEL[child.schoolLevel]?.find(p => p.value === child.program);
        if (programDetails) {
          total += programDetails.basePrice;
          const courses = child.selectedCourses || [];
          courses.forEach(courseValue => {
            const courseDetails = programDetails.courses?.find(c => c.value === courseValue);
            if (courseDetails) {
              total += courseDetails.price;
            }
          });
        }
      });
      setCalculatedPrice(total);
    };
    calculateTotal();
  }, [watchedChildren, getValues]);

  const handleCreateAccountAndProceed = async () => {
    const isValid = await trigger(['parentInfo.parentFullName', 'parentInfo.parentEmail', 'parentInfo.parentPhone']);
    if (isValid) {
      setCurrentView('enrollmentDashboard');
      setCurrentDashboardStep(0); // Reset to the first step of the dashboard
    } else {
      toast({ title: "Validation Error", description: "Please check your parent information.", variant: "destructive" });
    }
  };
  
  const handleDashboardNext = async () => {
    let fieldsToValidate: (keyof EnrollmentFormData | `children.${number}.${keyof ChildEnrollmentData}` | `children`)[] = [];
    
    if (currentDashboardStep === 0) { // Enrollment Details (Children + Settings Tabs)
      fieldsToValidate.push('children'); // Validate all children data
    }
    // Payment step validation handled during final submission by Zod schema

    const isValid = fieldsToValidate.length > 0 ? await trigger(fieldsToValidate) : true;
    
    if (isValid) {
      setCurrentDashboardStep(prev => prev + 1);
    } else {
       toast({ title: "Validation Error", description: "Please check the children's enrollment details.", variant: "destructive" });
    }
  };

  const handleDashboardPrevious = () => setCurrentDashboardStep(prev => prev - 1);

  const onSubmit = async (data: EnrollmentFormData) => {
    setIsLoading(true);
    try {
      let screenshotDataUri: string | undefined;
      if (data.paymentProof.paymentType === 'screenshot' && data.paymentProof.screenshot) {
        screenshotDataUri = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(data.paymentProof.screenshot as File);
        });
        setValue('paymentProof.screenshotDataUri', screenshotDataUri); // Set it in form state
        data.paymentProof.screenshotDataUri = screenshotDataUri; // Also update data object
      }
      
      const verificationInput = {
        paymentProof: {
          paymentType: data.paymentProof.paymentType,
          screenshotDataUri: data.paymentProof.screenshotDataUri,
          pdfLink: data.paymentProof.pdfLink,
          transactionId: data.paymentProof.transactionId,
        },
        expectedAmount: calculatedPrice,
      };

      const result = await handlePaymentVerification(verificationInput);

      if (result.isPaymentValid) {
        toast({
          title: "Payment Verified!",
          description: result.message,
          variant: "default",
          className: "bg-accent text-accent-foreground",
        });
        const finalRegistrationData: RegistrationData = {
          parentInfo: data.parentInfo,
          children: data.children,
          paymentProof: { 
             paymentType: data.paymentProof.paymentType,
             screenshotDataUri: data.paymentProof.screenshotDataUri,
             pdfLink: data.paymentProof.pdfLink,
             transactionId: result.transactionNumber || data.paymentProof.transactionId,
          },
          calculatedPrice,
          paymentVerified: true,
          paymentVerificationDetails: result,
          registrationDate: new Date(),
        };
        setRegistrationData(finalRegistrationData);
        setCurrentDashboardStep(prev => prev + 1); 
      } else {
        toast({
          title: "Payment Verification Failed",
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
  
  if (currentView === 'enrollmentDashboard' && registrationData && currentDashboardStep === dashboardStepsConfig.length - 1) {
    return <Receipt data={registrationData} />;
  }

  const getCurrentStepTitle = () => {
    if (currentView === 'createAccount') {
      return accountCreationSteps[0].title;
    }
    if (currentView === 'enrollmentDashboard' && dashboardStepsConfig[currentDashboardStep]) {
      return dashboardStepsConfig[currentDashboardStep].title;
    }
    return "Enrollment";
  };

  const getCurrentProgressSteps = () => {
    if (currentView === 'createAccount') return 0; // No progress dots for single step
    return dashboardStepsConfig.length -1; // Exclude confirmation for dots
  };

  const currentActiveProgressStep = () => {
    if (currentView === 'createAccount') return 0;
    return currentDashboardStep;
  }


  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
        <Card className="w-full max-w-2xl mx-auto shadow-xl">
          <CardHeader>
            <div className="flex items-center space-x-2 mb-2 sm:mb-4">
              <School className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <CardTitle className="text-2xl sm:text-3xl font-headline">EnrollFlow Registration</CardTitle>
            </div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center space-y-1 sm:space-y-0">
               <CardDescription className="text-sm">{getCurrentStepTitle()}</CardDescription>
                {currentView === 'enrollmentDashboard' && (
                  <div className="flex space-x-1">
                  {dashboardStepsConfig.slice(0, -1).map((step, index) => ( // Exclude confirmation from dots
                      <div
                      key={step.id}
                      className={cn(
                          "h-2 w-6 sm:w-8 rounded-full",
                          currentDashboardStep >= index ? "bg-primary" : "bg-muted"
                      )}
                      />
                  ))}
                  </div>
                )}
            </div>
          </CardHeader>
          <CardContent className="min-h-[250px] sm:min-h-[300px] p-4 sm:p-6">
            {currentView === 'createAccount' && (
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <Label htmlFor="parentInfo.parentFullName" className="text-base sm:text-lg">Parent's Full Name</Label>
                  <Input id="parentInfo.parentFullName" {...register('parentInfo.parentFullName')} className="mt-1" placeholder="Parent's Name" />
                  {errors.parentInfo?.parentFullName && <p className="text-sm text-destructive mt-1">{errors.parentInfo.parentFullName.message}</p>}
                </div>
                <div>
                  <Label htmlFor="parentInfo.parentEmail" className="text-base sm:text-lg">Parent's Email</Label>
                  <Input id="parentInfo.parentEmail" type="email" {...register('parentInfo.parentEmail')} className="mt-1" placeholder="parent@example.com" />
                  {errors.parentInfo?.parentEmail && <p className="text-sm text-destructive mt-1">{errors.parentInfo.parentEmail.message}</p>}
                </div>
                <div>
                  <Label htmlFor="parentInfo.parentPhone" className="text-base sm:text-lg">Parent's Phone (Optional)</Label>
                  <Input id="parentInfo.parentPhone" type="tel" {...register('parentInfo.parentPhone')} className="mt-1" placeholder="123-456-7890" />
                  {errors.parentInfo?.parentPhone && <p className="text-sm text-destructive mt-1">{errors.parentInfo.parentPhone.message}</p>}
                </div>
              </div>
            )}

            {currentView === 'enrollmentDashboard' && (
              <>
                {currentDashboardStep === 0 && ( // Enrollment Details (Tabs)
                  <Tabs defaultValue="childrenRegistration" className="w-full">
                    <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 h-auto sm:h-10">
                      <TabsTrigger value="childrenRegistration" className="py-2 sm:py-1.5 text-xs sm:text-sm">
                        <Users className="mr-2 h-4 w-4" /> Register Children
                      </TabsTrigger>
                      <TabsTrigger value="accountSettings" className="py-2 sm:py-1.5 text-xs sm:text-sm">
                        <Settings className="mr-2 h-4 w-4" /> Account Settings
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="childrenRegistration" className="mt-4 space-y-4 sm:space-y-6">
                      {fields.map((field, index) => (
                        <ChildEnrollmentFields key={field.id} childIndex={index} removeChild={remove} />
                      ))}
                      {errors.children && typeof errors.children === 'object' && !Array.isArray(errors.children) && (errors.children as any).message && (
                          <p className="text-sm text-destructive mt-1">{(errors.children as any).message}</p>
                      )}
                      <Button type="button" variant="outline" onClick={() => append(defaultChildValues)} className="w-full sm:w-auto">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Another Child
                      </Button>
                      <Separator className="my-4 sm:my-6"/>
                      <div className="text-right space-y-1">
                        <p className="text-xl sm:text-2xl font-bold font-headline text-primary">Total Estimated Price: ${calculatedPrice.toFixed(2)}</p>
                      </div>
                    </TabsContent>
                    <TabsContent value="accountSettings" className="mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Account Settings</CardTitle>
                          <CardDescription>Manage your parent account details here.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground">Account settings functionality is not yet implemented. This is a placeholder.</p>
                          {/* Future: Add fields to edit parentInfo, change password, etc. */}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                )}
                
                {currentDashboardStep === 1 && ( // Payment Step
                  <div className="space-y-4 sm:space-y-6">
                    <div className="p-3 sm:p-4 border rounded-lg bg-primary/10">
                      <h3 className="text-lg sm:text-xl font-semibold font-headline text-primary">Payment Summary</h3>
                        {getValues("children").map((child, index) => {
                            const programDetails = PROGRAMS_BY_LEVEL[child.schoolLevel]?.find(p => p.value === child.program);
                            return (
                                <div key={index} className="mt-1 text-sm">
                                    <p>Child {index+1}: {child.fullName || `Child ${index+1}`}</p>
                                    <p className="ml-2">Program: {programDetails?.label || 'N/A'}</p>
                                    {(child.selectedCourses?.length || 0) > 0 && (
                                        <ul className="list-disc list-inside ml-6 text-xs">
                                        {child.selectedCourses?.map(courseValue => {
                                            const course = programDetails?.courses?.find(c => c.value === courseValue);
                                            return course ? <li key={course.value}>{course.label} (${course.price.toFixed(2)})</li> : null;
                                        })}
                                        </ul>
                                    )}
                                </div>
                            );
                        })}
                      <p className="mt-2 sm:mt-4 text-xl sm:text-2xl font-bold text-primary">Total Amount Due: ${calculatedPrice.toFixed(2)}</p>
                    </div>

                    <Tabs defaultValue={watchedPaymentType || "screenshot"} 
                          onValueChange={(value) => setValue('paymentProof.paymentType', value as "screenshot" | "link" | "transaction_id")} 
                          className="w-full">
                      <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto sm:h-10">
                        {PAYMENT_TYPES.map(type => (
                          <TabsTrigger key={type.value} value={type.value} className="py-2 sm:py-1.5 text-xs sm:text-sm">{type.label}</TabsTrigger>
                        ))}
                      </TabsList>
                      <TabsContent value="screenshot" className="mt-3 sm:mt-4 space-y-1 sm:space-y-2">
                        <Label htmlFor="paymentProof.screenshotFile" className="text-base sm:text-lg">Upload Payment Screenshot</Label>
                        <Controller
                            name="paymentProof.screenshot"
                            control={control}
                            render={({ field: { onChange, value, ...restField } }) => (
                                <Input 
                                    id="paymentProof.screenshotFile" 
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)}
                                    {...restField} 
                                    className="mt-1 text-xs sm:text-sm file:text-primary file:font-semibold file:mr-2 file:bg-primary/10 file:border-none file:rounded file:px-2 file:py-1 hover:file:bg-primary/20"
                                />
                            )}
                        />
                        {errors.paymentProof?.screenshot && <p className="text-sm text-destructive mt-1">{errors.paymentProof.screenshot.message as string}</p>}
                        {getValues("paymentProof.screenshot") && <p className="text-xs sm:text-sm text-muted-foreground mt-1">Selected: {(getValues("paymentProof.screenshot") as File)?.name}</p>}
                      </TabsContent>
                      <TabsContent value="link" className="mt-3 sm:mt-4 space-y-1 sm:space-y-2">
                        <Label htmlFor="paymentProof.pdfLink" className="text-base sm:text-lg">PDF Link</Label>
                        <Input id="paymentProof.pdfLink" type="url" {...register('paymentProof.pdfLink')} className="mt-1 text-xs sm:text-sm" placeholder="https://example.com/receipt.pdf"/>
                        {errors.paymentProof?.pdfLink && <p className="text-sm text-destructive mt-1">{errors.paymentProof.pdfLink.message}</p>}
                      </TabsContent>
                      <TabsContent value="transaction_id" className="mt-3 sm:mt-4 space-y-1 sm:space-y-2">
                        <Label htmlFor="paymentProof.transactionId" className="text-base sm:text-lg">Transaction ID</Label>
                        <Input id="paymentProof.transactionId" {...register('paymentProof.transactionId')} className="mt-1 text-xs sm:text-sm" placeholder="Enter your transaction ID"/>
                        {errors.paymentProof?.transactionId && <p className="text-sm text-destructive mt-1">{errors.paymentProof.transactionId.message}</p>}
                      </TabsContent>
                    </Tabs>
                    {calculatedPrice === 0 && (
                        <div className="flex items-start sm:items-center p-2 sm:p-3 rounded-md bg-destructive/10 text-destructive text-xs sm:text-sm">
                            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 shrink-0 mt-0.5 sm:mt-0" />
                            <p>Total amount is $0.00. Please ensure selections are correct. Payment verification might be skipped for $0 amount if all registrations are free.</p>
                        </div>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row sm:justify-between pt-4 sm:pt-6 p-4 sm:p-6 space-y-2 sm:space-y-0">
            {currentView === 'createAccount' ? (
              <Button type="button" onClick={handleCreateAccountAndProceed} disabled={isLoading} className="w-full sm:w-auto">
                Create Account & Proceed <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : ( // enrollmentDashboard view
              <>
                <Button type="button" variant="outline" onClick={handleDashboardPrevious} disabled={currentDashboardStep === 0 || isLoading} className="w-full sm:w-auto">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
                {currentDashboardStep < dashboardStepsConfig.length - 2 ? ( // Before payment step
                  <Button type="button" onClick={handleDashboardNext} disabled={isLoading} className="w-full sm:w-auto">
                    {currentDashboardStep === 0 ? "Proceed to Payment" : "Next"} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : ( // Payment step
                  <Button type="submit" disabled={isLoading || (calculatedPrice < 0)} className="w-full sm:w-auto">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    Verify & Register
                  </Button>
                )}
              </>
            )}
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
  );
};

export default EnrollmentForm;
