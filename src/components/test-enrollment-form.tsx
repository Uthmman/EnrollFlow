
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebaseConfig';
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { Loader2 } from 'lucide-react';

// 1. Define a simple Zod schema for the test form
const TestEnrollmentSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters."),
  email: z.string().email("Invalid email address."),
  programName: z.string().min(1, "Program name is required."),
  transactionId: z.string().min(5, "Transaction ID must be at least 5 characters."),
});

type TestEnrollmentFormData = z.infer<typeof TestEnrollmentSchema>;

const TestEnrollmentForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TestEnrollmentFormData>({
    resolver: zodResolver(TestEnrollmentSchema),
  });

  const onSubmit = async (data: TestEnrollmentFormData) => {
    setIsLoading(true);
    console.log("Test form data submitted:", data);

    if (!db) {
      toast({
        title: "Error",
        description: "Firestore database is not initialized. Cannot save test registration.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const registrationDataToSave = {
        ...data,
        submittedAt: Timestamp.now(), // Use Firestore Timestamp for dates
      };

      const docRef = await addDoc(collection(db, "testRegistrations"), registrationDataToSave);
      console.log("Test registration saved to Firestore. Document ID:", docRef.id);
      toast({
        title: "Test Registration Submitted",
        description: `Data saved with ID: ${docRef.id}. Check 'testRegistrations' collection in Firestore.`,
        variant: "default",
        className: "bg-green-600 text-white",
      });
      reset(); // Clear the form after successful submission
    } catch (error: any) {
      console.error("Error saving test registration to Firestore:", error);
      toast({
        title: "Error Saving Test Registration",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onFormError = (formErrors: any) => {
    console.error("Test form validation errors:", formErrors);
    toast({
      title: "Validation Error",
      description: "Please check the form for errors and try again.",
      variant: "destructive",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Simplified Test Form</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit, onFormError)}>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" {...register("fullName")} placeholder="Enter your full name" />
            {errors.fullName && <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>}
          </div>
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" {...register("email")} placeholder="Enter your email" />
            {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="programName">Program Name</Label>
            <Input id="programName" {...register("programName")} placeholder="Enter program name (e.g., Test Program A)" />
            {errors.programName && <p className="text-sm text-destructive mt-1">{errors.programName.message}</p>}
          </div>
          <div>
            <Label htmlFor="transactionId">Transaction ID</Label>
            <Input id="transactionId" {...register("transactionId")} placeholder="Enter payment transaction ID" />
            {errors.transactionId && <p className="text-sm text-destructive mt-1">{errors.transactionId.message}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting Test Data...
              </>
            ) : (
              "Submit Test Registration"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default TestEnrollmentForm;
