import { supabase } from "./supabase";
import type { PropertyFormData, SortOption, DeletedProperty } from "@/types";

interface GetPropertiesOptions {
  type?: "property" | "client-request";
  categoryIds?: string[];
  bedroomIds?: string[];
  locationIds?: string[];
  priceRange?: {
    min?: number;
    max?: number;
  };
  areaRange?: {
    min?: number;
    max?: number;
  };
  sort?: SortOption;
  page?: number;
  limit?: number;
  signal?: AbortSignal;
  agentId?: string;
}

export async function getProperties(
  options: GetPropertiesOptions = {},
  signal?: AbortSignal
) {
  console.log("[getProperties] Starting request with options:", options);

  // Create an AbortController if not provided
  const controller = signal ? { signal } : new AbortController();
  const { signal: abortSignal } = controller;

  try {
    console.log("[getProperties] Building query");
    let query = supabase.from("properties").select(`
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
      `);

    console.log("[getProperties] Base query built");

    // CRITICAL: Apply agent filter first if specified
    if (options.agentId) {
      console.log("[getProperties] Applying agent filter:", options.agentId);
      query = query.eq("agent_id", options.agentId);
    }

    // Apply type filter
    if (options.type) {
      console.log("[getProperties] Applying type filter:", options.type);
      query = query.eq("type", options.type);
    }

    // Apply category filter
    if (options.categoryIds?.length) {
      console.log(
        "[getProperties] Applying category filter:",
        options.categoryIds
      );
      query = query.in("category_id", options.categoryIds);
    }

    // Apply price range filter
    if (options.priceRange) {
      console.log(
        "[getProperties] Applying price range filter:",
        options.priceRange
      );
      if (options.type === "property") {
        if (options.priceRange.min !== undefined) {
          query = query.gte("price", options.priceRange.min);
        }
        if (options.priceRange.max !== undefined) {
          query = query.lte("price", options.priceRange.max);
        }
      } else {
        if (options.priceRange.min !== undefined) {
          query = query.gte("price_min", options.priceRange.min);
        }
        if (options.priceRange.max !== undefined) {
          query = query.lte("price_max", options.priceRange.max);
        }
      }
    }

    // Apply area range filter
    if (options.areaRange) {
      console.log(
        "[getProperties] Applying area range filter:",
        options.areaRange
      );
      if (options.type === "property") {
        if (options.areaRange.min !== undefined) {
          query = query.gte("area", options.areaRange.min);
        }
        if (options.areaRange.max !== undefined) {
          query = query.lte("area", options.areaRange.max);
        }
      } else {
        if (options.areaRange.min !== undefined) {
          query = query.gte("area_min", options.areaRange.min);
        }
        if (options.areaRange.max !== undefined) {
          query = query.lte("area_max", options.areaRange.max);
        }
      }
    }

    // Apply location filter
    if (options.locationIds?.length) {
      console.log(
        "[getProperties] Applying location filter:",
        options.locationIds
      );
      const { data: locationData, error: locationError } = await supabase
        .from("property_locations")
        .select("property_id")
        .in("location_id", options.locationIds)
        .abortSignal(abortSignal);

      if (locationError) {
        console.error(
          "[getProperties] Error fetching property locations:",
          locationError
        );
        throw locationError;
      }

      const propertyIds = locationData?.map((d) => d.property_id) || [];
      if (propertyIds.length > 0) {
        query = query.in("id", propertyIds);
      } else {
        return [];
      }
    }

    // Apply bedroom filter
    if (options.bedroomIds?.length) {
      console.log(
        "[getProperties] Applying bedroom filter:",
        options.bedroomIds
      );
      const { data: junctionData, error: junctionError } = await supabase
        .from("property_bedrooms_junction")
        .select("property_id")
        .in("bedroom_id", options.bedroomIds)
        .abortSignal(abortSignal);

      if (junctionError) {
        console.error(
          "[getProperties] Error fetching bedroom junction data:",
          junctionError
        );
        throw junctionError;
      }

      const propertyIds = [
        ...new Set([
          ...(junctionData?.map((d) => d.property_id) || []),
          // Also include properties with direct bedroom_id
          ...(await supabase
            .from("properties")
            .select("id")
            .in("bedroom_id", options.bedroomIds)
            .abortSignal(abortSignal)
            .then(({ data }) => data?.map((d) => d.id) || [])),
        ]),
      ];

      if (propertyIds.length > 0) {
        query = query.in("id", propertyIds);
      } else {
        return [];
      }
    }

    // Apply sorting
    if (options.sort) {
      const { field, direction } = options.sort;
      console.log("[getProperties] Applying sort:", { field, direction });
      if (field === "createdAt") {
        query = query.order("created_at", { ascending: direction === "asc" });
      } else if (field === "priceRange") {
        if (options.type === "property") {
          query = query.order("price", { ascending: direction === "asc" });
        } else {
          query = query.order("price_max", { ascending: direction === "asc" });
        }
      }
    } else {
      // Default sorting
      query = query.order("created_at", { ascending: false });
    }

    // Apply pagination
    if (options.page && options.limit) {
      const from = (options.page - 1) * options.limit;
      const to = from + options.limit - 1;
      query = query.range(from, to);
    }

    // Add abort signal to the query
    query = query.abortSignal(abortSignal);

    console.log("[getProperties] Executing final query");
    const { data, error } = await query;

    if (error) {
      console.error("[getProperties] Error fetching properties:", error);
      throw error;
    }

    if (!data) {
      console.log("[getProperties] No data returned from query");
      return [];
    }

    console.log("[getProperties] Raw data received:", data);
    const formattedData = data.map(formatPropertyResponse).filter(Boolean);
    console.log(
      "[getProperties] Query successful, returning",
      formattedData.length,
      "properties"
    );
    return formattedData;
  } catch (error) {
    if (error.name === "AbortError") {
      console.log("[getProperties] Request was aborted");
      return [];
    }
    console.error("[getProperties] Error in getProperties:", error);
    throw error;
  }
}

