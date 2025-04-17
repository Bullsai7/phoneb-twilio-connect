
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

    // Parse request body to get account credentials and phone number to purchase
    const { accountId, phoneNumber } = await req.json();
    
    if (!accountId || !phoneNumber) {
      return new Response(
        JSON.stringify({ error: 'Account ID and Phone Number are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get the account from the database
    const { data: accountData, error: accountError } = await supabaseClient
      .from('twilio_accounts')
      .select('account_sid, auth_token, app_sid')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .single();
    
    if (accountError || !accountData) {
      console.error('Error fetching Twilio account:', accountError);
      return new Response(
        JSON.stringify({ error: 'Specified Twilio account not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    const { account_sid, auth_token, app_sid } = accountData;

    console.log(`Purchasing phone number ${phoneNumber} for account ${account_sid}`);
    
    // Initialize Twilio client with provided credentials
    const twilioClient = twilio(account_sid, auth_token);
    
    // Purchase the phone number
    const incomingPhoneNumber = await twilioClient.incomingPhoneNumbers.create({
      phoneNumber: phoneNumber,
      voiceUrl: app_sid ? undefined : `https://qjgbmowupuzgwrfcmaao.supabase.co/functions/v1/handle-webhooks`,
      smsUrl: app_sid ? undefined : `https://qjgbmowupuzgwrfcmaao.supabase.co/functions/v1/handle-webhooks`,
      voiceApplicationSid: app_sid || undefined,
      smsApplicationSid: app_sid || undefined
    });
    
    console.log(`Successfully purchased phone number: ${incomingPhoneNumber.phoneNumber}`);
      
    return new Response(
      JSON.stringify({ 
        success: true,
        phoneNumber: incomingPhoneNumber.phoneNumber,
        sid: incomingPhoneNumber.sid
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error purchasing phone number:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Internal server error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
