
import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/Layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockCallStats, mockCustomerStats, mockAgents, mockCalls } from '@/mockData';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default function Stats() {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Prepare chart data for calls per day
  const chartData = Object.entries(mockCallStats.callsPerDay)
    .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
    .map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      appels: count,
    }))
    .slice(-14); // Last 14 days
  
  // Prepare data for satisfaction distribution
  const satisfactionData = Array(5).fill(0).map((_, i) => {
    const count = mockCalls.filter(call => call.satisfactionScore === i + 1).length;
    return {
      score: `${i + 1} étoile${i > 0 ? 's' : ''}`,
      count,
      percentage: Math.round((count / mockCalls.length) * 100),
    };
  });
  
  // Prepare data for agent performance
  const agentPerformance = mockAgents.map(agent => {
    const agentCalls = mockCalls.filter(call => call.agentId === agent.id);
    const avgSatisfaction = agentCalls.length > 0 
      ? agentCalls.reduce((sum, call) => sum + call.satisfactionScore, 0) / agentCalls.length 
      : 0;
    
    return {
      name: agent.name,
      calls: agentCalls.length,
      satisfaction: Number(avgSatisfaction.toFixed(1)),
      avgDuration: agentCalls.length > 0 
        ? agentCalls.reduce((sum, call) => sum + call.duration, 0) / agentCalls.length 
        : 0,
    };
  }).sort((a, b) => b.calls - a.calls);
  
  // Prepare data for customer distribution by call count
  const customerCallDistribution = [
    { name: '1-5 appels', value: mockCustomerStats.filter(c => c.totalCalls <= 5).length },
    { name: '6-10 appels', value: mockCustomerStats.filter(c => c.totalCalls > 5 && c.totalCalls <= 10).length },
    { name: '11+ appels', value: mockCustomerStats.filter(c => c.totalCalls > 10).length },
  ].filter(item => item.value > 0);

  // Colors for pie chart
  const COLORS = ['#7E69AB', '#9b87f5', '#6E59A5', '#E5DEFF'];

  return (
    <DashboardLayout>
      <div className="container p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Statistiques</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              Dernière mise à jour: il y a 5 minutes
            </span>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid sm:inline-grid w-full sm:w-auto grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-0">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="satisfaction">Satisfaction</TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="customers">Clients</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Appels par jour</CardTitle>
                  <CardDescription>Nombre d'appels sur les 14 derniers jours</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#888888" 
                          fontSize={12} 
                          tickLine={false} 
                        />
                        <YAxis
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip />
                        <Legend />
                        <Bar 
                          name="Nombre d'appels"
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
              
              <Card>
                <CardHeader>
                  <CardTitle>Distribution des clients</CardTitle>
                  <CardDescription>Répartition des clients par nombre d'appels</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={customerCallDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {customerCallDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: any) => [`${value} clients`, '']}
                          labelFormatter={(name: string) => name}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="satisfaction" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribution de la satisfaction</CardTitle>
                <CardDescription>Répartition des appels par niveau de satisfaction</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={satisfactionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="score" 
                        stroke="#888888" 
                        fontSize={12} 
                        tickLine={false} 
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        tickFormatter={(value) => `${value}`}
                        yAxisId="left"
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        tickFormatter={(value) => `${value}%`}
                        orientation="right"
                        yAxisId="right"
                      />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        name="Nombre d'appels"
                        dataKey="count" 
                        fill="#7E69AB" 
                        radius={[4, 4, 0, 0]} 
                        className="cursor-pointer hover:opacity-80"
                        yAxisId="left"
                      />
                      <Bar 
                        name="Pourcentage"
                        dataKey="percentage" 
                        fill="#E5DEFF" 
                        radius={[4, 4, 0, 0]} 
                        className="cursor-pointer hover:opacity-80"
                        yAxisId="right"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Satisfaction dans le temps</CardTitle>
                <CardDescription>Évolution de la satisfaction moyenne sur la période</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData.map((day, i) => ({
                        ...day,
                        satisfaction: 3 + Math.sin(i / 2) * 0.5 + Math.random() * 0.5,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[2.5, 5]} />
                      <Tooltip 
                        formatter={(value: number) => [value.toFixed(1) + '/5', 'Satisfaction']}
                      />
                      <Legend />
                      <Line
                        name="Satisfaction moyenne"
                        type="monotone"
                        dataKey="satisfaction"
                        stroke="#7E69AB"
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="agents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance des agents</CardTitle>
                <CardDescription>Comparaison des performances d'agents par nombre d'appels et satisfaction</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={agentPerformance}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="calls" name="Nombre d'appels" fill="#7E69AB" />
                      <Bar dataKey="satisfaction" name="Satisfaction (sur 5)" fill="#6E59A5" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Durée moyenne par agent</CardTitle>
                <CardDescription>Durée moyenne des appels par agent</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={agentPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => formatDuration(value)} />
                      <Tooltip 
                        formatter={(value: number) => [formatDuration(value), 'Durée moyenne']}
                      />
                      <Legend />
                      <Bar
                        dataKey="avgDuration"
                        name="Durée moyenne"
                        fill="#9b87f5"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="customers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top clients par nombre d'appels</CardTitle>
                <CardDescription>Les clients avec le plus grand nombre d'appels</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={mockCustomerStats
                        .sort((a, b) => b.totalCalls - a.totalCalls)
                        .slice(0, 5)
                      }
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="customerName" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="totalCalls"
                        name="Nombre d'appels"
                        fill="#7E69AB"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Satisfaction par client</CardTitle>
                <CardDescription>Niveau moyen de satisfaction par client</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockCustomerStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="customerName" />
                      <YAxis domain={[0, 5]} />
                      <Tooltip 
                        formatter={(value: number) => [`${value.toFixed(1)}/5`, 'Satisfaction moyenne']}
                      />
                      <Legend />
                      <Bar
                        dataKey="avgSatisfaction"
                        name="Satisfaction moyenne"
                        fill="#E5DEFF"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
