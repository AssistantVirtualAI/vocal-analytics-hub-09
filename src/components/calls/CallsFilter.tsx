
import { useState, useEffect } from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface Customer {
  id: string;
  name: string;
}

interface Agent {
  id: string;
  name: string;
}

interface CallsFilterProps {
  onFilterChange: (filters: {
    customerId?: string;
    agentId?: string;
    startDate?: string;
    endDate?: string;
  }) => void;
}

export function CallsFilter({ onFilterChange }: CallsFilterProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Fetch customers and agents on component mount
  useEffect(() => {
    async function fetchOptions() {
      try {
        // Fetch customers
        const { data: customersData } = await supabase
          .from('customers')
          .select('id, name')
          .order('name');

        if (customersData) {
          setCustomers(customersData);
        }

        // Fetch agents
        const { data: agentsData } = await supabase
          .from('agents')
          .select('id, name')
          .order('name');

        if (agentsData) {
          setAgents(agentsData);
        }
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    }

    fetchOptions();
  }, []);

  // Update filters when any selection changes
  useEffect(() => {
    onFilterChange({
      customerId: selectedCustomerId || undefined,
      agentId: selectedAgentId || undefined,
      startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
      endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
    });
  }, [selectedCustomerId, selectedAgentId, startDate, endDate, onFilterChange]);

  const resetFilters = () => {
    setSelectedCustomerId('');
    setSelectedAgentId('');
    setStartDate(undefined);
    setEndDate(undefined);
  };

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filtrer par client" />
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

      <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filtrer par agent" />
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

      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, 'P', { locale: fr }) : 'Date début'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={setStartDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, 'P', { locale: fr }) : 'Date fin'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={setEndDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <Button variant="ghost" onClick={resetFilters}>
        Réinitialiser
      </Button>
    </div>
  );
}
