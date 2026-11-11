/**
 * Central contact configuration.
 *
 * Every value can be set here or through environment variables (.env.local):
 *   VITE_WHATSAPP_NUMBER   international format, digits only, e.g. 9715XXXXXXXX
 *   VITE_MAPS_URL          the official Google Maps link for the store
 *   VITE_STORE_ADDRESS     store address shown in the contact section
 *   VITE_CONTACT_EMAIL     public enquiry email
 *   VITE_CONTACT_PHONE     public phone number as it should be displayed
 *
 * Empty values are treated as "not configured": the related buttons render in a
 * clearly disabled state instead of pointing to a fake destination.
 */
const env = import.meta.env;

export const contact = {
  whatsappNumber: (env.VITE_WHATSAPP_NUMBER as string | undefined) ?? '',
  mapsUrl: (env.VITE_MAPS_URL as string | undefined) ?? '',
  storeAddress: (env.VITE_STORE_ADDRESS as string | undefined) ?? '',
  email: (env.VITE_CONTACT_EMAIL as string | undefined) ?? '',
  phone: (env.VITE_CONTACT_PHONE as string | undefined) ?? '',
  /** Name of the first-priority contact person */
  contactName: (env.VITE_CONTACT_NAME as string | undefined) ?? '',
  /** Phone numbers in priority order. Only the first is also on WhatsApp. */
  phones: [
    { number: (env.VITE_CONTACT_PHONE as string | undefined) ?? '', note: 'Calls & WhatsApp' },
    { number: (env.VITE_CONTACT_PHONE_2 as string | undefined) ?? '', note: 'Calls only' },
    { number: (env.VITE_CONTACT_PHONE_3 as string | undefined) ?? '', note: 'Calls only' },
  ].filter((p) => p.number.trim().length > 0),
  /** Social profiles — leave a URL empty to show the network as "coming soon". */
  socials: [
    { name: 'Instagram', url: (env.VITE_INSTAGRAM_URL as string | undefined) ?? '' },
    { name: 'Facebook', url: (env.VITE_FACEBOOK_URL as string | undefined) ?? '' },
    { name: 'LinkedIn', url: (env.VITE_LINKEDIN_URL as string | undefined) ?? '' },
  ],
} as const;

/** tel: link for a displayed phone number */
export const telHref = (n: string) => `tel:+${n.replace(/\D/g, '')}`;

export const isConfigured = {
  whatsapp: contact.whatsappNumber.replace(/\D/g, '').length >= 8,
  maps: /^https?:\/\//.test(contact.mapsUrl),
  email: contact.email.includes('@'),
  phone: contact.phone.trim().length > 0,
  address: contact.storeAddress.trim().length > 0,
};
