import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

const router = express.Router();

// Screenshot endpoint for websites that block iframe embedding
router.post('/screenshot', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL
    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Only allow HTTP/HTTPS
    if (!['http:', 'https:'].includes(targetUrl.protocol)) {
      return res.status(400).json({ error: 'Only HTTP/HTTPS URLs are allowed' });
    }

    // Fetch the website content
    const response = await axios.get(url, {
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
    const images: string[] = [];
    $('img').each((_, el) => {
      const src = $(el).attr('src');
      if (src) {
        if (src.startsWith('http')) {
          images.push(src);
        } else if (src.startsWith('//')) {
          images.push(`https:${src}`);
        } else if (src.startsWith('/')) {
          images.push(`${targetUrl.origin}${src}`);
        } else {
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

  } catch (error) {
    console.error('Screenshot fetch error:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return res.status(404).json({ error: 'Website not found or unreachable' });
      } else if (error.code === 'ETIMEDOUT') {
        return res.status(408).json({ error: 'Request timeout - website took too long to respond' });
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch website content',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
