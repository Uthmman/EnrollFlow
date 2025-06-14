
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import type { RegistrationData } from '@/types';
import { format } from 'date-fns';
import { Loader2, Users, Edit3, Settings, AlertTriangle, ShieldCheck, ShieldAlert, Banknote } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getTranslationsForLanguage } as getTranslations // Alias to avoid conflict
import type { LanguageCode } from '@/locales';

interface RegistrationRow extends RegistrationData {
  id: string;
}

const AdminPage = () => {
  const { isAdmin, isAdminLoading } = useAdminAuth();
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [isLoadingRegistrations, setIsLoadingRegistrations] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // For simplicity, hardcoding language for admin panel text. Could be made dynamic.
  const [currentLanguage] = useState<LanguageCode>('en'); 
  const [t, setT] = useState<Record<string, string>>({});

  const loadTranslations = useCallback(() => {
    setT(getTranslations(currentLanguage));
  }, [currentLanguage]);

  useEffect(() => {
    loadTranslations();
  }, [loadTranslations]);


  useEffect(() => {
    if (isAdmin) {
      const fetchRegistrations = async () => {
        setIsLoadingRegistrations(true);
        setError(null);
        if (!db) {
          setError(t['apDbNotInitError'] || "Database not initialized. Cannot fetch registrations.");
          setIsLoadingRegistrations(false);
          return;
        }
        try {
          const registrationsCol = collection(db, 'registrations');
          const q = query(registrationsCol, orderBy('registrationDate', 'desc'));
          const snapshot = await getDocs(q);
          const fetchedRegistrations = snapshot.docs.map(doc => {
            const data = doc.data() as RegistrationData;
            // Ensure registrationDate is a Date object if it's a Firestore Timestamp
            let regDate = data.registrationDate;
            if (regDate && typeof (regDate as any).toDate === 'function') {
              regDate = (regDate as any).toDate();
            } else if (typeof regDate === 'string') {
              regDate = new Date(regDate);
            }

            return { 
              id: doc.id, 
              ...data,
              registrationDate: regDate instanceof Date && !isNaN(regDate.valueOf()) ? regDate : new Date() // Fallback if invalid
            } as RegistrationRow;
          });
          setRegistrations(fetchedRegistrations);
        } catch (err: any) {
          console.error("Error fetching registrations:", err);
          setError(t['apFetchRegError'] || `Failed to fetch registrations: ${err.message}`);
        } finally {
          setIsLoadingRegistrations(false);
        }
      };
      fetchRegistrations();
    }
  }, [isAdmin, t]);

  if (isAdminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    // The useAdminAuth hook handles redirection, but this is a fallback.
    return null; 
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-primary">{t['apAdminPanelTitle'] || "Admin Panel"}</h1>
        <p className="text-muted-foreground">{t['apAdminPanelSubtitle'] || "Manage registrations, programs, and settings."}</p>
      </header>

      <Tabs defaultValue="students" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-6">
          <TabsTrigger value="students"><Users className="mr-2 h-4 w-4" />{t['apStudentsTab'] || "Registered Students"}</TabsTrigger>
          <TabsTrigger value="programs"><Edit3 className="mr-2 h-4 w-4" />{t['apProgramsTab'] || "Manage Programs"}</TabsTrigger>
          <TabsTrigger value="settings"><Banknote className="mr-2 h-4 w-4" />{t['apBankDetailsTab'] || "Bank Details & Settings"}</TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>{t['apStudentsListTitle'] || "All Registered Students"}</CardTitle>
              <CardDescription>{t['apStudentsListDesc'] || "View and manage all student registrations."}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRegistrations && <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
              {error && <p className="text-destructive p-4 text-center">{error}</p>}
              {!isLoadingRegistrations && !error && registrations.length === 0 && (
                <p className="text-muted-foreground p-4 text-center">{t['apNoRegistrationsFound'] || "No registrations found."}</p>
              )}
              {!isLoadingRegistrations && !error && registrations.length > 0 && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t['apParentNameHeader'] || "Parent Name"}</TableHead>
                        <TableHead>{t['apParentEmailHeader'] || "Parent Email"}</TableHead>
                        <TableHead>{t['apParentPhoneHeader'] || "Parent Phone"}</TableHead>
                        <TableHead className="text-center">{t['apParticipantsCountHeader'] || "Participants"}</TableHead>
                        <TableHead>{t['apRegDateHeader'] || "Reg. Date"}</TableHead>
                        <TableHead>{t['apPaymentStatusHeader'] || "Payment Status"}</TableHead>
                        <TableHead>{t['apActionsHeader'] || "Actions"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {registrations.map((reg) => (
                        <TableRow key={reg.id}>
                          <TableCell>{reg.parentInfo.parentFullName}</TableCell>
                          <TableCell>{reg.parentInfo.parentEmail}</TableCell>
                          <TableCell>{reg.parentInfo.parentPhone1 || 'N/A'}</TableCell>
                          <TableCell className="text-center">{reg.participants?.length || 0}</TableCell>
                          <TableCell>
                            {reg.registrationDate instanceof Date && !isNaN(reg.registrationDate.valueOf())
                              ? format(reg.registrationDate, "MMM d, yyyy HH:mm")
                              : t['apInvalidDateText'] || "Invalid Date"}
                          </TableCell>
                          <TableCell>
                            {reg.paymentVerified ? (
                              <Badge variant="default" className="bg-accent text-accent-foreground hover:bg-accent/90">
                                <ShieldCheck className="mr-1 h-3.5 w-3.5" /> {t['apVerifiedBadge'] || "Verified"}
                              </Badge>
                            ) : (
                               <Badge variant="destructive">
                                <ShieldAlert className="mr-1 h-3.5 w-3.5" /> 
                                {reg.paymentVerificationDetails?.message && (reg.paymentVerificationDetails.message as string).toLowerCase().includes("human review") 
                                  ? (t['apPendingReviewBadge'] || "Pending Review") 
                                  : (t['apNotVerifiedBadge'] || "Not Verified")}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => alert(t['apViewDetailsForPrefix'] + reg.id + t['apViewDetailsSuffix'])}>
                              {t['apViewDetailsButton'] || "View Details"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="programs">
          <Card>
            <CardHeader>
              <CardTitle>{t['apManageProgramsTitle'] || "Manage Programs"}</CardTitle>
              <CardDescription>
                {t['apManageProgramsDesc'] || "Create, edit, or delete academic programs. (This feature is under development)."}
                <br />
                <strong>{t['apImportantNoteLabel'] || "Important Note:"}</strong> {t['apProgramsStaticNote'] || "Currently, programs are defined statically in the code. To make them editable here, they need to be migrated to the Firestore database."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center min-h-[200px]">
              <Edit3 className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t['apFeatureComingSoon'] || "Program management features coming soon."}</p>
              <Button className="mt-4" disabled>{t['apAddProgramButtonDisabled'] || "Add New Program"}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>{t['apBankDetailsSettingsTitle'] || "Bank Details & Settings"}</CardTitle>
              <CardDescription>
                {t['apBankDetailsSettingsDesc'] || "Update bank account details for payments and other application settings. (This feature is under development)."}
                <br />
                <strong>{t['apImportantNoteLabel'] || "Important Note:"}</strong> {t['apBankDetailsStaticNote'] || "Currently, bank details are defined statically in the code. To make them editable here, they need to be migrated to the Firestore database."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center min-h-[200px]">
              <Banknote className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t['apFeatureComingSoon'] || "Bank details management features coming soon."}</p>
              <Button className="mt-4" disabled>{t['apUpdateBankDetailsButtonDisabled'] || "Update Bank Details"}</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
