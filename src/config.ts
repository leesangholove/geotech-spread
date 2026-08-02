export interface SpreadsheetInfo {
  /** Title shown for each spreadsheet option in the selector */
  title: string;
  /** URL of the Google Spreadsheet to embed */
  spreadsheetUrl: string;
}

export interface SiteConfig {
  /** Name shown in the header, hero, and browser tab */
  siteName: string;
  /** Short badge label in the hero */
  badge: string;
  /** Big hero headline */
  headline: string;
  /** Hero supporting paragraph */
  subheadline: string;
  /** Title shown on the embedded spreadsheet window */
  spreadsheetTitle: string;

  /**
   * Available spreadsheets that can be selected in the app.
   * Recommended: add any live Google Sheets URL with public or link access.
   */
  spreadsheets: SpreadsheetInfo[];
  /** URL of the optional edit lock service used to prevent concurrent edits in the app */
  lockServiceUrl: string;
  /** Optional list of client IDs that are considered admins (can edit/delete any comment) */
  adminClientIds?: string[];

  /** Link to the GitHub repository (used by header + footer buttons) */
  githubUrl: string;
}

export const siteConfig: SiteConfig = {
  siteName: 'Data Portal',
  badge: 'Live data, always in sync',
  headline: 'Geotech spreadsheet, live on the web',
  subheadline:
    'Some fascinating analysis topics into a Google Spreadsheet. Updates you make in Engineering Sheets appear here automatically — no rebuilds, no logins, no fuss. Please leave your comments to make these spreadsheets more useful',
  spreadsheetTitle: 'Live Spreadsheet',
  spreadsheets: [
    {
      title: 'Primary Live Spreadsheet',
      spreadsheetUrl:
        'https://docs.google.com/spreadsheets/d/1LA1UyXVtt-7xcHkmUVEsGwMXaPmtEMzRl2RRkC-oSD0/edit?gid=304884396#gid=304884396',
    },
    {
      title: 'Secondary Live Spreadsheet',
      spreadsheetUrl:
        'https://docs.google.com/spreadsheets/d/1mtYXW0GlQxs4iGcFAit7Myr1l7ONiVw8JW5OtY8pbgk/edit?gid=1379421905#gid=1379421905',
    },
    {
      title: 'Third Live Spreadsheet',
      spreadsheetUrl:
        'https://docs.google.com/spreadsheets/d/1fTT2T-Uf1Z83Rlmi3Tr1zn_sE30PUR0yKh8jQhckBCg/edit?gid=925321509#gid=925321509',
    },
    {
      title: '4th Live Spreadsheet',
      spreadsheetUrl:
        'https://docs.google.com/spreadsheets/d/10P8_xEmHCyQt8z6wWP8JHOLgC6z0d4U1RgXqllpqt-I/edit?gid=2049714267#gid=2049714267',
    },
  ],
  lockServiceUrl: 'http://localhost:4000',
  adminClientIds: [],
  githubUrl: 'https://leesangholove.github.io/geotech-spread/',
};
