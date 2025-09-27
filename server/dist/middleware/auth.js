"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function requireAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token)
        return res.status(401).json({ error: 'Missing token' });
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'changeme');
        req.user = { sub: payload.sub, role: payload.role };
        return next();
    }
    catch {
        return res.status(401).json({ error: 'Invalid token' });
    }
}
