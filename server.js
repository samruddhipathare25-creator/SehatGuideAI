import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dotenv from "dotenv";
import cors from "cors";
import Groq from "groq-sdk";

dotenv.config();

if (!process.env.GROQ_API_KEY) {
  console.error("❌ GROQ_API_KEY missing in .env file");
}

const app = express();
app.use(express.json());
app.use(cors());

// Fix __dirname for ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend
app.use(express.static(__dirname));

/* =======================================================
   ROUTES
======================================================= */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

app.get("/doctors_fallback.json", (req, res) => {
  res.sendFile(path.join(__dirname, "doctors_fallback.json"));
});

app.get("/vaccine_fallback.json", (req, res) => {
  res.sendFile(path.join(__dirname, "vaccine_fallback.json"));
});

app.get("/outbreaks.json", (req, res) => {
  res.sendFile(path.join(__dirname, "outbreaks.json"));
});

app.get("/api/test", (req, res) => {
  res.json({ msg: "Server working ✅" });
});

/* =======================================================
   LOAD JSON FILES
======================================================= */

let doctorsData = {};
let vaccineData = {};
let medicalData = [];

try {
  doctorsData = JSON.parse(
    fs.readFileSync(path.join(__dirname, "doctors_fallback.json"), "utf-8")
  );
  console.log("✅ doctors_fallback.json loaded");
} catch (err) {
  console.log("⚠ doctors_fallback.json not loaded");
}

try {
  vaccineData = JSON.parse(
    fs.readFileSync(path.join(__dirname, "vaccine_fallback.json"), "utf-8")
  );
  console.log("✅ vaccine_fallback.json loaded");
} catch (err) {
  console.log("⚠ vaccine_fallback.json not loaded");
}

try {
  medicalData = JSON.parse(
    fs.readFileSync(path.join(__dirname, "medicalDatabase.json"), "utf-8")
  );
  console.log("✅ medicalDatabase.json loaded");
} catch (err) {
  console.log("⚠ medicalDatabase.json not loaded");
}

/* =======================================================
   DOCTOR SEARCH
======================================================= */

app.post("/search-doctor", (req, res) => {
  const pin = req.body.pin?.toString().trim();
  const specialty = req.body.specialty?.trim();

  if (!pin || !specialty) {
    return res.json({ success: false, message: "PIN and specialty required" });
  }

  const doctorsAtPin = doctorsData[pin] || [];

  const doctors = doctorsAtPin.filter(
    (doc) =>
      (doc.specialty || "").toLowerCase() === specialty.toLowerCase()
  );

  if (!doctors.length) {
    return res.json({ success: false, message: "No doctors found" });
  }

  res.json({ success: true, doctors });
});

/* =======================================================
   VACCINE SEARCH
======================================================= */

app.post("/search-vaccine", (req, res) => {
  const pin = req.body.pin?.toString().trim();
  const minAge = parseInt(req.body.minAge) || 0;

  if (!pin) {
    return res.json({ success: false, message: "PIN required" });
  }

  const centers = (vaccineData[pin] || []).filter(
    (center) => minAge >= (center.min_age_limit ?? 0)
  );

  if (!centers.length) {
    return res.json({ success: false, message: "No vaccine centers found" });
  }

  res.json({ success: true, centers });
});

/* =======================================================
   EMERGENCY DETECTION
======================================================= */

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

/* =======================================================
   SMART DATABASE MATCHING
======================================================= */

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

/* =======================================================
   MEMORY SYSTEM
======================================================= */

let conversationHistory = {};

/* =======================================================
   GROQ AI SETUP
======================================================= */

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const langMap = {
  en: "English",
  hi: "Hindi",
  mr: "Marathi",
  ur: "Urdu",
  de: "German",
  kn: "Kannada",
};

/* =======================================================
   CHAT ROUTE
======================================================= */

app.post("/chat", async (req, res) => {
  try {
    const message = req.body.message?.trim();
    const lang = req.body.lang || "en";
    const userId = req.body.userId || "default";

    if (!message) {
      return res.json({ reply: "❌ Message empty" });
    }

    if (!conversationHistory[userId]) {
      conversationHistory[userId] = [];
    }

    // Save user message
    conversationHistory[userId].push({
      role: "user",
      content: message,
    });

    // Limit memory
    if (conversationHistory[userId].length > 6) {
      conversationHistory[userId].shift();
    }

    // Emergency check
    if (checkEmergency(message)) {
      return res.json({
        reply:
          "⚠ This may be a medical emergency. Please visit a hospital immediately.",
      });
    }

    // Database check
    const dbResult = findDatabaseAnswer(message);
    if (dbResult) {
      return res.json({ reply: dbResult.doctor_reply });
    }

    const languageName = langMap[lang] || "English";

    // Groq AI call
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `You are SehatGuide AI, a helpful health assistant. 
Give simple advice, precautions, and home care.
Do not diagnose serious diseases.
Always suggest consulting a doctor if serious.
Keep answer short (2-3 lines).
Ask 1 follow-up question.
Reply in ${languageName}.`
        },
        ...conversationHistory[userId]
      ]
    });

    const reply =
      completion.choices?.[0]?.message?.content ||
      "⚠ No response from AI";

    // Save bot reply
    conversationHistory[userId].push({
      role: "assistant",
      content: reply,
    });

    res.json({ reply });

  } catch (err) {
    console.error("❌ Groq Error:", err);

    res.status(200).json({
      reply:
        "⚠ I am unable to answer right now. Please consult a qualified doctor.",
    });
  }
});

/* =======================================================
   START SERVER (RENDER READY)
======================================================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
