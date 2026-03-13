import Groq from "@google/generative-ai";
import medicalData from "../../data/medicalDatabase.json";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

let conversationHistory = {};

const langMap = {
  en: "English",
  hi: "Hindi",
  mr: "Marathi",
  ur: "Urdu",
  de: "German",
  kn: "Kannada",
};

function checkEmergency(message) {
  const emergencyKeywords = [
    "chest pain",
    "breathing problem",
    "unconscious",
    "seizure",
    "heavy bleeding",
    "heart attack",
    "stroke",
  ];
  return emergencyKeywords.some((word) =>
    message.toLowerCase().includes(word)
  );
}

function findDatabaseAnswer(message) {
  const lowerMsg = message.toLowerCase().trim();
  const ignoreWords = ["yes", "no", "ok", "okay", "myself", "4", "5", "6"];
  if (ignoreWords.includes(lowerMsg)) return null;

  for (let entry of medicalData) {
    for (let keyword of entry.keywords) {
      if (lowerMsg.includes(keyword.toLowerCase())) {
        return entry;
      }
    }
  }
  return null;
}

export async function handler(event) {
  try {
    const { message, lang = "en", userId = "default" } = JSON.parse(event.body);
    if (!message) return { statusCode: 200, body: JSON.stringify({ reply: "❌ Message empty" }) };

    if (!conversationHistory[userId]) conversationHistory[userId] = [];
    conversationHistory[userId].push({ role: "user", content: message });
    if (conversationHistory[userId].length > 6) conversationHistory[userId].shift();

    if (checkEmergency(message)) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          reply: "⚠ This may be a medical emergency. Please visit a hospital immediately.",
        }),
      };
    }

    const dbResult = findDatabaseAnswer(message);
    if (dbResult) {
      return { statusCode: 200, body: JSON.stringify({ reply: dbResult.doctor_reply }) };
    }

    const chatHistoryText = conversationHistory[userId]
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    const languageName = langMap[lang] || "English";

    const prompt = `
You are SehatGuide AI, a health awareness chatbot.

Rules:
- Give simple medical guidance.
- Suggest precautions and home care.
- DO NOT refuse answering health questions.
- DO NOT say "I cannot advise".
- Do not diagnose serious diseases.
- Always suggest consulting a doctor for serious illness.
- Reply in ${languageName}.
- Keep answer short (2-3 lines).
- Ask 1 follow-up question.

Conversation:
${chatHistoryText}

Reply to the latest user message.
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "You are SehatGuide AI health assistant." },
        { role: "user", content: prompt },
      ],
    });

    const reply = completion.choices[0].message.content;
    conversationHistory[userId].push({ role: "assistant", content: reply });

    return { statusCode: 200, body: JSON.stringify({ reply }) };
  } catch (err) {
    console.error("❌ Groq Error:", err);
    return {
      statusCode: 200,
      body: JSON.stringify({ reply: "⚠ I am unable to answer right now. Please consult a qualified doctor." }),
    };
  }
}
import doctorsData from "../../data/doctors_fallback.json";

export async function handler(event) {
  try {
    const { pin, specialty } = JSON.parse(event.body);
    if (!pin || !specialty) {
      return { statusCode: 200, body: JSON.stringify({ success: false, message: "PIN and specialty required" }) };
    }

    const doctorsAtPin = doctorsData[pin] || [];
    const doctors = doctorsAtPin.filter(
      (doc) => (doc.specialty || "").toLowerCase() === specialty.toLowerCase()
    );

    if (!doctors.length) {
      return { statusCode: 200, body: JSON.stringify({ success: false, message: "No doctors found" }) };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, doctors }) };
  } catch (err) {
    console.error("❌ SearchDoctor Error:", err);
    return { statusCode: 500, body: JSON.stringify({ success: false, message: "Server error" }) };
  }
}
import vaccineData from "../../data/vaccine_fallback.json";

export async function handler(event) {
  try {
    const { pin, minAge = 0 } = JSON.parse(event.body);
    if (!pin) return { statusCode: 200, body: JSON.stringify({ success: false, message: "PIN required" }) };

    const centers = (vaccineData[pin] || []).filter(
      (center) => minAge >= (center.min_age_limit ?? 0)
    );

    if (!centers.length) {
      return { statusCode: 200, body: JSON.stringify({ success: false, message: "No vaccine centers found" }) };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, centers }) };
  } catch (err) {
    console.error("❌ SearchVaccine Error:", err);
    return { statusCode: 500, body: JSON.stringify({ success: false, message: "Server error" }) };
  }
}
