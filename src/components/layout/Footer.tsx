import { ArrowUp } from 'lucide-react';
import { useLayoutEffect, useRef } from 'react';
import { contact, isConfigured } from '../../config/contact';
import { useCatalog } from '../../context/CatalogContext';
import { useSectionNav } from '../../hooks/useSectionNav';
import { prefersReducedMotion } from '../../hooks/useReducedMotion';
import { generalEnquiryMessage, mapsUrl, whatsappUrl } from '../../lib/enquiry';
import { gsap } from '../../lib/gsap';
import { Wordmark } from './Wordmark';

function Pending({ children }: { children: string }) {
  return (
    <span className="cursor-default text-ivory/35" title="Link not configured yet">
      {children}
    </span>
  );
}

export function Footer() {
  const { catalog } = useCatalog();
  const goTo = useSectionNav();
  const ref = useRef<HTMLElement>(null);
  const wa = whatsappUrl(generalEnquiryMessage({}));

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.footer-mark .mask > span',
        { y: 0, yPercent: 105 },
        {
          y: 0,
          yPercent: 0,
          duration: 1.6,
          stagger: 0.05,
          ease: 'expo.out',
          scrollTrigger: { trigger: '.footer-mark', start: 'top 95%', once: true },
        },
      );
      gsap.from('.footer-col', {
        y: 24,
        autoAlpha: 0,
        stagger: 0.08,
        duration: 1.1,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      });
      gsap.fromTo('.footer-rule', { scaleX: 0 }, { scaleX: 1, duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
    }, el);
    return () => ctx.revert();
  }, []);

  const linkCls = 'link-line text-ivory/75 transition-colors hover:text-ivory text-left';

  return (
    <footer ref={ref} data-nav="dark" className="weave relative overflow-hidden bg-midnight-deep text-ivory">
      <div className="gutter pt-24 pb-10">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="footer-col md:col-span-4">
            <Wordmark />
            <p className="mt-6 max-w-xs font-serif text-xl font-light italic leading-snug text-ivory/70">
              Professional uniforms. Distinctive identity. Quality in every detail.
            </p>
          </div>
          <div className="footer-col md:col-span-3">
            <p className="eyebrow mb-5 text-gold">Divisions</p>
            <ul className="space-y-3 text-sm">
              {catalog.divisions.map((d) => (
                <li key={d.id}>
                  <button type="button" className={linkCls} onClick={() => goTo(d.anchor)}>
                    {d.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="footer-col md:col-span-2">
            <p className="eyebrow mb-5 text-gold">Company</p>
            <ul className="space-y-3 text-sm">
              <li>
                <button type="button" className={linkCls} onClick={() => goTo('about')}>About Us</button>
              </li>
              <li>
                <button type="button" className={linkCls} onClick={() => goTo('why')}>Why Everbright</button>
              </li>
              <li>
                <button type="button" className={linkCls} onClick={() => goTo('contact')}>Contact</button>
              </li>
            </ul>
          </div>
          <div className="footer-col md:col-span-3">
            <p className="eyebrow mb-5 text-gold">Enquiries</p>
            <ul className="space-y-3 text-sm">
              <li>{wa ? <a className={linkCls} href={wa} target="_blank" rel="noreferrer">WhatsApp</a> : <Pending>WhatsApp — number pending</Pending>}</li>
              <li>{mapsUrl ? <a className={linkCls} href={mapsUrl} target="_blank" rel="noreferrer">Visit the official store</a> : <Pending>Store location — pending</Pending>}</li>
              <li>{isConfigured.email ? <a className={linkCls} href={`mailto:${contact.email}`}>{contact.email}</a> : <Pending>Email — pending</Pending>}</li>
            </ul>
            <p className="eyebrow mt-8 mb-4 text-gold">Follow</p>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {contact.socials.map((s) => (
                <li key={s.name}>
                  {s.url ? (
                    <a className={linkCls} href={s.url} target="_blank" rel="noreferrer">{s.name}</a>
                  ) : (
                    <Pending>{s.name}</Pending>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div aria-hidden="true" className="footer-mark mt-20 select-none overflow-hidden text-center">
          <span className="display block whitespace-nowrap text-[13.4vw] leading-[0.8] tracking-[0.02em] text-ivory/[0.07]">
            {'EVERBRIGHT'.split('').map((c, i) => (
              <span key={i} className="mask"><span>{c}</span></span>
            ))}
          </span>
        </div>

        <div className="footer-rule hairline mt-6 origin-left text-ivory" />
        <div className="mt-6 flex flex-col-reverse items-start justify-between gap-4 text-xs text-ivory/50 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Everbright Uniforms. All rights reserved.</p>
          <button type="button" onClick={() => goTo('top')} className="group flex items-center gap-3 eyebrow text-[0.6rem] text-ivory/70 hover:text-gold">
            Back to top
            <ArrowUp size={14} strokeWidth={1.2} className="transition-transform duration-500 group-hover:-translate-y-1" />
          </button>
        </div>
      </div>
    </footer>
  );
}
