
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import twilio from 'npm:twilio';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// This function will generate TwiML for the call
function generateTwiML() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="woman">Hello! This is a test call from your PhoneB application.</Say>
  <Pause length="1"/>
  <Say voice="woman">Press any key to end the call.</Say>
  <Gather/>
</Response>`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Handle TwiML requests - this is what Twilio calls to get instructions
  const url = new URL(req.url);
  if (url.pathname.endsWith('/twiml')) {
    console.log("Serving TwiML response");
    return new Response(generateTwiML(), { 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/xml' 
      }
    });
  }
  
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );
    
    // Get the JWT from the request headers and verify it
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    console.log("Authenticated user:", user.id);
    
    // Get the request body
    const { to } = await req.json();
    
    if (!to) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: to' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    console.log("Attempting to make call to:", to);
    
    // Try to use environment variables first (if set in Supabase secrets)
    let twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    let twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    let useEnvCredentials = false;
    
    // Check if we got valid credentials from environment
    if (twilioAccountSid && twilioAuthToken) {
      console.log("Using Twilio credentials from environment variables");
      useEnvCredentials = true;
    } else {
      // If not available in environment, get Twilio credentials from the user's profile
      console.log("Fetching Twilio credentials from user profile");
      const { data: profileData, error: profileError } = await supabaseClient
        .from('profiles')
        .select('twilio_account_sid, twilio_auth_token')
        .eq('id', user.id);
      
      // Check if profile exists and has Twilio credentials
      if (profileError) {
        console.error("Profile fetch error:", profileError);
        return new Response(
          JSON.stringify({ error: 'Error fetching user profile' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      console.log("Profile data retrieved:", profileData);
      
      // Check if profile data exists and has valid credentials
      if (!profileData || profileData.length === 0) {
        console.log("No profile found for user:", user.id);
        return new Response(
          JSON.stringify({ error: 'Twilio credentials not found. Please set up your Twilio account in the settings.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      const profile = profileData[0];
      
      if (!profile.twilio_account_sid || !profile.twilio_auth_token) {
        console.log("Twilio credentials missing in profile for user:", user.id);
        return new Response(
          JSON.stringify({ error: 'Twilio credentials not found. Please set up your Twilio account in the settings.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      twilioAccountSid = profile.twilio_account_sid;
      twilioAuthToken = profile.twilio_auth_token;
    }
    
    console.log("Making call with Twilio SID:", twilioAccountSid?.substring(0, 5) + "...");
    
    // Retrieve the Twilio phone number to use
    // You can either get it from the database or use a default
    let fromNumber;
    
    if (useEnvCredentials) {
      // Use the default phone number from environment if available
      fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER') || '+19478889847';
    } else {
      // Try to get the phone number from the user's profile
      const { data: phoneData } = await supabaseClient
        .from('profiles')
        .select('twilio_phone_number')
        .eq('id', user.id);
      
      fromNumber = (phoneData && phoneData[0]?.twilio_phone_number) || '+19478889847';
    }
    
    console.log("Using phone number:", fromNumber);
    
    // Initialize Twilio client
    const twilioClient = twilio(twilioAccountSid, twilioAuthToken);
    
    try {
      // Get the full URL to our TwiML endpoint
      const baseUrl = req.url.split('/make-call')[0];
      const twimlUrl = `${baseUrl}/make-call/twiml`;
      
      console.log("Using TwiML URL:", twimlUrl);
      
      // Make the call using Twilio's API with our TwiML endpoint
      const call = await twilioClient.calls.create({
        to: to,
        from: fromNumber,
        url: twimlUrl, // Use our own TwiML endpoint
      });
      
      console.log("Call initiated, SID:", call.sid);
      
      // Log call to history
      await supabaseClient.from('call_history').insert({
        user_id: user.id,
        phone_number: to,
        direction: 'outgoing',
        status: 'initiated',
        twilio_call_sid: call.sid,
      });
      
      return new Response(
        JSON.stringify({ success: true, callSid: call.sid }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    } catch (twilioError) {
      console.error('Twilio API error:', twilioError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to initiate call with Twilio', 
          details: twilioError.message 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
  } catch (error) {
    console.error('Error making call:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
