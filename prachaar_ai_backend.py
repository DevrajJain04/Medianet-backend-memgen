# Prachaar AI - Complete Backend Monolith Service
# FastAPI service with 2 main endpoints for ad management and matching

import os
import io
import base64
import hashlib
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import json
import asyncio
from pathlib import Path
import time

# FastAPI and web framework imports
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Database imports
import pymongo
from pymongo import MongoClient
import chromadb
from chromadb.config import Settings

# ML and AI model imports
import torch
from transformers import CLIPProcessor, CLIPModel, DistilBertTokenizer, DistilBertModel
from sentence_transformers import SentenceTransformer
from PIL import Image
import cv2
import numpy as np

# Google Gemini API (only external API used)
import google.generativeai as genai

# Trend analysis
from pytrends.request import TrendReq

# Utility imports
import requests
import logging
from functools import lru_cache
import re
from tenacity import retry, stop_after_attempt, wait_exponential

from content_analyser import DistilBertContentAnalyzer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Prachaar AI Backend",
    description="Complete backend service for AI-powered advertising platform",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================================
# CONFIGURATION AND GLOBAL VARIABLES
# ================================

# Environment variables (set these in your environment)
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb+srv://divyam:divyam@cluster0.yzzipo3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "prachaar_ai")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "your-gemini-api-key-here")
CHROMADB_PATH = os.getenv("CHROMADB_PATH", "./chromadb_data")

# Global variables for models and databases
clip_model = None
clip_processor = None
distilbert_tokenizer = None
distilbert_model = None
sentence_transformer = None
mongodb_client = None
mongodb_db = None
chroma_client = None
chroma_collection = None

# Dynamic trends cache
trends_cache = {
    "viral_concepts": [],
    "action_words": [],
    "last_updated": None,
    "cache_duration": timedelta(hours=6)  # Update every 6 hours
}

# ================================
# PYDANTIC MODELS FOR API
# ================================

class AdCreativeResponse(BaseModel):
    """Response model for add-ad endpoint"""
    ad_id: str
    creativity_score: float
    vitality_score: float
    message: str

class RelevantAdsRequest(BaseModel):
    """Request model for get-relevant-ads endpoint"""
    content: Optional[str] = None
    url: Optional[str] = None
    top_k: Optional[int] = 10

    @property
    def is_valid(self):
        """Check if either content or url is provided"""
        return bool(self.content or self.url)

class AdMetadata(BaseModel):
    """Model for ad metadata"""
    ad_id: str
    file_type: str
    caption: str
    creativity_score: float
    vitality_score: float
    created_at: str
    file_data: str  # base64 encoded

class RelevantAdsResponse(BaseModel):
    """Response model for get-relevant-ads endpoint"""
    ads: List[AdMetadata]
    total_found: int
    similarity_threshold: float

# ================================
# DYNAMIC TRENDS FUNCTIONS
# ================================

def get_trending_topics(limit: int = 20) -> List[str]:
    """Get trending topics using PyTrends"""
    try:
        pytrends = TrendReq(hl='en-US', tz=360, retries=2, backoff_factor=0.1)
        
        # Get daily trending searches
        trending_searches = pytrends.trending_searches(pn='united_states')
        daily_trends = trending_searches[0].head(limit).tolist()
        
        # Also get realtime trending searches
        try:
            realtime_trends = pytrends.realtime_trending_searches(pn='US')
            if realtime_trends is not None and not realtime_trends.empty:
                realtime_list = realtime_trends['title'].head(10).tolist()
                # Combine and deduplicate
                all_trends = list(dict.fromkeys(daily_trends + realtime_list))
                return all_trends[:limit]
        except Exception as e:
            logger.warning(f"Could not fetch realtime trends: {e}")
            
        return daily_trends
        
    except Exception as e:
        logger.error(f"Error fetching trends: {e}")
        # Return some default trending topics
        return ["AI", "technology", "memes", "social media", "innovation", 
                "viral", "trending", "breaking news", "amazing", "incredible"]

def extract_viral_concepts_from_trends(trends: List[str]) -> List[str]:
    """Extract viral concepts from trending topics"""
    viral_concepts = []
    
    for trend in trends:
        # Clean and process the trend
        trend_lower = trend.lower().strip()
        
        # Add variations of the trend that indicate virality
        viral_concepts.extend([
            f"trending {trend_lower}",
            f"viral {trend_lower}",
            f"breaking {trend_lower}",
            f"latest {trend_lower}",
            f"new {trend_lower}",
            f"{trend_lower} goes viral",
            f"everyone talking about {trend_lower}",
            f"must see {trend_lower}",
            trend_lower  # Original trend
        ])
    
    # Add general viral concepts
    general_viral_concepts = [
        "trending viral content", "amazing discovery", "shocking revelation", 
        "incredible moment", "unbelievable event", "breaking news",
        "exclusive content", "must see", "going viral", "social media buzz",
        "internet sensation", "viral phenomenon", "explosive content",
        "trending now", "hot topic", "everyone's talking about"
    ]
    
    viral_concepts.extend(general_viral_concepts)
    
    # Remove duplicates and return
    return list(dict.fromkeys(viral_concepts))

