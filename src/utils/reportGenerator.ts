import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ReportMember {
  name: string;
  amount_due: number;
  amount_paid: number;
  status: string;
  paid_on: string | null;
}

export interface MonthlyReport {
  month: number;
  year: number;
  members: ReportMember[];
  totalPaid: number;
  totalUnpaid: number;
  totalOverdue: number;
}

const MONTHS_URDU = [
  'جنوری', 'فروری', 'مارچ', 'اپریل', 'مئی', 'جون',
  'جولائی', 'اگست', 'ستمبر', 'اکتوبر', 'نومبر', 'دسمبر'
];

export const downloadExcelReport = (report: MonthlyReport) => {
  const monthName = MONTHS_URDU[report.month - 1];
  
  const data = report.members.map(member => ({
    'Member Name': member.name,
    'Amount Due': member.amount_due,
    'Amount Paid': member.amount_paid,
    'Status': member.status === 'paid' ? 'Paid' : member.status === 'overdue' ? 'Overdue' : 'Unpaid',
    'Payment Date': member.paid_on ? new Date(member.paid_on).toLocaleDateString() : 'N/A'
  }));

  // Add summary rows
  data.push({
    'Member Name': '',
    'Amount Due': '',
    'Amount Paid': '',
    'Status': '',
    'Payment Date': ''
  } as any);
  
  data.push({
    'Member Name': 'SUMMARY',
    'Amount Due': '',
    'Amount Paid': '',
    'Status': '',
    'Payment Date': ''
  } as any);
  
  data.push({
    'Member Name': 'Total Paid',
    'Amount Due': '',
    'Amount Paid': report.totalPaid,
    'Status': '',
    'Payment Date': ''
  } as any);
  
  data.push({
    'Member Name': 'Total Unpaid',
    'Amount Due': report.totalUnpaid,
    'Amount Paid': '',
    'Status': '',
    'Payment Date': ''
  } as any);
  
  data.push({
    'Member Name': 'Total Overdue',
    'Amount Due': report.totalOverdue,
    'Amount Paid': '',
    'Status': '',
    'Payment Date': ''
  } as any);

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `${monthName} ${report.year}`);
  
  XLSX.writeFile(wb, `PayFam_Report_${monthName}_${report.year}.xlsx`);
};

export const downloadPDFReport = (report: MonthlyReport) => {
  const monthName = MONTHS_URDU[report.month - 1];
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(16);
  doc.text(`Monthly Report - ${monthName} ${report.year}`, 14, 20);
  
  // Table
  const tableData = report.members.map(member => [
    member.name,
    `Rs. ${Number(member.amount_due).toLocaleString()}`,
    `Rs. ${Number(member.amount_paid).toLocaleString()}`,
    member.status === 'paid' ? 'Paid' : member.status === 'overdue' ? 'Overdue' : 'Unpaid',
    member.paid_on ? new Date(member.paid_on).toLocaleDateString() : 'N/A'
  ]);
  
  autoTable(doc, {
    head: [['Member Name', 'Amount Due', 'Amount Paid', 'Status', 'Payment Date']],
    body: tableData,
    startY: 30,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] },
    styles: { fontSize: 9 }
  });
  
  // Summary
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.text('Summary:', 14, finalY);
  doc.setFontSize(10);
  doc.text(`Total Paid: Rs. ${Number(report.totalPaid).toLocaleString()}`, 14, finalY + 7);
  doc.text(`Total Unpaid: Rs. ${Number(report.totalUnpaid).toLocaleString()}`, 14, finalY + 14);
  doc.text(`Total Overdue: Rs. ${Number(report.totalOverdue).toLocaleString()}`, 14, finalY + 21);
  
  doc.save(`PayFam_Report_${monthName}_${report.year}.pdf`);
};
