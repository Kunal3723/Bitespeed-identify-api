import { Router } from 'express';
import { ContactController } from '../controllers/contactController';

const router = Router();
const contactController = new ContactController();

// Health check endpoint
router.get('/health', (req, res) => contactController.healthCheck(req, res));

// Main identify endpoint
router.post('/identify', (req, res) => contactController.identifyContact(req, res));

export default router;
