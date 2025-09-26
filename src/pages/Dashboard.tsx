import { MetricCard } from "@/components/ui/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Megaphone,
  DollarSign,
  TrendingUp,
  Activity,
  Zap,
  Target,
  Clock,
} from "lucide-react";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Platform Overview</h1>
          <p className="text-muted-foreground mt-1">
            Real-time insights across publisher and advertiser networks
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-advertiser/10 text-advertiser border-advertiser/20">
            Live Matching Active
          </Badge>
          <Button className="bg-gradient-mixed hover:opacity-90">
            <Zap className="w-4 h-4 mr-2" />
            Optimize Now
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Active Publishers"
          value="2,847"
          description="Connected publishers"
          trend={{ value: 12, label: "vs last month", positive: true }}
          icon={<Users className="w-4 h-4 text-publisher" />}
          variant="publisher"
        />
        <MetricCard
          title="Active Advertisers"
          value="1,523"
          description="Live campaigns running"
          trend={{ value: 8, label: "vs last month", positive: true }}
          icon={<Megaphone className="w-4 h-4 text-advertiser" />}
          variant="advertiser"
        />
        <MetricCard
          title="Revenue Today"
          value="$47,291"
          description="Platform commission"
          trend={{ value: 15, label: "vs yesterday", positive: true }}
          icon={<DollarSign className="w-4 h-4 text-foreground" />}
        />
        <MetricCard
          title="Match Success Rate"
          value="94.2%"
          description="Optimal matches found"
          progress={{ value: 942, max: 1000, label: "Success Rate" }}
          icon={<Target className="w-4 h-4 text-foreground" />}
        />
      </div>

      {/* Dashboard Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Platform Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                type: "match",
                title: "High-value match completed",
                subtitle: "Publisher: TechCrunch → Advertiser: Apple",
                time: "2 minutes ago",
                value: "$2,847",
                badge: "Success",
              },
              {
                type: "publisher",
                title: "New publisher onboarded",
                subtitle: "Forbes.com joined the network",
                time: "15 minutes ago",
                badge: "Publisher",
              },
              {
                type: "campaign",
                title: "Campaign optimization triggered",
                subtitle: "Auto-adjusted bidding for Luxury Cars",
                time: "1 hour ago",
                badge: "Advertiser",
              },
              {
                type: "alert",
                title: "Performance threshold reached",
                subtitle: "Q4 revenue goals 85% complete",
                time: "3 hours ago",
                badge: "Alert",
              },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium text-card-foreground">{item.title}</h4>
                    <Badge
                      variant="outline"
                      className={
                        item.badge === "Success"
                          ? "bg-advertiser/10 text-advertiser border-advertiser/20"
                          : item.badge === "Publisher"
                          ? "bg-publisher/10 text-publisher border-publisher/20"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {item.badge}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{item.subtitle}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{item.time}</span>
                    {item.value && (
                      <span className="text-xs font-medium text-advertiser ml-auto">
                        {item.value}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions & Alerts */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Review New Publishers
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Megaphone className="w-4 h-4 mr-2" />
                Create Campaign Match
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="w-4 h-4 mr-2" />
                Run Performance Report
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">System Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm font-medium text-destructive">
                  Low inventory detected
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Premium ad slots running low for mobile traffic
                </p>
              </div>
              <div className="p-3 bg-advertiser/10 border border-advertiser/20 rounded-lg">
                <p className="text-sm font-medium text-advertiser">
                  Optimization complete
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Campaign bid adjustments improved CTR by 23%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}