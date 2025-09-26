"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const User_1 = __importDefault(require("../models/User"));
const auth_1 = require("../middleware/auth");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const router = (0, express_1.Router)();
router.get('/me', auth_1.requireAuth, async (req, res) => {
    const me = await User_1.default.findById(req.user.sub).lean();
    if (!me)
        return res.status(404).json({ error: 'Not found' });
    return res.json({
        id: me._id.toString(),
        firstName: me.firstName,
        lastName: me.lastName,
        company: me.company,
        email: me.email,
        role: me.role,
    });
});
const updateSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    company: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
});
router.put('/me', auth_1.requireAuth, async (req, res) => {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const updated = await User_1.default.findByIdAndUpdate(req.user.sub, parsed.data, { new: true }).lean();
    if (!updated)
        return res.status(404).json({ error: 'Not found' });
    return res.json({
        id: updated._id.toString(),
        firstName: updated.firstName,
        lastName: updated.lastName,
        company: updated.company,
        email: updated.email,
        role: updated.role,
    });
});
exports.default = router;
// Security: change password
const changePwSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(6),
    newPassword: zod_1.z.string().min(6),
});
router.put('/password', auth_1.requireAuth, async (req, res) => {
    const parsed = changePwSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const { currentPassword, newPassword } = parsed.data;
    const me = await User_1.default.findById(req.user.sub);
    if (!me)
        return res.status(404).json({ error: 'Not found' });
    const ok = await bcryptjs_1.default.compare(currentPassword, me.passwordHash);
    if (!ok)
        return res.status(401).json({ error: 'Invalid current password' });
    me.passwordHash = await bcryptjs_1.default.hash(newPassword, 10);
    await me.save();
    return res.json({ success: true });
});
// Data: export user data (placeholder for now)
router.get('/export', auth_1.requireAuth, async (req, res) => {
    const me = await User_1.default.findById(req.user.sub).lean();
    if (!me)
        return res.status(404).json({ error: 'Not found' });
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
router.delete('/me', auth_1.requireAuth, async (req, res) => {
    const me = await User_1.default.findByIdAndDelete(req.user.sub);
    if (!me)
        return res.status(404).json({ error: 'Not found' });
    return res.json({ success: true });
});
