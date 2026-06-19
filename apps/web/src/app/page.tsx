'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Search,
  ArrowRight,
  Bot,
  MessageCircle,
  Zap,
  Globe,
  Settings,
  Menu,
  X,
  Plus
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  /* ─── Intersection reveal ─── */
  const revealRef = useRef(false);
  useEffect(() => {
    if (revealRef.current) return;
    revealRef.current = true;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground noise font-[family-name:var(--font-inter)]">
      
      {/* ━━━ NAVBAR ━━━ */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
              <span className="text-background font-bold text-lg font-[family-name:var(--font-sora)]">T</span>
            </div>
            <span className="text-xl font-bold tracking-tight">TaskMind</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#integrations" className="hover:text-foreground transition-colors">Integrations</a>
            <a href="#cta" className="hover:text-foreground transition-colors">Get Started</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/sign-in" className="text-sm font-medium hover:text-muted-foreground transition-colors">Log in</Link>
            <Link href="/sign-up" className="bg-foreground text-background px-4 py-2 rounded-full text-sm font-medium hover:bg-foreground/90 transition-all">
              Sign up
            </Link>
          </div>

          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="absolute top-full left-0 right-0 bg-background border-b border-border p-4 flex flex-col gap-4 md:hidden">
            <a href="#features" className="text-sm font-medium" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#integrations" className="text-sm font-medium" onClick={() => setMenuOpen(false)}>Integrations</a>
            <a href="#cta" className="text-sm font-medium" onClick={() => setMenuOpen(false)}>Get Started</a>
            <hr className="border-border" />
            <Link href="/sign-in" className="text-sm font-medium" onClick={() => setMenuOpen(false)}>Log in</Link>
            <Link href="/sign-up" className="bg-foreground text-background text-center px-4 py-2 rounded-full text-sm font-medium" onClick={() => setMenuOpen(false)}>
              Sign up
            </Link>
          </div>
        )}
      </header>

      <main className="pt-32 pb-24">
        {/* ━━━ HERO ━━━ */}
        <section className="max-w-7xl mx-auto px-6 text-center pt-10 md:pt-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            TaskMind AI is now in public beta
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-[8rem] font-black tracking-tighter leading-[0.9] mb-6 animate-fade-in delay-100">
            Your Personal <br className="hidden md:block" />
            AI Agent.
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 animate-fade-in delay-200">
            One chat interface for all your apps. Ask in plain language and TaskMind searches, drafts, schedules, and automates workflows for you.
          </p>

          {/* Centralized Chat UI Mockup */}
          <div className="max-w-3xl mx-auto bg-card rounded-[2rem] shadow-2xl border border-border p-2 md:p-4 text-left animate-fade-in delay-300 relative z-10">
            <div className="bg-secondary rounded-[1.5rem] p-4 md:p-8 flex flex-col gap-6 h-[400px]">
              
              {/* Fake chat messages */}
              <div className="flex flex-col gap-4 flex-1 overflow-hidden">
                <div className="self-end bg-foreground text-background px-4 py-3 rounded-2xl rounded-tr-sm max-w-[80%] text-sm md:text-base">
                  Can you find the Q3 roadmap document and summarize the key milestones for the engineering team?
                </div>
                
                <div className="self-start flex gap-3 max-w-[90%]">
                  <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center shrink-0 shadow-sm border border-border mt-1">
                    <Bot className="w-4 h-4 text-foreground" />
                  </div>
                  <div className="bg-background text-foreground px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm border border-border text-sm md:text-base">
                    <p className="mb-2">I found the <strong>Q3 Engineering Roadmap</strong> in Notion. Here are the key milestones:</p>
                    <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                      <li>Launch AI Workflow builder (Aug 15)</li>
                      <li>Migrate core DB to PostgreSQL (Sep 1)</li>
                      <li>Release SOC2 compliance features (Sep 20)</li>
                    </ul>
                    <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
                      <Settings className="w-3 h-3" /> Searched Notion & Google Drive
                    </p>
                  </div>
                </div>
              </div>

              {/* Input Area */}
              <div className="bg-background rounded-xl shadow-sm border border-border p-2 flex items-center gap-2">
                <button className="p-2 text-muted-foreground hover:bg-secondary rounded-lg transition-colors">
                  <Plus className="w-5 h-5" />
                </button>
                <input 
                  type="text" 
                  placeholder="Ask TaskMind to do anything..." 
                  className="flex-1 bg-transparent border-none outline-none text-sm md:text-base placeholder:text-muted-foreground"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <Link href="/dashboard" className="bg-foreground text-background p-2 rounded-lg hover:bg-foreground/90 transition-colors cursor-pointer flex items-center justify-center">
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

            </div>
          </div>
        </section>

        {/* ━━━ LOGO TICKER ━━━ */}
        <section id="integrations" className="py-20 border-b border-border overflow-hidden">
          <p className="text-center text-sm font-medium text-muted-foreground mb-8">
            Connects seamlessly with the tools you already use
          </p>
          <div className="flex w-full overflow-hidden pause-on-hover relative">
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
            
            <div className="flex animate-scroll whitespace-nowrap gap-16 px-8 items-center text-muted-foreground">
              {/* Ticker items duplicated for seamless loop */}
              {[1, 2].map((group) => (
                <div key={group} className="flex gap-16 items-center">
                  <span className="text-2xl font-bold font-[family-name:var(--font-sora)]">Slack</span>
                  <span className="text-2xl font-bold font-[family-name:var(--font-sora)]">Notion</span>
                  <span className="text-2xl font-bold font-[family-name:var(--font-sora)]">GitHub</span>
                  <span className="text-2xl font-bold font-[family-name:var(--font-sora)]">Linear</span>
                  <span className="text-2xl font-bold font-[family-name:var(--font-sora)]">Gmail</span>
                  <span className="text-2xl font-bold font-[family-name:var(--font-sora)]">Discord</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━ FEATURES ━━━ */}
        <section id="features" className="py-24 max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 reveal">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Everything in one place.</h2>
            <p className="text-lg text-muted-foreground">Stop switching context. Let your AI agent handle the busywork across all your platforms simultaneously.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Search, title: 'Universal Search', desc: 'Find documents, messages, and files instantly across all your connected apps without opening them.' },
              { icon: Zap, title: 'Autonomous Workflows', desc: 'Create complex automations using natural language. "When I get an email from a client, summarize it to Slack."' },
              { icon: MessageCircle, title: 'Smart Drafting', desc: 'Draft emails, technical docs, and reports using context from your entire organization\'s knowledge base.' }
            ].map((feat, i) => (
              <div key={i} className={`bg-secondary/50 rounded-2xl p-8 border border-border reveal reveal-d${i+1}`}>
                <div className="w-12 h-12 bg-background rounded-xl border border-border flex items-center justify-center mb-6 shadow-sm">
                  <feat.icon className="w-6 h-6 text-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feat.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ━━━ CTA ━━━ */}
        <section id="cta" className="py-24 px-6">
          <div className="max-w-4xl mx-auto bg-foreground text-background rounded-[2rem] p-12 text-center reveal">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">Ready to delegate?</h2>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto mb-10">
              Join thousands of professionals saving hours every week with their personal AI agent.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/dashboard" className="bg-background text-foreground px-8 py-4 rounded-full font-semibold hover:scale-105 transition-transform text-center cursor-pointer">
                Get Started for Free
              </Link>
              <Link href="/dashboard" className="bg-foreground text-background border border-border/20 px-8 py-4 rounded-full font-semibold hover:bg-background/10 transition-colors text-center cursor-pointer">
                Book a Demo
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ━━━ FOOTER ━━━ */}
      <footer className="border-t border-border bg-secondary/30 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-foreground rounded flex items-center justify-center">
              <span className="text-background font-bold text-xs font-[family-name:var(--font-sora)]">T</span>
            </div>
            <span className="font-bold tracking-tight">TaskMind</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 TaskMind AI. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Twitter</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">GitHub</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Discord</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
