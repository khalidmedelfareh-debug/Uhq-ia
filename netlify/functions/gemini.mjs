
export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Méthode non autorisée", {
      status: 405
    });
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

    if (!message || typeof message !== "string") {
      return Response.json(
        { error: "Écris un message avant d'envoyer." },
        { status: 400 }
      );
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: "Tu es Uhq IA, une intelligence artificielle utile, intelligente, claire et sympathique. Tu réponds en français sauf demande contraire. Tes réponses sont naturelles et faciles à comprendre."
            }]
          },
          contents: [{
            role: "user",
            parts: [{ text: message }]
          }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        {
          error: data.error?.message || "Erreur Gemini."
        },
        { status: response.status }
      );
    }

    const answer = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("");

    return Response.json({
      answer: answer || "Je n'ai pas pu générer de réponse."
    });

  } catch (error) {
  console.error("UH Q IA ERROR:", error);

  return Response.json(
    {
      error: error.message || "Erreur inconnue du serveur."
    },
    { status: 500 }
  );
}