def extract_action_words_from_trends(trends: List[str]) -> List[str]:
    """Extract action/urgency words from trending topics and combine with defaults"""
    action_words = set()
    
    # Extract action words from trends using regex patterns
    action_patterns = [
        r'\b(new|latest|breaking|urgent|now|today|just|fresh|hot)\b',
        r'\b(exclusive|first|limited|special|unique|rare)\b',
        r'\b(amazing|incredible|shocking|unbelievable|stunning)\b',
        r'\b(must|need|should|have to|got to|check)\b',
        r'\b(see|watch|look|discover|find|learn)\b',
        r'\b(get|grab|take|buy|try|use)\b'
    ]
    
    for trend in trends:
        trend_lower = trend.lower()
        for pattern in action_patterns:
            matches = re.findall(pattern, trend_lower)
            action_words.update(matches)
    
    # Add default action words
    default_action_words = [
        "now", "today", "urgent", "breaking", "new", "latest", "first time",
        "exclusive", "limited", "special", "amazing", "incredible", "shocking",
        "must see", "check out", "watch", "discover", "unbelievable",
        "stunning", "explosive", "instant", "immediate", "fresh", "hot",
        "trending", "viral", "popular", "buzzworthy", "game changing",
        "revolutionary", "groundbreaking", "epic", "massive", "huge",
        "unprecedented", "rare", "unique", "extraordinary", "phenomenal"
    ]
    
    action_words.update(default_action_words)
    
    return list(action_words)

def update_trends_cache():
    """Update the trends cache if it's stale"""
    global trends_cache
    
    current_time = datetime.now()
    
    # Check if cache needs update
    if (trends_cache["last_updated"] is None or 
        current_time - trends_cache["last_updated"] > trends_cache["cache_duration"]):
        
        logger.info("Updating trends cache...")
        try:
            # Get trending topics
            trending_topics = get_trending_topics(limit=30)
            
            # Extract viral concepts and action words
            viral_concepts = extract_viral_concepts_from_trends(trending_topics)
            action_words = extract_action_words_from_trends(trending_topics)
            
            # Update cache
            trends_cache.update({
                "viral_concepts": viral_concepts,
                "action_words": action_words,
                "last_updated": current_time,
                "trending_topics": trending_topics
            })
            
            logger.info(f"Trends cache updated with {len(viral_concepts)} viral concepts and {len(action_words)} action words")
            
        except Exception as e:
            logger.error(f"Failed to update trends cache: {e}")
            # If update fails and cache is empty, use defaults
            if not trends_cache["viral_concepts"]:
                trends_cache["viral_concepts"] = [
                    "trending viral content", "amazing discovery", "shocking revelation", 
                    "incredible moment", "unbelievable event", "breaking news"
                ]
            if not trends_cache["action_words"]:
                trends_cache["action_words"] = [
                    "now", "today", "urgent", "breaking", "new", "latest", 
                    "exclusive", "amazing", "incredible", "shocking"
                ]

def get_dynamic_viral_concepts() -> List[str]:
    """Get current viral concepts from cache"""
    update_trends_cache()
    return trends_cache["viral_concepts"]

def get_dynamic_action_words() -> List[str]:
    """Get current action words from cache"""
    update_trends_cache()
    return trends_cache["action_words"]

# ================================
# INITIALIZATION FUNCTIONS
# ================================

def initialize_models():
    """Initialize all ML models at startup"""
    global clip_model, clip_processor, distilbert_tokenizer, distilbert_model, sentence_transformer
    
    logger.info("Initializing ML models...")
    
    # Initialize CLIP model for image-text understanding
    try:
        clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        logger.info("CLIP model loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load CLIP model: {e}")
        raise
    
    # Initialize DistilBERT for creativity scoring
    try:
        distilbert_tokenizer = DistilBertTokenizer.from_pretrained('distilbert-base-uncased')
        distilbert_model = DistilBertModel.from_pretrained('distilbert-base-uncased')
        logger.info("DistilBERT model loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load DistilBERT model: {e}")
        raise
    
    # Initialize Sentence Transformer for semantic similarity
    try:
        sentence_transformer = SentenceTransformer('all-MiniLM-L6-v2')
        logger.info("Sentence Transformer model loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load Sentence Transformer: {e}")
        raise

def initialize_databases():
    """Initialize MongoDB and ChromaDB connections"""
    global mongodb_client, mongodb_db, chroma_client, chroma_collection
    
    logger.info("Initializing databases...")
    
    # Initialize MongoDB with fallback
    try:
        mongodb_client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
        mongodb_db = mongodb_client[MONGODB_DB_NAME]
        # Test connection
        mongodb_client.admin.command('ping')
        logger.info("MongoDB connected successfully")
    except Exception as e:
        logger.warning(f"MongoDB connection failed: {e}")
        logger.warning("Running without MongoDB - ads will only be stored in ChromaDB")
        mongodb_client = None
        mongodb_db = None
    
    # Initialize ChromaDB
    try:
        # Create ChromaDB directory if it doesn't exist
        Path(CHROMADB_PATH).mkdir(parents=True, exist_ok=True)
        
        chroma_client = chromadb.PersistentClient(path=CHROMADB_PATH)
        chroma_collection = chroma_client.get_or_create_collection(
            name="ad_embeddings",
            metadata={"hnsw:space": "cosine"}
        )
        logger.info("ChromaDB initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize ChromaDB: {e}")
        raise

