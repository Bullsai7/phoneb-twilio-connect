
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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
    
    // Parse the incoming webhook data from Twilio
    let twilioData;
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      // Handle JSON data
      twilioData = await req.json();
    } else if (contentType.includes('application/x-www-form-urlencoded') || 
              contentType.includes('multipart/form-data')) {
      // Handle form data
      const formData = await req.formData();
      twilioData = Object.fromEntries(formData.entries());
    } else {
      // Default parsing as form data
      try {
        const formData = await req.formData();
        twilioData = Object.fromEntries(formData.entries());
      } catch (e) {
        console.error('Error parsing request body:', e);
        twilioData = {};
      }
    }
    
    console.log('Received webhook data:', twilioData);
    
    // Determine if this is a call or a message webhook
    if (twilioData.CallSid) {
      // This is a call webhook
      // Find the user associated with this Twilio account SID
      const { data: profiles, error: profileError } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('twilio_account_sid', twilioData.AccountSid);
      
      if (profileError) {
        console.error('Error querying profiles:', profileError);
      }
      
      // Also check twilio_accounts table
      const { data: accounts, error: accountsError } = await supabaseClient
        .from('twilio_accounts')
        .select('user_id')
        .eq('account_sid', twilioData.AccountSid);
      
      if (accountsError) {
        console.error('Error querying twilio_accounts:', accountsError);
      }
      
      // Combine user IDs from both sources
      let userIds: string[] = [];
      
      if (profiles && profiles.length > 0) {
        userIds = [...userIds, ...profiles.map(p => p.id)];
      }
      
      if (accounts && accounts.length > 0) {
        userIds = [...userIds, ...accounts.map(a => a.user_id)];
      }
      
      // Remove duplicates
      userIds = [...new Set(userIds)];
      
      if (userIds.length > 0) {
        // Process for each associated user
        for (const userId of userIds) {
          // Update or create contact
          const { data: existingContact } = await supabaseClient
            .from('contacts')
            .select('id')
            .eq('user_id', userId)
            .eq('phone_number', twilioData.From)
            .maybeSingle();
            
          if (!existingContact) {
            // Create a new contact
            await supabaseClient.from('contacts').insert({
              user_id: userId,
              phone_number: twilioData.From,
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
            user_id: userId,
            phone_number: twilioData.From,
            direction: 'incoming',
            status: twilioData.CallStatus,
            twilio_call_sid: twilioData.CallSid,
            twilio_account_sid: twilioData.AccountSid,
            duration: twilioData.CallDuration,
          });
        }
      } else {
        console.log('No users found for AccountSid:', twilioData.AccountSid);
      }
    } else if (twilioData.MessageSid) {
      // This is a message webhook
      // Find the user associated with this Twilio account SID
      const { data: profiles, error: profileError } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('twilio_account_sid', twilioData.AccountSid);
      
      if (profileError) {
        console.error('Error querying profiles:', profileError);
      }
      
      // Also check twilio_accounts table
      const { data: accounts, error: accountsError } = await supabaseClient
        .from('twilio_accounts')
        .select('user_id')
        .eq('account_sid', twilioData.AccountSid);
      
      if (accountsError) {
        console.error('Error querying twilio_accounts:', accountsError);
      }
      
      // Combine user IDs from both sources
      let userIds: string[] = [];
      
      if (profiles && profiles.length > 0) {
        userIds = [...userIds, ...profiles.map(p => p.id)];
      }
      
      if (accounts && accounts.length > 0) {
        userIds = [...userIds, ...accounts.map(a => a.user_id)];
      }
      
      // Remove duplicates
      userIds = [...new Set(userIds)];
      
      if (userIds.length > 0) {
        // Process for each associated user
        for (const userId of userIds) {
          // Update or create contact
          const { data: existingContact } = await supabaseClient
            .from('contacts')
            .select('id')
            .eq('user_id', userId)
            .eq('phone_number', twilioData.From)
            .maybeSingle();
            
          if (!existingContact) {
            // Create a new contact
            await supabaseClient.from('contacts').insert({
              user_id: userId,
              phone_number: twilioData.From,
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
            user_id: userId,
            phone_number: twilioData.From,
            content: twilioData.Body,
            direction: 'incoming',
            twilio_message_sid: twilioData.MessageSid,
            twilio_account_sid: twilioData.AccountSid,
          });
        }
      } else {
        console.log('No users found for AccountSid:', twilioData.AccountSid);
      }
    }
    
    // Return a TwiML response for Twilio
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Thank you for your message. We'll get back to you soon.</Message>
</Response>`;
    
    return new Response(twimlResponse, { 
      headers: { ...corsHeaders, 'Content-Type': 'application/xml' }, 
      status: 200 
    });
    
  } catch (error) {
    console.error('Error handling webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
