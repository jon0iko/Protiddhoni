import HeroSection from '@/components/home/HeroSection';
import FeaturedContent from '@/components/home/FeaturedContent';
import CategoryShowcase from '@/components/home/CategoryShowcase';
// import NewsletterSection from '@/components/home/NewsletterSection';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section - Main Banner */}
      <HeroSection />
      
      {/* Featured Content - Curated Stories/Poems */}
      <FeaturedContent />
      
      {/* Category Showcase - Explore by Genre */}
      <CategoryShowcase />
      
      {/* Newsletter Section - Stay Updated */}
      {/* <NewsletterSection /> */}
    </div>
  );
}
