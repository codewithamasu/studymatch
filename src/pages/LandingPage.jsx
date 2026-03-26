import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import girl from '../assets/front-view-smiley-student-with-coffee-cup.jpg'
import Navbar from '@/components/layout/Navbar';
import { DISPLAY_FONT } from '@/lib/constants';



gsap.registerPlugin(ScrollTrigger);
export default function LandingPage() {
  const heroRef = useRef(null);
  const howItWorksRef = useRef(null);
  const featuresRef = useRef(null);
  const ctaRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
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

    if (cardRef.current) {
      gsap.to(cardRef.current, {
        y: -10,
        rotation: 1.5,
        duration: 4.6,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 0.8,
      });
    }

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
    <>
      <Helmet>
        <title>StudyMatch - Find Your Perfect Study Partner</title>
        <meta name="description" content="Connect with students who share your goals, schedule, and learning style." />
      </Helmet>
      <div className="min-h-screen bg-white text-[#64748B] font-sans selection:bg-[#136DEC]/10 selection:text-[#136DEC]">
        <Navbar mode="marketing" />

      <main className="pt-[4.5rem]">

        <section ref={heroRef} className="bg-[#F8FAFC] py-16 sm:py-22 lg:py-28" aria-labelledby="hero-heading">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-16">

              <div className="flex flex-col items-start max-w-xl">
                <div className="hero-anim mb-8 inline-flex items-center gap-3 rounded-full border border-[#DDE6F2] bg-white/92 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5E6A78] shadow-[0_10px_26px_rgba(20,32,54,0.05)]">
                  <span className="h-2 w-2 rounded-full bg-[#136DEC]" />
                  Now supporting study groups
                </div>

                <h1
                  id="hero-heading"
                  className="hero-anim mb-6 max-w-[10ch] text-[2.75rem] font-semibold leading-[0.98] tracking-[-0.065em] text-[#1A1A1A] sm:text-6xl lg:text-[4.85rem]"
                  style={{ fontFamily: DISPLAY_FONT }}
                >
                  Find Your Perfect{' '}
                  <span className="relative inline-block whitespace-nowrap text-[#136DEC]">
                    <span className="relative z-10">Study Partner.</span>
                    <span className="absolute inset-x-0 bottom-[0.18em] z-0 h-[0.24em] rounded-full bg-[#DDEBFF]" />
                  </span>
                </h1>

                <p className="hero-anim mb-10 max-w-lg text-lg font-medium leading-relaxed text-[#64748B]">
                  Connect with students who share your goals, schedule, and learning style so every session feels easier to start and worth showing up for.
                </p>

                <div className="hero-anim flex w-full sm:w-auto items-center">
                  <Link to="/register" className="w-full sm:w-auto">
                    <button className="w-full sm:w-auto rounded-full bg-[#136DEC] px-10 py-4 text-base font-bold text-white hover:bg-[#136DEC]/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#136DEC]">
                      Get Started
                    </button>
                  </Link>
                </div>

                <div className="hero-anim mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <div className="flex -space-x-2">
                    {[
                      "https://lh3.googleusercontent.com/aida-public/AB6AXuAdDgLnOYVIR-D2Qb27h1em8sy7YtjcLoH25aa3pG0f5W-ziIkt5560Pc3QQ9GABp0kXOhOvPRcaS7mSG1LpTdWvqltQeauKNRKCU8eAivpGd7FXWxf9_PEcrGIftra3GrDUb17GykkXVw1928YFuyNnbM6Z5fSTP1nloV8TJtLJhponT2tajfANeAdiABo60iuj3-6rrD_Nb4Krnww_nzVVWmQ-9fRuPFsvJaDxEuE5_8DN2Z_F6hJHTpyIpkmozcah8OyTemuSZgd",
                      "https://lh3.googleusercontent.com/aida-public/AB6AXuBTgxPHENaMk0a0fLW0ulfIbS01J2e0wPInysjpMQqM4sf1WYzytyK2kvb2kKiZDPYaXhc87USYMTQwGHGvg3h3kXTHI8pcSJljqIz2-5UO71hamv2CjyC22x5cFwjfKWYSSRxfVUnCSlbSzcUJdYXkGbYhtQqgyc0-BuJfgVCB5QG_fYkR5KBGsoMArE57mMr4ZZTJFeNBd5EwaLZFlxd6l_uWJ6uCnZG9A82XoDzvDSD-4fU7GqMzpRZOxVL912KKMmySa9_D3li0",
                      "https://lh3.googleusercontent.com/aida-public/AB6AXuCwogMjAgYY6WRGvp_fkpvx_p0MSC9bg3Ds_Vw00plxez_D3tzhcD113xQWhl-XtBdIIJQ-vkp6SZlEsT_Pp_uiUxAUtyJ4r-ICNxfnHD9DT06bJwiOOi_rF3wnkka7Y5fabSy_VueQycZjYIrAJEUiiyLQYtC-cZl4D8Uj5ocD2qMa-O3RIlsXAQqh3DDX85IBBZbmNxd3hDUZ-S6N47ovAuFf1DzD1Zg_JM76Ty-e1ERjwCD-hr45cijMDzDX1y0mCbckVEMqvjDl"
                    ].map((src, i) => (
                      <img key={i} alt="" className="h-9 w-9 rounded-full border-2 border-[#F8FAFC] object-cover shadow-[0_6px_16px_rgba(20,32,54,0.06)]" src={src} />
                    ))}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1A1A1A]">Trusted by students building better study habits.</p>
                    <p className="mt-1 text-sm text-[#7B8794]"><span className="font-semibold text-[#136DEC]">10k+</span> learners have already started building consistent study routines here.</p>
                  </div>
                </div>
              </div>

              <div className="hero-anim relative hidden lg:block">
                <div ref={cardRef} className="relative mx-auto w-full max-w-[360px] translate-x-4" aria-label="Interactive mock study match card">
                  <div className="absolute -left-10 top-10 h-28 w-28 rounded-full bg-[#DDEBFF] blur-[56px] opacity-80" />
                  <div className="absolute -right-6 bottom-14 h-24 w-24 rounded-full bg-[#EAF3FF] blur-[42px] opacity-90" />

                  <div className="relative overflow-hidden rounded-[2.5rem] border border-[#D9E5F3] shadow-[0_34px_100px_-24px_rgba(19,109,236,0.16)] bg-white will-change-transform">
                    <div className="aspect-[3/4] p-3 pb-0">
                      <img
                        alt="Profile of Olivia"
                        className="h-full w-full object-cover rounded-t-[2rem] rounded-b-xl"
                        src={girl}
                      />
                    </div>
                    <div className="p-6">
                      <div className="mb-4 flex items-end justify-between">
                        <div>
                          <h3
                            className="text-3xl font-semibold tracking-[-0.05em] text-[#136DEC]"
                            style={{ fontFamily: DISPLAY_FONT }}
                          >
                            Olivia, 21
                          </h3>
                          <p className="text-base font-semibold text-[#64748B]">Comp. Science</p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F3F7FB]">
                          <span className="material-symbols-outlined text-[#10B981] text-sm font-bold">verified</span>
                        </div>
                      </div>

                      <div className="mb-5 flex flex-wrap gap-2">
                        {['Algorithms', 'Night Study', 'Focused'].map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex min-h-8 items-center rounded-full bg-[#F3F7FB] px-3 text-[11px] font-semibold tracking-tight text-[#5E6A78]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="rounded-[1.35rem] bg-[#F8FAFC] px-4 py-4">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A97A5]">
                            Next Session
                          </p>
                          <span className="inline-flex min-h-7 items-center rounded-full bg-white px-2.5 text-[11px] font-semibold text-[#136DEC] shadow-[0_8px_20px_rgba(20,32,54,0.05)]">
                            87% fit
                          </span>
                        </div>
                        <p className="text-[15px] font-semibold tracking-tight text-[#1A1A1A]">
                          Data Structures Review
                        </p>
                        <p className="mt-1 text-[13px] leading-6 text-[#64748B]">
                          Tomorrow, 7:00 PM to 8:30 PM
                        </p>
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[12px] font-medium text-[#64748B]">
                            <span className="h-2 w-2 rounded-full bg-[#10B981]" />
                            Ready to schedule
                          </div>
                          <div className="inline-flex min-h-10 items-center rounded-full bg-[#136DEC] px-4 text-[12px] font-semibold text-white shadow-[0_14px_28px_rgba(19,109,236,0.18)]">
                            Open match
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section ref={howItWorksRef} id="how-it-works" className="bg-white py-20 sm:py-22">
          <div className="mx-auto max-w-6xl px-6">
            <header className="mb-14 text-center">
              <h2
                className="mb-4 text-3xl font-semibold tracking-[-0.05em] text-[#136DEC]"
                style={{ fontFamily: DISPLAY_FONT }}
              >
                How it works
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-[#64748B]">Build a profile, meet the right partner, and turn that match into a real study session.</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
              {[
                { icon: 'person', title: 'Create your profile', desc: 'Add your major, subjects, and study preferences.' },
                { icon: 'search', title: 'Find matches', desc: 'Review compatible students who share your learning goals.' },
                { icon: 'chat', title: 'Start studying', desc: 'Connect, schedule sessions, and learn together.' },
              ].map((step, idx) => (
                <article key={idx} className="step-card flex flex-col items-center text-center">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#F8FAFC] text-[#136DEC]">
                    <span className="material-symbols-outlined text-2xl">{step.icon}</span>
                  </div>
                  <h3
                    className="mb-3 text-xl font-semibold tracking-[-0.04em] text-[#136DEC]"
                    style={{ fontFamily: DISPLAY_FONT }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-[#64748B] leading-relaxed">{step.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section ref={featuresRef} id="features" className="bg-[#F8FAFC] py-20 sm:py-22">
           <div className="mx-auto max-w-6xl px-6">
            <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-16">

              <div>
                <h2
                  className="mb-12 text-3xl font-semibold tracking-[-0.05em] text-[#136DEC]"
                  style={{ fontFamily: DISPLAY_FONT }}
                >
                  Built for academic focus.
                </h2>

                <div className="space-y-10">
                  <div className="feat-group flex gap-4">
                    <div className="mt-1 flex-shrink-0">
                      <span className="material-symbols-outlined text-[#6366F1]">psychology</span>
                    </div>
                    <div>
                      <h3
                        className="mb-2 text-lg font-semibold tracking-[-0.04em] text-[#136DEC]"
                        style={{ fontFamily: DISPLAY_FONT }}
                      >
                        Smart Compatibility
                      </h3>
                      <p className="text-[#64748B] leading-relaxed">Match with people whose pace, subject focus, and working style actually line up with yours.</p>
                    </div>
                  </div>

                  <div className="feat-group flex gap-4">
                    <div className="mt-1 flex-shrink-0">
                      <span className="material-symbols-outlined text-[#10B981]">monitoring</span>
                    </div>
                    <div>
                      <h3
                        className="mb-2 text-lg font-semibold tracking-[-0.04em] text-[#136DEC]"
                        style={{ fontFamily: DISPLAY_FONT }}
                      >
                        Progress Tracking
                      </h3>
                      <p className="text-[#64748B] leading-relaxed">Keep momentum visible with shared goals, simple milestones, and progress you can both track.</p>
                    </div>
                  </div>

                  <div className="feat-group flex gap-4">
                    <div className="mt-1 flex-shrink-0">
                      <span className="material-symbols-outlined text-[#F59E0B]">event_available</span>
                    </div>
                    <div>
                      <h3
                        className="mb-2 text-lg font-semibold tracking-[-0.04em] text-[#136DEC]"
                        style={{ fontFamily: DISPLAY_FONT }}
                      >
                        Seamless Scheduling
                      </h3>
                      <p className="text-[#64748B] leading-relaxed">Find overlapping availability fast and move from “maybe later” to a real booked session.</p>
                    </div>
                  </div>
                </div>
              </div>

               <div className="feat-group lg:ml-auto w-full max-w-sm">
                 <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
                    <h4
                      className="mb-6 text-lg font-semibold tracking-[-0.04em] text-[#136DEC]"
                      style={{ fontFamily: DISPLAY_FONT }}
                    >
                      Upcoming Session
                    </h4>
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
                           <img src={girl} alt="User" className="h-6 w-6 rounded-full border border-white" />
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

        <section ref={ctaRef} className="bg-white py-20 text-center sm:py-22">
          <div className="mx-auto max-w-3xl px-6">
            <h2
              className="mb-6 text-3xl font-semibold tracking-[-0.05em] text-[#136DEC]"
              style={{ fontFamily: DISPLAY_FONT }}
            >
              Start learning better today.
            </h2>
            <p className="mb-10 text-lg text-[#64748B]">Create your profile, meet the right partner, and make your next study session count.</p>
            <Link to="/register">
              <button className="rounded bg-[#136DEC] px-10 py-4 text-base font-bold text-white hover:bg-[#136DEC]/90 transition-colors shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#136DEC]">
                Create Free Profile
              </button>
            </Link>
          </div>
        </section>

      </main>

      <footer className="border-t border-[#E2E8F0] bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-center text-sm font-medium text-[#94A3B8] md:flex-row md:text-left">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">school</span>
            <span className="text-[#64748B]">© 2026 StudyMatch. All rights reserved.</span>
          </div>
          <p className="text-[#94A3B8]">Designed to help students find the right partner and show up prepared.</p>
        </div>
      </footer>
      </div>
    </>
  );
}
