'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Star, Loader2 } from 'lucide-react';

interface UniversalResult {
  company_name: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  rating?: number;
  review_count?: number;
  category?: string;
  source?: string;
  place_id?: string;
  source_url?: string;
}

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", 
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", 
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", 
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", 
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

export default function Dashboard() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("AZ");
  const [mode, setMode] = useState<"quick" | "deep" | "max">("quick");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<UniversalResult[]>([]);
  const [searchExecuted, setSearchExecuted] = useState(false);
  const [lastSearchTime, setLastSearchTime] = useState<string>("");
  const [stats, setStats] = useState<{ total_leads: number; new_today: number; total_runs: number } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };
    fetchStats();
  }, []);

  const handleSearch = async (queryVal: string, cityVal: string, stateVal: string, modeVal: string) => {
    if (!queryVal.trim()) {
      setError("Please enter an industry or search query (e.g., plumbers, photographers).");
      return;
    }
    if (!cityVal.trim()) {
      setError("Please enter a city (e.g., Dallas, Phoenix).");
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);
    
    try {
      // 1. Try POST /api/search
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryVal.trim(),
          city: cityVal.trim(),
          state: stateVal.trim(),
          mode: modeVal,
          limit: 200
        })
      });

      if (res.status === 200) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.results)) {
          setResults(data.results);
          setSearchExecuted(true);
          const now = new Date();
          const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setLastSearchTime(`${queryVal.trim()} in ${cityVal.trim()} (${timeStr})`);
          setLoading(false);
          // Refetch stats to update totals
          try {
            const statsRes = await fetch('/api/stats');
            if (statsRes.ok) {
              setStats(await statsRes.json());
            }
          } catch (e) {
            console.error(e);
          }
          return;
        } else {
          console.warn("Search API failed with message, falling back:", data.error);
        }
      } else {
        console.warn(`Search API returned status ${res.status}, falling back to scrape...`);
      }
    } catch (searchErr) {
      console.error("Search API Error:", searchErr);
    }

    // 2. Fallback to POST /api/scrape
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry: queryVal.trim(),
          city: cityVal.trim(),
          state: stateVal.trim(),
          mode: modeVal,
          limit: 200
        })
      });

      if (res.status === 200) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.leads)) {
          const mappedLeads: UniversalResult[] = data.leads.map((l: any) => ({
            company_name: l.company_name || l.name || "Unknown Company",
            phone: l.phone,
            email: l.email,
            website: l.website,
            address: l.address || l.street_address || l.location,
            city: l.city,
            state: l.state,
            rating: l.rating,
            review_count: l.review_count || l.reviews_count,
            category: l.category,
            source: l.source,
            source_url: l.source_url
          }));
          setResults(mappedLeads);
          setSearchExecuted(true);
          const now = new Date();
          const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setLastSearchTime(`${queryVal.trim()} in ${cityVal.trim()} (${timeStr})`);
          setLoading(false);
          // Refetch stats to update totals
          try {
            const statsRes = await fetch('/api/stats');
            if (statsRes.ok) {
              setStats(await statsRes.json());
            }
          } catch (e) {
            console.error(e);
          }
          return;
        } else {
          throw new Error(data.error || "Scrape API response not successful");
        }
      } else {
        const text = await res.text();
        throw new Error(`Scrape API returned ${res.status}: ${text}`);
      }
    } catch (scrapeErr: any) {
      console.error("Scrape API Error:", scrapeErr);
      setError(scrapeErr.message || "Both Search and Scrape APIs failed. Please check connection and inputs.");
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (results.length === 0) return;
    const cols = ["Company Name", "Phone", "Email", "Website", "Address", "City", "State", "Rating", "Reviews", "Source"];
    const csvContent = [
      cols.join(","),
      ...results.map(r => {
        const row = [
          r.company_name || "",
          r.phone || "",
          r.email || "",
          r.website || "",
          r.address || "",
          r.city || "",
          r.state || "",
          r.rating !== undefined ? String(r.rating) : "",
          r.review_count !== undefined ? String(r.review_count) : "",
          r.source || ""
        ];
        return row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `xtreme-scraper-leads-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSourceCounts = () => {
    const counts: Record<string, number> = {};
    results.forEach(r => {
      const src = r.source || 'unknown';
      counts[src] = (counts[src] || 0) + 1;
    });
    return counts;
  };

  const getSourceColor = (src: string) => {
    const s = String(src).toLowerCase();
    if (s.includes('google')) return 'bg-blue-500';
    if (s.includes('bbb')) return 'bg-emerald-600';
    if (s.includes('yellow')) return 'bg-yellow-500';
    if (s.includes('yelp')) return 'bg-rose-600';
    if (s.includes('bing')) return 'bg-cyan-500';
    if (s.includes('apollo')) return 'bg-indigo-600';
    if (s.includes('ai')) return 'bg-purple-500';
    return 'bg-gray-400';
  };

  const getSourceBadgeStyle = (src: string) => {
    const s = String(src).toLowerCase();
    if (s.includes('google')) return 'bg-blue-50 text-blue-600 border border-blue-100';
    if (s.includes('bbb')) return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
    if (s.includes('yellow')) return 'bg-yellow-50 text-yellow-600 border border-yellow-100';
    if (s.includes('yelp')) return 'bg-rose-50 text-rose-600 border border-rose-100';
    if (s.includes('bing')) return 'bg-cyan-50 text-cyan-600 border border-cyan-100';
    if (s.includes('apollo')) return 'bg-indigo-50 text-indigo-600 border border-indigo-100';
    if (s.includes('ai')) return 'bg-purple-50 text-purple-600 border border-purple-100';
    return 'bg-gray-50 text-gray-600 border border-gray-100';
  };

  const renderStars = (rating: number, reviewCount?: number) => {
    const stars = [];
    const roundedRating = Math.round(rating * 2) / 2;
    for (let i = 1; i <= 5; i++) {
      if (i <= roundedRating) {
        stars.push(<span key={i} className="text-yellow-400 text-sm">★</span>);
      } else {
        stars.push(<span key={i} className="text-gray-200 text-sm">★</span>);
      }
    }
    return (
      <div className="flex items-center space-x-1">
        <div className="flex space-x-0.5">{stars}</div>
        <span className="text-xs font-extrabold text-black ml-1">{rating.toFixed(1)}</span>
        {reviewCount !== undefined && reviewCount > 0 && (
          <span className="text-xs text-gray-400 font-bold ml-1">({reviewCount} reviews)</span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#ffffff] text-black font-sans selection:bg-[#FFBE00] selection:text-black">
      {/* Navigation */}
      <header className="border-b border-gray-100 bg-[#ffffff] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="font-black text-2xl tracking-tighter text-black uppercase">
            XTREME SCRAPER
          </div>
          <Link 
            href="/" 
            className="text-gray-500 hover:text-black font-extrabold text-sm transition-colors uppercase tracking-wider"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Main Area */}
      <main className="p-6 md:p-8 max-w-7xl mx-auto w-full">
        
        {/* Page Header */}
        <div className="mb-8">
          <span className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">DASHBOARD / ACTIVE SCRAPE</span>
          <h1 className="text-4xl font-black text-black uppercase tracking-tight mt-1">UNIVERSAL CONTROL PANEL</h1>
        </div>

        {/* Stats Summary Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#ffffff] border border-gray-200 p-5 rounded-xl shadow-sm">
            <div className="text-gray-400 font-black text-[10px] uppercase tracking-widest">TOTAL SEARCHES</div>
            <div className="text-2xl md:text-3xl font-black text-black mt-1">
              {stats !== null ? stats.total_runs.toLocaleString() : '-'}
            </div>
          </div>
          <div className="bg-[#ffffff] border border-gray-200 p-5 rounded-xl shadow-sm">
            <div className="text-gray-400 font-black text-[10px] uppercase tracking-widest">TOTAL RESULTS</div>
            <div className="text-2xl md:text-3xl font-black text-black mt-1">
              {stats !== null ? stats.total_leads.toLocaleString() : '-'}
            </div>
          </div>
          <div className="bg-[#ffffff] border border-gray-200 p-5 rounded-xl shadow-sm overflow-hidden">
            <div className="text-gray-400 font-black text-[10px] uppercase tracking-widest">LAST SEARCH</div>
            <div className="text-sm md:text-base font-black text-black mt-1 truncate" title={lastSearchTime || undefined}>
              {lastSearchTime || '-'}
            </div>
          </div>
          <div className="bg-[#ffffff] border border-gray-200 p-5 rounded-xl shadow-sm">
            <div className="text-gray-400 font-black text-[10px] uppercase tracking-widest">SOURCES ACTIVE</div>
            <div className="text-2xl md:text-3xl font-black text-[#FFBE00] mt-1">
              {stats !== null ? '10' : '-'}
            </div>
          </div>
        </div>

        {/* Inline Error Panel */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm font-semibold mb-6 flex justify-between items-center">
            <span>⚠️ {error}</span>
            <button 
              onClick={() => setError(null)} 
              className="text-red-500 hover:text-red-700 font-black text-xs uppercase tracking-widest ml-4 shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Search Card Section */}
        <div className="bg-[#ffffff] border border-gray-200 rounded-2xl p-6 shadow-sm mb-8">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(query, city, state, mode);
            }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Large Text Input */}
              <div className="lg:col-span-6">
                <label className="block text-gray-700 font-black text-xs uppercase tracking-wider mb-2">Industry / Category</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search any industry... (plumbers, photographers, accountants)" 
                    className="w-full bg-[#ffffff] border border-gray-200 text-black pl-11 pr-4 py-3.5 rounded-xl font-bold text-sm focus:outline-none focus:border-[#FFBE00] transition-colors shadow-inner"
                  />
                </div>
              </div>

              {/* City Input */}
              <div className="lg:col-span-4">
                <label className="block text-gray-700 font-black text-xs uppercase tracking-wider mb-2">City</label>
                <input 
                  type="text" 
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City (e.g. Dallas, Miami, Denver)" 
                  className="w-full bg-[#ffffff] border border-gray-200 text-black px-4 py-3.5 rounded-xl font-bold text-sm focus:outline-none focus:border-[#FFBE00] transition-colors shadow-inner"
                />
              </div>

              {/* State Dropdown */}
              <div className="lg:col-span-2">
                <label className="block text-gray-700 font-black text-xs uppercase tracking-wider mb-2">State</label>
                <div className="relative">
                  <select 
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-[#ffffff] border border-gray-200 text-black px-4 py-3.5 rounded-xl font-bold text-sm focus:outline-none focus:border-[#FFBE00] transition-colors cursor-pointer appearance-none shadow-inner"
                  >
                    {US_STATES.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
                    ▼
                  </div>
                </div>
              </div>
            </div>

            {/* Mode selector and Search button */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-2 border-t border-gray-100">
              <div>
                <span className="block text-gray-700 font-black text-xs uppercase tracking-wider mb-2">Extraction Mode</span>
                <div className="flex flex-wrap gap-2">
                  {(["quick", "deep", "max"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={`px-5 py-2.5 rounded-full font-extrabold text-xs uppercase tracking-widest transition-all ${
                        mode === m 
                          ? "bg-[#FFBE00] text-black shadow-md border border-[#FFBE00]" 
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-end">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto bg-[#FFBE00] hover:brightness-105 disabled:bg-gray-100 disabled:text-gray-400 text-black font-black text-sm tracking-widest uppercase px-8 py-4 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-md border border-[#FFBE00]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin text-black" size={16} />
                      <span>Scraping...</span>
                    </>
                  ) : (
                    <span>Search →</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center shadow-sm flex flex-col items-center justify-center mb-8">
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-full border-4 border-gray-100 border-t-[#FFBE00] animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-black text-gray-400">XPS</span>
              </div>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight text-black mb-2">Extracting real-time leads...</h3>
            <p className="text-gray-500 text-sm font-medium max-w-md mx-auto">
              Our universal engine is scraping sources across {mode === 'quick' ? 'Google Maps & BBB' : mode === 'deep' ? 'all search keywords & directory types' : 'everything plus Apollo'}. This can take up to {mode === 'quick' ? '15' : mode === 'deep' ? '45' : '75'} seconds.
            </p>
          </div>
        )}

        {/* Example Queries: Shown before first search */}
        {!searchExecuted && !loading && (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm mb-8">
            <div className="max-w-xl mx-auto">
              <h2 className="text-xl font-black text-black uppercase tracking-tight mb-2">Ready to scrape leads?</h2>
              <p className="text-gray-500 text-sm font-medium mb-6">
                Enter any industry/category and city above, or click one of our popular example queries below to pre-fill the form instantly.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { label: 'Plumbers in Dallas, TX', query: 'Plumbers', city: 'Dallas', state: 'TX' },
                  { label: 'Wedding photographers in Austin, TX', query: 'Wedding photographers', city: 'Austin', state: 'TX' },
                  { label: 'Roofing contractors in Denver, CO', query: 'Roofing contractors', city: 'Denver', state: 'CO' },
                  { label: 'Accountants in Chicago, IL', query: 'Accountants', city: 'Chicago', state: 'IL' }
                ].map((pill, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQuery(pill.query);
                      setCity(pill.city);
                      setState(pill.state);
                    }}
                    className="px-4 py-3 bg-gray-50 hover:bg-[#FFBE00]/10 border border-gray-200 hover:border-[#FFBE00] rounded-xl text-left font-bold text-xs text-gray-700 hover:text-black transition-all flex justify-between items-center group"
                  >
                    <span>Try: <span className="font-extrabold text-black">{pill.label}</span></span>
                    <span className="text-gray-400 group-hover:text-black transition-colors">→</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results Panel */}
        {searchExecuted && !loading && (
          <div className="space-y-6">
            {/* Total Count & Export Button */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gray-50 border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div>
                <h3 className="text-lg font-black text-black uppercase tracking-tight">
                  Showing {results.length} results for <span className="text-[#e6ab00]">{query}</span> in <span className="text-black">{city}, {state}</span>
                </h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
                  Deduplicated &amp; verified real-time lead extraction
                </p>
              </div>
              {results.length > 0 && (
                <button
                  onClick={handleExportCSV}
                  className="bg-black hover:bg-gray-900 text-[#FFBE00] font-black text-xs tracking-widest uppercase px-6 py-3.5 rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center space-x-2 border border-black"
                >
                  <span>Export CSV</span>
                </button>
              )}
            </div>

            {/* Source Breakdown Bar */}
            {results.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <span className="block text-gray-700 font-black text-xs uppercase tracking-wider mb-3">
                  Source Distribution
                </span>
                
                {/* Visual Segments */}
                <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden flex mb-4">
                  {Object.entries(getSourceCounts()).map(([src, count], idx) => {
                    const pct = (count / results.length) * 100;
                    const colorClass = getSourceColor(src);
                    return (
                      <div
                        key={src}
                        style={{ width: `${pct}%` }}
                        className={`${colorClass} h-full transition-all`}
                        title={`${src}: ${count} leads (${pct.toFixed(1)}%)`}
                      />
                    );
                  })}
                </div>

                {/* Text Badges */}
                <div className="flex flex-wrap gap-2">
                  {Object.entries(getSourceCounts()).map(([src, count]) => {
                    const colorClass = getSourceColor(src);
                    return (
                      <div key={src} className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
                        <span className={`w-2.5 h-2.5 rounded-full ${colorClass}`} />
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                          {src.replace(/_/g, ' ')}: <span className="font-extrabold text-black">{count}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Leads Card Grid */}
            {results.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
                <h3 className="text-lg font-black uppercase tracking-tight text-black mb-2">No results found</h3>
                <p className="text-gray-500 text-sm font-medium">
                  We couldn't extract any leads for your query in this location. Try changing your search terms or city, or use deep/max extraction mode.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((lead, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-[#e5e7eb] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Name & Source Badge */}
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <h4 className="font-black text-black text-base uppercase tracking-tight leading-snug line-clamp-2" title={lead.company_name}>
                          {lead.company_name}
                        </h4>
                        {lead.source && (
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded shrink-0 ${getSourceBadgeStyle(lead.source)}`}>
                            {lead.source.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>

                      {/* Stars / Rating */}
                      <div className="mb-4">
                        {lead.rating !== undefined && lead.rating > 0 ? (
                          renderStars(lead.rating, lead.review_count)
                        ) : (
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">No Ratings</span>
                        )}
                      </div>

                      {/* Address / Location / Details */}
                      <div className="space-y-2 text-xs font-bold text-gray-600 mb-6 border-t border-gray-50 pt-3">
                        {lead.address && (
                          <div className="flex items-start">
                            <span className="text-gray-400 mr-2 shrink-0">📍</span>
                            <span className="uppercase tracking-wide line-clamp-2">{lead.address}</span>
                          </div>
                        )}
                        {lead.email && (
                          <div className="flex items-center">
                            <span className="text-gray-400 mr-2 shrink-0">✉</span>
                            <span className="lowercase font-semibold text-gray-700 truncate">{lead.email}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-4 mt-auto">
                      {lead.phone ? (
                        <a
                          href={`tel:${lead.phone}`}
                          className="bg-gray-100 hover:bg-[#FFBE00]/20 hover:text-black hover:border-[#FFBE00] text-black font-extrabold text-[11px] tracking-wider uppercase py-2.5 rounded-lg border border-transparent text-center transition-all flex items-center justify-center space-x-1"
                        >
                          <span>📞 Call</span>
                        </a>
                      ) : (
                        <button
                          disabled
                          className="bg-gray-50 text-gray-300 font-extrabold text-[11px] tracking-wider uppercase py-2.5 rounded-lg border border-transparent text-center cursor-not-allowed"
                        >
                          No Phone
                        </button>
                      )}

                      {lead.website ? (
                        <a
                          href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-black hover:bg-gray-900 text-white font-extrabold text-[11px] tracking-wider uppercase py-2.5 rounded-lg text-center transition-all flex items-center justify-center space-x-1"
                        >
                          <span>🌐 Website</span>
                        </a>
                      ) : (
                        <button
                          disabled
                          className="bg-gray-50 text-gray-300 font-extrabold text-[11px] tracking-wider uppercase py-2.5 rounded-lg border border-transparent text-center cursor-not-allowed"
                        >
                          No Site
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
