
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
import { mockCustomerStats, mockCustomers } from '@/mockData';

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter customers based on search query
  const filteredCustomers = mockCustomers.filter(
    (customer) => 
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="container p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Clients</h1>
          <Link to="/customers/new">
            <Button>
              Ajouter un client
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des clients ({filteredCustomers.length})</CardTitle>
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
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtrer
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Tous les clients</DropdownMenuItem>
                  <DropdownMenuItem>Clients actifs</DropdownMenuItem>
                  <DropdownMenuItem>Clients inactifs</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
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
                      <TableRow key={customer.id} className="group">
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
                            <Phone className="h-4 w-4 mr-1 text-muted-foreground" />
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
                            <Button variant="link" size="sm">
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

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
