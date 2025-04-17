
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import twilio from 'npm:twilio';

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );
    
    // Get the JWT from the request headers and verify it
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Invalid token or user not found:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Parse request body to get account credentials
    const { accountSid, authToken, countryCode = 'US' } = await req.json();
    
    if (!accountSid || !authToken) {
      return new Response(
        JSON.stringify({ error: 'Account SID and Auth Token are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Fetching available numbers for account ${accountSid} in country ${countryCode}`);
    
    // Initialize Twilio client with provided credentials
    const twilioClient = twilio(accountSid, authToken);
    
    // Fetch available phone numbers
    const availableNumbers = await twilioClient.availablePhoneNumbers(countryCode)
      .local
      .list({ limit: 20 });
      
    // Also fetch numbers already owned by this account
    const ownedNumbers = await twilioClient.incomingPhoneNumbers.list({ limit: 50 });
      
    return new Response(
      JSON.stringify({ 
        availableNumbers: availableNumbers.map(num => ({
          phoneNumber: num.phoneNumber,
          friendlyName: num.friendlyName,
          locality: num.locality,
          region: num.region,
          isoCountry: num.isoCountry,
          capabilities: num.capabilities,
          available: true
        })),
        ownedNumbers: ownedNumbers.map(num => ({
          phoneNumber: num.phoneNumber,
          friendlyName: num.friendlyName,
          sid: num.sid,
          capabilities: num.capabilities,
          dateCreated: num.dateCreated,
          available: false
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error fetching available numbers:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
