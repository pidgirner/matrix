export const config = {
  runtime: 'edge',
};

import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    const body = await req.json();
    const { category, topic, count } = body;
    
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not configured in environment" }), { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const model = "gemini-3-flash-preview";

    const prompt = `Сгенерируй тест для проверки компетенций в категории "${category}" по теме "${topic}". 
  Тест должен состоять из ${count || 5} вопросов с вариантами ответов.
  Каждый вопрос должен быть связан с конкретным навыком/под-компетенцией в рамках этой темы.
  Ответ должен быть в формате JSON массива объектов со следующей структурой:
  {
    "question": "Текст вопроса",
    "options": ["Вариант A", "Вариант B", "Вариант C", "Вариант D"],
    "correctIndex": 0,
    "skill": "Название конкретного навыка (например, 'Синтаксис', 'Управление памятью', 'Многопоточность')",
    "explanation": "Объяснение правильного ответа"
  }
  ВАЖНО: Весь текст должен быть на РУССКОМ языке.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctIndex: { type: Type.INTEGER },
              skill: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ["question", "options", "correctIndex", "skill", "explanation"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return new Response(text, { 
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error in generate-test edge function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }
}
