// EDITABLE CONTENT for product page accordions.
export const productInfo = (deliveryFee: number) => [
  { title: 'Shipping & Delivery', body: `We deliver across Pakistan for a flat fee of Rs. ${deliveryFee.toLocaleString('en-PK')}. Your order is confirmed with you on WhatsApp after you place it.` },
  { title: 'Payment', body: 'Full advance payment via Easypaisa or JazzCash. Account details are shown after you place your order, then share your transaction ID with us.' },
  { title: 'Care & Exchange', body: 'For care questions or any exchange enquiry, message our WhatsApp support with your order number and we will help.' }
];
