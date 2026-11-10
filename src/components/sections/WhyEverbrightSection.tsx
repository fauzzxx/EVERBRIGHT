import { brand } from '../../config/brand';
import { useCatalog } from '../../context/CatalogContext';
import { Reveal } from '../animations/Reveal';
import { TextReveal } from '../animations/TextReveal';

export function WhyEverbrightSection() {
  const { products, catalog } = useCatalog();
  const categories = new Set(products.map((p) => p.category)).size;
  const figures = [
    { value: String(products.length), note: 'designs in the catalogue' },
    { value: String(categories).padStart(2, '0'), note: 'product categories' },
    { value: String(catalog.divisions.length).padStart(2, '0'), note: 'specialised divisions' },
    { value: 'Direct', note: 'WhatsApp & in-store' },
  ];

  return (
    <section id="why" data-nav="light" className="relative bg-ivory text-midnight">
      <div className="gutter py-[clamp(6rem,12vw,11rem)]">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Reveal className="flex items-center gap-4">
              <span className="eyebrow text-emerald">{brand.why.eyebrow}</span>
              <span className="h-px w-16 bg-gold" />
            </Reveal>
            <TextReveal
              as="h2"
              text={'One standard,\nevery profession.'}
              className="display mt-8 text-[clamp(2.6rem,6.4vw,6.6rem)]"
            />
          </div>
        </div>

        <Reveal stagger={0.1} className="mt-20 grid border-t border-midnight/12 sm:grid-cols-2 xl:grid-cols-4">
          {brand.why.pillars.map((p, i) => (
            <article
              key={p.title}
              className="group relative border-b border-midnight/12 py-10 sm:px-8 sm:[&:nth-child(odd)]:pl-0 sm:[&:nth-child(odd)]:border-r xl:border-b-0 xl:border-r xl:px-8 xl:first:pl-0 xl:last:border-r-0"
            >
              <span className="font-serif text-sm italic text-gold">{['i.', 'ii.', 'iii.', 'iv.'][i]}</span>
              <p className="display mt-8 text-[clamp(3rem,4.6vw,4.4rem)] text-emerald transition-colors duration-500 group-hover:text-midnight">
                {figures[i].value}
              </p>
              <p className="eyebrow mt-2 text-[0.56rem] text-midnight/50">{figures[i].note}</p>
              <h3 className="mt-10 font-serif text-2xl font-normal">{p.title}</h3>
              <p className="mt-4 max-w-xs text-[0.94rem] leading-relaxed text-midnight/65">{p.body}</p>
              <span className="absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-gold transition-transform duration-700 ease-[var(--ease-silk)] group-hover:scale-x-100" />
            </article>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
