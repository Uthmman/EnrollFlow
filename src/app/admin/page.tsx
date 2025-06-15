
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { db, auth } from '@/lib/firebaseConfig';
import { signOut } from 'firebase/auth';
import { collection, getDocs, query, orderBy, doc, deleteDoc, setDoc } from 'firebase/firestore';
import type { RegistrationData, HafsaProgram, HafsaPaymentMethod } from '@/types';
import { fetchProgramsFromFirestore } from '@/lib/programService';
import { fetchPaymentMethodsFromFirestore } from '@/lib/paymentMethodService';
import { format } from 'date-fns';
import { Loader2, Users, Edit3, Banknote, ShieldCheck, ShieldAlert, Edit, Trash2, PlusCircle, BookOpen, Building, UserCog, LogOut } from 'lucide-react';
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AddProgramForm, type ProgramFormData } from '@/components/admin/add-program-form';
import { AddBankForm, type BankDetailFormData } from '@/components/admin/add-bank-form';
import { useToast } from "@/hooks/use-toast";
import { getTranslationsForLanguage as getTranslations, getTranslatedText } from '@/lib/translationService';
import type { LanguageCode } from '@/locales';
import AppHeader from '@/components/app-header';
import { cn } from '@/lib/utils';

interface RegistrationRow extends RegistrationData {
  id: string;
}

const LS_LANGUAGE_KEY = 'hafsaAdminPreferredLanguage';

const adminDashboardTabsConfig = [
  { value: 'students', labelKey: 'apStudentsTab', icon: Users },
  { value: 'programs', labelKey: 'apProgramsTab', icon: BookOpen },
  { value: 'bank_accounts', labelKey: 'apBankAccountsTab', icon: Building },
];