def initialize_gemini():
    """Initialize Google Gemini API"""
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        logger.info("Gemini API configured successfully")
    except Exception as e:
        logger.error(f"Failed to configure Gemini API: {e}")
        # Don't raise here as it might be configured later
    
# ================================
# UTILITY FUNCTIONS
# ================================

def generate_ad_id(file_content: bytes, caption: str) -> str:
    """Generate unique ad ID based on content and caption"""
    content_hash = hashlib.md5(file_content + caption.encode()).hexdigest()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"ad_{timestamp}_{content_hash[:8]}"

def is_image_file(filename: str) -> bool:
    """Check if file is an image"""
    image_extensions = {'.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.webp'}
    return Path(filename).suffix.lower() in image_extensions

def is_video_file(filename: str) -> bool:
    """Check if file is a video"""
    video_extensions = {'.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'}
    return Path(filename).suffix.lower() in video_extensions

def process_image_with_clip(image: Image.Image, text: str) -> np.ndarray:
    """Process image and text with CLIP to get embeddings"""
    try:
        # Prepare inputs for CLIP
        inputs = clip_processor(text=[text], images=image, return_tensors="pt", padding=True)
        
        # Get embeddings
        with torch.no_grad():
            # Get both image and text features
            image_features = clip_model.get_image_features(inputs['pixel_values'])
            text_features = clip_model.get_text_features(inputs['input_ids'])
            
            # Normalize features
            image_features = image_features / image_features.norm(dim=1, keepdim=True)
            text_features = text_features / text_features.norm(dim=1, keepdim=True)
            
            # Combine embeddings by averaging (both are same dimension)
            combined_embedding = (image_features + text_features) / 2
            
        return combined_embedding.numpy().flatten()
    except Exception as e:
        logger.error(f"Error processing with CLIP: {e}")
        raise

def process_video_frame(video_bytes: bytes) -> Image.Image:
    """Extract a representative frame from video for processing"""
    try:
        # Save video to temporary location
        temp_video_path = "temp_video.mp4"
        with open(temp_video_path, "wb") as f:
            f.write(video_bytes)
        
        # Extract middle frame using OpenCV
        cap = cv2.VideoCapture(temp_video_path)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        middle_frame = frame_count // 2
        
        cap.set(cv2.CAP_PROP_POS_FRAMES, middle_frame)
        ret, frame = cap.read()
        cap.release()
        
        # Clean up
        os.remove(temp_video_path)
        
        if ret:
            # Convert BGR to RGB and create PIL Image
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            return Image.fromarray(frame_rgb)
        else:
            # Return a default image if frame extraction fails
            return Image.new('RGB', (224, 224), color='white')
            
    except Exception as e:
        logger.error(f"Error processing video frame: {e}")
        # Return a default image
        return Image.new('RGB', (224, 224), color='white')

def calculate_creativity_score(image: Image.Image, text: str) -> float:
    """Calculate creativity score using AI models and advanced image analysis"""
    try:
        # Text creativity analysis using DistilBERT embeddings
        inputs = distilbert_tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)
        
        with torch.no_grad():
            outputs = distilbert_model(**inputs)
            text_embeddings = outputs.last_hidden_state
            
            # Calculate text complexity based on embedding variance
            # Higher variance in embeddings indicates more diverse/creative language
            embedding_variance = torch.var(text_embeddings, dim=1).mean().item()
            text_complexity_score = min(embedding_variance * 10, 1.0)  # Scale appropriately
            
            # Calculate attention diversity (how attention is distributed across tokens)
            attention_weights = outputs.last_hidden_state.std(dim=-1).mean().item()
            attention_diversity_score = min(attention_weights * 5, 1.0)
        
        # Advanced text features for creativity
        words = text.split()
        
        # Lexical diversity (unique words ratio)
        lexical_diversity = len(set(words)) / max(len(words), 1)
        
        # Sentence structure complexity (punctuation variety)
        punctuation_variety = len(set(char for char in text if char in '!?.,;:-()[]{}')) / 10.0
        punctuation_variety = min(punctuation_variety, 1.0)
        
        # Word length diversity (creative writing often has varied word lengths)
        if words:
            word_lengths = [len(word.strip('.,!?;:')) for word in words]
            length_std = np.std(word_lengths) / 10.0  # Normalize
            length_diversity = min(length_std, 1.0)
        else:
            length_diversity = 0.0
        
        # Advanced image creativity analysis
        img_array = np.array(image.resize((224, 224)))  # Larger size for better analysis
        
        if len(img_array.shape) == 3:  # Color image
            # Color harmony analysis - creative images often have interesting color relationships
            # Convert to different color spaces for analysis
            from PIL import ImageEnhance
            
            # Color saturation analysis
            enhancer = ImageEnhance.Color(image)
            enhanced = np.array(enhancer.enhance(1.5).resize((64, 64)))
            color_intensity = np.std(enhanced) / 255.0
            
            # Edge detection for composition complexity
            gray = np.mean(img_array, axis=2) if len(img_array.shape) == 3 else img_array
            edges = np.abs(np.gradient(gray)).mean() / 255.0
            composition_complexity = min(edges * 2, 1.0)
            
            # Color distribution entropy (more creative images have interesting color distributions)
            hist, _ = np.histogram(img_array.flatten(), bins=50, density=True)
            hist = hist[hist > 0]  # Remove zero bins
            color_entropy = -np.sum(hist * np.log(hist)) / 5.0  # Normalize
            color_entropy = min(color_entropy, 1.0)
            
        else:  # Grayscale
            color_intensity = 0.3  # Moderate score for grayscale
            composition_complexity = np.std(img_array) / 255.0
            color_entropy = 0.4  # Moderate entropy for grayscale
        
        # Combine all creativity metrics with weighted average
        creativity_score = (
            text_complexity_score * 0.20 +      # DistilBERT embedding variance
            attention_diversity_score * 0.15 +  # Attention pattern diversity
            lexical_diversity * 0.15 +          # Vocabulary richness
            punctuation_variety * 0.10 +        # Writing style complexity
            length_diversity * 0.10 +           # Word length variety
            color_intensity * 0.10 +            # Visual color richness
            composition_complexity * 0.10 +     # Visual composition complexity
            color_entropy * 0.10                # Color distribution creativity
        )
        
        return float(min(max(creativity_score, 0.0), 1.0))  # Clamp between 0 and 1
        
    except Exception as e:
        logger.error(f"Error calculating creativity score: {e}")
        return 0.5  # Default score

