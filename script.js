import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({});

const response = await ai.models.generateContent({
  model: 'gemini-flash-latest',
  contents: 'Explain how AI works in a few words',
});

console.log(response.text);