// EDITABLE CONTENT: change the wording here. Keep it limited to policies the store has actually stated.
export const faqItems = (deliveryFee: number) => [
  { q: 'Do you deliver across Pakistan?', a: `Yes. We deliver nationwide for a flat delivery fee of Rs. ${deliveryFee.toLocaleString('en-PK')}. Orders are usually delivered within 3 to 7 working days, and a tracking ID is shared so you can track your parcel easily.` },
  { q: 'How do I pay?', a: 'We accept full advance payment through Easypaisa or JazzCash. Right after you place your order, the confirmation screen shows the store account details; you transfer the amount there and submit your transaction ID on the same screen.' },
  { q: 'How does WhatsApp order confirmation work?', a: 'WhatsApp is the final step. After you place your order and submit your payment details, a WhatsApp button appears with your full order and payment summary ready to send, so we can confirm everything with you directly.' },
  { q: 'How can I track my order?', a: 'Open the Track Order page and enter your order number and phone number to see the latest status.' },
  { q: 'Can I ask about an exchange or return?', a: 'If your order arrives damaged during delivery, you may receive a 50% refund or request a replacement. Once your order is delivered and received in good condition, it cannot be returned or exchanged without a valid reason. Message our WhatsApp support with your order number and we will help.' },
  { q: 'Can I leave a review?', a: 'Yes, verified buyers can review a product from its page using their order number and checkout phone. Reviews appear after store approval.' }
];
