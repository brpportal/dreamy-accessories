import { z } from 'zod';

const phone = z.string().trim().regex(/^\+?[0-9]{10,15}$/, 'Enter a valid phone number.');
export const businessSettingsSchema = z.object({
  store_name: z.string().trim().min(2).max(80),
  currency: z.literal('PKR'),
  delivery_fee: z.number().int().min(0).max(100000),
  free_delivery_enabled: z.boolean(),
  free_delivery_threshold: z.number().int().min(0).max(10000000).nullable(),
  whatsapp_order_number: z.union([phone, z.literal('')]),
  whatsapp_support_number: z.union([phone, z.literal('')]),
  whatsapp_display_name: z.string().trim().max(80),
  whatsapp_order_message: z.string().max(1500),
  whatsapp_support_message: z.string().max(500).default(''),
  whatsapp_button_enabled: z.boolean().default(true),
  easypaisa_enabled: z.boolean(),
  easypaisa_number: z.string().trim().regex(/^[0-9]{10,15}$/),
  easypaisa_account_name: z.string().trim().min(2).max(100),
  jazzcash_enabled: z.boolean(),
  jazzcash_number: z.string().trim().regex(/^[0-9]{10,15}$/),
  jazzcash_account_name: z.string().trim().min(2).max(100),
  contact_email: z.string().email().or(z.literal('')),
  instagram_url: z.string().url().or(z.literal('')),
  facebook_url: z.string().url().or(z.literal('')),
  announcement_text: z.string().max(180)
});
export type BusinessSettings = z.infer<typeof businessSettingsSchema>;
