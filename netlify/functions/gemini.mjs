
export default async (req) => {
  if (req.method !== "POST") {
    return Response.json(
      { error: "Méthode non autorisée." },
      { status: 405 }
    );
  }

  try {
    const { message } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "Clé Gemini absente dans Netlify." },
        { status: 500 }
      );
    }

    if (typeof message !== "string" || !message.trim()) {
      return Response.json(
        { error: "Écris un message valide." },
        { status: 400 }
      );
    }

    const url =
      "https://generativelanguage.googleapis.com/v1beta/interactions";

    let response;
    let data;

    for (let attempt = 0; attempt < 3; attempt++) {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          model: "gemini-3.8-flash",
          input: message.trim(),
          system_instruction:
            "Tu es Uhq IA, une intelligence artificielle utile, intelligente, claire et sympathique. Tu réponds en français sauf demande contraire. Tu donnes des réponses naturelles, précises et faciles à comprendre. Tu adaptes la longueur de tes réponses à la question.",
          generation_config: {
            thinking_level: "medium",
            max_output_tokens: 1200
          },
          store: false
        })
      });

      data = await response.json();

      if (response.ok) break;

      const temporaryError = [429, 500, 502, 503, 504]
        .includes(response.status);

      if (!temporaryError || attempt === 2) {
        console.error("Gemini API:", data);

        return Response.json(
          {
            error: data.error?.message || "Erreur Gemini."
          },
          { status: response.status }
        );
      }

      await new Promise(resolve =>
        setTimeout(resolve, 800 * (attempt + 1))
      );
    }

    const answer = (data.output || [])
      .filter(item => item.type === "text")
      .map(item => item.text || "")
      .join("")
      .trim();

    if (!answer) {
      console.error("Réponse Gemini sans texte:", data);

      return Response.json(
        { error: "Gemini n'a pas renvoyé de texte." },
        { status: 502 }
      );
    }

    return Response.json({ answer });

  } catch (error) {
    console.error("UHQ IA ERROR:", error);

    return Response.json(
      { error: "Problème temporaire du serveur Uhq IA." },
      { status: 500 }
    );
  }
};
