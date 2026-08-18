import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json();
    const kind = body.kind ?? "recipe";
    const profile = body.profile ?? {};
    const remaining = body.remaining ?? {};
    const equipment = body.equipment ?? [];
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) throw new Error("OPENAI_API_KEY manquante");

    const instruction = kind === "program"
      ? "Crée un programme de musculation sûr, progressif et simple avec uniquement le matériel fourni."
      : "Propose 3 idées de repas simples qui respectent au mieux les calories et macros restantes.";

    const prompt = `${instruction}\n\nProfil: ${JSON.stringify(profile)}\nMatériel: ${JSON.stringify(equipment)}\nMacros restantes: ${JSON.stringify(remaining)}\nRéponds en français.`;

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-5", input: prompt })
    });
    if (!r.ok) throw new Error(await r.text());
    const data = await r.json();
    return new Response(JSON.stringify({ text: data.output_text ?? "" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
