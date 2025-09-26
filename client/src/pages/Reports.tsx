import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, TrendingUp, TrendingDown, Eye, Filter } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";

export default function Reports() {
  const performanceData = [
    { metric: "Total Impressions", value: "2.4M", change: "+12.5%", trend: "up" },
    { metric: "Click-through Rate", value: "3.2%", change: "+0.8%", trend: "up" },
    { metric: "Revenue Generated", value: "$48,320", change: "+18.2%", trend: "up" },
    { metric: "Active Campaigns", value: "127", change: "-3", trend: "down" },
  ];

  const campaignData = [
    { campaign: "Summer Electronics", impressions: "450K", ctr: "4.2%", revenue: "$12,400", status: "Active" },
    { campaign: "Fashion Week Promo", impressions: "320K", ctr: "3.8%", revenue: "$9,800", status: "Active" },
    { campaign: "Tech Launch Event", impressions: "280K", ctr: "5.1%", revenue: "$15,200", status: "Paused" },
    { campaign: "Holiday Special", impressions: "190K", ctr: "2.9%", revenue: "$5,600", status: "Completed" },
  ];

  const publisherData = [
    { publisher: "TechNews Daily", impressions: "180K", revenue: "$8,400", performance: 92 },
    { publisher: "Fashion Hub", impressions: "150K", revenue: "$7,200", performance: 88 },
    { publisher: "Sports Central", impressions: "120K", revenue: "$5,800", performance: 85 },
    { publisher: "Lifestyle Blog", impressions: "95K", revenue: "$4,200", performance: 82 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive insights into your campaign performance and metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button className="bg-gradient-mixed hover:opacity-90 flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {performanceData.map((item) => (
          <MetricCard
            key={item.metric}
            title={item.metric}
            value={item.value}
            description={
              <div className="flex items-center gap-1">
                {item.trend === "up" ? (
                  <TrendingUp className="h-3 w-3 text-advertiser" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-destructive" />
                )}
                <span className={item.trend === "up" ? "text-advertiser" : "text-destructive"}>
                  {item.change}
                </span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            }
          />
        ))}
      </div>

      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="campaigns">Campaign Performance</TabsTrigger>
          <TabsTrigger value="publishers">Publisher Analytics</TabsTrigger>
          <TabsTrigger value="insights">Advanced Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance Overview</CardTitle>
              <CardDescription>
                Detailed breakdown of your active and completed campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign Name</TableHead>
                    <TableHead>Impressions</TableHead>
                    <TableHead>CTR</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaignData.map((campaign) => (
                    <TableRow key={campaign.campaign}>
                      <TableCell className="font-medium">{campaign.campaign}</TableCell>
                      <TableCell>{campaign.impressions}</TableCell>
                      <TableCell>{campaign.ctr}</TableCell>
                      <TableCell className="font-semibold text-advertiser">
                        {campaign.revenue}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            campaign.status === "Active" ? "default" :
                            campaign.status === "Paused" ? "secondary" : "outline"
                          }
                        >
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="publishers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Publisher Performance Analysis</CardTitle>
              <CardDescription>
                Monitor publisher effectiveness and revenue generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {publisherData.map((publisher) => (
                  <div key={publisher.publisher} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{publisher.publisher}</h4>
                      <div className="flex gap-6 mt-2 text-sm text-muted-foreground">
                        <span>Impressions: {publisher.impressions}</span>
                        <span>Revenue: <span className="text-advertiser font-medium">{publisher.revenue}</span></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">Performance Score</div>
                        <div className="text-lg font-bold text-publisher">{publisher.performance}%</div>
                      </div>
                      <div className="w-20">
                        <Progress value={publisher.performance} className="h-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Audience Demographics</CardTitle>
                <CardDescription>
                  Understanding your target audience breakdown
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Age 18-24</span>
                    <span className="text-sm font-medium">28%</span>
                  </div>
                  <Progress value={28} className="h-2" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Age 25-34</span>
                    <span className="text-sm font-medium">42%</span>
                  </div>
                  <Progress value={42} className="h-2" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Age 35-44</span>
                    <span className="text-sm font-medium">20%</span>
                  </div>
                  <Progress value={20} className="h-2" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Age 45+</span>
                    <span className="text-sm font-medium">10%</span>
                  </div>
                  <Progress value={10} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
                <CardDescription>
                  Campaign reach across different regions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">North America</span>
                    <span className="text-sm font-medium">45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Europe</span>
                    <span className="text-sm font-medium">32%</span>
                  </div>
                  <Progress value={32} className="h-2" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Asia Pacific</span>
                    <span className="text-sm font-medium">18%</span>
                  </div>
                  <Progress value={18} className="h-2" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Other</span>
                    <span className="text-sm font-medium">5%</span>
                  </div>
                  <Progress value={5} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}