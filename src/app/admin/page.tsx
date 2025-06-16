
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { db, auth } from '@/lib/firebaseConfig';
import { signOut } from 'firebase/auth';
import { collection, getDocs, query, orderBy, doc, deleteDoc, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import type { RegistrationData, HafsaProgram, HafsaPaymentMethod, CouponData } from '@/types';
import { fetchProgramsFromFirestore } from '@/lib/programService';
import { fetchPaymentMethodsFromFirestore } from '@/lib/paymentMethodService';
import { format } from 'date-fns';
import { Loader2, Users, Edit3, Banknote, ShieldCheck, ShieldAlert, Edit, Trash2, PlusCircle, BookOpen, Building, UserCog, LogOut, BarChart3, PercentSquare, CheckSquare, XSquare, CalendarIcon } from 'lucide-react';
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AddProgramForm, type ProgramFormData } from '@/components/admin/add-program-form';
import { AddBankForm, type BankDetailFormData } from '@/components/admin/add-bank-form';
import { AddCouponForm, type CouponFormData } from '@/components/admin/add-coupon-form';
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
  { value: 'accounts', labelKey: 'apAccountsTab', icon: Building },
  { value: 'coupons', labelKey: 'apCouponsTab', icon: PercentSquare },
  { value: 'statistics', labelKey: 'apStatisticsTab', icon: BarChart3 },
];

interface ProgramStats {
  programId: string;
  programName: string;
  count: number;
}

interface GenderStats {
  male: number;
  female: number;
}


