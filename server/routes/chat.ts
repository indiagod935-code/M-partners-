import { Router, Request, Response } from 'express';
import { db, ChatMessage, ContentReport } from '../db.ts';
import { authenticateUser } from './auth.ts';

const router = Router();

// In-memory rate limiting map: userId -> lastMessageTimestamp[]
const messageTimestamps = new Map<string, number[]>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const windowMs = 10000; // 10 seconds
  const maxMessages = 5; // max 5 messages in 10s

  const timestamps = messageTimestamps.get(userId) || [];
  const recent = timestamps.filter(t => now - t < windowMs);
  if (recent.length >= maxMessages) {
    return false;
  }
  recent.push(now);
  messageTimestamps.set(userId, recent);
  return true;
}

// GET /messages/:orderId
router.get('/messages/:orderId', (req: Request, res: Response) => {
  const user = authenticateUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { orderId } = req.params;
  const order = db.get('orders').find(o => o.id === orderId);

  // Participant authorization check: customer must be customerId, runner must be runnerId, or admin
  if (user.role === 'customer' && order && order.customerId !== user.id) {
    return res.status(403).json({ error: 'Access denied: You can only view chat for your own orders.' });
  }
  if (user.role === 'runner' && order && order.runnerId !== user.id) {
    return res.status(403).json({ error: 'Access denied: You can only view chat for orders assigned to you.' });
  }

  const messages = db.get('messages')
    .filter(m => m.orderId === orderId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return res.json({ messages });
});

// POST /send
router.post('/send', (req: Request, res: Response) => {
  const user = authenticateUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { orderId, text, attachmentUrl, attachmentType } = req.body;

  if (!orderId || (!text && !attachmentUrl)) {
    return res.status(400).json({ error: 'Message text or attachment is required' });
  }

  // Rate limiting check
  if (!checkRateLimit(user.id)) {
    return res.status(429).json({ error: 'You are sending messages too quickly. Please wait a few seconds before trying again.' });
  }

  const orders = db.get('orders');
  const order = orders.find(o => o.id === orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Strict participant authorization
  if (user.role === 'customer' && order.customerId !== user.id) {
    return res.status(403).json({ error: 'Access denied: You can only chat in your own order thread.' });
  }
  if (user.role === 'runner' && order.runnerId !== user.id) {
    return res.status(403).json({ error: 'Access denied: You can only chat in orders assigned to you.' });
  }

  // Text moderation check
  if (text) {
    const moderation = db.moderateText(text);
    if (!moderation.allowed) {
      db.addModerationLog(user.id, user.name, text, moderation.flaggedKeywords || [], 'blocked');
      db.addAuditLog(user.id, user.name, user.role, 'MESSAGE_BLOCKED', 'moderation', orderId, `Blocked message violating guidelines: "${text.substring(0, 40)}..."`);
      return res.status(400).json({ 
        error: moderation.reason || 'Your message could not be sent because it violates the community guidelines.' 
      });
    }
  }

  // Validate attachment if provided
  if (attachmentUrl) {
    const validTypes = ['image', 'receipt', 'payment_qr'];
    if (attachmentType && !validTypes.includes(attachmentType)) {
      return res.status(400).json({ error: 'Invalid attachment type. Supported: image, receipt, payment_qr' });
    }
  }

  const messages = db.get('messages');
  const newMsg: ChatMessage = {
    id: `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    orderId,
    senderId: user.id,
    senderName: user.name,
    senderRole: user.role,
    text: text ? text.trim() : '',
    attachmentUrl,
    attachmentType: attachmentType || 'image',
    createdAt: new Date().toISOString(),
  };

  messages.push(newMsg);
  db.set('messages', messages);

  // Dispatch in-app notification to receiver
  const receiverId = user.role === 'customer' ? order.runnerId : order.customerId;
  if (receiverId) {
    db.addNotification(
      receiverId,
      'new_message',
      `New Message from ${user.name}`,
      `${user.name}: ${text ? (text.length > 50 ? text.substring(0, 50) + '...' : text) : 'Sent an attachment'} (Order #${order.orderNumber})`,
      '/chat'
    );
  }

  return res.status(201).json({ message: newMsg });
});

// POST /report - Report an inappropriate message
router.post('/report', (req: Request, res: Response) => {
  const user = authenticateUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { messageId, reason } = req.body;
  if (!messageId || !reason) {
    return res.status(400).json({ error: 'Message ID and reason are required' });
  }

  const messages = db.get('messages');
  const msg = messages.find(m => m.id === messageId);
  if (!msg) {
    return res.status(404).json({ error: 'Message not found' });
  }

  msg.isReported = true;
  msg.reportCount = (msg.reportCount || 0) + 1;
  db.set('messages', messages);

  const reports = db.get('contentReports');
  const newReport: ContentReport = {
    id: `rep_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    reporterId: user.id,
    reporterName: user.name,
    reportedUserId: msg.senderId,
    reportedUserName: msg.senderName,
    messageId: msg.id,
    orderId: msg.orderId,
    messageText: msg.text,
    reason,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  reports.unshift(newReport);
  db.set('contentReports', reports);

  db.addAuditLog(user.id, user.name, user.role, 'REPORT_MESSAGE', 'moderation', msg.id, `Reported message by ${msg.senderName}. Reason: ${reason}`);

  return res.json({ 
    message: 'Thank you for reporting. Our moderation team has been notified and will review the message.',
    reportId: newReport.id 
  });
});

export default router;
