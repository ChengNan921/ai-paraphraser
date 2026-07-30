export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed." });
  }

  const { text } = request.body || {};

  if (typeof text !== "string" || !text.trim()) {
    return response.status(400).json({ error: "Please enter text to rewrite." });
  }

  if (text.length > 5000) {
    return response.status(400).json({ error: "Please keep text under 5,000 characters." });
  }

  const apiKey = process.env.LLM_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL || "https://api.deepseek.com/chat/completions";
  const model = process.env.LLM_MODEL || "deepseek-chat";

  if (!apiKey) {
    return response.status(500).json({ error: "The AI service is not configured yet." });
  }

  try {
    const upstream = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "Rewrite the user's text in clear, natural English. Preserve its meaning. Return only the rewritten text."
          },
          { role: "user", content: text.trim() }
        ],
        temperature: 0.5
      })
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      console.error("LLM error:", data);
      return response.status(502).json({ error: "The AI service could not process this request." });
    }

    const rewritten = data.choices?.[0]?.message?.content?.trim();

    if (!rewritten) {
      return response.status(502).json({ error: "The AI service returned no text." });
    }

    return response.status(200).json({ text: rewritten });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Unable to reach the AI service." });
  }
}
