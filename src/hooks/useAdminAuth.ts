
"use client";

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebaseConfig';
import { useRouter } from 'next/navigation';

const ADMIN_EMAIL_FROM_ENV = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

export function useAdminAuth(redirectTo = "/admin/access-denied") {
  const [user, loading, error] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (ADMIN_EMAIL_FROM_ENV) {
      console.log(`[useAdminAuth] NEXT_PUBLIC_ADMIN_EMAIL is set to: "${ADMIN_EMAIL_FROM_ENV}"`);
    } else {
      console.warn("[useAdminAuth] NEXT_PUBLIC_ADMIN_EMAIL environment variable is NOT SET. Defaulting to 'admin@example.com'. Please set it in your .env.local file.");
    }
    const effectiveAdminEmail = ADMIN_EMAIL_FROM_ENV || 'admin@example.com';

    if (loading) {
      console.log("[useAdminAuth] Auth state loading...");
      setIsAdminLoading(true);
      return;
    }

    if (error) {
      console.error("[useAdminAuth] Auth error:", error);
      setIsAdmin(false);
      setIsAdminLoading(false);
      if (redirectTo) router.push(redirectTo);
      return;
    }

    if (user) {
      console.log(`[useAdminAuth] User authenticated. Email: "${user.email}"`);
      console.log(`[useAdminAuth] Comparing with admin email: "${effectiveAdminEmail}"`);
      const isAdminUser = user.email === effectiveAdminEmail;
      setIsAdmin(isAdminUser);
      console.log(`[useAdminAuth] isAdminUser determined as: ${isAdminUser}`);
      if (!isAdminUser && redirectTo) {
        console.log(`[useAdminAuth] User is not admin. Redirecting to ${redirectTo}`);
        router.push(redirectTo);
      } else if (isAdminUser) {
        console.log("[useAdminAuth] User is admin. Access granted to admin page.");
      }
    } else {
      console.log("[useAdminAuth] No user authenticated. Redirecting.");
      setIsAdmin(false);
      if (redirectTo) router.push(redirectTo);
    }
    setIsAdminLoading(false);
  }, [user, loading, error, router, redirectTo]);

  return { isAdmin, isAdminLoading, user };
}
