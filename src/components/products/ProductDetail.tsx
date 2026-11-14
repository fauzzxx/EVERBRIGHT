import { ArrowLeft, ArrowRight, MapPin, MessageCircle, X } from 'lucide-react';
import { forwardRef, useState } from 'react';
import { useCatalog } from '../../context/CatalogContext';
import { contact, telHref } from '../../config/contact';
import { mapsUrl, productEnquiryMessage, productReference, whatsappUrl } from '../../lib/enquiry';
import type { Product } from '../../types/catalog';
import { ProductGallery } from './ProductGallery';
import { Construction } from './Construction';

interface Props {
  product: Product;
  mode: 'overlay' | 'page';
  imageIndex: number;
  onImageIndex(i: number): void;
  onClose?(): void;
  onNavigate(id: string): void;
  stageRef?: React.RefObject<HTMLDivElement | null>;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8.5rem_1fr] gap-4 border-t border-midnight/10 py-3.5 text-[0.92rem]">
      <dt className="eyebrow pt-0.5 text-[0.58rem] text-midnight/50">{label}</dt>
      <dd className="text-midnight/85">{children}</dd>
    </div>
  );
}

export const ProductDetail = forwardRef<HTMLDivElement, Props>(function ProductDetail(
  { product, mode, imageIndex, onImageIndex, onClose, onNavigate, stageRef },
  ref,
) {
  const { getDivision, categoryLabel, productsFor } = useCatalog();
  const division = getDivision(product.division);
  const catLabel = categoryLabel(product.category);
  const siblings = productsFor(product.division, product.category);
  const pos = siblings.findIndex((p) => p.id === product.id);
  const prev = siblings[(pos - 1 + siblings.length) % siblings.length];
  const next = siblings[(pos + 1) % siblings.length];
  const wa = whatsappUrl(productEnquiryMessage(product, division, catLabel));
  const [copied, setCopied] = useState(false);

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(productEnquiryMessage(product, division, catLabel));
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div
      ref={ref}
      className={`grid bg-paper text-midnight ${
        mode === 'overlay'
          ? 'h-full overflow-y-auto lg:grid-cols-[minmax(0,1.3fr)_minmax(26rem,1fr)] lg:grid-rows-1 lg:overflow-hidden'
          : 'min-h-[calc(100svh-var(--nav-h))] lg:grid-cols-[minmax(0,1.3fr)_minmax(26rem,1fr)]'
      }`}
    >
      <div className={`detail-media relative ${mode === 'overlay' ? 'h-[62svh] min-h-[340px] lg:h-full lg:min-h-0' : 'h-[62svh] lg:h-[calc(100svh-var(--nav-h))] lg:sticky lg:top-[var(--nav-h)]'}`}>
        <ProductGallery images={product.images} index={imageIndex} onIndex={onImageIndex} stageRef={stageRef} />
      </div>

      <div className={`detail-info relative flex flex-col ${mode === 'overlay' ? 'lg:overflow-y-auto' : ''}`} data-lenis-prevent>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            data-close
            className="group fixed right-4 top-4 z-20 flex items-center gap-3 text-midnight lg:absolute lg:right-8 lg:top-7"
            aria-label="Close product details"
          >
            <span className="eyebrow hidden text-[0.58rem] sm:inline">Close</span>
            <span className="grid h-11 w-11 place-items-center border border-midnight/20 bg-paper/90 backdrop-blur transition-colors group-hover:bg-midnight group-hover:text-ivory">
              <X size={18} strokeWidth={1.1} />
            </span>
          </button>
        )}

        <div className="detail-copy flex flex-1 flex-col px-6 pb-10 pt-10 sm:px-10 lg:px-12 lg:pt-16">
          <p className="eyebrow text-[0.6rem] text-emerald">{division.name}</p>
          <p className="eyebrow mt-3 text-[0.58rem] text-midnight/50">{productReference(product, catLabel)}</p>
          <h2 id="product-title" className="mt-6 pr-14 font-serif text-[clamp(2.1rem,3.6vw,3.4rem)] font-light leading-[1.02]">
            {product.name}
          </h2>
          {product.description && <p className="mt-6 max-w-prose text-[0.98rem] leading-relaxed text-midnight/75">{product.description}</p>}

          <dl className="mt-9 border-b border-midnight/10">
            <Row label="Category">{catLabel}</Row>
            {product.modelNo && <Row label="Model no.">{product.modelNo}</Row>}
            {product.dimensions && <Row label="Dimensions">{product.dimensions}</Row>}
            {product.colourway && <Row label="Colourway">{product.colourway}</Row>}
            {!product.layers && (
              <>
                <Row label="Sizes">
                  {product.availableSizes.length
                    ? product.availableSizes.join(', ')
                    : 'Not listed in the catalogue — ask us for the size range.'}
                </Row>
                <Row label="Colours">
                  {product.availableColours.length
                    ? product.availableColours.join(', ')
                    : 'Shown as pictured. Ask us about other colour options.'}
                </Row>
              </>
            )}
            {product.features.length > 0 && (
              <Row label="Details">
                <ul className="space-y-1">
                  {product.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </Row>
            )}
            <Row label="Views">{product.images.map((i) => i.caption).join(' · ')}</Row>
          </dl>

          {product.layers && product.layers.length > 0 && <Construction layers={product.layers} />}

          <div className="mt-9 grid gap-3 sm:grid-cols-2">
            {wa ? (
              <a href={wa} target="_blank" rel="noreferrer" className="btn btn-gold">
                <MessageCircle size={16} strokeWidth={1.3} /> WhatsApp enquiry
              </a>
            ) : (
              <button type="button" disabled className="btn btn-gold" title="Set VITE_WHATSAPP_NUMBER to enable">
                <MessageCircle size={16} strokeWidth={1.3} /> WhatsApp enquiry
              </button>
            )}
            {mapsUrl ? (
              <a href={mapsUrl} target="_blank" rel="noreferrer" className="btn btn-outline-dark">
                <MapPin size={16} strokeWidth={1.3} /> Visit official store
              </a>
            ) : (
              <button type="button" disabled className="btn btn-outline-dark" title="Set VITE_MAPS_URL to enable">
                <MapPin size={16} strokeWidth={1.3} /> Visit official store
              </button>
            )}
          </div>
          {(contact.storeAddress || contact.phones.length > 0) && (
            <div className="mt-5 space-y-1.5 text-[0.82rem] leading-relaxed text-midnight/65">
              {contact.storeAddress && (
                <p>
                  <span className="eyebrow mr-2 text-[0.55rem] text-midnight/45">Store</span>
                  {contact.storeAddress}
                </p>
              )}
              {contact.phones[0] && (
                <p>
                  <span className="eyebrow mr-2 text-[0.55rem] text-midnight/45">Call</span>
                  <a href={telHref(contact.phones[0].number)} className="link-line text-midnight">
                    {contact.phones[0].number}
                  </a>
                  {contact.contactName ? ` · ${contact.contactName}` : ''}
                </p>
              )}
            </div>
          )}
          {(!wa || !mapsUrl) && (
            <p className="mt-3 text-xs leading-relaxed text-midnight/50">
              {!wa && 'WhatsApp number not yet configured. '}
              {!mapsUrl && 'Store location not yet configured. '}
              {!wa && (
                <button type="button" onClick={copyMessage} className="link-line text-midnight/70">
                  {copied ? 'Enquiry text copied' : 'Copy enquiry text'}
                </button>
              )}
            </p>
          )}

          {siblings.length > 1 && (
            <div className="mt-auto grid grid-cols-2 gap-4 pt-12">
              <button type="button" onClick={() => onNavigate(prev.id)} className="group text-left">
                <span className="eyebrow flex items-center gap-2 text-[0.56rem] text-midnight/50">
                  <ArrowLeft size={12} className="transition-transform group-hover:-translate-x-1" /> Previous
                </span>
                <span className="mt-2 block font-serif text-lg leading-tight group-hover:text-emerald">{prev.name}</span>
              </button>
              <button type="button" onClick={() => onNavigate(next.id)} className="group text-right">
                <span className="eyebrow flex items-center justify-end gap-2 text-[0.56rem] text-midnight/50">
                  Next <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                </span>
                <span className="mt-2 block font-serif text-lg leading-tight group-hover:text-emerald">{next.name}</span>
              </button>
            </div>
          )}
          <p className="mt-8 text-[0.68rem] leading-relaxed text-midnight/40">
            Catalogue source: {product.sourcePdf.replace(/\.pdf$/i, '')}, page {product.sourcePage.join(', ')}
          </p>
        </div>
      </div>
    </div>
  );
});
