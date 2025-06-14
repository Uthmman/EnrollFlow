
"use client";

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebaseConfig';
import { useRouter } from 'next/navigation';

// THIS IS A PLACEHOLDER - REPLACE WITH YOUR ACTUAL ADMIN EMAIL FOR TESTING
// For production, use Firebase Custom Claims or an admins collection in Firestore.
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@example.com';

export function useAdminAuth(redirectTo = "/admin/access-denied") {
  const [user, loading, error] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      setIsAdminLoading(true);
      return;
    }

    if (error) {
      console.error("Auth error in useAdminAuth:", error);
      setIsAdmin(false);
      setIsAdminLoading(false);
      if (redirectTo) router.push(redirectTo);
      return;
    }

    if (user) {
      const isAdminUser = user.email === ADMIN_EMAIL;
      setIsAdmin(isAdminUser);
      if (!isAdminUser && redirectTo) {
        router.push(redirectTo);
      }
    } else {
      setIsAdmin(false);
      if (redirectTo) router.push(redirectTo);
    }
    setIsAdminLoading(false);
  }, [user, loading, error, router, redirectTo]);

  return { isAdmin, isAdminLoading, user };
}
