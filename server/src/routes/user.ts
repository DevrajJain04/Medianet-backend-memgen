import { Router } from 'express';
import { z } from 'zod';
import User from '../models/User';
import { AuthRequest, requireAuth } from '../middleware/auth';
import bcrypt from 'bcryptjs';

const router = Router();

router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  const me = await User.findById(req.user!.sub).lean();
  if (!me) return res.status(404).json({ error: 'Not found' });
  return res.json({
    id: me._id.toString(),
    firstName: me.firstName,
    lastName: me.lastName,
    company: me.company,
    email: me.email,
    role: me.role,
  });
});

const updateSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  company: z.string().min(1),
  email: z.string().email(),
});

router.put('/me', requireAuth, async (req: AuthRequest, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const updated = await User.findByIdAndUpdate(req.user!.sub, parsed.data, { new: true }).lean();
  if (!updated) return res.status(404).json({ error: 'Not found' });
  return res.json({
    id: (updated as any)._id.toString(),
    firstName: updated.firstName,
    lastName: updated.lastName,
    company: updated.company,
    email: updated.email,
    role: updated.role,
  });
});

export default router;

// Security: change password
const changePwSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

router.put('/password', requireAuth, async (req: AuthRequest, res) => {
  const parsed = changePwSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { currentPassword, newPassword } = parsed.data;
  const me = await User.findById(req.user!.sub);
  if (!me) return res.status(404).json({ error: 'Not found' });
  const ok = await bcrypt.compare(currentPassword, me.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid current password' });
  me.passwordHash = await bcrypt.hash(newPassword, 10);
  await me.save();
  return res.json({ success: true });
});

// Data: export user data (placeholder for now)
router.get('/export', requireAuth, async (req: AuthRequest, res) => {
  const me = await User.findById(req.user!.sub).lean();
  if (!me) return res.status(404).json({ error: 'Not found' });
  const payload = {
    user: {
      id: me._id.toString(),
      firstName: me.firstName,
      lastName: me.lastName,
      email: me.email,
      company: me.company,
      role: me.role,
      createdAt: me.createdAt,
      updatedAt: me.updatedAt,
    },
    // TODO: include campaigns, reports, etc.
  };
  res.setHeader('Content-Disposition', 'attachment; filename="prachaar-ai-export.json"');
  res.json(payload);
});

// Data: delete account
router.delete('/me', requireAuth, async (req: AuthRequest, res) => {
  const me = await User.findByIdAndDelete(req.user!.sub);
  if (!me) return res.status(404).json({ error: 'Not found' });
  return res.json({ success: true });
});


