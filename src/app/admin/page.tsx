
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import type { RegistrationData, HafsaProgram, HafsaPaymentMethod } from '@/types';
import { fetchProgramsFromFirestore } from '@/lib/programService';
import { fetchPaymentMethodsFromFirestore } from '@/lib/paymentMethodService';
import { format } from 'date-fns';
import { Loader2, Users, Edit3, Settings, AlertTriangle, ShieldCheck, ShieldAlert, Banknote, Edit, Trash2, PlusCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getTranslationsForLanguage as getTranslations } from '@/lib/translationService';
import type { LanguageCode } from '@/locales';

interface RegistrationRow extends RegistrationData {
  id: string;
}

const AdminPage = () => {
  const { isAdmin, isAdminLoading } = useAdminAuth();
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [isLoadingRegistrations, setIsLoadingRegistrations] = useState(true);
  const [programs, setPrograms] = useState<HafsaProgram[]>([]);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<HafsaPaymentMethod[]>([]);
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const fetchAllData = async () => {
        setIsLoadingRegistrations(true);
        setIsLoadingPrograms(true);
        setIsLoadingPaymentMethods(true);
        setError(null);

        if (!db) {
          setError(t['apDbNotInitError'] || "Database not initialized.");
          setIsLoadingRegistrations(false);
          setIsLoadingPrograms(false);
          setIsLoadingPaymentMethods(false);
          return;
        }

        try {
          // Fetch Registrations
          const registrationsCol = collection(db, 'registrations');
          const regQuery = query(registrationsCol, orderBy('registrationDate', 'desc'));
          const regSnapshot = await getDocs(regQuery);
          const fetchedRegistrations = regSnapshot.docs.map(doc => {
            const data = doc.data() as RegistrationData;
            let regDate = data.registrationDate;
            if (regDate && typeof (regDate as any).toDate === 'function') {
              regDate = (regDate as any).toDate();
            } else if (typeof regDate === 'string') {
              regDate = new Date(regDate);
            }
            return {
              id: doc.id,
              ...data,
              registrationDate: regDate instanceof Date && !isNaN(regDate.valueOf()) ? regDate : new Date()
            } as RegistrationRow;
          });
          setRegistrations(fetchedRegistrations);
        } catch (err: any) {
          console.error("Error fetching registrations:", err);
          setError(prev => prev ? `${prev}\n${t['apFetchRegError'] || 'Failed to fetch registrations:'} ${err.message}` : `${t['apFetchRegError'] || 'Failed to fetch registrations:'} ${err.message}`);
        } finally {
          setIsLoadingRegistrations(false);
        }

        // Fetch Programs
        try {
          const fetchedPrograms = await fetchProgramsFromFirestore();
          setPrograms(fetchedPrograms);
        } catch (err: any) {
          console.error("Error fetching programs:", err);
          setError(prev => prev ? `${prev}\n${t['apFetchProgramsError'] || 'Failed to fetch programs:'} ${err.message}` : `${t['apFetchProgramsError'] || 'Failed to fetch programs:'} ${err.message}`);
        } finally {
          setIsLoadingPrograms(false);
        }

        // Fetch Payment Methods
        try {
          const fetchedPaymentMethods = await fetchPaymentMethodsFromFirestore();
          setPaymentMethods(fetchedPaymentMethods);
        } catch (err: any) {
          console.error("Error fetching payment methods:", err);
          setError(prev => prev ? `${prev}\n${t['apFetchPaymentMethodsError'] || 'Failed to fetch payment methods:'} ${err.message}` : `${t['apFetchPaymentMethodsError'] || 'Failed to fetch payment methods:'} ${err.message}`);
        } finally {
          setIsLoadingPaymentMethods(false);
        }
      };
      fetchAllData();
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
    return null;
  }

  const handleEdit = (type: string, id: string) => {
    alert(`${t['apEditButton'] || 'Edit'} ${type} with ID: ${id}. ${t['apFeatureComingSoon'] || 'Feature coming soon.'}`);
  };

  const handleDelete = (type: string, id: string, name?: string) => {
    let message = `${t['apConfirmDeleteMessage'] || 'Are you sure you want to delete this'} ${type}`;
    if (name) {
        message += ` "${name}"?`;
    } else {
        message += ` with ID ${id}?`;
    }
    message += ` (${t['apThisIsPlaceholder'] || 'This is a placeholder action.'})`;
    if (confirm(message)) {
      alert(`${t['apDeleteButton'] || 'Delete'} ${type} with ID: ${id} - ${t['apActionPlaceholder'] || 'Action not implemented yet.'}`);
    }
  };

  const handleAdd = (type: string) => {
    alert(`${t['apAddButton'] || 'Add New'} ${type}. ${t['apFeatureComingSoon'] || 'Feature coming soon.'}`);
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
              {error && !isLoadingRegistrations && <p className="text-destructive p-4 text-center">{error.includes('registrations') ? error : (t['apFetchRegError'] || 'Failed to fetch registrations')}</p>}
              {!isLoadingRegistrations && !error && registrations.length === 0 && (
                <p className="text-muted-foreground p-4 text-center">{t['apNoRegistrationsFound'] || "No registrations found."}</p>
              )}
              {!isLoadingRegistrations && registrations.length > 0 && (
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
                          <TableCell className="space-x-1">
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleEdit('registration', reg.id)}>
                              <Edit className="h-3.5 w-3.5" />
                              <span className="sr-only">{t['apEditButton'] || 'Edit'}</span>
                            </Button>
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleDelete('registration', reg.id, reg.parentInfo.parentFullName)}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              <span className="sr-only">{t['apDeleteButton'] || 'Delete'}</span>
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
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle>{t['apManageProgramsTitle'] || "Manage Programs"}</CardTitle>
                <CardDescription>{t['apManageProgramsDescAdmin'] || "View, add, edit, or delete academic programs."}</CardDescription>
              </div>
              <Button onClick={() => handleAdd('program')}>
                <PlusCircle className="mr-2 h-4 w-4" /> {t['apAddProgramButton'] || "Add Program"}
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingPrograms && <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
              {error && !isLoadingPrograms && <p className="text-destructive p-4 text-center">{error.includes('programs') ? error : (t['apFetchProgramsError'] || 'Failed to fetch programs')}</p>}
              {!isLoadingPrograms && !error && programs.length === 0 && (
                <p className="text-muted-foreground p-4 text-center">{t['apNoProgramsAdmin'] || "No programs found. Add one to get started."}</p>
              )}
              {!isLoadingPrograms && programs.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {programs.map((program) => (
                    <Card key={program.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{program.label}</CardTitle>
                        <CardDescription>Br{program.price.toFixed(2)} - {program.category}</CardDescription>
                      </CardHeader>
                      <CardContent className="text-sm">
                        <p className="truncate">{program.description}</p>
                      </CardContent>
                      <CardFooter className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit('program', program.id)}>
                          <Edit className="mr-1 h-4 w-4" /> {t['apEditButton'] || "Edit"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete('program', program.id, program.label)}>
                          <Trash2 className="mr-1 h-4 w-4 text-destructive" /> {t['apDeleteButton'] || "Delete"}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle>{t['apBankDetailsSettingsTitle'] || "Bank Details & Settings"}</CardTitle>
                <CardDescription>{t['apBankDetailsSettingsDescAdmin'] || "View, add, edit, or delete bank account details for payments."}</CardDescription>
              </div>
              <Button onClick={() => handleAdd('bankDetail')}>
                <PlusCircle className="mr-2 h-4 w-4" /> {t['apAddBankDetailButton'] || "Add Bank Detail"}
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingPaymentMethods && <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
              {error && !isLoadingPaymentMethods && <p className="text-destructive p-4 text-center">{error.includes('payment methods') ? error : (t['apFetchPaymentMethodsError'] || 'Failed to fetch payment methods')}</p>}
              {!isLoadingPaymentMethods && !error && paymentMethods.length === 0 && (
                <p className="text-muted-foreground p-4 text-center">{t['apNoBankDetailsAdmin'] || "No bank details found. Add one to get started."}</p>
              )}
              {!isLoadingPaymentMethods && paymentMethods.length > 0 && (
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <Card key={method.value}>
                      <CardHeader>
                        <CardTitle className="text-lg">{method.label}</CardTitle>
                        {method.accountNumber && <CardDescription>{t['apAccountNumberHeader'] || "Account Number"}: {method.accountNumber}</CardDescription>}
                      </CardHeader>
                      <CardContent className="text-sm">
                        {method.accountName && <p>{t['apAccountNameHeader'] || "Account Name"}: {method.accountName}</p>}
                        {method.additionalInstructions && <p className="mt-1 text-xs italic">{method.additionalInstructions}</p>}
                      </CardContent>
                      <CardFooter className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit('bankDetail', method.value)}>
                          <Edit className="mr-1 h-4 w-4" /> {t['apEditButton'] || "Edit"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete('bankDetail', method.value, method.label)}>
                          <Trash2 className="mr-1 h-4 w-4 text-destructive" /> {t['apDeleteButton'] || "Delete"}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;

    