# Prachaar AI - Complete Backend Monolith Service
# FastAPI service with 3 main endpoints for ad management and matching

import os
import io
import base64
import hashlib
from datetime import datetime
from typing import Optional, List, Dict, Any
import json
import asyncio
from pathlib import Path

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
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/")
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

# ================================
# PYDANTIC MODELS FOR API
# ================================

class AdCreativeResponse(BaseModel):
    """Response model for add-ad endpoint"""
    ad_id: str
    creativity_score: float
    vitality_score: float
    message: str

class GenerateAdRequest(BaseModel):
    """Request model for generate-ad endpoint"""
    topic: Optional[str] = None
    style: Optional[str] = "meme"

class GenerateAdResponse(BaseModel):
    """Response model for generate-ad endpoint"""
    ad_id: str
    image_url: str
    caption: str
    trends_used: List[str]
    message: str

class RelevantAdsRequest(BaseModel):
    """Request model for get-relevant-ads endpoint"""
    content: str
    top_k: Optional[int] = 10

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
    """Calculate vitality/virality score using AI models and advanced content analysis"""
    try:
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
        
        # Semantic analysis using CLIP for viral potential
        clip_inputs = clip_processor(text=[text], images=None, return_tensors="pt", padding=True)
        
        with torch.no_grad():
            text_features = clip_model.get_text_features(clip_inputs['input_ids'])
            
            # Define viral concept embeddings (you could expand this list)
            viral_concepts = [
                "trending viral content", "amazing discovery", "shocking revelation", 
                "incredible moment", "unbelievable event", "breaking news",
                "exclusive content", "must see", "going viral", "social media buzz"
            ]
            
            viral_inputs = clip_processor(text=viral_concepts, images=None, return_tensors="pt", padding=True)
            viral_features = clip_model.get_text_features(viral_inputs['input_ids'])
            
            # Calculate similarity to viral concepts
            similarity_scores = torch.cosine_similarity(text_features, viral_features, dim=1)
            viral_similarity = torch.mean(similarity_scores).item()
            viral_concept_score = max(0, viral_similarity)  # Ensure positive
        
        # Advanced text features for virality
        words = text.lower().split()
        
        # Emotional punctuation analysis
        emotional_punctuation = text.count('!') + text.count('?') * 0.8 + text.count('...') * 0.6
        punctuation_score = min(emotional_punctuation / len(text) * 20, 1.0) if text else 0
        
        # Capitalization for emphasis (but not excessive)
        caps_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
        caps_score = min(caps_ratio * 10, 1.0) if caps_ratio < 0.3 else max(0, 1.0 - caps_ratio)
        
        # Urgency and action words analysis using CLIP
        action_words = [
            "now", "today", "urgent", "breaking", "new", "latest", "first time",
            "exclusive", "limited", "special", "amazing", "incredible", "shocking"
        ]
        action_count = sum(1 for word in action_words if word in text.lower())
        action_score = min(action_count / 5.0, 1.0)
        
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
            skin_tone_ranges = [
                ([0, 20, 70], [20, 255, 255]),    # Light skin in HSV
                ([0, 48, 80], [20, 255, 255])     # Darker skin in HSV
            ]
            # This is a very basic approximation
            face_proxy_score = min(np.mean(img_array[:,:,0]) / 200.0, 0.3)  # Simple heuristic
            
        else:  # Grayscale
            brightness = np.mean(img_array) / 255.0
            optimal_brightness = 1.0 - abs(brightness - 0.5) / 0.5
            contrast_score = min(np.std(img_array) / 128.0, 1.0)
            saturation_score = 0.3  # Moderate score for grayscale
            face_proxy_score = 0.2  # Lower score for grayscale
        
        # Combine all vitality metrics with weighted average
        vitality_score = (
            emotional_score * 0.15 +           # DistilBERT emotional intensity
            activation_score * 0.15 +          # Model activation strength
            viral_concept_score * 0.20 +       # CLIP similarity to viral concepts
            punctuation_score * 0.10 +         # Emotional punctuation
            caps_score * 0.10 +               # Strategic capitalization
            action_score * 0.10 +             # Action/urgency words
            optimal_brightness * 0.05 +        # Visual brightness appeal
            contrast_score * 0.05 +           # Visual contrast
            saturation_score * 0.05 +         # Color vibrancy
            face_proxy_score * 0.05           # Human element (very basic)
        )
        
        return float(min(max(vitality_score, 0.0), 1.0))  # Clamp between 0 and 1
        
    except Exception as e:
        logger.error(f"Error calculating vitality score: {e}")
        return 0.5  # Default score

