import type { Metadata } from 'next';
import './globals.css';
import { ExitDataProvider } from '@/lib/store/ExitDataContext';
import { DevAuthProvider } from '@/lib/auth/DevAuthContext';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { FilterBar } from '@/components/layout/FilterBar';

export const metadata: Metadata = {
  title: 'ExitLens — Employee Exit Intelligence | Steel Strips Wheels',
  description:
    'Enterprise employee exit analytics and attrition intelligence platform for Steel Strips Wheels manufacturing facilities.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased scroll-smooth">
      <body className="h-full flex flex-col bg-[#f8fafc] text-slate-900 font-sans selection:bg-blue-600 selection:text-white relative">
        {/* Subtle Ambient Depth Mesh */}
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.05),rgba(255,255,255,0))] z-0" />
        <DevAuthProvider>
          <ExitDataProvider>
            <div className="flex h-full w-full overflow-hidden relative z-10">
              {/* Sidebar Navigation */}
              <AppSidebar />

              {/* Main Application Area */}
              <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
                {/* Filter Bar */}
                <FilterBar />

                {/* Scrollable Page Body */}
                <main className="flex-1 overflow-y-auto">
                  {children}
                </main>
              </div>
            </div>
          </ExitDataProvider>
        </DevAuthProvider>
      </body>
    </html>
  );
}
