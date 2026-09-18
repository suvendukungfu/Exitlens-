/**
 * Authentication & Role Authorization Service
 * Pre-configured with Enterprise Roles & Dev Authentication Personas
 */

export type UserRole = 'CORP_HR' | 'PLANT_HR' | 'HR_ADMIN' | 'VIEWER';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  assignedPlant?: string; // e.g. 'Chennai', 'Dappar', or undefined for global org-wide
  organization: string;
}

export interface RoleDefinition {
  code: UserRole;
  title: string;
  description: string;
  canAccessAllPlants: boolean;
  canImport: boolean;
  canReplaceDataset: boolean;
  canEditRecords: boolean;
  canDeleteRecords: boolean;
  canManageMasterData: boolean;
  canViewAuditLogs: boolean;
}

export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  CORP_HR: {
    code: 'CORP_HR',
    title: 'Corporate HR',
    description: 'Permitted organization-wide access across all manufacturing plants and analytics.',
    canAccessAllPlants: true,
    canImport: true,
    canReplaceDataset: true,
    canEditRecords: true,
    canDeleteRecords: true,
    canManageMasterData: false,
    canViewAuditLogs: true,
  },
  PLANT_HR: {
    code: 'PLANT_HR',
    title: 'Plant HR Officer',
    description: 'Restricted strictly to authorized manufacturing unit records and imports.',
    canAccessAllPlants: false,
    canImport: true,
    canReplaceDataset: false, // Cannot wipe multi-plant datasets
    canEditRecords: true,
    canDeleteRecords: false,
    canManageMasterData: false,
    canViewAuditLogs: false,
  },
  HR_ADMIN: {
    code: 'HR_ADMIN',
    title: 'HR System Administrator',
    description: 'Full supervisory governance over master taxonomies, system imports, and data operations.',
    canAccessAllPlants: true,
    canImport: true,
    canReplaceDataset: true,
    canEditRecords: true,
    canDeleteRecords: true,
    canManageMasterData: true,
    canViewAuditLogs: true,
  },
  VIEWER: {
    code: 'VIEWER',
    title: 'Executive / Auditor (Viewer)',
    description: 'Read-only access to aggregated analytics dashboards and high-level reports.',
    canAccessAllPlants: true,
    canImport: false,
    canReplaceDataset: false,
    canEditRecords: false,
    canDeleteRecords: false,
    canManageMasterData: false,
    canViewAuditLogs: false,
  },
};

/**
 * Predefined Development Personas for testing security & role boundaries
 */
export const DEV_PERSONAS: AuthUser[] = [
  {
    id: 'usr-corp-01',
    name: 'Aman Sharma',
    email: 'aman.sharma@sswlindia.com',
    role: 'CORP_HR',
    roleTitle: 'Corporate HR Lead',
    assignedPlant: undefined,
    organization: 'Steel Strips Wheels Ltd. (Corporate HQ)',
  },
  {
    id: 'usr-plant-chennai',
    name: 'Priya Sundaram',
    email: 'priya.sundaram@sswlindia.com',
    role: 'PLANT_HR',
    roleTitle: 'Plant HR Officer',
    assignedPlant: 'Chennai',
    organization: 'SSWL Chennai Facility',
  },
  {
    id: 'usr-plant-dappar',
    name: 'Vikramjit Singh',
    email: 'vikramjit.singh@sswlindia.com',
    role: 'PLANT_HR',
    roleTitle: 'Plant HR Officer',
    assignedPlant: 'Dappar',
    organization: 'SSWL Dappar Facility',
  },
  {
    id: 'usr-admin-01',
    name: 'Rajeev Mehta',
    email: 'rajeev.mehta@sswlindia.com',
    role: 'HR_ADMIN',
    roleTitle: 'HR Technology Director',
    assignedPlant: undefined,
    organization: 'Steel Strips Wheels Ltd.',
  },
  {
    id: 'usr-auditor-01',
    name: 'S. Krishnan',
    email: 's.krishnan@auditors-ext.com',
    role: 'VIEWER',
    roleTitle: 'Internal Auditor',
    assignedPlant: undefined,
    organization: 'Statutory Compliance & Audit',
  },
];

export class AuthService {
  /**
   * Determine if user has permission to view records from a given plant
   */
  static canAccessPlant(user: AuthUser, plantName: string): boolean {
    if (!plantName) return true;
    const roleDef = ROLE_DEFINITIONS[user.role];
    if (roleDef.canAccessAllPlants) return true;
    if (!user.assignedPlant) return true;
    
    const uPlant = user.assignedPlant.toLowerCase().trim();
    const pPlant = plantName.toLowerCase().trim();
    return pPlant.includes(uPlant) || uPlant.includes(pPlant);
  }

  /**
   * Determine if user can perform record mutations (create, update)
   */
  static canModifyRecords(user: AuthUser, plantName?: string): boolean {
    const roleDef = ROLE_DEFINITIONS[user.role];
    if (!roleDef.canEditRecords) return false;
    if (plantName && !this.canAccessPlant(user, plantName)) return false;
    return true;
  }

  /**
   * Determine if user can import new records
   */
  static canImportData(user: AuthUser, targetPlant?: string): boolean {
    const roleDef = ROLE_DEFINITIONS[user.role];
    if (!roleDef.canImport) return false;
    if (targetPlant && !this.canAccessPlant(user, targetPlant)) return false;
    return true;
  }

  /**
   * Determine if user can perform full dataset replacement
   */
  static canReplaceDataset(user: AuthUser): boolean {
    const roleDef = ROLE_DEFINITIONS[user.role];
    return roleDef.canReplaceDataset;
  }

  /**
   * Determine if user can configure master taxonomies
   */
  static canManageMasterData(user: AuthUser): boolean {
    const roleDef = ROLE_DEFINITIONS[user.role];
    return roleDef.canManageMasterData;
  }

  /**
   * Determine if user can access audit trails
   */
  static canViewAuditLogs(user: AuthUser): boolean {
    const roleDef = ROLE_DEFINITIONS[user.role];
    return roleDef.canViewAuditLogs;
  }
}
