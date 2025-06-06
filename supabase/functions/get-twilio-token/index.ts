
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    
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
        JSON.stringify({ error: 'Invalid token', details: authError?.message }),
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
      console.log("Looking for specific Twilio account:", accountId);
      
      // First check if the account exists
      const { data: accountCheck, error: checkError } = await supabaseClient
        .from('twilio_accounts')
        .select('id')
        .eq('id', accountId)
        .eq('user_id', user.id);
      
      if (checkError || !accountCheck || accountCheck.length === 0) {
        console.error('Specified account does not exist:', checkError);
        return new Response(
          JSON.stringify({ 
            error: 'Twilio account not found',
            details: 'The specified Twilio account does not exist. Please check your account settings.',
            needsSetup: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }
      
      // Get credentials for the specified Twilio account
      const { data: accountData, error: accountError } = await supabaseClient
        .from('twilio_accounts')
        .select('account_sid, auth_token, app_sid')
        .eq('id', accountId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (accountError) {
        console.error('Error fetching Twilio account:', accountError);
        return new Response(
          JSON.stringify({ 
            error: 'Error retrieving Twilio account details',
            details: accountError.message
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      if (!accountData) {
        console.error('Account exists but details missing');
        return new Response(
          JSON.stringify({ 
            error: 'Twilio account details missing',
            details: 'Your Twilio account exists but appears to be missing credentials',
            needsSetup: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }
      
      accountSid = accountData.account_sid;
      authToken = accountData.auth_token;
      applicationSid = accountData.app_sid;

      if (!accountSid || !authToken) {
        return new Response(
          JSON.stringify({ 
            error: 'Twilio credentials missing in account',
            details: 'The selected account does not have complete Twilio credentials',
            needsSetup: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    } else {
      // No specific account ID provided, try different sources for credentials
      console.log("No specific account ID provided, checking sources");
      
      // Try to get from environment variables first
      accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
      authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
      applicationSid = Deno.env.get('TWILIO_APP_SID');
      
      if (!accountSid || !authToken) {
        console.log("No Twilio credentials in environment, fetching from database");
        
        // Try to get the default account first
        const { data: defaultAccount, error: defaultError } = await supabaseClient
          .from('twilio_accounts')
          .select('account_sid, auth_token, app_sid')
          .eq('user_id', user.id)
          .eq('is_default', true)
          .maybeSingle();
        
        if (!defaultError && defaultAccount && defaultAccount.account_sid && defaultAccount.auth_token) {
          console.log("Using default Twilio account");
          accountSid = defaultAccount.account_sid;
          authToken = defaultAccount.auth_token;
          applicationSid = defaultAccount.app_sid;
        } else {
          console.log("No valid default account found or it has incomplete credentials");
          
          // If no default account or it has incomplete credentials, try any account
          const { data: anyAccounts, error: anyError } = await supabaseClient
            .from('twilio_accounts')
            .select('account_sid, auth_token, app_sid')
            .eq('user_id', user.id)
            .not('account_sid', 'is', null)
            .not('auth_token', 'is', null);
          
          if (!anyError && anyAccounts && anyAccounts.length > 0) {
            console.log("Using first valid Twilio account found");
            accountSid = anyAccounts[0].account_sid;
            authToken = anyAccounts[0].auth_token;
            applicationSid = anyAccounts[0].app_sid;
          } else {
            // If no accounts found with valid credentials, try the user profile
            console.log("No valid accounts found, checking profile");
            const { data: profileData, error: profileError } = await supabaseClient
              .from('profiles')
              .select('twilio_account_sid, twilio_auth_token, twilio_app_sid')
              .eq('id', user.id)
              .single();
            
            if (profileError) {
              console.error('Error fetching profile:', profileError);
              return new Response(
                JSON.stringify({ 
                  error: 'Error fetching Twilio credentials', 
                  details: profileError.message,
                  needsSetup: true
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
              );
            }
            
            if (!profileData?.twilio_account_sid || !profileData?.twilio_auth_token) {
              console.error('No Twilio credentials found in profile');
              return new Response(
                JSON.stringify({ 
                  error: 'Twilio credentials not found',
                  details: 'Please set up your Twilio account in the dashboard first',
                  needsSetup: true
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
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
    }
    
    // Double check we have credentials
    if (!accountSid || !authToken) {
      console.error('No valid Twilio credentials found from any source');
      return new Response(
        JSON.stringify({ 
          error: 'Twilio credentials not found', 
          details: 'Please set up your Twilio account in the dashboard first',
          needsSetup: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }
    
    // If no application SID found, let's create one
    if (!applicationSid) {
      try {
        console.log("No TwiML App SID found, attempting to create one");
        const twilioClient = twilio(accountSid, authToken);
        
        // Create a TwiML app
        const twimlApp = await twilioClient.applications.create({
          friendlyName: 'PhoneB TwiML App',
          voiceUrl: 'https://qjgbmowupuzgwrfcmaao.supabase.co/functions/v1/handle-webhooks',
          voiceMethod: 'POST'
        });
        
        applicationSid = twimlApp.sid;
        
        // Save the App SID to the account or profile
        if (accountId) {
          await supabaseClient
            .from('twilio_accounts')
            .update({ app_sid: applicationSid })
            .eq('id', accountId);
        } else {
          // Try to update the default account first
          const { data: defaultAccount } = await supabaseClient
            .from('twilio_accounts')
            .select('id')
            .eq('user_id', user.id)
            .eq('is_default', true)
            .maybeSingle();
          
          if (defaultAccount) {
            await supabaseClient
              .from('twilio_accounts')
              .update({ app_sid: applicationSid })
              .eq('id', defaultAccount.id);
          } else {
            // If no default account, update the user profile
            await supabaseClient
              .from('profiles')
              .update({ twilio_app_sid: applicationSid })
              .eq('id', user.id);
          }
        }
        
        console.log("Created and saved new TwiML App SID:", applicationSid);
      } catch (twimlError) {
        console.error('Error creating TwiML App:', twimlError);
        return new Response(
          JSON.stringify({ 
            error: 'Twilio TwiML Application SID not configured', 
            details: 'Unable to automatically create a TwiML Application. Please create one manually in your Twilio account.',
            twilio_help_url: 'https://www.twilio.com/console/voice/twiml/apps',
            needsSetup: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    }

    // Try to validate the credentials by creating the Twilio client
    try {
      const twilioClient = twilio(accountSid, authToken);
      // We don't actually need to make a call here, just testing if the client initializes
    } catch (twilioError) {
      console.error('Invalid Twilio credentials:', twilioError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid Twilio credentials', 
          details: twilioError.message,
          needsSetup: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Generate Twilio access token for Voice SDK
    try {
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
    } catch (tokenError) {
      console.error('Error generating Twilio token:', tokenError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to generate Twilio token', 
          details: tokenError.message,
          needsSetup: tokenError.message.includes('Application SID')
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error generating token:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Server error', 
        details: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
