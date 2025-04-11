
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
    
    // Get Twilio credentials from the user's profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('twilio_account_sid, twilio_auth_token')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile || !profile.twilio_account_sid || !profile.twilio_auth_token) {
      return new Response(
        JSON.stringify({ error: 'Twilio credentials not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Get the request body
    const { to, message } = await req.json();
    
    if (!to || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: to, message' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Initialize Twilio client
    const twilioClient = twilio(profile.twilio_account_sid, profile.twilio_auth_token);
    
    // Send the message
    const sms = await twilioClient.messages.create({
      to: to,
      from: '+19478889847', // Using the actual Twilio phone number
      body: message,
    });
    
    // Log message to history
    await supabaseClient.from('message_history').insert({
      user_id: user.id,
      phone_number: to,
      content: message,
      direction: 'outgoing',
      twilio_message_sid: sms.sid,
    });
    
    return new Response(
      JSON.stringify({ success: true, messageSid: sms.sid }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
    
  } catch (error) {
    console.error('Error sending message:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
