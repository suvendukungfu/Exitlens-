'use client';

import React from 'react';
import { useExitData } from '@/lib/store/ExitDataContext';
import { TopHeader } from '@/components/layout/TopHeader';
import { RecordsTable } from '@/components/records/RecordsTable';

export default function RecordsPage() {
  const { filteredRecords, showEmployeeNames, setShowEmployeeNames } = useExitData();

  return (
    <div className="pb-12">
      <TopHeader
        title="Exit Records Register"
        subtitle="Individual employee separation dossiers, notice period logs, and exit interview audit records."
      />

      <div className="p-6 max-w-7xl mx-auto space-y-4">
        <RecordsTable
          records={filteredRecords}
          showEmployeeNames={showEmployeeNames}
          setShowEmployeeNames={setShowEmployeeNames}
        />
      </div>
    </div>
  );
}
