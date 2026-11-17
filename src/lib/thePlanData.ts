/**
 * Dreamloom BMS — The Plan Strategic Vision & Image Management Schema
 * Independent photograph configurations for each of the 8 investment pillars.
 */

export type ThePlanProjectKey =
  | 'land-investment'
  | 'apartments'
  | 'poultry-broilers'
  | 'poultry-layers'
  | 'dairy-farm'
  | 'goat-farm'
  | 'napier-grass'
  | 'avocado-farm';

export interface PlanPhotoItem {
  id: string;
  src: string;
  title: string;
  caption: string;
  tag?: string;
  isCover?: boolean;
  order: number;
  uploadedAt?: string;
  uploadedBy?: string;
}

export const PROJECT_NAMES: Record<ThePlanProjectKey, string> = {
  'land-investment': 'Dreamloom Land Investment',
  'apartments': 'Dreamloom Apartments',
  'poultry-broilers': 'Dreamloom Broiler Chicken Farm',
  'poultry-layers': 'Dreamloom Layer Chicken Farm',
  'dairy-farm': 'Dreamloom Dairy Farm',
  'goat-farm': 'Dreamloom Goat Farm',
  'napier-grass': 'Dreamloom Napier Grass Farm',
  'avocado-farm': 'Dreamloom Avocado Farm',
};