def calculate_vitality_score(image: Image.Image, text: str) -> float:
    """Calculate vitality/virality score using AI models and dynamic trending content analysis"""
    try:
        # Get dynamic viral concepts and action words
        viral_concepts = get_dynamic_viral_concepts()
        action_words = get_dynamic_action_words()
        
        # Advanced text analysis using DistilBERT for emotional content
        inputs = distilbert_tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)
        
        with torch.no_grad():
            outputs = distilbert_model(**inputs)
            text_embeddings = outputs.last_hidden_state
            
            # Emotional intensity based on embedding patterns
            # Higher variance in later layers often indicates emotional content
            emotional_intensity = torch.var(text_embeddings[:, -10:, :]).mean().item()  # Focus on last tokens
            emotional_score = min(emotional_intensity * 20, 1.0)  # Scale appropriately
            
            # Activation strength (how "activated" the model is by the text)
            activation_strength = torch.mean(torch.abs(text_embeddings)).item()
            activation_score = min(activation_strength * 2, 1.0)
        
        # Dynamic semantic analysis using CLIP for viral potential with trending concepts
        clip_inputs = clip_processor(text=[text], images=None, return_tensors="pt", padding=True)
        
        with torch.no_grad():
            text_features = clip_model.get_text_features(clip_inputs['input_ids'])
            
            # Use dynamic viral concepts from trending topics
            viral_inputs = clip_processor(text=viral_concepts[:20], images=None, return_tensors="pt", padding=True)  # Use top 20 to avoid memory issues
            viral_features = clip_model.get_text_features(viral_inputs['input_ids'])
            
            # Calculate similarity to viral concepts
            similarity_scores = torch.cosine_similarity(text_features, viral_features, dim=1)
            viral_similarity = torch.mean(similarity_scores).item()
            viral_concept_score = max(0, viral_similarity)  # Ensure positive
        
        # Advanced text features for virality using dynamic action words
        words = text.lower().split()
        
        # Dynamic action words analysis
        action_count = sum(1 for word in action_words if word.lower() in text.lower())
        action_score = min(action_count / 5.0, 1.0)
        
        # Trending topics presence (check if any trending topics are mentioned)
        trending_topics = trends_cache.get("trending_topics", [])
        trending_mentions = sum(1 for topic in trending_topics if topic.lower() in text.lower())
        trending_score = min(trending_mentions / 3.0, 1.0)  # Normalize by expected mentions
        
        # Emotional punctuation analysis
        emotional_punctuation = text.count('!') + text.count('?') * 0.8 + text.count('...') * 0.6
        punctuation_score = min(emotional_punctuation / len(text) * 20, 1.0) if text else 0
        
        # Capitalization for emphasis (but not excessive)
        caps_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
        caps_score = min(caps_ratio * 10, 1.0) if caps_ratio < 0.3 else max(0, 1.0 - caps_ratio)
        
        # Advanced image analysis for visual appeal
        img_array = np.array(image.resize((224, 224)))
        
        # Visual impact analysis
        if len(img_array.shape) == 3:  # Color image
            # Brightness analysis (viral content often has good lighting)
            brightness = np.mean(img_array) / 255.0
            optimal_brightness = 1.0 - abs(brightness - 0.6) / 0.6  # Optimal around 60% brightness
            
            # Contrast analysis (high contrast = more attention-grabbing)
            contrast = np.std(img_array) / 255.0
            contrast_score = min(contrast * 2, 1.0)
            
            # Color saturation (vibrant colors often perform better)
            rgb_array = img_array.astype(float)
            saturation = np.std(rgb_array, axis=2).mean() / 255.0
            saturation_score = min(saturation * 3, 1.0)
            
            # Face detection proxy (images with people often go viral)
            # Simple approximation using skin tone detection
            face_proxy_score = min(np.mean(img_array[:,:,0]) / 200.0, 0.3)  # Simple heuristic
            
        else:  # Grayscale
            brightness = np.mean(img_array) / 255.0
            optimal_brightness = 1.0 - abs(brightness - 0.5) / 0.5
            contrast_score = min(np.std(img_array) / 128.0, 1.0)
            saturation_score = 0.3  # Moderate score for grayscale
            face_proxy_score = 0.2  # Lower score for grayscale
        
        # Combine all vitality metrics with weighted average (updated weights for dynamic features)
        vitality_score = (
            emotional_score * 0.15 +           # DistilBERT emotional intensity
            activation_score * 0.10 +          # Model activation strength
            viral_concept_score * 0.25 +       # CLIP similarity to dynamic viral concepts (increased weight)
            trending_score * 0.15 +            # Trending topics presence (new dynamic feature)
            action_score * 0.15 +              # Dynamic action words (increased weight)
            punctuation_score * 0.08 +         # Emotional punctuation
            caps_score * 0.07 +               # Strategic capitalization
            optimal_brightness * 0.02 +        # Visual brightness appeal
            contrast_score * 0.02 +           # Visual contrast
            saturation_score * 0.02 +         # Color vibrancy
            face_proxy_score * 0.01           # Human element (basic)
        )
        
        return float(min(max(vitality_score, 0.0), 1.0))  # Clamp between 0 and 1
        
    except Exception as e:
        logger.error(f"Error calculating vitality score: {e}")
        return 0.5  # Default score

