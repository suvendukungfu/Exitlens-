'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  Building2,
  Factory,
  HelpCircle,
  Clock,
  TableProperties,
  UploadCloud,
  ShieldCheck,
  FileBarChart,
  Settings,
  Sun,
  Moon,
  Database,
  Menu,
  X,
  History,
  Shield,
} from 'lucide-react';
import { useExitData } from '@/lib/store/ExitDataContext';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const PRIMARY_NAV: NavItem[] = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Exit Trends', href: '/trends', icon: TrendingUp },
  { name: 'Departments', href: '/departments', icon: Building2 },
  { name: 'Plants', href: '/plants', icon: Factory },
  { name: 'Exit Reasons', href: '/reasons', icon: HelpCircle },
  { name: 'Tenure Analysis', href: '/tenure', icon: Clock },
  { name: 'Exit Records', href: '/records', icon: TableProperties },
];

const SECONDARY_NAV: NavItem[] = [
  { name: 'Import Data', href: '/import', icon: UploadCloud },
  { name: 'Import History', href: '/import/history', icon: History },
  { name: 'Data Quality', href: '/quality', icon: ShieldCheck },
  { name: 'Reports', href: '/reports', icon: FileBarChart },
];

const TERTIARY_NAV: NavItem[] = [
  { name: 'Taxonomies', href: '/settings', icon: Settings },
  { name: 'Access & Roles', href: '/settings/access', icon: Shield },
  { name: 'Database Status', href: '/settings/database', icon: Database },
];

function NavLinkItem({
  item,
  isActive,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
        isActive
          ? 'bg-blue-50/90 text-blue-700 font-semibold shadow-xs dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900/40'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/50'
      }`}
    >
      {/* Active Left Indicator Pill */}
      {isActive && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-blue-600 dark:bg-blue-400 shadow-sm shadow-blue-500/50" />
      )}
      
      <Icon
        className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
          isActive
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'
        }`}
      />
      <span className="truncate tracking-tight">{item.name}</span>
      {item.badge && (
        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-400">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

function SidebarView({
  pathname,
  isDemoData,
  recordsCount,
  loadDemoData,
  clearData,
  theme,
  toggleTheme,
  onCloseMobile,
}: {
  pathname: string;
  isDemoData: boolean;
  recordsCount: number;
  loadDemoData: () => void;
  clearData: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onCloseMobile?: () => void;
}) {
  return (
    <div className="flex flex-col h-full select-none bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-xl border-r border-slate-200/80 dark:border-slate-800/80 transition-colors">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-200/70 dark:border-slate-800/70">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-blue-500/25 ring-1 ring-white/20 transition-transform duration-200 group-hover:scale-105">
              EL
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  EXITLENS
                </span>
                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold border border-blue-200/50 dark:border-blue-900/40">
                  v2.1
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Exit Intelligence Suite
              </p>
            </div>
          </Link>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60">
          <Factory className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
          <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate">
            Steel Strips Wheels Ltd.
          </span>
        </div>
      </div>

      {/* Mode Status Pill */}
      <div className="px-3 pt-3">
        {isDemoData ? (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 text-[11px] backdrop-blur-xs">
            <div className="flex items-center gap-2 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span>Demo Dataset Active</span>
            </div>
            <button
              onClick={clearData}
              title="Clear Demo Data"
              className="text-amber-700 dark:text-amber-400 hover:text-amber-950 dark:hover:text-amber-200 text-[10px] font-semibold underline underline-offset-2 transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-300 text-[11px] backdrop-blur-xs">
            <div className="flex items-center gap-2 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live Dataset ({recordsCount})</span>
            </div>
            <button
              onClick={loadDemoData}
              title="Load Demo Data"
              className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-emerald-200 text-[10px] font-semibold underline underline-offset-2 transition-colors cursor-pointer"
            >
              Load Demo
            </button>
          </div>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 px-3 py-3 overflow-y-auto space-y-4">
        {/* Core Analytics */}
        <div>
          <div className="px-2 pb-1.5 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
            Exit Analytics
          </div>
          <div className="space-y-0.5">
            {PRIMARY_NAV.map((item) => (
              <NavLinkItem
                key={item.href}
                item={item}
                isActive={pathname === item.href}
                onNavigate={onCloseMobile}
              />
            ))}
          </div>
        </div>

        {/* Data Operations */}
        <div>
          <div className="px-2 pb-1.5 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
            Data Operations
          </div>
          <div className="space-y-0.5">
            {SECONDARY_NAV.map((item) => (
              <NavLinkItem
                key={item.href}
                item={item}
                isActive={pathname === item.href}
                onNavigate={onCloseMobile}
              />
            ))}
          </div>
        </div>

        {/* Administration */}
        <div>
          <div className="px-2 pb-1.5 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
            Administration
          </div>
          <div className="space-y-0.5">
            {TERTIARY_NAV.map((item) => (
              <NavLinkItem
                key={item.href}
                item={item}
                isActive={pathname === item.href}
                onNavigate={onCloseMobile}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer Utility Bar */}
      <div className="p-3 border-t border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800/80 transition-all cursor-pointer"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? (
            <>
              <Moon className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[11px] font-medium">Dark Mode</span>
            </>
          ) : (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-medium">Light Mode</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 dark:text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>PG 14+</span>
        </div>
      </div>
    </div>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { isDemoData, loadDemoData, clearData, records, theme, toggleTheme } = useExitData();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Trigger Header */}
      <div className="md:hidden no-print flex items-center justify-between px-4 py-3 bg-white/90 dark:bg-[#0b0f19]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-linear-to-tr from-blue-600 to-sky-500 flex items-center justify-center text-white font-bold text-xs shadow-xs">
            EL
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
            EXITLENS
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            Steel Strips Wheels
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarView
          pathname={pathname}
          isDemoData={isDemoData}
          recordsCount={records.length}
          loadDemoData={loadDemoData}
          clearData={clearData}
          theme={theme}
          toggleTheme={toggleTheme}
          onCloseMobile={() => setMobileOpen(false)}
        />
      </div>

      {/* Desktop Persistent Sidebar */}
      <aside className="no-print hidden md:block w-64 shrink-0 h-screen sticky top-0 z-20">
        <SidebarView
          pathname={pathname}
          isDemoData={isDemoData}
          recordsCount={records.length}
          loadDemoData={loadDemoData}
          clearData={clearData}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      </aside>
    </>
  );
}
