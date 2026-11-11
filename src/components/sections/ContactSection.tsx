import { Copy, MapPin, MessageCircle } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { brand } from '../../config/brand';
import { contact, telHref } from '../../config/contact';
import { useCatalog } from '../../context/CatalogContext';
import { generalEnquiryMessage, mapsUrl, whatsappUrl } from '../../lib/enquiry';
import { Reveal } from '../animations/Reveal';
import { TextReveal } from '../animations/TextReveal';

const field =
  'w-full border-0 border-b border-ivory/20 bg-transparent px-0 py-3 text-[0.98rem] text-ivory placeholder:text-ivory/35 focus:border-gold focus:outline-none focus:ring-0 transition-colors';

function Detail({ label, value, pending }: { label: string; value?: string; pending: string }) {
  return (
    <div className="border-t border-ivory/12 py-5">
      <p className="eyebrow text-[0.56rem] text-gold">{label}</p>
      <p className={`mt-2 text-[1rem] ${value ? 'text-ivory' : 'text-ivory/40 italic font-serif text-lg'}`}>{value || pending}</p>
    </div>
  );
}

export function ContactSection() {
  const { catalog } = useCatalog();
  const [form, setForm] = useState({ name: '', organisation: '', division: '', quantity: '', message: '' });
  const [copied, setCopied] = useState(false);
  const message = generalEnquiryMessage(form);
  const wa = whatsappUrl(message);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (wa) window.open(wa, '_blank', 'noopener');
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* ignore */
    }
  };

  return (
    <section id="contact" data-nav="dark" className="weave relative bg-emerald text-ivory">
      <div className="gutter grid gap-16 py-[clamp(6rem,12vw,11rem)] lg:grid-cols-12">
        <div className="lg:col-span-6">
          <Reveal className="flex items-center gap-4">
            <span className="eyebrow text-gold">{brand.contact.eyebrow}</span>
            <span className="h-px w-16 bg-gold" />
          </Reveal>
          <TextReveal as="h2" text={"LET'S FIND\nTHE RIGHT FIT."} className="display mt-8 text-[clamp(2.8rem,6.6vw,7rem)]" />
          <Reveal>
            <p className="mt-10 max-w-md text-[1rem] leading-relaxed text-ivory/70">{brand.contact.body}</p>
          </Reveal>

          <Reveal className="mt-12 grid max-w-xl sm:grid-cols-2 sm:gap-x-8">
            <div className="border-t border-ivory/12 py-5 sm:col-span-2">
              <p className="eyebrow text-[0.56rem] text-gold">Call or WhatsApp · in order of priority</p>
              {contact.phones.length ? (
                <ol className="mt-3 space-y-3">
                  {contact.phones.map((ph, i) => (
                    <li key={ph.number} className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <span className="font-serif text-sm italic text-gold">{String(i + 1).padStart(2, '0')}</span>
                      <a href={telHref(ph.number)} className="link-line text-[1.05rem] text-ivory">
                        {ph.number}
                      </a>
                      <span className="text-[0.8rem] text-ivory/55">
                        {i === 0 && contact.contactName ? `${contact.contactName} · ` : ''}
                        {ph.note}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-2 font-serif text-lg italic text-ivory/40">Numbers to be added</p>
              )}
            </div>
            <Detail label="Email" value={contact.email} pending="Email to be added" />
            <Detail label="Official store" value={contact.storeAddress} pending="Address to be added" />
          </Reveal>
          <Reveal className="mt-8 flex flex-wrap gap-3">
            {mapsUrl ? (
              <a href={mapsUrl} target="_blank" rel="noreferrer" className="btn btn-outline-light">
                <MapPin size={16} strokeWidth={1.3} /> Visit official store
              </a>
            ) : (
              <button type="button" disabled className="btn btn-outline-light" title="Set VITE_MAPS_URL to enable">
                <MapPin size={16} strokeWidth={1.3} /> Visit official store · location pending
              </button>
            )}
          </Reveal>
        </div>

        <Reveal className="lg:col-span-5 lg:col-start-8">
          <form onSubmit={submit} className="border border-ivory/15 bg-midnight/40 p-6 backdrop-blur-sm sm:p-10" aria-labelledby="enquiry-title">
            <p id="enquiry-title" className="eyebrow text-gold">WhatsApp enquiry</p>
            <p className="mt-3 font-serif text-2xl font-light">Compose your message</p>
            <div className="mt-8 grid gap-6">
              <label className="block">
                <span className="eyebrow text-[0.55rem] text-ivory/50">Your name</span>
                <input className={field} value={form.name} onChange={set('name')} autoComplete="name" />
              </label>
              <label className="block">
                <span className="eyebrow text-[0.55rem] text-ivory/50">Organisation</span>
                <input className={field} value={form.organisation} onChange={set('organisation')} autoComplete="organization" />
              </label>
              <div className="grid gap-6 sm:grid-cols-2">
                <label className="block">
                  <span className="eyebrow text-[0.55rem] text-ivory/50">Division</span>
                  <select className={`${field} [&>option]:text-midnight`} value={form.division} onChange={set('division')}>
                    <option value="">Select…</option>
                    {catalog.divisions.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="eyebrow text-[0.55rem] text-ivory/50">Approx. quantity</span>
                  <input className={field} value={form.quantity} onChange={set('quantity')} inputMode="numeric" />
                </label>
              </div>
              <label className="block">
                <span className="eyebrow text-[0.55rem] text-ivory/50">Message</span>
                <textarea className={`${field} min-h-[110px] resize-y`} value={form.message} onChange={set('message')} />
              </label>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button type="submit" disabled={!wa} className="btn btn-gold" title={wa ? undefined : 'Set VITE_WHATSAPP_NUMBER to enable'}>
                <MessageCircle size={16} strokeWidth={1.3} /> Send on WhatsApp
              </button>
              <button type="button" onClick={copy} className="eyebrow flex items-center gap-2 text-[0.58rem] text-ivory/70 hover:text-gold">
                <Copy size={13} strokeWidth={1.3} /> {copied ? 'Copied' : 'Copy message'}
              </button>
            </div>
            {!wa && (
              <p className="mt-4 text-xs text-ivory/45">The WhatsApp number has not been configured yet, so sending is disabled.</p>
            )}
          </form>
        </Reveal>
      </div>
    </section>
  );
}