# ================================
# CONTENT ANALYZER FUNCTIONS
# ================================

def create_content_analyzer():
    """Create and initialize the content analyzer with enhanced capabilities"""
    return DistilBertContentAnalyzer()

async def analyze_content_for_ads(content=None, url=None, top_k=10):
    """Analyze content and find relevant ads using enhanced matching"""
    try:
        analyzer = create_content_analyzer()
        
        # Extract content from URL if provided, with retries
        if url:
            try:
                content_data = await extract_url_with_retry(url)
                if not content_data.get('success', False):
                    raise HTTPException(
                        status_code=400,
                        detail=f"Failed to extract content from URL: {content_data.get('error', 'unknown error')}"
                    )
                content = content_data['text']
            except Exception as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"URL extraction failed: {str(e)}"
                )
        elif not content:
            raise HTTPException(status_code=400, detail="No content provided")
        
        # Create content data for analysis
        content_data = analyzer._process_direct_text(content)
            
        # Get analysis with embeddings
        analysis = analyzer.analyze_content_with_distilbert(content_data)
        
        if not analysis.get('success', False):
            raise HTTPException(status_code=400, detail="Content analysis failed")
        
        # Pad or truncate embeddings to match expected dimension
        embeddings = pad_embeddings(analysis['semantic_embeddings'], target_dim=512)
        
        # Query ChromaDB for similar ads
        results = chroma_collection.query(
            query_embeddings=[embeddings],
            n_results=top_k * 2,
            include=["metadatas", "distances"]
        )
        
        # Enhanced ad matching using semantic embeddings and cookieless features
        relevant_ads = []
        
        # Query ChromaDB for initial matches
        results = chroma_collection.query(
            query_embeddings=[embeddings],
            n_results=top_k * 2,  # Get more initially for filtering
            include=["metadatas", "distances"]
        )
        
        if results['ids'] and len(results['ids'][0]) > 0:
            # Enhanced scoring using cookieless features
            for i, ad_id in enumerate(results['ids'][0]):
                base_similarity = 1 - results['distances'][0][i]
                
                # Get ad metadata
                if mongodb_db is not None:
                    ad_data = mongodb_db.ads_metadata.find_one({"ad_id": ad_id})
                else:
                    ad_data = results['metadatas'][0][i]
                
                if ad_data:
                    # Calculate feature-based score boost
                    boost_score = calculate_feature_boost(
                        analysis['cookieless_features'],
                        ad_data.get('category', ''),
                        analysis['category'],
                        ad_data.get('sentiment', {}).get('label', ''),
                        analysis['sentiment']['label']
                    )
                    
                    # Combine scores with weights
                    final_score = (base_similarity * 0.7) + (boost_score * 0.3)
                    
                    relevant_ads.append({
                        'ad_data': ad_data,
                        'relevance_score': final_score
                    })
        
        # Sort by final score and get top_k
        relevant_ads.sort(key=lambda x: x['relevance_score'], reverse=True)
        relevant_ads = relevant_ads[:top_k]
        
        # Format response
        formatted_ads = []
        for item in relevant_ads:
            ad_data = item['ad_data']
            formatted_ad = AdMetadata(
                ad_id=ad_data['ad_id'],
                file_type=ad_data.get('file_type', 'unknown'),
                caption=ad_data.get('caption', ''),
                creativity_score=ad_data.get('creativity_score', 0.5),
                vitality_score=ad_data.get('vitality_score', 0.5),
                created_at=ad_data.get('created_at', datetime.now().isoformat()),
                file_data=ad_data.get('file_data', '')
            )
            formatted_ads.append(formatted_ad)
        
        return RelevantAdsResponse(
            ads=formatted_ads,
            total_found=len(formatted_ads),
            similarity_threshold=0.1
        )
        
    except Exception as e:
        logger.error(f"Content analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def calculate_feature_boost(content_features, ad_category, content_category, ad_sentiment, content_sentiment):
    """Calculate boost score based on content and ad features"""
    boost = 0.0
    
    # Category match boost
    if ad_category.lower() == content_category.lower():
        boost += 0.2
        
    # Sentiment alignment boost
    if ad_sentiment == content_sentiment:
        boost += 0.1
        
    # Content freshness boost
    if content_features.get('has_dates', False):
        boost += 0.05
        
    # Reading time alignment
    content_read_time = content_features.get('reading_time_minutes', 5)
    if content_read_time > 1 and content_read_time < 10:
        boost += 0.05
        
    # Engagement potential boost
    if content_features.get('exclamation_ratio', 0) > 0.01:
        boost += 0.05
        
    return min(boost, 0.5)  # Cap the boost at 0.5

def pad_embeddings(embeddings, target_dim=512):
    """Pad or truncate embeddings to match target dimension"""
    current_dim = len(embeddings)
    if current_dim == target_dim:
        return embeddings
    
    if current_dim > target_dim:
        # Truncate to target dimension
        return embeddings[:target_dim]
    else:
        # Pad with zeros
        padding = np.zeros(target_dim - current_dim)
        return np.concatenate([embeddings, padding])

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10),
    reraise=True
)
async def extract_url_with_retry(url: str):
    """Extract content from URL with retry logic"""
    try:
        analyzer = create_content_analyzer()
        content_data = analyzer.extract_content(url)
        
        if not content_data.get('success', False):
            raise Exception(content_data.get('error', 'Failed to extract content'))
            
        return content_data
    except Exception as e:
        logger.warning(f"URL extraction attempt failed: {str(e)}")
        raise

