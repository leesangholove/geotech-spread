import { Github, Table2, Heart } from 'lucide-react';
import { siteConfig } from '@/config';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 py-10 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Table2 className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display font-semibold text-slate-900">
                {siteConfig.siteName}
              </p>
              <p className="text-xs text-slate-500">
                Live data from Google Sheets, hosted on GitHub Pages.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <a
              href="#top"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Back to top
            </a>
            {siteConfig.githubUrl && (
              <a
                href={siteConfig.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
            )}
          </div>
        </div>

        <div className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
          <p className="inline-flex items-center gap-1.5">
            Built with <Heart className="h-3.5 w-3.5 text-brand-500" /> using
            React, Vite, and Tailwind CSS.
          </p>
        </div>
      </div>
    </footer>
  );
}
