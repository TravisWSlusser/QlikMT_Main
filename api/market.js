// =============================================================
//  /api/market.js  —  Vercel serverless function (Market Pulse)
//
//  SETUP (one time):
//   1. Grab a free API key at https://finnhub.io  (60 calls/min free)
//   2. In your Vercel project: Settings → Environment Variables →
//        add  FINNHUB_API_KEY = your_key   then redeploy.
//
//  EDIT WHAT SHOWS: just change the SYMBOLS list below.
//  (ETFs stand in for the indices — SPY = S&P 500, QQQ = Nasdaq 100.)
//
//  The response is cached at Vercel's edge for 60s, so thousands of
//  page views cost only a handful of upstream Finnhub calls per hour.
// =============================================================

const SYMBOLS = [
  { symbol: 'SPY',  label: 'S&P 500' },
  { symbol: 'QQQ',  label: 'Nasdaq 100' },
  { symbol: 'MSFT', label: 'Microsoft' },
  { symbol: 'CRM',  label: 'Salesforce' },
  { symbol: 'SNOW', label: 'Snowflake' },
  { symbol: 'PLTR', label: 'Palantir' },
  { symbol: 'NVDA', label: 'Nvidia' },
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  const key = process.env.FINNHUB_API_KEY;
  if (!key) return res.status(500).json({ error: 'Missing FINNHUB_API_KEY env var' });

  try {
    const quotes = await Promise.all(SYMBOLS.map(async ({ symbol, label }) => {
      const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${key}`);
      const q = await r.json();           // Finnhub: c=current, d=change, dp=percent change
      return { symbol, label, price: q.c, change: q.d, pct: q.dp };
    }));
    return res.status(200).json({ updated: Date.now(), quotes });
  } catch (e) {
    return res.status(502).json({ error: 'Upstream fetch failed' });
  }
}
