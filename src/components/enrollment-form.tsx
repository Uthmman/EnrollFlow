"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, FormProvider, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { School, User, BookOpen, CreditCard, FileText, CheckCircle, ArrowRight, ArrowLeft, Loader2, AlertTriangle, CalendarIcon } from 'lucide-react';
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
import type { EnrollmentFormData, RegistrationData } from '@/types';
import { EnrollmentFormSchema } from '@/types';
import { handlePaymentVerification } from '@/app/actions';
import Receipt from '@/components/receipt';

const formSteps = [
  { id: 'program', title: 'Program Selection', icon: <School className="h-5 w-5" /> },
  { id: 'student', title: 'Student Information', icon: <User className="h-5 w-5" /> },
  { id: 'courses', title: 'Course Selection', icon: <BookOpen className="h-5 w-5" /> },
  { id: 'payment', title: 'Payment & Verification', icon: <CreditCard className="h-5 w-5" /> },
  { id: 'confirmation', title: 'Confirmation', icon: <CheckCircle className="h-5 w-5" /> },
];

const EnrollmentForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
  const { toast } = useToast();

  const methods = useForm<EnrollmentFormData>({
    resolver: zodResolver(EnrollmentFormSchema),
    defaultValues: {
      schoolLevel: '',
      program: '',
      selectedCourses: [],
      paymentType: 'screenshot',
    },
  });

  const { control, handleSubmit, formState: { errors }, setValue, getValues, trigger, watch } = methods;

  const watchedSchoolLevel = watch('schoolLevel');
  const watchedProgram = watch('program');
  const watchedSelectedCourses = watch('selectedCourses');
  const watchedPaymentType = watch('paymentType');

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
      setValue('program', ''); // Reset program when school level changes
      setValue('selectedCourses', []); // Reset courses
    }
  }, [watchedSchoolLevel, setValue]);
  
  useEffect(() => {
    if (watchedProgram) {
       setValue('selectedCourses', []); // Reset courses when program changes
    }
  }, [watchedProgram, setValue]);

  useEffect(() => {
    const calculate = () => {
      let total = 0;
      const programDetails = PROGRAMS_BY_LEVEL[getValues("schoolLevel")]?.find(p => p.value === getValues("program"));
      if (programDetails) {
        total += programDetails.basePrice;
        const courses = getValues("selectedCourses") || [];
        courses.forEach(courseValue => {
          const courseDetails = programDetails.courses?.find(c => c.value === courseValue);
          if (courseDetails) {
            total += courseDetails.price;
          }
        });
      }
      setCalculatedPrice(total);
    };
    calculate();
  }, [watchedSchoolLevel, watchedProgram, watchedSelectedCourses, getValues]);

  const handleNext = async () => {
    let fieldsToValidate: (keyof EnrollmentFormData)[] = [];
    if (currentStep === 0) fieldsToValidate = ['schoolLevel', 'program'];
    if (currentStep === 1) fieldsToValidate = ['fullName', 'dateOfBirth', 'email']; // 'phone', 'address' are optional
    // No specific validation for step 2 (courses) beyond schema
    // Step 3 (payment) validation is complex, handled during submission

    const isValid = fieldsToValidate.length > 0 ? await trigger(fieldsToValidate) : true;
    if (isValid) {
      setCurrentStep(prev => prev + 1);
    } else {
       // Highlight errors, e.g. by focusing on the first error
       const firstErrorField = Object.keys(errors)[0] as keyof EnrollmentFormData;
       if (firstErrorField && methods.getFieldState(firstErrorField).error) {
         const fieldElement = document.getElementsByName(firstErrorField)[0];
         if(fieldElement) fieldElement.focus();
       }
    }
  };

  const handlePrevious = () => setCurrentStep(prev => prev - 1);

  const onSubmit = async (data: EnrollmentFormData) => {
    setIsLoading(true);
    try {
      let screenshotDataUri: string | undefined;
      if (data.paymentType === 'screenshot' && data.screenshot) {
        screenshotDataUri = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(data.screenshot);
        });
        setValue('screenshotDataUri', screenshotDataUri); // Update form data
        data.screenshotDataUri = screenshotDataUri; // ensure data passed to action has it
      }
      
      const verificationInput = {
        paymentProof: {
          paymentType: data.paymentType,
          screenshotDataUri: data.screenshotDataUri,
          pdfLink: data.pdfLink,
          transactionId: data.transactionId,
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
          ...data,
          calculatedPrice,
          paymentVerified: true,
          paymentVerificationDetails: result,
          registrationDate: new Date(),
        };
        setRegistrationData(finalRegistrationData);
        setCurrentStep(prev => prev + 1); // Move to confirmation
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
  
  if (registrationData && currentStep === formSteps.length - 1) {
    return <Receipt data={registrationData} />;
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
               <CardDescription className="text-sm">Step {currentStep + 1} of {formSteps.length-1}: {formSteps[currentStep].title}</CardDescription>
                <div className="flex space-x-1">
                {formSteps.slice(0, -1).map((step, index) => (
                    <div
                    key={step.id}
                    className={cn(
                        "h-2 w-6 sm:w-8 rounded-full",
                        currentStep >= index ? "bg-primary" : "bg-muted"
                    )}
                    />
                ))}
                </div>
            </div>
          </CardHeader>
          <CardContent className="min-h-[250px] sm:min-h-[300px] p-4 sm:p-6">
            {currentStep === 0 && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <Label htmlFor="schoolLevel" className="text-base sm:text-lg">School Level</Label>
                   <Controller
                    name="schoolLevel"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger id="schoolLevel" className="mt-1">
                          <SelectValue placeholder="Select school level" />
                        </SelectTrigger>
                        <SelectContent>
                          {SCHOOL_LEVELS.map(level => (
                            <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.schoolLevel && <p className="text-sm text-destructive mt-1">{errors.schoolLevel.message}</p>}
                </div>
                {watchedSchoolLevel && (
                  <div>
                    <Label htmlFor="program" className="text-base sm:text-lg">Program/Grade</Label>
                    <Controller
                      name="program"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value} >
                          <SelectTrigger id="program" className="mt-1">
                            <SelectValue placeholder="Select program/grade" />
                          </SelectTrigger>
                          <SelectContent>
                            {availablePrograms.map(prog => (
                              <SelectItem key={prog.value} value={prog.value}>{prog.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.program && <p className="text-sm text-destructive mt-1">{errors.program.message}</p>}
                  </div>
                )}
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <Label htmlFor="fullName" className="text-base sm:text-lg">Full Name</Label>
                  <Input id="fullName" {...methods.register('fullName')} className="mt-1" placeholder="John Doe" />
                  {errors.fullName && <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>}
                </div>
                <div>
                  <Label htmlFor="dateOfBirth" className="text-base sm:text-lg">Date of Birth</Label>
                  <Controller
                    name="dateOfBirth"
                    control={control}
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal mt-1",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  {errors.dateOfBirth && <p className="text-sm text-destructive mt-1">{errors.dateOfBirth.message}</p>}
                </div>
                <div>
                  <Label htmlFor="email" className="text-base sm:text-lg">Email Address</Label>
                  <Input id="email" type="email" {...methods.register('email')} className="mt-1" placeholder="john.doe@example.com" />
                  {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
                </div>
                 <div>
                  <Label htmlFor="phone" className="text-base sm:text-lg">Phone Number (Optional)</Label>
                  <Input id="phone" type="tel" {...methods.register('phone')} className="mt-1" placeholder="123-456-7890"/>
                  {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>}
                </div>
                <div>
                  <Label htmlFor="address" className="text-base sm:text-lg">Address (Optional)</Label>
                  <Input id="address" {...methods.register('address')} className="mt-1" placeholder="123 Main St, Anytown USA"/>
                  {errors.address && <p className="text-sm text-destructive mt-1">{errors.address.message}</p>}
                </div>
              </div>
            )}
            
            {currentStep === 2 && (
                 <div className="space-y-3 sm:space-y-4">
                 <h3 className="text-lg sm:text-xl font-semibold font-headline">Available Courses for {currentProgramDetails?.label}</h3>
                 {availableCourses.length > 0 ? (
                   <Controller
                     name="selectedCourses"
                     control={control}
                     render={({ field }) => (
                       <div className="space-y-2">
                         {availableCourses.map((course: Course) => (
                           <div key={course.value} className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 border rounded-md hover:bg-muted/50 transition-colors">
                             <Checkbox
                               id={course.value}
                               checked={field.value?.includes(course.value)}
                               onCheckedChange={(checked) => {
                                 const newValue = checked
                                   ? [...(field.value || []), course.value]
                                   : (field.value || []).filter((v) => v !== course.value);
                                 field.onChange(newValue);
                               }}
                             />
                             <Label htmlFor={course.value} className="flex-grow text-sm sm:text-md cursor-pointer">
                               {course.label}
                             </Label>
                             <span className="text-xs sm:text-sm text-foreground/80">${course.price.toFixed(2)}</span>
                           </div>
                         ))}
                       </div>
                     )}
                   />
                 ) : (
                   <p className="text-muted-foreground text-sm sm:text-base">No specific courses to select for this program, or program not yet selected.</p>
                 )}
                 <Separator className="my-4 sm:my-6"/>
                 <div className="text-right space-y-1">
                    <p className="text-base sm:text-lg">Program Base Price: <span className="font-semibold">${currentProgramDetails?.basePrice.toFixed(2) || '0.00'}</span></p>
                    <p className="text-xl sm:text-2xl font-bold font-headline text-primary">Total Estimated Price: ${calculatedPrice.toFixed(2)}</p>
                 </div>
               </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4 sm:space-y-6">
                <div className="p-3 sm:p-4 border rounded-lg bg-primary/10">
                  <h3 className="text-lg sm:text-xl font-semibold font-headline text-primary">Payment Summary</h3>
                  <p className="mt-1 sm:mt-2 text-base sm:text-lg">Program: {currentProgramDetails?.label}</p>
                  { (getValues("selectedCourses")?.length || 0) > 0 && (
                    <div className="mt-1">
                        <p className="text-sm sm:text-md">Selected Courses:</p>
                        <ul className="list-disc list-inside ml-4 text-xs sm:text-sm">
                        {getValues("selectedCourses")?.map(courseValue => {
                            const course = availableCourses.find(c => c.value === courseValue);
                            return course ? <li key={course.value}>{course.label} (${course.price.toFixed(2)})</li> : null;
                        })}
                        </ul>
                    </div>
                  )}
                  <p className="mt-2 sm:mt-4 text-xl sm:text-2xl font-bold text-primary">Total Amount Due: ${calculatedPrice.toFixed(2)}</p>
                </div>

                <Tabs defaultValue={watchedPaymentType || "screenshot"} 
                      onValueChange={(value) => setValue('paymentType', value as "screenshot" | "link" | "transaction_id")} 
                      className="w-full">
                  <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto sm:h-10">
                    {PAYMENT_TYPES.map(type => (
                      <TabsTrigger key={type.value} value={type.value} className="py-2 sm:py-1.5 text-xs sm:text-sm">{type.label}</TabsTrigger>
                    ))}
                  </TabsList>
                  <TabsContent value="screenshot" className="mt-3 sm:mt-4 space-y-1 sm:space-y-2">
                    <Label htmlFor="screenshotFile" className="text-base sm:text-lg">Upload Payment Screenshot</Label>
                    <Controller
                        name="screenshot"
                        control={control}
                        render={({ field: { onChange, value, ...restField } }) => (
                            <Input 
                                id="screenshotFile" 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)}
                                {...restField} 
                                className="mt-1 text-xs sm:text-sm file:text-primary file:font-semibold file:mr-2 file:bg-primary/10 file:border-none file:rounded file:px-2 file:py-1 hover:file:bg-primary/20"
                            />
                        )}
                    />
                    {errors.screenshot && <p className="text-sm text-destructive mt-1">{errors.screenshot.message}</p>}
                    {getValues("screenshot") && <p className="text-xs sm:text-sm text-muted-foreground mt-1">Selected: {(getValues("screenshot") as File)?.name}</p>}
                  </TabsContent>
                  <TabsContent value="link" className="mt-3 sm:mt-4 space-y-1 sm:space-y-2">
                    <Label htmlFor="pdfLink" className="text-base sm:text-lg">PDF Link</Label>
                    <Input id="pdfLink" type="url" {...methods.register('pdfLink')} className="mt-1 text-xs sm:text-sm" placeholder="https://example.com/receipt.pdf"/>
                    {errors.pdfLink && <p className="text-sm text-destructive mt-1">{errors.pdfLink.message}</p>}
                  </TabsContent>
                  <TabsContent value="transaction_id" className="mt-3 sm:mt-4 space-y-1 sm:space-y-2">
                    <Label htmlFor="transactionId" className="text-base sm:text-lg">Transaction ID</Label>
                    <Input id="transactionId" {...methods.register('transactionId')} className="mt-1 text-xs sm:text-sm" placeholder="Enter your transaction ID"/>
                    {errors.transactionId && <p className="text-sm text-destructive mt-1">{errors.transactionId.message}</p>}
                  </TabsContent>
                </Tabs>
                {calculatedPrice === 0 && (
                    <div className="flex items-start sm:items-center p-2 sm:p-3 rounded-md bg-destructive/10 text-destructive text-xs sm:text-sm">
                        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 shrink-0 mt-0.5 sm:mt-0" />
                        <p>Total amount is $0.00. Please ensure your selections are correct. Payment verification might be skipped for $0 amount.</p>
                    </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row sm:justify-between pt-4 sm:pt-6 p-4 sm:p-6 space-y-2 sm:space-y-0">
            <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentStep === 0 || isLoading} className="w-full sm:w-auto">
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            {currentStep < formSteps.length - 2 ? (
              <Button type="button" onClick={handleNext} disabled={isLoading} className="w-full sm:w-auto">
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading || calculatedPrice < 0} className="w-full sm:w-auto"> {/* Allow $0 submission */}
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                Verify & Register
              </Button>
            )}
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
  );
};

export default EnrollmentForm;
