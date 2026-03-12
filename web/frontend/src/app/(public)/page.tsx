import Link from 'next/link';
import { Leaf, Upload, ClipboardCheck, ArrowRight, ShieldCheck, HeartPulse } from 'lucide-react';

export default function Home() {
  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-background selection:bg-accent/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-background/30">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-secondary p-2 rounded-lg">
              <Leaf className="text-accent" size={24} />
            </div>
            <span className="text-2xl font-black text-secondary tracking-tighter">Lakwedha</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-secondary/70 font-medium">
            <a href="#how-it-works" className="hover:text-secondary transition-colors">How it works</a>
            <a href="#services" className="hover:text-secondary transition-colors">Services</a>
            <Link href="/login" className="px-6 py-2.5 bg-secondary text-white rounded-full font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-secondary/20">
=======
    <div className="min-h-screen bg-sand selection:bg-turmeric/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-clay/30">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-earth p-2 rounded-lg">
              <Leaf className="text-turmeric" size={24} />
            </div>
            <span className="text-2xl font-black text-earth tracking-tighter">Lakwedha</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-earth/70 font-medium">
            <a href="#how-it-works" className="hover:text-earth transition-colors">How it works</a>
            <a href="#services" className="hover:text-earth transition-colors">Services</a>
            <Link href="/login" className="px-6 py-2.5 bg-earth text-white rounded-full font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-earth/20">
>>>>>>> origin/pharmacy
              Pharmacy Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 overflow-hidden">
        {/* Decorative elements */}
<<<<<<< HEAD
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -mr-64 -mt-32 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-3xl -ml-32 -mb-32" />

        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div className="relative z-10 space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-bold border border-primary/20">
=======
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-herbal/5 rounded-full blur-3xl -mr-64 -mt-32 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-turmeric/10 rounded-full blur-3xl -ml-32 -mb-32" />

        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div className="relative z-10 space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-herbal/10 text-herbal rounded-full text-sm font-bold border border-herbal/20">
>>>>>>> origin/pharmacy
              <ShieldCheck size={16} />
              Sri Lanka's #1 Ayurvedic Platform
            </div>

<<<<<<< HEAD
            <h1 className="text-6xl lg:text-7xl font-black text-secondary leading-[1.1] tracking-tight">
              Healing Rooted in <span className="text-primary italic">Nature</span>, Delivered to You.
            </h1>

            <p className="text-xl text-secondary/60 leading-relaxed max-w-lg">
=======
            <h1 className="text-6xl lg:text-7xl font-black text-earth leading-[1.1] tracking-tight">
              Healing Rooted in <span className="text-herbal italic">Nature</span>, Delivered to You.
            </h1>

            <p className="text-xl text-earth/60 leading-relaxed max-w-lg">
>>>>>>> origin/pharmacy
              Experience authentic Ayurvedic healthcare. Consult certified doctors and get traditional medicines delivered directly to your doorstep.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
<<<<<<< HEAD
              <Link href="/prescriptions/upload" className="px-8 py-5 bg-secondary text-white rounded-2xl font-extrabold text-lg flex items-center justify-center gap-3 hover:bg-secondary/95 hover:shadow-2xl hover:shadow-secondary/30 transition-all active:scale-95">
                <Upload size={24} />
                Order Medicine
              </Link>
              <button className="px-8 py-5 bg-white border-2 border-background rounded-2xl font-extrabold text-lg text-secondary flex items-center justify-center gap-3 hover:bg-background transition-all active:scale-95 shadow-sm">
                Channel a Doctor
                <ArrowRight size={24} className="text-accent" />
=======
              <Link href="/prescriptions/upload" className="px-8 py-5 bg-earth text-white rounded-2xl font-extrabold text-lg flex items-center justify-center gap-3 hover:bg-earth/95 hover:shadow-2xl hover:shadow-earth/30 transition-all active:scale-95">
                <Upload size={24} />
                Order Medicine
              </Link>
              <button className="px-8 py-5 bg-white border-2 border-clay rounded-2xl font-extrabold text-lg text-earth flex items-center justify-center gap-3 hover:bg-sand transition-all active:scale-95 shadow-sm">
                Channel a Doctor
                <ArrowRight size={24} className="text-turmeric" />
>>>>>>> origin/pharmacy
              </button>
            </div>
          </div>

          <div className="relative">
             {/* Visual representation of the app's clean UI */}
<<<<<<< HEAD
             <div className="bg-white rounded-[40px] shadow-2xl shadow-secondary/10 border border-background p-8 relative z-20 overflow-hidden">
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-12 h-12 bg-background rounded-xl flex items-center justify-center">
                      <HeartPulse className="text-primary" />
                   </div>
                   <div>
                      <div className="h-4 w-32 bg-background rounded-full mb-2" />
                      <div className="h-3 w-20 bg-background/50 rounded-full" />
                   </div>
                </div>
                <div className="space-y-4">
                   <div className="h-24 w-full bg-background/30 rounded-3xl" />
                   <div className="grid grid-cols-2 gap-4">
                      <div className="h-32 bg-primary/10 rounded-3xl" />
                      <div className="h-32 bg-accent/10 rounded-3xl" />
                   </div>
                </div>
                {/* Floating "Approved" Badge */}
                <div className="absolute top-12 right-12 bg-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-background animate-bounce">
                   <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white">
                      <ClipboardCheck size={18} />
                   </div>
                   <div className="text-xs font-black text-secondary">PRESCRIPTION APPROVED</div>
                </div>
             </div>
             {/* Background blobs */}
             <div className="absolute -inset-4 bg-gradient-to-tr from-secondary/5 to-transparent rounded-[44px] -z-10" />
=======
             <div className="bg-white rounded-[40px] shadow-2xl shadow-earth/10 border border-clay p-8 relative z-20 overflow-hidden">
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-12 h-12 bg-sand rounded-xl flex items-center justify-center">
                      <HeartPulse className="text-herbal" />
                   </div>
                   <div>
                      <div className="h-4 w-32 bg-sand rounded-full mb-2" />
                      <div className="h-3 w-20 bg-sand/50 rounded-full" />
                   </div>
                </div>
                <div className="space-y-4">
                   <div className="h-24 w-full bg-sand/30 rounded-3xl" />
                   <div className="grid grid-cols-2 gap-4">
                      <div className="h-32 bg-herbal/10 rounded-3xl" />
                      <div className="h-32 bg-turmeric/10 rounded-3xl" />
                   </div>
                </div>
                {/* Floating "Approved" Badge */}
                <div className="absolute top-12 right-12 bg-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-clay animate-bounce">
                   <div className="w-8 h-8 bg-herbal rounded-full flex items-center justify-center text-white">
                      <ClipboardCheck size={18} />
                   </div>
                   <div className="text-xs font-black text-earth">PRESCRIPTION APPROVED</div>
                </div>
             </div>
             {/* Background blobs */}
             <div className="absolute -inset-4 bg-gradient-to-tr from-earth/5 to-transparent rounded-[44px] -z-10" />
>>>>>>> origin/pharmacy
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-20">
<<<<<<< HEAD
            <h2 className="text-4xl font-black text-secondary tracking-tight">Your Journey to Wellness</h2>
            <p className="text-secondary/60 font-medium italic">Simple, transparent, and completely digital.</p>
=======
            <h2 className="text-4xl font-black text-earth tracking-tight">Your Journey to Wellness</h2>
            <p className="text-earth/60 font-medium italic">Simple, transparent, and completely digital.</p>
>>>>>>> origin/pharmacy
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
<<<<<<< HEAD
              { icon: Upload, title: "Upload", desc: "Share your prescription securely through our portal.", color: "text-accent", bg: "bg-accent/10" },
              { icon: ShieldCheck, title: "Verify", desc: "Expert pharmacists review and price your primary medicines.", color: "text-primary", bg: "bg-primary/10" },
              { icon: Package, title: "Receive", desc: "Fast delivery of verified Ayurvedic medicines to your door.", color: "text-secondary", bg: "bg-secondary/10" }
            ].map((step, idx) => (
              <div key={idx} className="relative p-10 rounded-[32px] border border-background hover:border-secondary/20 hover:shadow-xl transition-all group">
                <div className={`${step.bg} w-16 h-16 rounded-2xl flex items-center justify-center ${step.color} mb-8 group-hover:scale-110 transition-transform`}>
                  <step.icon size={32} />
                </div>
                <h3 className="text-2xl font-bold text-secondary mb-3">{step.title}</h3>
                <p className="text-secondary/60 leading-relaxed">{step.desc}</p>
                <div className="absolute top-10 right-10 text-6xl font-black text-secondary/5 -z-10">{idx + 1}</div>
=======
              { icon: Upload, title: "Upload", desc: "Share your prescription securely through our portal.", color: "text-turmeric", bg: "bg-turmeric/10" },
              { icon: ShieldCheck, title: "Verify", desc: "Expert pharmacists review and price your herbal medicines.", color: "text-herbal", bg: "bg-herbal/10" },
              { icon: Package, title: "Receive", desc: "Fast delivery of verified Ayurvedic medicines to your door.", color: "text-earth", bg: "bg-earth/10" }
            ].map((step, idx) => (
              <div key={idx} className="relative p-10 rounded-[32px] border border-clay hover:border-earth/20 hover:shadow-xl transition-all group">
                <div className={`${step.bg} w-16 h-16 rounded-2xl flex items-center justify-center ${step.color} mb-8 group-hover:scale-110 transition-transform`}>
                  <step.icon size={32} />
                </div>
                <h3 className="text-2xl font-bold text-earth mb-3">{step.title}</h3>
                <p className="text-earth/60 leading-relaxed">{step.desc}</p>
                <div className="absolute top-10 right-10 text-6xl font-black text-earth/5 -z-10">{idx + 1}</div>
>>>>>>> origin/pharmacy
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Package(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-package"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="m7.5 4.5 7.5 4.4"/></svg>
  );
}
