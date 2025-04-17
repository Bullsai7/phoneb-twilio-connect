
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

    console.log("Generating token for user:", user.id);

    // Get Twilio credentials
    let accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    let authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    let applicationSid = Deno.env.get('TWILIO_APP_SID');
    
    if (!accountSid || !authToken) {
      console.log("No Twilio credentials in environment, fetching from profile");
      // If not in env, get from user profile
      const { data: profileData, error: profileError } = await supabaseClient
        .from('profiles')
        .select('twilio_account_sid, twilio_auth_token')
        .eq('id', user.id);
      
      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return new Response(
          JSON.stringify({ error: 'Error fetching Twilio credentials' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      if (!profileData?.length || !profileData[0].twilio_account_sid || !profileData[0].twilio_auth_token) {
        console.error('No Twilio credentials found in profile');
        return new Response(
          JSON.stringify({ error: 'Twilio credentials not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      accountSid = profileData[0].twilio_account_sid;
      authToken = profileData[0].twilio_auth_token;
      
      // If no application SID in environment, we can't proceed
      if (!applicationSid) {
        console.error('No Twilio Application SID found');
        return new Response(
          JSON.stringify({ error: 'Twilio Application SID not configured' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    }

    // Generate Twilio access token for Voice SDK
    const AccessToken = twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;
    
    // Create a Voice grant for this token
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: applicationSid,
      incomingAllow: true, // Allow incoming calls
    });
    
    // Create an access token - the identity MUST be a string
    const identity = user.id.toString();
    
    console.log("Creating token with identity:", identity);
    
    const accessToken = new AccessToken(
      accountSid,
      authToken,
      {
        identity: identity,
        ttl: 3600
      }
    );
    
    // Add the voice grant to the token
    accessToken.addGrant(voiceGrant);
    
    // Generate the token string
    const tokenString = accessToken.toJwt();
    
    console.log("Successfully generated token for user:", identity);

    return new Response(
      JSON.stringify({ token: tokenString }),
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
