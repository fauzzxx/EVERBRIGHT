import { Reveal } from '../animations/Reveal';

/** The shared construction of the Fire and Safety range, summarised from the material specification. */
const LAYERS = [
  {
    no: '01',
    title: 'Silicone fiberglass shell',
    body: 'Liquid-silicone-coated fiberglass cloth outside: flame retardant, waterproof, wear and scratch resistant.',
    stat: 'up to 800 °C',
    statNote: 'instantaneous (document bag spec)',
  },
  {
    no: '02',
    title: 'Insulating core',
    body: 'EVA foam, PP or honeycomb board and fiberglass insulation cotton — depending on the model — to cushion and insulate.',
    stat: '4–15 mm',
    statNote: 'board & insulation layers',
  },
  {
    no: '03',
    title: 'Aluminium-foil lining',
    body: 'Hot-pressed aluminium foil on fiberglass inside: reflects heat, blocks moisture and keeps its shape.',
    stat: '−40 to 250 °C',
    statNote: 'long-term operating range',
  },
  {
    no: '04',
    title: 'Fire-retardant zipper',
    body: 'Flame-retardant zipper tape closes the weakest point, so protection has no gaps.',
    stat: 'UL94 V0',
    statNote: 'zipper tape rating',
  },
];

export function FireLayersBand() {
  return (
    <div className="mb-[clamp(4rem,8vw,6rem)]">
      <Reveal className="flex flex-wrap items-end justify-between gap-6 border-b border-ivory/12 pb-6">
        <div>
          <p className="eyebrow text-gold">Layers of protection</p>
          <p className="mt-3 max-w-xl font-serif text-[clamp(1.5rem,2.4vw,2.2rem)] font-light leading-snug text-ivory">
            Every bag is built like a cross-section — shell, core, lining, seal.
          </p>
        </div>
        <div className="max-w-xs">
          <p className="text-[0.78rem] leading-relaxed text-ivory/50">
            Summarised from the manufacturer's material specification. Open a product for its exact layers and listed
            standards.
          </p>
        </div>
      </Reveal>
      <Reveal stagger={0.1} className="mt-10 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {LAYERS.map((l, i) => (
          <div key={l.no} className="relative pt-8 pb-2">
            <span
              aria-hidden="true"
              className="absolute left-0 top-0 h-[3px] bg-gold"
              style={{ width: `${100 - i * 18}%`, opacity: 1 - i * 0.15 }}
            />
            <span className="font-serif text-sm italic text-gold">{l.no}</span>
            <h4 className="mt-4 font-serif text-[1.45rem] font-light leading-tight text-ivory">{l.title}</h4>
            <p className="mt-3 text-[0.86rem] leading-relaxed text-ivory/60">{l.body}</p>
            <p className="display mt-6 text-[2rem] text-gold">{l.stat}</p>
            <p className="eyebrow mt-1 text-[0.52rem] text-ivory/45">{l.statNote}</p>
          </div>
        ))}
      </Reveal>
    </div>
  );
}
