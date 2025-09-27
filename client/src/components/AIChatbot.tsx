import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Bot, Send, X, Minimize2, Maximize2 } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

const WEBSITE_CONTEXT = `
You are an AI assistant for PRACHAAR AI, a platform that connects advertisers and publishers for programmatic advertising. 

Key features of this platform:
- Publisher Dashboard: Publishers can manage their ad inventory, view performance metrics, and optimize their content
- Advertiser Dashboard: Advertisers can create campaigns, set budgets, and track ad performance
- Matching Optimization: Advanced algorithms to match advertisers with the most relevant publishers
- Reports & Analytics: Comprehensive reporting tools for both publishers and advertisers
- Settings: User management and platform configuration

User roles:
- Publishers: Content creators and website owners who want to monetize their traffic
- Advertisers: Brands and agencies who want to reach their target audience

The platform focuses on programmatic advertising, real-time bidding, and performance optimization.

Please help users with questions about the platform, guide them through features, and provide assistance with their advertising needs.
`;

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your AI assistant for PRACHAAR AI. How can I help you with our advertising platform today?',
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_API_KEY;
      console.log('API Key loaded:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT FOUND');
      
      if (!apiKey) {
        throw new Error('API_KEY not found in environment variables');
      }
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      // Prepare the full prompt with context and conversation history
      const conversationHistory = messages.map(m => `${m.role}: ${m.content}`).join('\n');
      const fullPrompt = `${WEBSITE_CONTEXT}\n\nCurrent conversation:\n${conversationHistory}\n\nUser: ${userMessage.content}`;

      const result = await model.generateContentStream(fullPrompt);
      let fullResponse = '';

      // Add a placeholder message for streaming
      const streamingMessageId = 'streaming';
      setMessages(prev => [...prev, {
        id: streamingMessageId,
        content: '',
        role: 'assistant',
        timestamp: new Date()
      }]);

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;
        
        // Update the streaming message in real-time
        setMessages(prev => 
          prev.map(msg => 
            msg.id === streamingMessageId 
              ? { ...msg, content: fullResponse }
              : msg
          )
        );
      }

      // Finalize the message with a proper ID
      setMessages(prev => 
        prev.map(msg => 
          msg.id === streamingMessageId 
            ? { ...msg, id: (Date.now() + 1).toString() }
            : msg
        )
      );
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      let errorContent = 'Sorry, I\'m having trouble connecting to the AI service. Please try again later.';
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('API_KEY')) {
          errorContent = 'API key issue detected. Please check your Gemini API key configuration.';
        } else if (error.message.includes('quota') || error.message.includes('limit')) {
          errorContent = 'API quota exceeded. Please check your Gemini API usage limits.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorContent = 'Network connection issue. Please check your internet connection.';
        } else {
          errorContent = `Error: ${error.message}`;
        }
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: errorContent,
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Window */}
      {isOpen && (
        <Card className={`w-80 h-96 bg-background border shadow-lg transition-all duration-300 ${
          isMinimized ? 'h-12' : ''
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-primary/5">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm">AI Assistant</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMinimize}
                className="h-6 w-6 p-0"
              >
                {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleChat}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 h-64 p-3">
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted text-muted-foreground rounded-lg px-3 py-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          Thinking...
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about PRACHAAR AI..."
                    disabled={isLoading}
                    className="flex-1 text-sm"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    size="sm"
                    className="px-3"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      )}

      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={toggleChat}
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90"
          size="lg"
        >
          <Bot className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}
