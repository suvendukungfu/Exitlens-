import * as XLSX from 'xlsx';
import { RawExcelRow } from '../types';

export async function parseExcelFile(file: File): Promise<RawExcelRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        // Find primary sheet
        let sheetName = workbook.SheetNames[0];
        const preferred = workbook.SheetNames.find(
          (name) => name.toLowerCase().includes('exit') || name.toLowerCase().includes('register')
        );
        if (preferred) {
          sheetName = preferred;
        }

        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) {
          throw new Error('No valid sheet found in uploaded Excel workbook.');
        }

        const rows = XLSX.utils.sheet_to_json<RawExcelRow>(worksheet, {
          defval: '',
          raw: false,
          dateNF: 'yyyy-mm-dd',
        });

        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}
