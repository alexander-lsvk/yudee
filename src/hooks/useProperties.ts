import { useState, useEffect, useCallback, useRef } from 'react';
import type { PropertyFilters, SortOption, Property, PropertyFormData } from '@/types';
import { getProperties, createProperty as createPropertyApi, updateProperty as updatePropertyApi } from '@/lib/properties';

export function useProperties(filters: PropertyFilters, sort: SortOption) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestIdRef = useRef<number>(0);

  const fetchProperties = useCallback(async () => {
    try {
      const requestId = ++lastRequestIdRef.current;
      console.log('[useProperties] Starting fetch, request ID:', requestId, 'Filters:', filters);
      setLoading(true);

      // Create new AbortController for this request
      if (abortControllerRef.current) {
        console.log('[useProperties] Aborting previous request');
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const data = await getProperties({
        type: filters.type,
        categoryIds: filters.category,
        bedroomIds: filters.bedroomIds,
        locationIds: filters.location,
        priceRange: filters.priceRange,
        areaRange: filters.areaRange,
        sort,
        signal: abortControllerRef.current.signal
      });

      // Only update state if this is still the latest request
      if (requestId === lastRequestIdRef.current) {
        console.log('[useProperties] Request completed successfully, ID:', requestId, 'Results:', data.length);
        setProperties(data);
        setError(null);
      } else {
        console.log('[useProperties] Request', requestId, 'was superseded by a newer request');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('[useProperties] Request was aborted');
        return;
      }
      console.error('[useProperties] Error fetching properties:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch properties'));
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [filters, sort]);

  // Effect to handle property fetching
  useEffect(() => {
    console.log('[useProperties] Effect triggered with filters:', filters);
    fetchProperties();

    return () => {
      if (abortControllerRef.current) {
        console.log('[useProperties] Cleanup: aborting pending request');
        abortControllerRef.current.abort();
      }
    };
  }, [fetchProperties]);

  return { 
    data: properties, 
    isLoading: loading, 
    error,
    refetch: fetchProperties
  };
}

export function usePropertyMutations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleCreateProperty = async (data: PropertyFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      const property = await createPropertyApi(data);
      return property;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create property');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProperty = async (id: string, data: PropertyFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      const property = await updatePropertyApi(id, data);
      return property;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update property');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProperty = async (id: string) => {
    // TODO: Implement delete functionality
    console.log('Deleting property:', id);
  };

  return {
    createProperty: { 
      mutateAsync: handleCreateProperty,
      isLoading,
      error
    },
    updateProperty: { 
      mutateAsync: handleUpdateProperty,
      isLoading,
      error
    },
    deleteProperty: { 
      mutateAsync: handleDeleteProperty,
      isLoading: false,
      error: null
    }
  };
}