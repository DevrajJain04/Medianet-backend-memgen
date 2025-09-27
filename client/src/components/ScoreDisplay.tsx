import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Sparkles, 
  Target,
  Zap,
  Award,
  Star
} from 'lucide-react';

interface ScoreData {
  viralityScore: number;
  creativityScore: number;
  analysis: string;
  recommendations: string[];
  strengths: string[];
  improvements: string[];
}

interface ScoreDisplayProps {
  scores: ScoreData;
  isLoading?: boolean;
}

export function ScoreDisplay({ scores, isLoading }: ScoreDisplayProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Exceptional';
    if (score >= 80) return 'Excellent';
    if (score >= 70) return 'Very Good';
    if (score >= 60) return 'Good';
    if (score >= 50) return 'Average';
    if (score >= 40) return 'Below Average';
    return 'Needs Improvement';
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-5 h-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Analyzing Content...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Virality Score</span>
                <span className="animate-pulse">Analyzing...</span>
              </div>
              <Progress value={0} className="h-3" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Creativity Score</span>
                <span className="animate-pulse">Analyzing...</span>
              </div>
              <Progress value={0} className="h-3" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5" />
          Content Analysis Results
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Virality Score */}
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-blue-500" />
                  <span className="font-semibold">Virality Score</span>
                </div>
                <Badge className={getScoreBadge(scores.viralityScore)}>
                  {getScoreLabel(scores.viralityScore)}
                </Badge>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className={`text-4xl font-bold ${getScoreColor(scores.viralityScore)}`}>
                    {scores.viralityScore}
                  </span>
                  <span className="text-2xl text-muted-foreground">/100</span>
                </div>
                <Progress value={scores.viralityScore} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  Potential to go viral and generate widespread engagement
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Creativity Score */}
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-purple-500" />
                  <span className="font-semibold">Creativity Score</span>
                </div>
                <Badge className={getScoreBadge(scores.creativityScore)}>
                  {getScoreLabel(scores.creativityScore)}
                </Badge>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className={`text-4xl font-bold ${getScoreColor(scores.creativityScore)}`}>
                    {scores.creativityScore}
                  </span>
                  <span className="text-2xl text-muted-foreground">/100</span>
                </div>
                <Progress value={scores.creativityScore} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  Originality and creative appeal of the content
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overall Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Analysis Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              {scores.analysis}
            </p>
          </CardContent>
        </Card>

        {/* Strengths and Improvements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Star className="w-5 h-5" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {scores.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-1">•</span>
                    <span className="text-green-700">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Areas for Improvement */}
          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <Zap className="w-5 h-5" />
                Improvements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {scores.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-orange-500 mt-1">•</span>
                    <span className="text-orange-700">{improvement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scores.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Badge variant="outline" className="mt-0.5">
                    {index + 1}
                  </Badge>
                  <p className="text-sm text-muted-foreground">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
