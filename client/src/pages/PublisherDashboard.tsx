import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useUser } from "@/contexts/UserContext";
import { ExternalLink, Eye } from "lucide-react";

type Suggestion = {
  id: string;
  title: string;
  description: string;
  image: string;
};

type PreviewMode = 'iframe';

const HARDCODED_SUGGESTIONS: Suggestion[] = [
  { id: '1', title: 'Tech Deep Dive', description: 'Long-form analysis on AI trends for Q4.', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200' },
  { id: '2', title: 'Gaming Spotlight', description: 'Feature piece on mobile esports growth.', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200' },
  { id: '3', title: 'Fintech Weekly', description: 'Roundup of fintech funding news.', image: 'https://images.unsplash.com/photo-1554224155-3a589877462f?q=80&w=1200' },
  { id: '4', title: 'HealthTech Report', description: 'Wearables adoption across regions.', image: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?q=80&w=1200' },
  { id: '5', title: 'EdTech Insights', description: 'Microlearning content formats that convert.', image: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=1200' },
  { id: '6', title: 'SaaS Benchmarks', description: 'Churn and LTV metrics overview.', image: 'https://images.unsplash.com/photo-1551281044-8a5d1b6b9a3b?q=80&w=1200' },
  { id: '7', title: 'AdOps Tips', description: 'Header bidding optimization checklist.', image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1200' },
  { id: '8', title: 'Creator Economy', description: 'Monetization paths for niche creators.', image: 'https://images.unsplash.com/photo-1529101091764-c3526daf38fe?q=80&w=1200' },
  { id: '9', title: 'B2B Lead Gen', description: 'Whitepaper strategy for enterprise funnels.', image: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=1200' },
  { id: '10', title: 'Privacy Updates', description: 'Compliance checklist for 2025 policies.', image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1200' },
];

export default function PublisherDashboard() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [iframeError, setIframeError] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('iframe');
  const [droppedItems, setDroppedItems] = useState<Suggestion[]>([]);
  const [canEmbed, setCanEmbed] = useState<boolean | null>(null);
  const [isLoadingCheck, setIsLoadingCheck] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [websiteData, setWebsiteData] = useState<{
    title?: string;
    description?: string;
    images?: Array<{
      src: string;
      alt: string;
      width: number;
      height: number;
      x: number;
      y: number;
      index: number;
    }>;
    content?: string;
    html?: string;
    styles?: Array<{type: string; content?: string; href?: string}>;
    metadata?: {
      title?: string;
      description?: string;
      viewport?: string;
      canonical?: string;
    };
    contentAreas?: Array<{
      selector: string;
      index: number;
      x: number;
      y: number;
      width: number;
      height: number;
      tagName: string;
      className: string;
      id: string;
    }>;
    screenshot?: string;
  } | null>(null);
  const { token } = useUser();
  const { toast } = useToast();

  // Extract URL from prompt text
  const extractUrl = (text: string): string | null => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex);
    return matches ? matches[0] : null;
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: 'Please enter some context.', variant: 'destructive' });
      return;
    }
    const url = extractUrl(prompt);
    setPreviewUrl(url);
    setIsLoading(true);
    try {
      // Attempt backend call; ignore response and use hardcoded data for now
      await api('/api/publisher/suggestions', { method: 'POST', token, body: { prompt } }).catch(() => undefined);
    } finally {
      setSuggestions(HARDCODED_SUGGESTIONS);
      setSelected({});
      setIsLoading(false);
    }
  };

  const numSelected = Object.values(selected).filter(Boolean).length;

  // Reset iframe error when preview opens
  useEffect(() => {
    if (showPreview) {
      setIframeError(false);
      setShowFallback(false);
      setDroppedItems([]);
      // Set a timeout to show fallback if iframe doesn't load
      const timer = setTimeout(() => {
        setIframeError(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showPreview]);

  // Handle drag start for suggestions
  const handleDragStart = (suggestion: Suggestion) => {
    setIsDragging(true);
    console.log('Starting drag for:', suggestion.title);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false);
    console.log('Drag ended');
  };

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'CONTENT_DROPPED') {
        toast({
          title: 'Content added to website!',
          description: `"${event.data.item.title}" was placed on the website.`,
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [toast]);

  // Global drag event listeners
  useEffect(() => {
    const handleGlobalDragStart = () => {
      console.log('Global drag start detected');
    };

    const handleGlobalDragEnd = () => {
      console.log('Global drag end detected');
      setIsDragging(false);
    };

    document.addEventListener('dragstart', handleGlobalDragStart);
    document.addEventListener('dragend', handleGlobalDragEnd);

    return () => {
      document.removeEventListener('dragstart', handleGlobalDragStart);
      document.removeEventListener('dragend', handleGlobalDragEnd);
    };
  }, []);

  const handleIframeError = () => {
    setIframeError(true);
    setCanEmbed(false);
    // Automatically try screenshot approach when iframe fails
    if (previewUrl) {
      loadWebsiteScreenshot(previewUrl);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    if (data) {
      try {
        const suggestion = JSON.parse(data);
        setDroppedItems(prev => [...prev, suggestion]);
        toast({ 
          title: 'Suggestion added!', 
          description: `"${suggestion.title}" was placed on the preview.` 
        });
      } catch (error) {
        console.error('Error parsing dropped data:', error);
      }
    }
  };

  const loadWebsite = async (url: string) => {
    setIsLoadingCheck(true);
    try {
      // First try iframe approach
      setPreviewUrl(url);
      setCanEmbed(null);
      setPreviewMode('iframe');
    } catch (error) {
      console.error('Website load error:', error);
      setCanEmbed(false);
    } finally {
      setIsLoadingCheck(false);
    }
  };

  const loadWebsiteScreenshot = async (url: string) => {
    setIsLoadingCheck(true);
    try {
      const response = await api('/api/proxy/screenshot', {
        method: 'POST',
        token,
        body: { url }
      }) as { success: boolean; title?: string; description?: string; images?: string[]; content?: string; error?: string };
      
      if (response.success) {
        setWebsiteData({
          title: response.title,
          description: response.description,
          content: response.content,
          images: response.images?.map((img: string, index: number) => ({
            src: img,
            alt: `Website image ${index + 1}`,
            width: 0,
            height: 0,
            x: 0,
            y: 0,
            index
          }))
        });
        setCanEmbed(false); // We're using screenshot mode
        setPreviewMode('iframe'); // We'll render it in iframe as HTML
        toast({
          title: 'Website loaded via screenshot mode',
          description: 'This website blocks iframe embedding, so we\'ve created a preview version.',
        });
      } else {
        throw new Error(response.error || 'Failed to fetch website');
      }
    } catch (error) {
      console.error('Screenshot fetch error:', error);
      toast({
        title: 'Failed to load website',
        description: error instanceof Error ? error.message : 'Could not load the website',
        variant: 'destructive'
      });
      setCanEmbed(false);
    } finally {
      setIsLoadingCheck(false);
    }
  };

  const loadWebsitePreview = async (url: string) => {
    setIsLoadingCheck(true);
    try {
      const response = await api('/api/proxy/preview', {
        method: 'POST',
        token,
        body: { url }
      }) as { 
        success: boolean; 
        html?: string; 
        styles?: Array<{type: string; content?: string; href?: string}>; 
        metadata?: {
          title?: string;
          description?: string;
          viewport?: string;
          canonical?: string;
        }; 
        images?: Array<{
          src: string;
          alt: string;
          width: number;
          height: number;
          x: number;
          y: number;
          index: number;
        }>; 
        contentAreas?: Array<{
          selector: string;
          index: number;
          x: number;
          y: number;
          width: number;
          height: number;
          tagName: string;
          className: string;
          id: string;
        }>; 
        screenshot?: string; 
        fallback?: boolean;
        error?: string 
      };
      
      if (response.success) {
        setWebsiteData({
          title: response.metadata?.title,
          description: response.metadata?.description,
          html: response.html,
          styles: response.styles,
          metadata: response.metadata,
          images: response.images,
          contentAreas: response.contentAreas,
          screenshot: response.screenshot
        });
        setCanEmbed(false); // We're using headless browser mode
        setPreviewMode('iframe');
        toast({
          title: response.fallback ? 'Website loaded with fallback method' : 'Website loaded with full HTML/CSS',
          description: response.fallback 
            ? 'Headless browser failed, but website content was loaded using fallback method. Carousel placement may be limited.'
            : 'Full website content loaded with headless browser. You can now place carousels.',
          variant: response.fallback ? 'default' : 'default'
        });
      } else {
        throw new Error(response.error || 'Failed to fetch website preview');
      }
    } catch (error) {
      console.error('Preview fetch error:', error);
      toast({
        title: 'Failed to load website preview',
        description: error instanceof Error ? error.message : 'Could not load the website preview',
        variant: 'destructive'
      });
      setCanEmbed(false);
    } finally {
      setIsLoadingCheck(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Publisher Suggestions</h1>
        <p className="text-muted-foreground mt-1">Describe what you want to promote. We’ll propose content opportunities.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Describe your intent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Write goals, audience, tone, and any constraints..."
            className="min-h-[160px]"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Minimum 3 selections required after generation</span>
            <Button onClick={handleGenerate} className="bg-gradient-publisher hover:opacity-90" disabled={isLoading}>
              {isLoading ? 'Generating...' : 'Generate Suggestions'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Suggestions ({numSelected} selected)</CardTitle>
          </CardHeader>
          <CardContent>
            <Carousel className="w-full">
              <CarouselContent>
                {suggestions.map((s) => (
                  <CarouselItem key={s.id} className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-2">
                      <div className="overflow-hidden rounded-lg border bg-card">
                        <div className="h-40 w-full bg-muted overflow-hidden">
                          <img src={s.image} alt={s.title} className="h-full w-full object-cover" />
                        </div>
                        <div className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="font-medium">{s.title}</h3>
                              <p className="text-xs text-muted-foreground">{s.description}</p>
                            </div>
                            <Checkbox
                              checked={!!selected[s.id]}
                              onCheckedChange={(v) => setSelected((prev) => ({ ...prev, [s.id]: !!v }))}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {previewUrl && (
                  <Dialog open={showPreview} onOpenChange={setShowPreview}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Preview Website
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-6xl h-[80vh]">
                      <DialogHeader>
                        <DialogTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                          <ExternalLink className="w-4 h-4" />
                          Website Preview
                          </div>
                          {previewUrl && canEmbed === null && (
                            <div className="flex flex-col gap-2">
                              <div className="text-xs text-muted-foreground mb-2">
                                Choose how to load the website:
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => loadWebsite(previewUrl)}
                                  disabled={isLoadingCheck}
                                  variant="outline"
                                >
                                  {isLoadingCheck ? 'Loading...' : 'Try Iframe (May Block)'}
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => loadWebsitePreview(previewUrl)}
                                  disabled={isLoadingCheck}
                                  className="bg-gradient-publisher hover:opacity-90"
                                >
                                  {isLoadingCheck ? 'Loading...' : 'Load with Headless Browser (Recommended)'}
                                </Button>
                              </div>
                            </div>
                          )}
                          {previewUrl && canEmbed === false && !websiteData && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => loadWebsiteScreenshot(previewUrl)}
                                disabled={isLoadingCheck}
                                variant="outline"
                              >
                                {isLoadingCheck ? 'Loading...' : 'Try Screenshot Mode'}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => loadWebsitePreview(previewUrl)}
                                disabled={isLoadingCheck}
                                className="bg-gradient-publisher hover:opacity-90"
                              >
                                {isLoadingCheck ? 'Loading...' : 'Load with Headless Browser'}
                              </Button>
                            </div>
                          )}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="flex-1 flex gap-4 h-full">
                        <div className="flex-1 border rounded-lg overflow-hidden relative">
                          {previewMode === 'iframe' && !iframeError ? (
                            <div className="relative w-full h-full">
                              {websiteData ? (
                                <div className="w-full h-full bg-white overflow-auto">
                                  <div className="p-4">
                                    <h1 className="text-2xl font-bold mb-2">{websiteData.title}</h1>
                                    {websiteData.description && (
                                      <p className="text-gray-600 mb-4">{websiteData.description}</p>
                                    )}
                                    <div 
                                      className="prose max-w-none"
                                      dangerouslySetInnerHTML={{ __html: websiteData.content }}
                                    />
                                    {websiteData.images && websiteData.images.length > 0 && (
                                      <div className="mt-6">
                                        <h3 className="text-lg font-semibold mb-3">Website Images</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                          {websiteData.images.slice(0, 6).map((img, index: number) => (
                                            <img 
                                              key={index} 
                                              src={img.src} 
                                              alt={img.alt}
                                              className="w-full h-32 object-cover rounded"
                                              onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                              }}
                                            />
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <iframe
                                  src={previewUrl}
                                  className="w-full h-full bg-white"
                                  title="Website Preview"
                                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                                  style={{ backgroundColor: 'white' }}
                                  onError={handleIframeError}
                                  onLoad={() => {
                                    setIframeError(false);
                                    setCanEmbed(true);
                                  }}
                                />
                              )}
                              {/* Drag overlay for iframe */}
                              <div 
                                className="drag-overlay-iframe absolute inset-0 z-10"
                                style={{
                                  pointerEvents: isDragging ? 'all' : 'none',
                                  background: isDragging ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                  border: isDragging ? '2px dashed #3b82f6' : 'none',
                                  cursor: isDragging ? 'crosshair' : 'default'
                                }}
                                onDrop={(e) => {
                                  console.log('Drop event triggered!', e);
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const data = e.dataTransfer.getData('text/plain');
                                  console.log('Drop data:', data);
                                  if (data) {
                                    try {
                                      const suggestion = JSON.parse(data);
                                      console.log('Parsed suggestion:', suggestion);
                                      setDroppedItems(prev => [...prev, suggestion]);
                                      toast({
                                        title: 'Content added to website!',
                                        description: `"${suggestion.title}" was placed on the website.`,
                                      });
                                    } catch (error) {
                                      console.error('Error parsing dropped data:', error);
                                    }
                                  } else {
                                    console.log('No data found in drop event');
                                  }
                                  handleDragEnd();
                                }}
                                onDragOver={(e) => {
                                  console.log('Dragging over iframe');
                                  e.preventDefault();
                                  e.stopPropagation();
                                  e.dataTransfer.dropEffect = 'move';
                                }}
                                onDragEnter={(e) => {
                                  console.log('Drag entered iframe');
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                onDragLeave={(e) => {
                                  console.log('Drag left iframe');
                                }}
                              />
                            </div>
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center p-8 text-center">
                              <ExternalLink className="w-12 h-12 text-muted-foreground mb-4" />
                              <h3 className="text-lg font-semibold mb-2">Website Cannot Be Embedded</h3>
                              <p className="text-sm text-muted-foreground mb-4">
                                This website blocks iframe embedding for security reasons.
                              </p>
                              <Button 
                                onClick={() => window.open(previewUrl, '_blank')}
                                className="bg-gradient-publisher hover:opacity-90"
                              >
                                Open in New Tab
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className="w-80 border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                          <h4 className="font-medium">Selected Suggestions</h4>
                            <span className="text-xs text-muted-foreground">{Object.values(selected).filter(Boolean).length} items</span>
                          </div>
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {Object.entries(selected)
                              .filter(([, v]) => v)
                              .map(([id]) => {
                                const suggestion = suggestions.find(s => s.id === id);
                                return suggestion ? (
                                  <div
                                    key={id}
                                    draggable
                                    onDragStart={(e) => {
                                      console.log('Drag start for suggestion:', suggestion);
                                      e.dataTransfer.setData('text/plain', JSON.stringify(suggestion));
                                      e.dataTransfer.effectAllowed = 'move';
                                      console.log('DataTransfer data set:', e.dataTransfer.getData('text/plain'));
                                      handleDragStart(suggestion);
                                    }}
                                    onDragEnd={handleDragEnd}
                                    className="p-3 border rounded cursor-move bg-card hover:bg-accent transition-colors group"
                                    style={{ opacity: 0.7 }}
                                  >
                                    <div className="flex items-center gap-3">
                                      <img src={suggestion.image} alt={suggestion.title} className="w-10 h-10 rounded object-cover" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{suggestion.title}</p>
                                        <p className="text-xs text-muted-foreground truncate">{suggestion.description}</p>
                                      </div>
                                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                      </div>
                                    </div>
                                  </div>
                                ) : null;
                              })}
                          </div>
                          
                          {/* Instructions */}
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 bg-blue-200 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">💡</div>
                              <div>
                                <p className="font-medium mb-1">How to use:</p>
                                <ul className="space-y-1 text-blue-600">
                                  <li>• Click "Load with Headless Browser (Recommended)" to bypass iframe blocking</li>
                                  <li>• This loads full HTML/CSS and works with any website</li>
                                  <li>• Drag suggestions from the sidebar onto the website preview</li>
                                  <li>• Carousels will be placed exactly where you drop them</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                          
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelected({});
                  }}
                >
                  Clear
                </Button>
                <Button
                  disabled={numSelected < 3}
                  className={numSelected < 3 ? '' : 'bg-gradient-publisher hover:opacity-90'}
                  onClick={() => {
                    const chosen = Object.entries(selected)
                      .filter(([, v]) => v)
                      .map(([k]) => k);
                    toast({ title: 'Selection saved', description: `${chosen.length} suggestions selected.` });
                  }}
                >
                  Confirm Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}