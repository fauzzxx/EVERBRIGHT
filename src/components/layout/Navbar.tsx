import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { navigation } from '../../data/navigation';
import { useSectionNav } from '../../hooks/useSectionNav';
import { introState } from '../../lib/introState';
import { gsap } from '../../lib/gsap';
import { prefersReducedMotion } from '../../hooks/useReducedMotion';
import { MobileMenu } from './MobileMenu';
import { Wordmark } from './Wordmark';

type Theme = 'hero' | 'dark' | 'light';

const THEME_CLASSES: Record<Theme, string> = {
  hero: 'bg-transparent text-ivory border-transparent',
  dark: 'bg-midnight-deep/80 text-ivory border-ivory/10 backdrop-blur-md',
  light: 'bg-ivory/85 text-midnight border-midnight/10 backdrop-blur-md',
};

export function Navbar() {
  const location = useLocation();
  const goTo = useSectionNav();
  const isHome = location.pathname === '/';
  const [ready, setReady] = useState(() => !isHome || introState.isDone());
  const [theme, setTheme] = useState<Theme>(isHome ? 'hero' : 'light');
  const [active, setActive] = useState('top');
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const barRef = useRef<HTMLElement>(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // Wait for the intro on the home page.
  useEffect(() => {
    if (ready) return;
    return introState.subscribe(() => setReady(true));
  }, [ready]);

  useEffect(() => {
    if (!ready || !barRef.current || prefersReducedMotion()) return;
    const items = barRef.current.querySelectorAll('[data-nav-item]');
    gsap.fromTo(items, { y: -14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, stagger: 0.06, ease: 'expo.out' });
  }, [ready]);

  // Theme + active section + hide-on-scroll-down.
  useEffect(() => {
    let lastY = window.scrollY;
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const probe = 38;
      let next: Theme = isHome ? 'hero' : 'light';
      let current = 'top';
      document.querySelectorAll<HTMLElement>('[data-nav]').forEach((sec) => {
        const r = sec.getBoundingClientRect();
        if (r.top <= probe && r.bottom > probe) next = (sec.dataset.nav as Theme) ?? next;
        if (sec.id && r.top <= window.innerHeight * 0.4) current = sec.id;
      });
      if (next === 'hero' && y > 40) next = 'dark';
      setTheme(next);
      setActive(current);
      const goingDown = y > lastY + 4;
      const goingUp = y < lastY - 4;
      if (goingDown && y > window.innerHeight * 1.1) setHidden(true);
      else if (goingUp || y < window.innerHeight * 0.5) setHidden(false);
      lastY = y;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [isHome, location.pathname]);

  return (
    <>
      <header
        ref={barRef}
        className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,color,border-color,transform,opacity] duration-700 ease-[var(--ease-silk)] ${THEME_CLASSES[theme]} ${
          hidden && !menuOpen ? '-translate-y-full' : 'translate-y-0'
        } ${ready ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      >
        <nav className="gutter flex h-[var(--nav-h)] items-center justify-between gap-8" aria-label="Main">
          <button type="button" data-nav-item onClick={() => goTo('top')} aria-label="Everbright Uniforms — home">
            <Wordmark />
          </button>

          <ul className="hidden items-center gap-[clamp(1.2rem,2.2vw,2.4rem)] xl:flex">
            {navigation.map((item) => (
              <li key={item.anchor} data-nav-item>
                <button
                  type="button"
                  onClick={() => goTo(item.anchor)}
                  aria-current={isHome && active === item.anchor ? 'true' : undefined}
                  className="link-line eyebrow text-[0.64rem] tracking-[0.2em] opacity-85 transition-opacity hover:opacity-100"
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            data-nav-item
            onClick={() => setMenuOpen(true)}
            className="group flex items-center gap-3 xl:hidden"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <span className="eyebrow text-[0.6rem]">Menu</span>
            <span className="flex w-7 flex-col items-end gap-[6px]">
              <span className="block h-px w-7 bg-current" />
              <span className="block h-px w-4 bg-current transition-all duration-500 group-hover:w-7" />
            </span>
          </button>
        </nav>
      </header>
      <MobileMenu open={menuOpen} onClose={closeMenu} onNavigate={goTo} active={active} />
    </>
  );
}
