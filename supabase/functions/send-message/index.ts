
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
    
    // Get the request body
    const { to, message, accountId } = await req.json();
    
    if (!to || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: to, message' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Get Twilio credentials - either from specific account, environment, or user profile
    let accountSid, authToken, fromNumber;
    
    // Check if we should use a specific Twilio account
    if (accountId) {
      console.log("Using specific Twilio account:", accountId);
      const { data: accountData, error: accountError } = await supabaseClient
        .from('twilio_accounts')
        .select('account_sid, auth_token, phone_number')
        .eq('id', accountId)
        .eq('user_id', user.id)
        .single();
      
      if (accountError || !accountData) {
        return new Response(
          JSON.stringify({ error: 'Twilio account not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      accountSid = accountData.account_sid;
      authToken = accountData.auth_token;
      fromNumber = accountData.phone_number;
    } else {
      // Try environment variables first
      accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
      authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
      fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
      
      // If not available, get from user profile
      if (!accountSid || !authToken) {
        const { data: profile, error: profileError } = await supabaseClient
          .from('profiles')
          .select('twilio_account_sid, twilio_auth_token, twilio_phone_number')
          .eq('id', user.id)
          .single();
        
        if (profileError || !profile || !profile.twilio_account_sid || !profile.twilio_auth_token) {
          return new Response(
            JSON.stringify({ error: 'Twilio credentials not found' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        accountSid = profile.twilio_account_sid;
        authToken = profile.twilio_auth_token;
        
        if (profile.twilio_phone_number) {
          fromNumber = profile.twilio_phone_number;
        }
      }
    }
    
    if (!fromNumber) {
      return new Response(
        JSON.stringify({ error: 'No phone number configured to send messages from' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Initialize Twilio client
    const twilioClient = twilio(accountSid, authToken);
    
    // Format phone number (ensure it has country code)
    const formattedTo = to.startsWith('+') ? to : `+1${to.replace(/\D/g, '')}`;
    
    // Send the message
    const sms = await twilioClient.messages.create({
      to: formattedTo,
      from: fromNumber,
      body: message,
    });
    
    // Update contact if it exists, or create new one
    const { data: existingContact } = await supabaseClient
      .from('contacts')
      .select('id')
      .eq('user_id', user.id)
      .eq('phone_number', formattedTo)
      .maybeSingle();
      
    if (!existingContact) {
      // Create a new contact
      await supabaseClient.from('contacts').insert({
        user_id: user.id,
        phone_number: formattedTo,
        last_contacted: new Date().toISOString(),
        contact_type: 'message'
      });
    } else {
      // Update existing contact's last_contacted time
      await supabaseClient
        .from('contacts')
        .update({ 
          last_contacted: new Date().toISOString(),
          contact_type: 'message'
        })
        .eq('id', existingContact.id);
    }
    
    // Log message to history
    await supabaseClient.from('message_history').insert({
      user_id: user.id,
      phone_number: formattedTo,
      content: message,
      direction: 'outgoing',
      twilio_message_sid: sms.sid,
      twilio_account_sid: accountSid
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
