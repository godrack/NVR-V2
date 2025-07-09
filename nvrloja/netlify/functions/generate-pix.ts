import postgres from "https://deno.land/x/postgresjs/mod.js";

const MP_TOKEN = Deno.env.get("MP_TOKEN");
const DB_URL = Deno.env.get("NETLIFY_DATABASE_URL");

const sql = postgres(DB_URL, { prepare: false });

export default async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response(null, { status: 204, headers: cors });

  const { nome, cpf, email, amount, description } = await req.json();

  const body = {
    transaction_amount: amount,
    description,
    payment_method_id: "pix",
    payer: {
      email,
      first_name: nome,
      identification: {
        type: "CPF",
        number: cpf.replace(/\D/g, "")
      }
    },
    notification_url: "https://novaviberoleplay.netlify.app/.netlify/functions/webhook"
  };

  const res = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MP_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const payment = await res.json();

  await sql`
    INSERT INTO pagamentos (id, status, nome, cpf, email, valor, criado_em)
    VALUES (${payment.id}, ${payment.status}, ${nome}, ${cpf}, ${email}, ${amount}, ${new Date().toISOString()})
  `;

  return new Response(JSON.stringify(payment), {
    headers: { ...cors, "Content-Type": "application/json" }
  });
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
