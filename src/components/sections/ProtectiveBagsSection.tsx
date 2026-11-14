import { MessageCircle } from 'lucide-react';
import { useCatalog } from '../../context/CatalogContext';
import { generalEnquiryMessage, whatsappUrl } from '../../lib/enquiry';
import { Reveal } from '../animations/Reveal';
import { DivisionGallery } from '../products/DivisionGallery';
import { DivisionCatalogue } from '../products/DivisionCatalogue';
import { DivisionSection } from './DivisionSection';
import { FireLayersBand } from './FireLayersBand';

/**
 * EVERBRIGHT FIRE AND SAFETY. No catalogue has been supplied yet, so the
 * chapter tells the division's story without inventing models or specifications.
 * As soon as bag products exist in the catalogue data, the grid renders instead.
 */
/** Story + placeholders shown while no Fire and Safety products exist. */
export function FireSafetyEmptyState() {
  const { getDivision } = useCatalog();
  const division = getDivision('bags');
  const wa = whatsappUrl(generalEnquiryMessage({ division: division.name, message: 'I would like to know more about your fire and safety products.' }));
  return (
    <div className="grid gap-14 lg:grid-cols-12">
      <Reveal className="lg:col-span-4">
        <p className="eyebrow text-gold">The collection</p>
        <p className="mt-6 font-serif text-[clamp(1.5rem,2.2vw,2rem)] font-light leading-snug text-ivory">
          Fire and safety products, including leather protective document bags.
        </p>
        <div className="mt-10 space-y-6 border-t border-ivory/12 pt-8 text-[0.95rem] leading-relaxed text-ivory/65">
          <p>
            Product photographs, model names, materials and construction details will be published here as soon as
            the fire and safety catalogue is supplied.
          </p>
          <p>
            Fire-resistance information will only be shown where it is supported by verified documentation.
          </p>
        </div>
        <div className="mt-10">
          {wa ? (
            <a href={wa} target="_blank" rel="noreferrer" className="btn btn-gold">
              <MessageCircle size={16} strokeWidth={1.3} /> Ask about fire and safety
            </a>
          ) : (
            <button type="button" disabled className="btn btn-gold" title="Set VITE_WHATSAPP_NUMBER to enable">
              <MessageCircle size={16} strokeWidth={1.3} /> Ask about fire and safety
            </button>
          )}
        </div>
      </Reveal>

      <Reveal stagger={0.12} className="grid grid-cols-6 items-start gap-4 sm:gap-6 lg:col-span-7 lg:col-start-6">
        {[
          'col-span-6 sm:col-span-4 aspect-[4/3]',
          'col-span-3 sm:col-span-2 aspect-[3/4] sm:mt-[45%]',
          'col-span-3 sm:col-span-2 sm:col-start-2 aspect-[1/1]',
        ].map((cls, i) => (
          <div key={i} className={`print ${cls}`}>
            <div className="absolute inset-[6%] border border-midnight/10" />
            <div className="absolute inset-0 grid place-items-center p-4 text-center">
              <div>
                <p className="font-serif text-lg italic text-midnight/45">Photograph pending</p>
                <p className="eyebrow mt-2 text-[0.5rem] text-midnight/35">Fire and safety catalogue</p>
              </div>
            </div>
          </div>
        ))}
      </Reveal>
    </div>
  );
}

export function ProtectiveBagsSection() {
  const { productsFor, getDivision } = useCatalog();
  const division = getDivision('bags');
  const hasProducts = productsFor('bags').length > 0;

  return (
    <DivisionSection divisionId="bags" tone="midnight">
      {hasProducts ? (
        <>
          <FireLayersBand />
          <DivisionCatalogue division={division} tone="dark" />
          <DivisionGallery divisionId="bags" tone="dark" />
        </>
      ) : (
        <FireSafetyEmptyState />
      )}
    </DivisionSection>
  );
}
