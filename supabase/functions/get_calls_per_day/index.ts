
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { format, subDays } from "https://esm.sh/date-fns@2.30.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { start_date, days_count } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const today = new Date();
    const daysCount = days_count || 30;
    const startDate = start_date || format(subDays(today, daysCount), 'yyyy-MM-dd');
    
    // Query calls grouped by date
    const { data, error } = await supabase
      .from('calls')
      .select('date')
      .gte('date', startDate)
      .order('date');
    
    if (error) throw error;
    
    // Process the data to count calls per day
    const dateMap = {};
    
    // Initialize all dates in the range with 0 count
    for (let i = 0; i <= daysCount; i++) {
      const date = subDays(today, daysCount - i);
      const dateKey = format(date, 'yyyy-MM-dd');
      dateMap[dateKey] = 0;
    }
    
    // Count calls per day
    if (data) {
      data.forEach(call => {
        const callDate = format(new Date(call.date), 'yyyy-MM-dd');
        if (dateMap[callDate] !== undefined) {
          dateMap[callDate]++;
        }
      });
    }
    
    // Convert to array format for response
    const result = Object.entries(dateMap).map(([date, count]) => ({
      date,
      count
    }));
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
