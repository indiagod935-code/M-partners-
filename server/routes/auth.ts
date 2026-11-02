import { Router, Request, Response } from 'express';
import { db, hashPassword, User, RunnerProfile, Wallet } from '../db.ts';

const router = Router();

// Helper to get authorization token or header
export function authenticateUser(req: Request): User | null {
  const authHeader = req.headers.authorization;
  const userId = req.headers['x-user-id'] as string;

  if (userId) {
    const user = db.get('users').find(u => u.id === userId);
    if (user) return user;
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const user = db.get('users').find(u => u.id === token);
    if (user) return user;
  }

  return null;
}

// Login
router.post('/login', (req: Request, res: Response) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const users = db.get('users');
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials. User not found.' });
  }

  const hashedPassword = hashPassword(password);
  if (user.passwordHash !== hashedPassword) {
    return res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
  }

  if (role && user.role !== role) {
    return res.status(403).json({ error: `Account exists but role is ${user.role}, not ${role}.` });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'This account has been suspended by administration. Please contact support.' });
  }

  return res.json({
    token: user.id,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      email: user.email,
      phone: user.phone,
      locality: user.locality,
      status: user.status,
      assignedRunnerId: user.assignedRunnerId,
      serviceAreaId: user.serviceAreaId,
    },
  });
});

// Switch Demo Account
router.post('/switch-demo', (req: Request, res: Response) => {
  const { role } = req.body;
  const users = db.get('users');
  let targetUser: User | undefined;

  if (role === 'admin') {
    targetUser = users.find(u => u.role === 'admin');
  } else if (role === 'runner') {
    targetUser = users.find(u => u.role === 'runner' && u.status === 'active');
  } else {
    targetUser = users.find(u => u.role === 'customer');
  }

  if (!targetUser) {
    return res.status(404).json({ error: 'Demo user for role not found' });
  }

  return res.json({
    token: targetUser.id,
    user: {
      id: targetUser.id,
      name: targetUser.name,
      role: targetUser.role,
      email: targetUser.email,
      phone: targetUser.phone,
      locality: targetUser.locality,
      status: targetUser.status,
      assignedRunnerId: targetUser.assignedRunnerId,
      serviceAreaId: targetUser.serviceAreaId,
    },
  });
});

// Customer Registration
router.post('/register/customer', (req: Request, res: Response) => {
  const { name, phone, email, password, address, building, locality, landmark, language, serviceAreaId } = req.body;

  if (!name || !phone || !password || !address || !locality) {
    return res.status(400).json({ error: 'Name, phone, password, address, and locality are required fields.' });
  }

  const users = db.get('users');
  const existingPhone = users.find(u => u.phone === phone);
  if (existingPhone) {
    return res.status(400).json({ error: 'An account with this phone number already exists.' });
  }

  const newId = `usr_cust_${Date.now()}`;
  const newUser: User = {
    id: newId,
    role: 'customer',
    name,
    phone,
    email: email || `${phone.replace(/\D/g, '')}@customer.mpartner.com`,
    passwordHash: hashPassword(password),
    address,
    building: building || '',
    locality,
    landmark: landmark || '',
    language: language || 'English',
    status: 'active',
    serviceAreaId: serviceAreaId || 'area_1',
    createdAt: new Date().toISOString(),
  };

  // Find a runner in that service area or assign default runner if available
  const runnerProfiles = db.get('runnerProfiles');
  const availableRunner = runnerProfiles.find(r => r.isApproved && r.isAvailable);
  if (availableRunner) {
    newUser.assignedRunnerId = availableRunner.userId;
  }

  users.push(newUser);
  db.set('users', users);

  // Initialize customer wallet with 0 balance
  const wallets = db.get('wallets');
  const newWallet: Wallet = {
    id: `wal_${Date.now()}`,
    userId: newId,
    balance: 0,
    updatedAt: new Date().toISOString(),
  };
  wallets.push(newWallet);
  db.set('wallets', wallets);

  db.addAuditLog(newId, name, 'customer', 'CUSTOMER_REGISTER', 'customer', newId, `Customer registered: ${name} (${phone})`);

  return res.status(201).json({
    token: newId,
    user: {
      id: newUser.id,
      name: newUser.name,
      role: newUser.role,
      email: newUser.email,
      phone: newUser.phone,
      locality: newUser.locality,
      status: newUser.status,
      assignedRunnerId: newUser.assignedRunnerId,
      serviceAreaId: newUser.serviceAreaId,
    },
  });
});

