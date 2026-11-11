/**
 * Brand copy and identity settings.
 *
 * Copy marked EDITABLE is neutral starter text written for this site: it makes no
 * claims about company history, years in business, certifications or statistics.
 * Replace it with the owner's own words when available.
 */
export const brand = {
  name: 'Everbright Uniforms',
  heroTop: 'EVERBRIGHT',
  heroBottom: 'UNIFORM',
  tagline: 'DRESSED FOR PURPOSE.',
  supportLine: 'Professional uniforms. Distinctive identity. Quality in every detail.',
  /** Path to a logo file in /public (e.g. '/brand/logo.svg'). Empty = typographic wordmark. */
  logo: '',
  /** Show products flagged `reviewRequired` in the catalogue. */
  showReviewRequiredProducts: true,

  about: {
    eyebrow: 'About Everbright',
    headline: 'QUALITY IN EVERY DETAIL.',
    // EDITABLE — company introduction (facts: three divisions and the catalogued range)
    introduction:
      'Everbright Uniforms dresses working teams through three dedicated divisions — Everbright Uniforms, Everbright Police Store and Everbright Fire and Safety — each with its own catalogue of designs.',
    blocks: [
      {
        title: 'Brand philosophy',
        // EDITABLE
        body: 'A uniform is the first thing people read about a team. We treat it as identity: colour, cut and finish chosen so that a team looks composed, recognisable and ready.',
      },
      {
        title: 'Quality commitment',
        // EDITABLE
        body: 'Every design is shown front and back, exactly as it is made, so that what you choose from the catalogue is what your team will wear.',
      },
      {
        title: 'Professional product range',
        // EDITABLE (the counts beside this block are calculated from the live catalogue)
        body: 'From security shirts, guard uniforms, caps and rank insignia to chef coats, aprons, housekeeping shirts, safari suits and waistcoats.',
      },
    ],
  },

  why: {
    eyebrow: 'Why Everbright',
    headline: 'One standard, every profession.',
    pillars: [
      {
        title: 'Professional product range',
        // EDITABLE
        body: 'Shirts, full uniforms, outer layers and accessories designed to work together as one identity.',
      },
      {
        title: 'Multiple industry categories',
        // EDITABLE
        body: 'Security and guarding, kitchens and cafés, housekeeping, corporate and service teams.',
      },
      {
        title: 'Product quality',
        // EDITABLE
        body: 'Clean construction, considered colour pairings and branding placed with care.',
      },
      {
        title: 'Direct customer assistance',
        // EDITABLE
        body: 'Speak to the team on WhatsApp or visit the official store to discuss sizes, quantities and availability.',
      },
    ],
  },

  contact: {
    eyebrow: 'Contact',
    headline: "LET'S FIND THE RIGHT FIT.",
    // EDITABLE
    body: 'Tell us what your team does and how many people you are dressing. We will help you choose designs, colours and sizes from the catalogue.',
  },
} as const;
