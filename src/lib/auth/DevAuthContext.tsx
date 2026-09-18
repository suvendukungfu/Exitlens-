'use client';

import React, { createContext, useContext, useState } from 'react';
import { AuthUser, DEV_PERSONAS, ROLE_DEFINITIONS, RoleDefinition, AuthService } from '../services/authService';

interface DevAuthContextType {
  currentUser: AuthUser;
  setCurrentUser: (user: AuthUser) => void;
  switchPersona: (personaId: string) => void;
  personas: AuthUser[];
  roleDef: RoleDefinition;
  isPlantScoped: boolean;
  canAccessPlant: (plantName: string) => boolean;
  canModifyRecords: (plantName?: string) => boolean;
  canImportData: (targetPlant?: string) => boolean;
  canReplaceDataset: boolean;
  canManageMasterData: boolean;
  canViewAuditLogs: boolean;
}

const DevAuthContext = createContext<DevAuthContextType | undefined>(undefined);

const STORAGE_KEY_AUTH_USER = 'exitlens_dev_auth_user_v1';

export function DevAuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser>(() => {
    if (typeof window === 'undefined') return DEV_PERSONAS[0];
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUTH_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        const match = DEV_PERSONAS.find((p) => p.id === parsed.id);
        if (match) return match;
      }
    } catch {
      // Fallback to default
    }
    return DEV_PERSONAS[0]; // Aman Sharma (Corporate HR)
  });

  const switchPersona = (personaId: string) => {
    const match = DEV_PERSONAS.find((p) => p.id === personaId);
    if (match) {
      setCurrentUser(match);
      try {
        localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(match));
      } catch {
        // Fallback
      }
    }
  };

  const roleDef = ROLE_DEFINITIONS[currentUser.role];
  const isPlantScoped = currentUser.role === 'PLANT_HR' && !!currentUser.assignedPlant;

  return (
    <DevAuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchPersona,
        personas: DEV_PERSONAS,
        roleDef,
        isPlantScoped,
        canAccessPlant: (plant: string) => AuthService.canAccessPlant(currentUser, plant),
        canModifyRecords: (plant?: string) => AuthService.canModifyRecords(currentUser, plant),
        canImportData: (targetPlant?: string) => AuthService.canImportData(currentUser, targetPlant),
        canReplaceDataset: AuthService.canReplaceDataset(currentUser),
        canManageMasterData: AuthService.canManageMasterData(currentUser),
        canViewAuditLogs: AuthService.canViewAuditLogs(currentUser),
      }}
    >
      {children}
    </DevAuthContext.Provider>
  );
}

export function useDevAuth() {
  const context = useContext(DevAuthContext);
  if (!context) {
    throw new Error('useDevAuth must be used within a DevAuthProvider');
  }
  return context;
}