def get_trending_topics(limit: int = 5) -> List[str]:
    """Get trending topics using PyTrends"""
    try:
        pytrends = TrendReq(hl='en-US', tz=360)
        trending_searches = pytrends.trending_searches(pn='united_states')
        return trending_searches[0].head(limit).tolist()
    except Exception as e:
        logger.error(f"Error fetching trends: {e}")
        # Return some default trending topics
        return ["AI", "technology", "memes", "social media", "innovation"]

async def generate_meme_with_gemini(topic: str, trends: List[str]) -> Dict[str, str]:
    """Generate meme concept using Gemini API (mocked for now)"""
    try:
        # This is where we would use Gemini API
        # For now, return a mocked response
        mock_response = {
            "image_url": f"https://imgflip.com/i/mock_meme_{hashlib.md5(topic.encode()).hexdigest()[:8]}",
            "caption": f"When {topic} meets {trends[0]} - the ultimate combination! 😂",
            "template_used": "Drake Pointing"
        }
        
        logger.info(f"Generated meme concept for topic: {topic}")
        return mock_response
        
    except Exception as e:
        logger.error(f"Error generating meme with Gemini: {e}")
        return {
            "image_url": "https://imgflip.com/i/default_meme",
            "caption": f"Something trending about {topic}!",
            "template_used": "Generic"
        }

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
    - Returns creativity and vitality scores
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
        
        # Calculate scores
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

@app.post("/generate-ad", response_model=GenerateAdResponse)
async def generate_ad(request: GenerateAdRequest):
    """
    Endpoint 2: Generate advertisement using trending topics
    - Uses PyTrends to get current trending topics
    - Uses Gemini API to generate meme/ad concept
    - Integrates with ImgFlip API to create actual meme (mocked for now)
    - Stores generated ad in the system
    """
    try:
        logger.info(f"Generating ad for topic: {request.topic}")
        
        # Get trending topics
        trending_topics = get_trending_topics(limit=5)
        logger.info(f"Current trending topics: {trending_topics}")
        
        # Determine topic to use
        if request.topic:
            main_topic = request.topic
        else:
            main_topic = trending_topics[0] if trending_topics else "viral content"
        
        # Generate meme concept using Gemini (mocked)
        meme_data = await generate_meme_with_gemini(main_topic, trending_topics)
        
        # Generate ad ID for the generated content
        content_string = f"{main_topic}_{meme_data['caption']}_{datetime.now().isoformat()}"
        ad_id = f"generated_ad_{hashlib.md5(content_string.encode()).hexdigest()[:12]}"
        
        # Store generated ad metadata in MongoDB (if available)
        if mongodb_db is not None:
            generated_ad_document = {
                "ad_id": ad_id,
                "file_type": "generated_image",
                "filename": f"generated_meme_{ad_id}.jpg",
                "caption": meme_data['caption'],
                "image_url": meme_data['image_url'],
                "template_used": meme_data.get('template_used', 'Unknown'),
                "main_topic": main_topic,
                "trends_used": trending_topics,
                "generated": True,
                "created_at": datetime.now().isoformat()
            }
            
            mongodb_db.generated_ads.insert_one(generated_ad_document)
            logger.info(f"Generated ad metadata stored in MongoDB")
        else:
            logger.info("MongoDB not available - generated ad metadata not stored")
        
        logger.info(f"Successfully generated ad {ad_id}")
        
        return GenerateAdResponse(
            ad_id=ad_id,
            image_url=meme_data['image_url'],
            caption=meme_data['caption'],
            trends_used=trending_topics,
            message="Ad generated successfully using current trends"
        )
        
    except Exception as e:
        logger.error(f"Error in generate_ad endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/get-relevant-ads", response_model=RelevantAdsResponse)
