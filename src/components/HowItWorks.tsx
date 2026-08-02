import { FileSpreadsheet, Upload, Globe, RefreshCw } from 'lucide-react';

const steps = [
  {
    icon: FileSpreadsheet,
    title: 'Keep your sheet in Google Drive',
    body: 'Your original spreadsheet stays exactly where it is in Google Drive. Nothing moves — you just share it.',
  },
  {
    icon: Upload,
    title: 'Set it to anyone with the link',
    body: 'In Google Sheets, click Share and set General access to "Anyone with the link". That lets the website display it.',
  },
  {
    icon: Globe,
    title: 'Publish on GitHub Pages',
    body: 'This site is built to host free on GitHub Pages. Push the code to a GitHub repository and enable Pages — done.',
  },
  {
    icon: RefreshCw,
    title: 'Edits sync automatically',
    body: 'Every time you update the spreadsheet in Google Sheets, visitors see the latest data on the website right away.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="py-20 sm:py-28 bg-slate-50/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 text-balance">
            From Google Drive to a live site
          </h2>
          <p className="mt-3 text-slate-600">
            No databases to manage. No servers to run. Just a spreadsheet and a
            free GitHub account.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="relative rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
            >
              <span className="absolute -top-3 left-6 flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white shadow">
                {i + 1}
              </span>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                {s.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
