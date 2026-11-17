'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  Building,
  Egg,
  Milk,
  Flame,
  Wheat,
  Sprout,
  CheckCircle2,
  Maximize2,
  X,
  Sparkles,
  ShieldCheck,
  MapPin,
  Award,
  Palette,
  Upload,
  Camera,
  Trash2,
  ArrowUp,
  ArrowDown,
  Star,
  Edit3,
  MoreVertical,
  Check,
  AlertCircle,
  Plus,
  RotateCw,
  Image as ImageIcon
} from 'lucide-react';
import {
  DEFAULT_PLAN_PHOTOS,
  PROJECT_NAMES,
  ThePlanProjectKey,
  PlanPhotoItem
} from '@/lib/thePlanData';
import { upload } from '@vercel/blob/client';

interface ThePlanTabProps {
  isAdmin?: boolean;
  currentUser?: any;
  onOpenAppearance?: () => void;
}

interface PlanSection {
  id: ThePlanProjectKey;
  badge: string;
  title: string;
  category: 'Land & Property' | 'Rental Properties' | 'Commercial Agriculture';
  icon: any;
  accentColor: string;
  bannerBg: string;
  description: string;
  highlights: string[];
  subsections?: {
    id: ThePlanProjectKey;
    subtitle: string;
    description: string;
  }[];
}

const PLAN_SECTIONS_DEF: PlanSection[] = [
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
    ]
  },

  // SECTION 3: POULTRY FARM
  {
    id: 'poultry-broilers', // primary key for section
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
    subsections: [
      {
        id: 'poultry-broilers',
        subtitle: 'A. Broiler Chicken Production',
        description:
          'Establishing a commercial broiler production enterprise focused on efficient meat production and reliable market supply.'
      },
      {
        id: 'poultry-layers',
        subtitle: 'B. Layer Chicken Production',
        description:
          'Developing a commercial egg production enterprise to supply quality eggs and generate recurring agricultural income.'
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
    ]
  }
];

