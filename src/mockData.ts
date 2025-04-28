
import { Agent, Call, Customer, CallStats, CustomerStats } from './types';

// Mock Agents
export const mockAgents: Agent[] = [
  {
    id: 'agent-1',
    name: 'Sophie Martin',
    role: 'Customer Support',
    avatar: '/placeholder.svg',
  },
  {
    id: 'agent-2',
    name: 'Thomas Bernard',
    role: 'Sales Representative',
    avatar: '/placeholder.svg',
  },
  {
    id: 'agent-3',
    name: 'Camille Dubois',
    role: 'Technical Support',
    avatar: '/placeholder.svg',
  },
];

// Mock Customers
export const mockCustomers: Customer[] = [
  {
    id: 'customer-1',
    name: 'Jean Dupont',
    company: 'Acme Corp',
    email: 'jean.dupont@acme.com',
    phone: '+33 1 23 45 67 89',
  },
  {
    id: 'customer-2',
    name: 'Marie Lefevre',
    company: 'Tech Solutions',
    email: 'marie@techsolutions.com',
    phone: '+33 6 12 34 56 78',
  },
  {
    id: 'customer-3',
    name: 'Pierre Moreau',
    company: 'Global Industries',
    email: 'p.moreau@global-industries.com',
    phone: '+33 7 89 01 23 45',
  },
];

// Mock audio URLs - these would be replaced with actual ElevenLabs audio URLs
const mockAudios = [
  'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', 
  'https://assets.mixkit.co/active_storage/sfx/2095/2095-preview.mp3',
  'https://assets.mixkit.co/active_storage/sfx/2561/2561-preview.mp3'
];

// Mock Calls
export const mockCalls: Call[] = Array.from({ length: 30 }).map((_, index) => {
  const customerId = `customer-${(index % 3) + 1}`;
  const agentId = `agent-${(index % 3) + 1}`;
  const customer = mockCustomers.find(c => c.id === customerId)!;
  const agent = mockAgents.find(a => a.id === agentId)!;
  
  // Generate a date within the last 30 days
  const date = new Date();
  date.setDate(date.getDate() - (index % 30));
  
  return {
    id: `call-${index + 1}`,
    customerId,
    customerName: customer.name,
    agentId,
    agentName: agent.name,
    date: date.toISOString(),
    duration: Math.floor(Math.random() * 600) + 60, // 1-10 minutes in seconds
    audioUrl: mockAudios[index % mockAudios.length],
    summary: `Résumé de l'appel avec ${customer.name} concernant une question sur ${
      index % 2 === 0 ? 'le service client' : 'un problème technique'
    }. ${
      index % 3 === 0
        ? 'Le client était satisfait de la résolution.'
        : 'Le problème nécessite un suivi supplémentaire.'
    }`,
    transcript: index % 2 === 0 ? 'Transcription complète de l\'appel...' : undefined,
    satisfactionScore: Math.floor(Math.random() * 5) + 1, // 1-5
    tags: index % 3 === 0 ? ['urgent', 'suivi'] : index % 3 === 1 ? ['résolu'] : ['à revoir'],
  };
});

// Calculate Call Stats
export const mockCallStats: CallStats = {
  totalCalls: mockCalls.length,
  avgDuration: mockCalls.reduce((sum, call) => sum + call.duration, 0) / mockCalls.length,
  avgSatisfaction: mockCalls.reduce((sum, call) => sum + call.satisfactionScore, 0) / mockCalls.length,
  callsPerDay: mockCalls.reduce((acc, call) => {
    const date = new Date(call.date).toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>),
};

// Calculate Customer Stats
export const mockCustomerStats: CustomerStats[] = mockCustomers.map(customer => {
  const customerCalls = mockCalls.filter(call => call.customerId === customer.id);
  return {
    customerId: customer.id,
    customerName: customer.name,
    totalCalls: customerCalls.length,
    avgDuration: customerCalls.reduce((sum, call) => sum + call.duration, 0) / customerCalls.length,
    avgSatisfaction: customerCalls.reduce((sum, call) => sum + call.satisfactionScore, 0) / customerCalls.length,
  };
});

// Export all mock data in a single object for easier imports
export const mockData = {
  mockAgents,
  mockCustomers,
  mockCalls,
  mockCallStats,
  mockCustomerStats
};
