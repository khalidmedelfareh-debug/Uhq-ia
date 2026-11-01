
export default async (req) => {
  if (req.method !== "POST") {
    return Response.json(
      { error: "Méthode non autorisée." },
      { status: 405 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "Clé API Gemini manquante." },
      { status: 500 }
    );
  }

  try {
    const { message } = await req.json();

    if (typeof message !== "string" || !message.trim()) {
      return Response.json(
        { error: "Message invalide." },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    let response;

    try {
      response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/interactions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey
          },
          body: JSON.stringify({
            model: "gemini-3.8-flash",
            input: message.trim(),
            system_instruction:
              "Tu es Uhq IA, une intelligence artificielle utile, intelligente, claire et sympathique. Réponds en français sauf demande contraire. Donne des réponses naturelles, précises et adaptées à la question.",
            generation_config: {
              thinking_level: "low",
              max_output_tokens: 1000
            },
            store: false,
            stream: true
          }),
          signal: controller.signal
        }
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const errorData = await response.json();

      return Response.json(
        {
          error: errorData.error?.message || "Erreur Gemini."
        },
        { status: response.status }
      );
    }

    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });

  } catch (error) {
    console.error("UHQ IA:", error);

    return Response.json(
      {
        error: error.name === "AbortError"
          ? "Gemini met trop de temps à répondre."
          : "Erreur du serveur Uhq IA."
      },
      { status: 500 }
    );
  }
};
