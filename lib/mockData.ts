export interface Lead {
  id: string;
  name: string;
  city: string;
  state: string;
  phone: string;
  website: string;
  email: string;
  category: string;
  rating: number;
  reviewsCount: number;
  source: 'Google' | 'Yelp' | 'YellowPages';
  isVerified: boolean;
  address: string;
  employees: string;
  licensed: boolean;
  since: string;
  description: string;
  services: string[];
  tags: string[];
  notes?: string;
  notesTimestamp?: string;
}

export const mockLeads: Lead[] = [
  {
    id: 'lead-1',
    name: 'Phoenix Epoxy Flooring Solutions',
    city: 'Phoenix',
    state: 'AZ',
    phone: '(602) 555-0198',
    website: 'https://phoenixepoxyflooring.com',
    email: 'info@phoenixepoxyflooring.com',
    category: 'Epoxy Coating Specialist',
    rating: 4.9,
    reviewsCount: 142,
    source: 'Google',
    isVerified: true,
    address: '4210 N 19th Ave, Phoenix, AZ 85015',
    employees: '10-25',
    licensed: true,
    since: '2014',
    description: 'Premier epoxy and polyaspartic garage flooring systems in the Phoenix metro area. We specialize in high-durability decorative flake finishes, metallic metallic floors, and industrial quartz coatings for both residential and commercial projects. Built to survive the Arizona heat with industry-leading UV resistance.',
    services: [
      'Garage Epoxy Floors',
      'Commercial Polyaspartic Coatings',
      'Metallic Epoxy Finishes',
      'Concrete Grinding & Prep',
      'Industrial Quartz Floors',
      'Self-Leveling Underlayments'
    ],
    tags: ['epoxy', 'garage', 'commercial', 'phoenix', 'contractor'],
    notes: 'Called owner Steve yesterday. Interested in scaling their commercial outreach for warehouse spaces in Tempe. Scheduled follow-up next Tuesday.',
    notesTimestamp: 'July 14, 2026, 14:32'
  },
  {
    id: 'lead-2',
    name: 'Desert Sun Flooring Contractors',
    city: 'Tempe',
    state: 'AZ',
    phone: '(480) 555-0322',
    website: 'https://desertsunflooring.com',
    email: 'sales@desertsunflooring.com',
    category: 'Flooring Contractor',
    rating: 4.8,
    reviewsCount: 98,
    source: 'Yelp',
    isVerified: true,
    address: '1845 W University Dr, Tempe, AZ 85281',
    employees: '5-10',
    licensed: true,
    since: '2018',
    description: 'Expert hard-surface floor installations across Tempe and Mesa. Specializing in luxury vinyl plank (LVP), premium tile installation, hardwood refinishing, and laminate setups. Known for our precise borders and custom baseboard integrations.',
    services: [
      'Luxury Vinyl Plank (LVP)',
      'Custom Tile Installation',
      'Hardwood Floor Refinishing',
      'Laminate Floating Floors',
      'Subfloor Levelling',
      'Baseboard & Trim Work'
    ],
    tags: ['flooring', 'contractor', 'lvp', 'tile', 'tempe'],
    notes: 'Left voicemail for lead estimator. They are looking to expand their vendor network with luxury home builders in Scottsdale.',
    notesTimestamp: 'July 12, 2026, 09:15'
  },
  {
    id: 'lead-3',
    name: 'Valley Concrete Polishing & Stain',
    city: 'Mesa',
    state: 'AZ',
    phone: '(480) 555-0784',
    website: 'https://valleyconcretepolishing.com',
    email: 'contact@valleyconcretepolishing.com',
    category: 'Concrete Polishing',
    rating: 4.7,
    reviewsCount: 64,
    source: 'YellowPages',
    isVerified: false,
    address: '812 E Main St, Mesa, AZ 85203',
    employees: '1-4',
    licensed: true,
    since: '2020',
    description: 'Transforming plain concrete into beautiful, sustainable, high-gloss polished surfaces. Perfect for modern residential interiors, commercial showrooms, and heavy-duty retail spaces. Offering both acid staining and water-based dye options.',
    services: [
      'Polished Concrete Flooring',
      'Acid Concrete Staining',
      'Microtoppings & Overlays',
      'Joint Fill Repair',
      'Sealing & Burnishing'
    ],
    tags: ['polished concrete', 'staining', 'mesa', 'contractor'],
    notes: 'Sent pricing proposal for custom stained finish. Owner Jose is responsive on email.',
    notesTimestamp: 'July 13, 2026, 11:45'
  },
  {
    id: 'lead-4',
    name: 'Scottsdale Custom Hardwood Inc',
    city: 'Scottsdale',
    state: 'AZ',
    phone: '(480) 555-0911',
    website: 'https://scottsdalehardwood.com',
    email: 'scottsdale@hardwoodpros.com',
    category: 'Hardwood Specialist',
    rating: 5.0,
    reviewsCount: 88,
    source: 'Google',
    isVerified: true,
    address: '7330 E Redfield Rd, Scottsdale, AZ 85260',
    employees: '5-10',
    licensed: true,
    since: '2011',
    description: 'High-end hardwood designs, installations, and museum-grade dustless sanding and dust-free refinishing. We work with exotic species, solid oak, reclaimed woods, and engineered wide-plank floors in North Scottsdale custom estates.',
    services: [
      'Dustless Hardwood Sanding',
      'Custom Wood Inlays',
      'Exotic Hardwood Installs',
      'Wide Plank Engineered Flooring',
      'Bona Traffic HD Protective Finishes'
    ],
    tags: ['hardwood', 'scottsdale', 'luxury', 'contractor'],
    notes: 'Premium partner. Spoke with Lead Designer, looking for reliable hardwood suppliers.',
    notesTimestamp: 'July 14, 2026, 16:02'
  },
  {
    id: 'lead-5',
    name: 'AZ Garage Coatings Pro',
    city: 'Glendale',
    state: 'AZ',
    phone: '(623) 555-0451',
    website: 'https://azgaragecoatings.com',
    email: 'hello@azgaragecoatings.com',
    category: 'Epoxy Coating Specialist',
    rating: 4.6,
    reviewsCount: 112,
    source: 'Yelp',
    isVerified: true,
    address: '5110 W Glendale Ave, Glendale, AZ 85301',
    employees: '1-4',
    licensed: true,
    since: '2016',
    description: 'Rapid turnaround polyaspartic garage floor overlays. Get back on your floor in just 24 hours! Complete preparation using diamond grinders ensures maximum mechanical bond.',
    services: [
      'One-Day Polyaspartic Coating',
      'Diamond Grinder Concrete Prep',
      'Flake Broadcast Systems',
      'Moisture Vapor Barriers'
    ],
    tags: ['epoxy', 'garage', 'one-day', 'glendale'],
    notes: 'Owner interested in automatic lead generation. Good target for software up-sell.',
    notesTimestamp: 'July 10, 2026, 10:30'
  },
  {
    id: 'lead-6',
    name: 'Titan Industrial Flooring',
    city: 'Phoenix',
    state: 'AZ',
    phone: '(602) 555-1200',
    website: 'https://titanindustrialfloors.com',
    email: 'contracts@titanindustrialfloors.com',
    category: 'Industrial Flooring',
    rating: 4.9,
    reviewsCount: 75,
    source: 'Google',
    isVerified: true,
    address: '2430 S 24th St, Phoenix, AZ 85034',
    employees: '25-50',
    licensed: true,
    since: '2005',
    description: 'Heavy industrial floor resurfacing, chemical-resistant urethanes, and high-build epoxy mortars for aviation, manufacturing, food & beverage, and pharmaceutical facilities. Fully compliant with USDA and FDA floor criteria.',
    services: [
      'Urethane Cement Slurry',
      'Chemical Resistant Epoxy Mortar',
      'Electrostatic Dissipative (ESD) Floors',
      'USDA Compliant Topcoats',
      'Joint Repair & Expansion Banding'
    ],
    tags: ['industrial', 'commercial', 'epoxy', 'phoenix', 'urethane'],
    notes: 'Large corporate client. Custom proposal under review by facilities head.',
    notesTimestamp: 'July 14, 2026, 18:22'
  }
];

