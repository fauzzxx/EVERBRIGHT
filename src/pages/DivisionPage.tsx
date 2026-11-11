import { MapPin, MessageCircle, Phone } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { Reveal } from '../components/animations/Reveal';
import { TextileBackground, type TextileController } from '../components/animations/TextileBackground';
import { TextReveal } from '../components/animations/TextReveal';
import { DivisionCatalogue } from '../components/products/DivisionCatalogue';
import { FireSafetyEmptyState } from '../components/sections/ProtectiveBagsSection';
import { contact, telHref } from '../config/contact';
import { useCatalog } from '../context/CatalogContext';
import { divisionNavOrder } from '../data/navigation';
import { useSmoothScroll } from '../hooks/useSmoothScroll';
import { generalEnquiryMessage, mapsUrl, whatsappUrl } from '../lib/enquiry';
import { ScrollTrigger } from '../lib/gsap';
import type { DivisionId } from '../types/catalog';

const TONE = {
  police: { section: 'bg-graphite text-ivory', nav: 'dark', catalogue: 'dark' },
  uniform: { section: 'bg-paper text-midnight', nav: 'light', catalogue: 'light' },
  bags: { section: 'bg-midnight text-ivory weave', nav: 'dark', catalogue: 'dark' },
} as const;

/** A dedicated page for one division: title banner, its full catalogue and enquiry options. */
export function DivisionPage({ divisionId }: { divisionId: DivisionId }) {
  const { getDivision, productsFor, categoriesFor } = useCatalog();
  const { scrollTo } = useSmoothScroll();
  const division = getDivision(divisionId);
  const count = productsFor(divisionId).length;
  const cats = categoriesFor(divisionId).length;
  const tone = TONE[divisionId];
  const ctrl = useRef<TextileController>({ reveal: 1, threads: 0.5, sweep: 1, dim: 0.25 });
  const wa = whatsappUrl(generalEnquiryMessage({ division: division.name }));
  const others = divisionNavOrder.filter((id) => id !== divisionId).map((id) => getDivision(id));

  useEffect(() => {
    scrollTo(0, { immediate: true });
    document.title = `${division.name} — Everbright`;
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 120);
    return () => {
      window.clearTimeout(t);
      document.title = 'Everbright Uniforms — Dressed for Purpose';
    };
  }, [division.name, scrollTo]);

  return (
    <main key={divisionId}>
      {/* Title banner */}
      <section data-nav="hero" className="relative flex min-h-[78svh] items-end overflow-hidden bg-midnight text-ivory">
        <TextileBackground controller={ctrl} className="absolute inset-0 h-full w-full" />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,28,23,0.85),rgba(5,28,23,0.15)_60%)]" />
        <div className="gutter relative w-full pb-[clamp(3rem,8vh,6rem)] pt-[calc(var(--nav-h)+3rem)]">
          <Reveal className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="eyebrow text-gold">Division {division.index}</span>
            <span className="h-px w-16 bg-gold" />
            <span className="eyebrow text-ivory/60">Everbright</span>
          </Reveal>
          <TextReveal
            as="h1"
            onMount
            delay={0.15}
            text={division.name}
            className="display mt-8 max-w-[14ch] text-[clamp(2.8rem,8.4vw,8.4rem)] tracking-[0.02em]"
          />
          <div className="mt-10 grid gap-8 border-t border-ivory/15 pt-8 md:grid-cols-12">
            <Reveal className="md:col-span-5">
              <p className="font-serif text-[clamp(1.3rem,2vw,1.7rem)] font-light italic leading-snug text-gold-soft">
                {division.headline.replace('\n', ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase())}
              </p>
              <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-ivory/70">{division.intro}</p>
            </Reveal>
            <Reveal className="flex items-end gap-10 md:col-span-3 md:col-start-7">
              {count > 0 ? (
                <>
                  <div>
                    <p className="display text-5xl text-gold">{String(count).padStart(2, '0')}</p>
                    <p className="eyebrow mt-2 text-[0.56rem] text-ivory/55">Designs</p>
                  </div>
                  <div>
                    <p className="display text-5xl text-gold">{String(cats).padStart(2, '0')}</p>
                    <p className="eyebrow mt-2 text-[0.56rem] text-ivory/55">Categories</p>
                  </div>
                </>
              ) : (
                <p className="font-serif text-xl italic text-gold">Catalogue in preparation</p>
              )}
            </Reveal>
            <Reveal className="flex flex-col items-start gap-3 md:col-span-3 md:col-start-10 md:items-end">
              {count > 0 && (
                <button type="button" onClick={() => scrollTo('catalogue', { offset: -40 })} className="btn btn-gold">
                  Browse the catalogue
                </button>
              )}
              {wa && (
                <a href={wa} target="_blank" rel="noreferrer" className="btn btn-outline-light">
                  <MessageCircle size={15} strokeWidth={1.3} /> WhatsApp enquiry
                </a>
              )}
            </Reveal>
          </div>
        </div>
      </section>

      {/* Catalogue */}
      <section id="catalogue" data-nav={tone.nav} className={tone.section}>
        <div className="gutter pt-[clamp(4rem,8vw,7rem)] pb-[clamp(5rem,9vw,8rem)]">
          {count > 0 ? <DivisionCatalogue division={division} tone={tone.catalogue} /> : <FireSafetyEmptyState />}
        </div>
      </section>

      {/* How to buy + other divisions */}
      <section data-nav="dark" className="weave bg-emerald text-ivory">
        <div className="gutter grid gap-12 py-[clamp(4rem,8vw,7rem)] lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p className="eyebrow text-gold">How to order</p>
            <p className="mt-5 font-serif text-[clamp(1.8rem,3.2vw,2.8rem)] font-light leading-tight">
              Choose a design, send us a WhatsApp enquiry, or visit the store.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {wa && (
                <a href={wa} target="_blank" rel="noreferrer" className="btn btn-gold">
                  <MessageCircle size={15} strokeWidth={1.3} /> WhatsApp
                </a>
              )}
              {mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noreferrer" className="btn btn-outline-light">
                  <MapPin size={15} strokeWidth={1.3} /> Visit official store
                </a>
              )}
            </div>
            {contact.storeAddress && <p className="mt-6 max-w-md text-sm leading-relaxed text-ivory/60">{contact.storeAddress}</p>}
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <p className="eyebrow text-gold">Call · in order of priority</p>
            <ol className="mt-5 space-y-3">
              {contact.phones.map((ph, i) => (
                <li key={ph.number} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-ivory/12 pt-3">
                  <span className="font-serif text-sm italic text-gold">{String(i + 1).padStart(2, '0')}</span>
                  <a href={telHref(ph.number)} className="link-line flex items-center gap-2 text-[1.05rem]">
                    <Phone size={13} strokeWidth={1.3} /> {ph.number}
                  </a>
                  <span className="text-[0.8rem] text-ivory/55">
                    {i === 0 && contact.contactName ? `${contact.contactName} · ` : ''}
                    {ph.note}
                  </span>
                </li>
              ))}
            </ol>
            <p className="eyebrow mt-10 text-gold">Other divisions</p>
            <div className="mt-4 grid gap-2">
              {others.map((d) => (
                <Link key={d.id} to={d.path} className="group flex items-center justify-between border-t border-ivory/12 pt-3">
                  <span className="font-serif text-xl font-light transition-colors group-hover:text-gold">{d.name}</span>
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
