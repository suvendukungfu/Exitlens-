'use client';

import React from 'react';
import {
  ShieldCheck,
  UserCheck,
  Factory,
  Shield,
  Eye,
  Lock,
  Check,
  X,
  Info,
  Users,
} from 'lucide-react';
import { TopHeader } from '@/components/layout/TopHeader';
import { useDevAuth } from '@/lib/auth/DevAuthContext';
import { ROLE_DEFINITIONS, UserRole } from '@/lib/services/authService';

export default function AccessSettingsPage() {
  const { currentUser, switchPersona, personas } = useDevAuth();

  const roleList: UserRole[] = ['CORP_HR', 'PLANT_HR', 'HR_ADMIN', 'VIEWER'];

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'CORP_HR':
        return <UserCheck className="w-4 h-4 text-blue-600" />;
      case 'PLANT_HR':
        return <Factory className="w-4 h-4 text-amber-600" />;
      case 'HR_ADMIN':
        return <Shield className="w-4 h-4 text-purple-600" />;
      case 'VIEWER':
        return <Eye className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="pb-12">
      <TopHeader
        title="Role-Based Access Control & Governance"
        subtitle="Security policies, development persona simulator, and plant-level authorization matrix for Steel Strips Wheels."
      />

      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Transparent Auth Status Notice */}
        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-900">
            <h4 className="font-bold text-sm">Development Authentication Mode Active</h4>
            <p className="mt-1 leading-relaxed">
              ExitLens is configured in <strong>Development Multi-Persona Simulator</strong> mode. In production deployment, this layer connects to your enterprise identity provider (SAML 2.0 / Azure Active Directory / Okta) to automatically map enterprise claims to SSWL plant assignments.
            </p>
          </div>
        </div>

        {/* Active Session & Persona Switcher */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Simulated Enterprise Personas</span>
              </h3>
              <p className="text-xs text-slate-500">
                Click any persona below to instantaneously evaluate application security rules as that user.
              </p>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200">
              Active: {currentUser.name} ({currentUser.roleTitle})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {personas.map((persona) => {
              const isActive = persona.id === currentUser.id;
              return (
                <div
                  key={persona.id}
                  onClick={() => switchPersona(persona.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all duration-150 relative ${
                    isActive
                      ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 shadow-xs'
                      : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-2xs">
                        {getRoleIcon(persona.role)}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900">
                          {persona.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {persona.email}
                        </div>
                      </div>
                    </div>
                    {isActive && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white font-bold text-[9px] uppercase tracking-wider">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Role:</span>
                    <span className="font-semibold text-slate-700">
                      {persona.roleTitle}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Plant Scope:</span>
                    <span className="font-semibold text-slate-700">
                      {persona.assignedPlant ? `${persona.assignedPlant} Facility` : 'All 5 Plants'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Enterprise Permission Matrix */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Role Permissions & Capability Matrix</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enforced server-side at the repository layer. Plant HR is strictly quarantined to their facility.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-semibold">
                <tr>
                  <th className="p-3">Governance Capability</th>
                  {roleList.map((r) => (
                    <th key={r} className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {getRoleIcon(r)}
                        <span>{ROLE_DEFINITIONS[r].title}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                <tr>
                  <td className="p-3 font-medium text-slate-800">
                    Org-Wide Multi-Plant Access
                  </td>
                  {roleList.map((r) => (
                    <td key={r} className="p-3 text-center">
                      {ROLE_DEFINITIONS[r].canAccessAllPlants ? (
                        <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                      ) : (
                        <span className="text-[10px] font-semibold text-amber-600">
                          Assigned Plant Only
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-3 font-medium text-slate-800">
                    Excel Batch Import (Append)
                  </td>
                  {roleList.map((r) => (
                    <td key={r} className="p-3 text-center">
                      {ROLE_DEFINITIONS[r].canImport ? (
                        <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-slate-300 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-3 font-medium text-slate-800">
                    Full Dataset Replacement (Wipe)
                  </td>
                  {roleList.map((r) => (
                    <td key={r} className="p-3 text-center">
                      {ROLE_DEFINITIONS[r].canReplaceDataset ? (
                        <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-slate-300 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-3 font-medium text-slate-800">
                    Create & Edit Exit Records
                  </td>
                  {roleList.map((r) => (
                    <td key={r} className="p-3 text-center">
                      {ROLE_DEFINITIONS[r].canEditRecords ? (
                        <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-slate-300 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-3 font-medium text-slate-800">
                    Delete Individual Records
                  </td>
                  {roleList.map((r) => (
                    <td key={r} className="p-3 text-center">
                      {ROLE_DEFINITIONS[r].canDeleteRecords ? (
                        <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-slate-300 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-3 font-medium text-slate-800">
                    Master Taxonomy Governance (Plants, Reasons, Headcount)
                  </td>
                  {roleList.map((r) => (
                    <td key={r} className="p-3 text-center">
                      {ROLE_DEFINITIONS[r].canManageMasterData ? (
                        <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-slate-300 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-3 font-medium text-slate-800">
                    Security Audit Trail Inspection
                  </td>
                  {roleList.map((r) => (
                    <td key={r} className="p-3 text-center">
                      {ROLE_DEFINITIONS[r].canViewAuditLogs ? (
                        <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-slate-300 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Plant Isolation Security Principle */}
        <div className="p-4 rounded-lg bg-slate-100 border border-slate-200 space-y-2 text-xs text-slate-600">
          <div className="font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-500" />
            <span>Server-Side Plant Isolation Rule</span>
          </div>
          <p>
            When a user authenticates as <code>Plant HR</code>, access control is enforced in <code>ExitRecordService</code> prior to analytics calculation or chart rendering. Attempting to request records, aggregate summaries, or submit Excel rows outside the authorized facility raises a <code>Security Rejection</code> exception rather than quietly filtering UI elements.
          </p>
        </div>
      </div>
    </div>
  );
}
