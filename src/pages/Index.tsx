
import { DashboardLayout } from '@/components/dashboard/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockCallStats, mockCalls, mockCustomerStats } from '@/mockData';
import { Call } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BarChart2, Clock, Phone, Star } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default function Index() {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Prepare chart data for calls per day
  const chartData = Object.entries(mockCallStats.callsPerDay)
    .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
    .map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      appels: count,
    }))
    .slice(-10); // Last 10 days
  
  // Get recent calls
  const recentCalls: Call[] = [...mockCalls]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <DashboardLayout>
      <div className="container p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Tableau de bord</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              Dernière synchronisation: il y a 5 minutes
            </span>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full sm:w-auto grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="calls">Appels récents</TabsTrigger>
            <TabsTrigger value="customers">Clients</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total des appels</CardTitle>
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockCallStats.totalCalls}</div>
                  <p className="text-xs text-muted-foreground">
                    +{Math.floor(mockCallStats.totalCalls * 0.2)} depuis le mois dernier
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Durée moyenne</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatDuration(Math.round(mockCallStats.avgDuration))}</div>
                  <p className="text-xs text-muted-foreground">-20s depuis le mois dernier</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Satisfaction moyenne</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockCallStats.avgSatisfaction.toFixed(1)}/5</div>
                  <p className="text-xs text-muted-foreground">+0.2 depuis le mois dernier</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Appels par jour</CardTitle>
                  <BarChart2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(mockCallStats.totalCalls / 30).toFixed(1)}
                  </div>
                  <p className="text-xs text-muted-foreground">+2.1 depuis le mois dernier</p>
                </CardContent>
              </Card>
            </div>

            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Appels par jour</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[200px] sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis 
                        dataKey="date" 
                        stroke="#888888" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}`}
                      />
                      <Tooltip />
                      <Bar 
                        dataKey="appels" 
                        fill="hsl(var(--primary))" 
                        radius={[4, 4, 0, 0]} 
                        className="cursor-pointer hover:opacity-80"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="calls" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Appels récents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentCalls.map(call => (
                    <div 
                      key={call.id} 
                      className="flex items-center justify-between p-4 border rounded-md hover:bg-accent cursor-pointer"
                    >
                      <div className="space-y-1">
                        <div className="font-medium">{call.customerName}</div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <span>{formatDistanceToNow(new Date(call.date), { addSuffix: true, locale: fr })}</span>
                          <span className="mx-2">•</span>
                          <span>{formatDuration(call.duration)}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {Array(5)
                            .fill(0)
                            .map((_, i) => (
                              <Star
                                key={i}
                                size={16}
                                className={i < call.satisfactionScore ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                              />
                            ))}
                        </div>
                        <Link 
                          to={`/calls/${call.id}`} 
                          className="text-primary hover:underline text-sm"
                        >
                          Voir détails
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <Link 
                    to="/calls"
                    className="text-primary hover:underline"
                  >
                    Voir tous les appels
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="customers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Statistiques clients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockCustomerStats.map(stats => (
                    <div 
                      key={stats.customerId} 
                      className="flex items-center justify-between p-4 border rounded-md hover:bg-accent cursor-pointer"
                    >
                      <div className="space-y-1">
                        <div className="font-medium">{stats.customerName}</div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <span>{stats.totalCalls} appels</span>
                          <span className="mx-2">•</span>
                          <span>Durée moy. {formatDuration(Math.round(stats.avgDuration))}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {Array(5)
                            .fill(0)
                            .map((_, i) => (
                              <Star
                                key={i}
                                size={16}
                                className={i < Math.round(stats.avgSatisfaction) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                              />
                            ))}
                        </div>
                        <Link 
                          to={`/customers/${stats.customerId}`} 
                          className="text-primary hover:underline text-sm"
                        >
                          Voir détails
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
