"""
Enhanced Content Analyzer using DistilBERT for Prachaar.AI
Implements the cookieless predictive engine as specified in the proposal
"""

from bs4 import BeautifulSoup
from chromadb import logger
from langdetect import detect, DetectorFactory
import requests
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification
from transformers import pipeline
import torch
import re
import logging
import numpy as np
from sentence_transformers import SentenceTransformer

# Ensure consistent language detection
DetectorFactory.seed = 0

class DistilBertContentAnalyzer:
    def __init__(self):
        """Initialize the DistilBERT-powered content analyzer"""
        self.logger = logging.getLogger(__name__)

        try:
            # Load DistilBERT for sentiment and classification (as per proposal)
            self.sentiment_tokenizer = DistilBertTokenizer.from_pretrained("distilbert-base-uncased-finetuned-sst-2-english")
            self.sentiment_model = DistilBertForSequenceClassification.from_pretrained("distilbert-base-uncased-finetuned-sst-2-english")

            # Load sentence transformer for semantic analysis
            self.sentence_model = SentenceTransformer('all-MiniLM-L6-v2')

            # Zero-shot classification pipeline for content categorization
            self.classifier = pipeline("zero-shot-classification", 
                                     model="facebook/bart-large-mnli")

            self.logger.info("✅ DistilBERT models loaded successfully")

        except Exception as e:
            self.logger.warning(f"⚠️ Advanced models failed to load: {e}")
            # Fallback to basic models for hackathon demo
            self.use_fallback = True

        # Content categories for classification
        self.categories = [
            'technology', 'entertainment', 'wellness', 'finance', 
            'sports', 'education', 'food', 'fashion', 'automotive',
            'beauty', 'travel', 'news', 'gaming', 'business'
        ]

    def extract_content(self, url_or_text):
        """Extract content from URL or direct text input"""
        try:
            if url_or_text.startswith('http'):
                return self._extract_from_url(url_or_text)
            else:
                return self._process_direct_text(url_or_text)
        except Exception as e:
            self.logger.error(f"Content extraction failed: {str(e)}")
            return self._create_error_response(str(e))

    def _extract_from_url(self, url):
        """Extract content from URL with enhanced parsing"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            response = requests.get(url, headers=headers, timeout=15)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')

            # Enhanced content extraction targeting main content areas
            main_content = (
                soup.find('main') or 
                soup.find('article') or 
                soup.find('div', class_=re.compile(r'content|article|main', re.I)) or
                soup.find('div', id=re.compile(r'content|article|main', re.I)) or
                soup
            )

            # Remove unwanted elements
            for element in main_content(["script", "style", "nav", "footer", "header", "aside", "advertisement"]):
                element.decompose()

            # Extract title with priority order
            title = (
                soup.find('h1') or
                soup.find('title') or
                soup.find('meta', property='og:title') or
                soup.find('meta', name='title')
            )

            title_text = title.get_text().strip() if title and hasattr(title, 'get_text') else title.get('content', 'No title') if title else "Content Analysis"

            # Extract and clean text
            text = main_content.get_text()
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            cleaned_text = ' '.join(chunk for chunk in chunks if chunk and len(chunk) > 3)

            # Language detection
            language = detect(cleaned_text[:1000]) if len(cleaned_text) > 10 else 'en'

            return {
                'title': title_text,
                'text': cleaned_text,
                'language': language,
                'word_count': len(cleaned_text.split()),
                'url': url,
                'success': True
            }

        except Exception as e:
            return self._create_error_response(f"URL extraction failed: {str(e)}")

    def _process_direct_text(self, text):
        """Process directly provided text"""
        try:
            language = detect(text[:1000]) if len(text) > 10 else 'en'

            lines = text.strip().split('\n')
            title = lines[0] if lines else text[:100] + "..."

            return {
                'title': title,
                'text': text,
                'language': language,
                'word_count': len(text.split()),
                'url': None,
                'success': True
            }
        except Exception as e:
            return self._create_error_response(f"Text processing failed: {str(e)}")

    def analyze_content_with_distilbert(self, content):
        """Enhanced content analysis using DistilBERT as specified in proposal"""
        try:
            if not content.get('success', False):
                return {'error': 'Cannot analyze failed content extraction'}

            text = content['text']
            analysis_text = text[:2000] if len(text) > 2000 else text

            # DistilBERT sentiment analysis (as per proposal)
            sentiment = self._distilbert_sentiment_analysis(analysis_text)

            # Advanced category classification using zero-shot
            category_result = self._advanced_categorization(analysis_text)

            # Semantic embeddings for contextual matching
            embeddings = self._generate_semantic_embeddings(analysis_text)

            # Enhanced content metrics with DistilBERT insights
            metrics = self._calculate_enhanced_metrics(text, analysis_text)

            # Generate contextual summary
            summary = self._generate_contextual_summary(analysis_text)

            # Cookieless prediction features (as per proposal)
            cookieless_features = self._extract_cookieless_features(analysis_text, content)

            return {
                'title': content['title'],
                'summary': summary,
                'sentiment': sentiment,
                'category': category_result['name'],
                'category_confidence': category_result['confidence'],
                'semantic_embeddings': embeddings.tolist() if isinstance(embeddings, np.ndarray) else embeddings,
                'cookieless_features': cookieless_features,
                'metrics': metrics,
                'language': content['language'],
                'word_count': content['word_count'],
                'distilbert_processed': True,
                'success': True
            }

        except Exception as e:
            self.logger.error(f"DistilBERT analysis failed: {str(e)}")
            return {'error': f'Analysis failed: {str(e)}', 'success': False}

    def _distilbert_sentiment_analysis(self, text):
        """Advanced sentiment analysis using DistilBERT"""
        try:
            

            # Real DistilBERT processing
            inputs = self.sentiment_tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=512)

            with torch.no_grad():
                outputs = self.sentiment_model(**inputs)
                predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)

            # Map to sentiment labels (DistilBERT SST-2 model)
            negative_score = predictions[0][0].item()
            positive_score = predictions[0][1].item()

            if positive_score > negative_score:
                return {
                    'label': 'POSITIVE',
                    'score': positive_score,
                    'confidence': abs(positive_score - negative_score)
                }
            else:
                return {
                    'label': 'NEGATIVE', 
                    'score': negative_score,
                    'confidence': abs(positive_score - negative_score)
                }

        except Exception as e:
            self.logger.warning(f"DistilBERT sentiment failed: {e}")
            # Fallback
            return {'label': 'NEUTRAL', 'score': 0.5, 'confidence': 0.3, 'fallback': True}

    def _advanced_categorization(self, text):
        """Advanced categorization using zero-shot classification"""
        try:
            if hasattr(self, 'use_fallback'):
                # Simple keyword-based fallback
                category_keywords = {
                    'technology': ['AI', 'tech', 'computer', 'software', 'digital'],
                    'entertainment': ['movie', 'show', 'celebrity', 'music', 'gaming'],
                    'wellness': ['health', 'meditation', 'yoga', 'fitness'],
                    'finance': ['money', 'investment', 'crypto', 'bitcoin', 'trading'],
                }

                text_lower = text.lower()
                best_category = 'general'
                best_score = 0

                for category, keywords in category_keywords.items():
                    score = sum(1 for keyword in keywords if keyword.lower() in text_lower)
                    if score > best_score:
                        best_score = score
                        best_category = category

                confidence = min(best_score / 5.0, 1.0)
                return {'name': best_category, 'confidence': confidence}

            # Real zero-shot classification
            result = self.classifier(text[:500], self.categories)
            return {
                'name': result['labels'][0],
                'confidence': result['scores'][0]
            }

        except Exception as e:
            self.logger.warning(f"Advanced categorization failed: {e}")
            return {'name': 'general', 'confidence': 0.1}

    def _generate_semantic_embeddings(self, text):
        """Generate semantic embeddings for contextual matching"""
        try:
            if hasattr(self, 'use_fallback'):
                # Simple word frequency fallback
                words = text.lower().split()
                word_freq = {}
                for word in words:
                    word_freq[word] = word_freq.get(word, 0) + 1
                
                # Create simple embedding
                embedding = np.zeros(512)  # Match expected dimension
                top_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:50]
                for i, (_, freq) in enumerate(top_words):
                    if i < 512:
                        embedding[i] = freq
                return embedding

            # Real sentence transformer embeddings
            base_embeddings = self.sentence_model.encode(text[:500])
            # Pad or truncate to match expected dimension
            if len(base_embeddings) < 512:
                padding = np.zeros(512 - len(base_embeddings))
                return np.concatenate([base_embeddings, padding])
            else:
                return base_embeddings[:512]

        except Exception as e:
            logger.warning(f"Embedding generation failed: {e}")
            return np.zeros(512)  # Return zero embedding of correct dimension

    def _extract_cookieless_features(self, text, content):
        """Extract features for cookieless prediction as per proposal"""
        features = {
            # Textual context features
            'content_length': len(text),
            'sentence_count': len(re.findall(r'[.!?]+', text)),
            'avg_sentence_length': len(text.split()) / max(len(re.findall(r'[.!?]+', text)), 1),

            # Engagement indicators
            'exclamation_ratio': text.count('!') / max(len(text), 1),
            'question_ratio': text.count('?') / max(len(text), 1),
            'caps_word_ratio': len(re.findall(r'\b[A-Z]{2,}\b', text)) / max(len(text.split()), 1),

            # Content freshness (for prediction)
            'has_numbers': bool(re.search(r'\d+', text)),
            'has_dates': bool(re.search(r'\b(2024|2025|today|yesterday|tomorrow)\b', text.lower())),
            'has_urls': bool(re.search(r'http[s]?://', text)),

            # Semantic richness
            'unique_word_ratio': len(set(text.lower().split())) / max(len(text.split()), 1),
            'reading_time_minutes': len(text.split()) / 200,  # Average reading speed

            # Context signals
            'domain_context': content.get('url', '').split('/')[2] if content.get('url') else 'direct_input',
            'language_context': content.get('language', 'en')
        }

        return features

    def _calculate_enhanced_metrics(self, full_text, analysis_text):
        """Calculate enhanced content metrics"""
        return {
            'character_count': len(full_text),
            'word_count': len(full_text.split()),
            'paragraph_count': len(full_text.split('\n\n')),
            'avg_word_length': sum(len(word) for word in full_text.split()) / max(len(full_text.split()), 1),
            'lexical_diversity': len(set(full_text.lower().split())) / max(len(full_text.split()), 1),
            'reading_ease': self._calculate_reading_ease(analysis_text),
            'emotion_indicators': {
                'positive_words': len(re.findall(r'\b(amazing|great|excellent|wonderful|fantastic)\b', analysis_text.lower())),
                'negative_words': len(re.findall(r'\b(terrible|awful|bad|horrible|disaster)\b', analysis_text.lower())),
                'urgency_words': len(re.findall(r'\b(urgent|breaking|now|immediate|crisis)\b', analysis_text.lower()))
            }
        }

    def _calculate_reading_ease(self, text):
        """Simple reading ease calculation"""
        words = len(text.split())
        sentences = len(re.findall(r'[.!?]+', text))
        if sentences == 0:
            return 50

        avg_sentence_length = words / sentences
        # Simplified Flesch Reading Ease approximation
        ease = 206.835 - (1.015 * avg_sentence_length)
        return max(0, min(100, ease))

    def _generate_contextual_summary(self, text):
        """Generate contextual summary"""
        sentences = re.split(r'[.!?]+', text)
        meaningful_sentences = [s.strip() for s in sentences if len(s.strip()) > 30]

        if not meaningful_sentences:
            return text[:200] + "..." if len(text) > 200 else text

        # Take first and most informative sentences
        summary_sentences = meaningful_sentences[:3] if len(meaningful_sentences) >= 3 else meaningful_sentences
        summary = '. '.join(summary_sentences).strip()

        if len(summary) > 400:
            summary = summary[:397] + "..."

        return summary if summary else text[:200] + "..."

    def _create_error_response(self, error_msg):
        """Create standardized error response"""
        return {
            'title': 'Content Processing Error',
            'text': f'Error: {error_msg}',
            'language': 'en',
            'word_count': 0,
            'url': None,
            'success': False,
            'error': error_msg
        }

# Maintain compatibility with original interface
ContentAnalyzer = DistilBertContentAnalyzer
