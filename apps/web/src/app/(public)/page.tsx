import { Hero } from '@/components/home/hero';
import { Mission } from '@/components/home/mission';
import { Spotlight } from '@/components/home/spotlight';
import { Intro } from '@/components/home/intro';
import { Features } from '@/components/home/features';
// import { Cta } from '@/components/home/cta';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Mission />
      <Spotlight />
      <Intro />
      <Features />
      {/* <Cta /> */}
    </>
  );
}