export const mockStats = [
  { label: 'SEARCHES RUN', value: '24', delta: '+14%', icon: 'Search' },
  { label: 'LEADS FOUND', value: '8,742', delta: '+15.3%', icon: 'Users' },
  { label: 'SAVED LEADS', value: '248', delta: '+8%', icon: 'Star' },
  { label: 'EXPORTS', value: '18', delta: '+5%', icon: 'Download' }
];

export const mockCollections = [
  { name: 'Flooring Pros Q2', count: 248 },
  { name: 'Concrete Contractors', count: 186 },
  { name: 'Roofing Companies', count: 153 },
  { name: 'Texas Leads', count: 512 },
  { name: 'My Favorites', count: 98 }
];

export const mockRecentActivities = [
  { text: 'New lead saved', detail: 'Phoenix Epoxy Flooring Solutions', time: '10 mins ago' },
  { text: 'Note added', detail: 'Steve at Phoenix Epoxy interested in Tempe project', time: '1 hr ago' },
  { text: 'Collection created', detail: 'Flooring Pros Q2 (248 leads)', time: '3 hrs ago' },
  { text: 'Lead tagged', detail: 'Titan Industrial Flooring tagged with "industrial"', time: '1 day ago' },
  { text: 'Leads exported', detail: 'CSV format (124 records)', time: '2 days ago' }
];
