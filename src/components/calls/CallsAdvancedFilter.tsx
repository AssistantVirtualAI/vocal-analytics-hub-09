
import React, { useState, useEffect } from 'react';
import { CalendarIcon, RefreshCw } from 'lucide-react';
import { DateRange } from '@/types/calendar';
import { Button } from '@/components/ui/button';
import { DateRangeSelector } from '@/components/dashboard/DateRangeSelector';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface CallsAdvancedFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  selectedAgent: string;
  onAgentChange: (agentId: string) => void;
  selectedCustomer: string;
  onCustomerChange: (customerId: string) => void;
  satisfactionScore: string;
  onSatisfactionChange: (score: string) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  className?: string;
  isLoading?: boolean;
}

interface Agent {
  id: string;
  name: string;
}

interface Customer {
  id: string;
  name: string;
}

export function CallsAdvancedFilter({
  dateRange,
  onDateRangeChange,
  selectedAgent,
  onAgentChange,
  selectedCustomer,
  onCustomerChange,
  satisfactionScore,
  onSatisfactionChange,
  onApplyFilters,
  onResetFilters,
  className,
  isLoading = false
}: CallsAdvancedFilterProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      setIsLoadingOptions(true);
      try {
        // Fetch agents
        const { data: agentsData } = await supabase
          .from('agents')
          .select('id, name')
          .order('name');

        if (agentsData) {
          setAgents(agentsData);
        }

        // Fetch customers
        const { data: customersData } = await supabase
          .from('customers')
          .select('id, name')
          .order('name');

        if (customersData) {
          setCustomers(customersData);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des options de filtre:', error);
      } finally {
        setIsLoadingOptions(false);
      }
    };

    fetchFilterOptions();
  }, []);

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      <div>
        <div className="text-sm font-medium mb-2">Période</div>
        <DateRangeSelector 
          dateRange={dateRange} 
          onDateRangeChange={onDateRangeChange} 
        />
      </div>
      
      <div>
        <div className="text-sm font-medium mb-2">Agent</div>
        <Select value={selectedAgent} onValueChange={onAgentChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Tous les agents" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tous les agents</SelectItem>
            {agents.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                {agent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <div className="text-sm font-medium mb-2">Client</div>
        <Select value={selectedCustomer} onValueChange={onCustomerChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Tous les clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tous les clients</SelectItem>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <div className="text-sm font-medium mb-2">Score de satisfaction</div>
        <Select value={satisfactionScore} onValueChange={onSatisfactionChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Tous les scores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tous les scores</SelectItem>
            <SelectItem value="5">★★★★★ (5 étoiles)</SelectItem>
            <SelectItem value="4">★★★★☆ (4 étoiles)</SelectItem>
            <SelectItem value="3">★★★☆☆ (3 étoiles)</SelectItem>
            <SelectItem value="2">★★☆☆☆ (2 étoiles)</SelectItem>
            <SelectItem value="1">★☆☆☆☆ (1 étoile)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="col-span-1 md:col-span-2 flex justify-end gap-2">
        <Button 
          variant="outline" 
          onClick={onResetFilters}
        >
          Réinitialiser
        </Button>
        <Button 
          onClick={onApplyFilters}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Chargement...
            </>
          ) : (
            'Appliquer les filtres'
          )}
        </Button>
      </div>
    </div>
  );
}
