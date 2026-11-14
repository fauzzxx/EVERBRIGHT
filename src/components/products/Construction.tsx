import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { SpecLayer } from '../../types/catalog';

/**
 * Layer-by-layer construction from the manufacturer's material specification:
 * a stacked "cross-section" index on top, expandable detail per layer below.
 */
export function Construction({ layers }: { layers: SpecLayer[] }) {
  const [open, setOpen] = useState(0);
  const standards = [...new Set(layers.flatMap((l) => l.standards))];

  return (
    <section className="mt-10" aria-label="Construction and materials">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="eyebrow text-[0.6rem] text-emerald">Construction · {layers.length} layers</h3>
        <span className="text-[0.68rem] italic text-midnight/45">From the material specification</span>
      </div>

      {/* Cross-section: one band per layer, outermost on top */}
      <div className="mt-4 overflow-hidden border border-midnight/12" aria-hidden="true">
        {layers.map((l, i) => (
          <button
            key={l.name + i}
            type="button"
            tabIndex={-1}
            onClick={() => setOpen(i)}
            className="block w-full text-left"
            style={{
              height: `${Math.max(10, 22 - i * 3)}px`,
              background: i === open ? '#c9ae7a' : `rgba(9,45,38,${0.92 - i * 0.16})`,
            }}
            title={l.name}
          />
        ))}
      </div>

      <ol className="mt-4 border-t border-midnight/10">
        {layers.map((l, i) => {
          const on = open === i;
          return (
            <li key={l.name + i} className="border-b border-midnight/10">
              <button
                type="button"
                onClick={() => setOpen(on ? -1 : i)}
                aria-expanded={on}
                className="group flex w-full items-start gap-4 py-3.5 text-left"
              >
                <span className={`mt-0.5 font-serif text-sm italic ${on ? 'text-gold' : 'text-midnight/40'}`}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="eyebrow block text-[0.56rem] text-midnight/50">{l.name}</span>
                  <span className="mt-1 block text-[0.92rem] leading-snug text-midnight/85 group-hover:text-midnight">
                    {l.material}
                  </span>
                </span>
                <ChevronDown
                  size={16}
                  strokeWidth={1.2}
                  className={`mt-1 shrink-0 text-midnight/50 transition-transform duration-500 ${on ? 'rotate-180' : ''}`}
                />
              </button>
              {on && (
                <div className="pb-4 pl-9">
                  <ul className="space-y-1.5 text-[0.86rem] leading-relaxed text-midnight/70">
                    {l.points.map((pt) => (
                      <li key={pt} className="flex gap-2.5">
                        <span className="mt-[0.55em] h-px w-2.5 shrink-0 bg-gold" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                  {l.standards.length > 0 && (
                    <p className="mt-3 text-[0.72rem] leading-relaxed text-midnight/50">{l.standards.join(' · ')}</p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {standards.length > 0 && (
        <div className="mt-6">
          <p className="eyebrow text-[0.56rem] text-midnight/50">Standards & tests listed</p>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {standards.map((s) => (
              <li key={s} className="border border-midnight/15 px-2 py-1 text-[0.7rem] text-midnight/75">
                {s}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[0.7rem] leading-relaxed text-midnight/45">
            As stated in the manufacturer's material specification. Fire resistance delays heat and flame; no bag
            can guarantee that contents survive every fire.
          </p>
        </div>
      )}
    </section>
  );
}
