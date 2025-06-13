
"use client";

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Printer, User, Users, BookHeart, Gift, BookUser, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RegistrationData } from '@/types';
import { format } from 'date-fns';
import { HAFSA_PAYMENT_METHODS, HAFSA_PROGRAMS } from '@/lib/constants';

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
  const primaryRegistrant = data.parentInfo;
  const adultEnrollment = data.adultTraineeInfo;
  const childrenEnrollments = data.children || [];

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
            className="w-16 h-16 sm:w-20 sm:h-20 mb-3 sm:mb-4 rounded-full"
          />
          <CardTitle className="text-2xl sm:text-3xl font-headline text-primary">Registration Confirmed!</CardTitle>
          <CardDescription className="text-base sm:text-lg mt-1">Thank you for registering with Hafsa Madrassa.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6 text-sm sm:text-base">
        
        <div className="flex items-center mb-2">
            <CalendarDays className="h-5 w-5 mr-2 text-primary" />
            <h3 className="text-lg sm:text-xl font-semibold font-headline text-primary">Registration Summary</h3>
        </div>
        <div className="pl-7">
            <p><strong>Registration Date:</strong> {format(new Date(data.registrationDate), "MMMM d, yyyy HH:mm")}</p>
        </div>

        {/* Primary Registrant Information */}
        <Separator />
        <div>
            <div className="flex items-center mb-2">
                <User className="h-5 w-5 mr-2 text-primary" />
                <h3 className="text-lg sm:text-xl font-semibold font-headline text-primary">Primary Registrant</h3>
            </div>
            <div className="pl-7 space-y-0.5">
                <p><strong>Name:</strong> {primaryRegistrant.parentFullName}</p>
                <p><strong>Primary Phone:</strong> {primaryRegistrant.parentPhone1}</p>
                {primaryRegistrant.parentPhone2 && <p><strong>Secondary Phone:</strong> {primaryRegistrant.parentPhone2}</p>}
                <p><strong>Telegram Phone:</strong> {primaryRegistrant.telegramPhoneNumber}</p>
            </div>
        </div>

        {/* Adult Trainee Program (if primary registrant enrolled themselves) */}
        {adultEnrollment && adultEnrollment.programId && (
        <>
            <Separator />
            <div>
                <div className="flex items-center mb-2">
                    <BookUser className="h-5 w-5 mr-2 text-primary" />
                    <h3 className="text-lg sm:text-xl font-semibold font-headline text-primary">Primary Registrant's Program</h3>
                </div>
                <div className="pl-7 space-y-0.5">
                    <p><strong>Program:</strong> {HAFSA_PROGRAMS.find(p => p.id === adultEnrollment.programId)?.label || 'N/A'}</p>
                    <p><strong>Date of Birth:</strong> {format(new Date(adultEnrollment.dateOfBirth), "MMMM d, yyyy")}</p>
                    <p><strong>Price:</strong> ${HAFSA_PROGRAMS.find(p => p.id === adultEnrollment.programId)?.price.toFixed(2) || '0.00'}</p>
                </div>
            </div>
        </>
        )}
        
        {/* Enrolled Children */}
        {childrenEnrollments.length > 0 && (
        <>
            <Separator />
            <div>
                <div className="flex items-center mb-2">
                    <Users className="h-5 w-5 mr-2 text-primary" />
                    <h3 className="text-lg sm:text-xl font-semibold font-headline text-primary">Enrolled Children</h3>
                </div>
                {childrenEnrollments.map((enrolledChild, index) => {
                    const program = HAFSA_PROGRAMS.find(p => p.id === enrolledChild.programId);
                    const child = enrolledChild.childInfo;
                    return (
                        <div key={index} className="mb-3 sm:mb-4 pl-7 border-l-2 border-muted ml-2 pl-4 py-2 relative">
                            <span className="absolute -left-[10px] top-1.5 bg-background p-0.5 rounded-full border border-muted">
                                <User className="h-3 w-3 text-primary" />
                            </span>
                            <h4 className="text-md sm:text-lg font-semibold mb-1">Child {index + 1}: {child.childFirstName}</h4>
                            <div className="space-y-0.5 text-xs sm:text-sm">
                                <p><strong>Program:</strong> {program?.label || 'N/A'}</p>
                                <p><strong>Price:</strong> ${program?.price.toFixed(2) || '0.00'}</p>
                                <p><strong>Gender:</strong> {child.gender.charAt(0).toUpperCase() + child.gender.slice(1)}</p>
                                <p><strong>Date of Birth:</strong> {format(new Date(child.dateOfBirth), "MMMM d, yyyy")}</p>
                                {child.schoolGrade && <p><strong>School Grade:</strong> {child.schoolGrade}</p>}
                                {child.quranLevel && <p><strong>Quran Level:</strong> {child.quranLevel}</p>}
                                {child.specialAttention && <p><strong>Special Attention:</strong> {child.specialAttention}</p>}
                            </div>
                            {index < childrenEnrollments.length -1 && <Separator className="my-2 sm:my-3"/>}
                        </div>
                    );
                })}
            </div>
        </>
        )}
        
        <Separator />

        <div>
          <h3 className="text-md sm:text-lg font-semibold font-headline mb-1">Payment Details</h3>
          <div className="space-y-0.5">
            <p><strong>Total Amount Paid:</strong> <span className="font-bold text-accent">${data.calculatedPrice.toFixed(2)}</span></p>
            {data.couponCode && <p><strong>Coupon Code Applied:</strong> <span className="text-accent">{data.couponCode}</span></p>}
            <p><strong>Payment Method:</strong> {paymentMethodLabel}</p>
            {data.paymentProof.transactionId && (
               <p><strong>Transaction ID/Reference:</strong> {data.paymentProof.transactionId}</p>
            )}
          </div>
          <div className="flex items-center mt-2 text-accent">
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            <span>Payment {data.paymentVerified ? "Verified Successfully" : "Submitted for Processing"}</span>
          </div>
        </div>
        
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 border-dashed border-2 border-muted rounded-lg text-center print:hidden">
            <Image 
                src="https://placehold.co/300x75.png" 
                alt="Success illustration" 
                width={250} 
                height={62}
                data-ai-hint="islamic pattern certificate"
                className="mx-auto mb-2 rounded max-w-[250px] h-auto sm:max-w-[300px]"
            />
          <p className="text-muted-foreground text-xs sm:text-sm">
            You will receive a confirmation via Telegram or SMS shortly with further details. Ensure your provided phone numbers are correct.
          </p>
        </div>

      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-end p-3 sm:p-4 print:hidden">
        <Button onClick={handlePrint} variant="outline" className="w-full sm:w-auto">
          <Printer className="mr-2 h-4 w-4" /> Print Receipt
        </Button>
      </CardFooter>
    </Card>
  );
};

export default Receipt;