# ================================
# API ENDPOINTS
# ================================

@app.on_event("startup")
async def startup_event():
    """Initialize everything when the app starts"""
    logger.info("Starting Prachaar AI Backend Service...")
    initialize_models()
    initialize_databases()
    initialize_gemini()
    
    # Initialize trends cache on startup
    update_trends_cache()
    
    logger.info("All services initialized successfully!")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Prachaar AI Backend Service is running!", "version": "1.0.0"}

@app.post("/add-ad", response_model=AdCreativeResponse)
async def add_ad(
    ad_creative: UploadFile = File(..., description="Ad creative file (image/video)"),
    text: Optional[str] = Form(None, description="Caption/text for the ad")
):
    """
    Endpoint 1: Add advertisement creative
    - Accepts image/video files and optional text caption
    - Processes with CLIP model for semantic understanding
    - Stores in vector database (ChromaDB) and metadata in MongoDB
    - Returns creativity and vitality scores using dynamic trending analysis
    """
    try:
        logger.info(f"Processing ad creative: {ad_creative.filename}")
        
        # Read file content
        file_content = await ad_creative.read()
        if not file_content:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        
        # Set default text if not provided
        if not text:
            text = f"Advertisement: {ad_creative.filename}"
        
        # Generate unique ad ID
        ad_id = generate_ad_id(file_content, text)
        
        # Process file based on type
        if is_image_file(ad_creative.filename):
            # Process image directly
            image = Image.open(io.BytesIO(file_content)).convert('RGB')
            file_type = "image"
            
        elif is_video_file(ad_creative.filename):
            # Extract frame from video
            image = process_video_frame(file_content)
            file_type = "video"
            
        else:
            raise HTTPException(
                status_code=400, 
                detail="Unsupported file type. Please upload PNG, JPG, JPEG, GIF, or MP4 files."
            )
        
        # Generate embeddings using CLIP
        embeddings = process_image_with_clip(image, text)
        
        # Calculate scores with dynamic trending analysis
        creativity_score = calculate_creativity_score(image, text)
        vitality_score = calculate_vitality_score(image, text)
        
        # Store embeddings in ChromaDB
        chroma_collection.add(
            embeddings=[embeddings.tolist()],
            metadatas=[{
                "ad_id": ad_id,
                "file_type": file_type,
                "caption": text,
                "creativity_score": creativity_score,
                "vitality_score": vitality_score,
                "created_at": datetime.now().isoformat()
            }],
            ids=[ad_id]
        )
        
        # Store metadata and file in MongoDB (if available)
        if mongodb_db is not None:
            ad_document = {
                "ad_id": ad_id,
                "file_type": file_type,
                "filename": ad_creative.filename,
                "caption": text,
                "creativity_score": creativity_score,
                "vitality_score": vitality_score,
                "file_data": base64.b64encode(file_content).decode('utf-8'),
                "created_at": datetime.now().isoformat(),
                "file_size": len(file_content)
            }
            
            mongodb_db.ads_metadata.insert_one(ad_document)
            logger.info(f"Ad metadata stored in MongoDB")
        else:
            logger.info("MongoDB not available - metadata stored only in ChromaDB")
        
        logger.info(f"Successfully processed ad {ad_id} with scores - Creativity: {creativity_score:.2f}, Vitality: {vitality_score:.2f}")
        
        return AdCreativeResponse(
            ad_id=ad_id,
            creativity_score=round(creativity_score, 3),
            vitality_score=round(vitality_score, 3),
            message="Ad creative processed and stored successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in add_ad endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/get-relevant-ads", response_model=RelevantAdsResponse)
