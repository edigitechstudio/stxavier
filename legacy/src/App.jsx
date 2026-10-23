import { useCallback, useMemo, useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Services, { Intro } from './components/Services';
import Destinations from './components/Destinations';
import { Edge, WhyChoose } from './components/Features';
import { StudentStories, Testimonials } from './components/Stories';
import { Process, CtaBanner, Essentials, Partners, Faq } from './components/Sections';
import Footer, { FloatingActions, CounsellingModal } from './components/Footer';
import { CounsellingContext } from './components/ui';

export default function App() {
  const [formOpen, setFormOpen] = useState(false);
  const open = useCallback(() => setFormOpen(true), []);
  const close = useCallback(() => setFormOpen(false), []);
  const ctx = useMemo(() => ({ open }), [open]);

  return (
    <CounsellingContext.Provider value={ctx}>
      <Header />
      <main>
        <Hero />
        <Intro />
        <Services />
        <Destinations />
        <Edge />
        <WhyChoose />
        <StudentStories />
        <Process />
        <Testimonials />
        <CtaBanner />
        <Essentials />
        <Partners />
        <Faq />
      </main>
      <Footer />
      <FloatingActions />
      <CounsellingModal open={formOpen} onClose={close} />
    </CounsellingContext.Provider>
  );
}
