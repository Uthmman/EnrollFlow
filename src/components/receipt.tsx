
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Printer, User, Users, ShieldQuestion, CalendarDays, ArrowLeft, Mail, Phone, FileText as FileIcon } from 'lucide-react'; // Renamed FileText to FileIcon
import { Button } from '@/components/ui/button';
import type { RegistrationData, HafsaProgram, HafsaPaymentMethod } from '@/types';
import { format } from 'date-fns';
import { getTranslationsForLanguage, getTranslatedText } from '@/lib/translationService';
import type { LanguageCode } from '@/locales';

interface ReceiptProps {
  data: RegistrationData;
  onBack: () => void;
  allPrograms: HafsaProgram[]; // Fetched programs passed as prop
  paymentMethods: HafsaPaymentMethod[]; // Fetched payment methods passed as prop
  currentLanguage: LanguageCode;
}


const Receipt: React.FC<ReceiptProps> = ({ data, onBack, allPrograms, paymentMethods, currentLanguage }) => {
  const [t, setT] = useState<Record<string, string>>({});

  const loadTranslations = useCallback((lang: LanguageCode) => {
    setT(getTranslationsForLanguage(lang));
  }, []);

  useEffect(() => {
    loadTranslations(currentLanguage);
  }, [currentLanguage, loadTranslations]);


  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const paymentMethodObject = paymentMethods.find(pm => pm.value === data.paymentProof.paymentType);
  const paymentMethodTranslated = paymentMethodObject?.translations[currentLanguage] || paymentMethodObject?.translations.en;
  const paymentMethodLabel = paymentMethodTranslated?.label || data.paymentProof.paymentType;

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
          <CardTitle className="text-2xl sm:text-3xl font-headline text-primary">{t.rRegistrationConfirmedTitle}</CardTitle>
          <CardDescription className="text-base sm:text-lg mt-1">{t.rThankYouDesc}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6 text-sm sm:text-base">

        <div className="flex items-center mb-2">
            <CalendarDays className="h-5 w-5 mr-2 text-primary" />
            <h3 className="text-lg sm:text-xl font-semibold font-headline text-primary">{t.rRegistrationSummaryTitle}</h3>
        </div>
        <div className="pl-7">
            <p><strong>{t.rRegistrationDateLabel}</strong> {format(new Date(data.registrationDate), "MMMM d, yyyy HH:mm")}</p>
            {data.firebaseUserId && <p><strong>{t.rUserIdLabel}</strong> <span className="text-xs">{data.firebaseUserId}</span></p>}
        </div>

        <Separator />
        <div>
            <div className="flex items-center mb-2">
                <User className="h-5 w-5 mr-2 text-primary" />
                <h3 className="text-lg sm:text-xl font-semibold font-headline text-primary">{t.rPrimaryAccountHolderTitle}</h3>
            </div>
            <div className="pl-7 space-y-0.5">
                <p><strong>{t.rNameLabel}</strong> {primaryRegistrant.parentFullName}</p>
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
                    <h3 className="text-lg sm:text-xl font-semibold font-headline text-primary">{t.rEnrolledParticipantsTitle}</h3>
                </div>
                {enrolledParticipants.map((enrolledItem, index) => {
                    const programObject = allPrograms.find(p => p.id === enrolledItem.programId);
                    const programTranslated = programObject?.translations[currentLanguage] || programObject?.translations.en;
                    const participant = enrolledItem.participantInfo;
                    const programLabel = programTranslated?.label || (t.rNaText || "N/A");
                    return (
                        <div key={index} className="mb-3 sm:mb-4 pl-7 border-l-2 border-muted ml-2 pl-4 py-2 relative">
                            <span className="absolute -left-[10px] top-1.5 bg-background p-0.5 rounded-full border border-muted">
                                <User className="h-3 w-3 text-primary" />
                            </span>
                            <h4 className="text-md sm:text-lg font-semibold mb-1">{t.rParticipantPrefix} {index + 1}: {participant.firstName}</h4>
                            <div className="space-y-0.5 text-xs sm:text-sm">
                                <p><strong>{t.rProgramLabel}</strong> {programLabel}</p>
                                <p><strong>{t.rPriceLabel}</strong> Br{programObject?.price.toFixed(2) || '0.00'}</p>
                                <p><strong>{t.rGenderLabel}</strong> {getTranslatedText(participant.gender === "male" ? "pdfMaleOption" : "pdfFemaleOption", currentLanguage, {defaultValue: participant.gender.charAt(0).toUpperCase() + participant.gender.slice(1)})}</p>
                                <p><strong>{t.rDOBLabel}</strong> {format(new Date(participant.dateOfBirth), "MMMM d, yyyy")}</p>
                                {participant.schoolGrade && <p><strong>{getTranslatedText("programs.specificFields.schoolGrade", currentLanguage, {defaultValue: "School Grade"})}:</strong> {participant.schoolGrade}</p>}
                                {participant.quranLevel && <p><strong>{getTranslatedText("programs.specificFields.quranLevel", currentLanguage, {defaultValue: "Quran Level"})}:</strong> {participant.quranLevel}</p>}
                                {participant.specialAttention && <p><strong>{getTranslatedText("programs.specificFields.specialAttention", currentLanguage, {defaultValue: "Special Attention"})}:</strong> {participant.specialAttention}</p>}
                                {participant.certificateDataUri && (
                                    <p className="flex items-center">
                                        <FileIcon className="h-3.5 w-3.5 mr-1 text-muted-foreground"/>
                                        <strong>{t.rCertificateSubmittedLabel || "Certificate:"}</strong>&nbsp;{t.rSubmittedStatus || "Submitted"}
                                    </p>
                                )}

                                <div className="mt-2 pt-2 border-t border-dashed">
                                    <p className="text-xs font-medium text-muted-foreground flex items-center"><ShieldQuestion className="mr-1.5 h-3.5 w-3.5"/>{t.rGuardianContactForPrefix}{participant.firstName}:</p>
                                    <p><strong>{t.rGuardianNameLabel}</strong> {participant.guardianFullName}</p>
                                    <p><strong>{t.rGuardianPrimaryPhoneLabel}</strong> {participant.guardianPhone1}</p>
                                    {participant.guardianPhone2 && <p><strong>{t.rGuardianSecondaryPhoneLabel}</strong> {participant.guardianPhone2}</p>}
                                    <p><strong>{t.rGuardianTelegramPhoneLabel}</strong> {participant.guardianTelegramPhoneNumber}</p>
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
          <h3 className="text-md sm:text-lg font-semibold font-headline mb-1">{t.rPaymentDetailsTitle}</h3>
          <div className="space-y-0.5">
            <p><strong>{t.rTotalAmountPaidLabel}</strong> <span className="font-bold text-accent">Br{data.calculatedPrice.toFixed(2)}</span></p>
            {data.couponCode && <p><strong>{t.rCouponAppliedLabel}</strong> <span className="text-accent">{data.couponCode}</span></p>}
            <p><strong>{t.rPaymentMethodLabel}</strong> {paymentMethodLabel}</p>
            {data.paymentProof.proofSubmissionType === 'transactionId' && data.paymentProof.transactionId && (
               <p><strong>{t.rTransactionIdLabel}</strong> {data.paymentProof.transactionId}</p>
            )}
            {data.paymentProof.proofSubmissionType === 'pdfLink' && data.paymentProof.pdfLink && (
               <p><strong>{t.rPdfLinkLabel}</strong> <a href={data.paymentProof.pdfLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{t.rViewPdfLinkText}</a></p>
            )}
             {data.paymentProof.proofSubmissionType === 'screenshot' && (
               <p><strong>{t.rProofMethodLabel}</strong> {t.rScreenshotUploadedText}</p>
            )}
          </div>
          <div className="flex items-center mt-2 text-accent">
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            <span>{data.paymentVerified ? t.rPaymentVerifiedText : t.rPaymentSubmittedText}</span>
          </div>
          {data.paymentVerificationDetails && !data.paymentVerified && data.paymentVerificationDetails.reason && (
            <p className="text-xs text-destructive mt-1"><strong>{t.rReasonLabel}</strong> {data.paymentVerificationDetails.reason}</p>
          )}
           {data.paymentVerificationDetails && data.paymentVerificationDetails.message && data.paymentVerificationDetails.message !== data.paymentVerificationDetails.reason && (
            <p className="text-xs text-muted-foreground mt-1">{data.paymentVerificationDetails.message}</p>
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
            {t.rConfirmationMessage}
          </p>
        </div>

      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between items-center p-3 sm:p-4 print:hidden space-y-2 sm:space-y-0 sm:space-x-2">
        <Button onClick={onBack} variant="outline" className="w-full sm:w-auto">
          <ArrowLeft className="mr-2 h-4 w-4" /> {t.rBackToDashboardButton}
        </Button>
        <Button onClick={handlePrint} variant="default" className="w-full sm:w-auto">
          <Printer className="mr-2 h-4 w-4" /> {t.rPrintReceiptButton}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default Receipt;
