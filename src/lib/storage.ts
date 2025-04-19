import { supabase } from './supabase';

export async function uploadAvatar(userId: string, file: File) {
  try {
    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed');
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      throw new Error('File size must be less than 5MB');
    }

    // Generate a unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Math.random().toString(36).substring(2)}.${fileExt}`;

    // Delete existing avatar files for this user
    const { data: existingFiles } = await supabase.storage
      .from('avatars')
      .list(userId);

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map(f => `${userId}/${f.name}`);
      
      await supabase.storage
        .from('avatars')
        .remove(filesToDelete);
    }

    // Upload the new file
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // Add cache-busting query param
    const timestamp = Date.now();
    const urlWithCache = `${publicUrl}?t=${timestamp}`;

    return urlWithCache;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
}

export async function deleteAvatar(url: string) {
  try {
    // Remove any query parameters from the URL
    const baseUrl = url.split('?')[0];
    
    // Extract the path from the URL
    const urlParts = baseUrl.split('/');
    const bucketName = urlParts[urlParts.length - 2];
    const fileName = urlParts[urlParts.length - 1];
    const path = `${bucketName}/${fileName}`;

    if (!path) throw new Error('Invalid avatar URL');

    const { error } = await supabase.storage
      .from('avatars')
      .remove([path]);

    if (error) {
      console.error('Error deleting avatar:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error deleting avatar:', error);
    throw error;
  }
}

export async function uploadPropertyImage(file: File) {
  try {
    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed');
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      throw new Error('File size must be less than 5MB');
    }

    // Generate a unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `uploads/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from('property-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('property-images')
      .getPublicUrl(fileName);

    // Add cache-busting query param
    const timestamp = Date.now();
    const urlWithCache = `${publicUrl}?t=${timestamp}`;

    return urlWithCache;
  } catch (error) {
    console.error('Error uploading property image:', error);
    throw error;
  }
}

export async function deletePropertyImage(url: string) {
  try {
    // Remove any query parameters from the URL
    const baseUrl = url.split('?')[0];
    
    // Extract the path from the URL
    const urlParts = baseUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const path = `uploads/${fileName}`;

    if (!path) throw new Error('Invalid image URL');

    const { error } = await supabase.storage
      .from('property-images')
      .remove([path]);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting property image:', error);
    throw error;
  }
}