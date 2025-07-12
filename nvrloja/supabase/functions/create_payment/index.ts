import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "*"
      }
    });
  }

  if (req.method !== "POST") {
    return new Response("Método não permitido", { status: 405 });
  }

  try {
    const { transaction_amount, description, payer, external_reference, metadata } = await req.json();

    const MP_TOKEN = Deno.env.get("MP_TOKEN");
    if (!MP_TOKEN) {
      return new Response("Token Mercado Pago não configurado", {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MP_TOKEN}`,
      },
      body: JSON.stringify({
        transaction_amount,
        payment_method_id: "pix",
        description,
        external_reference,
        payer,
        metadata
      }),
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (error) {
    console.error("Erro interno:", error);
    return new Response(JSON.stringify({ error: "Erro interno", details: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
});
