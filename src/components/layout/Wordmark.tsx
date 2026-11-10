import { brand } from '../../config/brand';

/** Typographic logo; swapped for an image when `brand.logo` is configured. */
export function Wordmark({ className = '', compact = false }: { className?: string; compact?: boolean }) {
  if (brand.logo) {
    return <img src={brand.logo} alt={brand.name} className={`h-8 w-auto ${className}`} />;
  }
  return (
    <span className={`inline-flex items-center gap-3 leading-none ${className}`}>
      <span className="font-serif text-[1.2rem] font-normal tracking-[0.16em] sm:text-[1.35rem]">EVERBRIGHT</span>
      {!compact && (
        <>
          <span aria-hidden="true" className="hidden h-3.5 w-px bg-current opacity-40 sm:block" />
          <span className="eyebrow hidden text-[0.58rem] tracking-[0.34em] opacity-80 sm:inline">Uniforms</span>
        </>
      )}
    </span>
  );
}
