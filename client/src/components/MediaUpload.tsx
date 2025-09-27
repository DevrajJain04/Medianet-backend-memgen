import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  X, 
  FileImage, 
  FileVideo, 
  File, 
  Sparkles,
  Eye,
  Heart
} from 'lucide-react';

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'video' | 'gif';
  size: string;
}

interface MediaUploadProps {
  onAnalyze: (files: UploadedFile[]) => Promise<void>;
  isAnalyzing: boolean;
}

// Supported file types
const supportedTypes = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff', 'image/svg+xml'],
  video: ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/mkv'],
  gif: ['image/gif']
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileType = (file: File): 'image' | 'video' | 'gif' => {
  if (file.type === 'image/gif') return 'gif';
  if (supportedTypes.image.includes(file.type)) return 'image';
  if (supportedTypes.video.includes(file.type)) return 'video';
  return 'image'; // fallback
};

const createPreview = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  });
};

export function MediaUpload({ onAnalyze, isAnalyzing }: MediaUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = useCallback(async (files: FileList) => {
    const newFiles: UploadedFile[] = [];
    
    for (const file of Array.from(files)) {
      const type = getFileType(file);
      const preview = await createPreview(file);
      
      newFiles.push({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview,
        type,
        size: formatFileSize(file.size)
      });
    }
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
  };

  const getFileIcon = (type: 'image' | 'video' | 'gif') => {
    switch (type) {
      case 'image':
        return <FileImage className="w-5 h-5" />;
      case 'video':
        return <FileVideo className="w-5 h-5" />;
      case 'gif':
        return <File className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Media for Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <div className="space-y-2">
            <p className="text-lg font-medium">
              Drag & drop your files here, or{' '}
              <label htmlFor="file-upload" className="text-primary cursor-pointer hover:underline">
                browse
              </label>
            </p>
            <p className="text-sm text-muted-foreground">
              Supports images (JPEG, PNG, GIF, WebP, BMP, TIFF, SVG), videos (MP4, WebM, AVI, MOV, WMV, FLV, MKV), and GIFs
            </p>
            <p className="text-xs text-muted-foreground">
              Maximum file size: 50MB per file
            </p>
          </div>
          <input
            id="file-upload"
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Uploaded Files ({uploadedFiles.length})</h3>
              <Button
                onClick={() => onAnalyze(uploadedFiles)}
                disabled={isAnalyzing || uploadedFiles.length === 0}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Scores
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploadedFiles.map((file) => (
                <Card key={file.id} className="relative overflow-hidden">
                  <div className="aspect-video relative">
                    {file.type === 'video' ? (
                      <video
                        src={file.preview}
                        className="w-full h-full object-cover"
                        controls
                      />
                    ) : (
                      <img
                        src={file.preview}
                        alt={file.file.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2 h-6 w-6 p-0"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.type)}
                        <span className="text-sm font-medium truncate">{file.file.name}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {file.type.toUpperCase()}
                        </Badge>
                        <span>{file.size}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