function formatPropertyResponse(property: any) {
  if (!property) return null;

  try {
    const agent = property.agent;
    if (!agent) {
      console.warn(
        `[formatPropertyResponse] No agent data found for property ${property.id}`
      );
    }

    // Get current language from i18next
    const lang = localStorage.getItem("i18nextLng") || "en";

    // Helper function to get localized name
    const getLocalizedName = (obj: any) => {
      if (!obj) return "";
      return lang === "th" && obj.display_name_th
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
        property.property_amenities_junction?.map((a) => ({
          id: a.amenity?.id,
          name: getLocalizedName(a.amenity),
        })) || [],
      //tags: property.property_tags_junction?.map(t => getLocalizedName(t.tag)) || [],
      tags:
        property.property_tags_junction?.map((t) => ({
          id: t.tag?.id,
          name: getLocalizedName(t.tag),
        })) || [],
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

export async function createProperty(data: PropertyFormData) {
  try {
    console.log("[createProperty] Starting property creation");
    // Get current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError) {
      throw new Error(`Authentication error: ${sessionError.message}`);
    }

    if (!session?.user?.id) {
      throw new Error("No authenticated user found");
    }

    console.log("[createProperty] Creating property record");
    // Create the property
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .insert({
        type: data.type,
        category_id: data.category_id || null, // Ensure null is used instead of empty string
        title: data.title,
        description: data.description,
        project_name: data.projectName || null,
        floor: data.floor || null,
        move_in_date: data.moveInDate || null,
        build_year: data.buildYear || null,
        area: data.type === "property" ? data.area || null : null,
        area_min:
          data.type === "client-request" && typeof data.area === "object"
            ? data.area.min
              ? parseFloat(data.area.min)
              : null
            : null,
        area_max:
          data.type === "client-request" && typeof data.area === "object"
            ? data.area.max
              ? parseFloat(data.area.max)
              : null
            : null,
        price: data.type === "property" ? data.price || null : null,
        price_min:
          data.type === "client-request" ? data.priceRange?.min || null : null,
        price_max:
          data.type === "client-request" ? data.priceRange?.max || null : null,
        bedroom_id: data.type === "property" ? data.bedroomId || null : null, // Ensure null is used instead of empty string
        bathrooms: Array.isArray(data.bathrooms)
          ? data.bathrooms[0]
          : data.bathrooms,
        commission_split_type: data.commissionSplit.type,
        commission_split_value: data.commissionSplit.value,
        agent_id: session.user.id,
      })
      .select()
      .single();

    if (propertyError) {
      throw new Error(`Error creating property: ${propertyError.message}`);
    }

    if (!property) {
      throw new Error("No property returned after creation");
    }

    // Insert multiple bedrooms for client request
    if (data.type === "client-request" && data.selectedBedrooms?.length) {
      console.log("[createProperty] Adding bedrooms for client request");
      const { error: bedroomsError } = await supabase
        .from("property_bedrooms_junction")
        .insert(
          data.selectedBedrooms.map((bedroomId) => ({
            property_id: property.id,
            bedroom_id: bedroomId,
          }))
        );

      if (bedroomsError) {
        throw new Error(`Error adding bedrooms: ${bedroomsError.message}`);
      }
    }

    // Insert locations
    if (data.location.length > 0) {
      console.log("[createProperty] Adding locations");
      const { error: locationError } = await supabase
        .from("property_locations")
        .insert(
          data.location.map((locationId) => ({
            property_id: property.id,
            location_id: locationId,
          }))
        );

      if (locationError) {
        throw new Error(`Error adding locations: ${locationError.message}`);
      }
    }

    // Insert amenities
    if (data.amenities.length > 0) {
      console.log("[createProperty] Adding amenities");
      const { error: amenityError } = await supabase
        .from("property_amenities_junction")
        .insert(
          data.amenities.map((amenityId) => ({
            property_id: property.id,
            amenity_id: amenityId,
          }))
        );

      if (amenityError) {
        throw new Error(`Error adding amenities: ${amenityError.message}`);
      }
    }

    // Insert tags
    if (data.tags.length > 0) {
      console.log("[createProperty] Adding tags");
      const { error: tagError } = await supabase
        .from("property_tags_junction")
        .insert(
          data.tags.map((tagId) => ({
            property_id: property.id,
            tag_id: tagId,
          }))
        );

      if (tagError) {
        throw new Error(`Error adding tags: ${tagError.message}`);
      }
    }

    // Insert images
    const hasValidImages = data.images.some((url) => url && url.trim() !== "");
    if (hasValidImages) {
      console.log("[createProperty] Adding images");
      const { error: imageError } = await supabase
        .from("property_images")
        .insert(
          data.images
            .filter((url) => url && url.trim() !== "")
            .map((url) => ({
              property_id: property.id,
              url,
            }))
        );

      if (imageError) {
        throw new Error(`Error adding images: ${imageError.message}`);
      }
    } else {
      // Use default Bangkok skyline image when no valid images are provided
      console.log("[createProperty] Using default image");
      const defaultImageUrl =
        "https://images.unsplash.com/photo-1523731407965-2430cd12f5e4?q=80&w=800&auto=format&";
      const { error: imageError } = await supabase
        .from("property_images")
        .insert([
          {
            property_id: property.id,
            url: defaultImageUrl,
          },
        ]);

      if (imageError) {
        throw new Error(`Error adding default image: ${imageError.message}`);
      }
    }

    console.log("[createProperty] Property creation completed successfully");
    return property;
  } catch (error) {
    console.error("[createProperty] Error in createProperty:", error);
    throw error;
  }
}

export async function updateProperty(id: string, data: PropertyFormData) {
  try {
    console.log("[updateProperty] Starting property update");

    // Get current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError) {
      throw new Error(`Authentication error: ${sessionError.message}`);
    }

    if (!session?.user?.id) {
      throw new Error("No authenticated user found");
    }

    // Update the property
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .update({
        type: data.type,
        category_id: data.category_id || null, // Ensure null is used instead of empty string
        title: data.title,
        description: data.description,
        project_name: data.projectName || null,
        floor: data.floor || null,
        move_in_date: data.moveInDate || null,
        build_year: data.buildYear || null,
        area: data.type === "property" ? data.area || null : null,
        area_min:
          data.type === "client-request" && typeof data.area === "object"
            ? data.area.min
              ? parseFloat(data.area.min)
              : null
            : null,
        area_max:
          data.type === "client-request" && typeof data.area === "object"
            ? data.area.max
              ? parseFloat(data.area.max)
              : null
            : null,
        price: data.type === "property" ? data.price || null : null,
        price_min:
          data.type === "client-request" ? data.priceRange?.min || null : null,
        price_max:
          data.type === "client-request" ? data.priceRange?.max || null : null,
        bedroom_id: data.type === "property" ? data.bedroomId || null : null, // Ensure null is used instead of empty string
        bathrooms: Array.isArray(data.bathrooms)
          ? data.bathrooms[0]
          : data.bathrooms,
        commission_split_type: data.commissionSplit.type,
        commission_split_value: data.commissionSplit.value,
      })
      .eq("id", id)
      .eq("agent_id", session.user.id)
      .select()
      .single();

    if (propertyError) {
      throw new Error(`Error updating property: ${propertyError.message}`);
    }

    if (!property) {
      throw new Error("No property returned after update");
    }

    // Update bedrooms for client request
    if (data.type === "client-request") {
      // Delete existing bedrooms
      await supabase
        .from("property_bedrooms_junction")
        .delete()
        .eq("property_id", id);

      // Insert new bedrooms
      if (data.selectedBedrooms?.length) {
        const { error: bedroomsError } = await supabase
          .from("property_bedrooms_junction")
          .insert(
            data.selectedBedrooms.map((bedroomId) => ({
              property_id: property.id,
              bedroom_id: bedroomId,
            }))
          );

        if (bedroomsError) {
          throw new Error(`Error updating bedrooms: ${bedroomsError.message}`);
        }
      }
    }

    // Update locations
    await supabase.from("property_locations").delete().eq("property_id", id);

    if (data.location.length > 0) {
      const { error: locationError } = await supabase
        .from("property_locations")
        .insert(
          data.location.map((locationId) => ({
            property_id: property.id,
            location_id: locationId,
          }))
        );

      if (locationError) {
        throw new Error(`Error updating locations: ${locationError.message}`);
      }
    }

    // Update amenities
    await supabase
      .from("property_amenities_junction")
      .delete()
      .eq("property_id", id);

    if (data.amenities.length > 0) {
      const { error: amenityError } = await supabase
        .from("property_amenities_junction")
        .insert(
          data.amenities.map((amenityId) => ({
            property_id: property.id,
            amenity_id: amenityId,
          }))
        );

      if (amenityError) {
        throw new Error(`Error updating amenities: ${amenityError.message}`);
      }
    }

    // Update tags
    await supabase
      .from("property_tags_junction")
      .delete()
      .eq("property_id", id);

    if (data.tags.length > 0) {
      const { error: tagError } = await supabase
        .from("property_tags_junction")
        .insert(
          data.tags.map((tagId) => ({
            property_id: property.id,
            tag_id: tagId,
          }))
        );

      if (tagError) {
        throw new Error(`Error updating tags: ${tagError.message}`);
      }
    }

    // Update images
    await supabase.from("property_images").delete().eq("property_id", id);

    if (data.images.length > 0) {
      const { error: imageError } = await supabase
        .from("property_images")
        .insert(
          data.images.map((url) => ({
            property_id: property.id,
            url,
          }))
        );

      if (imageError) {
        throw new Error(`Error updating images: ${imageError.message}`);
      }
    }

    console.log("[updateProperty] Property update completed successfully");
    return property;
  } catch (error) {
    console.error("[updateProperty] Error in updateProperty:", error);
    throw error;
  }
}

export async function deleteProperty(
  id: string,
  dealClosed: boolean
): Promise<void> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      throw new Error("No authenticated user found");
    }

    // Get the complete property data with all relations
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select(
        `
        *,
        category:property_categories(
          id,
          name,
          display_name
        ),
        property_locations(
          location:locations(
            id,
            name,
            type
          )
        ),
        property_amenities_junction(
          amenity:property_amenities(
            id,
            name
          )
        ),
        property_tags_junction(
          tag:property_tags(
            id,
            name
          )
        ),
        property_images(
          url
        ),
        property_bedrooms_junction(
          bedroom:property_bedrooms(
            id,
            name
          )
        )
      `
      )
      .eq("id", id)
      .eq("agent_id", session.user.id)
      .single();

    if (propertyError) {
      throw propertyError;
    }

    if (!property) {
      throw new Error("Property not found");
    }

    // Insert into deleted_properties with complete data
    const { error: deletedError } = await supabase
      .from("deleted_properties")
      .insert({
        original_id: property.id,
        type: property.type,
        category_id: property.category_id,
        title: property.title,
        description: property.description,
        project_name: property.project_name,
        floor: property.floor,
        move_in_date: property.move_in_date,
        build_year: property.build_year,
        area: property.area,
        area_min: property.area_min,
        area_max: property.area_max,
        price: property.price,
        price_min: property.price_min,
        price_max: property.price_max,
        bedroom_id: property.bedroom_id,
        bathrooms: property.bathrooms,
        commission_split_type: property.commission_split_type,
        commission_split_value: property.commission_split_value,
        agent_id: property.agent_id,
        created_at: property.created_at,
        deal_closed: dealClosed,
        closed_at: dealClosed ? new Date().toISOString() : null,
        // Store related data as JSON
        locations: property.property_locations?.map((pl) => ({
          id: pl.location.id,
          name: pl.location.name,
          type: pl.location.type,
        })),
        amenities: property.property_amenities_junction?.map((pa) => ({
          id: pa.amenity.id,
          name: pa.amenity.name,
        })),
        tags: property.property_tags_junction?.map((pt) => ({
          id: pt.tag.id,
          name: pt.tag.name,
        })),
        images: property.property_images?.map((pi) => pi.url),
        bedrooms: property.property_bedrooms_junction?.map((pb) => ({
          id: pb.bedroom.id,
          name: pb.bedroom.name,
        })),
      });

    if (deletedError) {
      throw deletedError;
    }

    // Delete the original property
    const { error: deleteError } = await supabase
      .from("properties")
      .delete()
      .eq("id", id)
      .eq("agent_id", session.user.id);

    if (deleteError) {
      throw deleteError;
    }
  } catch (error) {
    console.error("[deleteProperty] Error:", error);
    throw error;
  }
}

