import Hero from '../components/Hero';
import Collections from '../components/Collections';
import VideoHero from '../components/VideoHero';
import TopPicks from '../components/TopPicks';

export default function Home() {
  return (
    <div className="index-page">
      <Hero />
      <Collections />
      <VideoHero />
      <TopPicks />
    </div>
  );
}
