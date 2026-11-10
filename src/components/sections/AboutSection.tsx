import { brand } from '../../config/brand';
import { useCatalog } from '../../context/CatalogContext';
import { ImageReveal, Reveal } from '../animations/Reveal';
import { TextReveal } from '../animations/TextReveal';

const ABOUT_IMAGES = ['security-shirts-04-royal-blue', 'chef-coat-sets-01-black-red', 'waistcoats-07-dark-blue-stripe'];

export function AboutSection() {
  const { products, catalog, getProduct, categoryLabel } = useCatalog();
  const categoriesWithProducts = new Set(products.map((p) => p.category)).size;
  const marquee = catalog.categories.map((c) => c.label);
  const shots = ABOUT_IMAGES.map((id) => getProduct(id)).filter((p): p is NonNullable<typeof p> => Boolean(p));

  const stats = [
    { value: String(products.length), label: 'Catalogue designs' },
    { value: String(categoriesWithProducts).padStart(2, '0'), label: 'Product categories' },
    { value: String(catalog.divisions.length).padStart(2, '0'), label: 'Dedicated divisions' },
  ];

  return (
    <section id="about" data-nav="light" className="relative bg-ivory text-midnight">
      {/* Category marquee — a quiet seam between the hero and the story */}
      <div className="overflow-hidden border-b border-midnight/10 py-5" aria-hidden="true">
        <div className="marquee-track flex w-max">
          {[0, 1].map((k) => (
            <div key={k} className="flex shrink-0 items-center">
              {marquee.map((m) => (
                <span key={`${k}-${m}`} className="flex items-center whitespace-nowrap font-serif text-xl italic font-light text-midnight/55">
                  <span className="px-8">{m}</span>
                  <span className="h-1 w-1 rotate-45 bg-gold" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="gutter pt-[clamp(5rem,12vw,10rem)] pb-[clamp(5rem,10vw,9rem)]">
        <Reveal className="flex items-center gap-4">
          <span className="eyebrow text-emerald">{brand.about.eyebrow}</span>
          <span className="h-px w-16 bg-gold" />
        </Reveal>

        <div className="mt-10 grid gap-14 lg:grid-cols-12">
          <TextReveal
            as="h2"
            text={'QUALITY IN\nEVERY DETAIL.'}
            className="display text-[clamp(3rem,8.2vw,8.6rem)] lg:col-span-7"
          />
          <div className="lg:col-span-4 lg:col-start-9 lg:pt-4">
            <Reveal>
              <p className="font-serif text-[clamp(1.35rem,1.9vw,1.75rem)] font-light leading-[1.35] text-midnight">
                {brand.about.introduction}
              </p>
            </Reveal>
            <Reveal stagger={0.12} className="mt-12 space-y-8">
              {brand.about.blocks.map((b, i) => (
                <div key={b.title} className="grid grid-cols-[2.5rem_1fr] gap-3 border-t border-midnight/12 pt-6">
                  <span className="font-serif text-sm italic text-gold">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3 className="eyebrow text-[0.62rem] text-midnight">{b.title}</h3>
                    <p className="mt-3 text-[0.95rem] leading-relaxed text-midnight/70">{b.body}</p>
                  </div>
                </div>
              ))}
            </Reveal>
          </div>
        </div>

        {/* Editorial strip of real catalogue photographs */}
        <div className="mt-[clamp(5rem,10vw,9rem)] grid grid-cols-12 items-end gap-4 sm:gap-6">
          {shots.map((p, i) => {
            const img = p.images[0];
            const layout = [
              { fig: 'col-span-7 sm:col-span-5', frame: 'aspect-[4/5]' },
              { fig: 'col-span-5 sm:col-span-3 sm:col-start-7 mb-[18%]', frame: 'aspect-[3/4]' },
              { fig: 'hidden sm:block sm:col-span-3 sm:col-start-10 mb-[42%]', frame: 'aspect-[4/5]' },
            ][i];
            return (
              <figure key={p.id} className={layout.fig}>
                <ImageReveal
                  src={img.src}
                  alt={img.alt}
                  width={img.width}
                  height={img.height}
                  parallax={i === 0 ? 0 : 6 + i * 3}
                  delay={i * 0.12}
                  className={`print w-full ${layout.frame}`}
                  imgClassName="h-full w-full object-contain p-[9%]"
                />
                <figcaption className="mt-3 flex justify-between gap-3 text-[0.72rem] text-midnight/55">
                  <span>{p.name}</span>
                  <span className="hidden italic md:inline">{categoryLabel(p.category)}</span>
                </figcaption>
              </figure>
            );
          })}
        </div>

        <Reveal stagger={0.1} className="mt-[clamp(4rem,8vw,7rem)] grid grid-cols-3 border-t border-midnight/12">
          {stats.map((s) => (
            <div key={s.label} className="border-r border-midnight/12 pt-8 pr-4 last:border-r-0 sm:pr-8 [&:not(:first-child)]:pl-4 sm:[&:not(:first-child)]:pl-8">
              <p className="display text-[clamp(2.6rem,6vw,5.5rem)] text-emerald">{s.value}</p>
              <p className="eyebrow mt-3 text-[0.56rem] text-midnight/55 sm:text-[0.62rem]">{s.label}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
