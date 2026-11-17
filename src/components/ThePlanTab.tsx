'use client';

import React, { useState } from 'react';
import {
  Compass,
  Building,
  Home,
  Egg,
  Milk,
  Flame,
  Wheat,
  Sprout,
  CheckCircle2,
  ArrowRight,
  Maximize2,
  X,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  MapPin,
  Calendar,
  Layers,
  ChevronRight,
  Eye,
  Award,
  Palette
} from 'lucide-react';

interface ThePlanTabProps {
  isAdmin?: boolean;
  onOpenAppearance?: () => void;
}

interface ProjectPhoto {
  src: string;
  title: string;
  caption: string;
  tag?: string;
}

interface PlanSection {
  id: string;
  badge: string;
  title: string;
  category: 'Land & Property' | 'Rental Properties' | 'Commercial Agriculture';
  icon: any;
  accentColor: string;
  bannerBg: string;
  description: string;
  highlights: string[];
  photos: ProjectPhoto[];
  subsections?: {
    subtitle: string;
    description: string;
    photos: ProjectPhoto[];
  }[];
}

const PLAN_SECTIONS: PlanSection[] = [
  // SECTION 1: LAND & PROPERTY
  {
    id: 'land-investment',
    badge: 'STRATEGIC ASSET ACQUISITION',
    title: 'DREAMLOOM LAND & PROPERTY INVESTMENT',
    category: 'Land & Property',
    icon: MapPin,
    accentColor: '#0A5C36',
    bannerBg: 'from-[#0A5C36] to-[#064E3B]',
    description:
      'Dreamloom Holding Limited aims to acquire strategic land assets, develop them and build long-term wealth for its members through responsible property investment.',
    highlights: [
      'Prime agricultural and commercial land parcels in high-growth transit corridors',
      'Structured title deed due diligence and clean freehold ownership',
      'Surveyed subdivisions, beacon demarcation, and internal access road networks',
      'Value addition through perimeter fencing, water infrastructure, and power access',
      'Targeted 15% – 25% annual capital appreciation across expanding peri-urban zones'
    ],
    photos: [
      {
        src: '/images/the-plan/land_prime_agriculture.jpg',
        title: 'Prime Agricultural Land',
        caption: 'High-potential fertile parcels positioned in expanding economic corridors.',
        tag: 'Prime Location'
      },
      {
        src: '/images/the-plan/land_subdivision.jpg',
        title: 'Land Subdivision & Demarcation',
        caption: 'Structured plot subdivision, boundary surveying, and verified beacon placement.',
        tag: 'Subdivision'
      },
      {
        src: '/images/the-plan/land_access_roads.jpg',
        title: 'All-Weather Access Roads',
        caption: 'Graded road networks facilitating vehicle access, security, and logistics.',
        tag: 'Infrastructure'
      },
      {
        src: '/images/the-plan/land_development.jpg',
        title: 'Modern Development Sites',
        caption: 'Commercial master-planned sites creating lasting capital appreciation.',
        tag: 'Wealth Creation'
      }
    ]
  },

  // SECTION 2: APARTMENTS & RENTAL PROPERTIES
  {
    id: 'apartments',
    badge: 'CONSISTENT RECURRING INCOME',
    title: 'DREAMLOOM APARTMENTS & RENTAL PROPERTIES',
    category: 'Rental Properties',
    icon: Building,
    accentColor: '#0284C7',
    bannerBg: 'from-[#0369A1] to-[#0A5C36]',
    description:
      'Dreamloom Apartments represents our ambition to develop modern residential rental properties that provide quality accommodation and generate consistent rental income for the company and its members.',
    highlights: [
      'Modern 3- to 5-storey contemporary residential architectural design',
      'Mix of high-demand modern 1-bedroom and 2-bedroom executive apartments',
      'Secure gated compounds with CCTV, designated parking, and biometric access',
      'Reliable municipal and borehole water storage systems with prepaid power meters',
      'Targeted 8% – 12% annual rental yields driving regular member distributions'
    ],
    photos: [
      {
        src: '/images/the-plan/apartments_exterior.jpg',
        title: 'Modern 3–5 Storey Building',
        caption: 'Contemporary residential building exterior with elegant balconies and durable finishes.',
        tag: 'Architectural Design'
      },
      {
        src: '/images/the-plan/apartments_residential_block.jpg',
        title: 'Multi-Unit Residential Block',
        caption: 'High-occupancy residential rental blocks providing steady monthly income.',
        tag: 'Rental Cash Flow'
      },
      {
        src: '/images/the-plan/apartments_interior.jpg',
        title: 'Modern Interior Living Spaces',
        caption: 'Spacious, well-lit interiors designed to attract reliable corporate and family tenants.',
        tag: 'Premium Finish'
      },
      {
        src: '/images/the-plan/apartments_parking_entrance.jpg',
        title: 'Paved Entrance & Parking',
        caption: 'Secure paved compound with dedicated tenant parking and automated gates.',
        tag: 'Security & Parking'
      }
    ]
  },

  // SECTION 3: POULTRY FARM
  {
    id: 'poultry-farm',
    badge: 'COMMERCIAL POULTRY PRODUCTION',
    title: 'DREAMLOOM POULTRY FARM',
    category: 'Commercial Agriculture',
    icon: Egg,
    accentColor: '#D97706',
    bannerBg: 'from-[#B45309] to-[#0A5C36]',
    description:
      'Establishing a modern poultry production enterprise combining fast-turnaround broiler meat production and continuous layer egg supply to meet high market demand.',
    highlights: [
      'Biosecure, climate-ventilated commercial housing structures',
      'Dual-stream revenue: 6-week broiler meat cycles & continuous 72-week layer egg production',
      'Automated nipple drinking and pan feeding lines minimizing labor and feed wastage',
      'Direct wholesale supply contracts with supermarkets, hotels, and institutional off-takers'
    ],
    photos: [], // Subsections handle photos
    subsections: [
      {
        subtitle: 'A. Broiler Chicken Production',
        description:
          'Establishing a commercial broiler production enterprise focused on efficient meat production and reliable market supply.',
        photos: [
          {
            src: '/images/the-plan/poultry_broiler_house.jpg',
            title: 'Modern Broiler Housing',
            caption: 'Biosecure, ventilated commercial poultry housing for optimal flock health.',
            tag: 'Biosecurity'
          },
          {
            src: '/images/the-plan/poultry_broiler_flock.jpg',
            title: 'Healthy Broiler Flocks',
            caption: 'Rapid-growth commercial broilers on automated feeding and drinking lines.',
            tag: 'Meat Production'
          }
        ]
      },
      {
        subtitle: 'B. Layer Chicken Production',
        description:
          'Developing a commercial egg production enterprise to supply quality eggs and generate recurring agricultural income.',
        photos: [
          {
            src: '/images/the-plan/poultry_layer_house.jpg',
            title: 'Modern Layer Housing',
            caption: 'Organized nesting and laying facilities maintaining high egg production rates.',
            tag: 'Egg Production'
          },
          {
            src: '/images/the-plan/poultry_egg_collection.jpg',
            title: 'Clean Egg Collection & Packing',
            caption: 'Hygienic collection, grading, and packaging for reliable recurring revenue.',
            tag: 'Daily Cash Flow'
          }
        ]
      }
    ]
  },

  // SECTION 4: DAIRY FARM
  {
    id: 'dairy-farm',
    badge: 'INTENSIVE COMMERCIAL DAIRY',
    title: 'DREAMLOOM DAIRY FARM',
    category: 'Commercial Agriculture',
    icon: Milk,
    accentColor: '#059669',
    bannerBg: 'from-[#047857] to-[#0A5C36]',
    description:
      'Our vision is to establish a productive dairy enterprise supported by quality livestock, proper feeding, modern housing and efficient milk production.',
    highlights: [
      'High-producing Friesian and Ayrshire pedigree genetics targeting 25–35 litres/cow/day',
      'Concrete zero-grazing housing with comfortable cubicles and waste management',
      'Modern automated milking parlor with stainless steel pipelines and milk chillers',
      'Integrated fodder feeding with Napier grass silage and balanced total mixed rations (TMR)'
    ],
    photos: [
      {
        src: '/images/the-plan/dairy_housing.jpg',
        title: 'Modern Dairy Cattle Housing',
        caption: 'Zero-grazing sheds designed for herd comfort, ventilation, and hygienic waste flow.',
        tag: 'Modern Housing'
      },
      {
        src: '/images/the-plan/dairy_cows_feeding.jpg',
        title: 'Healthy Friesian Dairy Herd',
        caption: 'High-yielding dairy cows feeding on formulated high-protein rations.',
        tag: 'High Yields'
      },
      {
        src: '/images/the-plan/dairy_milking_parlor.jpg',
        title: 'Automated Milking Parlor',
        caption: 'Hygienic milking cluster extraction ensuring clean milk and rapid operation.',
        tag: 'Hygienic Milking'
      },
      {
        src: '/images/the-plan/dairy_milk_storage.jpg',
        title: 'Refrigerated Bulk Milk Storage',
        caption: 'Stainless steel bulk cooling tank preserving milk quality for premium off-take.',
        tag: 'Cold Chain'
      }
    ]
  },

  // SECTION 5: GOAT FARM
  {
    id: 'goat-farm',
    badge: 'LIVESTOCK BREEDING & COMMERCIAL MEAT',
    title: 'DREAMLOOM GOAT FARM',
    category: 'Commercial Agriculture',
    icon: Flame,
    accentColor: '#9333EA',
    bannerBg: 'from-[#7E22CE] to-[#0A5C36]',
    description:
      'Building a sustainable goat farming enterprise focused on livestock production, breeding and commercial opportunities.',
    highlights: [
      'Pedigree Boer meat goats and Toggenburg/Saanen high-yield dairy goats',
      'Elevated wooden slatted floor housing eliminating dampness and foot diseases',
      'High-density fattening for lucrative festive seasons and premium butcheries',
      'Breeding stock multiplication supplying high-value registered breeding bucks and does'
    ],
    photos: [
      {
        src: '/images/the-plan/goat_healthy_stock.jpg',
        title: 'Healthy Commercial Herd',
        caption: 'Sturdy Boer and dairy goat stock managed under professional veterinary care.',
        tag: 'Hardy Genetics'
      },
      {
        src: '/images/the-plan/goat_modern_housing.jpg',
        title: 'Raised Wooden Slat Housing',
        caption: 'Elevated housing ensuring clean, dry conditions and disease-free pens.',
        tag: 'Elevated Pens'
      },
      {
        src: '/images/the-plan/goat_feeding_area.jpg',
        title: 'Feeding & Manger Stations',
        caption: 'Organized feeding racks providing mineral supplements and chopped forage.',
        tag: 'Feed Nutrition'
      },
      {
        src: '/images/the-plan/goat_breeding_stock.jpg',
        title: 'Breeding Stock & Kids',
        caption: 'Fast-growing young kids and certified breeding stock commanding premium prices.',
        tag: 'Breeding Stock'
      }
    ]
  },

  // SECTION 6: NAPIER GRASS & FODDER FARM
  {
    id: 'napier-grass',
    badge: 'FEED SECURITY & COST REDUCTION',
    title: 'DREAMLOOM FODDER & NAPIER GRASS FARM',
    category: 'Commercial Agriculture',
    icon: Wheat,
    accentColor: '#16A34A',
    bannerBg: 'from-[#15803D] to-[#064E3B]',
    description:
      'Developing our own fodder production farms to support dairy and livestock operations, reduce feeding costs and create a reliable source of animal feed.',
    highlights: [
      'High-tonnage Super Napier (Pakchong 1) grass with up to 18% crude protein',
      'Self-sufficient fodder production lowering external dairy feed costs by over 40%',
      'Mechanized forage choppers and silage bunker fermentation for 12-month feed security',
      'Surplus baled silage sales to neighboring dairy and goat farmers during dry seasons'
    ],
    photos: [
      {
        src: '/images/the-plan/napier_green_plantation.jpg',
        title: 'Green Napier Plantation',
        caption: 'Dense commercial plots of fast-regenerating, high-protein fodder grass.',
        tag: 'High Biomass'
      },
      {
        src: '/images/the-plan/napier_harvesting_field.jpg',
        title: 'Scheduled Field Harvesting',
        caption: 'Timely harvesting cycles maximizing digestible energy and nutrient density.',
        tag: 'Harvesting'
      },
      {
        src: '/images/the-plan/napier_chopper_processing.jpg',
        title: 'Mechanized Forage Chopping',
        caption: 'High-speed chopping preparing fine-cut fodder for anaerobic silage fermentation.',
        tag: 'Processing'
      },
      {
        src: '/images/the-plan/napier_silage_storage.jpg',
        title: 'Preserved Silage Bunkers',
        caption: 'Covered silage storage bunkers providing year-round feeding security.',
        tag: 'Feed Security'
      }
    ]
  },

  // SECTION 7: AVOCADO FARM
  {
    id: 'avocado-farm',
    badge: 'HIGH-VALUE EXPORT CASH CROP',
    title: 'DREAMLOOM AVOCADO FARM',
    category: 'Commercial Agriculture',
    icon: Sprout,
    accentColor: '#15803D',
    bannerBg: 'from-[#166534] to-[#0A5C36]',
    description:
      'Establishing productive avocado orchards using proper spacing, irrigation and modern farming practices, with the ambition of supplying local and export markets.',
    highlights: [
      'Export-grade grafted Hass avocado variety with high oil content and long shelf life',
      'Precision drip fertigation delivering water and nutrients directly to root systems',
      'Professional canopy pruning, pest management, and GlobalGAP compliance standards',
      'Long-term cash generation with mature trees producing for over 25 continuous years'
    ],
    photos: [
      {
        src: '/images/the-plan/avocado_commercial_orchard.jpg',
        title: 'Commercial Avocado Orchard',
        caption: 'Symmetrically spaced, grafted Hass avocado trees engineered for maximum sunlight.',
        tag: 'Hass Orchard'
      },
      {
        src: '/images/the-plan/avocado_drip_irrigation.jpg',
        title: 'Precision Drip Irrigation',
        caption: 'Water-efficient drip pipelines providing consistent moisture throughout the dry months.',
        tag: 'Drip Irrigation'
      },
      {
        src: '/images/the-plan/avocado_fruit_clusters.jpg',
        title: 'Heavy Mature Fruit Clusters',
        caption: 'Dense clusters of dark green, export-ready Hass avocados hanging on healthy branches.',
        tag: 'Export Grade'
      },
      {
        src: '/images/the-plan/avocado_export_packing.jpg',
        title: 'Export Packaging & Cold Chain',
        caption: 'Certified grading, sorting, and packaging facilities meeting international export standards.',
        tag: 'Global Markets'
      }
    ]
  }
];

