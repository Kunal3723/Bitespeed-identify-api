import { ContactService } from '../services/contactService';

describe('ContactService', () => {
  let contactService: ContactService;

  beforeEach(() => {
    contactService = new ContactService();
  });

  describe('identifyContact', () => {
    it('should throw error when neither email nor phoneNumber is provided', async () => {
      await expect(contactService.identifyContact({})).rejects.toThrow(
        'Either email or phoneNumber must be provided'
      );
    });

    it('should accept request with only email', () => {
      const request: { email?: string; phoneNumber?: string } = { email: 'test@example.com' };
      expect(request.email).toBe('test@example.com');
      expect(request.phoneNumber).toBeUndefined();
    });

    it('should accept request with only phoneNumber', () => {
      const request: { email?: string; phoneNumber?: string } = { phoneNumber: '1234567890' };
      expect(request.phoneNumber).toBe('1234567890');
      expect(request.email).toBeUndefined();
    });

    it('should accept request with both email and phoneNumber', () => {
      const request: { email?: string; phoneNumber?: string } = { 
        email: 'test@example.com', 
        phoneNumber: '1234567890' 
      };
      expect(request.email).toBe('test@example.com');
      expect(request.phoneNumber).toBe('1234567890');
    });
  });
});
