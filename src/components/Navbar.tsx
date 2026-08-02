import { useEffect, useState } from 'react';
import { Table2, Menu, X, Github } from 'lucide-react';
import { siteConfig } from '@/config';

const links = [
  { href: '#spreadsheet', label: 'Spreadsheet' },
  { href: '#how', label: 'How it works' },
  { href: '#features', label: 'Features' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/85 backdrop-blur-md border-b border-slate-200 shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <a href="#top" className="flex items-center gap-2 group">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm transition-transform group-hover:scale-105">
              <Table2 className="h-5 w-5" />
            </span>
            <span className="font-display font-semibold text-slate-900">
              {siteConfig.siteName}
            </span>
          </a>

          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="px-3 py-2 text-sm font-medium text-slate-600 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                {l.label}
              </a>
            ))}
            {siteConfig.githubUrl && (
              <a
                href={siteConfig.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
              >
                <Github className="h-4 w-4" />
                View on GitHub
              </a>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="md:hidden pb-4 animate-fade-in">
            <div className="flex flex-col gap-1 bg-white rounded-xl border border-slate-200 p-2 shadow-lg">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  {l.label}
                </a>
              ))}
              {siteConfig.githubUrl && (
                <a
                  href={siteConfig.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5"
                >
                  <Github className="h-4 w-4" />
                  View on GitHub
                </a>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
