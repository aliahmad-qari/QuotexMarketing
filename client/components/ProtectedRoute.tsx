'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { UserRole } from '../types/auth';

export function ProtectedRoute({
  children,
  roles,
}: Readonly<{
  children: React.ReactNode;
  roles?: UserRole[];
}>) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    } else if (!isLoading && roles && user && !roles.includes(user.role)) {
      router.replace('/account');
    }
  }, [isAuthenticated, isLoading, roles, router, user]);

  if (isLoading) {
    return (
      <div className="py-24 text-center font-mono text-sm text-slate-400">
        Checking secure session...
      </div>
    );
  }

  if (!isAuthenticated || (roles && user && !roles.includes(user.role))) {
    return null;
  }

  return <>{children}</>;
}
