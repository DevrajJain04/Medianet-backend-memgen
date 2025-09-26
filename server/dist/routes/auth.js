"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const router = (0, express_1.Router)();
const registerSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    company: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    role: zod_1.z.enum(['publisher', 'advertiser']),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    role: zod_1.z.enum(['publisher', 'advertiser']).optional(),
});
function signToken(user) {
    const secret = process.env.JWT_SECRET || 'changeme';
    return jsonwebtoken_1.default.sign({ sub: user.id, role: user.role }, secret, { expiresIn: '7d' });
}
router.post('/register', async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const { firstName, lastName, company, email, password, role } = parsed.data;
    const existing = await User_1.default.findOne({ email });
    if (existing)
        return res.status(409).json({ error: 'Email already registered' });
    const passwordHash = await bcryptjs_1.default.hash(password, 10);
    const user = await User_1.default.create({ firstName, lastName, company, email, passwordHash, role });
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
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const { email, password, role } = parsed.data;
    const user = await User_1.default.findOne({ email });
    if (!user)
        return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!ok)
        return res.status(401).json({ error: 'Invalid credentials' });
    if (role && user.role !== role)
        return res.status(403).json({ error: 'Role mismatch' });
    const token = signToken(user);
    return res.json({
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
exports.default = router;
