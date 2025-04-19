/*
  # Add Thai translations for locations

  1. Changes
    - Add display_name_th column to locations table
    - Add Thai translations for areas, sub-areas, and stations
    
  2. Security
    - No changes to security policies
*/

-- Add Thai display name column
ALTER TABLE locations 
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