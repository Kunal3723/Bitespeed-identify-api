-- Reset and seed database for tests
BEGIN;
TRUNCATE TABLE contacts RESTART IDENTITY CASCADE;

-- Base seed matching a.md examples
INSERT INTO contacts (phone_number, email, link_precedence) VALUES
  ('123456', 'lorraine@hillvalley.edu', 'primary'),
  ('919191', 'george@hillvalley.edu', 'primary'),
  ('717171', 'biffsucks@hillvalley.edu', 'primary');
COMMIT;
