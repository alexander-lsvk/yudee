import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { Property } from "@/types";
import { supabase } from "@/lib/supabase";

export function useMyListings(
  agentId?: string,
  type?: "property" | "client-request"
) {
  const { i18n } = useTranslation();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);
  const lastRequestIdRef = useRef<number>(0);

  const fetchListings = useCallback(async () => {
    if (!agentId) return;

    try {
      const requestId = ++lastRequestIdRef.current;
      console.log("[useMyListings] Starting fetch, request ID:", requestId);
      setLoading(true);
      setError(null);

      let query = supabase
        .from("properties")
        .select(
          `
          *,
          agent:profiles!properties_agent_id_fkey(
            id,
            name,
            line_id,
            phone,
            avatar_url
          ),
          category:property_categories!properties_category_id_fkey(
            id,
            name,
            display_name,
            display_name_th
          ),
          property_locations(
            location:locations(
              id,
              name,
              display_name_th
            )
          ),
          property_amenities_junction(
            amenity:property_amenities(
              id,
              name,
              display_name_th
            )
          ),
          property_tags_junction(
            tag:property_tags(
              id,
              name,
              display_name_th
            )
          ),
          property_images(
            url
          ),
          single_bedroom:property_bedrooms!properties_bedroom_id_fkey(
            id,
            name,
            display_name_th
          ),
          property_bedrooms_junction(
            bedroom:property_bedrooms(
              id,
              name,
              display_name_th
            )
          )
        `
        )
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false });

      // Apply type filter if specified
      if (type) {
        query = query.eq("type", type);
      }

      const { data, error } = await query;

      // Only update state if component is still mounted
      if (isMountedRef.current && requestId === lastRequestIdRef.current) {
        if (error) {
          throw error;
        }

        if (!data) {
          setProperties([]);
          return;
        }

        console.log("[useMyListings] Data:", data);

        const formattedData = data
          .map((property) => formatPropertyResponse(property, i18n.language))
          .filter(Boolean);
        console.log(
          "[useMyListings] Request completed successfully, ID:",
          requestId,
          "Results:",
          formattedData.length
        );
        setProperties(formattedData);
        setError(null);
      } else {
        console.log(
          "[useMyListings] Request",
          requestId,
          "was superseded by a newer request or component unmounted"
        );
      }
    } catch (err) {
      console.error("[useMyListings] Error:", err);
      if (isMountedRef.current) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch listings")
        );
        setProperties([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [agentId, type, i18n.language]);

  useEffect(() => {
    console.log(
      "[useMyListings] Effect triggered with agentId:",
      agentId,
      "type:",
      type
    );
    isMountedRef.current = true;
    fetchListings();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchListings]);

  return {
    data: properties,
    isLoading: loading,
    error,
    refetch: fetchListings,
  };
}

function formatPropertyResponse(property: any, language: string) {
  if (!property) return null;

  try {
    const agent = property.agent;
    if (!agent) {
      console.warn(
        `[formatPropertyResponse] No agent data found for property ${property.id}`
      );
    }

    // Helper function to get localized name
    const getLocalizedName = (obj: any) => {
      if (!obj) return "";
      return language === "th" && obj.display_name_th
        ? obj.display_name_th
        : obj.name;
    };

    return {
      id: property.id,
      type: property.type,
      category: property.category?.name || "unknown",
      categoryDisplay: property.category?.display_name || "",
      categoryDisplayTh: property.category?.display_name_th || "",
      title: property.title,
      description: property.description,
      projectName: property.project_name,
      floor: property.floor,
      moveInDate: property.move_in_date,
      buildYear: property.build_year,
      area:
        property.type === "property"
          ? property.area
          : { min: property.area_min, max: property.area_max },
      price: property.price,
      priceRange:
        property.type === "client-request"
          ? { min: property.price_min, max: property.price_max }
          : undefined,
      bedrooms:
        property.type === "property"
          ? getLocalizedName(property.single_bedroom)
          : property.property_bedrooms_junction?.map((b) =>
              getLocalizedName(b.bedroom)
            ) || [],
      bathrooms: property.bathrooms,
      agentId: property.agent_id,
      agentName: agent?.name || "Unknown Agent",
      agentAvatar:
        agent?.avatar_url ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${property.agent_id}`,
      contactPhone: agent?.phone,
      contactLine: agent?.line_id,
      location:
        property.property_locations?.map((l) => ({
          id: l.location?.id,
          name: getLocalizedName(l.location),
        })) || [],
      amenities:
        property.property_amenities_junction?.map((a) =>
          getLocalizedName(a.amenity)
        ) || [],
      tags:
        property.property_tags_junction?.map((t) => getLocalizedName(t.tag)) ||
        [],
      images: property.property_images?.map((i) => i.url) || [],
      createdAt: new Date(property.created_at),
      commissionSplit: {
        type: property.commission_split_type,
        value: property.commission_split_value,
      },
    };
  } catch (error) {
    console.error(
      "[formatPropertyResponse] Error formatting property:",
      property.id,
      error
    );
    return null;
  }
}
