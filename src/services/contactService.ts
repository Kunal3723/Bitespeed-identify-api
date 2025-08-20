import { pool } from '../database/connection';
import { ContactRequest, ContactResponse, DatabaseContact } from '../types/contact';

export class ContactService {
  /**
   * Main method to identify or create contacts
   */
  async identifyContact(request: ContactRequest): Promise<ContactResponse> {
    const { email, phoneNumber } = request;

    if (!email && !phoneNumber) {
      throw new Error('Either email or phoneNumber must be provided');
    }

    // Load the connected cluster of contacts by shared email/phone
    const cluster = await this.getContactCluster(email, phoneNumber);

    if (cluster.length === 0) {
      const newContact = await this.createPrimaryContact(email, phoneNumber);
      return this.formatResponse(newContact, []);
    }

    // Determine the oldest primary in the cluster
    const oldestPrimary = this.pickOldestPrimary(cluster);

    // Merge any other primaries in the cluster into the oldest
    await this.mergeOtherPrimariesInto(oldestPrimary.id, cluster);

    // After merging, get the full linked tree from the oldest primary
    const linked = await this.getAllLinkedContacts(oldestPrimary.id);

    // Create a secondary contact only if the request reveals new info
    const requiresNew = this.needsNewContact([oldestPrimary, ...linked], email, phoneNumber);
    if (requiresNew) {
      await this.createSecondaryContact(oldestPrimary.id, email, phoneNumber);
    }

    const refreshed = await this.getAllLinkedContacts(oldestPrimary.id);
    return this.formatResponse(oldestPrimary, refreshed);
  }

  /**
   * Fetch the transitive closure (cluster) of contacts connected by shared email/phone
   */
  private async getContactCluster(email?: string, phoneNumber?: string): Promise<DatabaseContact[]> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (email) {
      params.push(email);
      conditions.push(`email = $${params.length}`);
    }
    if (phoneNumber) {
      params.push(phoneNumber);
      conditions.push(`phone_number = $${params.length}`);
    }

    const seedWhere = conditions.length > 0 ? `(${conditions.join(' OR ')})` : 'FALSE';

    const query = `
      WITH RECURSIVE cluster AS (
        SELECT * FROM contacts WHERE deleted_at IS NULL AND ${seedWhere}
        UNION
        SELECT c.* FROM contacts c
        JOIN cluster cl ON (
          (c.email IS NOT NULL AND cl.email IS NOT NULL AND c.email = cl.email)
          OR (c.phone_number IS NOT NULL AND cl.phone_number IS NOT NULL AND c.phone_number = cl.phone_number)
        )
        WHERE c.deleted_at IS NULL
      )
      SELECT * FROM cluster ORDER BY created_at ASC, id ASC
    `;

    const res = await pool.query(query, params);
    return res.rows as DatabaseContact[];
  }

  /**
   * Pick the oldest primary contact from a cluster
   */
  private pickOldestPrimary(cluster: DatabaseContact[]): DatabaseContact {
    const primaries = cluster.filter(c => c.link_precedence === 'primary');
    if (primaries.length === 0) {
      // Fallback: treat the oldest contact as primary
      return cluster[0];
    }
    // Oldest by created_at then id
    primaries.sort((a, b) => {
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      if (aTime !== bTime) return aTime - bTime;
      return a.id - b.id;
    });
    return primaries[0];
  }

  /**
   * Demote other primaries in the cluster to secondary under the provided primary id
   */
  private async mergeOtherPrimariesInto(primaryId: number, cluster: DatabaseContact[]): Promise<void> {
    const toDemote = cluster
      .filter(c => c.link_precedence === 'primary' && c.id !== primaryId)
      .map(c => c.id);

    if (toDemote.length === 0) return;

    const placeholders = toDemote.map((_, i) => `$${i + 1}`).join(',');
    const updateSql = `
      UPDATE contacts
      SET link_precedence = 'secondary', linked_id = $${toDemote.length + 1}
      WHERE id IN (${placeholders}) AND deleted_at IS NULL
    `;
    await pool.query(updateSql, [...toDemote, primaryId]);
  }

  /**
   * Create a new primary contact
   */
  private async createPrimaryContact(email?: string, phoneNumber?: string): Promise<DatabaseContact> {
    const result = await pool.query(
      `INSERT INTO contacts (phone_number, email, link_precedence) VALUES ($1, $2, 'primary') RETURNING *`,
      [phoneNumber || null, email || null]
    );
    return result.rows[0];
  }

  /**
   * Determine whether the incoming request adds new info to the cluster
   */
  private needsNewContact(existingContacts: DatabaseContact[], email?: string, phoneNumber?: string): boolean {
    if (!email && !phoneNumber) return false;
    if (email && !existingContacts.some(c => c.email === email)) return true;
    if (phoneNumber && !existingContacts.some(c => c.phone_number === phoneNumber)) return true;
    return false;
  }

  /**
   * Create a secondary contact linked to a primary contact
   */
  private async createSecondaryContact(primaryId: number, email?: string, phoneNumber?: string): Promise<void> {
    await pool.query(
      `INSERT INTO contacts (phone_number, email, linked_id, link_precedence) VALUES ($1, $2, $3, 'secondary')`,
      [phoneNumber || null, email || null, primaryId]
    );
  }

  /**
   * Get all contacts linked to a primary contact (tree)
   */
  private async getAllLinkedContacts(primaryId: number): Promise<DatabaseContact[]> {
    const query = `
      WITH RECURSIVE contact_tree AS (
        SELECT * FROM contacts WHERE id = $1
        UNION ALL
        SELECT c.* FROM contacts c
        INNER JOIN contact_tree ct ON c.linked_id = ct.id
        WHERE c.deleted_at IS NULL
      )
      SELECT * FROM contact_tree WHERE id != $1 ORDER BY created_at ASC, id ASC
    `;
    const result = await pool.query(query, [primaryId]);
    return result.rows as DatabaseContact[];
  }

  /**
   * Format the response according to the API specification
   */
  private formatResponse(primaryContact: DatabaseContact, secondaryContacts: DatabaseContact[]): ContactResponse {
    const emails = [primaryContact.email, ...secondaryContacts.map(c => c.email)].filter(Boolean) as string[];
    const phoneNumbers = [primaryContact.phone_number, ...secondaryContacts.map(c => c.phone_number)].filter(Boolean) as string[];
    const secondaryContactIds = secondaryContacts.map(c => c.id);

    return {
      contact: {
        primaryContatctId: primaryContact.id,
        emails: [...new Set(emails)],
        phoneNumbers: [...new Set(phoneNumbers)],
        secondaryContactIds
      }
    };
  }
}
