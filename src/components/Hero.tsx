import { ArrowDown, Sparkles, RefreshCw } from 'lucide-react';
import { siteConfig } from '@/config';

export default function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28"
    >
      <div className="absolute inset-0 bg-grid pointer-events-none" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[28rem] w-[40rem] glow blur-3xl pointer-events-none" />
      <div className="absolute top-24 right-[-6rem] h-72 w-72 rounded-full bg-brand-100/60 blur-3xl animate-float pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-medium text-brand-700 ring-1 ring-brand-100 shadow-sm animate-fade-up">
            <Sparkles className="h-4 w-4" />
            {siteConfig.badge}
          </span>

          <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 text-balance animate-fade-up">
            {siteConfig.headline}
          </h1>

          <p
            className="mt-6 text-lg sm:text-xl text-slate-600 text-balance animate-fade-up"
            style={{ animationDelay: '0.08s' }}
          >
            {siteConfig.subheadline}
          </p>

          <div
            className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up"
            style={{ animationDelay: '0.16s' }}
          >
            <a
              href="#spreadsheet"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brand-600/20 hover:bg-brand-700 transition-all hover:scale-[1.02] active:scale-[0.99]"
            >
              View the spreadsheet
              <ArrowDown className="h-4 w-4" />
            </a>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-slate-700 ring-1 ring-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
            >
              How it works
            </a>
          </div>

          <div
            className="mt-10 flex items-center justify-center gap-2 text-sm text-slate-500 animate-fade-in"
            style={{ animationDelay: '0.3s' }}
          >
            <RefreshCw className="h-4 w-4 text-brand-600" />
            Synced with Google Drive — updates appear instantly
          </div>
        </div>
      </div>
    </section>
  );
}