const AdminPage = () => {
  const { isAdmin, isAdminLoading, user } = useAdminAuth();
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [isLoadingRegistrations, setIsLoadingRegistrations] = useState(true);
  const [programs, setPrograms] = useState<HafsaProgram[]>([]);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<HafsaPaymentMethod[]>([]);
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(true);
  const [coupons, setCoupons] = useState<CouponData[]>([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [showAddProgramDialog, setShowAddProgramDialog] = useState(false);
  const [editingProgram, setEditingProgram] = useState<HafsaProgram | null>(null);

  const [showAddBankDialog, setShowAddBankDialog] = useState(false);
  const [editingBankDetail, setEditingBankDetail] = useState<HafsaPaymentMethod | null>(null);
  
  const [showAddCouponDialog, setShowAddCouponDialog] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponData | null>(null);

  const [showAdminAccountDialog, setShowAdminAccountDialog] = useState(false);
  const [registrationToDelete, setRegistrationToDelete] = useState<RegistrationRow | null>(null);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);


  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>('en');
  const [t, setT] = useState<Record<string, string>>({});
  const [activeAdminTab, setActiveAdminTab] = useState<string>('students');

  const [programStatistics, setProgramStatistics] = useState<ProgramStats[]>([]);
  const [genderStatistics, setGenderStatistics] = useState<GenderStats>({ male: 0, female: 0 });


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

  const calculateStatistics = useCallback((regs: RegistrationRow[], progs: HafsaProgram[]) => {
    const progStats: Record<string, { name: string; count: number }> = {};
    let maleCount = 0;
    let femaleCount = 0;

    regs.forEach(reg => {
      reg.participants?.forEach(participant => {
        const programDetails = progs.find(p => p.id === participant.programId);
        const programName = programDetails?.translations[currentLanguage]?.label || programDetails?.translations.en?.label || participant.programId;
        
        if (progStats[participant.programId]) {
          progStats[participant.programId].count++;
        } else {
          progStats[participant.programId] = { name: programName, count: 1 };
        }

        if (participant.participantInfo.gender === 'male') {
          maleCount++;
        } else if (participant.participantInfo.gender === 'female') {
          femaleCount++;
        }
      });
    });

    const formattedProgramStats: ProgramStats[] = Object.entries(progStats).map(([id, data]) => ({
      programId: id,
      programName: data.name,
      count: data.count,
    }));

    setProgramStatistics(formattedProgramStats);
    setGenderStatistics({ male: maleCount, female: femaleCount });
  }, [currentLanguage]);


  const fetchAllData = useCallback(async () => {
    console.log("[AdminPage] fetchAllData called");
    setIsLoadingRegistrations(true);
    setIsLoadingPrograms(true);
    setIsLoadingPaymentMethods(true);
    setIsLoadingCoupons(true);
    setError(null);

    if (!db) {
      setError(getTranslatedText('apDbNotInitError', currentLanguage, {defaultValue: "Database not initialized."}));
      setIsLoadingRegistrations(false);
      setIsLoadingPrograms(false);
      setIsLoadingPaymentMethods(false);
      setIsLoadingCoupons(false);
      return;
    }

    let fetchedRegistrations: RegistrationRow[] = [];
    let fetchedPrograms: HafsaProgram[] = [];

    try {
      console.log("[AdminPage] Fetching registrations...");
      const registrationsCol = collection(db, 'registrations');
      const regQuery = query(registrationsCol);  // Removed orderBy for now
      const regSnapshot = await getDocs(regQuery);
      fetchedRegistrations = regSnapshot.docs.map(doc => {
        const data = doc.data() as RegistrationData;
        console.log(`[AdminPage] Raw registration data from Firestore for doc ${doc.id}:`, data);
        let regDate = data.registrationDate;
        if (regDate && typeof (regDate as any).toDate === 'function') { 
          regDate = (regDate as any).toDate();
        } else if (typeof regDate === 'string') { 
          regDate = new Date(regDate);
        } else if (regDate instanceof Timestamp) {
          regDate = regDate.toDate();
        } else if (regDate === undefined || regDate === null) {
            console.warn(`[AdminPage] Registration ${doc.id} has missing registrationDate. Defaulting to now.`);
            regDate = new Date(); 
        }
        return {
          id: doc.id,
          ...data,
          registrationDate: regDate instanceof Date && !isNaN(regDate.valueOf()) ? regDate : new Date()
        } as RegistrationRow;
      });
      // Client-side sort as Firestore index might be missing
      fetchedRegistrations.sort((a, b) => {
        const dateA = a.registrationDate instanceof Date ? a.registrationDate.getTime() : 0;
        const dateB = b.registrationDate instanceof Date ? b.registrationDate.getTime() : 0;
        return dateB - dateA; 
      });
      setRegistrations(fetchedRegistrations);
      console.log("[AdminPage] Fetched registrations (after client sort):", fetchedRegistrations.length);
      if (fetchedRegistrations.length === 0) {
        console.warn("[AdminPage] No registrations found after fetching.");
      }
    } catch (err: any) {
      console.error("[AdminPage] Error fetching registrations:", err.message, err.stack ? err.stack : '', err);
      const errorMsg = getTranslatedText('apFetchRegError', currentLanguage, {defaultValue: 'Failed to fetch registrations:'});
      setError(prev => prev ? `${prev}\n${errorMsg} ${err.message}` : `${errorMsg} ${err.message}`);
      if ((err.message as string).includes("firestore/failed-precondition") || (err.message as string).includes("query requires an index")) {
        console.error("[AdminPage] Firestore index missing for registrations query. Please create the required index in Firebase Console. Displaying unsorted list if fallback works.");
        setError(prev => prev ? `${prev}\nFirestore index missing. Ensure an index on 'registrationDate' (desc) exists for the 'registrations' collection.` : `Firestore index missing for registrations. Data may be unsorted or incomplete.`);
      }
    } finally {
      setIsLoadingRegistrations(false);
    }

    try {
      fetchedPrograms = await fetchProgramsFromFirestore();
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
    
    try {
        console.log("[AdminPage] Fetching coupons...");
        const couponsCol = collection(db, 'coupons');
        const couponQuery = query(couponsCol, orderBy('couponCode')); 
        const couponSnapshot = await getDocs(couponQuery);
        const fetchedCoupons = couponSnapshot.docs.map(d => {
            const data = d.data();
            return {
                ...data,
                id: d.id, 
                expiryDate: data.expiryDate && data.expiryDate.toDate ? data.expiryDate.toDate() : undefined, 
            } as CouponData;
        });
        setCoupons(fetchedCoupons);
        console.log("[AdminPage] Fetched coupons:", fetchedCoupons.length);
    } catch (err: any) {
        console.error("[AdminPage] Error fetching coupons:", err.message, err.stack ? err.stack : '', err);
        const errorMsg = getTranslatedText('apFetchCouponsError', currentLanguage, { defaultValue: 'Failed to fetch coupons:' });
        setError(prev => prev ? `${prev}\n${errorMsg} ${err.message}` : `${errorMsg} ${err.message}`);
        if ((err.message as string).includes("firestore/failed-precondition")) {
             setError(prev => prev ? `${prev}\nFirestore index missing for coupons. Please create it.` : `Firestore index missing for coupons. Please create it.`);
        }
    } finally {
        setIsLoadingCoupons(false);
    }

    if (fetchedRegistrations.length > 0 && fetchedPrograms.length > 0) {
      calculateStatistics(fetchedRegistrations, fetchedPrograms);
    } else {
      setProgramStatistics([]);
      setGenderStatistics({ male: 0, female: 0 });
    }

  }, [currentLanguage, calculateStatistics]);

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
        description: `${getTranslatedText('apProgramPrefix', currentLanguage)} "${programToSave.translations.en.label}" ${editingProgram ? (getTranslatedText('apUpdatedSuccess', currentLanguage)) : (getTranslatedText('apAddedSuccess', currentLanguage))} ${getTranslatedText('apSuccessfully', currentLanguage)}` 
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
    // Placeholder: Future implementation for full registration edit
    toast({ title: getTranslatedText('apFeatureComingSoon', currentLanguage), description: `${getTranslatedText('apEditButton', currentLanguage)} ${getTranslatedText('apRegistrationSingular', currentLanguage)} ID: ${registrationId}` });
  };

  const confirmDeleteRegistration = async () => {
    if (!registrationToDelete || !db) return;
    try {
      await deleteDoc(doc(db, "registrations", registrationToDelete.id));
      toast({ 
        title: getTranslatedText('apRegistrationDeletedTitle', currentLanguage, {defaultValue: "Registration Deleted"}), 
        description: `${getTranslatedText('apRegistrationForPrefix', currentLanguage, {defaultValue: "Registration for"})} "${registrationToDelete.parentInfo.parentFullName}" ${getTranslatedText('apDeletedSuccess', currentLanguage)}.`
      });
      setRegistrationToDelete(null);
      setShowDeleteConfirmDialog(false);
      await fetchAllData(); // Refresh the list
    } catch (error: any) {
      console.error("Error deleting registration:", error);
      toast({ title: getTranslatedText('apDeleteErrorTitle', currentLanguage), description: error.message, variant: "destructive" });
      setRegistrationToDelete(null);
      setShowDeleteConfirmDialog(false);
    }
  };

  const openDeleteConfirmation = (registration: RegistrationRow) => {
    setRegistrationToDelete(registration);
    setShowDeleteConfirmDialog(true);
  };

  const togglePaymentVerification = async (registration: RegistrationRow) => {
    if (!db) return;
    const newStatus = !registration.paymentVerified;
    try {
      const regRef = doc(db, "registrations", registration.id);
      await updateDoc(regRef, {
        paymentVerified: newStatus,
        paymentVerificationDetails: {
          ...(registration.paymentVerificationDetails || {}),
          message: newStatus ? getTranslatedText('apManuallyVerified', currentLanguage, {defaultValue: "Manually verified by admin."}) : getTranslatedText('apManuallyUnverified', currentLanguage, {defaultValue: "Marked as not verified by admin."}),
          reason: newStatus ? getTranslatedText('apAdminVerification', currentLanguage, {defaultValue: "Admin verification."}) : getTranslatedText('apAdminUnverification', currentLanguage, {defaultValue: "Admin un-verification."}),
          isPaymentValid: newStatus, // Ensure this aligns
        }
      });
      toast({
        title: getTranslatedText('apPaymentStatusUpdatedTitle', currentLanguage, {defaultValue: "Payment Status Updated"}),
        description: `${getTranslatedText('apRegistrationForPrefix', currentLanguage, {defaultValue: "Registration for"})} ${registration.parentInfo.parentFullName} ${newStatus ? (getTranslatedText('apMarkedVerifiedToast', currentLanguage, {defaultValue: "marked as Verified."})) : (getTranslatedText('apMarkedNotVerifiedToast', currentLanguage, {defaultValue: "marked as Not Verified."}))}`
      });
      await fetchAllData(); // Refresh list
    } catch (error: any) {
      console.error("Error updating payment verification:", error);
      toast({ title: getTranslatedText('apUpdateErrorTitle', currentLanguage, {defaultValue: "Update Error"}), description: error.message, variant: "destructive" });
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
        iconUrl: data.iconUrl || undefined,
        iconDataAiHint: data.iconDataAiHint || undefined,
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
        description: `${getTranslatedText('apBankDetailSingular', currentLanguage)} "${bankDetailToSave.translations.en.label}" ${editingBankDetail ? (getTranslatedText('apUpdatedSuccess', currentLanguage)) : (getTranslatedText('apAddedSuccess', currentLanguage))} ${getTranslatedText('apSuccessfully', currentLanguage)}` 
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

  const handleAddCoupon = () => {
    setEditingCoupon(null);
    setShowAddCouponDialog(true);
  };

  const handleEditCoupon = (coupon: CouponData) => {
    setEditingCoupon(coupon);
    setShowAddCouponDialog(true);
  };

  const handleSaveCoupon = async (data: CouponFormData) => {
    try {
        if (!db) throw new Error("Firestore not initialized");
        const couponToSave: CouponData = {
            id: data.id, 
            couponCode: data.couponCode,
            discountType: data.discountType,
            discountValue: data.discountValue,
            description: data.description || undefined,
            expiryDate: data.expiryDate ? Timestamp.fromDate(data.expiryDate) : undefined,
            isActive: data.isActive,
        };

        await setDoc(doc(db, "coupons", couponToSave.id), couponToSave, { merge: true });
        toast({
            title: editingCoupon ? getTranslatedText('apCouponUpdatedTitle', currentLanguage) : getTranslatedText('apCouponAddedTitle', currentLanguage),
            description: `${getTranslatedText('apCouponPrefix', currentLanguage)} "${couponToSave.couponCode}" ${editingCoupon ? getTranslatedText('apUpdatedSuccess', currentLanguage) : getTranslatedText('apAddedSuccess', currentLanguage)}.`
        });
        setShowAddCouponDialog(false);
        setEditingCoupon(null);
        await fetchAllData(); 
    } catch (error: any) {
        console.error("Error saving coupon:", error);
        toast({ title: getTranslatedText('apSaveErrorTitle', currentLanguage), description: error.message, variant: "destructive" });
    }
  };
  
  const handleDeleteCoupon = async (couponId: string, couponCode?: string) => {
    let message = `${getTranslatedText('apConfirmDeleteMessage', currentLanguage, { item: getTranslatedText('apCouponSingular', currentLanguage) })}`;
    message += couponCode ? ` "${couponCode}"?` : ` with ID ${couponId}?`;

    if (window.confirm(message)) {
        try {
            if (!db) throw new Error("Firestore not initialized");
            await deleteDoc(doc(db, "coupons", couponId));
            toast({
                title: getTranslatedText('apCouponDeletedTitle', currentLanguage),
                description: `${getTranslatedText('apCouponPrefix', currentLanguage)} "${couponCode || couponId}" ${getTranslatedText('apDeletedSuccess', currentLanguage)}.`
            });
            await fetchAllData(); 
        } catch (error: any) {
            console.error("Error deleting coupon:", error);
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
           <div className="mb-6 w-full overflow-x-auto sm:overflow-visible">
            <div className="flex items-center justify-center space-x-1 bg-primary text-primary-foreground p-1.5 rounded-full shadow-xl border border-primary-foreground/20 mx-auto max-w-fit">
                {adminDashboardTabsConfig.map(tabConfig => (
                    <button
                        key={tabConfig.value}
                        onClick={() => setActiveAdminTab(tabConfig.value)}
                        className={cn(
                            "flex flex-col items-center justify-center p-2 rounded-full transition-all duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-primary", 
                            "h-14 min-w-[60px] sm:h-16 sm:flex-row sm:gap-2 sm:px-3 sm:py-2.5 sm:min-w-[100px] lg:min-w-[110px]", 
                            activeAdminTab === tabConfig.value
                                ? "bg-primary-foreground text-primary scale-105 shadow-md"
                                : "hover:bg-white/20"
                        )}
                        aria-label={t[tabConfig.labelKey] || tabConfig.labelKey}
                        type="button"
                    >
                        <tabConfig.icon className="h-5 w-5 mb-0.5 sm:mb-0" />
                        <span className="text-xs font-medium sm:text-sm">{t[tabConfig.labelKey] || tabConfig.labelKey}</span>
                    </button>
                ))}
            </div>
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
                                {reg.paymentVerified ? (
                                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => togglePaymentVerification(reg)} title={t['apMarkNotVerifiedTooltip'] || "Mark as Not Verified"}>
                                        <XSquare className="h-4 w-4 text-orange-600" />
                                    </Button>
                                ) : (
                                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => togglePaymentVerification(reg)} title={t['apMarkVerifiedTooltip'] || "Mark as Verified"}>
                                        <CheckSquare className="h-4 w-4 text-green-600" />
                                    </Button>
                                )}
                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleEditRegistration(reg.id)} title={t['apEditRegistrationTooltip'] || "Edit Registration"}>
                                    <Edit3 className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => openDeleteConfirmation(reg)} title={t['apDeleteRegistrationTooltip'] || "Delete Registration"}>
                                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
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

          <TabsContent value="accounts">
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
                              {method.iconUrl && <p className="mt-1 text-xs">Icon URL: <a href={method.iconUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{method.iconUrl}</a></p>}
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
          
          <TabsContent value="coupons">
             <Card>
              <CardHeader  className="flex flex-row justify-between items-center">
                <div>
                    <CardTitle>{t['apCouponsTabTitle'] || "Manage Coupons"}</CardTitle>
                    <CardDescription>{t['apCouponsTabDesc'] || "Add, edit, or delete coupon codes for discounts."}</CardDescription>
                </div>
                 <Button onClick={handleAddCoupon}>
                  <PlusCircle className="mr-2 h-4 w-4" /> {t['apAddCouponButton'] || "Add Coupon"}
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingCoupons && <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
                {error && !isLoadingCoupons && <p className="text-destructive p-4 text-center">{error.includes(getTranslatedText('apCouponsText', currentLanguage, {defaultValue: 'coupons'})) ? error : (t['apFetchCouponsError'] || 'Failed to fetch coupons')}</p>}
                {!isLoadingCoupons && !error && coupons.length === 0 && (
                    <p className="text-muted-foreground p-4 text-center">{t['apNoCouponsFound'] || "No coupons found. Add one to get started."}</p>
                )}
                {!isLoadingCoupons && coupons.length > 0 && (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t['apCouponCodeHeader'] || "Code"}</TableHead>
                          <TableHead>{t['apCouponDescriptionHeader'] || "Description"}</TableHead>
                          <TableHead>{t['apCouponDiscountHeader'] || "Discount"}</TableHead>
                          <TableHead>{t['apCouponExpiryHeader'] || "Expiry"}</TableHead>
                          <TableHead>{t['apCouponStatusHeader'] || "Status"}</TableHead>
                          <TableHead>{t['apActionsHeader'] || "Actions"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {coupons.map((coupon) => (
                          <TableRow key={coupon.id}>
                            <TableCell className="font-medium">{coupon.couponCode}</TableCell>
                            <TableCell className="text-xs max-w-xs truncate">{coupon.description || 'N/A'}</TableCell>
                            <TableCell>
                                {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `Br${coupon.discountValue.toFixed(2)}`}
                            </TableCell>
                            <TableCell>
                                {coupon.expiryDate ? format(new Date(coupon.expiryDate as string | Date), "MMM d, yyyy") : (t['apNoExpiryText'] || 'No Expiry')}
                            </TableCell>
                            <TableCell>
                                <Badge variant={coupon.isActive ? "default" : "outline"} className={coupon.isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"}>
                                {coupon.isActive ? (t['apCouponActive'] || 'Active') : (t['apCouponInactive'] || 'Inactive')}
                                </Badge>
                            </TableCell>
                            <TableCell className="space-x-1">
                              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleEditCoupon(coupon)}>
                                <Edit className="h-3.5 w-3.5" />
                                <span className="sr-only">{t['apEditButton'] || 'Edit'}</span>
                              </Button>
                              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleDeleteCoupon(coupon.id, coupon.couponCode)}>
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

          <TabsContent value="statistics">
            <Card>
              <CardHeader>
                <CardTitle>{t['apStatisticsTitle'] || "Statistics & Reports"}</CardTitle>
                <CardDescription>{t['apStatisticsDesc'] || "View enrollment statistics and generate reports."}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {(isLoadingRegistrations || isLoadingPrograms) && <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
                {!isLoadingRegistrations && !isLoadingPrograms && (
                  <>
                    <div>
                      <h3 className="text-lg font-semibold text-primary mb-2">{t['apStudentsPerProgramTitle'] || "Students per Program"}</h3>
                      {programStatistics.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t['apProgramNameHeader'] || "Program Name"}</TableHead>
                              <TableHead className="text-right">{t['apStudentCountHeader'] || "Student Count"}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {programStatistics.map(stat => (
                              <TableRow key={stat.programId}>
                                <TableCell>{stat.programName}</TableCell>
                                <TableCell className="text-right">{stat.count}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-muted-foreground">{t['apNoProgramStats'] || "No program enrollment data available."}</p>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-primary mb-2">{t['apGenderDistributionTitle'] || "Gender Distribution"}</h3>
                      {genderStatistics.male > 0 || genderStatistics.female > 0 ? (
                         <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t['pdfGenderLabel'] || "Gender"}</TableHead>
                              <TableHead className="text-right">{t['apStudentCountHeader'] || "Student Count"}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>{t['pdfMaleOption'] || "Male"}</TableCell>
                              <TableCell className="text-right">{genderStatistics.male}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>{t['pdfFemaleOption'] || "Female"}</TableCell>
                              <TableCell className="text-right">{genderStatistics.female}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-muted-foreground">{t['apNoGenderStats'] || "No gender distribution data available."}</p>
                      )}
                    </div>
                  </>
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

        <Dialog open={showAddCouponDialog} onOpenChange={(isOpen) => {
            setShowAddCouponDialog(isOpen);
            if (!isOpen) setEditingCoupon(null);
        }}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{editingCoupon ? (t['apEditCouponTitle'] || "Edit Coupon") : (t['apAddCouponDialogTitle'] || "Add New Coupon")}</DialogTitle>
                    <DialogDescription>
                        {editingCoupon ? (t['apEditCouponDialogDesc'] || "Modify the details of the existing coupon.") : (t['apAddCouponDialogDesc'] || "Fill in the details for the new coupon.")}
                    </DialogDescription>
                </DialogHeader>
                <AddCouponForm
                    onSubmit={handleSaveCoupon}
                    initialData={editingCoupon}
                    onCancel={() => {
                        setShowAddCouponDialog(false);
                        setEditingCoupon(null);
                    }}
                    currentLanguage={currentLanguage}
                />
            </DialogContent>
        </Dialog>

        <AlertDialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{getTranslatedText('apConfirmDeletionTitle', currentLanguage, {defaultValue: "Confirm Deletion"})}</AlertDialogTitle>
              <AlertDialogDescription>
                {getTranslatedText('apConfirmDeleteStudentMessage', currentLanguage, {defaultValue: "Are you sure you want to delete the registration for"})} {registrationToDelete?.parentInfo.parentFullName}? {getTranslatedText('apActionCannotBeUndone', currentLanguage, {defaultValue: "This action cannot be undone."})}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {setRegistrationToDelete(null); setShowDeleteConfirmDialog(false);}}>{t.apCancelButton || "Cancel"}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteRegistration} className="bg-destructive hover:bg-destructive/90">
                {t.apDeleteButton || "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
              {user ? `${t['efLoggedInAsPrefix'] || "Logged in as:"} ${(user.displayName || user.email)}` : (t['apNotLoggedIn'] || "Not logged in")}
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

