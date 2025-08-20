import { Request, Response } from 'express';
import { ContactService } from '../services/contactService';
import { ContactRequest } from '../types/contact';

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
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Bitespeed Contact Identifier'
    });
  }
}
