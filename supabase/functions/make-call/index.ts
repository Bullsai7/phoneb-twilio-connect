
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
  <Say voice="woman">Hello! This is a call from your PhoneB application.</Say>
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
    const { to, accountId } = await req.json();
    
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
    let twilioAppSid = Deno.env.get('TWILIO_APP_SID');
    let useEnvCredentials = false;
    let fromNumber;
    
    // Check if we should use a specific Twilio account from the user's accounts
    if (accountId) {
      console.log("Fetching specific Twilio account:", accountId);
      
      // Check if the account exists before trying to use it
      const { data: accountExists, error: checkError } = await supabaseClient
        .from('twilio_accounts')
        .select('id')
        .eq('id', accountId)
        .eq('user_id', user.id);
      
      if (checkError || !accountExists || accountExists.length === 0) {
        console.log("Specified account doesn't exist, falling back to default account");
        
        // Try to get the default account
        const { data: defaultAccount, error: defaultError } = await supabaseClient
          .from('twilio_accounts')
          .select('id, account_sid, auth_token, app_sid, phone_number')
          .eq('user_id', user.id)
          .eq('is_default', true)
          .maybeSingle();
        
        if (defaultError || !defaultAccount) {
          // If no default, get any account
          const { data: anyAccount, error: anyError } = await supabaseClient
            .from('twilio_accounts')
            .select('id, account_sid, auth_token, app_sid, phone_number')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle();
          
          if (anyError || !anyAccount) {
            // No accounts found
            return new Response(
              JSON.stringify({ error: 'No valid Twilio account found. Please set up a Twilio account first.' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            );
          }
          
          // Use the first account found
          twilioAccountSid = anyAccount.account_sid;
          twilioAuthToken = anyAccount.auth_token;
          twilioAppSid = anyAccount.app_sid;
          fromNumber = anyAccount.phone_number;
        } else {
          // Use the default account
          twilioAccountSid = defaultAccount.account_sid;
          twilioAuthToken = defaultAccount.auth_token;
          twilioAppSid = defaultAccount.app_sid;
          fromNumber = defaultAccount.phone_number;
        }
      } else {
        // The specified account exists, fetch its details
        const { data: accountData, error: accountError } = await supabaseClient
          .from('twilio_accounts')
          .select('account_sid, auth_token, app_sid, phone_number')
          .eq('id', accountId)
          .eq('user_id', user.id)
          .single();
        
        if (accountError || !accountData) {
          console.error("Account fetch error:", accountError);
          return new Response(
            JSON.stringify({ error: 'Error fetching Twilio account details' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        twilioAccountSid = accountData.account_sid;
        twilioAuthToken = accountData.auth_token;
        twilioAppSid = accountData.app_sid;
        fromNumber = accountData.phone_number;
      }
    }
    // Check if we got valid credentials from environment
    else if (twilioAccountSid && twilioAuthToken && twilioAppSid) {
      console.log("Using Twilio credentials from environment variables");
      useEnvCredentials = true;
      // Use the default phone number from environment if available
      fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
    } else {
      // Try to get the default account
      const { data: defaultAccount, error: defaultError } = await supabaseClient
        .from('twilio_accounts')
        .select('id, account_sid, auth_token, app_sid, phone_number')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .maybeSingle();
      
      if (!defaultError && defaultAccount) {
        // Use the default account
        twilioAccountSid = defaultAccount.account_sid;
        twilioAuthToken = defaultAccount.auth_token;
        twilioAppSid = defaultAccount.app_sid;
        fromNumber = defaultAccount.phone_number;
      } else {
        // If no default, get any account
        const { data: anyAccount, error: anyError } = await supabaseClient
          .from('twilio_accounts')
          .select('id, account_sid, auth_token, app_sid, phone_number')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();
        
        if (!anyError && anyAccount) {
          // Use the first account found
          twilioAccountSid = anyAccount.account_sid;
          twilioAuthToken = anyAccount.auth_token;
          twilioAppSid = anyAccount.app_sid;
          fromNumber = anyAccount.phone_number;
        } else {
          // If no accounts found, try to get from profile
          console.log("No accounts found, checking profile");
          const { data: profileData, error: profileError } = await supabaseClient
            .from('profiles')
            .select('twilio_account_sid, twilio_auth_token, twilio_app_sid, twilio_phone_number')
            .eq('id', user.id)
            .single();
          
          // Check if profile exists and has Twilio credentials
          if (profileError) {
            console.error("Profile fetch error:", profileError);
            return new Response(
              JSON.stringify({ error: 'Error fetching user profile' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            );
          }
          
          console.log("Profile data retrieved");
          
          if (!profileData?.twilio_account_sid || !profileData?.twilio_auth_token || !profileData?.twilio_app_sid) {
            console.log("Twilio credentials missing in profile for user:", user.id);
            return new Response(
              JSON.stringify({ error: 'Twilio credentials not found or incomplete. Please set up your Twilio account in the settings.' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            );
          }
          
          twilioAccountSid = profileData.twilio_account_sid;
          twilioAuthToken = profileData.twilio_auth_token;
          twilioAppSid = profileData.twilio_app_sid;
          fromNumber = profileData.twilio_phone_number;
        }
      }
    }
    
    // At this point, we should have all the Twilio credentials needed
    if (!twilioAccountSid || !twilioAuthToken) {
      return new Response(
        JSON.stringify({ error: 'Could not find valid Twilio credentials. Please set up your Twilio account.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    console.log("Making call with Twilio SID:", twilioAccountSid?.substring(0, 5) + "...");
    
    // Check if we have a phone number to use
    if (!fromNumber) {
      return new Response(
        JSON.stringify({ error: 'No phone number found to make calls from. Please add a phone number in settings.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
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
      
      // Update contact if it exists, or create new one
      const { data: existingContact } = await supabaseClient
        .from('contacts')
        .select('id')
        .eq('user_id', user.id)
        .eq('phone_number', to)
        .maybeSingle();
        
      if (!existingContact) {
        // Create a new contact
        await supabaseClient.from('contacts').insert({
          user_id: user.id,
          phone_number: to,
          last_contacted: new Date().toISOString(),
          contact_type: 'call'
        });
      } else {
        // Update existing contact's last_contacted time
        await supabaseClient
          .from('contacts')
          .update({ 
            last_contacted: new Date().toISOString(),
            contact_type: 'call'
          })
          .eq('id', existingContact.id);
      }
      
      // Log call to history
      await supabaseClient.from('call_history').insert({
        user_id: user.id,
        phone_number: to,
        direction: 'outgoing',
        status: 'initiated',
        twilio_call_sid: call.sid,
        twilio_account_sid: twilioAccountSid
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