export async function getDeletedProperties(
  agentId: string
): Promise<DeletedProperty[]> {
  try {
    const { data, error } = await supabase
      .from("deleted_properties")
      .select(
        `
        *,
        category:property_categories(
          name,
          display_name
        )
      `
      )
      .eq("agent_id", agentId)
      .order("deleted_at", { ascending: false });

    if (error) {
      throw error;
    }

    return data.map((item) => ({
      id: item.id,
      originalId: item.original_id,
      type: item.type,
      category: item.category?.name,
      title: item.title,
      description: item.description,
      projectName: item.project_name,
      floor: item.floor,
      moveInDate: item.move_in_date ? new Date(item.move_in_date) : undefined,
      buildYear: item.build_year,
      area:
        item.type === "property"
          ? item.area
          : { min: item.area_min, max: item.area_max },
      price: item.type === "property" ? item.price : undefined,
      priceRange:
        item.type === "client-request"
          ? { min: item.price_min, max: item.price_max }
          : undefined,
      bathrooms: item.bathrooms,
      commissionSplit: {
        type: item.commission_split_type,
        value: item.commission_split_value,
      },
      locations: item.locations?.map((l: any) => l.name) || [],
      amenities: item.amenities?.map((a: any) => a.name) || [],
      tags: item.tags?.map((t: any) => t.name) || [],
      images: item.images || [],
      dealClosed: item.deal_closed,
      closedAt: item.closed_at ? new Date(item.closed_at) : undefined,
      deletedAt: new Date(item.deleted_at),
      agentId: item.agent_id,
    }));
  } catch (error) {
    console.error("[getDeletedProperties] Error:", error);
    throw error;
  }
}