async def get_relevant_ads(request: Request):
    """
    Endpoint 3: Get relevant ads for publisher content
    - Takes publisher content as input (supports both JSON and form data)
    - Generates embeddings using sentence transformer
    - Matches against stored ad embeddings in ChromaDB
    - Returns top-k most relevant ads with metadata
    
    Accepts either:
    1. JSON body: {"content": "text", "top_k": 10}
    2. Form data: content=text&top_k=10
    """
    try:
        content_type = request.headers.get("content-type", "").lower()
        
        if "application/json" in content_type:
            # Handle JSON request
            try:
                body = await request.json()
                publisher_content = body.get("content")
                k_value = body.get("top_k", 10)
                
                if not publisher_content:
                    raise HTTPException(status_code=400, detail="Missing 'content' field in JSON body")
                    
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Invalid JSON body: {str(e)}")
                
        elif "application/x-www-form-urlencoded" in content_type:
            # Handle form data request
            try:
                form_data = await request.form()
                publisher_content = form_data.get("content")
                k_value = int(form_data.get("top_k", 10))
                
                if not publisher_content:
                    raise HTTPException(status_code=400, detail="Missing 'content' field in form data")
                    
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid top_k value, must be integer")
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Invalid form data: {str(e)}")
        else:
            raise HTTPException(
                status_code=400, 
                detail="Content-Type must be either 'application/json' or 'application/x-www-form-urlencoded'"
            )
        
        logger.info(f"Finding relevant ads for content: {publisher_content[:100]}... (top_k={k_value})")
        
        # Generate embedding for the publisher content using CLIP (same as ad embeddings)
        # For text-only content, we'll use CLIP's text encoder
        inputs = clip_processor(text=[publisher_content], images=None, return_tensors="pt", padding=True)
        
        with torch.no_grad():
            # Get text embeddings from CLIP
            text_features = clip_model.get_text_features(inputs['input_ids'])
            # Normalize the embeddings
            text_features = text_features / text_features.norm(dim=1, keepdim=True)
            content_embedding = text_features.numpy().flatten().tolist()
        
        # Query ChromaDB for similar ads
        similarity_threshold = 0.1  # 10% threshold as requested
        
        results = chroma_collection.query(
            query_embeddings=[content_embedding],
            n_results=k_value,
            include=["metadatas", "distances"]
        )
        
        relevant_ads = []
        
        if results['ids'] and len(results['ids'][0]) > 0:
            # Get detailed metadata from MongoDB for each relevant ad (if MongoDB is available)
            for i, ad_id in enumerate(results['ids'][0]):
                # Check similarity threshold (distance < threshold means more similar)
                similarity_distance = results['distances'][0][i]
                similarity_score = 1 - similarity_distance  # Convert distance to similarity
                
                if similarity_score >= similarity_threshold:
                    if mongodb_db is not None:
                        # Get full metadata from MongoDB
                        ad_metadata = mongodb_db.ads_metadata.find_one({"ad_id": ad_id})
                        
                        if ad_metadata:
                            # Remove MongoDB ObjectId for serialization
                            ad_metadata.pop('_id', None)
                            relevant_ads.append(AdMetadata(**ad_metadata))
                    else:
                        # Use metadata from ChromaDB only
                        chroma_metadata = results['metadatas'][0][i]
                        mock_ad_metadata = {
                            "ad_id": ad_id,
                            "file_type": chroma_metadata.get('file_type', 'unknown'),
                            "caption": chroma_metadata.get('caption', ''),
                            "creativity_score": chroma_metadata.get('creativity_score', 0.5),
                            "vitality_score": chroma_metadata.get('vitality_score', 0.5),
                            "created_at": chroma_metadata.get('created_at', datetime.now().isoformat()),
                            "file_data": ""  # No file data available without MongoDB
                        }
                        relevant_ads.append(AdMetadata(**mock_ad_metadata))
        
        logger.info(f"Found {len(relevant_ads)} relevant ads above threshold")
        
        return RelevantAdsResponse(
            ads=relevant_ads,
            total_found=len(relevant_ads),
            similarity_threshold=similarity_threshold
        )
        
    except Exception as e:
        logger.error(f"Error in get_relevant_ads endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# ================================
# ADDITIONAL UTILITY ENDPOINTS
# ================================

@app.get("/ads/stats")
async def get_ads_stats():
    """Get statistics about stored ads"""
    try:
        if mongodb_db is not None:
            total_ads = mongodb_db.ads_metadata.count_documents({})
            total_generated_ads = mongodb_db.generated_ads.count_documents({})
        else:
            total_ads = 0
            total_generated_ads = 0
        
        total_embeddings = chroma_collection.count()
        
        return {
            "total_uploaded_ads": total_ads,
            "total_generated_ads": total_generated_ads,
            "total_embeddings": total_embeddings,
            "mongodb_status": "connected" if mongodb_db is not None else "disconnected",
            "database_status": "healthy"
        }
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving statistics")

@app.get("/ads/{ad_id}")
async def get_ad_by_id(ad_id: str):
    """Get specific ad by ID"""
    try:
        ad_data = None
        
        if mongodb_db is not None:
            ad_data = mongodb_db.ads_metadata.find_one({"ad_id": ad_id})
            if not ad_data:
                # Check generated ads collection
                ad_data = mongodb_db.generated_ads.find_one({"ad_id": ad_id})
        
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
            result1 = mongodb_db.ads_metadata.delete_one({"ad_id": ad_id})
            result2 = mongodb_db.generated_ads.delete_one({"ad_id": ad_id})
            deleted_count = result1.deleted_count + result2.deleted_count
        
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

# ================================
# RUN THE APPLICATION
# ================================

if __name__ == "__main__":
    uvicorn.run(
        "main:app",  # Assuming this file is named main.py
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