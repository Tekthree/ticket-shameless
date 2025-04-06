import React, { ReactNode } from 'react';
import { useUserRoles, Role } from '@/hooks/useUserRoles';

interface RoleProtectedProps {
  allowedRoles: Role[];
  children: ReactNode;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
}

export function RoleProtected({ 
  allowedRoles, 
  children, 
  fallback = null, 
  loadingFallback = <div>Loading...</div> 
}: RoleProtectedProps) {
  const { roles, isLoading } = useUserRoles();
  
  if (isLoading) {
    return <>{loadingFallback}</>;
  }
  
  const hasAllowedRole = allowedRoles.some(role => roles.includes(role));
  
  if (!hasAllowedRole) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

export default RoleProtected;
