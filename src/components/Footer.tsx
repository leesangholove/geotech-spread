import { useEffect, useState } from 'react';
import { Github, Table2, Heart, Users, Activity } from 'lucide-react';
import { siteConfig } from '@/config';

interface VisitorStats {
  totalVisitors: number;
  onlineVisitors: number;
}

function getVisitorId() {
  if (typeof window === 'undefined') {
    return '';
  }

  const storageKey = 'geotech-spread-visitor-id';
  const existingId = window.localStorage.getItem(storageKey);
  if (existingId) {
    return existingId;
  }

  const generatedId = `visitor-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(storageKey, generatedId);
  return generatedId;
}

export default function Footer() {
  const [visitorStats, setVisitorStats] = useState<VisitorStats>({
    totalVisitors: 0,
    onlineVisitors: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const visitorServiceUrl = `${siteConfig.lockServiceUrl.replace(/\/$/, '')}/visitors`;
    const visitorId = getVisitorId();

    const syncVisitor = async () => {
      try {
        const response = await fetch(visitorServiceUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId: visitorId }),
        });

        if (!response.ok) {
          return;
        }

        const nextStats = await response.json();
        setVisitorStats({
          totalVisitors: Number(nextStats.totalVisitors ?? 0),
          onlineVisitors: Number(nextStats.onlineVisitors ?? 0),
        });
      } catch {
        // Ignore tracking failures so the page remains usable.
      }
    };

    const refreshVisitorStats = async () => {
      try {
        const response = await fetch(`${visitorServiceUrl}/status`);
        if (!response.ok) {
          return;
        }

        const nextStats = await response.json();
        setVisitorStats({
          totalVisitors: Number(nextStats.totalVisitors ?? 0),
          onlineVisitors: Number(nextStats.onlineVisitors ?? 0),
        });
      } catch {
        // Ignore refresh failures so the page remains usable.
      }
    };

    const handleLeave = () => {
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon(
          `${visitorServiceUrl}/leave`,
          JSON.stringify({ clientId: visitorId }),
        );
      }
    };

    void syncVisitor();
    void refreshVisitorStats();

    const intervalId = window.setInterval(() => {
      void syncVisitor();
      void refreshVisitorStats();
    }, 10000);

    window.addEventListener('beforeunload', handleLeave);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('beforeunload', handleLeave);
      handleLeave();
    };
  }, []);

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

          <div className="flex flex-col items-center gap-3 sm:items-end">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <Users className="h-4 w-4 text-brand-600" />
              <span className="text-sm font-medium text-slate-700">
                Total visitors: {visitorStats.totalVisitors}
              </span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700">
              <Activity className="h-4 w-4" />
              <span className="text-sm font-medium">
                {visitorStats.onlineVisitors} online now
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-5 border-t border-slate-200 py-6 text-center text-xs text-slate-400 sm:flex-row">
          <p className="inline-flex items-center gap-1.5">
            Built with <Heart className="h-3.5 w-3.5 text-brand-500" /> using
            React, Vite, and Tailwind CSS.
          </p>

          <div className="flex items-center gap-5">
            <a
              href="#top"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              Back to top
            </a>
            {siteConfig.githubUrl && (
              <a
                href={siteConfig.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
