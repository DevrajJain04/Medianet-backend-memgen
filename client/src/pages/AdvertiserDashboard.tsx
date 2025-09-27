import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MediaUpload } from "@/components/MediaUpload";
import { ScoreDisplay } from "@/components/ScoreDisplay";
import { analyzeContent, type UploadedFile, type ScoreData } from "@/lib/contentAnalysis";
import {
  Sparkles,
  Upload,
  TrendingUp,
  BarChart3,
  Zap,
  Target,
  Award
} from "lucide-react";

export default function AdvertiserDashboard() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scores, setScores] = useState<ScoreData | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const handleAnalyze = async (files: UploadedFile[]) => {
    if (files.length === 0) return;
    
    setIsAnalyzing(true);
    try {
      const analysisResults = await analyzeContent(files);
      setScores(analysisResults);
      setHasAnalyzed(true);
    } catch (error) {
      console.error('Analysis failed:', error);
      // Handle error - could show toast notification
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNewAnalysis = () => {
    setScores(null);
    setHasAnalyzed(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Content Analysis Hub</h1>
          <p className="text-muted-foreground mt-1">
            Upload your media content to get AI-powered virality and creativity scores
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasAnalyzed && (
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
              <Award className="w-3 h-3 mr-1" />
              Analysis Complete
            </Badge>
          )}
          <Button 
            onClick={handleNewAnalysis}
            variant="outline"
            disabled={isAnalyzing}
          >
            <Upload className="w-4 h-4 mr-2" />
            New Analysis
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Analyses</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Virality Score</p>
                <p className="text-2xl font-bold">-</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Creativity Score</p>
                <p className="text-2xl font-bold">-</p>
              </div>
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="space-y-6">
          <MediaUpload onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {scores ? (
            <ScoreDisplay scores={scores} isLoading={isAnalyzing} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Analysis Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Sparkles className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Analysis Yet</h3>
                  <p className="text-muted-foreground">
                    Upload your media files and click "Generate Scores" to see AI-powered analysis results.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Features Overview */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Zap className="w-5 h-5" />
            AI-Powered Content Analysis Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-blue-700 mb-1">Virality Score</h3>
              <p className="text-sm text-blue-600">Analyzes potential for viral reach and engagement</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-purple-700 mb-1">Creativity Score</h3>
              <p className="text-sm text-purple-600">Evaluates originality and creative appeal</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-green-700 mb-1">Smart Recommendations</h3>
              <p className="text-sm text-green-600">AI-generated suggestions for improvement</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-orange-700 mb-1">Detailed Analysis</h3>
              <p className="text-sm text-orange-600">Comprehensive breakdown of strengths and areas for improvement</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}