# Gemini AI Chatbot Setup

## Setup Instructions

1. **Get your Gemini API Key:**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the API key

2. **Update Environment Variable:**
   - Open the `.env` file in the client directory
   - Replace `your_gemini_api_key_here` with your actual Gemini API key:
   ```
   VITE_API_KEY=your_actual_gemini_api_key_here
   ```

3. **Start the Application:**
   ```bash
   npm run dev
   ```

## Features

- ✅ Floating chatbot button in bottom right corner
- ✅ Minimize/maximize functionality
- ✅ Real-time streaming responses from Gemini AI
- ✅ Context-aware responses about PRACHAAR AI platform
- ✅ Message history and conversation flow
- ✅ Responsive design with modern UI

## Usage

1. Click the floating bot icon in the bottom right corner
2. The chatbot window will open
3. Ask questions about the PRACHAAR AI platform
4. The AI assistant will respond with context about your advertising platform
5. Use the minimize button to collapse the chat while keeping it accessible
6. Use the X button to close the chat completely

The chatbot is now integrated into your dashboard layout and will appear on all pages within the dashboard.
