/*
  # Add Thai translations for all reference tables

  1. Changes
    - Add display_name_th column to all reference tables if not exists
    - Update all existing records with Thai translations
    
  2. Security
    - No changes to security policies
*/

-- Add Thai display name columns if they don't exist
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS display_name_th text;

ALTER TABLE property_amenities 
ADD COLUMN IF NOT EXISTS display_name_th text;

ALTER TABLE property_tags
ADD COLUMN IF NOT EXISTS display_name_th text;

ALTER TABLE property_bedrooms
ADD COLUMN IF NOT EXISTS display_name_th text;

ALTER TABLE property_categories 
ADD COLUMN IF NOT EXISTS display_name_th text;

-- Update locations with Thai translations
UPDATE locations SET display_name_th = CASE name
  -- Areas
  WHEN 'Central Bangkok' THEN 'กรุงเทพกลาง'
  WHEN 'Sukhumvit' THEN 'สุขุมวิท'
  WHEN 'Riverside' THEN 'ริมแม่น้ำ'
  WHEN 'Other Areas' THEN 'พื้นที่อื่นๆ'
  
  -- Sub Areas - Central Bangkok
  WHEN 'Chidlom' THEN 'ชิดลม'
  WHEN 'Ploenchit' THEN 'เพลินจิต'
  WHEN 'Ratchaprasong' THEN 'ราชประสงค์'
  WHEN 'Siam' THEN 'สยาม'
  
  -- Sub Areas - Sukhumvit
  WHEN 'Asoke' THEN 'อโศก'
  WHEN 'Ekkamai' THEN 'เอกมัย'
  WHEN 'Nana' THEN 'นานา'
  WHEN 'On Nut' THEN 'อ่อนนุช'
  WHEN 'Phra Khanong' THEN 'พระโขนง'
  WHEN 'Phrom Phong' THEN 'พร้อมพงษ์'
  WHEN 'Thonglor' THEN 'ทองหล่อ'
  
  -- Sub Areas - Riverside
  WHEN 'Charoen Krung' THEN 'เจริญกรุง'
  WHEN 'Khlong San' THEN 'คลองสาน'
  WHEN 'Ratchawong' THEN 'ราชวงศ์'
  
  -- Sub Areas - Other Areas
  WHEN 'Ari' THEN 'อารีย์'
  WHEN 'Lat Phrao' THEN 'ลาดพร้าว'
  WHEN 'Sathorn' THEN 'สาทร'
  WHEN 'Silom' THEN 'สีลม'
  
  -- BTS Stations
  WHEN 'Asok' THEN 'อโศก'
  WHEN 'Ari' THEN 'อารีย์'
  WHEN 'Bang Na' THEN 'บางนา'
  WHEN 'Chidlom' THEN 'ชิดลม'
  WHEN 'Chong Nonsi' THEN 'ช่องนนทรี'
  WHEN 'Ekkamai' THEN 'เอกมัย'
  WHEN 'Mo Chit' THEN 'หมอชิต'
  WHEN 'Nana' THEN 'นานา'
  WHEN 'On Nut' THEN 'อ่อนนุช'
  WHEN 'Phloen Chit' THEN 'เพลินจิต'
  WHEN 'Phrom Phong' THEN 'พร้อมพงษ์'
  WHEN 'Sala Daeng' THEN 'ศาลาแดง'
  WHEN 'Samrong' THEN 'สำโรง'
  WHEN 'Saphan Taksin' THEN 'สะพานตากสิน'
  WHEN 'Siam' THEN 'สยาม'
  WHEN 'Si Lom' THEN 'สีลม'
  WHEN 'Sukhumvit' THEN 'สุขุมวิท'
  WHEN 'Thong Lo' THEN 'ทองหล่อ'
END;

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