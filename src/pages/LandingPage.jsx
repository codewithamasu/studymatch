import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import alex from '../assets/profile-landing-page.png';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const heroRef = useRef(null);
  const howItWorksRef = useRef(null);
  const featuresRef = useRef(null);
  const ctaRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    // 1. Hero Animations (Clean, Distilled Entrance)
    const heroElements = heroRef.current.querySelectorAll('.hero-anim');
    gsap.fromTo(
      heroElements,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        delay: 0.1,
      }
    );

    // Bolder mock card animation - dramatic continuous rotation/float
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        y: -15,
        rotation: 4,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 0.8,
      });
    }

    // 2. How it Works (Simple scroll reveal)
    const stepCards = howItWorksRef.current.querySelectorAll('.step-card');
    gsap.fromTo(
      stepCards,
      { y: 20, opacity: 0 },
      {
        scrollTrigger: {
          trigger: howItWorksRef.current,
          start: 'top 85%',
        },
        y: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
      }
    );

    // 3. Features (ScrollTrigger)
    const featureGroups = featuresRef.current.querySelectorAll('.feat-group');
    gsap.fromTo(
      featureGroups,
      { y: 30, opacity: 0 },
      {
        scrollTrigger: {
          trigger: featuresRef.current,
          start: 'top 80%',
        },
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
      }
    );

    // 4. CTA Scale-in
    gsap.fromTo(
      ctaRef.current,
      { opacity: 0, scale: 0.98 },
      {
        scrollTrigger: {
          trigger: ctaRef.current,
          start: 'top 90%',
        },
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: 'power2.out',
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#64748B] font-sans selection:bg-[#136DEC]/10 selection:text-[#136DEC]">
      
      {/* ─── HEADER ─── */}
      <header className="fixed top-0 z-50 w-full border-b border-[#F8FAFC] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6">
          <nav className="flex h-20 items-center justify-between" aria-label="Main Navigation">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group outline-none focus-visible:ring-2 focus-visible:ring-[#136DEC] rounded" aria-label="StudyMatch Home">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-[#136DEC] text-white transition-transform group-hover:scale-105">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">school</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-[#136DEC]">StudyMatch</span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-sm font-medium text-[#64748B] hover:text-[#136DEC] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#136DEC] rounded">How it Works</a>
              <a href="#features" className="text-sm font-medium text-[#64748B] hover:text-[#136DEC] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#136DEC] rounded">Features</a>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-4">
              <Link to="/login" className="hidden sm:block text-sm font-medium text-[#64748B] hover:text-[#136DEC] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#136DEC] rounded">
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded bg-[#136DEC] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#136DEC]/90 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#136DEC]"
              >
                Join Now
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main className="pt-20">
        
        {/* ─── HERO SECTION ─── */}
        <section ref={heroRef} className="py-24 lg:py-32 bg-[#F8FAFC]" aria-labelledby="hero-heading">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              
              {/* Left: Text Content (Bolder Structure with Oxford Blue Colors) */}
              <div className="flex flex-col items-start max-w-xl">
                {/* Badge */}
                <div className="hero-anim mb-8 inline-flex items-center gap-2 rounded-full border border-[#136DEC]/20 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#136DEC] shadow-sm">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10B981] opacity-75"></span>
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#10B981]"></span>
                  </span>
                  New: Study Groups
                </div>

                {/* Heading */}
                <h1 id="hero-heading" className="hero-anim mb-6 text-6xl font-black leading-[1.05] tracking-tighter text-[#136DEC] sm:text-[5rem]">
                  Find Your<br />
                  Perfect <span className="bg-gradient-to-br from-cyan-400 via-[#136DEC] to-indigo-600 bg-clip-text text-transparent">Study<br />Partner.</span>
                </h1>

                {/* Subheading */}
                <p className="hero-anim mb-10 text-lg font-medium leading-relaxed text-[#64748B] max-w-lg">
                  Connect with students who share your academic goals, schedule, and learning style. Achieve better results, together.
                </p>

                {/* CTA Buttons */}
                <div className="hero-anim flex flex-col sm:flex-row w-full sm:w-auto items-center gap-4">
                  <Link to="/register" className="w-full sm:w-auto">
                    <button className="w-full sm:w-auto rounded-full bg-[#136DEC] px-10 py-4 text-base font-bold text-white hover:bg-[#136DEC]/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#136DEC]">
                      Get Started
                    </button>
                  </Link>
                  <button className="w-full sm:w-auto rounded-full bg-white border-2 border-[#E2E8F0] px-10 py-4 text-base font-bold text-[#64748B] hover:text-[#136DEC] shadow-sm hover:border-[#136DEC]/30 hover:bg-[#F8FAFC] transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#136DEC]">
                    View Demo
                  </button>
                </div>

                {/* Social Proof */}
                <div className="hero-anim mt-12 flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {[
                      "https://lh3.googleusercontent.com/aida-public/AB6AXuAdDgLnOYVIR-D2Qb27h1em8sy7YtjcLoH25aa3pG0f5W-ziIkt5560Pc3QQ9GABp0kXOhOvPRcaS7mSG1LpTdWvqltQeauKNRKCU8eAivpGd7FXWxf9_PEcrGIftra3GrDUb17GykkXVw1928YFuyNnbM6Z5fSTP1nloV8TJtLJhponT2tajfANeAdiABo60iuj3-6rrD_Nb4Krnww_nzVVWmQ-9fRuPFsvJaDxEuE5_8DN2Z_F6hJHTpyIpkmozcah8OyTemuSZgd",
                      "https://lh3.googleusercontent.com/aida-public/AB6AXuBTgxPHENaMk0a0fLW0ulfIbS01J2e0wPInysjpMQqM4sf1WYzytyK2kvb2kKiZDPYaXhc87USYMTQwGHGvg3h3kXTHI8pcSJljqIz2-5UO71hamv2CjyC22x5cFwjfKWYSSRxfVUnCSlbSzcUJdYXkGbYhtQqgyc0-BuJfgVCB5QG_fYkR5KBGsoMArE57mMr4ZZTJFeNBd5EwaLZFlxd6l_uWJ6uCnZG9A82XoDzvDSD-4fU7GqMzpRZOxVL912KKMmySa9_D3li0",
                      "https://lh3.googleusercontent.com/aida-public/AB6AXuCwogMjAgYY6WRGvp_fkpvx_p0MSC9bg3Ds_Vw00plxez_D3tzhcD113xQWhl-XtBdIIJQ-vkp6SZlEsT_Pp_uiUxAUtyJ4r-ICNxfnHD9DT06bJwiOOi_rF3wnkka7Y5fabSy_VueQycZjYIrAJEUiiyLQYtC-cZl4D8Uj5ocD2qMa-O3RIlsXAQqh3DDX85IBBZbmNxd3hDUZ-S6N47ovAuFf1DzD1Zg_JM76Ty-e1ERjwCD-hr45cijMDzDX1y0mCbckVEMqvjDl"
                    ].map((src, i) => (
                      <img key={i} alt="" className="h-8 w-8 rounded-full border-2 border-[#F8FAFC] object-cover" src={src} />
                    ))}
                  </div>
                  <p className="text-sm font-medium text-[#94A3B8]">
                    <strong className="text-[#136DEC]">10k+</strong> students finding partners
                  </p>
                </div>
              </div>

              {/* Right: Mock Swipe Card (Interactive Dating-App Style) */}
              <div className="hero-anim relative hidden lg:block">
                <div ref={cardRef} className="relative mx-auto w-full max-w-[360px] translate-x-4" aria-label="Interactive mock study match card">
                  {/* Card Material */}
                  <div className="relative overflow-hidden rounded-[2.5rem] border border-[#136DEC]/20 shadow-[0_30px_100px_-20px_rgba(19,109,236,0.15)] bg-white will-change-transform">
                    <div className="aspect-[3/4] p-3 pb-0">
                      <img
                        alt="Profile of Alex"
                        className="h-full w-full object-cover rounded-t-[2rem] rounded-b-xl"
                        src={alex}
                      />
                    </div>
                    {/* Card overlay */}
                    <div className="p-6">
                      <div className="flex justify-between items-end mb-4">
                        <div>
                          <h3 className="text-3xl font-black text-[#136DEC] tracking-tight">Alex, 21</h3>
                          <p className="text-base font-semibold text-[#64748B]">Comp. Science</p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F8FAFC]">
                          <span className="material-symbols-outlined text-[#10B981] text-sm font-bold">verified</span>
                        </div>
                      </div>
                      
                      {/* Swipe Actions - Dating App Style */}
                      <div className="flex items-center justify-center gap-6 mt-6 pb-2">
                        <button 
                          className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border border-[#E2E8F0] bg-white shadow-xl hover:scale-110 active:scale-95 transition-transform outline-none focus-visible:ring-2 focus-visible:ring-[#136DEC] text-[#64748B] hover:text-[#EF4444] hover:border-[#EF4444]/30"
                          aria-label="Pass Profile"
                        >
                          <span className="material-symbols-outlined text-3xl font-bold">close</span>
                        </button>
                        <button 
                          className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-full bg-gradient-to-tr from-[#136DEC] to-[#0EA5E9] shadow-xl shadow-[#136DEC]/30 hover:scale-110 hover:-rotate-6 active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#136DEC] text-white"
                          aria-label="Like Profile"
                        >
                          <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS (Distilled) ─── */}
        <section ref={howItWorksRef} id="how-it-works" className="py-24 bg-white">
          <div className="mx-auto max-w-6xl px-6">
            <header className="mb-16 text-center">
              <h2 className="text-3xl font-bold text-[#136DEC] mb-4">How it works</h2>
              <p className="text-lg text-[#64748B] max-w-2xl mx-auto">Three simple steps to start collaborating and learning more effectively.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                { icon: 'person', title: 'Create your profile', desc: 'Add your major, subjects, and study preferences.' },
                { icon: 'search', title: 'Find matches', desc: 'Review compatible students who share your learning goals.' },
                { icon: 'chat', title: 'Start studying', desc: 'Connect, schedule sessions, and learn together.' },
              ].map((step, idx) => (
                <article key={idx} className="step-card flex flex-col items-center text-center">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#F8FAFC] text-[#136DEC]">
                    <span className="material-symbols-outlined text-2xl">{step.icon}</span>
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-[#136DEC]">{step.title}</h3>
                  <p className="text-[#64748B] leading-relaxed">{step.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FEATURES (Clean & Focused) ─── */}
        <section ref={featuresRef} id="features" className="py-24 bg-[#F8FAFC]">
           <div className="mx-auto max-w-6xl px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              
              {/* Text Focus */}
              <div>
                <h2 className="mb-12 text-3xl font-bold text-[#136DEC]">Built for academic focus.</h2>
                
                <div className="space-y-10">
                  <div className="feat-group flex gap-4">
                    <div className="mt-1 flex-shrink-0">
                      <span className="material-symbols-outlined text-[#6366F1]">psychology</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#136DEC] mb-2">Smart Compatibility</h3>
                      <p className="text-[#64748B] leading-relaxed">Our algorithm ensures you match with partners who complement your learning style, preventing mismatched expectations.</p>
                    </div>
                  </div>

                  <div className="feat-group flex gap-4">
                    <div className="mt-1 flex-shrink-0">
                      <span className="material-symbols-outlined text-[#10B981]">monitoring</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#136DEC] mb-2">Progress Tracking</h3>
                      <p className="text-[#64748B] leading-relaxed">Set joint goals and milestones. Keep each other accountable with session logging and visual progress data.</p>
                    </div>
                  </div>

                  <div className="feat-group flex gap-4">
                    <div className="mt-1 flex-shrink-0">
                      <span className="material-symbols-outlined text-[#F59E0B]">event_available</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#136DEC] mb-2">Seamless Scheduling</h3>
                      <p className="text-[#64748B] leading-relaxed">Sync your free time automatically. Find overlapping availability without the endless back-and-forth messaging.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Minimalist Visual Representation */}
               <div className="feat-group lg:ml-auto w-full max-w-sm">
                 <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
                    <h4 className="font-bold text-[#136DEC] mb-6">Upcoming Session</h4>
                    <div className="rounded border border-[#E2E8F0] p-4 mb-4">
                      <div className="flex items-center gap-3 mb-3">
                         <div className="flex h-10 w-10 items-center justify-center rounded bg-[#136DEC]/10 text-[#136DEC]">
                           <span className="material-symbols-outlined">menu_book</span>
                         </div>
                         <div>
                           <p className="font-semibold text-[#136DEC]">Calculus II Prep</p>
                           <p className="text-xs text-[#64748B]">Today • 19:00 - 21:00</p>
                         </div>
                      </div>
                      <div className="flex items-center justify-between mt-4 border-t border-[#F8FAFC] pt-4">
                        <div className="flex -space-x-2">
                           <img src={alex} alt="User" className="h-6 w-6 rounded-full border border-white" />
                           <div className="h-6 w-6 rounded-full border border-white bg-[#94A3B8] flex items-center justify-center text-[10px] text-white">Me</div>
                        </div>
                        <span className="text-xs font-medium text-[#10B981]">Confirmed</span>
                      </div>
                    </div>
                    <button className="w-full rounded bg-[#136DEC]/10 py-2.5 text-sm font-medium text-[#136DEC] hover:bg-[#136DEC]/20 transition-colors">
                      Join Audio Room
                    </button>
                 </div>
               </div>
            </div>
           </div>
        </section>

        {/* ─── CTA ─── */}
        <section ref={ctaRef} className="py-24 bg-white text-center">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="mb-6 text-3xl font-bold text-[#136DEC]">Start learning better today.</h2>
            <p className="mb-10 text-lg text-[#64748B]">Join the community of students achieving their goals through collaboration.</p>
            <Link to="/register">
              <button className="rounded bg-[#136DEC] px-10 py-4 text-base font-bold text-white hover:bg-[#136DEC]/90 transition-colors shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#136DEC]">
                Create Free Profile
              </button>
            </Link>
          </div>
        </section>

      </main>

      {/* ─── FOOTER (Simplified) ─── */}
      <footer className="border-t border-[#E2E8F0] bg-white py-12">
        <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-[#94A3B8] text-sm font-medium">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">school</span>
            <span className="text-[#64748B]">© 2024 StudyMatch. All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[#136DEC] transition-colors">Help</a>
            <a href="#" className="hover:text-[#136DEC] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#136DEC] transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
