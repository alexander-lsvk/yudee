/*
  # Add localized values to reference tables

  1. Changes
    - Add display_name_th column to property_amenities
    - Add display_name_th column to property_tags
    - Add display_name_th column to property_bedrooms
    - Update existing records with Thai translations
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add Thai display name columns
ALTER TABLE property_amenities 
ADD COLUMN IF NOT EXISTS display_name_th text;

ALTER TABLE property_tags
ADD COLUMN IF NOT EXISTS display_name_th text;

ALTER TABLE property_bedrooms
ADD COLUMN IF NOT EXISTS display_name_th text;

-- Update amenities with Thai translations
UPDATE property_amenities SET display_name_th = CASE name
  WHEN 'Swimming Pool' THEN 'สระว่ายน้ำ'
  WHEN 'Gym' THEN 'ฟิตเนส'
  WHEN 'Security' THEN 'ระบบรักษาความปลอดภัย'
  WHEN 'Parking' THEN 'ที่จอดรถ'
  WHEN 'Garden' THEN 'สวน'
  WHEN 'Pet-friendly' THEN 'อนุญาตให้เลี้ยงสัตว์'
  WHEN 'Furnished' THEN 'เฟอร์นิเจอร์พร้อม'
  WHEN 'Balcony' THEN 'ระเบียง'
  WHEN 'River View' THEN 'วิวแม่น้ำ'
  WHEN 'City View' THEN 'วิวเมือง'
  WHEN 'Near BTS' THEN 'ใกล้ BTS'
END;

-- Update tags with Thai translations
UPDATE property_tags SET display_name_th = CASE name
  WHEN 'Luxury' THEN 'หรูหรา'
  WHEN 'Renovated' THEN 'ปรับปรุงใหม่'
  WHEN 'Quiet Area' THEN 'พื้นที่เงียบสงบ'
  WHEN 'High Floor' THEN 'ชั้นสูง'
  WHEN 'Corner Unit' THEN 'ห้องมุม'
  WHEN 'Near School' THEN 'ใกล้โรงเรียน'
  WHEN 'Smart Home' THEN 'บ้านอัจฉริยะ'
END;

-- Update bedrooms with Thai translations
UPDATE property_bedrooms SET display_name_th = CASE name
  WHEN 'studio' THEN 'สตูดิโอ'
  WHEN '1-bedroom' THEN '1 ห้องนอน'
  WHEN '2-bedroom' THEN '2 ห้องนอน'
  WHEN '3-bedroom' THEN '3 ห้องนอน'
  WHEN '4-bedroom+' THEN '4+ ห้องนอน'
END;