// Runner Registration
router.post('/register/runner', (req: Request, res: Response) => {
  const { name, phone, email, password, address, serviceAreaId, languages, vehicleType } = req.body;

  if (!name || !phone || !password || !serviceAreaId) {
    return res.status(400).json({ error: 'Name, phone, password, and service area are required.' });
  }

  const users = db.get('users');
  const existingPhone = users.find(u => u.phone === phone);
  if (existingPhone) {
    return res.status(400).json({ error: 'An account with this phone number already exists.' });
  }

  const newUserId = `usr_run_${Date.now()}`;
  const newUser: User = {
    id: newUserId,
    role: 'runner',
    name,
    phone,
    email: email || `${phone.replace(/\D/g, '')}@runner.mpartner.com`,
    passwordHash: hashPassword(password),
    address: address || '',
    locality: '',
    language: Array.isArray(languages) ? languages.join(', ') : (languages || 'English'),
    status: 'pending', // Pending Admin approval
    serviceAreaId,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  db.set('users', users);

  const runnerProfiles = db.get('runnerProfiles');
  const newProfile: RunnerProfile = {
    id: `prof_${Date.now()}`,
    userId: newUserId,
    serviceAreaId,
    languages: Array.isArray(languages) ? languages : ['English'],
    isApproved: false,
    isAvailable: false,
    activeOrderCount: 0,
    rating: 5.0,
    vehicleType: vehicleType || 'Two Wheeler',
  };
  runnerProfiles.push(newProfile);
  db.set('runnerProfiles', runnerProfiles);

  db.addAuditLog(newUserId, name, 'runner', 'RUNNER_REGISTER', 'runner', newUserId, `Runner application submitted by ${name}. Pending Admin approval.`);

  return res.status(201).json({
    message: 'Runner registration submitted successfully. Your account is pending verification by M-PARTNER Admin.',
    token: newUserId,
    user: {
      id: newUser.id,
      name: newUser.name,
      role: newUser.role,
      status: newUser.status,
    },
  });
});

// Get current user details
router.get('/me', (req: Request, res: Response) => {
  const user = authenticateUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  let additionalData: any = {};

  if (user.role === 'customer') {
    const wallets = db.get('wallets');
    const wallet = wallets.find(w => w.userId === user.id) || { balance: 0 };
    const subscriptions = db.get('userSubscriptions');
    const sub = subscriptions.find(s => s.userId === user.id && s.status === 'active');
    const runners = db.get('users');
    const assignedRunner = user.assignedRunnerId ? runners.find(u => u.id === user.assignedRunnerId) : null;
    const runnerProfiles = db.get('runnerProfiles');
    const runnerProf = assignedRunner ? runnerProfiles.find(p => p.userId === assignedRunner.id) : null;

    additionalData = {
      walletBalance: wallet.balance,
      activeSubscription: sub || null,
      assignedRunner: assignedRunner ? {
        id: assignedRunner.id,
        name: assignedRunner.name,
        phone: assignedRunner.phone,
        rating: runnerProf?.rating || 4.9,
        isAvailable: runnerProf?.isAvailable ?? true,
        vehicleType: runnerProf?.vehicleType || 'Two Wheeler',
        languages: runnerProf?.languages || ['English'],
      } : null,
    };
  } else if (user.role === 'runner') {
    const profiles = db.get('runnerProfiles');
    const profile = profiles.find(p => p.userId === user.id);
    additionalData = {
      profile,
    };
  }

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      email: user.email,
      phone: user.phone,
      address: user.address,
      building: user.building,
      locality: user.locality,
      landmark: user.landmark,
      language: user.language,
      status: user.status,
      assignedRunnerId: user.assignedRunnerId,
      serviceAreaId: user.serviceAreaId,
      ...additionalData,
    },
  });
});

export default router;
