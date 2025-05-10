
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/Layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Phone, Mail, Building, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockCustomers, mockCustomerStats, mockCalls } from '@/mockData';

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString().slice(0, 5);
};

export default function CustomerDetails() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [calls, setCalls] = useState<any[]>([]);
  
  useEffect(() => {
    // In a real app, you would fetch this data from an API
    const foundCustomer = mockCustomers.find(c => c.id === id);
    const customerStats = mockCustomerStats.find(s => s.customerId === id);
    const customerCalls = mockCalls.filter(call => call.customerId === id);
    
    setCustomer(foundCustomer);
    setStats(customerStats);
    setCalls(customerCalls);
  }, [id]);
  
  if (!customer) {
    return (
      <DashboardLayout>
        <div className="container p-6 flex justify-center items-center h-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Client introuvable</h1>
            <Link to="/customers">
              <Button>Retour à la liste des clients</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="container p-4 sm:p-6 space-y-6 relative z-10">
        {/* Decorative elements */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-blue-400/5 dark:bg-blue-600/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-1/3 left-0 w-80 h-80 bg-indigo-400/5 dark:bg-indigo-600/10 rounded-full blur-3xl -z-10"></div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <Link to="/customers">
              <Button variant="outline" size="sm" className="border-blue-200/50 dark:border-blue-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">Détails du client</h1>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" className="border-blue-200/50 dark:border-blue-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <Mail className="mr-2 h-4 w-4 text-blue-500 dark:text-blue-400" />
              Contacter
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 dark:shadow-blue-800/20">
              <Phone className="mr-2 h-4 w-4" />
              Appeler
            </Button>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-blue-200/20 dark:border-blue-800/30 bg-gradient-to-br from-white/80 to-blue-50/80 dark:from-slate-900/80 dark:to-blue-900/20 backdrop-blur-sm shadow-lg shadow-blue-100/20 dark:shadow-blue-900/20">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-2"></div>
                Informations
              </CardTitle>
              <CardDescription>Détails sur le client</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">{customer.name}</h3>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Building className="h-4 w-4 text-blue-500/70 dark:text-blue-400/70" />
                  <span>{customer.company || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Mail className="h-4 w-4 text-blue-500/70 dark:text-blue-400/70" />
                  <span>{customer.email || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Phone className="h-4 w-4 text-blue-500/70 dark:text-blue-400/70" />
                  <span>{customer.phone || 'N/A'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-blue-200/20 dark:border-blue-800/30 bg-gradient-to-br from-white/80 to-blue-50/80 dark:from-slate-900/80 dark:to-blue-900/20 backdrop-blur-sm shadow-lg shadow-blue-100/20 dark:shadow-blue-900/20">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-2"></div>
                Statistiques
              </CardTitle>
              <CardDescription>Données des appels avec ce client</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Nombre d'appels</p>
                  <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{stats?.totalCalls || 0}</p>
                </div>
                <div className="space-y-1 p-3 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Durée moyenne</p>
                  <p className="text-2xl font-bold text-indigo-800 dark:text-indigo-200">{stats ? formatDuration(Math.round(stats.avgDuration)) : '0:00'}</p>
                </div>
                <div className="space-y-1 p-3 bg-yellow-50/50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Satisfaction</p>
                  <div className="flex">
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={stats && i < Math.round(stats.avgSatisfaction) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                        />
                      ))}
                  </div>
                </div>
                <div className="space-y-1 p-3 bg-purple-50/50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Dernier contact</p>
                  <p className="text-base font-semibold text-purple-800 dark:text-purple-200">
                    {calls.length > 0 ? formatDate(calls[0].date) : 'Jamais'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card className="border-blue-200/20 dark:border-blue-800/30 bg-gradient-to-br from-white/80 to-blue-50/80 dark:from-slate-900/80 dark:to-blue-900/20 backdrop-blur-sm shadow-lg shadow-blue-100/20 dark:shadow-blue-900/20">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-2"></div>
              Historique des appels
            </CardTitle>
            <CardDescription>Les appels récents avec ce client</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border border-blue-100/50 dark:border-blue-900/30 rounded-md overflow-hidden bg-white/70 dark:bg-slate-900/70 backdrop-blur-md">
              <Table>
                <TableHeader className="bg-blue-50/70 dark:bg-blue-900/30">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Durée</TableHead>
                    <TableHead>Satisfaction</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calls.length > 0 ? (
                    calls.map(call => (
                      <TableRow key={call.id} className="group hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors">
                        <TableCell>{formatDate(call.date)}</TableCell>
                        <TableCell>{formatDuration(call.duration)}</TableCell>
                        <TableCell>
                          <div className="flex">
                            {Array(5)
                              .fill(0)
                              .map((_, i) => (
                                <Star
                                  key={i}
                                  size={16}
                                  className={call.satisfactionScore && i < call.satisfactionScore ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                                />
                              ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link to={`/calls/${call.id}`}>
                            <Button variant="link" size="sm" className="text-blue-600 dark:text-blue-400">Voir détails</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        Aucun appel trouvé pour ce client
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
