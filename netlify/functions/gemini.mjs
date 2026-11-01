
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
        { error: "Clé Gemini manquante sur Netlify." },
        { status: 500 }
      );
    }

    if (typeof message !== "string" || !message.trim()) {
      return Response.json(
        { error: "Écris un message avant d'envoyer." },
        { status: 400 }
      );
    }

    const url =
      const url =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent";

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
          systemInstruction: {
            parts: [{
              text: "Tu es Uhq IA, une intelligence artificielle utile, intelligente, claire et sympathique. Tu réponds en français sauf demande contraire. Tes réponses sont naturelles, précises et faciles à comprendre."
            }]
          },
          contents: [{
            role: "user",
            parts: [{ text: message.trim() }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1200
          }
        })
      });

      data = await response.json();

      if (response.ok) break;

      const temporaryError = [429, 500, 502, 503, 504]
        .includes(response.status);

      if (!temporaryError || attempt === 2) {
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

    const answer = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

    return Response.json({
      answer: answer || "Je n'ai pas pu générer de réponse."
    });

  } catch (error) {
    console.error("UHQ IA ERROR:", error);

    return Response.json(
      { error: "Problème temporaire du serveur Uhq IA." },
      { status: 500 }
    );
  }
};
