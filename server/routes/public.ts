import { Router, Request, Response } from 'express';
import { db, SupportTicket } from '../db.ts';

const router = Router();

// GET /info
router.get('/info', (_req: Request, res: Response) => {
  const settings = db.get('settings');
  const areas = db.get('serviceAreas').filter(a => a.isActive);
  const plans = db.get('subscriptionPlans').filter(p => p.isActive);

  return res.json({
    settings,
    serviceAreas: areas,
    subscriptionPlans: plans,
  });
});

// POST /contact-support
router.post('/contact-support', (req: Request, res: Response) => {
  const { name, email, phone, category, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }

  const tickets = db.get('supportTickets');
  const newTicket: SupportTicket = {
    id: `tkt_pub_${Date.now()}`,
    userId: 'guest',
    userName: name,
    userEmail: email,
    userRole: 'guest',
    category: category || 'general',
    subject: subject || 'Website Inquiry',
    message: `${message}\n\nPhone: ${phone || 'Not provided'}`,
    status: 'open',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  tickets.unshift(newTicket);
  db.set('supportTickets', tickets);

  return res.status(201).json({
    message: 'Thank you for reaching out to M-PARTNER. Our operations team will respond to your inquiry.',
    ticketId: newTicket.id,
  });
});

// GET /run-tests - Run automated business rule verification
router.get('/run-tests', async (_req: Request, res: Response) => {
  const { runAutomatedBusinessRuleTests } = await import('../tests/businessRules.ts');
  const results = runAutomatedBusinessRuleTests();
  return res.json(results);
});

export default router;
