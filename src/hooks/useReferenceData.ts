import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getLocations, getAmenities, getTags, getPropertyCategories, getPropertyBedrooms } from '@/lib/reference';

// Cache for reference data
let cachedData = {
  locations: null as any[] | null,
  amenities: null as any[] | null,
  tags: null as any[] | null,
  propertyCategories: null as any[] | null,
  propertyBedrooms: null as any[] | null,
  lastFetched: 0,
  language: null as string | null
};

// Cache duration in milliseconds (e.g., 1 hour)
const CACHE_DURATION = 60 * 60 * 1000;

export function useReferenceData() {
  const { i18n } = useTranslation();
  const [locations, setLocations] = useState<any[]>([]);
  const [amenities, setAmenities] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [propertyCategories, setPropertyCategories] = useState<any[]>([]);
  const [propertyBedrooms, setPropertyBedrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    async function fetchReferenceData() {
      try {
        // Check if we have valid cached data for the current language
        const now = Date.now();
        if (
          cachedData.locations &&
          cachedData.amenities &&
          cachedData.tags &&
          cachedData.propertyCategories &&
          cachedData.propertyBedrooms &&
          cachedData.language === i18n.language &&
          now - cachedData.lastFetched < CACHE_DURATION
        ) {
          console.log('Using cached reference data');
          setLocations(cachedData.locations);
          setAmenities(cachedData.amenities);
          setTags(cachedData.tags);
          setPropertyCategories(cachedData.propertyCategories);
          setPropertyBedrooms(cachedData.propertyBedrooms);
          setLoading(false);
          setInitialized(true);
          return;
        }

        console.log('Fetching fresh reference data...');
        setLoading(true);
        
        const [
          locationsData,
          amenitiesData,
          tagsData,
          categoriesData,
          bedroomsData
        ] = await Promise.all([
          getLocations(),
          getAmenities(),
          getTags(),
          getPropertyCategories(),
          getPropertyBedrooms()
        ]);

        // Process data based on current language
        const processedLocations = locationsData.map(l => ({
          ...l,
          name: i18n.language === 'th' && l.display_name_th ? l.display_name_th : l.name,
          display_name: i18n.language === 'th' && l.display_name_th ? l.display_name_th : l.name
        }));

        const processedAmenities = amenitiesData.map(a => ({
          ...a,
          name: a.name,
          display_name: i18n.language === 'th' && a.display_name_th ? a.display_name_th : a.name
        }));

        const processedTags = tagsData.map(t => ({
          ...t,
          name: t.name,
          display_name: i18n.language === 'th' && t.display_name_th ? t.display_name_th : t.name
        }));

        const processedBedrooms = bedroomsData.map(b => ({
          ...b,
          name: b.name,
          display_name: i18n.language === 'th' && b.display_name_th ? b.display_name_th : b.name
        }));

        const processedCategories = categoriesData.map(c => ({
          ...c,
          name: c.name,
          display_name: i18n.language === 'th' && c.display_name_th ? c.display_name_th : c.display_name
        }));

        // Update cache
        cachedData = {
          locations: processedLocations,
          amenities: processedAmenities,
          tags: processedTags,
          propertyCategories: processedCategories,
          propertyBedrooms: processedBedrooms,
          lastFetched: now,
          language: i18n.language
        };

        // Update state
        setLocations(processedLocations);
        setAmenities(processedAmenities);
        setTags(processedTags);
        setPropertyCategories(processedCategories);
        setPropertyBedrooms(processedBedrooms);
        setError(null);
        setInitialized(true);
      } catch (err) {
        console.error('Error fetching reference data:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch reference data'));
      } finally {
        setLoading(false);
      }
    }

    fetchReferenceData();
  }, [i18n.language]); // Re-fetch when language changes

  return {
    locations,
    amenities,
    tags,
    propertyCategories,
    propertyBedrooms,
    loading,
    error,
    initialized
  };
}