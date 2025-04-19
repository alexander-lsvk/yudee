/*
  # Add Helper Functions for Enum Values

  1. New Functions
    - get_property_categories(): Returns all property category enum values
    - get_property_types(): Returns all property type enum values

  2. Security
    - Functions are accessible to all users
*/

CREATE OR REPLACE FUNCTION get_property_categories()
RETURNS text[] 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN ARRAY(
        SELECT unnest(enum_range(NULL::property_category)::text[])
    );
END;
$$;

CREATE OR REPLACE FUNCTION get_property_types()
RETURNS text[] 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN ARRAY(
        SELECT unnest(enum_range(NULL::property_type)::text[])
    );
END;
$$;

-- Grant execute permission to public
GRANT EXECUTE ON FUNCTION get_property_categories() TO public;
GRANT EXECUTE ON FUNCTION get_property_types() TO public;