
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs, query, orderBy, doc, deleteDoc, setDoc } from 'firebase/firestore';
import type { RegistrationData, HafsaProgram, HafsaPaymentMethod } from '@/types';
import { fetchProgramsFromFirestore } from '@/lib/programService';
import { fetchPaymentMethodsFromFirestore } from '@/lib/paymentMethodService';
import { format } from 'date-fns';
import { Loader2, Users, Edit3, Banknote, ShieldCheck, ShieldAlert, Edit, Trash2, PlusCircle, BookOpen, Building } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AddProgramForm, type ProgramFormData } from '@/components/admin/add-program-form';
import { useToast } from "@/hooks/use-toast";
import { getTranslationsForLanguage as getTranslations, getTranslatedText } from '@/lib/translationService';
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
  const { toast } = useToast();

  const [showAddProgramDialog, setShowAddProgramDialog] = useState(false);
  const [editingProgram, setEditingProgram] = useState<HafsaProgram | null>(null);

  const [currentLanguage] = useState<LanguageCode>('en'); // Admin page default to English for now
  const [t, setT] = useState<Record<string, string>>({});

  const loadTranslations = useCallback(() => {
    setT(getTranslations(currentLanguage));
  }, [currentLanguage]);

  useEffect(() => {
    loadTranslations();
  }, [loadTranslations]);

  const fetchAllData = useCallback(async () => {
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
      console.error("[AdminPage] Error fetching registrations:", err.message, err.stack ? err.stack : '', err);
      setError(prev => prev ? `${prev}\n${t['apFetchRegError'] || 'Failed to fetch registrations:'} ${err.message}` : `${t['apFetchRegError'] || 'Failed to fetch registrations:'} ${err.message}`);
    } finally {
      setIsLoadingRegistrations(false);
    }

    try {
      const fetchedPrograms = await fetchProgramsFromFirestore();
      setPrograms(fetchedPrograms);
    } catch (err: any) {
      console.error("[AdminPage] Error fetching programs:", err.message, err.stack ? err.stack : '', err);
      setError(prev => prev ? `${prev}\n${t['apFetchProgramsError'] || 'Failed to fetch programs:'} ${err.message}` : `${t['apFetchProgramsError'] || 'Failed to fetch programs:'} ${err.message}`);
    } finally {
      setIsLoadingPrograms(false);
    }

    try {
      const fetchedPaymentMethods = await fetchPaymentMethodsFromFirestore();
      setPaymentMethods(fetchedPaymentMethods);
    } catch (err: any) {
      console.error("[AdminPage] Error fetching payment methods:", err.message, err.stack ? err.stack : '', err);
      setError(prev => prev ? `${prev}\n${t['apFetchPaymentMethodsError'] || 'Failed to fetch payment methods:'} ${err.message}` : `${t['apFetchPaymentMethodsError'] || 'Failed to fetch payment methods:'} ${err.message}`);
    } finally {
      setIsLoadingPaymentMethods(false);
    }
  }, [t]);

  useEffect(() => {
    if (isAdmin) {
      fetchAllData();
    }
  }, [isAdmin, fetchAllData]);

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

  const handleAddProgram = () => {
    setEditingProgram(null);
    setShowAddProgramDialog(true);
  };

  const handleEditProgram = (program: HafsaProgram) => {
    setEditingProgram(program);
    setShowAddProgramDialog(true);
  };

  const handleDeleteProgram = async (programId: string, programName?: string) => {
    let message = `${t['apConfirmDeleteMessage'] || 'Are you sure you want to delete this'} ${t['apProgramSingular'] || 'program'}`;
    if (programName) {
        message += ` "${programName}"?`;
    } else {
        message += ` with ID ${programId}?`;
    }
    
    if (window.confirm(message)) {
      try {
        if (!db) throw new Error("Firestore not initialized");
        await deleteDoc(doc(db, "programs", programId));
        toast({ title: t['apProgramDeletedTitle'] || "Program Deleted", description: `${t['apProgramPrefix'] || "Program"} "${programName || programId}" ${t['apDeletedSuccess'] || "deleted successfully."}` });
        await fetchAllData(); // Refresh list
      } catch (error: any) {
        console.error("Error deleting program:", error);
        toast({ title: t['apDeleteErrorTitle'] || "Deletion Error", description: error.message, variant: "destructive" });
      }
    }
  };
  
  const handleSaveProgram = async (data: ProgramFormData) => {
    try {
      if (!db) throw new Error("Firestore not initialized");
      const programToSave: HafsaProgram = {
        id: data.id,
        price: data.price,
        category: data.category,
        ageRange: data.ageRange,
        duration: data.duration,
        schedule: data.schedule,
        isChildProgram: data.isChildProgram,
        translations: {
          en: {
            label: data.enLabel,
            description: data.enDescription,
            termsAndConditions: data.enTerms,
          },
          am: {
            label: data.amLabel || '',
            description: data.amDescription || '',
            termsAndConditions: data.amTerms || '',
          },
          ar: {
            label: data.arLabel || '',
            description: data.arDescription || '',
            termsAndConditions: data.arTerms || '',
          },
        },
        // specificFields will be managed separately for now or via direct JSON/Firestore editing
      };

      await setDoc(doc(db, "programs", data.id), programToSave);
      toast({ 
        title: editingProgram ? (t['apProgramUpdatedTitle'] || "Program Updated") : (t['apProgramAddedTitle'] || "Program Added"), 
        description: `${t['apProgramPrefix'] || "Program"} "${data.enLabel}" ${editingProgram ? (t['apUpdatedSuccess'] || "updated") : (t['apAddedSuccess'] || "added")} ${t['apSuccessfully'] || "successfully."}` 
      });
      setShowAddProgramDialog(false);
      setEditingProgram(null);
      await fetchAllData(); // Refresh the list
    } catch (error: any) {
      console.error("Error saving program:", error);
      toast({ title: t['apSaveErrorTitle'] || "Save Error", description: error.message, variant: "destructive" });
    }
  };


  const handleEditRegistration = (registrationId: string) => {
    alert(`${t['apEditButton'] || 'Edit'} ${t['apRegistrationSingular'] || 'registration'} with ID: ${registrationId}. ${t['apFeatureComingSoon'] || 'Feature coming soon.'}`);
  };

  const handleDeleteRegistration = (registrationId: string, parentName?: string) => {
    let message = `${t['apConfirmDeleteMessage'] || 'Are you sure you want to delete this'} ${t['apRegistrationSingular'] || 'registration'}`;
    if (parentName) {
        message += ` for "${parentName}"?`;
    } else {
        message += ` with ID ${registrationId}?`;
    }
    message += ` (${t['apThisIsPlaceholder'] || 'This is a placeholder action for now.'})`;
    if (window.confirm(message)) {
      // Placeholder: Implement actual deletion logic here
      console.log(`Would delete registration: ${registrationId}`);
      toast({ title: t['apActionPlaceholderTitle'] || "Action Placeholder", description: `${t['apDeleteButton'] || 'Delete'} ${t['apRegistrationSingular'] || 'registration'} for ID: ${registrationId} - ${t['apActionNotImplemented'] || 'Functionality not fully implemented yet.'}` });
    }
  };


  const handleAddBankDetail = () => {
    alert(`${t['apAddButton'] || 'Add New'} ${t['apBankDetailSingular'] || 'Bank Account'}. ${t['apFeatureComingSoon'] || 'Feature coming soon.'}`);
  };

  const handleEditBankDetail = (bankDetailId: string) => {
    alert(`${t['apEditButton'] || 'Edit'} ${t['apBankDetailSingular'] || 'Bank Account'} with ID: ${bankDetailId}. ${t['apFeatureComingSoon'] || 'Feature coming soon.'}`);
  };

  const handleDeleteBankDetail = (bankDetailId: string, bankName?: string) => {
     let message = `${t['apConfirmDeleteMessage'] || 'Are you sure you want to delete this'} ${t['apBankDetailSingular'] || 'Bank Account'}`;
    if (bankName) {
        message += ` "${bankName}"?`;
    } else {
        message += ` with ID ${bankDetailId}?`;
    }
    message += ` (${t['apThisIsPlaceholder'] || 'This is a placeholder action for now.'})`;
    if (window.confirm(message)) {
      // Placeholder: Implement actual deletion logic here
      console.log(`Would delete bank detail: ${bankDetailId}`);
      toast({ title: t['apActionPlaceholderTitle'] || "Action Placeholder", description: `${t['apDeleteButton'] || 'Delete'} ${t['apBankDetailSingular'] || 'Bank Account'} ID: ${bankDetailId} - ${t['apActionNotImplemented'] || 'Functionality not fully implemented yet.'}` });
    }
  };


  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-primary">{t['apAdminPanelTitle'] || "Admin Panel"}</h1>
        <p className="text-muted-foreground">{t['apAdminPanelSubtitle'] || "Manage enrollments, programs, and payment settings."}</p>
      </header>

      <Tabs defaultValue="students" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-6">
          <TabsTrigger value="students"><Users className="mr-2 h-4 w-4" />{t['apStudentsTab'] || "Students"}</TabsTrigger>
          <TabsTrigger value="programs"><BookOpen className="mr-2 h-4 w-4" />{t['apProgramsTab'] || "Programs"}</TabsTrigger>
          <TabsTrigger value="bank_accounts"><Building className="mr-2 h-4 w-4" />{t['apBankAccountsTab'] || "Bank Accounts"}</TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>{t['apStudentsListTitle'] || "Student Enrollments"}</CardTitle>
              <CardDescription>{t['apStudentsListDesc'] || "View and manage all student enrollments and their payment status."}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRegistrations && <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
              {error && !isLoadingRegistrations && <p className="text-destructive p-4 text-center">{error.includes('registrations') ? error : (t['apFetchRegError'] || 'Failed to fetch registrations')}</p>}
              {!isLoadingRegistrations && !error && registrations.length === 0 && (
                <p className="text-muted-foreground p-4 text-center">{t['apNoRegistrationsFound'] || "No student enrollments found."}</p>
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
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleEditRegistration(reg.id)}>
                              <Edit className="h-3.5 w-3.5" />
                              <span className="sr-only">{t['apEditButton'] || 'Edit'}</span>
                            </Button>
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleDeleteRegistration(reg.id, reg.parentInfo.parentFullName)}>
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
                <CardDescription>{t['apManageProgramsDescAdmin'] || "Add, edit, or delete academic programs offered."}</CardDescription>
              </div>
              <Button onClick={handleAddProgram}>
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
                  {programs.map((program) => {
                    const translatedProgram = program.translations[currentLanguage] || program.translations.en;
                    return (
                        <Card key={program.id}>
                        <CardHeader>
                            <CardTitle className="text-lg">{translatedProgram.label}</CardTitle>
                            <CardDescription>Br{program.price.toFixed(2)} - {program.category}</CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm">
                            <p className="truncate">{translatedProgram.description}</p>
                        </CardContent>
                        <CardFooter className="flex justify-end space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditProgram(program)}>
                            <Edit className="mr-1 h-4 w-4" /> {t['apEditButton'] || "Edit"}
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteProgram(program.id, translatedProgram.label)}>
                            <Trash2 className="mr-1 h-4 w-4" /> {t['apDeleteButton'] || "Delete"}
                            </Button>
                        </CardFooter>
                        </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bank_accounts">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle>{t['apBankAccountsSettingsTitle'] || "Manage Bank Accounts"}</CardTitle>
                <CardDescription>{t['apBankAccountsSettingsDescAdmin'] || "Add, edit, or delete bank account details used for payments."}</CardDescription>
              </div>
              <Button onClick={handleAddBankDetail}>
                <PlusCircle className="mr-2 h-4 w-4" /> {t['apAddBankDetailButton'] || "Add Bank Account"}
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingPaymentMethods && <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
              {error && !isLoadingPaymentMethods && <p className="text-destructive p-4 text-center">{error.includes('payment methods') ? error : (t['apFetchPaymentMethodsError'] || 'Failed to fetch payment methods')}</p>}
              {!isLoadingPaymentMethods && !error && paymentMethods.length === 0 && (
                <p className="text-muted-foreground p-4 text-center">{t['apNoBankDetailsAdmin'] || "No bank accounts found. Add one to get started."}</p>
              )}
              {!isLoadingPaymentMethods && paymentMethods.length > 0 && (
                <div className="space-y-4">
                  {paymentMethods.map((method) => {
                     const translatedMethod = method.translations[currentLanguage] || method.translations.en;
                     return (
                        <Card key={method.value}>
                        <CardHeader>
                            <CardTitle className="text-lg">{translatedMethod.label}</CardTitle>
                            {method.accountNumber && <CardDescription>{t['apAccountNumberHeader'] || "Account Number"}: {method.accountNumber}</CardDescription>}
                        </CardHeader>
                        <CardContent className="text-sm">
                            {translatedMethod.accountName && <p>{t['apAccountNameHeader'] || "Account Name"}: {translatedMethod.accountName}</p>}
                            {translatedMethod.additionalInstructions && <p className="mt-1 text-xs italic">{translatedMethod.additionalInstructions}</p>}
                        </CardContent>
                        <CardFooter className="flex justify-end space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditBankDetail(method.value)}>
                            <Edit className="mr-1 h-4 w-4" /> {t['apEditButton'] || "Edit"}
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteBankDetail(method.value, translatedMethod.label)}>
                            <Trash2 className="mr-1 h-4 w-4" /> {t['apDeleteButton'] || "Delete"}
                            </Button>
                        </CardFooter>
                        </Card>
                     );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showAddProgramDialog} onOpenChange={(isOpen) => {
        setShowAddProgramDialog(isOpen);
        if (!isOpen) setEditingProgram(null);
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProgram ? (t['apEditProgramTitle'] || "Edit Program") : (t['apAddProgramDialogTitle'] || "Add New Program")}</DialogTitle>
            <DialogDescription>
              {editingProgram ? (t['apEditProgramDialogDesc'] || "Modify the details of the existing program.") : (t['apAddProgramDialogDesc'] || "Fill in the details for the new program.")}
            </DialogDescription>
          </DialogHeader>
          <AddProgramForm
            onSubmit={handleSaveProgram}
            initialData={editingProgram}
            onCancel={() => {
              setShowAddProgramDialog(false);
              setEditingProgram(null);
            }}
            currentLanguage={currentLanguage}
          />
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default AdminPage;

    