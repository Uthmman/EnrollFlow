
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Printer, User, Users, ShieldQuestion, CalendarDays, ArrowLeft, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RegistrationData } from '@/types';
import type { HafsaProgram } from '@/lib/constants';
import { format } from 'date-fns';
import { HAFSA_PAYMENT_METHODS } from '@/lib/constants';
import { getTranslatedText } from '@/lib/translationService';

interface ReceiptProps {
  data: RegistrationData;
  onBack: () => void;
  allPrograms: HafsaProgram[];
  currentLanguage: string;
}

// Original English strings for Receipt
const O_R_REGISTRATION_CONFIRMED_TITLE = "Registration Confirmed!";
const O_R_THANK_YOU_DESC = "Thank you for registering with Hafsa Madrassa.";
const O_R_REGISTRATION_SUMMARY_TITLE = "Registration Summary";
const O_R_REGISTRATION_DATE_LABEL = "Registration Date:";
const O_R_USER_ID_LABEL = "User ID:";
const O_R_PRIMARY_ACCOUNT_HOLDER_TITLE = "Primary Account Holder";
const O_R_NAME_LABEL = "Name:";
const O_R_EMAIL_LABEL = "Email:";
const O_R_PHONE_LABEL = "Phone:";
const O_R_ENROLLED_PARTICIPANTS_TITLE = "Enrolled Participants";
const O_R_PARTICIPANT_PREFIX = "Participant ";
const O_R_PROGRAM_LABEL = "Program:";
const O_R_PRICE_LABEL = "Price:";
const O_R_GENDER_LABEL = "Gender:";
const O_R_DOB_LABEL = "Date of Birth:";
const O_R_SCHOOL_GRADE_LABEL = "School Grade:";
const O_R_QURAN_LEVEL_LABEL = "Quran Level:";
const O_R_SPECIAL_ATTENTION_LABEL = "Special Attention:";
const O_R_GUARDIAN_CONTACT_FOR_PREFIX = "Guardian Contact for ";
const O_R_GUARDIAN_NAME_LABEL = "Name:"; // Reused
const O_R_GUARDIAN_PRIMARY_PHONE_LABEL = "Primary Phone:";
const O_R_GUARDIAN_SECONDARY_PHONE_LABEL = "Secondary Phone:";
const O_R_GUARDIAN_TELEGRAM_PHONE_LABEL = "Telegram Phone:";
const O_R_NA_TEXT = "N/A";
const O_R_PAYMENT_DETAILS_TITLE = "Payment Details";
const O_R_TOTAL_AMOUNT_PAID_LABEL = "Total Amount Paid:";
const O_R_COUPON_APPLIED_LABEL = "Coupon Code Applied:";
const O_R_PAYMENT_METHOD_LABEL = "Payment Method:";
const O_R_TRANSACTION_ID_LABEL = "Transaction ID/Reference:";
const O_R_PDF_LINK_LABEL = "PDF Link:";
const O_R_VIEW_PDF_LINK_TEXT = "View PDF";
const O_R_PROOF_METHOD_LABEL = "Proof Method:";
const O_R_SCREENSHOT_UPLOADED_TEXT = "Screenshot Uploaded";
const O_R_PAYMENT_VERIFIED_TEXT = "Payment Verified Successfully";
const O_R_PAYMENT_SUBMITTED_TEXT = "Payment Submitted for Processing";
const O_R_REASON_LABEL = "Reason:";
const O_R_CONFIRMATION_MESSAGE = "You will receive a confirmation via Telegram or SMS shortly with further details. Ensure your provided phone numbers are correct.";
const O_R_BACK_TO_DASHBOARD_BUTTON = "Back to Dashboard";
const O_R_PRINT_RECEIPT_BUTTON = "Print Receipt";


