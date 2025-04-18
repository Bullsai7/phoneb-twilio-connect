
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
    
    // Parse request body if it exists
    let requestBody = {};
    if (req.body) {
      try {
        requestBody = await req.json();
      } catch (e) {
        console.log("No request body or invalid JSON");
      }
    }
    
    // Check if a specific Twilio account ID is provided
    const accountId = requestBody.accountId;
    let accountSid, authToken, applicationSid;
    
    if (accountId) {
      console.log("Using specific Twilio account:", accountId);
      
      // Get credentials for the specified Twilio account
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
      
      accountSid = accountData.account_sid;
      authToken = accountData.auth_token;
      applicationSid = accountData.app_sid;
    } else {
      // No specific account ID provided, use environment variables or default account
      accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
      authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
      applicationSid = Deno.env.get('TWILIO_APP_SID');
      
      if (!accountSid || !authToken) {
        console.log("No Twilio credentials in environment, fetching from profile or default account");
        
        // Try to get the default account first
        const { data: defaultAccount, error: defaultError } = await supabaseClient
          .from('twilio_accounts')
          .select('account_sid, auth_token, app_sid')
          .eq('user_id', user.id)
          .eq('is_default', true)
          .maybeSingle();
        
        if (!defaultError && defaultAccount) {
          console.log("Using default Twilio account");
          accountSid = defaultAccount.account_sid;
          authToken = defaultAccount.auth_token;
          applicationSid = defaultAccount.app_sid;
        } else {
          // If no default account, try the user profile
          console.log("No default account, checking profile");
          const { data: profileData, error: profileError } = await supabaseClient
            .from('profiles')
            .select('twilio_account_sid, twilio_auth_token, twilio_app_sid')
            .eq('id', user.id)
            .single();
          
          if (profileError) {
            console.error('Error fetching profile:', profileError);
            return new Response(
              JSON.stringify({ error: 'Error fetching Twilio credentials' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            );
          }
          
          if (!profileData?.twilio_account_sid || !profileData?.twilio_auth_token) {
            console.error('No Twilio credentials found in profile');
            return new Response(
              JSON.stringify({ error: 'Twilio credentials not found' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            );
          }
          
          accountSid = profileData.twilio_account_sid;
          authToken = profileData.twilio_auth_token;
          
          // If application SID exists in profile, use it
          if (profileData.twilio_app_sid) {
            applicationSid = profileData.twilio_app_sid;
          }
        }
      }
    }
    
    // If no application SID found, return a more descriptive error
    if (!applicationSid) {
      console.error('No Twilio Application SID found');
      return new Response(
        JSON.stringify({ 
          error: 'Twilio TwiML Application SID not configured', 
          details: 'You need to create a TwiML Application in your Twilio account and add the SID to your profile or Twilio account settings.',
          twilio_help_url: 'https://www.twilio.com/console/voice/twiml/apps'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Generate Twilio access token for Voice SDK
    const AccessToken = twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;
    
    // Create a Voice grant for this token
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: applicationSid,
      incomingAllow: true, // Allow incoming calls
    });
    
    // Create an access token - ensure identity is a string
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
