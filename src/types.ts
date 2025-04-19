import { Database } from './lib/database.types';

export type PropertyCategory = 'condo' | 'apartment' | 'house' | 'townhouse' | 'shophouse' | 'land' | 'office' | 'retail' | 'warehouse' | 'hotel' | 'resort' | 'factory';
export type LocationType = 'area' | 'sub_area' | 'bts' | 'mrt';

export interface Property {
  id: string;
  type: 'property' | 'client-request';
  category: PropertyCategory;
  categoryDisplay: string;
  categoryDisplayTh: string;
  title: string;
  description: string;
  location: string[];
  district?: string;
  projectName?: string;
  btsMrtNearby?: string[];
  floor?: number;
  moveInDate?: Date;
  buildYear?: number;
  area: number | { min: string; max: string };
  price?: number;
  priceRange?: {
    min: number;
    max: number;
  };
  bedrooms: string;
  bathrooms: number | number[];
  images: string[];
  amenities: string[];
  tags?: string[];
  agentId: string;
  agentName: string;
  agentAvatar: string;
  contactPhone: string;
  contactEmail: string;
  contactLine?: string;
  createdAt: Date;
  commissionSplit: {
    type: 'fixed' | 'percentage';
    value: number;
  };
}

export interface PropertyFormData {
  type: 'property' | 'client-request';
  category_id: string; // Changed from category to category_id
  title: string;
  description: string;
  location: string[];
  projectName?: string;
  floor?: number;
  moveInDate?: string;
  buildYear?: number;
  area: number | { min: string; max: string };
  price?: number;
  priceRange?: {
    min: number;
    max: number;
  };
  bedroomId: string;
  selectedBedrooms?: string[];
  bathrooms: number | number[];
  commissionSplit: {
    type: 'fixed' | 'percentage';
    value: number;
  };
  amenities: string[];
  tags: string[];
  images: string[];
}

export interface PropertyFilters {
  type: 'property' | 'client-request';
  categoryIds?: string[]; // Changed from category to categoryIds
  bedroomIds?: string[];
  location?: string[];
  priceRange?: {
    min?: number;
    max?: number;
  };
  areaRange?: {
    min?: number;
    max?: number;
  };
  agentId?: string;
}

export interface SortOption {
  field: keyof Property;
  direction: 'asc' | 'desc';
}

export interface DeletedProperty {
  id: string;
  originalId: string;
  type: 'property' | 'client-request';
  category: PropertyCategory;
  title: string;
  description: string;
  projectName?: string;
  floor?: number;
  moveInDate?: Date;
  buildYear?: number;
  area: number | { min: number; max: number };
  price?: number;
  priceRange?: {
    min: number;
    max: number;
  };
  bathrooms: number;
  commissionSplit: {
    type: 'fixed' | 'percentage';
    value: number;
  };
  locations: string[];
  amenities: string[];
  tags: string[];
  images: string[];
  dealClosed: boolean;
  closedAt?: Date;
  deletedAt: Date;
  agentId: string;
}

export interface UserProfile {
  id: string;
  phone: string;
  name: string;
  line_id?: string;
  avatar_url?: string;
  premium_until?: string;
  premium_trial_used: boolean;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      [_ in string]: any
    }
    Views: {
      [_ in string]: any
    }
    Functions: {
      [_ in string]: any
    }
    Enums: {
      [_ in string]: any
    }
    CompositeTypes: {
      [_ in string]: any
    }
  }
}