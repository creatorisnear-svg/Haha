import { useEffect, useRef, useState } from "react";
import logoPath from "@assets/Screenshot_20260420_195437_TikTok_1776741331060.jpg";
import heroBg from "@/assets/hero-bg.png";
import aboutTexture from "@/assets/about-texture.png";
import manifestoBg from "@/assets/manifesto-bg.png";
import { Link } from "wouter";

export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="relative min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary selection:text-white">
      <div className="bg-noise" />

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 w-full z-50 px-6 py-6 flex justify-between items-center transition-all duration-500 ${scrolled ? 'bg-background/80 backdrop-blur-md border-b border-white/5 py-4' : 'bg-transparent'}`}>
        <div className="text-xl font-display tracking-widest text-white uppercase group flex items-center gap-4">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 group-hover:border-primary transition-colors">
            <img src={logoPath} alt="VAA Logo" className="w-full h-full object-cover mix-blend-screen grayscale contrast-150" />
          </div>
          <span className="hidden sm:inline-block">VIGR Angel</span>
        </div>
        <div className="flex gap-6 md:gap-12 font-sans text-xs md:text-sm tracking-[0.2em] text-white/70">
          <a href="#about" className="hover:text-primary transition-colors duration-300 uppercase">About</a>
          <a href="#manifesto" className="hover:text-primary transition-colors duration-300 uppercase">Manifesto</a>
          <a href="#syndicate" className="hover:text-primary transition-colors duration-300 uppercase">Syndicate</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroBg} 
            alt="Dark cinematic angel" 
            className="w-full h-full object-cover opacity-30 grayscale scale-105 animate-[pulse_20s_ease-in-out_infinite]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center pt-20">
          <div className="relative w-48 h-48 md:w-64 md:h-64 mb-16 animate-in fade-in zoom-in duration-1000 ease-out">
            <div className="absolute inset-[-20%] bg-primary/20 rounded-full blur-3xl opacity-40 animate-pulse" />
            <img 
              src={logoPath} 
              alt="VIGR Angel Apparel Logo" 
              className="w-full h-full object-cover rounded-full border-2 border-primary/30 mix-blend-screen grayscale contrast-200"
            />
          </div>

          <div className="text-center px-4 animate-in slide-in-from-bottom-12 fade-in duration-1000 delay-300 fill-mode-both">
            <h1 className="text-7xl md:text-9xl lg:text-[12rem] font-display text-white mb-2 tracking-tighter leading-none mix-blend-overlay">
              GRIT & <span className="text-primary italic font-serif lowercase tracking-tight relative">
                Grace
                <span className="absolute -inset-1 blur-xl bg-primary/30 -z-10 rounded-full"></span>
              </span>
            </h1>
            <p className="text-muted-foreground font-sans max-w-2xl mx-auto text-lg md:text-xl tracking-[0.2em] uppercase mt-8 border-t border-white/10 pt-8">
              Underground faith. Raw street elements. 
              <br />The crown is heavy.
            </p>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce opacity-50">
          <span className="font-sans text-xs tracking-widest uppercase mb-2">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-primary to-transparent" />
        </div>
      </section>

      {/* Marquee Section 1 */}
      <div className="border-y border-white/5 bg-black/80 py-6 overflow-hidden relative z-20">
        <div className="marquee-container">
          <div className="marquee-content text-5xl md:text-7xl font-display uppercase tracking-widest text-white/10">
            <span className="mx-8 hover:text-primary transition-colors cursor-default">Crown of Thorns</span> • 
            <span className="mx-8 hover:text-primary transition-colors cursor-default text-stroke">VIGR Angel</span> • 
            <span className="mx-8 hover:text-primary transition-colors cursor-default">Rebel Spirit</span> • 
            <span className="mx-8 hover:text-primary transition-colors cursor-default text-stroke">Street Faith</span> • 
            <span className="mx-8 hover:text-primary transition-colors cursor-default">Crown of Thorns</span> • 
            <span className="mx-8 hover:text-primary transition-colors cursor-default text-stroke">VIGR Angel</span> • 
            <span className="mx-8 hover:text-primary transition-colors cursor-default">Rebel Spirit</span> • 
            <span className="mx-8 hover:text-primary transition-colors cursor-default text-stroke">Street Faith</span> • 
          </div>
        </div>
      </div>

      {/* About Section */}
      <section id="about" className="relative py-32 md:py-48 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24 items-center">
          <div className="order-2 lg:order-1 relative h-[70vh] overflow-hidden group">
            <div className="absolute inset-0 bg-primary/20 mix-blend-overlay group-hover:bg-transparent transition-colors duration-1000 z-10" />
            <img 
              src={aboutTexture} 
              alt="Raw fabric texture" 
              className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-[0.5] group-hover:opacity-100 transition-all duration-1000 group-hover:scale-110"
            />
            <div className="absolute inset-4 border border-white/20 transition-all duration-700 group-hover:scale-[0.95] group-hover:border-primary/50" />
          </div>
          
          <div className="order-1 lg:order-2 space-y-12">
            <div className="flex items-center gap-4">
              <div className="w-12 h-px bg-primary" />
              <span className="font-sans text-xs tracking-[0.3em] uppercase text-primary">The Genesis</span>
            </div>
            
            <h2 className="text-5xl md:text-7xl font-display text-white leading-none">
              Forged in <span className="text-primary block font-serif italic lowercase tracking-normal mt-4 text-6xl md:text-8xl">Shadows</span>
            </h2>
            
            <div className="space-y-8 font-sans text-muted-foreground text-lg leading-relaxed font-light">
              <p className="text-xl text-white/80">
                VIGR Angel Apparel is not just fabric. It's a statement written in ink and woven in defiance.
              </p>
              <p>
                We exist at the intersection of underground street art and raw, unapologetic faith. Born from the concept of the crown of thorns—a symbol of suffering turned into ultimate victory. 
              </p>
              <p>
                Our garments are armor for those who walk through the grit of the city but carry grace in their spirit. We don't make clothes for the masses. We make statements for the few.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quote Interlude */}
      <section className="py-32 px-6 bg-black relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,0,0,0.1)_0%,transparent_70%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <svg className="w-16 h-16 text-primary/30 mx-auto mb-12" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
          <p className="text-3xl md:text-5xl font-serif text-white/90 leading-tight">
            "The world <span className="text-primary italic">bleeds</span>. <br />We wear the <span className="font-display uppercase tracking-widest text-4xl md:text-6xl not-italic ml-2">scars</span>."
          </p>
        </div>
      </section>

      {/* Manifesto Section */}
      <section id="manifesto" className="relative py-32 md:py-48 flex flex-col items-center justify-center min-h-screen text-center px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={manifestoBg} 
            alt="Grunge wall" 
            className="w-full h-full object-cover opacity-20 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto space-y-16">
          <div className="flex flex-col items-center gap-6">
            <div className="w-px h-24 bg-primary mx-auto opacity-50" />
            <span className="font-sans text-sm tracking-[0.4em] uppercase text-primary">Manifesto</span>
          </div>
          
          <h2 className="text-6xl md:text-8xl lg:text-[8rem] font-display text-white leading-[0.9] tracking-tighter uppercase">
            No Compromises. <br />
            <span className="text-stroke text-white/20">No False Idols.</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left mt-24">
            <div className="space-y-4 border-l border-white/10 pl-6 hover:border-primary transition-colors duration-500">
              <h3 className="font-display text-3xl text-white tracking-widest">01. The Grit</h3>
              <p className="font-sans text-muted-foreground font-light leading-relaxed">
                The streets don't forgive, and neither do we. Our aesthetic is pulled from the concrete, the alleyways, the places where true art is born out of necessity.
              </p>
            </div>
            <div className="space-y-4 border-l border-white/10 pl-6 hover:border-primary transition-colors duration-500">
              <h3 className="font-display text-3xl text-white tracking-widest">02. The Grace</h3>
              <p className="font-sans text-muted-foreground font-light leading-relaxed">
                In the darkness, there is light. The crown of thorns reminds us that the heaviest burdens can become the greatest triumphs. We wear our faith unapologetically.
              </p>
            </div>
            <div className="space-y-4 border-l border-white/10 pl-6 hover:border-primary transition-colors duration-500">
              <h3 className="font-display text-3xl text-white tracking-widest">03. The Garment</h3>
              <p className="font-sans text-muted-foreground font-light leading-relaxed">
                Every thread is intentional. No fast fashion. No cheap thrills. We craft armor for the modern believer, the creative outcast, the rebel with a cause.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee Section 2 - Reverse */}
      <div className="border-y border-white/5 bg-primary/10 py-4 overflow-hidden relative z-20 backdrop-blur-sm">
        <div className="marquee-container" style={{ direction: 'rtl' }}>
          <div className="marquee-content text-3xl md:text-5xl font-display uppercase tracking-widest text-primary/80" style={{ animationDirection: 'reverse' }}>
            <span className="mx-8">Join the Syndicate</span> • 
            <span className="mx-8 text-white/50">Exclusive Drops</span> • 
            <span className="mx-8">Join the Syndicate</span> • 
            <span className="mx-8 text-white/50">Exclusive Drops</span> • 
            <span className="mx-8">Join the Syndicate</span> • 
            <span className="mx-8 text-white/50">Exclusive Drops</span> • 
            <span className="mx-8">Join the Syndicate</span> • 
            <span className="mx-8 text-white/50">Exclusive Drops</span> • 
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <section id="syndicate" className="py-32 md:py-48 px-6 bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(139,0,0,0.15)_0%,transparent_60%)]" />
        
        <div className="max-w-3xl mx-auto text-center space-y-12 relative z-10">
          <div className="w-24 h-24 mx-auto mb-12">
            <img src={logoPath} alt="VAA Seal" className="w-full h-full object-cover rounded-full mix-blend-screen grayscale opacity-50" />
          </div>

          <h2 className="text-5xl md:text-7xl font-display text-white tracking-widest uppercase">
            Join the <span className="text-primary">Syndicate</span>
          </h2>
          
          <p className="font-sans text-muted-foreground text-lg md:text-xl font-light tracking-wide">
            Enter the inner circle. First access to drops, exclusive pieces, and the VAA manifesto. We don't spam. We send truth.
          </p>
          
          <form className="relative flex flex-col sm:flex-row gap-0 group pt-8" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="ENTER YOUR EMAIL" 
              className="w-full bg-white/5 border border-white/10 px-8 py-6 text-white font-sans uppercase tracking-widest focus:outline-none focus:border-primary focus:bg-white/10 transition-all placeholder:text-white/30 text-lg"
              required
            />
            <button 
              type="submit"
              className="shrink-0 bg-primary text-white px-12 py-6 font-display text-2xl tracking-widest hover:bg-white hover:text-black transition-colors duration-300 relative overflow-hidden border border-primary hover:border-white"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-24 pb-12 border-t border-white/5 px-6 relative bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-24">
            <div className="col-span-1 md:col-span-2 space-y-8">
              <div className="text-2xl font-display tracking-widest text-white uppercase">VIGR Angel Apparel</div>
              <p className="font-sans text-white/40 text-sm tracking-wide max-w-sm leading-relaxed">
                Streetwear forged in faith and grit. Designed for the rebels, the believers, and the outcasts.
              </p>
            </div>
            
            <div className="space-y-6">
              <h4 className="font-display text-xl tracking-widest text-white">Explore</h4>
              <div className="flex flex-col gap-4 font-sans text-sm tracking-widest text-white/40 uppercase">
                <a href="#about" className="hover:text-primary transition-colors">About</a>
                <a href="#manifesto" className="hover:text-primary transition-colors">Manifesto</a>
                <a href="#syndicate" className="hover:text-primary transition-colors">Syndicate</a>
              </div>
            </div>
            
            <div className="space-y-6">
              <h4 className="font-display text-xl tracking-widest text-white">Connect</h4>
              <div className="flex flex-col gap-4 font-sans text-sm tracking-widest text-white/40 uppercase">
                <a href="#" className="hover:text-primary transition-colors">Instagram</a>
                <a href="#" className="hover:text-primary transition-colors">Contact</a>
                <a href="#" className="hover:text-primary transition-colors">Terms</a>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-8 border-t border-white/5">
            <div className="w-12 h-12 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
              <img src={logoPath} alt="VAA Logo" className="w-full h-full object-contain rounded-full" />
            </div>
            
            <div className="font-sans text-xs tracking-widest text-white/30 uppercase">
              © {new Date().getFullYear()} VIGR Angel Apparel. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
