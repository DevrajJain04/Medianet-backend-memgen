import { MetricCard } from "@/components/ui/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Megaphone,
  Target,
  Users,
  DollarSign,
  TrendingUp,
  Play,
  Pause,
  BarChart3,
  Zap,
  Clock,
} from "lucide-react";

export default function AdvertiserDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Advertiser Hub</h1>
          <p className="text-muted-foreground mt-1">
            Reach your target audience with precision campaigns
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-advertiser/10 text-advertiser border-advertiser/20">
            8 Campaigns Active
          </Badge>
          <Button className="bg-gradient-advertiser hover:opacity-90">
            <Zap className="w-4 h-4 mr-2" />
            Launch Campaign
          </Button>
        </div>
      </div>

      {/* Advertiser Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Campaign Reach"
          value="1.8M"
          description="Unique impressions"
          trend={{ value: 22, label: "vs last month", positive: true }}
          icon={<Megaphone className="w-4 h-4 text-advertiser" />}
          variant="advertiser"
        />
        <MetricCard
          title="Conversion Rate"
          value="4.7%"
          description="Above benchmark"
          trend={{ value: 15, label: "improvement", positive: true }}
          icon={<Target className="w-4 h-4 text-advertiser" />}
          variant="advertiser"
        />
        <MetricCard
          title="Campaign Spend"
          value="$34,250"
          description="This month"
          trend={{ value: 8, label: "under budget", positive: true }}
          icon={<DollarSign className="w-4 h-4 text-advertiser" />}
          variant="advertiser"
        />
        <MetricCard
          title="Quality Score"
          value="8.9/10"
          description="Premium placement"
          progress={{ value: 89, max: 100, label: "Quality Score" }}
          icon={<BarChart3 className="w-4 h-4 text-advertiser" />}
          variant="advertiser"
        />
      </div>

      {/* Advertiser Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Campaigns */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5" />
              Active Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                name: "Enterprise Software Q4",
                status: "active",
                budget: "$12,500",
                spent: "$8,420", 
                impressions: "542K",
                conversions: "1,247",
                ctr: "4.2%",
                progress: 67,
              },
              {
                name: "Mobile App Launch",
                status: "active", 
                budget: "$8,000",
                spent: "$6,120",
                impressions: "398K",
                conversions: "892",
                ctr: "3.8%",
                progress: 76,
              },
              {
                name: "B2B Services Campaign",
                status: "paused",
                budget: "$15,000", 
                spent: "$4,200",
                impressions: "189K",
                conversions: "456",
                ctr: "3.1%",
                progress: 28,
              },
              {
                name: "Holiday Promotion",
                status: "active",
                budget: "$20,000",
                spent: "$12,800",
                impressions: "723K", 
                conversions: "2,134",
                ctr: "5.1%",
                progress: 64,
              },
            ].map((campaign, i) => (
              <div key={i} className="p-4 bg-advertiser/5 border border-advertiser/10 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium text-card-foreground">{campaign.name}</h4>
                    <Badge
                      variant="outline"
                      className={
                        campaign.status === "active"
                          ? "bg-advertiser/10 text-advertiser border-advertiser/20"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {campaign.status}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                      {campaign.status === "active" ? (
                        <Pause className="w-3 h-3" />
                      ) : (
                        <Play className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-sm mb-3">
                  <div>
                    <span className="text-muted-foreground">Spend:</span>
                    <div className="font-medium">{campaign.spent} / {campaign.budget}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Impressions:</span>
                    <div className="font-medium">{campaign.impressions}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Conversions:</span>
                    <div className="font-medium text-advertiser">{campaign.conversions}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">CTR:</span>
                    <div className="font-medium">{campaign.ctr}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Progress:</span>
                    <div className="font-medium">{campaign.progress}%</div>
                  </div>
                </div>
                
                <Progress value={campaign.progress} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Campaign Tools & Insights */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Campaign Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-advertiser/10 rounded-lg">
                <div className="text-2xl font-bold text-advertiser">4.7%</div>
                <p className="text-sm text-muted-foreground">Average CTR</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-muted-foreground">Best Performer</div>
                  <div className="font-medium">Holiday Promotion</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Top Channel</div>
                  <div className="font-medium text-advertiser">Mobile Display</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Avg. CPC</div>
                  <div className="font-medium">$2.34</div>
                </div>
                <div>
                  <div className="text-muted-foreground">ROAS</div>
                  <div className="font-medium text-advertiser">3.2x</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Campaign Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Megaphone className="w-4 h-4 mr-2" />
                Create New Campaign
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Target className="w-4 h-4 mr-2" />
                Audience Insights
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="w-4 h-4 mr-2" />
                Performance Report
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-advertiser/10 to-transparent border-advertiser/20">
            <CardHeader>
              <CardTitle className="text-advertiser">Optimization Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-background/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3 h-3 text-advertiser" />
                  <span className="text-sm font-medium">Prime Time</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your audience is most active between 2-4 PM
                </p>
              </div>
              <div className="p-3 bg-background/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-3 h-3 text-advertiser" />
                  <span className="text-sm font-medium">Targeting Tip</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Consider expanding to similar demographics
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}