const AdminPage = () => {
  const { isAdmin, isAdminLoading, user } = useAdminAuth();
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

  const [showAddBankDialog, setShowAddBankDialog] = useState(false);
  const [editingBankDetail, setEditingBankDetail] = useState<HafsaPaymentMethod | null>(null);

  const [showAdminAccountDialog, setShowAdminAccountDialog] = useState(false);

  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>('en');
  const [t, setT] = useState<Record<string, string>>({});
  const [activeAdminTab, setActiveAdminTab] = useState<string>('students');


  useEffect(() => {
    console.log(`[AdminPage] Auth state: isAdminLoading=${isAdminLoading}, isAdmin=${isAdmin}, user=${user?.email}`);
    if(user?.email) {
       console.log(`[AdminPage] NEXT_PUBLIC_ADMIN_EMAIL is: "${process.env.NEXT_PUBLIC_ADMIN_EMAIL}"`);
    }
  }, [isAdmin, isAdminLoading, user]);

  const loadTranslations = useCallback((lang: LanguageCode) => {
    setT(getTranslations(lang));
  }, []);

  useEffect(() => {
    const storedLang = localStorage.getItem(LS_LANGUAGE_KEY) as LanguageCode | null;
    if (storedLang) {
      setCurrentLanguage(storedLang);
      loadTranslations(storedLang);
    } else {
      loadTranslations(currentLanguage); 
    }
  }, [loadTranslations, currentLanguage]);

  const handleLanguageChange = (lang: LanguageCode) => {
    setCurrentLanguage(lang);
    localStorage.setItem(LS_LANGUAGE_KEY, lang);
    loadTranslations(lang);
  };

  const fetchAllData = useCallback(async () => {
    console.log("[AdminPage] fetchAllData called");
    setIsLoadingRegistrations(true);
    setIsLoadingPrograms(true);
    setIsLoadingPaymentMethods(true);
    setError(null);

    if (!db) {
      setError(getTranslatedText('apDbNotInitError', currentLanguage, {defaultValue: "Database not initialized."}));
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
      console.log("[AdminPage] Fetched registrations:", fetchedRegistrations.length);
    } catch (err: any) {
      console.error("[AdminPage] Error fetching registrations:", err.message, err.stack ? err.stack : '', err);
      const errorMsg = getTranslatedText('apFetchRegError', currentLanguage, {defaultValue: 'Failed to fetch registrations:'});
      setError(prev => prev ? `${prev}\n${errorMsg} ${err.message}` : `${errorMsg} ${err.message}`);
    } finally {
      setIsLoadingRegistrations(false);
    }

    try {
      const fetchedPrograms = await fetchProgramsFromFirestore();
      setPrograms(fetchedPrograms);
      console.log("[AdminPage] Fetched programs:", fetchedPrograms.length);
    } catch (err: any) {
      console.error("[AdminPage] Error fetching programs:", err.message, err.stack ? err.stack : '', err);
      const errorMsg = getTranslatedText('apFetchProgramsError', currentLanguage, {defaultValue: 'Failed to fetch programs:'});
      setError(prev => prev ? `${prev}\n${errorMsg} ${err.message}` : `${errorMsg} ${err.message}`);
    } finally {
      setIsLoadingPrograms(false);
    }

    try {
      const fetchedPaymentMethods = await fetchPaymentMethodsFromFirestore();
      setPaymentMethods(fetchedPaymentMethods);
      console.log("[AdminPage] Fetched payment methods:", fetchedPaymentMethods.length);
    } catch (err: any) {
      console.error("[AdminPage] Error fetching payment methods:", err.message, err.stack ? err.stack : '', err);
      const errorMsg = getTranslatedText('apFetchPaymentMethodsError', currentLanguage, {defaultValue: 'Failed to fetch payment methods:'});
      setError(prev => prev ? `${prev}\n${errorMsg} ${err.message}` : `${errorMsg} ${err.message}`);
    } finally {
      setIsLoadingPaymentMethods(false);
    }
  }, [currentLanguage]);

  useEffect(() => {
    if (isAdmin) {
      console.log("[AdminPage] isAdmin is true, calling fetchAllData");
      fetchAllData();
    } else {
      console.log("[AdminPage] isAdmin is false or user not loaded, not calling fetchAllData. isAdmin:", isAdmin, "isAdminLoading:", isAdminLoading);
    }
  }, [isAdmin, isAdminLoading, fetchAllData]);

  const handleAdminLogout = async () => {
    if (auth) {
        try {
            await signOut(auth);
            toast({ title: getTranslatedText('efLoggedOutToastTitle', currentLanguage), description: getTranslatedText('efLoggedOutSuccessToastDesc', currentLanguage) });
            setShowAdminAccountDialog(false);
        } catch (error) {
            toast({ title: getTranslatedText('efLogoutErrorToastTitle', currentLanguage), description: getTranslatedText('efLogoutFailedToastDesc', currentLanguage), variant: "destructive" });
        }
    }
  };

  const handleAddProgram = () => {
    setEditingProgram(null);
    setShowAddProgramDialog(true);
  };

  const handleEditProgram = (program: HafsaProgram) => {
    setEditingProgram(program);
    setShowAddProgramDialog(true);
  };
  
  const handleDeleteProgram = async (programId: string, programName?: string) => {
    let message = `${getTranslatedText('apConfirmDeleteMessage', currentLanguage, {item: getTranslatedText('apProgramSingular', currentLanguage)})}`;
    if (programName) {
        message += ` "${programName}"?`;
    } else {
        message += ` with ID ${programId}?`;
    }
    
    if (window.confirm(message)) {
      try {
        if (!db) throw new Error("Firestore not initialized");
        await deleteDoc(doc(db, "programs", programId));
        toast({ title: getTranslatedText('apProgramDeletedTitle', currentLanguage), description: `${getTranslatedText('apProgramPrefix', currentLanguage)} "${programName || programId}" ${getTranslatedText('apDeletedSuccess', currentLanguage)} ${getTranslatedText('apSuccessfully', currentLanguage)}` });
        await fetchAllData(); 
      } catch (error: any) {
        console.error("Error deleting program:", error);
        toast({ title: getTranslatedText('apDeleteErrorTitle', currentLanguage), description: error.message, variant: "destructive" });
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
        ageRange: data.ageRange || undefined,
        duration: data.duration || undefined,
        schedule: data.schedule || undefined,
        isChildProgram: data.isChildProgram,
        translations: {
          en: {
            label: data.enLabel,
            description: data.enDescription,
            termsAndConditions: data.enTerms,
          },
          am: data.amLabel ? {
            label: data.amLabel,
            description: data.amDescription || '',
            termsAndConditions: data.amTerms || '',
          } : undefined,
          ar: data.arLabel ? {
            label: data.arLabel,
            description: data.arDescription || '',
            termsAndConditions: data.arTerms || '',
          } : undefined,
        },
      };

      await setDoc(doc(db, "programs", data.id), programToSave, { merge: true });
      toast({ 
        title: editingProgram ? (getTranslatedText('apProgramUpdatedTitle', currentLanguage)) : (getTranslatedText('apProgramAddedTitle', currentLanguage)), 
        description: `${getTranslatedText('apProgramPrefix', currentLanguage)} "${data.enLabel}" ${editingProgram ? (getTranslatedText('apUpdatedSuccess', currentLanguage)) : (getTranslatedText('apAddedSuccess', currentLanguage))} ${getTranslatedText('apSuccessfully', currentLanguage)}` 
      });
      setShowAddProgramDialog(false);
      setEditingProgram(null);
      await fetchAllData(); 
    } catch (error: any) {
      console.error("Error saving program:", error);
      toast({ title: getTranslatedText('apSaveErrorTitle', currentLanguage), description: error.message, variant: "destructive" });
    }
  };

  const handleEditRegistration = (registrationId: string) => {
    toast({ title: getTranslatedText('apFeatureComingSoon', currentLanguage), description: `${getTranslatedText('apEditButton', currentLanguage)} ${getTranslatedText('apRegistrationSingular', currentLanguage)} ID: ${registrationId}` });
  };

  const handleDeleteRegistration = (registrationId: string, parentName?: string) => {
    let message = `${getTranslatedText('apConfirmDeleteMessage', currentLanguage, { item: getTranslatedText('apRegistrationSingular', currentLanguage) })}`;
    if (parentName) message += ` for "${parentName}"?`; else message += ` with ID ${registrationId}?`;
    
    if (window.confirm(message)) {
      console.log(`Placeholder: Would delete registration: ${registrationId}`);
      toast({ title: getTranslatedText('apActionPlaceholderTitle', currentLanguage), description: `${getTranslatedText('apDeleteButton', currentLanguage)} ${getTranslatedText('apRegistrationSingular', currentLanguage)} ID: ${registrationId} - ${getTranslatedText('apActionNotImplemented', currentLanguage)}` });
    }
  };

  const handleAddBankDetail = () => {
    setEditingBankDetail(null);
    setShowAddBankDialog(true);
  };

  const handleEditBankDetail = (bankDetail: HafsaPaymentMethod) => {
    setEditingBankDetail(bankDetail);
    setShowAddBankDialog(true);
  };

  const handleSaveBankDetail = async (data: BankDetailFormData) => {
    try {
      if (!db) throw new Error("Firestore not initialized");
      const bankDetailToSave: HafsaPaymentMethod = {
        value: data.value,
        accountNumber: data.accountNumber || undefined,
        logoPlaceholder: data.logoPlaceholder || undefined,
        dataAiHint: data.dataAiHint || undefined,
        translations: {
          en: {
            label: data.enLabel,
            accountName: data.enAccountName || undefined,
            additionalInstructions: data.enAdditionalInstructions || undefined,
          },
          am: data.amLabel ? {
            label: data.amLabel,
            accountName: data.amAccountName || undefined,
            additionalInstructions: data.amAdditionalInstructions || undefined,
          } : undefined,
          ar: data.arLabel ? {
            label: data.arLabel,
            accountName: data.arAccountName || undefined,
            additionalInstructions: data.arAdditionalInstructions || undefined,
          } : undefined,
        },
      };

      await setDoc(doc(db, "paymentMethods", data.value), bankDetailToSave, { merge: true });
      toast({ 
        title: editingBankDetail ? (getTranslatedText('apBankDetailUpdatedTitle', currentLanguage)) : (getTranslatedText('apBankDetailAddedTitle', currentLanguage)), 
        description: `${getTranslatedText('apBankDetailSingular', currentLanguage)} "${data.enLabel}" ${editingBankDetail ? (getTranslatedText('apUpdatedSuccess', currentLanguage)) : (getTranslatedText('apAddedSuccess', currentLanguage))} ${getTranslatedText('apSuccessfully', currentLanguage)}` 
      });
      setShowAddBankDialog(false);
      setEditingBankDetail(null);
      await fetchAllData();
    } catch (error: any) {
      console.error("Error saving bank detail:", error);
      toast({ title: getTranslatedText('apSaveErrorTitle', currentLanguage), description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteBankDetail = async (bankDetailId: string, bankName?: string) => {
    let message = `${getTranslatedText('apConfirmDeleteMessage', currentLanguage, {item: getTranslatedText('apBankDetailSingular', currentLanguage)})}`;
    if (bankName) message += ` "${bankName}"?`; else message += ` ID: ${bankDetailId}?`;
    
    if (window.confirm(message)) {
      try {
        if (!db) throw new Error("Firestore not initialized");
        await deleteDoc(doc(db, "paymentMethods", bankDetailId));
        toast({ title: getTranslatedText('apBankDetailDeletedTitle', currentLanguage), description: `${getTranslatedText('apBankDetailSingular', currentLanguage)} "${bankName || bankDetailId}" ${getTranslatedText('apDeletedSuccess', currentLanguage)} ${getTranslatedText('apSuccessfully', currentLanguage)}` });
        await fetchAllData();
      } catch (error: any) {
        console.error("Error deleting bank detail:", error);
        toast({ title: getTranslatedText('apDeleteErrorTitle', currentLanguage), description: error.message, variant: "destructive" });
      }
    }
  };


  const renderAdminContent = () => {
    if (isAdminLoading) {
      return (
        <div className="flex flex-col items-center justify-center flex-grow p-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-2 mt-2">{t['apVerifyingAdminAccess'] || "Verifying admin access..."}</p>
        </div>
      );
    }
  
    if (!isAdmin) {
      return (
          <div className="flex flex-col items-center justify-center flex-grow p-4 text-center">
              <ShieldAlert className="h-16 w-16 text-destructive mb-6" />
              <h1 className="text-3xl font-bold text-destructive mb-3">{t['apAccessDeniedTitle'] || "Access Denied"}</h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-md">
                  {t['apAccessDeniedMessageAdminPage'] || "You do not have permission to view this page. If you are an admin, please ensure you are logged in with the correct admin account."}
              </p>
          </div>
      );
    }

    return (
      <>
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-primary">{t['apAdminPanelTitle'] || "Admin Panel"}</h1>
          <p className="text-muted-foreground">{t['apAdminPanelSubtitle'] || "Manage enrollments, programs, and payment settings."}</p>
        </header>

        <Tabs value={activeAdminTab} onValueChange={setActiveAdminTab} className="w-full">
          <div className="flex items-center justify-center space-x-1 sm:space-x-2 bg-muted p-1 sm:p-1.5 rounded-lg shadow-sm mx-auto max-w-2xl mb-6">
            {adminDashboardTabsConfig.map(tabConfig => (
                <button
                    key={tabConfig.value}
                    onClick={() => setActiveAdminTab(tabConfig.value)}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 sm:gap-2.5 px-4 py-2.5 sm:px-6 sm:py-3 rounded-md transition-colors duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-muted text-sm sm:text-base font-medium",
                        activeAdminTab === tabConfig.value
                            ? "bg-primary text-primary-foreground shadow"
                            : "text-muted-foreground hover:bg-background hover:text-primary"
                    )}
                    aria-label={t[tabConfig.labelKey] || tabConfig.labelKey}
                    type="button"
                >
                    <tabConfig.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>{t[tabConfig.labelKey] || tabConfig.labelKey}</span>
                </button>
            ))}
          </div>
          
          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>{t['apStudentsListTitle'] || "Student Enrollments"}</CardTitle>
                <CardDescription>{t['apStudentsListDesc'] || "View and manage all student enrollments and their payment status."}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRegistrations && <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
                {error && !isLoadingRegistrations && <p className="text-destructive p-4 text-center">{error.includes(getTranslatedText('apRegistrationsText', currentLanguage, {defaultValue: 'registrations'})) ? error : (t['apFetchRegError'] || 'Failed to fetch registrations')}</p>}
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
                                : (t['apInvalidDateText'] || "Invalid Date")}
                            </TableCell>
                            <TableCell>
                              {reg.paymentVerified ? (
                                <Badge variant="default" className="bg-accent text-accent-foreground hover:bg-accent/90">
                                  <ShieldCheck className="mr-1 h-3.5 w-3.5" /> {t['apVerifiedBadge'] || "Verified"}
                                </Badge>
                              ) : reg.paymentVerificationDetails?.message && (reg.paymentVerificationDetails.message as string).toLowerCase().includes("human review") ? (
                                <Badge variant="outline" className="border-orange-500 text-orange-600">
                                  <ShieldAlert className="mr-1 h-3.5 w-3.5" /> {t['apPendingReviewBadge'] || "Pending Review"}
                                </Badge>
                              ) : (
                                 <Badge variant="destructive">
                                  <ShieldAlert className="mr-1 h-3.5 w-3.5" />
                                  {t['apNotVerifiedBadge'] || "Not Verified"}
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
                {error && !isLoadingPrograms && <p className="text-destructive p-4 text-center">{error.includes(getTranslatedText('apProgramsText', currentLanguage, {defaultValue: 'programs'})) ? error : (t['apFetchProgramsError'] || 'Failed to fetch programs')}</p>}
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
                              <CardDescription>Br{program.price.toFixed(2)} - {t[`programCategory_${program.category}`] || program.category}</CardDescription>
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
                {error && !isLoadingPaymentMethods && <p className="text-destructive p-4 text-center">{error.includes(getTranslatedText('apPaymentMethodsText', currentLanguage, {defaultValue: 'payment methods'})) ? error : (t['apFetchPaymentMethodsError'] || 'Failed to fetch payment methods')}</p>}
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
                              <Button variant="outline" size="sm" onClick={() => handleEditBankDetail(method)}>
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

        <Dialog open={showAddBankDialog} onOpenChange={(isOpen) => {
          setShowAddBankDialog(isOpen);
          if (!isOpen) setEditingBankDetail(null);
        }}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBankDetail ? (t['apEditBankDialogTitle'] || "Edit Bank Account") : (t['apAddBankDialogTitle'] || "Add New Bank Account")}</DialogTitle>
              <DialogDescription>
                {editingBankDetail ? (t['apEditBankDialogDesc'] || "Modify the details of the existing bank account.") : (t['apAddBankDialogDesc'] || "Fill in the details for the new bank account.")}
              </DialogDescription>
            </DialogHeader>
            <AddBankForm
              onSubmit={handleSaveBankDetail}
              initialData={editingBankDetail}
              onCancel={() => {
                setShowAddBankDialog(false);
                setEditingBankDetail(null);
              }}
              currentLanguage={currentLanguage}
            />
          </DialogContent>
        </Dialog>
      </>
    );
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-gradient-to-br from-background to-primary/10">
      <AppHeader
        showAccountIcon={!!user} 
        onAccountClick={() => setShowAdminAccountDialog(true)}
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
      />
      <div className="w-full max-w-7xl p-4 sm:p-6 lg:p-8 pt-4 sm:pt-6">
        {renderAdminContent()}
      </div>
      <Dialog open={showAdminAccountDialog} onOpenChange={setShowAdminAccountDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <UserCog className="mr-2 h-5 w-5 text-primary"/>{t['apAdminAccountDialogTitle'] || "Admin Account"}
            </DialogTitle>
            <DialogDescription>
              {user ? `${t['efLoggedInAsPrefix'] || "Logged in as:"} ${user.email}` : (t['apNotLoggedIn'] || "Not logged in")}
            </DialogDescription>
          </DialogHeader>
          {user && (
            <Button onClick={handleAdminLogout} variant="outline" className="w-full mt-4">
              <LogOut className="mr-2 h-4 w-4" /> {t['efDialogLogoutButton'] || "Logout"}
            </Button>
          )}
          <DialogClose asChild>
            <Button variant="ghost" className="w-full mt-2">{t['efDialogCloseButton'] || "Close"}</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default AdminPage;

    