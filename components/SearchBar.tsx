import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearch?: (industry: string, location: string, source: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [industry, setIndustry] = React.useState('Flooring Contractor');
  const [location, setLocation] = React.useState('Phoenix, AZ');
  const [source, setSource] = React.useState('All Sources');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(industry, location, source);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full bg-black p-2.5 rounded-full border border-gray-800 flex flex-col md:flex-row items-center gap-2 shadow-2xl">
      <div className="w-full md:w-1/3 px-4 py-1">
        <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">INDUSTRY</label>
        <select 
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="w-full bg-transparent text-white font-extrabold text-sm focus:outline-none appearance-none cursor-pointer"
        >
          <option value="Flooring Contractor" className="bg-black text-white">Flooring Contractor</option>
          <option value="Epoxy Coating Specialist" className="bg-black text-white">Epoxy Specialist</option>
          <option value="Concrete Polishing" className="bg-black text-white">Concrete Polishing</option>
          <option value="Hardwood Specialist" className="bg-black text-white">Hardwood Specialist</option>
        </select>
      </div>

      <div className="hidden md:block w-px h-8 bg-gray-800" />

      <div className="w-full md:w-1/3 px-4 py-1 flex items-center space-x-2">
        <div className="flex-1">
          <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">LOCATION</label>
          <div className="flex items-center space-x-1">
            <span className="text-[#F5A000] text-sm">📍</span>
            <input 
              type="text" 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, State" 
              className="w-full bg-transparent text-white font-extrabold text-sm focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="hidden md:block w-px h-8 bg-gray-800" />

      <div className="w-full md:w-1/4 px-4 py-1">
        <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">SOURCES</label>
        <select 
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="w-full bg-transparent text-white font-extrabold text-sm focus:outline-none appearance-none cursor-pointer"
        >
          <option value="All Sources" className="bg-black text-white">All Sources (G, Yelp, YP)</option>
          <option value="Google" className="bg-black text-white">Google Maps Only</option>
          <option value="Yelp" className="bg-black text-white">Yelp Only</option>
          <option value="YellowPages" className="bg-black text-white">Yellow Pages Only</option>
        </select>
      </div>

      <button 
        type="submit" 
        className="w-full md:w-auto bg-[#F5A000] text-black hover:bg-amber-500 transition-all font-black text-xs tracking-widest uppercase px-8 py-4 rounded-full flex items-center justify-center space-x-2 shadow-lg shrink-0"
      >
        <Search size={14} className="stroke-[3]" />
        <span>SEARCH</span>
      </button>
    </form>
  );
}
