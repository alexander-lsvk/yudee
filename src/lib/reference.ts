import { supabase } from './supabase';

export async function getLocations() {
  console.log('Fetching locations...');
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching locations:', error);
    throw error;
  }

  console.log('Locations fetched:', data);
  return data || [];
}

export async function getAmenities() {
  console.log('Fetching amenities...');
  const { data, error } = await supabase
    .from('property_amenities')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching amenities:', error);
    throw error;
  }

  console.log('Amenities fetched:', data);
  return data || [];
}

export async function getTags() {
  console.log('Fetching tags...');
  const { data, error } = await supabase
    .from('property_tags')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching tags:', error);
    throw error;
  }

  console.log('Tags fetched:', data);
  return data || [];
}

export async function getPropertyBedrooms() {
  console.log('Fetching property bedrooms...');
  const { data, error } = await supabase
    .from('property_bedrooms')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching property bedrooms:', error);
    throw error;
  }

  console.log('Property bedrooms fetched:', data);
  return data || [];
}

export async function getPropertyCategories() {
  console.log('Fetching property categories...');
  try {
    const { data, error } = await supabase
      .from('property_categories')
      .select('*')
      .order('display_order');

    if (error) {
      console.error('Error fetching property categories:', error);
      throw error;
    }

    console.log('Property categories fetched:', data);
    return data || [];
  } catch (error) {
    console.error('Error in getPropertyCategories:', error);
    // Fallback to hardcoded values if query fails
    return [
      { id: '1', name: 'condo', display_name: 'Condominium', display_order: 10 },
      { id: '2', name: 'apartment', display_name: 'Apartment', display_order: 20 },
      { id: '3', name: 'house', display_name: 'House', display_order: 30 },
      { id: '4', name: 'townhouse', display_name: 'Townhouse', display_order: 40 },
      { id: '5', name: 'shophouse', display_name: 'Shophouse', display_order: 50 },
      { id: '6', name: 'land', display_name: 'Land', display_order: 60 },
      { id: '7', name: 'office', display_name: 'Office Space', display_order: 70 },
      { id: '8', name: 'retail', display_name: 'Retail Space', display_order: 80 },
      { id: '9', name: 'warehouse', display_name: 'Warehouse', display_order: 90 },
      { id: '10', name: 'hotel', display_name: 'Hotel', display_order: 100 },
      { id: '11', name: 'resort', display_name: 'Resort', display_order: 110 },
      { id: '12', name: 'factory', display_name: 'Factory', display_order: 120 }
    ];
  }
}