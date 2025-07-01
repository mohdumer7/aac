// utils/exportToExcel.ts
import * as XLSX from "xlsx";


export function exportToExcel(data: any[]) {
  if (!data.length) return;

  const worksheet = XLSX.utils.json_to_sheet(data);
           // Create a new workbook
           const workbook = XLSX.utils.book_new();
           // Append the worksheet to the workbook
           XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
           // Write the workbook and trigger a download
           XLSX.writeFile(workbook, 'duplicate data.xlsx');

}
