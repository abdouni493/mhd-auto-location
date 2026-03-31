// @ts-ignore - Deno runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - Deno runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
};

interface SendContractEmailPayload {
  email: string;
  clientName: string;
  reservationId: string;
  htmlBase64: string;
  sender: string;
  language: "fr" | "ar";
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const payload: SendContractEmailPayload = await req.json();

    // Validate required fields
    if (!payload.email || !payload.sender || !payload.htmlBase64) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: email, sender, or htmlBase64",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Placeholder response (replace with actual email service response)
    return new Response(
      JSON.stringify({
        success: true,
        message: "Contract email sent successfully",
        details: {
          to: payload.email,
          from: payload.sender,
          subject: payload.language === "fr" ? "Votre Contrat de Location" : "عقد التأجير الخاص بك",
          language: payload.language,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
