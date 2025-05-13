
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Find or create a customer by name
 */
export async function findOrCreateCustomer(
  supabase: SupabaseClient,
  customerName: string
): Promise<string> {
  // Check if customer exists with this name
  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("id")
    .eq("name", customerName)
    .maybeSingle();
  
  if (existingCustomer) {
    return existingCustomer.id;
  }
  
  // Create new customer
  const { data: newCustomer, error: customerError } = await supabase
    .from("customers")
    .insert({
      name: customerName
    })
    .select("id")
    .single();
  
  if (customerError) {
    console.error("Error creating customer:", customerError);
    throw new Error(`Failed to create customer: ${customerError.message}`);
  }
  
  return newCustomer.id;
}
