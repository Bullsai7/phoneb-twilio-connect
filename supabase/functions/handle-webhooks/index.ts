
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
    const formData = await req.formData();
    const twilioData = Object.fromEntries(formData.entries());
    console.log('Received webhook data:', twilioData);
    
    // Determine if this is a call or a message webhook
    if (twilioData.CallSid) {
      // This is a call webhook
      // Find the user associated with this Twilio account SID
      const { data: profiles } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('twilio_account_sid', twilioData.AccountSid);
      
      if (profiles && profiles.length > 0) {
        const userId = profiles[0].id;
        
        // Log call to history
        await supabaseClient.from('call_history').insert({
          user_id: userId,
          phone_number: twilioData.From,
          direction: 'incoming',
          status: twilioData.CallStatus,
          twilio_call_sid: twilioData.CallSid,
          duration: twilioData.CallDuration,
        });
      }
    } else if (twilioData.MessageSid) {
      // This is a message webhook
      // Find the user associated with this Twilio account SID
      const { data: profiles } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('twilio_account_sid', twilioData.AccountSid);
      
      if (profiles && profiles.length > 0) {
        const userId = profiles[0].id;
        
        // Log message to history
        await supabaseClient.from('message_history').insert({
          user_id: userId,
          phone_number: twilioData.From,
          content: twilioData.Body,
          direction: 'incoming',
          twilio_message_sid: twilioData.MessageSid,
        });
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
