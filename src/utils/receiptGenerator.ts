export interface ReceiptData {
  memberName: string;
  amount: number;
  paymentDate: string;
  month: string;
  year: number;
  status: string;
  receiptNumber: string;
}

export const generateReceiptMessage = (data: ReceiptData): string => {
  const statusText = data.status === 'paid' ? 'ادا شدہ' : 'باقی';
  
  return `
🧾 *رسید*

ممبر کا نام: ${data.memberName}
ماہ: ${data.month} ${data.year}
رقم: Rs. ${Number(data.amount).toLocaleString()}
تاریخ: ${new Date(data.paymentDate).toLocaleDateString('ur-PK')}
حالت: ${statusText}
رسید نمبر: ${data.receiptNumber}

شکریہ
PayFam Link
  `.trim();
};

export const generateReceiptNumber = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `RCP-${timestamp}-${random}`;
};
