
"use client";

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Printer, User, Users, BookHeart, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RegistrationData } from '@/types';
import { format } from 'date-fns';
import { HAFSA_PAYMENT_METHODS } from '@/lib/constants';

interface ReceiptProps {
  data: RegistrationData;
}

const Receipt: React.FC<ReceiptProps> = ({ data }) => {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const paymentMethodLabel = HAFSA_PAYMENT_METHODS.find(pm => pm.value === data.paymentProof.paymentType)?.label || data.paymentProof.paymentType;

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xl my-6 sm:my-8 print:shadow-none">
      <CardHeader className="text-center bg-accent/10 print:bg-transparent p-4 sm:p-6">
        <div className="flex flex-col items-center">
          <Image 
            src="https://placehold.co/80x80.png" 
            alt="Hafsa Madrassa Logo" 
            width={60} 
            height={60}
            data-ai-hint="islamic education logo"
            className="sm:w-20 sm:h-20 mb-3 sm:mb-4 rounded-full"
          />
          <CardTitle className="text-2xl sm:text-3xl font-headline text-primary">Registration Confirmed!</CardTitle>
          <CardDescription className="text-base sm:text-lg mt-1">Thank you for registering with Hafsa Madrassa.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6 text-sm sm:text-base">
        
        <div className="flex items-center mb-2">
            <BookHeart className="h-5 w-5 mr-2 text-primary" />
            <h3 className="text-lg sm:text-xl font-semibold font-headline text-primary">Program Details</h3>
        </div>
        <div className="pl-7">
            <p><strong>Program:</strong> {data.selectedProgramLabel}</p>
            <p><strong>Registration Date:</strong> {format(new Date(data.registrationDate), "MMMM d, yyyy HH:mm")}</p>
        </div>

        {data.parentInfo && (
        <>
            <Separator />
            <div>
                <div className="flex items-center mb-2">
                    <Users className="h-5 w-5 mr-2 text-primary" />
                    <h3 className="text-lg sm:text-xl font-semibold font-headline text-primary">Parent/Guardian Information</h3>
                </div>
                <div className="pl-7">
                    <p><strong>Name:</strong> {data.parentInfo.parentFullName}</p>
                    <p><strong>Primary Phone:</strong> {data.parentInfo.parentPhone1}</p>
                    {data.parentInfo.parentPhone2 && <p><strong>Secondary Phone:</strong> {data.parentInfo.parentPhone2}</p>}
                    <p><strong>Telegram Phone:</strong> {data.parentInfo.telegramPhoneNumber}</p>
                </div>
            </div>
        </>
        )}

        {data.children && data.children.length > 0 && (
        <>
            <Separator />
            <div>
                <div className="flex items-center mb-2">
                    <User className="h-5 w-5 mr-2 text-primary" />
                    <h3 className="text-lg sm:text-xl font-semibold font-headline text-primary">Children's Details</h3>
                </div>
                {data.children.map((child, index) => (
                    <div key={index} className="mb-4 sm:mb-6 pl-7 border-l-2 border-muted ml-2 pl-4 py-2 relative">
                         <span className="absolute -left-[10px] top-1.5 bg-background p-0.5 rounded-full border border-muted">
                            <User className="h-3 w-3 text-primary" />
                        </span>
                        <h4 className="text-md sm:text-lg font-semibold mb-1">Child {index + 1}: {child.childFirstName}</h4>
                        <p><strong>Gender:</strong> {child.gender.charAt(0).toUpperCase() + child.gender.slice(1)}</p>
                        <p><strong>Date of Birth:</strong> {format(new Date(child.dateOfBirth), "MMMM d, yyyy")}</p>
                        {child.schoolGrade && <p><strong>School Grade:</strong> {child.schoolGrade}</p>}
                        {child.quranLevel && <p><strong>Quran Level:</strong> {child.quranLevel}</p>}
                        {child.specialAttention && <p><strong>Special Attention:</strong> {child.specialAttention}</p>}
                        {index < data.children!.length -1 && <Separator className="my-3"/>}
                    </div>
                ))}
            </div>
        </>
        )}

        {data.adultTraineeInfo && (
        <>
            <Separator />
            <div>
                <div className="flex items-center mb-2">
                    <User className="h-5 w-5 mr-2 text-primary" />
                    <h3 className="text-lg sm:text-xl font-semibold font-headline text-primary">Trainee Information</h3>
                </div>
                <div className="pl-7">
                    <p><strong>Name:</strong> {data.adultTraineeInfo.traineeFullName}</p>
                    <p><strong>Date of Birth:</strong> {format(new Date(data.adultTraineeInfo.dateOfBirth), "MMMM d, yyyy")}</p>
                    <p><strong>Primary Phone:</strong> {data.adultTraineeInfo.phone1}</p>
                    {data.adultTraineeInfo.phone2 && <p><strong>Secondary Phone:</strong> {data.adultTraineeInfo.phone2}</p>}
                    <p><strong>Telegram Phone:</strong> {data.adultTraineeInfo.telegramPhoneNumber}</p>
                </div>
            </div>
        </>
        )}
        
        <Separator />

        <div>
          <h3 className="text-md sm:text-lg font-semibold font-headline mb-1">Payment Details</h3>
          <p><strong>Total Amount Paid:</strong> <span className="font-bold text-accent">${data.calculatedPrice.toFixed(2)}</span></p>
          {data.couponCode && <p><strong>Coupon Code Applied:</strong> <span className="text-accent">{data.couponCode}</span></p>}
          <p><strong>Payment Method:</strong> {paymentMethodLabel}</p>
          {data.paymentProof.transactionId && (
             <p><strong>Transaction ID/Reference:</strong> {data.paymentProof.transactionId}</p>
          )}
          <div className="flex items-center mt-2 text-accent">
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            <span>Payment {data.paymentVerified ? "Verified Successfully" : "Submitted for Processing"}</span>
          </div>
        </div>
        
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 border-dashed border-2 border-muted rounded-lg text-center print:hidden">
            <Image 
                src="https://placehold.co/300x75.png" 
                alt="Success illustration" 
                width={300} 
                height={75} 
                data-ai-hint="islamic pattern certificate"
                className="mx-auto mb-2 rounded max-w-full h-auto sm:w-[400px] sm:h-[100px]"
            />
          <p className="text-muted-foreground text-xs sm:text-sm">
            You will receive a confirmation via Telegram or SMS shortly with further details. Ensure your provided phone numbers are correct.
          </p>
        </div>

      </CardContent>
      <CardFooter className="flex justify-end p-4 sm:p-6 print:hidden">
        <Button onClick={handlePrint} variant="outline">
          <Printer className="mr-2 h-4 w-4" /> Print Receipt
        </Button>
      </CardFooter>
    </Card>
  );
};

export default Receipt;