const Receipt: React.FC<ReceiptProps> = ({ data, onBack, allPrograms, currentLanguage }) => {
  const [t, setT] = useState<Record<string, string>>({});

  const translateReceiptContent = useCallback(async (lang: string) => {
    const newT: Record<string, string> = {};
    const keysToTranslate: Record<string, string> = {
        registrationConfirmedTitle: O_R_REGISTRATION_CONFIRMED_TITLE,
        thankYouDesc: O_R_THANK_YOU_DESC,
        registrationSummaryTitle: O_R_REGISTRATION_SUMMARY_TITLE,
        registrationDateLabel: O_R_REGISTRATION_DATE_LABEL,
        userIdLabel: O_R_USER_ID_LABEL,
        primaryAccountHolderTitle: O_R_PRIMARY_ACCOUNT_HOLDER_TITLE,
        nameLabel: O_R_NAME_LABEL,
        emailLabel: O_R_EMAIL_LABEL,
        phoneLabel: O_R_PHONE_LABEL,
        enrolledParticipantsTitle: O_R_ENROLLED_PARTICIPANTS_TITLE,
        participantPrefix: O_R_PARTICIPANT_PREFIX,
        programLabel: O_R_PROGRAM_LABEL,
        priceLabel: O_R_PRICE_LABEL,
        genderLabel: O_R_GENDER_LABEL,
        dobLabel: O_R_DOB_LABEL,
        schoolGradeLabel: O_R_SCHOOL_GRADE_LABEL,
        quranLevelLabel: O_R_QURAN_LEVEL_LABEL,
        specialAttentionLabel: O_R_SPECIAL_ATTENTION_LABEL,
        guardianContactForPrefix: O_R_GUARDIAN_CONTACT_FOR_PREFIX,
        guardianNameLabel: O_R_GUARDIAN_NAME_LABEL,
        guardianPrimaryPhoneLabel: O_R_GUARDIAN_PRIMARY_PHONE_LABEL,
        guardianSecondaryPhoneLabel: O_R_GUARDIAN_SECONDARY_PHONE_LABEL,
        guardianTelegramPhoneLabel: O_R_GUARDIAN_TELEGRAM_PHONE_LABEL,
        naText: O_R_NA_TEXT,
        paymentDetailsTitle: O_R_PAYMENT_DETAILS_TITLE,
        totalAmountPaidLabel: O_R_TOTAL_AMOUNT_PAID_LABEL,
        couponAppliedLabel: O_R_COUPON_APPLIED_LABEL,
        paymentMethodLabel: O_R_PAYMENT_METHOD_LABEL,
        transactionIdLabel: O_R_TRANSACTION_ID_LABEL,
        pdfLinkLabel: O_R_PDF_LINK_LABEL,
        viewPdfLinkText: O_R_VIEW_PDF_LINK_TEXT,
        proofMethodLabel: O_R_PROOF_METHOD_LABEL,
        screenshotUploadedText: O_R_SCREENSHOT_UPLOADED_TEXT,
        paymentVerifiedText: O_R_PAYMENT_VERIFIED_TEXT,
        paymentSubmittedText: O_R_PAYMENT_SUBMITTED_TEXT,
        reasonLabel: O_R_REASON_LABEL,
        confirmationMessage: O_R_CONFIRMATION_MESSAGE,
        backToDashboardButton: O_R_BACK_TO_DASHBOARD_BUTTON,
        printReceiptButton: O_R_PRINT_RECEIPT_BUTTON,
    };

    if (lang === 'en') {
        for (const key in keysToTranslate) {
            newT[key] = keysToTranslate[key];
        }
    } else {
        for (const key in keysToTranslate) {
            newT[key] = await getTranslatedText(keysToTranslate[key], lang, 'en');
        }
    }
    setT(newT);
  }, []);

  useEffect(() => {
    translateReceiptContent(currentLanguage);
  }, [currentLanguage, translateReceiptContent]);


  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const paymentMethodLabel = HAFSA_PAYMENT_METHODS.find(pm => pm.value === data.paymentProof.paymentType)?.label || data.paymentProof.paymentType;
  const primaryRegistrant = data.parentInfo;
  const enrolledParticipants = data.participants || [];

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
          <CardTitle className="text-2xl sm:text-3xl font-headline text-primary">{t['registrationConfirmedTitle'] || O_R_REGISTRATION_CONFIRMED_TITLE}</CardTitle>
          <CardDescription className="text-base sm:text-lg mt-1">{t['thankYouDesc'] || O_R_THANK_YOU_DESC}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6 text-sm sm:text-base">

        <div className="flex items-center mb-2">
            <CalendarDays className="h-5 w-5 mr-2 text-primary" />
            <h3 className="text-lg sm:text-xl font-semibold font-headline text-primary">{t['registrationSummaryTitle'] || O_R_REGISTRATION_SUMMARY_TITLE}</h3>
        </div>
        <div className="pl-7">
            <p><strong>{t['registrationDateLabel'] || O_R_REGISTRATION_DATE_LABEL}</strong> {format(new Date(data.registrationDate), "MMMM d, yyyy HH:mm")}</p>
            {data.firebaseUserId && <p><strong>{t['userIdLabel'] || O_R_USER_ID_LABEL}</strong> <span className="text-xs">{data.firebaseUserId}</span></p>}
        </div>

        <Separator />
        <div>
            <div className="flex items-center mb-2">
                <User className="h-5 w-5 mr-2 text-primary" />
                <h3 className="text-lg sm:text-xl font-semibold font-headline text-primary">{t['primaryAccountHolderTitle'] || O_R_PRIMARY_ACCOUNT_HOLDER_TITLE}</h3>
            </div>
            <div className="pl-7 space-y-0.5">
                <p><strong>{t['nameLabel'] || O_R_NAME_LABEL}</strong> {primaryRegistrant.parentFullName}</p>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{primaryRegistrant.parentEmail}</span>
                </div>
                {primaryRegistrant.parentPhone1 && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{primaryRegistrant.parentPhone1}</span>
                  </div>
                )}
            </div>
        </div>

        {enrolledParticipants.length > 0 && (
        <>
            <Separator />
            <div>
                <div className="flex items-center mb-2">
                    <Users className="h-5 w-5 mr-2 text-primary" />
                    <h3 className="text-lg sm:text-xl font-semibold font-headline text-primary">{t['enrolledParticipantsTitle'] || O_R_ENROLLED_PARTICIPANTS_TITLE}</h3>
                </div>
                {enrolledParticipants.map((enrolledItem, index) => {
                    const program = allPrograms.find(p => p.id === enrolledItem.programId);
                    const participant = enrolledItem.participantInfo;
                    return (
                        <div key={index} className="mb-3 sm:mb-4 pl-7 border-l-2 border-muted ml-2 pl-4 py-2 relative">
                            <span className="absolute -left-[10px] top-1.5 bg-background p-0.5 rounded-full border border-muted">
                                <User className="h-3 w-3 text-primary" />
                            </span>
                            <h4 className="text-md sm:text-lg font-semibold mb-1">{(t['participantPrefix'] || O_R_PARTICIPANT_PREFIX)} {index + 1}: {participant.firstName}</h4>
                            <div className="space-y-0.5 text-xs sm:text-sm">
                                <p><strong>{t['programLabel'] || O_R_PROGRAM_LABEL}</strong> {program?.label || (t['naText'] || O_R_NA_TEXT)}</p>
                                <p><strong>{t['priceLabel'] || O_R_PRICE_LABEL}</strong> Br{program?.price.toFixed(2) || '0.00'}</p>
                                <p><strong>{t['genderLabel'] || O_R_GENDER_LABEL}</strong> {participant.gender.charAt(0).toUpperCase() + participant.gender.slice(1)}</p>
                                <p><strong>{t['dobLabel'] || O_R_DOB_LABEL}</strong> {format(new Date(participant.dateOfBirth), "MMMM d, yyyy")}</p>
                                {participant.schoolGrade && <p><strong>{t['schoolGradeLabel'] || O_R_SCHOOL_GRADE_LABEL}</strong> {participant.schoolGrade}</p>}
                                {participant.quranLevel && <p><strong>{t['quranLevelLabel'] || O_R_QURAN_LEVEL_LABEL}</strong> {participant.quranLevel}</p>}
                                {participant.specialAttention && <p><strong>{t['specialAttentionLabel'] || O_R_SPECIAL_ATTENTION_LABEL}</strong> {participant.specialAttention}</p>}

                                <div className="mt-2 pt-2 border-t border-dashed">
                                    <p className="text-xs font-medium text-muted-foreground flex items-center"><ShieldQuestion className="mr-1.5 h-3.5 w-3.5"/>{(t['guardianContactForPrefix'] || O_R_GUARDIAN_CONTACT_FOR_PREFIX)}{participant.firstName}:</p>
                                    <p><strong>{t['guardianNameLabel'] || O_R_GUARDIAN_NAME_LABEL}</strong> {participant.guardianFullName}</p>
                                    <p><strong>{t['guardianPrimaryPhoneLabel'] || O_R_GUARDIAN_PRIMARY_PHONE_LABEL}</strong> {participant.guardianPhone1}</p>
                                    {participant.guardianPhone2 && <p><strong>{t['guardianSecondaryPhoneLabel'] || O_R_GUARDIAN_SECONDARY_PHONE_LABEL}</strong> {participant.guardianPhone2}</p>}
                                    <p><strong>{t['guardianTelegramPhoneLabel'] || O_R_GUARDIAN_TELEGRAM_PHONE_LABEL}</strong> {participant.guardianTelegramPhoneNumber}</p>
                                </div>
                            </div>
                            {index < enrolledParticipants.length -1 && <Separator className="my-2 sm:my-3"/>}
                        </div>
                    );
                })}
            </div>
        </>
        )}

        <Separator />

        <div>
          <h3 className="text-md sm:text-lg font-semibold font-headline mb-1">{t['paymentDetailsTitle'] || O_R_PAYMENT_DETAILS_TITLE}</h3>
          <div className="space-y-0.5">
            <p><strong>{t['totalAmountPaidLabel'] || O_R_TOTAL_AMOUNT_PAID_LABEL}</strong> <span className="font-bold text-accent">Br{data.calculatedPrice.toFixed(2)}</span></p>
            {data.couponCode && <p><strong>{t['couponAppliedLabel'] || O_R_COUPON_APPLIED_LABEL}</strong> <span className="text-accent">{data.couponCode}</span></p>}
            <p><strong>{t['paymentMethodLabel'] || O_R_PAYMENT_METHOD_LABEL}</strong> {paymentMethodLabel}</p>
            {data.paymentProof.proofSubmissionType === 'transactionId' && data.paymentProof.transactionId && (
               <p><strong>{t['transactionIdLabel'] || O_R_TRANSACTION_ID_LABEL}</strong> {data.paymentProof.transactionId}</p>
            )}
            {data.paymentProof.proofSubmissionType === 'pdfLink' && data.paymentProof.pdfLink && (
               <p><strong>{t['pdfLinkLabel'] || O_R_PDF_LINK_LABEL}</strong> <a href={data.paymentProof.pdfLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{t['viewPdfLinkText'] || O_R_VIEW_PDF_LINK_TEXT}</a></p>
            )}
             {data.paymentProof.proofSubmissionType === 'screenshot' && (
               <p><strong>{t['proofMethodLabel'] || O_R_PROOF_METHOD_LABEL}</strong> {t['screenshotUploadedText'] || O_R_SCREENSHOT_UPLOADED_TEXT}</p>
            )}
          </div>
          <div className="flex items-center mt-2 text-accent">
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            <span>{data.paymentVerified ? (t['paymentVerifiedText'] || O_R_PAYMENT_VERIFIED_TEXT) : (t['paymentSubmittedText'] || O_R_PAYMENT_SUBMITTED_TEXT)}</span>
          </div>
          {data.paymentVerificationDetails && !data.paymentVerified && data.paymentVerificationDetails.reason && (
            <p className="text-xs text-destructive mt-1"><strong>{t['reasonLabel'] || O_R_REASON_LABEL}</strong> {data.paymentVerificationDetails.reason}</p>
          )}
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
            {t['confirmationMessage'] || O_R_CONFIRMATION_MESSAGE}
          </p>
        </div>

      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between items-center p-3 sm:p-4 print:hidden space-y-2 sm:space-y-0 sm:space-x-2">
        <Button onClick={onBack} variant="outline" className="w-full sm:w-auto">
          <ArrowLeft className="mr-2 h-4 w-4" /> {t['backToDashboardButton'] || O_R_BACK_TO_DASHBOARD_BUTTON}
        </Button>
        <Button onClick={handlePrint} variant="default" className="w-full sm:w-auto">
          <Printer className="mr-2 h-4 w-4" /> {t['printReceiptButton'] || O_R_PRINT_RECEIPT_BUTTON}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default Receipt;