export default function ThePlanTab({
  isAdmin = false,
  currentUser,
  onOpenAppearance
}: ThePlanTabProps = {}) {
  const [activeCategory, setActiveCategory] = useState<
    'All' | 'Land & Property' | 'Rental Properties' | 'Commercial Agriculture'
  >('All');
  const [selectedPhoto, setSelectedPhoto] = useState<PlanPhotoItem | null>(null);

  // Photos state for all 8 projects
  const [projectPhotos, setProjectPhotos] = useState<Record<ThePlanProjectKey, PlanPhotoItem[]>>(DEFAULT_PLAN_PHOTOS);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);

  // Active Dropdown state (photoId currently open)
  const [activeDropdownPhotoId, setActiveDropdownPhotoId] = useState<string | null>(null);

  // Upload / Replace / Edit Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: 'upload' | 'replace' | 'edit';
    projectId: ThePlanProjectKey;
    photoId?: string;
    existingPhoto?: PlanPhotoItem;
  }>({
    isOpen: false,
    mode: 'upload',
    projectId: 'land-investment'
  });

  // Modal Form Inputs
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formFileBase64, setFormFileBase64] = useState<string | null>(null);
  const [formFileName, setFormFileName] = useState<string>('');
  const [formPreviewUrl, setFormPreviewUrl] = useState<string>('');
  const [formTitle, setFormTitle] = useState('');
  const [formCaption, setFormCaption] = useState('');
  const [formTag, setFormTag] = useState('');
  const [formIsCover, setFormIsCover] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Confirmation Modal State
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    projectId: ThePlanProjectKey;
    photo: PlanPhotoItem | null;
  }>({
    isOpen: false,
    projectId: 'land-investment',
    photo: null
  });

  // Toast Notification
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Strict check: Only Simon Memia Wanjiru (simon@dreamloom.co.ke) can manage photographs
  const userEmail = (currentUser?.email || '').toLowerCase().trim();
  const canManagePictures = Boolean(isAdmin && userEmail === 'simon@dreamloom.co.ke');

  // Load photos from Server & LocalStorage on mount
  useEffect(() => {
    let isMounted = true;
    try {
      const cached = localStorage.getItem('dreamloom_the_plan_photos');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') {
          setProjectPhotos(prev => ({ ...prev, ...parsed }));
        }
      }
    } catch (e) {}

    // Fetch authoritative data from server API
    setIsLoadingPhotos(true);
    fetch('/api/the-plan/images')
      .then(res => res.json())
      .then(res => {
        if (isMounted && res.success && res.data) {
          setProjectPhotos(res.data);
          try {
            localStorage.setItem('dreamloom_the_plan_photos', JSON.stringify(res.data));
          } catch (e) {}
        }
      })
      .catch(err => {
        console.warn('Could not fetch remote photos:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingPhotos(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.photo-actions-dropdown-container')) {
        setActiveDropdownPhotoId(null);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // ---------------------------------------------------------------------------
  // Modal Open Handlers
  // ---------------------------------------------------------------------------
  const openUploadModal = (projectId: ThePlanProjectKey) => {
    setModalState({
      isOpen: true,
      mode: 'upload',
      projectId
    });
    setSelectedFile(null);
    setFormFileBase64(null);
    setFormFileName('');
    setFormPreviewUrl('');
    setFormTitle('');
    setFormCaption('');
    setFormTag('');
    setFormIsCover(false);
    setFormError(null);
  };

  const openReplaceModal = (projectId: ThePlanProjectKey, photo: PlanPhotoItem) => {
    setModalState({
      isOpen: true,
      mode: 'replace',
      projectId,
      photoId: photo.id,
      existingPhoto: photo
    });
    setSelectedFile(null);
    setFormFileBase64(null);
    setFormFileName('');
    setFormPreviewUrl(photo.src);
    setFormTitle(photo.title);
    setFormCaption(photo.caption);
    setFormTag(photo.tag || '');
    setFormIsCover(Boolean(photo.isCover));
    setFormError(null);
    setActiveDropdownPhotoId(null);
  };

  const openEditModal = (projectId: ThePlanProjectKey, photo: PlanPhotoItem) => {
    setModalState({
      isOpen: true,
      mode: 'edit',
      projectId,
      photoId: photo.id,
      existingPhoto: photo
    });
    setSelectedFile(null);
    setFormFileBase64(null);
    setFormFileName('');
    setFormPreviewUrl(photo.src);
    setFormTitle(photo.title);
    setFormCaption(photo.caption);
    setFormTag(photo.tag || '');
    setFormIsCover(Boolean(photo.isCover));
    setFormError(null);
    setActiveDropdownPhotoId(null);
  };

  // ---------------------------------------------------------------------------
  // Client-Side Image File Selection & Optimization
  // ---------------------------------------------------------------------------
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setFormError('Invalid file format. Please upload JPG, JPEG, PNG, or WEBP.');
      return;
    }

    // Validate size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setFormError('File size exceeds the 10 MB limit. Please select a smaller photo.');
      return;
    }

    setFormError(null);
    setSelectedFile(file);
    setFormFileName(file.name);

    // Default title from filename if empty
    if (!formTitle && file.name) {
      const cleanTitle = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
      setFormTitle(cleanTitle);
    }

    const reader = new FileReader();
    reader.onload = event => {
      const rawDataUrl = event.target?.result as string;

      // Optimize large images using an offscreen canvas
      const img = new window.Image();
      img.onload = () => {
        const MAX_DIM = 2048;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimized = canvas.toDataURL('image/jpeg', 0.88);
            setFormFileBase64(optimized);
            setFormPreviewUrl(optimized);
            return;
          }
        }

        setFormFileBase64(rawDataUrl);
        setFormPreviewUrl(rawDataUrl);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  // ---------------------------------------------------------------------------
  // Submit Photo Mutation (Upload / Replace / Edit)
  // ---------------------------------------------------------------------------
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modalState.mode !== 'edit' && !formFileBase64 && !modalState.existingPhoto?.src) {
      setFormError('Please select a photograph to upload.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      let uploadedBlobUrl: string | undefined = undefined;

      // 1. Attempt secure client-side upload via @vercel/blob/client if a file was chosen
      if (selectedFile && modalState.mode !== 'edit') {
        try {
          const blobResult = await upload(formFileName || selectedFile.name, selectedFile, {
            access: 'public',
            handleUploadUrl: '/api/the-plan/blob-upload',
          });
          if (blobResult && blobResult.url) {
            uploadedBlobUrl = blobResult.url;
          }
        } catch (blobErr: any) {
          console.warn('Direct Vercel Blob client upload skipped/falling back:', blobErr?.message);
        }
      }

      const payload: any = {
        action: modalState.mode === 'edit' ? 'edit-details' : modalState.mode,
        projectId: modalState.projectId,
        photoId: modalState.photoId,
        title: formTitle,
        caption: formCaption,
        tag: formTag,
        isCover: formIsCover,
        blobUrl: uploadedBlobUrl,
        fileBase64: uploadedBlobUrl ? undefined : formFileBase64,
        fileName: formFileName,
        userEmail: 'simon@dreamloom.co.ke',
        userName: 'Simon Memia Wanjiru'
      };

      const res = await fetch('/api/the-plan/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save photograph.');
      }

      // Update state immediately
      if (data.allPhotos) {
        setProjectPhotos(data.allPhotos);
        try {
          localStorage.setItem('dreamloom_the_plan_photos', JSON.stringify(data.allPhotos));
        } catch (e) {}
      } else if (data.projectPhotos) {
        setProjectPhotos(prev => {
          const next = { ...prev, [modalState.projectId]: data.projectPhotos };
          try {
            localStorage.setItem('dreamloom_the_plan_photos', JSON.stringify(next));
          } catch (e) {}
          return next;
        });
      }

      showToast('success', data.message || 'Photograph successfully saved.');
      setModalState(prev => ({ ...prev, isOpen: false }));
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while saving the photo.');
      showToast('error', err.message || 'Operation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Action Handlers: Set Cover, Reorder, Delete
  // ---------------------------------------------------------------------------
  const handleSetCover = async (projectId: ThePlanProjectKey, photo: PlanPhotoItem) => {
    setActiveDropdownPhotoId(null);
    try {
      const res = await fetch('/api/the-plan/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set-cover',
          projectId,
          photoId: photo.id,
          userEmail: 'simon@dreamloom.co.ke',
          userName: 'Simon Memia Wanjiru'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to set cover photo.');

      if (data.allPhotos) {
        setProjectPhotos(data.allPhotos);
        try {
          localStorage.setItem('dreamloom_the_plan_photos', JSON.stringify(data.allPhotos));
        } catch (e) {}
      }
      showToast('success', `"${photo.title}" set as main cover photograph.`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to set cover.');
    }
  };

  const handleReorder = async (
    projectId: ThePlanProjectKey,
    photoId: string,
    direction: 'up' | 'down'
  ) => {
    setActiveDropdownPhotoId(null);
    try {
      const res = await fetch('/api/the-plan/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reorder',
          projectId,
          photoId,
          direction,
          userEmail: 'simon@dreamloom.co.ke',
          userName: 'Simon Memia Wanjiru'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to reorder photo.');

      if (data.allPhotos) {
        setProjectPhotos(data.allPhotos);
        try {
          localStorage.setItem('dreamloom_the_plan_photos', JSON.stringify(data.allPhotos));
        } catch (e) {}
      }
    } catch (err: any) {
      showToast('error', err.message || 'Reorder failed.');
    }
  };

  const handleDeletePhoto = async () => {
    if (!deleteModalState.photo) return;
    const { projectId, photo } = deleteModalState;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/the-plan/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          projectId,
          photoId: photo.id,
          userEmail: 'simon@dreamloom.co.ke',
          userName: 'Simon Memia Wanjiru'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete photo.');

      if (data.allPhotos) {
        setProjectPhotos(data.allPhotos);
        try {
          localStorage.setItem('dreamloom_the_plan_photos', JSON.stringify(data.allPhotos));
        } catch (e) {}
      }
      showToast('success', `Removed "${photo.title}" from ${PROJECT_NAMES[projectId]}.`);
      setDeleteModalState({ isOpen: false, projectId, photo: null });
    } catch (err: any) {
      showToast('error', err.message || 'Failed to remove photo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSections =
    activeCategory === 'All'
      ? PLAN_SECTIONS_DEF
      : PLAN_SECTIONS_DEF.filter(s => s.category === activeCategory);

  // ---------------------------------------------------------------------------
  // Render Photo Grid Component Helper
  // ---------------------------------------------------------------------------
  const renderPhotoGrid = (projectId: ThePlanProjectKey, photos: PlanPhotoItem[]) => {
    const projectName = PROJECT_NAMES[projectId] || 'Project Gallery';

    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <span>Project Photo Gallery</span>
              <span className="text-xs font-normal text-slate-500 font-sans">
                ({photos.length} Photographic Perspectives)
              </span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Click any photo to enlarge
            </span>

            {/* Administrator Upload Button */}
            {canManagePictures && (
              <button
                type="button"
                onClick={() => openUploadModal(projectId)}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0A5C36] hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition shadow-xs"
                title={`Upload New Picture to ${projectName}`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload Picture</span>
              </button>
            )}
          </div>
        </div>

        {photos.length === 0 ? (
          <div className="p-8 text-center bg-slate-100 rounded-2xl border border-dashed border-slate-300">
            <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">No photographs currently available for this section.</p>
            {canManagePictures && (
              <button
                type="button"
                onClick={() => openUploadModal(projectId)}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0A5C36] text-white text-xs font-bold rounded-xl"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload First Picture</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {photos.map((photo, pIdx) => {
              const isCover = photo.isCover || pIdx === 0;
              const isDropdownOpen = activeDropdownPhotoId === photo.id;

              return (
                <div
                  key={photo.id || pIdx}
                  className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-all transform hover:-translate-y-1 flex flex-col justify-between"
                >
                  <div
                    onClick={() => setSelectedPhoto(photo)}
                    className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 cursor-pointer"
                  >
                    <img
                      src={photo.src}
                      alt={photo.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* High-res overlay indicator */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3.5">
                      <span className="inline-flex items-center gap-1.5 text-xs text-white font-bold bg-emerald-600/90 px-2.5 py-1 rounded-lg backdrop-blur-md">
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>View High-Res</span>
                      </span>
                    </div>

                    {/* Tag or Cover badge */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start pointer-events-none">
                      {isCover && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-600/95 backdrop-blur-md text-white text-[10px] font-black tracking-wide uppercase shadow-xs flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          <span>Cover</span>
                        </span>
                      )}
                      {photo.tag && photo.tag !== 'Cover Photo' && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold">
                          {photo.tag}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Dropdown for Simon Memia Wanjiru */}
                  {canManagePictures && (
                    <div className="photo-actions-dropdown-container absolute top-2.5 right-2.5 z-20">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setActiveDropdownPhotoId(isDropdownOpen ? null : photo.id);
                        }}
                        className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center transition backdrop-blur-md shadow-md border border-white/20"
                        title="Manage Picture"
                        aria-label="Manage Picture"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {isDropdownOpen && (
                        <div
                          onClick={e => e.stopPropagation()}
                          className="absolute right-0 mt-1.5 w-48 bg-white rounded-2xl shadow-2xl border border-slate-200 py-1.5 z-30 text-left animate-in fade-in zoom-in-95 duration-150"
                        >
                          <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Picture Actions
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => openReplaceModal(projectId, photo)}
                            className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 font-semibold flex items-center gap-2 transition"
                          >
                            <Camera className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Replace Picture</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(projectId, photo)}
                            className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 font-semibold flex items-center gap-2 transition"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                            <span>Change Details</span>
                          </button>

                          {!isCover && (
                            <button
                              type="button"
                              onClick={() => handleSetCover(projectId, photo)}
                              className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 font-semibold flex items-center gap-2 transition"
                            >
                              <Star className="w-3.5 h-3.5 text-amber-500" />
                              <span>Set as Main / Cover</span>
                            </button>
                          )}

                          {pIdx > 0 && (
                            <button
                              type="button"
                              onClick={() => handleReorder(projectId, photo.id, 'up')}
                              className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2 transition"
                            >
                              <ArrowUp className="w-3.5 h-3.5 text-slate-500" />
                              <span>Move Left / Up</span>
                            </button>
                          )}

                          {pIdx < photos.length - 1 && (
                            <button
                              type="button"
                              onClick={() => handleReorder(projectId, photo.id, 'down')}
                              className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2 transition"
                            >
                              <ArrowDown className="w-3.5 h-3.5 text-slate-500" />
                              <span>Move Right / Down</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPhoto(photo);
                              setActiveDropdownPhotoId(null);
                            }}
                            className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2 transition"
                          >
                            <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
                            <span>Preview Full-Screen</span>
                          </button>

                          <div className="border-t border-slate-100 my-1" />

                          <button
                            type="button"
                            onClick={() => {
                              setActiveDropdownPhotoId(null);
                              setDeleteModalState({
                                isOpen: true,
                                projectId,
                                photo
                              });
                            }}
                            className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 font-bold flex items-center gap-2 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            <span>Remove Picture</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Caption & Title */}
                  <div className="p-3.5">
                    <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-[#0A5C36] transition-colors leading-snug">
                      {photo.title}
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {photo.caption}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <style>{`
        #dashboard-content-area .the-plan-banner h1,
        #dashboard-content-area .the-plan-banner h2,
        #dashboard-content-area .the-plan-banner h3,
        #dashboard-content-area .the-plan-section-header h2,
        #dashboard-content-area .the-plan-section-header h3,
        #dashboard-content-area .the-plan-footer h2,
        #dashboard-content-area .the-plan-footer h3,
        #dashboard-content-area .the-plan-modal-header h3,
        #dashboard-content-area .the-plan-modal-header p {
          color: #FFFFFF !important;
        }
      `}</style>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-white text-xs font-bold border ${
              toast.type === 'success'
                ? 'bg-emerald-900/95 border-emerald-500'
                : 'bg-rose-900/95 border-rose-500'
            }`}
          >
            {toast.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="ml-2 text-white/70 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 1. TOP HEADER & VISION INTRODUCTION                                   */}
      {/* ===================================================================== */}
      <div className="the-plan-banner relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#064E3B] via-[#0A5C36] to-[#043325] text-white p-6 sm:p-10 shadow-xl border border-emerald-500/20">
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
      {/* 2. CATEGORY FILTER & QUICK JUMP                                       */}
      {/* ===================================================================== */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {(['All', 'Land & Property', 'Rental Properties', 'Commercial Agriculture'] as const).map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeCategory === cat
                  ? 'bg-[#0A5C36] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Quick jump navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span className="hidden sm:inline">Jump to Project:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {PLAN_SECTIONS_DEF.map((sec, idx) => (
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
              <div className={`the-plan-section-header p-6 sm:p-8 bg-gradient-to-r ${section.bannerBg} text-white`}>
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
                {/* Standard Sections (1, 2, 4, 5, 6, 7) */}
                {!section.subsections && renderPhotoGrid(section.id, projectPhotos[section.id] || [])}

                {/* Subsections (Section 3: Poultry Broilers & Layers) */}
                {section.subsections && section.subsections.length > 0 && (
                  <div className="space-y-8">
                    {section.subsections.map((sub) => (
                      <div key={sub.id} className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
                        <div className="mb-4">
                          <h3 className="text-lg font-black text-slate-900">
                            {sub.subtitle}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-600 mt-1 italic leading-relaxed">
                            &ldquo;{sub.description}&rdquo;
                          </p>
                        </div>

                        {renderPhotoGrid(sub.id, projectPhotos[sub.id] || [])}
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
      <div className="the-plan-footer relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#064E3B] via-[#0A5C36] to-[#03261B] text-white p-8 sm:p-12 text-center shadow-xl border border-emerald-500/30 space-y-4">
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
            onClick={e => e.stopPropagation()}
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
                  {selectedPhoto.isCover && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Cover Photo
                    </span>
                  )}
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

      {/* ===================================================================== */}
      {/* 6. ADMINISTRATOR PICTURE UPLOAD / REPLACE / EDIT MODAL                 */}
      {/* ===================================================================== */}
      {modalState.isOpen && canManagePictures && (
        <div
          onClick={() => !isSubmitting && setModalState(prev => ({ ...prev, isOpen: false }))}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="relative max-w-lg w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8"
          >
            {/* Modal Header */}
            <div className="the-plan-modal-header px-6 py-4 bg-gradient-to-r from-[#064E3B] to-[#0A5C36] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                  {modalState.mode === 'upload' ? (
                    <Upload className="w-4 h-4 text-emerald-200" />
                  ) : modalState.mode === 'replace' ? (
                    <Camera className="w-4 h-4 text-emerald-200" />
                  ) : (
                    <Edit3 className="w-4 h-4 text-emerald-200" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {modalState.mode === 'upload'
                      ? 'Upload New Picture'
                      : modalState.mode === 'replace'
                      ? 'Replace Picture'
                      : 'Change Picture Details'}
                  </h3>
                  <p className="text-[11px] text-emerald-100">
                    {PROJECT_NAMES[modalState.projectId]}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setModalState(prev => ({ ...prev, isOpen: false }))}
                className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* File Upload Selector (Upload or Replace modes) */}
              {modalState.mode !== 'edit' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Select Photograph (JPG, PNG, WEBP — Max 10MB)
                  </label>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    className="hidden"
                  />

                  {formPreviewUrl ? (
                    <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden border-2 border-emerald-500 bg-slate-900 group">
                      <img
                        src={formPreviewUrl}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition backdrop-blur-xs gap-2"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Choose Different Picture</span>
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-50 hover:bg-emerald-50/40"
                    >
                      <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700">
                        Click or tap to choose photograph
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Works on Android phone camera/gallery & desktop computers
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Title Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Picture Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="e.g. Modern Executive Balconies"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-[#0A5C36] focus:bg-white rounded-xl text-xs text-slate-900 font-medium transition focus:outline-none"
                />
              </div>

              {/* Tag / Category Badge */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category Tag
                </label>
                <input
                  type="text"
                  value={formTag}
                  onChange={e => setFormTag(e.target.value)}
                  placeholder="e.g. Architectural Design, High Yields, Infrastructure"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-[#0A5C36] focus:bg-white rounded-xl text-xs text-slate-900 font-medium transition focus:outline-none"
                />
              </div>

              {/* Caption / Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Caption / Strategic Summary
                </label>
                <textarea
                  rows={2}
                  value={formCaption}
                  onChange={e => setFormCaption(e.target.value)}
                  placeholder="Brief description of the photograph and strategic value..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-[#0A5C36] focus:bg-white rounded-xl text-xs text-slate-900 font-medium transition focus:outline-none resize-none"
                />
              </div>

              {/* Set as Cover Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="setCoverCheckbox"
                  checked={formIsCover}
                  onChange={e => setFormIsCover(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <label
                  htmlFor="setCoverCheckbox"
                  className="text-xs font-semibold text-slate-700 cursor-pointer select-none"
                >
                  Set as main cover photograph for {PROJECT_NAMES[modalState.projectId]}
                </label>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setModalState(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#0A5C36] hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-xs disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Picture...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{modalState.mode === 'upload' ? 'Upload Picture' : 'Save Changes'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 7. REMOVE PICTURE CONFIRMATION MODAL                                  */}
      {/* ===================================================================== */}
      {deleteModalState.isOpen && deleteModalState.photo && canManagePictures && (
        <div
          onClick={() => !isSubmitting && setDeleteModalState(prev => ({ ...prev, isOpen: false }))}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">
                Remove Photograph?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to remove &ldquo;{deleteModalState.photo.title}&rdquo; from{' '}
                <span className="font-bold text-slate-800">
                  {PROJECT_NAMES[deleteModalState.projectId]}
                </span>
                ? This action will be permanently recorded in the system Edit Log.
              </p>
            </div>

            {/* Thumbnail Preview */}
            <div className="w-24 h-16 mx-auto rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              <img
                src={deleteModalState.photo.src}
                alt={deleteModalState.photo.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setDeleteModalState(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeletePhoto}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-xs disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Remove</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
