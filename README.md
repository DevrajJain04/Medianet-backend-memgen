# AI Meme Generator

An intelligent meme generator powered by Google's Gemini AI that creates hilarious memes from your text input and optional images.

## Features

🤖 **AI-Powered Text Generation**: Uses Google Gemini AI to generate witty, contextual meme text
📸 **Image Analysis**: Upload your own images for context-aware meme generation  
🎨 **Template Library**: Access to 100+ popular meme templates from Imgflip
🎯 **Smart Template Selection**: AI chooses the best template based on your input
💾 **Download Generated Memes**: Save your creations as high-quality images
🔄 **Batch Processing**: Generate multiple variations quickly

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure API Key

1. Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Add your API key to `.env`:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

### 3. Run the Application

```bash
python main.py
```

The API will be available at `http://localhost:8000`

## API Endpoints

### 🏠 Health Check

- **GET** `/` - Check if the API is running

### 📋 Get Templates

- **GET** `/templates` - List available meme templates

### 🎭 Generate Meme

- **POST** `/generate-meme` - Generate a meme
  - `text_input` (required): Your text/context for meme generation
  - `template_id` (optional): Specific template ID (random selection if not provided)
  - `user_image` (optional): Upload an image for context

### 🖼️ Analyze Image

- **POST** `/analyze-image` - Analyze an uploaded image for meme potential
  - `image` (required): Image file to analyze
  - `context` (optional): Additional context

### 📥 Download Meme

- **GET** `/download/{filename}` - Download generated meme

## Usage Examples

### Basic Text Meme Generation

```bash
curl -X POST "http://localhost:8000/generate-meme" \
  -F "text_input=When you finally understand async/await in Python"
```

### Generate with Specific Template

```bash
curl -X POST "http://localhost:8000/generate-meme" \
  -F "text_input=Monday morning meetings" \
  -F "template_id=181913649"
```

### Generate with Image Context

```bash
curl -X POST "http://localhost:8000/generate-meme" \
  -F "text_input=My reaction when code works on first try" \
  -F "user_image=@your_reaction_image.jpg"
```

## How It Works

1. **Input Processing**: Takes your text input and optional image
2. **AI Analysis**: Gemini AI analyzes the context and generates relevant meme text
3. **Template Selection**: Chooses the most appropriate meme template
4. **Image Generation**: Overlays AI-generated text onto the template
5. **Output**: Returns the generated meme with download link

## Meme Text Generation

The AI generates contextual text including:

- **Top Text**: Classic meme header text
- **Bottom Text**: Punchline or conclusion
- **Single Text**: For simple, centered text memes
- **Style Tags**: Categorizes humor style (sarcastic, relatable, trending)

## Popular Templates Included

- Drake Hotline Bling
- Distracted Boyfriend
- Two Buttons
- Expanding Brain
- Change My Mind
- Woman Yelling At Cat
- This Is Fine
- And 90+ more!

## Project Structure

```
MemeGen/
├── main.py              # Main FastAPI application
├── requirements.txt     # Python dependencies
├── .env.example        # Environment configuration template
├── memes.json          # Meme templates data
├── images/             # Downloaded meme templates
├── generated/          # Generated memes output
└── README.md           # This file
```

## Error Handling

The application includes robust error handling for:

- Missing API keys
- Template not found
- Image processing errors
- AI generation failures
- Network connectivity issues

## Contributing

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational and entertainment purposes. Meme templates are sourced from Imgflip's public API.

---

**Happy Meme Generating! 🎉**
