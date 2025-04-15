
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

    // Get Twilio credentials
    let accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    let authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    
    if (!accountSid || !authToken) {
      // If not in env, get from user profile
      const { data: profileData, error: profileError } = await supabaseClient
        .from('profiles')
        .select('twilio_account_sid, twilio_auth_token')
        .eq('id', user.id);
      
      if (profileError || !profileData?.length) {
        return new Response(
          JSON.stringify({ error: 'Twilio credentials not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      accountSid = profileData[0].twilio_account_sid;
      authToken = profileData[0].twilio_auth_token;
    }

    // Generate Twilio Client token
    const twilioClient = twilio(accountSid, authToken);
    const capability = new twilio.jwt.ClientCapability({
      accountSid: accountSid,
      authToken: authToken,
    });

    // Allow incoming calls
    capability.addScope(new twilio.jwt.ClientCapability.IncomingClientScope('browser-client'));
    
    // Generate token
    const twilioToken = capability.toJwt();

    return new Response(
      JSON.stringify({ token: twilioToken }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
    
  } catch (error) {
    console.error('Error generating token:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
