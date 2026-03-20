import { Question } from "@/types";

export async function generateTest(category: string, topic: string, count: number = 5): Promise<Question[]> {
  try {
    const response = await fetch('/api/generate-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ category, topic, count }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Ошибка при вызове серверной функции");
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Ошибка при генерации теста:", error);
    throw error;
  }
}
