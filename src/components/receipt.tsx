"use client";

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RegistrationData } from '@/types';
import { format } from 'date-fns';
import { PROGRAMS_BY_LEVEL } from '@/lib/constants';

interface ReceiptProps {
  data: RegistrationData;
}

const Receipt: React.FC<ReceiptProps> = ({ data }) => {
  const programDetails = PROGRAMS_BY_LEVEL[data.schoolLevel]?.find(p => p.value === data.program);
  const courseDetailsList = data.selectedCourses?.map(courseValue => {
    return programDetails?.courses?.find(c => c.value === courseValue);
  }).filter(Boolean);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl my-8 print:shadow-none">
      <CardHeader className="text-center bg-accent/10 print:bg-transparent">
        <div className="flex flex-col items-center">
          <Image 
            src="https://placehold.co/100x100.png" 
            alt="EnrollFlow Logo" 
            width={80} 
            height={80} 
            data-ai-hint="school logo"
            className="mb-4 rounded-full"
          />
          <CardTitle className="text-3xl font-headline text-primary">Registration Confirmed!</CardTitle>
          <CardDescription className="text-lg mt-1">Thank you for registering with EnrollFlow.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold font-headline mb-1">Student Information</h3>
            <p><strong>Name:</strong> {data.fullName}</p>
            <p><strong>Email:</strong> {data.email}</p>
            <p><strong>Date of Birth:</strong> {format(new Date(data.dateOfBirth), "MMMM d, yyyy")}</p>
            {data.phone && <p><strong>Phone:</strong> {data.phone}</p>}
            {data.address && <p><strong>Address:</strong> {data.address}</p>}
          </div>
          <div>
            <h3 className="text-lg font-semibold font-headline mb-1">Enrollment Details</h3>
            <p><strong>Program:</strong> {programDetails?.label || data.program}</p>
            {courseDetailsList && courseDetailsList.length > 0 && (
              <>
                <p className="mt-1"><strong>Courses:</strong></p>
                <ul className="list-disc list-inside ml-4 text-sm">
                  {courseDetailsList.map(course => course && (
                    <li key={course.value}>{course.label} (${course.price.toFixed(2)})</li>
                  ))}
                </ul>
              </>
            )}
            <p className="mt-2"><strong>Registration Date:</strong> {format(new Date(data.registrationDate), "MMMM d, yyyy HH:mm")}</p>
          </div>
        </div>
        
        <Separator />

        <div>
          <h3 className="text-lg font-semibold font-headline mb-1">Payment Details</h3>
          <p><strong>Total Amount Paid:</strong> <span className="font-bold text-accent">${data.calculatedPrice.toFixed(2)}</span></p>
          <p><strong>Payment Method:</strong> {
            data.paymentType === 'screenshot' ? 'Screenshot Upload' : 
            data.paymentType === 'link' ? 'PDF Link' : 
            'Transaction ID'
          }</p>
          {data.paymentVerificationDetails?.transactionNumber && (
             <p><strong>Transaction ID:</strong> {data.paymentVerificationDetails.transactionNumber}</p>
          )}
          <div className="flex items-center mt-2 text-accent">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span>Payment Verified Successfully</span>
          </div>
        </div>
        
        <div className="mt-6 p-4 border-dashed border-2 border-muted rounded-lg text-center print:hidden">
            <Image 
                src="https://placehold.co/400x100.png" 
                alt="Success illustration" 
                width={400} 
                height={100} 
                data-ai-hint="certificate graduation"
                className="mx-auto mb-2 rounded"
            />
          <p className="text-muted-foreground">
            You will receive a confirmation email shortly with further details.
          </p>
        </div>

      </CardContent>
      <CardFooter className="flex justify-end p-6 print:hidden">
        <Button onClick={handlePrint} variant="outline">
          <Printer className="mr-2 h-4 w-4" /> Print Receipt
        </Button>
      </CardFooter>
    </Card>
  );
};

export default Receipt;