export const DEFAULT_PLAN_PHOTOS: Record<ThePlanProjectKey, PlanPhotoItem[]> = {
  'land-investment': [
    {
      id: 'land-1',
      src: '/images/the-plan/land_prime_agriculture.jpg',
      title: 'Prime Agricultural Land',
      caption: 'High-potential fertile parcels positioned in expanding economic corridors.',
      tag: 'Prime Location',
      isCover: true,
      order: 0,
    },
    {
      id: 'land-2',
      src: '/images/the-plan/land_subdivision.jpg',
      title: 'Land Subdivision & Demarcation',
      caption: 'Structured plot subdivision, boundary surveying, and verified beacon placement.',
      tag: 'Subdivision',
      isCover: false,
      order: 1,
    },
    {
      id: 'land-3',
      src: '/images/the-plan/land_access_roads.jpg',
      title: 'All-Weather Access Roads',
      caption: 'Graded road networks facilitating vehicle access, security, and logistics.',
      tag: 'Infrastructure',
      isCover: false,
      order: 2,
    },
    {
      id: 'land-4',
      src: '/images/the-plan/land_development.jpg',
      title: 'Modern Development Sites',
      caption: 'Commercial master-planned sites creating lasting capital appreciation.',
      tag: 'Wealth Creation',
      isCover: false,
      order: 3,
    },
  ],
  'apartments': [
    {
      id: 'apt-1',
      src: '/images/the-plan/apartments_exterior.jpg',
      title: 'Modern 3–5 Storey Building',
      caption: 'Contemporary residential building exterior with elegant balconies and durable finishes.',
      tag: 'Architectural Design',
      isCover: true,
      order: 0,
    },
    {
      id: 'apt-2',
      src: '/images/the-plan/apartments_residential_block.jpg',
      title: 'Multi-Unit Residential Block',
      caption: 'High-occupancy residential rental blocks providing steady monthly income.',
      tag: 'Rental Cash Flow',
      isCover: false,
      order: 1,
    },
    {
      id: 'apt-3',
      src: '/images/the-plan/apartments_interior.jpg',
      title: 'Modern Interior Living Spaces',
      caption: 'Spacious, well-lit interiors designed to attract reliable corporate and family tenants.',
      tag: 'Premium Finish',
      isCover: false,
      order: 2,
    },
    {
      id: 'apt-4',
      src: '/images/the-plan/apartments_parking_entrance.jpg',
      title: 'Paved Entrance & Parking',
      caption: 'Secure paved compound with dedicated tenant parking and automated gates.',
      tag: 'Security & Parking',
      isCover: false,
      order: 3,
    },
  ],
  'poultry-broilers': [
    {
      id: 'broiler-1',
      src: '/images/the-plan/poultry_broiler_house.jpg',
      title: 'Modern Broiler Housing',
      caption: 'Biosecure, ventilated commercial poultry housing for optimal flock health.',
      tag: 'Biosecurity',
      isCover: true,
      order: 0,
    },
    {
      id: 'broiler-2',
      src: '/images/the-plan/poultry_broiler_flock.jpg',
      title: 'Healthy Broiler Flocks',
      caption: 'Rapid-growth commercial broilers on automated feeding and drinking lines.',
      tag: 'Meat Production',
      isCover: false,
      order: 1,
    },
  ],
  'poultry-layers': [
    {
      id: 'layer-1',
      src: '/images/the-plan/poultry_layer_house.jpg',
      title: 'Modern Layer Housing',
      caption: 'Organized nesting and laying facilities maintaining high egg production rates.',
      tag: 'Egg Production',
      isCover: true,
      order: 0,
    },
    {
      id: 'layer-2',
      src: '/images/the-plan/poultry_egg_collection.jpg',
      title: 'Clean Egg Collection & Packing',
      caption: 'Hygienic collection, grading, and packaging for reliable recurring revenue.',
      tag: 'Daily Cash Flow',
      isCover: false,
      order: 1,
    },
  ],
  'dairy-farm': [
    {
      id: 'dairy-1',
      src: '/images/the-plan/dairy_housing.jpg',
      title: 'Modern Dairy Cattle Housing',
      caption: 'Zero-grazing sheds designed for herd comfort, ventilation, and hygienic waste flow.',
      tag: 'Modern Housing',
      isCover: true,
      order: 0,
    },
    {
      id: 'dairy-2',
      src: '/images/the-plan/dairy_cows_feeding.jpg',
      title: 'Healthy Friesian Dairy Herd',
      caption: 'High-yielding dairy cows feeding on formulated high-protein rations.',
      tag: 'High Yields',
      isCover: false,
      order: 1,
    },
    {
      id: 'dairy-3',
      src: '/images/the-plan/dairy_milking_parlor.jpg',
      title: 'Automated Milking Parlor',
      caption: 'Hygienic milking cluster extraction ensuring clean milk and rapid operation.',
      tag: 'Hygienic Milking',
      isCover: false,
      order: 2,
    },
    {
      id: 'dairy-4',
      src: '/images/the-plan/dairy_milk_storage.jpg',
      title: 'Refrigerated Bulk Milk Storage',
      caption: 'Stainless steel bulk cooling tank preserving milk quality for premium off-take.',
      tag: 'Cold Chain',
      isCover: false,
      order: 3,
    },
  ],
  'goat-farm': [
    {
      id: 'goat-1',
      src: '/images/the-plan/goat_healthy_stock.jpg',
      title: 'Healthy Commercial Herd',
      caption: 'Sturdy Boer and dairy goat stock managed under professional veterinary care.',
      tag: 'Hardy Genetics',
      isCover: true,
      order: 0,
    },
    {
      id: 'goat-2',
      src: '/images/the-plan/goat_modern_housing.jpg',
      title: 'Raised Wooden Slat Housing',
      caption: 'Elevated housing ensuring clean, dry conditions and disease-free pens.',
      tag: 'Elevated Pens',
      isCover: false,
      order: 1,
    },
    {
      id: 'goat-3',
      src: '/images/the-plan/goat_feeding_area.jpg',
      title: 'Feeding & Manger Stations',
      caption: 'Organized feeding racks providing mineral supplements and chopped forage.',
      tag: 'Feed Nutrition',
      isCover: false,
      order: 2,
    },
    {
      id: 'goat-4',
      src: '/images/the-plan/goat_breeding_stock.jpg',
      title: 'Breeding Stock & Kids',
      caption: 'Fast-growing young kids and certified breeding stock commanding premium prices.',
      tag: 'Breeding Stock',
      isCover: false,
      order: 3,
    },
  ],
  'napier-grass': [
    {
      id: 'napier-1',
      src: '/images/the-plan/napier_green_plantation.jpg',
      title: 'Green Napier Plantation',
      caption: 'Dense commercial plots of fast-regenerating, high-protein fodder grass.',
      tag: 'High Biomass',
      isCover: true,
      order: 0,
    },
    {
      id: 'napier-2',
      src: '/images/the-plan/napier_harvesting_field.jpg',
      title: 'Scheduled Field Harvesting',
      caption: 'Timely harvesting cycles maximizing digestible energy and nutrient density.',
      tag: 'Harvesting',
      isCover: false,
      order: 1,
    },
    {
      id: 'napier-3',
      src: '/images/the-plan/napier_chopper_processing.jpg',
      title: 'Mechanized Forage Chopping',
      caption: 'High-speed chopping preparing fine-cut fodder for anaerobic silage fermentation.',
      tag: 'Processing',
      isCover: false,
      order: 2,
    },
    {
      id: 'napier-4',
      src: '/images/the-plan/napier_silage_storage.jpg',
      title: 'Preserved Silage Bunkers',
      caption: 'Covered silage storage bunkers providing year-round feeding security.',
      tag: 'Feed Security',
      isCover: false,
      order: 3,
    },
  ],
  'avocado-farm': [
    {
      id: 'avocado-1',
      src: '/images/the-plan/avocado_commercial_orchard.jpg',
      title: 'Commercial Avocado Orchard',
      caption: 'Symmetrically spaced, grafted Hass avocado trees engineered for maximum sunlight.',
      tag: 'Hass Orchard',
      isCover: true,
      order: 0,
    },
    {
      id: 'avocado-2',
      src: '/images/the-plan/avocado_drip_irrigation.jpg',
      title: 'Precision Drip Irrigation',
      caption: 'Water-efficient drip pipelines providing consistent moisture throughout the dry months.',
      tag: 'Drip Irrigation',
      isCover: false,
      order: 1,
    },
    {
      id: 'avocado-3',
      src: '/images/the-plan/avocado_fruit_clusters.jpg',
      title: 'Heavy Mature Fruit Clusters',
      caption: 'Dense clusters of dark green, export-ready Hass avocados hanging on healthy branches.',
      tag: 'Export Grade',
      isCover: false,
      order: 2,
    },
    {
      id: 'avocado-4',
      src: '/images/the-plan/avocado_export_packing.jpg',
      title: 'Export Packaging & Cold Chain',
      caption: 'Certified grading, sorting, and packaging facilities meeting international export standards.',
      tag: 'Global Markets',
      isCover: false,
      order: 3,
    },
  ],
};
