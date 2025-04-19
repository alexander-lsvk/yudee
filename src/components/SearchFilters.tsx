import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { PropertyFilters, SortOption } from '../types';
import { useReferenceData } from '@/hooks/useReferenceData';
import {
  LocationFilter,
  RangeFilter,
  BedroomFilter,
  CategoryFilter,
  SortFilter
} from './filters';

interface SearchFiltersProps {
  filters: PropertyFilters;
  onFilterChange: (filters: PropertyFilters) => void;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
  onApplyFilters: () => void;
}

const PRIMARY_CATEGORIES = ['condo', 'apartment', 'house'];

const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFilterChange,
  sortOption,
  onSortChange,
  onApplyFilters
}) => {
  const { t } = useTranslation();
  const { propertyCategories, propertyBedrooms, locations, loading } = useReferenceData();
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [localFilters, setLocalFilters] = useState<PropertyFilters>(filters);

  // Reset local filters when prop filters change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setShowMoreFilters(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const groupedLocations = useMemo(() => {
    const areas = locations.filter(l => l.type === 'area');
    const subAreas = locations.filter(l => l.type === 'sub_area');
    const stations = locations.filter(l => l.type === 'bts' || l.type === 'mrt');

    const areaHierarchy = areas.map(area => ({
      ...area,
      subAreas: subAreas.filter(sub => sub.parent_id === area.id)
    }));

    return {
      areas: areaHierarchy,
      stations
    };
  }, [locations]);

  const selectedLocations = useMemo(() => {
    if (!localFilters.location?.length) return { areas: [], stations: [] };
    
    return {
      areas: locations.filter(l => 
        (l.type === 'area' || l.type === 'sub_area') && 
        localFilters.location?.includes(l.id)
      ),
      stations: locations.filter(l => 
        (l.type === 'bts' || l.type === 'mrt') && 
        localFilters.location?.includes(l.id)
      )
    };
  }, [localFilters.location, locations]);

  const handleSortChange = useCallback((value: string) => {
    const [field, direction] = value.split('-');
    onSortChange({ field: field as keyof Property, direction: direction as 'asc' | 'desc' });
  }, [onSortChange]);

  const handleFilterChange = useCallback((newFilters: PropertyFilters) => {
    console.log('Applying filters:', newFilters);
    setFilters(newFilters);
  }, []);

  const handleTabChange = useCallback((newTab: 'property' | 'client-request') => {
    setActiveTab(newTab);
    setFilters({ type: newTab });
  }, []);

  const resetFilters = useCallback(() => {
    const defaultFilters: PropertyFilters = { type: filters.type };
    setLocalFilters(defaultFilters);
    onFilterChange(defaultFilters);
    onSortChange({ field: 'createdAt', direction: 'desc' });
    if (isMobile) {
      setShowMoreFilters(false);
    }
  }, [filters.type, isMobile, onFilterChange, onSortChange]);

  const handleLocationToggle = useCallback((locationId: string) => {
    console.log('Toggling location:', locationId);
    setLocalFilters(prev => ({
      ...prev,
      location: prev.location?.includes(locationId)
        ? prev.location.filter(id => id !== locationId)
        : [...(prev.location || []), locationId]
    }));
  }, []);

  const handleCategoryToggle = useCallback((categoryId: string, checked: boolean) => {
    console.log('Toggling category:', categoryId, checked);
    setLocalFilters(prev => ({
      ...prev,
      category: checked
        ? [...(prev.category || []), categoryId]
        : (prev.category || []).filter(id => id !== categoryId)
    }));
  }, []);

  const handleBedroomToggle = useCallback((bedroomId: string, checked: boolean) => {
    console.log('Toggling bedroom:', bedroomId, checked);
    setLocalFilters(prev => ({
      ...prev,
      bedroomIds: checked
        ? [...(prev.bedroomIds || []), bedroomId]
        : (prev.bedroomIds || []).filter(id => id !== bedroomId)
    }));
  }, []);

  const handlePriceRangeChange = useCallback((min?: number, max?: number) => {
    console.log('Changing price range:', { min, max });
    setLocalFilters(prev => ({
      ...prev,
      priceRange: (min !== undefined || max !== undefined) ? { min, max } : undefined
    }));
  }, []);

  const handleAreaRangeChange = useCallback((min?: number, max?: number) => {
    console.log('Changing area range:', { min, max });
    setLocalFilters(prev => ({
      ...prev,
      areaRange: (min !== undefined || max !== undefined) ? { min, max } : undefined
    }));
  }, []);

  const handleApplyFilters = useCallback(() => {
    console.log('Applying filters:', localFilters);
    onFilterChange(localFilters);
    onApplyFilters();
  }, [localFilters, onFilterChange, onApplyFilters]);

  const hasActiveFilters = useMemo(() => 
    (localFilters.category?.length ?? 0) > 0 ||
    (localFilters.bedroomIds?.length ?? 0) > 0 ||
    (localFilters.location?.length ?? 0) > 0 ||
    localFilters.priceRange !== undefined ||
    localFilters.areaRange !== undefined ||
    sortOption.field !== 'createdAt' || 
    sortOption.direction !== 'desc'
  , [localFilters, sortOption]);

  const primaryCategories = useMemo(() => 
    propertyCategories.filter(cat => PRIMARY_CATEGORIES.includes(cat.name))
  , [propertyCategories]);

  const selectedSecondaryCategories = useMemo(() => 
    propertyCategories.filter(cat => 
      !PRIMARY_CATEGORIES.includes(cat.name) && 
      localFilters.category?.includes(cat.id)
    )
  , [propertyCategories, localFilters.category]);

  if (loading) {
    return <div className="w-full space-y-4 bg-white p-4 rounded-lg shadow-sm animate-pulse" />;
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-sm">
      {/* Always visible section */}
      <div className="p-4 space-y-4">
        <LocationFilter
          selectedLocations={selectedLocations}
          groupedLocations={groupedLocations}
          onLocationChange={handleLocationToggle}
          filters={localFilters}
        />

        {/* Range Filters - Two columns on md+ screens */}
        <div className="hidden md:grid md:grid-cols-2 md:gap-4">
          <RangeFilter
            label={t('propertyForm.fields.price.label')}
            unit="฿"
            value={localFilters.priceRange}
            onChange={handlePriceRangeChange}
          />
          <RangeFilter
            label={t('propertyForm.fields.area.label')}
            unit={t('propertyForm.fields.area.unit')}
            value={localFilters.areaRange}
            onChange={handleAreaRangeChange}
          />
        </div>

        {/* Price Range - Only visible on mobile */}
        <div className="md:hidden">
          <RangeFilter
            label={t('propertyForm.fields.price.label')}
            unit="฿"
            value={localFilters.priceRange}
            onChange={handlePriceRangeChange}
          />
        </div>

        {/* More Filters Button (Mobile) */}
        {isMobile && (
          <div className="md:hidden">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => setShowMoreFilters(!showMoreFilters)}
            >
              {t('filters.moreFilters')}
              {showMoreFilters ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Expandable section */}
      <div className={`border-t ${showMoreFilters || !isMobile ? 'block' : 'hidden'}`}>
        <div className="p-4 space-y-3">
          {/* Area Range - Only visible on mobile when expanded */}
          <div className="md:hidden">
            <RangeFilter
              label={t('propertyForm.fields.area.label')}
              unit={t('propertyForm.fields.area.unit')}
              value={localFilters.areaRange}
              onChange={handleAreaRangeChange}
            />
          </div>

          {/* Two-column layout for Bedrooms and Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BedroomFilter
              propertyBedrooms={propertyBedrooms}
              selectedBedrooms={localFilters.bedroomIds}
              onBedroomChange={handleBedroomToggle}
            />
            <CategoryFilter
              primaryCategories={primaryCategories}
              propertyCategories={propertyCategories}
              selectedCategories={localFilters.category}
              selectedSecondaryCategories={selectedSecondaryCategories}
              onCategoryChange={handleCategoryToggle}
            />
          </div>
        </div>
      </div>

      {/* Footer Actions - Always visible */}
      <div className="border-t p-4 flex justify-between items-center gap-2 bg-white sticky bottom-0">
        <div className="flex items-center gap-2">
          <SortFilter
            sortOption={sortOption}
            onSortChange={handleSortChange}
          />
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button 
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="h-9"
            >
              {t('filters.reset')}
            </Button>
          )}

          <Button 
            onClick={handleApplyFilters}
            className="h-9"
          >
            {t('filters.apply')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SearchFilters;