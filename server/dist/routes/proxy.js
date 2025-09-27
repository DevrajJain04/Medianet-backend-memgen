"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const puppeteer_1 = __importDefault(require("puppeteer"));
const router = express_1.default.Router();
// Screenshot endpoint for websites that block iframe embedding
router.post('/screenshot', async (req, res) => {
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
        // Fetch the website content
        const response = await axios_1.default.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            },
            timeout: 10000,
            maxRedirects: 5,
        });
        const $ = cheerio.load(response.data);
        // Extract key information
        const title = $('title').text() || 'Website Preview';
        const description = $('meta[name="description"]').attr('content') || '';
        // Get all images and make them absolute URLs
        const images = [];
        $('img').each((_, el) => {
            const src = $(el).attr('src');
            if (src) {
                if (src.startsWith('http')) {
                    images.push(src);
                }
                else if (src.startsWith('//')) {
                    images.push(`https:${src}`);
                }
                else if (src.startsWith('/')) {
                    images.push(`${targetUrl.origin}${src}`);
                }
                else {
                    images.push(`${targetUrl.origin}/${src}`);
                }
            }
        });
        // Get main content areas
        const contentAreas = [
            $('main').html(),
            $('article').html(),
            $('.content').html(),
            $('.main-content').html(),
            $('body').html()
        ].filter(Boolean);
        res.json({
            success: true,
            url: url,
            title: title,
            description: description,
            images: images.slice(0, 10), // Limit to first 10 images
            content: contentAreas[0] || '',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Screenshot fetch error:', error);
        if (axios_1.default.isAxiosError(error)) {
            if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                return res.status(404).json({ error: 'Website not found or unreachable' });
            }
            else if (error.code === 'ETIMEDOUT') {
                return res.status(408).json({ error: 'Request timeout - website took too long to respond' });
            }
        }
        res.status(500).json({
            error: 'Failed to fetch website content',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Enhanced preview endpoint with full HTML/CSS loading using Puppeteer
router.post('/preview', async (req, res) => {
    let browser;
    let targetUrl;
    let url;
    try {
        url = req.body.url;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        // Validate URL
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
        // Launch Puppeteer browser with enhanced bot detection evasion
        browser = await puppeteer_1.default.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-blink-features=AutomationControlled',
                '--disable-features=VizDisplayCompositor',
                '--disable-web-security',
                '--disable-features=TranslateUI',
                '--disable-ipc-flooding-protection',
                '--disable-renderer-backgrounding',
                '--disable-backgrounding-occluded-windows',
                '--disable-client-side-phishing-detection',
                '--disable-sync',
                '--disable-default-apps',
                '--disable-extensions',
                '--hide-scrollbars',
                '--mute-audio',
                '--no-default-browser-check',
                '--no-pings',
                '--disable-logging',
                '--disable-permissions-api',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding'
            ]
        });
        const page = await browser.newPage();
        // Enhanced bot detection evasion
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5],
            });
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en'],
            });
            window.chrome = {
                runtime: {},
            };
        });
        // Set realistic headers and viewport
        await page.setViewport({ width: 1366, height: 768 });
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        // Set additional headers
        await page.setExtraHTTPHeaders({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0'
        });
        // Navigate to the page with retry mechanism
        let navigationSuccess = false;
        let attempts = 0;
        const maxAttempts = 3;
        while (!navigationSuccess && attempts < maxAttempts) {
            try {
                attempts++;
                console.log(`Attempt ${attempts} to load: ${url}`);
                await page.goto(url, {
                    waitUntil: 'networkidle2',
                    timeout: 30000
                });
                navigationSuccess = true;
                console.log(`Successfully loaded: ${url}`);
            }
            catch (error) {
                console.log(`Attempt ${attempts} failed:`, error);
                if (attempts < maxAttempts) {
                    // Wait before retry
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    // Try with different wait strategy
                    try {
                        await page.goto(url, {
                            waitUntil: 'domcontentloaded',
                            timeout: 20000
                        });
                        navigationSuccess = true;
                        console.log(`Successfully loaded with domcontentloaded: ${url}`);
                    }
                    catch (retryError) {
                        console.log(`Retry with domcontentloaded failed:`, retryError);
                    }
                }
            }
        }
        if (!navigationSuccess) {
            throw new Error(`Failed to load website after ${maxAttempts} attempts`);
        }
        // Wait for content to load
        await new Promise(resolve => setTimeout(resolve, 3000));
        // Get the full HTML content
        const htmlContent = await page.content();
        // Extract all CSS styles (inline and external)
        const styles = await page.evaluate(() => {
            const styleSheets = [];
            // Get all style elements
            const styleElements = document.querySelectorAll('style');
            styleElements.forEach(style => {
                if (style.textContent) {
                    styleSheets.push({
                        type: 'inline',
                        content: style.textContent
                    });
                }
            });
            // Get all link elements with stylesheets
            const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
            linkElements.forEach(link => {
                const href = link.href;
                if (href) {
                    styleSheets.push({
                        type: 'external',
                        href: href
                    });
                }
            });
            return styleSheets;
        });
        // Get page metadata
        const metadata = await page.evaluate(() => {
            return {
                title: document.title,
                description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
                viewport: document.querySelector('meta[name="viewport"]')?.getAttribute('content') || '',
                canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || ''
            };
        });
        // Get all images with their positions
        const images = await page.evaluate(() => {
            const imgElements = document.querySelectorAll('img');
            return Array.from(imgElements).map((img, index) => {
                const rect = img.getBoundingClientRect();
                return {
                    src: img.src,
                    alt: img.alt,
                    width: rect.width,
                    height: rect.height,
                    x: rect.left,
                    y: rect.top,
                    index
                };
            });
        });
        // Get all text content areas for potential carousel placement
        const contentAreas = await page.evaluate(() => {
            const selectors = [
                'main',
                'article',
                '.content',
                '.main-content',
                '.post-content',
                '.entry-content',
                '[role="main"]'
            ];
            const areas = [];
            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach((el, index) => {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 200 && rect.height > 100) { // Only include substantial content areas
                        areas.push({
                            selector: selector,
                            index: index,
                            x: rect.left,
                            y: rect.top,
                            width: rect.width,
                            height: rect.height,
                            tagName: el.tagName,
                            className: el.className,
                            id: el.id
                        });
                    }
                });
            });
            return areas;
        });
        // Take a screenshot for fallback
        const screenshot = await page.screenshot({
            type: 'png',
            fullPage: true,
            encoding: 'base64'
        });
        await browser.close();
        res.json({
            success: true,
            url: url,
            html: htmlContent,
            styles: styles,
            metadata: metadata,
            images: images,
            contentAreas: contentAreas,
            screenshot: `data:image/png;base64,${screenshot}`,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        if (browser) {
            await browser.close();
        }
        console.error('Preview fetch error:', error);
        // Try fallback with screenshot method
        try {
            console.log('Attempting fallback with screenshot method...');
            const fallbackResponse = await axios_1.default.get(req.body.url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                },
                timeout: 15000,
                maxRedirects: 5,
            });
            const $ = cheerio.load(fallbackResponse.data);
            const title = $('title').text() || 'Website Preview';
            const description = $('meta[name="description"]').attr('content') || '';
            const content = $('body').html() || '';
            res.json({
                success: true,
                url: req.body.url,
                html: fallbackResponse.data,
                styles: [],
                metadata: { title, description },
                images: [],
                contentAreas: [],
                screenshot: null,
                fallback: true,
                timestamp: new Date().toISOString()
            });
        }
        catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            res.status(500).json({
                error: 'Failed to load website preview - both headless browser and fallback methods failed',
                details: error instanceof Error ? error.message : 'Unknown error',
                fallbackError: fallbackError instanceof Error ? fallbackError.message : 'Unknown fallback error'
            });
        }
    }
});
// Endpoint to place carousel in website preview
router.post('/preview/place-carousel', async (req, res) => {
    let browser;
    try {
        const { url, carouselData, placement } = req.body;
        if (!url || !carouselData || !placement) {
            return res.status(400).json({ error: 'URL, carouselData, and placement are required' });
        }
        // Launch Puppeteer browser with enhanced bot detection evasion
        browser = await puppeteer_1.default.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-blink-features=AutomationControlled',
                '--disable-features=VizDisplayCompositor',
                '--disable-web-security',
                '--disable-features=TranslateUI',
                '--disable-ipc-flooding-protection',
                '--disable-renderer-backgrounding',
                '--disable-backgrounding-occluded-windows',
                '--disable-client-side-phishing-detection',
                '--disable-sync',
                '--disable-default-apps',
                '--disable-extensions',
                '--hide-scrollbars',
                '--mute-audio',
                '--no-default-browser-check',
                '--no-pings',
                '--disable-logging',
                '--disable-permissions-api',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding'
            ]
        });
        const page = await browser.newPage();
        // Enhanced bot detection evasion
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5],
            });
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en'],
            });
            window.chrome = {
                runtime: {},
            };
        });
        await page.setViewport({ width: 1366, height: 768 });
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        // Set additional headers
        await page.setExtraHTTPHeaders({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0'
        });
        // Navigate to the page
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        // Wait for content to load
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Inject carousel HTML and CSS into the page
        const carouselHTML = `
      <div id="ai-carousel-${Date.now()}" style="
        position: absolute;
        left: ${placement.x}px;
        top: ${placement.y}px;
        width: ${placement.width || 400}px;
        height: ${placement.height || 300}px;
        z-index: 9999;
        background: white;
        border: 2px solid #3b82f6;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        padding: 16px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #1f2937;">${carouselData.title}</h3>
          <div style="width: 8px; height: 8px; background: #3b82f6; border-radius: 50%;"></div>
        </div>
        <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px;">
          ${carouselData.items.map((item) => `
            <div style="
              flex-shrink: 0;
              width: 120px;
              height: 80px;
              background: #f3f4f6;
              border-radius: 6px;
              overflow: hidden;
              cursor: pointer;
              transition: transform 0.2s;
            " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
              <img src="${item.image}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: cover;" />
              <div style="padding: 8px; font-size: 12px; font-weight: 500; color: #374151;">${item.title}</div>
            </div>
          `).join('')}
        </div>
        <div style="font-size: 11px; color: #6b7280; margin-top: 8px;">
          AI Content Suggestion
        </div>
      </div>
    `;
        // Inject the carousel into the page
        await page.evaluate((html) => {
            document.body.insertAdjacentHTML('beforeend', html);
        }, carouselHTML);
        // Get the updated HTML with the carousel
        const updatedHTML = await page.content();
        // Take a screenshot with the carousel
        const screenshot = await page.screenshot({
            type: 'png',
            fullPage: true,
            encoding: 'base64'
        });
        await browser.close();
        res.json({
            success: true,
            url: url,
            updatedHTML: updatedHTML,
            screenshot: `data:image/png;base64,${screenshot}`,
            carouselId: `ai-carousel-${Date.now()}`,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        if (browser) {
            await browser.close();
        }
        console.error('Carousel placement error:', error);
        res.status(500).json({
            error: 'Failed to place carousel',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
