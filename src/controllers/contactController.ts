import { Request, Response } from 'express';
import { ContactService } from '../services/contactService';
import { ContactRequest } from '../types/contact';
import { pool } from '../database/connection';

export class ContactController {
  private contactService: ContactService;

  constructor() {
    this.contactService = new ContactService();
  }

  /**
   * Handle the /identify endpoint
   */
  async identifyContact(req: Request, res: Response): Promise<void> {
    try {
      const request: ContactRequest = req.body;
      
      // Validate request
      if (!request.email && !request.phoneNumber) {
        res.status(400).json({
          error: 'Either email or phoneNumber must be provided'
        });
        return;
      }

      // Process the request
      const result = await this.contactService.identifyContact(request);
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in identifyContact:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      // Check if database table exists
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'contacts'
        );
      `);
      
      const tableExists = tableCheck.rows[0].exists;
      
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Bitespeed Contact Identifier',
        database: {
          connected: true,
          tableExists: tableExists
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        service: 'Bitespeed Contact Identifier',
        database: {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }
}