async def get_relevant_ads(request: Request):
    """Enhanced endpoint for getting relevant ads using content analysis"""
    try:
        content_type = request.headers.get("content-type", "").lower()
        
        if "application/json" in content_type:
            # Handle JSON request
            body = await request.json()
            request_data = RelevantAdsRequest(**body)
        else:
            # Handle form data request
            form_data = await request.form()
            request_data = RelevantAdsRequest(
                content=form_data.get("content"),
                url=form_data.get("url"),
                top_k=int(form_data.get("top_k", 10))
            )
            
        if not request_data.is_valid:
            raise HTTPException(
                status_code=400,
                detail="Either content or URL must be provided"
            )
            
        return await analyze_content_for_ads(
            content=request_data.content,
            url=request_data.url,
            top_k=request_data.top_k
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in get_relevant_ads: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ================================
# TRENDS AND ANALYTICS ENDPOINTS
# ================================

@app.get("/trends/current")
async def get_current_trends():
    """Get current trending topics and analysis data"""
    try:
        update_trends_cache()
        
        return {
            "trending_topics": trends_cache.get("trending_topics", [])[:10],
            "viral_concepts_count": len(trends_cache.get("viral_concepts", [])),
            "action_words_count": len(trends_cache.get("action_words", [])),
            "last_updated": trends_cache.get("last_updated").isoformat() if trends_cache.get("last_updated") else None,
            "cache_duration_hours": trends_cache["cache_duration"].total_seconds() / 3600,
            "sample_viral_concepts": trends_cache.get("viral_concepts", [])[:10],
            "sample_action_words": trends_cache.get("action_words", [])[:10]
        }
    except Exception as e:
        logger.error(f"Error getting current trends: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving trends")

@app.post("/trends/refresh")
async def refresh_trends():
    """Force refresh the trends cache"""
    try:
        # Force update by resetting the last updated time
        trends_cache["last_updated"] = None
        update_trends_cache()
        
        return {
            "message": "Trends cache refreshed successfully",
            "trending_topics_count": len(trends_cache.get("trending_topics", [])),
            "viral_concepts_count": len(trends_cache.get("viral_concepts", [])),
            "action_words_count": len(trends_cache.get("action_words", [])),
            "updated_at": trends_cache.get("last_updated").isoformat() if trends_cache.get("last_updated") else None
        }
    except Exception as e:
        logger.error(f"Error refreshing trends: {e}")
        raise HTTPException(status_code=500, detail="Error refreshing trends")

# ================================
# ADDITIONAL UTILITY ENDPOINTS
# ================================

@app.get("/ads/stats")
async def get_ads_stats():
    """Get statistics about stored ads with trending analysis"""
    try:
        if mongodb_db is not None:
            total_ads = mongodb_db.ads_metadata.count_documents({})
            
            # Get average scores
            pipeline = [
                {"$group": {
                    "_id": None,
                    "avg_creativity": {"$avg": "$creativity_score"},
                    "avg_vitality": {"$avg": "$vitality_score"},
                    "max_creativity": {"$max": "$creativity_score"},
                    "max_vitality": {"$max": "$vitality_score"}
                }}
            ]
            score_stats = list(mongodb_db.ads_metadata.aggregate(pipeline))
        else:
            total_ads = 0
            score_stats = []
        
        total_embeddings = chroma_collection.count()
        
        # Get trends info
        trends_info = {
            "trends_cache_active": trends_cache.get("last_updated") is not None,
            "trending_topics_count": len(trends_cache.get("trending_topics", [])),
            "viral_concepts_count": len(trends_cache.get("viral_concepts", [])),
            "action_words_count": len(trends_cache.get("action_words", [])),
            "last_trends_update": trends_cache.get("last_updated").isoformat() if trends_cache.get("last_updated") else None
        }
        
        stats = {
            "total_uploaded_ads": total_ads,
            "total_embeddings": total_embeddings,
            "mongodb_status": "connected" if mongodb_db is not None else "disconnected",
            "database_status": "healthy",
            "trends_info": trends_info
        }
        
        if score_stats:
            stats["score_analytics"] = {
                "average_creativity_score": round(score_stats[0]["avg_creativity"], 3),
                "average_vitality_score": round(score_stats[0]["avg_vitality"], 3),
                "max_creativity_score": round(score_stats[0]["max_creativity"], 3),
                "max_vitality_score": round(score_stats[0]["max_vitality"], 3)
            }
        
        return stats
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving statistics")

@app.get("/ads/{ad_id}")
async def get_ad_by_id(ad_id: str):
    """Get specific ad by ID with trending context"""
    try:
        ad_data = None
        
        if mongodb_db is not None:
            ad_data = mongodb_db.ads_metadata.find_one({"ad_id": ad_id})
        
        if not ad_data:
            # Try to get from ChromaDB metadata
            try:
                results = chroma_collection.get(ids=[ad_id], include=["metadatas"])
                if results['ids'] and len(results['ids']) > 0:
                    chroma_metadata = results['metadatas'][0]
                    ad_data = {
                        "ad_id": ad_id,
                        "file_type": chroma_metadata.get('file_type', 'unknown'),
                        "caption": chroma_metadata.get('caption', ''),
                        "creativity_score": chroma_metadata.get('creativity_score', 0.5),
                        "vitality_score": chroma_metadata.get('vitality_score', 0.5),
                        "created_at": chroma_metadata.get('created_at', 'unknown'),
                        "source": "chromadb_only"
                    }
            except Exception as e:
                logger.warning(f"Could not retrieve from ChromaDB: {e}")
        
        if not ad_data:
            raise HTTPException(status_code=404, detail="Ad not found")
        
        # Remove MongoDB ObjectId if present
        if '_id' in ad_data:
            ad_data.pop('_id', None)
            
        # Add current trending context
        current_trends = trends_cache.get("trending_topics", [])[:5]
        ad_data["current_trending_context"] = current_trends
        
        return ad_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving ad {ad_id}: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving ad")

@app.delete("/ads/{ad_id}")
async def delete_ad(ad_id: str):
    """Delete an ad by ID"""
    try:
        deleted_count = 0
        
        # Delete from MongoDB if available
        if mongodb_db is not None:
            result = mongodb_db.ads_metadata.delete_one({"ad_id": ad_id})
            deleted_count = result.deleted_count
        
        # Delete from ChromaDB
        try:
            chroma_collection.delete(ids=[ad_id])
            deleted_count += 1  # Assume success if no exception
        except Exception as e:
            logger.warning(f"Could not delete from ChromaDB: {e}")
        
        if deleted_count == 0:
            raise HTTPException(status_code=404, detail="Ad not found")
        
        return {"message": f"Ad {ad_id} deleted successfully", "deleted_from_sources": deleted_count}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting ad {ad_id}: {e}")
        raise HTTPException(status_code=500, detail="Error deleting ad")

@app.get("/health")
async def health_check():
    """Comprehensive health check including trends system"""
    try:
        health_status = {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "services": {
                "mongodb": "connected" if mongodb_db is not None else "disconnected",
                "chromadb": "connected",
                "clip_model": "loaded" if clip_model is not None else "not_loaded",
                "distilbert_model": "loaded" if distilbert_model is not None else "not_loaded",
                "sentence_transformer": "loaded" if sentence_transformer is not None else "not_loaded",
                "trends_system": "active" if trends_cache.get("last_updated") is not None else "inactive"
            },
            "trends_cache_info": {
                "last_updated": trends_cache.get("last_updated").isoformat() if trends_cache.get("last_updated") else None,
                "trending_topics_count": len(trends_cache.get("trending_topics", [])),
                "viral_concepts_count": len(trends_cache.get("viral_concepts", [])),
                "action_words_count": len(trends_cache.get("action_words", []))
            }
        }
        
        # Test ChromaDB connection
        try:
            chroma_collection.count()
        except Exception as e:
            health_status["services"]["chromadb"] = f"error: {str(e)}"
            health_status["status"] = "degraded"
        
        # Test MongoDB connection if available
        if mongodb_db is not None:
            try:
                mongodb_client.admin.command('ping')
            except Exception as e:
                health_status["services"]["mongodb"] = f"error: {str(e)}"
                health_status["status"] = "degraded"
        
        return health_status
        
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return {
            "status": "error",
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }

# ================================
# RUN THE APPLICATION
# ================================

if __name__ == "__main__":
    uvicorn.run(
        "prachaar_ai_backend:app",  # Updated to match your filename
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

# ================================
# REQUIREMENTS.TXT CONTENT
# ================================

"""
Requirements.txt content:

fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
pydantic==2.4.2

# Database dependencies
pymongo==4.6.0
chromadb==0.4.18

# ML/AI dependencies
torch==2.1.1
torchvision==0.16.1
transformers==4.35.2
sentence-transformers==2.2.2
Pillow==10.1.0
opencv-python==4.8.1.78
numpy==1.24.3

# Google Gemini API
google-generativeai==0.3.1

# Trend analysis
pytrends==4.9.2

# Utilities
requests==2.31.0
python-dotenv==1.0.0

# Optional: for better performance
# accelerate==0.24.1
# optimum==1.14.1
"""

# ================================
# USAGE EXAMPLES
# ================================

"""
API Usage Examples:

1. Add an ad:
curl -X POST "http://localhost:8000/add-ad" \
  -F "ad_creative=@your_image.jpg" \
  -F "text=Your amazing ad caption here!"

2. Get relevant ads:
curl -X POST "http://localhost:8000/get-relevant-ads" \
  -H "Content-Type: application/json" \
  -d '{"content": "technology news article", "top_k": 5}'

3. Get current trends:
curl -X GET "http://localhost:8000/trends/current"

4. Refresh trends cache:
curl -X POST "http://localhost:8000/trends/refresh"

5. Get ads statistics:
curl -X GET "http://localhost:8000/ads/stats"

6. Health check:
curl -X GET "http://localhost:8000/health"
"""