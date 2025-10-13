const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function getCategoryFromAI(description) {
  try {
    const prompt = `
      You are an intelligent expense categorization assistant.
      Categorize this expense based on the description into one of these categories:
      [Food, Travel, Shopping, Entertainment, Health, Bills, Groceries, Recharge, Education, Other].
      Description: "${description}"
      Return ONLY the category name.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const category = response.text?.trim();

    // ✅ Fallback if AI returns empty
    return category || "Other";
  } catch (error) {
    console.error("AI categorization error:", error);
    return "Other";
  }
}

module.exports = { getCategoryFromAI };
