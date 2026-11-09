// EDITABLE CONTENT: change the wording here. Keep it limited to policies the store has actually stated.
export const faqItems = (deliveryFee: number) => [
  { q: 'Do you deliver across Pakistan?', a: `Yes. We deliver nationwide for a flat delivery fee of Rs. ${deliveryFee.toLocaleString('en-PK')}. The exact amount is shown at checkout.` },
  { q: 'How do I pay?', a: 'We accept full advance payment through Easypaisa or JazzCash. After you place your order, the store account details are shown and you share your transaction details with us.' },
  { q: 'How does WhatsApp order confirmation work?', a: 'Once your order is saved, WhatsApp opens with your order summary so we can confirm it with you directly.' },
  { q: 'How can I track my order?', a: 'Open the Track Order page and enter your order number and phone number to see the latest status.' },
  { q: 'Can I ask about an exchange or return?', a: 'Please message our WhatsApp support with your order number and we will guide you. We handle each enquiry individually.' },
  { q: 'Can I leave a review?', a: 'Yes, verified buyers can review a product from its page using their order number and checkout phone. Reviews appear after store approval.' }
];
