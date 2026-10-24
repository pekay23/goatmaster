'use client';

import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronLeft, ChevronRight, Star, MapPin, Users, Award } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const testimonials = [
  {
    id: 1,
    name: 'Kwame Asante',
    location: 'Kumasi, Ashanti Region',
    herdSize: 47,
    quote: 'GoatMaster changed everything. I used to lose track of which goats were related. Now the AI scans them and builds the family tree automatically. My inbreeding rate dropped from 12% to under 2% in one season.',
    rating: 5,
    avatar: 'KA',
  },
  {
    id: 2,
    name: 'Ama Serwaa',
    location: 'Tamale, Northern Region',
    herdSize: 23,
    quote: 'The offline mode is a lifesaver. We have terrible internet here, but I can still record vaccinations, weights, and breeding dates. Everything syncs when I get to town once a week.',
    rating: 5,
    avatar: 'AS',
  },
  {
    id: 3,
    name: 'Yaw Mensah',
    location: 'Ho, Volta Region',
    herdSize: 89,
    quote: 'Smart scanning saves me hours every week. Instead of manually checking ear tags, I just point my phone and it tells me which goat it is, its age, and health history. Worth every cedi.',
    rating: 5,
    avatar: 'YM',
  },
  {
    id: 4,
    name: 'Efua Owusu',
    location: 'Cape Coast, Central Region',
    herdSize: 156,
    quote: 'The breeding alerts alone paid for the Pro plan. I used to miss heat cycles and lose kidding opportunities. Now I get notified days in advance. My kidding rate improved 30%.',
    rating: 5,
    avatar: 'EO',
  },
  {
    id: 5,
    name: 'Kofi Darko',
    location: 'Sunyani, Bono Region',
    herdSize: 67,
    quote: 'Feed optimization helped me cut costs by 18%. The app calculates the exact ration based on what I grow locally. My goats are healthier and I\'m spending less on feed.',
    rating: 4,
    avatar: 'KD',
  },
  {
    id: 6,
    name: 'Abena Fosu',
    location: 'Koforidua, Eastern Region',
    herdSize: 34,
    quote: 'As a woman farmer, I appreciate how easy it is to use. No complicated menus. The voice notes feature lets me record observations while working. My extension officer is impressed.',
    rating: 5,
    avatar: 'AF',
  },
];

const stats = [
  { value: '500+', label: 'Farms across Ghana', icon: MapPin },
  { value: '50K+', label: 'Goats tracked', icon: Users },
  { value: '98%', label: 'Scan accuracy', icon: Award },
  { value: '4.9★', label: 'App store rating', icon: Star },
];

export default function SocialProof() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: container,
        start: 'top 80%',
        onEnter: () => {
          gsap.fromTo('.testimonial-card', 
            { opacity: 0, y: 40 },
            { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
          );
          
          gsap.fromTo('.stat-card', 
            { opacity: 0, scale: 0.9 },
            { opacity: 1, scale: 1, duration: 0.5, stagger: 0.08, ease: 'back.out(1.5)', delay: 0.3 }
          );
        },
      });
    }, container);

    return () => ctx.revert();
  }, []);

  const scrollToIndex = (index: number) => {
    if (trackRef.current) {
      const cardWidth = 380 + 24; // card width + gap
      trackRef.current.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth',
      });
      setCurrentIndex(index);
    }
  };

  const goPrev = () => scrollToIndex(Math.max(0, currentIndex - 1));
  const goNext = () => scrollToIndex(Math.min(testimonials.length - 1, currentIndex + 1));

  // Auto-play
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      goNext();
      if (currentIndex === testimonials.length - 1) {
        setTimeout(() => scrollToIndex(0), 1000);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [currentIndex, isAutoPlaying]);

  return (
    <section id="social-proof" ref={containerRef} className="py-24 md:py-32 lg:py-40 px-4 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16" data-gsap="fade-up">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-slate-900">
            Trusted by <span className="text-green-600">Farmers Across Ghana</span>
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Real stories from real farmers. No actors, no scripts — just results.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16" data-gsap="fade-up" style={{ transitionDelay: '0.2s' }}>
          {stats.map((stat, i) => (
            <div key={i} className="stat-card bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <stat.icon className="w-6 h-6 text-green-600" />
                <span className="font-serif text-3xl font-bold text-slate-900">{stat.value}</span>
              </div>
              <p className="text-slate-600">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Testimonials Carousel */}
        <div className="relative">
          <div 
            ref={trackRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide pb-8 -mx-4 px-4"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
          >
            {testimonials.map((testimonial, i) => (
              <article
                key={testimonial.id}
                className="testimonial-card flex-shrink-0 w-96 bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex flex-wrap gap-1">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <Star key={j} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
                <blockquote className="text-slate-700 leading-relaxed mb-6">
                  "{testimonial.quote}"
                </blockquote>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-lg">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{testimonial.name}</p>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {testimonial.location}
                    </p>
                    <p className="text-sm text-slate-500">{testimonial.herdSize} goats</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Navigation */}
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 w-12 h-12 rounded-full bg-white/90 backdrop-blur border border-slate-200 shadow-lg flex items-center justify-center text-slate-600 hover:text-green-600 hover:bg-green-50 transition-colors disabled:opacity-30 disabled:pointer-events-none z-10"
            aria-label="Previous testimonial"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={goNext}
            disabled={currentIndex === testimonials.length - 1}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 w-12 h-12 rounded-full bg-white/90 backdrop-blur border border-slate-200 shadow-lg flex items-center justify-center text-slate-600 hover:text-green-600 hover:bg-green-50 transition-colors disabled:opacity-30 disabled:pointer-events-none z-10"
            aria-label="Next testimonial"
          >
            <ChevronRight size={24} />
          </button>

          {/* Indicator dots */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollToIndex(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === currentIndex ? 'bg-green-600 w-8' : 'bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Farm Photos Gallery */}
        <div className="mt-20" data-gsap="fade-up">
          <h3 className="font-serif text-2xl font-bold text-slate-900 text-center mb-8">Farms Using GoatMaster</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="aspect-video rounded-xl overflow-hidden bg-slate-100 relative group">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="font-semibold">Farm #{i}</p>
                  <p className="text-sm opacity-80">{[23, 47, 12, 89, 34, 67, 15, 56][i-1]} goats</p>
                </div>
                <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-700" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}