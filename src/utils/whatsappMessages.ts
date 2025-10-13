export const generatePaymentMessage = (
  name: string,
  month: string,
  amount: number,
  status: 'paid' | 'unpaid' | 'overdue'
): string => {
  const formattedAmount = Number(amount).toLocaleString();
  
  switch (status) {
    case 'paid':
      return `محترم ${name}، آپ کی ${month} کی ادائیگی ${formattedAmount} روپے وصول ہو گئی ہے۔ شکریہ۔`;
    case 'unpaid':
      return `محترم ${name}، آپ کی ${month} کی ادائیگی ${formattedAmount} روپے ابھی باقی ہے، براہ کرم جلد از جلد ادا کریں۔`;
    case 'overdue':
      return `محترم ${name}، آپ کی ${month} کی ادائیگی کی مدت ختم ہو چکی ہے، براہ کرم فوری طور پر ${formattedAmount} روپے ادا کریں۔`;
    default:
      return `محترم ${name}، آپ کی ${month} کی ادائیگی ${formattedAmount} روپے کے بارے میں یاد دہانی۔`;
  }
};

export const sendWhatsAppMessage = (phoneNumber: string, message: string) => {
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
};
