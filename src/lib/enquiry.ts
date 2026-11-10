import { contact, isConfigured } from '../config/contact';
import type { Division, Product } from '../types/catalog';

/** Build a WhatsApp click-to-chat URL, or null when no number is configured. */
export function whatsappUrl(message: string): string | null {
  if (!isConfigured.whatsapp) return null;
  const number = contact.whatsappNumber.replace(/\D/g, '');
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function productReference(product: Product, categoryLabel: string): string {
  return [categoryLabel, product.series, product.catalogueNo ? `No. ${product.catalogueNo}` : null]
    .filter(Boolean)
    .join(' · ');
}

export function productEnquiryMessage(product: Product, division: Division, categoryLabel: string): string {
  return [
    'Hello, I am interested in the following product from Everbright Uniforms.',
    '',
    `Product: ${product.name}`,
    `Division: ${division.name}`,
    `Reference: ${productReference(product, categoryLabel)}`,
    '',
    'Please share more details about its availability, sizes and pricing.',
    'Thank you.',
  ].join('\n');
}

export interface GeneralEnquiry {
  name?: string;
  organisation?: string;
  division?: string;
  quantity?: string;
  message?: string;
}

export function generalEnquiryMessage(e: GeneralEnquiry): string {
  const lines = ['Hello, I would like to enquire with Everbright Uniforms.', ''];
  if (e.name) lines.push(`Name: ${e.name}`);
  if (e.organisation) lines.push(`Organisation: ${e.organisation}`);
  if (e.division) lines.push(`Division: ${e.division}`);
  if (e.quantity) lines.push(`Approximate quantity: ${e.quantity}`);
  if (e.message) lines.push('', e.message);
  lines.push('', 'Thank you.');
  return lines.join('\n');
}

export const mapsUrl = isConfigured.maps ? contact.mapsUrl : null;
