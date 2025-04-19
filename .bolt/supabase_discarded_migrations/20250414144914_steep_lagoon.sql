/*
  # Add Test Profiles

  1. Changes
    - Insert test profile data into the profiles table
    - Add a variety of profiles with different names and contact details
    - Ensure phone numbers are unique
*/

INSERT INTO profiles (id, phone, name, line_id, updated_at)
VALUES
  ('d7460ddb-3910-4e8c-8cc9-0a9ed8e3a8ef', '+66812345678', 'John Smith', 'johnsmith', now()),
  ('f9b7d527-3a3e-4c51-8e5f-3cada52f23b8', '+66823456789', 'Sarah Johnson', 'sarahj', now()),
  ('a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', '+66834567890', 'Michael Chen', 'mikec', now()),
  ('b2c3d4e5-f6a7-5b8c-9d0e-1f2a3b4c5d6e', '+66845678901', 'Lisa Wong', 'lisaw', now()),
  ('c3d4e5f6-a7b8-6c9d-0e1f-2a3b4c5d6e7f', '+66856789012', 'David Kim', 'davidk', now()),
  ('d4e5f6a7-b8c9-7d0e-1f2a-3b4c5d6e7f8a', '+66867890123', 'Emma Davis', 'emmad', now()),
  ('e5f6a7b8-c9d0-8e1f-2a3b-4c5d6e7f8a9b', '+66878901234', 'Tom Wilson', 'tomw', now()),
  ('f6a7b8c9-d0e1-9f2a-3b4c-5d6e7f8a9b0c', '+66889012345', 'Maria Garcia', 'mariag', now()),
  ('a7b8c9d0-e1f2-0a3b-4c5d-6e7f8a9b0c1d', '+66890123456', 'James Lee', 'jamesl', now()),
  ('b8c9d0e1-f2a3-1b4c-5d6e-7f8a9b0c1d2e', '+66901234567', 'Anna Park', 'annap', now())
ON CONFLICT (id) DO NOTHING;