
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
    
    // Get Twilio credentials from the user's profile
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
    
    // Use maybeSingle() alternative - check if profile exists and has credentials
    if (!profileData || profileData.length === 0 || !profileData[0].twilio_account_sid || !profileData[0].twilio_auth_token) {
      console.log("Profile or Twilio credentials missing for user:", user.id);
      return new Response(
        JSON.stringify({ error: 'Twilio credentials not found. Please set up your Twilio account in the settings.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    const profile = profileData[0];
    
    // Get the request body
    const { to } = await req.json();
    
    if (!to) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: to' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    console.log("Making call to:", to);
    
    // Initialize Twilio client
    const twilioClient = twilio(profile.twilio_account_sid, profile.twilio_auth_token);
    
    // Make the call using Twilio's TwiML
    const call = await twilioClient.calls.create({
      to: to,
      from: '+19478889847', // Using the actual Twilio phone number
      url: 'https://handler.twilio.com/twiml/EH8ccdbd7f0b8fe34357da8ce87ebe5a16', // Default TwiML for hello world
    });
    
    console.log("Call initiated, SID:", call.sid);
    
    // Log call to history
    await supabaseClient.from('call_history').insert({
      user_id: user.id,
      phone_number: to,
      direction: 'outgoing',
      status: 'completed',
      twilio_call_sid: call.sid,
    });
    
    return new Response(
      JSON.stringify({ success: true, callSid: call.sid }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
    
  } catch (error) {
    console.error('Error making call:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
