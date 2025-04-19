/*
  # Add Thai translations for property categories

  1. Changes
    - Add display_name_th column to property_categories table
    - Add Thai translations for all categories
*/

-- Add Thai display name column
ALTER TABLE property_categories 
ADD COLUMN IF NOT EXISTS display_name_th text;

-- Update categories with Thai translations
UPDATE property_categories SET display_name_th = CASE name
  WHEN 'condo' THEN 'คอนโดมิเนียม'
  WHEN 'apartment' THEN 'อพาร์ทเม้นท์'
  WHEN 'house' THEN 'บ้านเดี่ยว'
  WHEN 'townhouse' THEN 'ทาวน์เฮาส์'
  WHEN 'shophouse' THEN 'อาคารพาณิชย์'
  WHEN 'land' THEN 'ที่ดิน'
  WHEN 'office' THEN 'สำนักงาน'
  WHEN 'retail' THEN 'พื้นที่ค้าปลีก'
  WHEN 'warehouse' THEN 'โกดัง'
  WHEN 'hotel' THEN 'โรงแรม'
  WHEN 'resort' THEN 'รีสอร์ท'
  WHEN 'factory' THEN 'โรงงาน'
END;