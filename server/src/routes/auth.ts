import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { IUser, UserRole } from '../models/User';

const router = Router();

const registerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  company: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['publisher', 'advertiser']),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['publisher', 'advertiser']).optional(),
});

function signToken(user: IUser) {
  const secret = process.env.JWT_SECRET || 'changeme';
  return jwt.sign({ sub: user.id, role: user.role }, secret, { expiresIn: '7d' });
}

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { firstName, lastName, company, email, password, role } = parsed.data;

  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ firstName, lastName, company, email, passwordHash, role });
  const token = signToken(user);
  return res.status(201).json({
    token,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      company: user.company,
      email: user.email,
      role: user.role,
    },
  });
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { email, password, role } = parsed.data;

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  if (role && user.role !== role) return res.status(403).json({ error: 'Role mismatch' });

  const token = signToken(user);
  return res.json({
    token,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      company: user.company,
      email: user.email,
      role: user.role as UserRole,
    },
  });
});

export default router;


