
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Star, Phone } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { mockCustomerStats, mockCustomers } from '@/mockData';
import { useAuth } from '@/context/AuthContext';

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState('');
  const { isAdmin } = useAuth();

  // Filter customers based on search query
  const filteredCustomers = mockCustomers.filter(
    (customer) => 
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="container p-4 sm:p-6 space-y-6 relative z-10">
        {/* Decorative elements */}
        <div className="absolute top-1/4 right-0 w-64 h-64 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl -z-10"></div>
        
        {/* Security issues fixer has been removed */}
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">Clients</h1>
          <Link to="/customers/new">
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 dark:shadow-blue-800/20 transition-all duration-300">
              Ajouter un client
            </Button>
          </Link>
        </div>

        <Card className="border-blue-200/20 dark:border-blue-800/30 bg-gradient-to-br from-white/80 to-blue-50/80 dark:from-slate-900/80 dark:to-blue-900/20 backdrop-blur-sm shadow-xl shadow-blue-100/20 dark:shadow-blue-900/20">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-2"></div>
              Liste des clients ({filteredCustomers.length})
            </CardTitle>
            <CardDescription>
              Liste de tous les clients avec leurs statistiques d'appels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom ou entreprise..."
                  className="pl-8 border-blue-200/50 dark:border-blue-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex border-blue-200/50 dark:border-blue-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtrer
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-blue-200/50 dark:border-blue-800/50 shadow-lg">
                  <DropdownMenuItem>Tous les clients</DropdownMenuItem>
                  <DropdownMenuItem>Clients actifs</DropdownMenuItem>
                  <DropdownMenuItem>Clients inactifs</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="border border-blue-100/50 dark:border-blue-900/30 rounded-md overflow-hidden bg-white/70 dark:bg-slate-900/70 backdrop-blur-md">
              <Table>
                <TableHeader className="bg-blue-50/70 dark:bg-blue-900/30">
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Entreprise</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Appels</TableHead>
                    <TableHead>Durée moy.</TableHead>
                    <TableHead>Satisfaction</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => {
                    const stats = mockCustomerStats.find(s => s.customerId === customer.id);
                    
                    return (
                      <TableRow key={customer.id} className="group hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors">
                        <TableCell>
                          <div className="font-medium">{customer.name}</div>
                        </TableCell>
                        <TableCell>{customer.company}</TableCell>
                        <TableCell>
                          <div>{customer.email}</div>
                          <div className="text-sm text-muted-foreground">{customer.phone}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-1 text-blue-500/70 dark:text-blue-400/70" />
                            {stats?.totalCalls || 0}
                          </div>
                        </TableCell>
                        <TableCell>{stats ? formatDuration(Math.round(stats.avgDuration)) : '-'}</TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell className="text-right">
                          <Link to={`/customers/${customer.id}`}>
                            <Button variant="link" size="sm" className="text-blue-600 dark:text-blue-400">
                              Voir détails
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
