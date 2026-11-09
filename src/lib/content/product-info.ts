// EDITABLE CONTENT for product page accordions.
export const productInfo = (deliveryFee: number) => [
  { title: 'Shipping & Delivery', body: `We deliver across Pakistan for a flat fee of Rs. ${deliveryFee.toLocaleString('en-PK')}. Orders are usually delivered within 3 to 7 working days, and a tracking ID is shared so you can track your parcel. Your order is confirmed with you on WhatsApp after payment.` },
  { title: 'Payment', body: 'Full advance payment via Easypaisa or JazzCash. Account details are shown on the confirmation screen right after you place your order; submit your transaction ID there, then confirm on WhatsApp as the final step.' },
  { title: 'Care & Exchange', body: 'If your item arrives damaged during delivery, you may receive a 50% refund or request a replacement. Items received in good condition cannot be returned or exchanged without a valid reason. For care questions, message our WhatsApp support with your order number and we will help.' }
];
