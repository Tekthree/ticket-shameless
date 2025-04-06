-- Ultra simple script to make a user an admin
-- Replace the email with your actual email

-- First, let's find all existing users for reference
SELECT id, email FROM auth.users;

-- Then, let's see the available roles
SELECT id, name FROM roles;

-- Now add the admin role manually
INSERT INTO user_roles (user_id, role_id)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'your.email@example.com'), -- REPLACE WITH YOUR EMAIL
  (SELECT id FROM roles WHERE name = 'admin')
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Update primary role in profiles
UPDATE profiles 
SET primary_role_id = (SELECT id FROM roles WHERE name = 'admin')
WHERE id = (SELECT id FROM auth.users WHERE email = 'your.email@example.com'); -- REPLACE WITH YOUR EMAIL

-- Verify the results
SELECT 
  au.email, 
  r.name AS role_name
FROM 
  user_roles ur
JOIN 
  auth.users au ON ur.user_id = au.id
JOIN 
  roles r ON ur.role_id = r.id
WHERE 
  au.email = 'your.email@example.com'; -- REPLACE WITH YOUR EMAIL
