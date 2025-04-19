/*
  # Database Checkpoint V1

  This migration serves as a checkpoint for the initial database setup.
  No changes are made - this is just a marker for version control.

  Current Schema:
  1. Authentication & Profiles
    - User authentication via phone number
    - Profile management with name, phone, LINE ID
  
  2. Core Tables
    - profiles: User profiles
    - properties: Property listings and client requests
    - amenities: Available property amenities
    - tags: Property tags/features
    - locations: Areas and sub-areas
  
  3. Junction Tables
    - property_images: Property photos
    - property_amenities: Property-amenity relationships
    - property_tags: Property-tag relationships
    - property_locations: Property-location relationships

  4. Security
    - Row Level Security (RLS) enabled on all tables
    - Proper policies for CRUD operations
    - Authentication and authorization flows
*/

-- This is a checkpoint migration - no changes needed
SELECT 1;