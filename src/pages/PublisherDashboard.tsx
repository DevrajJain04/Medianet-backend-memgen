import { MetricCard } from "@/components/ui/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Eye,
  MousePointer,
  DollarSign,
  TrendingUp,
  Globe,
  Smartphone,
  Monitor,
  Calendar,
} from "lucide-react";

export default function PublisherDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Publisher Network</h1>
          <p className="text-muted-foreground mt-1">
            Monetize your traffic with premium advertisers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-publisher/10 text-publisher border-publisher/20">
            Revenue Tracking Active
          </Badge>
          <Button className="bg-gradient-publisher hover:opacity-90">
            <TrendingUp className="w-4 h-4 mr-2" />
            Optimize Inventory
          </Button>
        </div>
      </div>

      {/* Publisher Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Impressions"
          value="2.4M"
          description="Last 30 days"
          trend={{ value: 18, label: "vs last month", positive: true }}
          icon={<Eye className="w-4 h-4 text-publisher" />}
          variant="publisher"
        />
        <MetricCard
          title="Click-Through Rate"
          value="3.2%"
          description="Above industry average"
          trend={{ value: 12, label: "improvement", positive: true }}
          icon={<MousePointer className="w-4 h-4 text-publisher" />}
          variant="publisher"
        />
        <MetricCard
          title="Revenue Earned"
          value="$18,429"
          description="This month"
          trend={{ value: 24, label: "vs last month", positive: true }}
          icon={<DollarSign className="w-4 h-4 text-publisher" />}
          variant="publisher"
        />
        <MetricCard
          title="Ad Fill Rate"
          value="87.5%"
          description="Premium inventory"
          progress={{ value: 875, max: 1000, label: "Fill Rate" }}
          icon={<Globe className="w-4 h-4 text-publisher" />}
          variant="publisher"
        />
      </div>

      {/* Publisher Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performing Content */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Top Performing Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                title: "Tech Industry Analysis: Q4 2024",
                category: "Article",
                impressions: "425K",
                ctr: "4.8%",
                revenue: "$2,847",
                device: "desktop",
              },
              {
                title: "Mobile Gaming Trends Report", 
                category: "Video",
                impressions: "312K",
                ctr: "3.9%",
                revenue: "$1,923",
                device: "mobile",
              },
              {
                title: "Enterprise Software Review",
                category: "Article",
                impressions: "298K", 
                ctr: "5.1%",
                revenue: "$2,156",
                device: "desktop",
              },
              {
                title: "Startup Funding Landscape",
                category: "Infographic",
                impressions: "267K",
                ctr: "3.2%",
                revenue: "$1,654",
                device: "mobile",
              },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-publisher/5 border border-publisher/10 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium text-card-foreground">{item.title}</h4>
                    <Badge variant="outline" className="bg-publisher/10 text-publisher border-publisher/20">
                      {item.category}
                    </Badge>
                    {item.device === "mobile" ? (
                      <Smartphone className="w-3 h-3 text-muted-foreground" />
                    ) : (
                      <Monitor className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Impressions:</span>
                      <span className="ml-1 font-medium">{item.impressions}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">CTR:</span>
                      <span className="ml-1 font-medium text-publisher">{item.ctr}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Revenue:</span>
                      <span className="ml-1 font-medium text-publisher">{item.revenue}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Publisher Tools & Inventory */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Ad Inventory Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Premium Slots</span>
                  <span className="font-medium">24/30</span>
                </div>
                <Progress value={80} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Standard Slots</span>
                  <span className="font-medium">156/180</span>
                </div>
                <Progress value={87} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Mobile Optimized</span>
                  <span className="font-medium">89/100</span>
                </div>
                <Progress value={89} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Publisher Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Content Review
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Globe className="w-4 h-4 mr-2" />
                Add New Ad Slots
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="w-4 h-4 mr-2" />
                View Analytics Report
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-publisher/5 border-publisher/20">
            <CardHeader>
              <CardTitle className="text-publisher">Revenue Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center p-4">
                <div className="text-2xl font-bold text-publisher">$18,429</div>
                <p className="text-sm text-muted-foreground">This month's earnings</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-muted-foreground">CPM Average</div>
                  <div className="font-medium">$4.23</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Best Performer</div>
                  <div className="font-medium text-publisher">Tech Content</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}