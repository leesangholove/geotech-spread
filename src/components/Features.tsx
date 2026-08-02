import { RefreshCw, Lock, Cloud, FileSpreadsheet, Smartphone, GitBranch } from 'lucide-react';

const features = [
  {
    icon: RefreshCw,
    title: 'Always in sync',
    body: 'Edit your spreadsheet and the website reflects the change immediately. No republishing needed.',
  },
  {
    icon: Cloud,
    title: 'Hosted on Google Drive',
    body: 'The source of truth stays in Google Drive, so you keep using the tools you already know.',
  },
  {
    icon: GitBranch,
    title: 'Free GitHub hosting',
    body: 'The website runs on GitHub Pages — completely free with your GitHub account, with HTTPS included.',
  },
  {
    icon: Smartphone,
    title: 'Works on every device',
    body: 'A responsive layout that looks great on phones, tablets, and desktops alike.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Familiar spreadsheet look',
    body: 'The embedded sheet keeps the grid and formatting your team is used to seeing.',
  },
  {
    icon: Lock,
    title: 'You control access',
    body: 'Visibility follows the sharing settings on your original Google Sheet. You stay in charge.',
  },
];

export default function Features() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 text-balance">
            Simple, free, and reliable
          </h2>
          <p className="mt-3 text-slate-600">
            Everything you need to publish a spreadsheet to the web without
            running a server.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm transition-all hover:shadow-md hover:ring-brand-200"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                {f.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
