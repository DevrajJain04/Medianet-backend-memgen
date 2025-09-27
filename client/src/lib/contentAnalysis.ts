import { api } from './api';

export interface ScoreData {
  viralityScore: number;
  creativityScore: number;
  analysis: string;
  recommendations: string[];
  strengths: string[];
  improvements: string[];
}

export interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'video' | 'gif';
  size: string;
}

export async function analyzeContent(files: UploadedFile[]): Promise<ScoreData> {
  try {
    // Prepare form data for file upload
    const formData = new FormData();
    
    files.forEach((fileData, index) => {
      formData.append(`file_${index}`, fileData.file);
      formData.append(`file_type_${index}`, fileData.type);
    });
    
    formData.append('file_count', files.length.toString());

    // Call the backend API endpoint
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/analyze-content`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Validate the response structure
    if (!result.viralityScore || !result.creativityScore) {
      throw new Error('Invalid response format from analysis API');
    }

    return {
      viralityScore: Math.round(result.viralityScore),
      creativityScore: Math.round(result.creativityScore),
      analysis: result.analysis || 'Content analysis completed successfully.',
      recommendations: result.recommendations || [],
      strengths: result.strengths || [],
      improvements: result.improvements || []
    };
  } catch (error) {
    console.error('Content analysis error:', error);
    
    // Return a mock response for development/testing
    if (import.meta.env.DEV) {
      return {
        viralityScore: Math.floor(Math.random() * 40) + 60, // 60-100
        creativityScore: Math.floor(Math.random() * 40) + 60, // 60-100
        analysis: 'This is a mock analysis response for development. The backend API will provide real analysis results.',
        recommendations: [
          'Consider adding more vibrant colors to increase engagement',
          'Try incorporating trending hashtags for better reach',
          'Add a clear call-to-action to improve conversion rates'
        ],
        strengths: [
          'High visual quality and clarity',
          'Good composition and framing',
          'Engaging subject matter'
        ],
        improvements: [
          'Consider optimizing for mobile viewing',
          'Add more dynamic elements for better engagement',
          'Include brand elements for better recognition'
        ]
      };
    }
    
    throw error;
  }
}
