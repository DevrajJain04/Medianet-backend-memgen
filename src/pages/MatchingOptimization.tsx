import { MetricCard } from "@/components/ui/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Target,
  Zap,
  Users,
  Megaphone,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Brain,
  BarChart3,
} from "lucide-react";

export default function MatchingOptimization() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Matching & Optimization</h1>
          <p className="text-muted-foreground mt-1">
            AI-powered matching engine connecting publishers and advertisers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-gradient-mixed/10 text-primary border-primary/20">
            <Brain className="w-3 h-3 mr-1" />
            AI Engine Active
          </Badge>
          <Button className="bg-gradient-mixed hover:opacity-90">
            <Zap className="w-4 h-4 mr-2" />
            Force Optimization
          </Button>
        </div>
      </div>

      {/* Matching Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Active Matches"
          value="1,247"
          description="Live connections"
          trend={{ value: 18, label: "vs last hour", positive: true }}
          icon={<Target className="w-4 h-4 text-primary" />}
        />
        <MetricCard
          title="Match Success Rate"
          value="94.2%"
          description="Optimal pairings"
          progress={{ value: 942, max: 1000, label: "Success Rate" }}
          icon={<CheckCircle className="w-4 h-4 text-advertiser" />}
        />
        <MetricCard
          title="Avg Response Time"
          value="127ms"
          description="Real-time matching"
          trend={{ value: 12, label: "faster", positive: true }}
          icon={<Clock className="w-4 h-4 text-publisher" />}
        />
        <MetricCard
          title="Revenue Per Match"
          value="$18.47"
          description="Platform commission"
          trend={{ value: 8, label: "improvement", positive: true }}
          icon={<TrendingUp className="w-4 h-4 text-primary" />}
        />
      </div>

      {/* Matching Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Matching Queue */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Live Matching Queue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                id: "M-2847",
                publisher: "TechCrunch.com",
                advertiser: "Apple Inc.",
                category: "Technology",
                bidAmount: "$2.87",
                confidence: 97,
                status: "matched",
                timeAgo: "2 seconds ago",
              },
              {
                id: "M-2846", 
                publisher: "Forbes Business",
                advertiser: "Microsoft Azure",
                category: "Enterprise",
                bidAmount: "$4.23",
                confidence: 95,
                status: "matched",
                timeAgo: "15 seconds ago",
              },
              {
                id: "M-2845",
                publisher: "Mobile Gaming Hub",
                advertiser: "Unity Technologies",
                category: "Gaming",
                bidAmount: "$1.56",
                confidence: 89,
                status: "pending",
                timeAgo: "32 seconds ago",
              },
              {
                id: "M-2844",
                publisher: "Financial Times",
                advertiser: "Goldman Sachs",
                category: "Finance",
                bidAmount: "$5.41",
                confidence: 92,
                status: "matched",
                timeAgo: "1 minute ago",
              },
            ].map((match, i) => (
              <div key={i} className="p-4 bg-gradient-subtle border border-border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono text-xs">
                      {match.id}
                    </Badge>
                    <Badge
                      variant="outline" 
                      className={
                        match.status === "matched"
                          ? "bg-advertiser/10 text-advertiser border-advertiser/20"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {match.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{match.timeAgo}</span>
                  </div>
                  <div className="text-lg font-bold text-advertiser">{match.bidAmount}</div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-publisher" />
                    <div>
                      <div className="font-medium text-sm">{match.publisher}</div>
                      <div className="text-xs text-muted-foreground">Publisher</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-advertiser" />
                    <div>
                      <div className="font-medium text-sm">{match.advertiser}</div>
                      <div className="text-xs text-muted-foreground">Advertiser</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">Category:</span>
                    <Badge variant="outline">{match.category}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Confidence:</span>
                    <div className="flex items-center gap-2">
                      <Progress value={match.confidence} className="w-16 h-2" />
                      <span className="text-xs font-medium">{match.confidence}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Optimization Controls & Analytics */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI Engine Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-gradient-mixed/10 rounded-lg border border-primary/20">
                <div className="w-8 h-8 bg-gradient-mixed rounded-full mx-auto mb-2 flex items-center justify-center animate-pulse">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div className="text-sm font-medium">Processing</div>
                <div className="text-xs text-muted-foreground">847 requests/sec</div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Machine Learning</span>
                  <Badge className="bg-advertiser/10 text-advertiser border-advertiser/20">
                    Active
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Predictive Matching</span>
                  <Badge className="bg-advertiser/10 text-advertiser border-advertiser/20">
                    Active
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Real-time Bidding</span>
                  <Badge className="bg-advertiser/10 text-advertiser border-advertiser/20">
                    Active
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Optimization Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Target className="w-4 h-4 mr-2" />
                Refine Match Criteria
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="w-4 h-4 mr-2" />
                Review Performance
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Brain className="w-4 h-4 mr-2" />
                Retrain Model
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                System Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-3 h-3 text-destructive" />
                  <span className="text-sm font-medium">High Latency</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Response times above 200ms detected
                </p>
              </div>
              
              <div className="p-3 bg-advertiser/10 border border-advertiser/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-3 h-3 text-advertiser" />
                  <span className="text-sm font-medium">Model Updated</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  ML model retrained with latest data
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}