import { pool } from './connection';

const createContactsTable = `
  CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(20),
    email VARCHAR(255),
    linked_id INTEGER REFERENCES contacts(id),
    link_precedence VARCHAR(10) CHECK (link_precedence IN ('primary', 'secondary')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
  );
`;

const createIndexes = `
  CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email) WHERE email IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone_number) WHERE phone_number IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_contacts_linked_id ON contacts(linked_id);
  CREATE INDEX IF NOT EXISTS idx_contacts_link_precedence ON contacts(link_precedence);
`;

const createUpdatedAtTrigger = `
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
  END;
  $$ language 'plpgsql';

  DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
  
  CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
`;

export const runMigrations = async (): Promise<void> => {
  try {
    console.log('Running database migrations...');
    
    await pool.query(createContactsTable);
    console.log('✓ Contacts table created');
    
    await pool.query(createIndexes);
    console.log('✓ Indexes created');
    
    await pool.query(createUpdatedAtTrigger);
    console.log('✓ Updated at trigger created');
    
    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

// Don't end the pool here - let the main app manage it
if (require.main === module) {
  runMigrations().then(() => process.exit(0)).catch(() => process.exit(1));
}