export default function ThePlanTab({ isAdmin = false, onOpenAppearance }: ThePlanTabProps = {}) {
  const [activeCategory, setActiveCategory] = useState<'All' | 'Land & Property' | 'Rental Properties' | 'Commercial Agriculture'>('All');
  const [selectedPhoto, setSelectedPhoto] = useState<ProjectPhoto | null>(null);

  const filteredSections = activeCategory === 'All'
    ? PLAN_SECTIONS
    : PLAN_SECTIONS.filter(s => s.category === activeCategory);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ===================================================================== */}
      {/* 1. TOP HEADER & VISION INTRODUCTION                                   */}
      {/* ===================================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#064E3B] via-[#0A5C36] to-[#043325] text-white p-6 sm:p-10 shadow-xl border border-emerald-500/20">
        {/* Subtle background decorative shapes */}
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-20 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-5xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-black tracking-widest text-emerald-200 uppercase">
              <Compass className="w-3.5 h-3.5 text-emerald-300" />
              <span>DREAMLOOM HOLDING LIMITED • STRATEGIC ROADMAP</span>
            </div>

            {isAdmin && onOpenAppearance && (
              <button
                type="button"
                onClick={onOpenAppearance}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-bold transition backdrop-blur-sm shadow-xs"
                title="Customise appearance of The Plan"
              >
                <Palette className="w-3.5 h-3.5 text-emerald-300" />
                <span>Appearance</span>
                <span className="text-[10px] bg-emerald-900/60 text-emerald-200 font-bold px-1.5 py-0.5 rounded-md border border-emerald-400/30">
                  The Plan
                </span>
              </button>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            OUR VISION. OUR INVESTMENTS. OUR FUTURE.
          </h1>

          <p className="text-emerald-100 text-base sm:text-xl font-medium italic leading-relaxed">
            &ldquo;Building lasting wealth through land, agriculture and property development.&rdquo;
          </p>

          <p className="text-emerald-200/90 text-xs sm:text-sm leading-relaxed max-w-3xl">
            Dreamloom Holding Limited is committed to transforming pooled member capital into high-value,
            productive physical assets. Explore our seven flagship investment pillars designed to generate
            sustainable wealth, food security, and recurring rental income.
          </p>

          {/* Core 3 Pillars Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">1. Land Investment</h2>
                <p className="text-[11px] text-emerald-100 mt-0.5">Acquiring strategic land assets & developing valuable property.</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center shrink-0">
                <Sprout className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">2. Agriculture</h2>
                <p className="text-[11px] text-emerald-100 mt-0.5">Building sustainable and profitable agricultural enterprises.</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center shrink-0">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">3. Rental Properties</h2>
                <p className="text-[11px] text-emerald-100 mt-0.5">Developing modern apartments generating long-term income.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. FILTER & QUICK NAVIGATION BAR                                      */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {(['All', 'Land & Property', 'Rental Properties', 'Commercial Agriculture'] as const).map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeCategory === cat
                  ? 'bg-[#0A5C36] text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Quick jump dropdown on mobile / links on desktop */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-600 hidden sm:inline">Jump to Project:</span>
          <div className="flex flex-wrap gap-1.5">
            {PLAN_SECTIONS.map((sec, idx) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => scrollToSection(sec.id)}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#0A5C36] text-[11px] font-bold transition border border-emerald-200/60"
              >
                #{idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. THE SEVEN FLAGSHIP INVESTMENT SECTIONS                             */}
      {/* ===================================================================== */}
      <div className="space-y-12">
        {filteredSections.map((section, sIdx) => {
          const SectionIcon = section.icon;

          return (
            <div
              key={section.id}
              id={section.id}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden scroll-mt-24 transition-all hover:shadow-md"
            >
              {/* Section Header Card */}
              <div className={`p-6 sm:p-8 bg-gradient-to-r ${section.bannerBg} text-white`}>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[11px] font-black uppercase tracking-wider text-emerald-100">
                    <SectionIcon className="w-3.5 h-3.5" />
                    <span>{section.badge}</span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-black/20 text-white text-xs font-mono font-bold">
                    Section {sIdx + 1} of 7
                  </span>
                </div>

                <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight">
                  {section.title}
                </h2>

                <p className="text-emerald-50 text-sm sm:text-base mt-2.5 leading-relaxed max-w-4xl font-medium">
                  &ldquo;{section.description}&rdquo;
                </p>

                {/* Key Strategic Highlights */}
                <div className="mt-5 pt-4 border-t border-white/15 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs text-emerald-100">
                  {section.highlights.map((hl, hIdx) => (
                    <div key={hIdx} className="flex items-start gap-2 bg-black/10 backdrop-blur-sm rounded-xl p-2.5 border border-white/10">
                      <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                      <span className="leading-tight">{hl}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section Content & Photographs */}
              <div className="p-6 sm:p-8 space-y-8 bg-slate-50/50">
                {/* Regular Photos Grid (for Sections 1, 2, 4, 5, 6, 7) */}
                {section.photos.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                        <span>Project Photo Gallery</span>
                        <span className="text-xs font-normal text-slate-500 font-sans">({section.photos.length} Photographic Perspectives)</span>
                      </h3>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Click any photo to enlarge
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {section.photos.map((photo, pIdx) => (
                        <div
                          key={pIdx}
                          onClick={() => setSelectedPhoto(photo)}
                          className="group relative cursor-pointer bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-all transform hover:-translate-y-1"
                        >
                          <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                            <img
                              src={photo.src}
                              alt={photo.title}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3.5">
                              <span className="inline-flex items-center gap-1.5 text-xs text-white font-bold bg-emerald-600/90 px-2.5 py-1 rounded-lg backdrop-blur-md">
                                <Maximize2 className="w-3.5 h-3.5" />
                                <span>View High-Res</span>
                              </span>
                            </div>

                            {photo.tag && (
                              <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-slate-900/75 backdrop-blur-md text-white text-[10px] font-bold">
                                {photo.tag}
                              </span>
                            )}
                          </div>

                          <div className="p-3.5">
                            <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-[#0A5C36] transition-colors">
                              {photo.title}
                            </h4>
                            <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                              {photo.caption}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subsections Grid (for Section 3: Poultry Broilers & Layers) */}
                {section.subsections && section.subsections.length > 0 && (
                  <div className="space-y-8">
                    {section.subsections.map((sub, subIdx) => (
                      <div key={subIdx} className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
                        <div className="mb-4">
                          <h3 className="text-lg font-black text-slate-900">
                            {sub.subtitle}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-600 mt-1 italic leading-relaxed">
                            &ldquo;{sub.description}&rdquo;
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {sub.photos.map((photo, pIdx) => (
                            <div
                              key={pIdx}
                              onClick={() => setSelectedPhoto(photo)}
                              className="group relative cursor-pointer bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 hover:shadow-lg transition-all"
                            >
                              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                                <img
                                  src={photo.src}
                                  alt={photo.title}
                                  loading="lazy"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3.5">
                                  <span className="inline-flex items-center gap-1.5 text-xs text-white font-bold bg-emerald-600/90 px-2.5 py-1 rounded-lg backdrop-blur-md">
                                    <Maximize2 className="w-3.5 h-3.5" />
                                    <span>View High-Res</span>
                                  </span>
                                </div>

                                {photo.tag && (
                                  <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold">
                                    {photo.tag}
                                  </span>
                                )}
                              </div>

                              <div className="p-3.5 bg-white">
                                <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-[#0A5C36] transition-colors">
                                  {photo.title}
                                </h4>
                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                  {photo.caption}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* 4. CLOSING VISION STATEMENT & INSPIRATIONAL BANNER                    */}
      {/* ===================================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#064E3B] via-[#0A5C36] to-[#03261B] text-white p-8 sm:p-12 text-center shadow-xl border border-emerald-500/30 space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-black tracking-widest text-emerald-300 uppercase">
          <Sparkles className="w-4 h-4 text-emerald-300" />
          <span>DREAMLOOM HOLDING LIMITED</span>
        </div>

        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
          WHERE BIG DREAMERS MEET
        </h2>

        <p className="text-emerald-100 text-lg sm:text-2xl font-bold italic max-w-2xl mx-auto leading-relaxed">
          &ldquo;Today we plan. Tomorrow we build. Together we grow.&rdquo;
        </p>

        <p className="text-emerald-200/90 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
          Every investment described in this portfolio represents an authoritative development goal of Dreamloom Holding Limited.
          Together with our seven visionary shareholders, we are dedicated to disciplined capital deployment, sustainable profitability,
          and generational wealth creation.
        </p>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-emerald-100">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>100% Member Owned & Governed</span>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-emerald-100">
            <Award className="w-4 h-4 text-emerald-300" />
            <span>Long-Term Asset Growth Strategy</span>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 5. LIGHTBOX MODAL FOR FULL-SCREEN INSPECTION                          */}
      {/* ===================================================================== */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full bg-[#0F172A] rounded-3xl overflow-hidden border border-slate-700 shadow-2xl space-y-4"
          >
            <div className="relative aspect-[16/10] w-full bg-black">
              <img
                src={selectedPhoto.src}
                alt={selectedPhoto.title}
                className="w-full h-full object-contain"
              />
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition border border-white/20"
                aria-label="Close photo preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                    {selectedPhoto.tag || 'Project Photo'}
                  </span>
                </div>
                <h3 className="text-lg font-black text-white mt-0.5">
                  {selectedPhoto.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  {selectedPhoto.caption}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
