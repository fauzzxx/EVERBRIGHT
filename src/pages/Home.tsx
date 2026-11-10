import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { AboutSection } from '../components/sections/AboutSection';
import { ContactSection } from '../components/sections/ContactSection';
import { DivisionSection } from '../components/sections/DivisionSection';
import { DivisionsIndex } from '../components/sections/DivisionsIndex';
import { HeroSection } from '../components/sections/HeroSection';
import { ProtectiveBagsSection } from '../components/sections/ProtectiveBagsSection';
import { WhyEverbrightSection } from '../components/sections/WhyEverbrightSection';
import { useSmoothScroll } from '../hooks/useSmoothScroll';
import { ScrollTrigger } from '../lib/gsap';

export function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const { scrollTo } = useSmoothScroll();

  // Arriving from another page with a target section.
  useEffect(() => {
    const target = (location.state as { scrollTo?: string } | null)?.scrollTo;
    if (!target) return;
    const id = window.setTimeout(() => {
      ScrollTrigger.refresh();
      scrollTo(target, { immediate: true });
      navigate('.', { replace: true, state: null });
    }, 60);
    return () => window.clearTimeout(id);
  }, [location.state, navigate, scrollTo]);

  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);
    document.fonts?.ready.then(refresh);
    return () => window.removeEventListener('load', refresh);
  }, []);

  return (
    <main>
      <HeroSection />
      <AboutSection />
      <DivisionsIndex />
      <DivisionSection divisionId="police" tone="graphite" />
      <DivisionSection divisionId="uniform" tone="ivory" />
      <ProtectiveBagsSection />
      <WhyEverbrightSection />
      <ContactSection />
    </main>
  );
}
