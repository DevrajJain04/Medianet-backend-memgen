"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
// Simple proxy endpoint that just checks if website allows iframe embedding
router.post('/check', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        // Validate URL
        let targetUrl;
        try {
            targetUrl = new URL(url);
        }
        catch {
            return res.status(400).json({ error: 'Invalid URL format' });
        }
        // Only allow HTTP/HTTPS
        if (!['http:', 'https:'].includes(targetUrl.protocol)) {
            return res.status(400).json({ error: 'Only HTTP/HTTPS URLs are allowed' });
        }
        // Simple check - just return the URL if it's valid
        // The frontend will try to load it in an iframe
        res.json({
            success: true,
            url: url,
            canEmbed: true, // We'll let the iframe handle the actual embedding check
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('URL check error:', error);
        res.status(500).json({
            error: 'Failed to validate URL',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
