import postgres from "https://deno.land/x/postgresjs/mod.js";

const MP_TOKEN = Deno.env.get("MP_TOKEN");
const DB_URL = Deno.env.get("NETLIFY_DATABASE_URL");

const sql = postgres(DB_URL, { prepare: false });

export default async (req: Request) => {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const topic = url.searchParams.get("topic");

  if (topic !== "payment" || !id)
    return new Response("Ignorado", { headers: cors });

  const res = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${MP_TOKEN}` }
  });

  const payment = await res.json();

  if (payment.status === "approved") {
    await sql`
      UPDATE pagamentos
      SET status = 'approved', atualizado_em = ${new Date().toISOString()}
      WHERE id = ${payment.id}
    `;
  }

  return new Response("OK", { headers: cors });
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "GET, POST"
};
