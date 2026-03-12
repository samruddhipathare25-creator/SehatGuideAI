import fetch from 'node-fetch';
import dotenv from "dotenv";
dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY not set in .env file!");
  process.exit(1);
}

async function listModels() {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();

    console.log("✅ MODELS AVAILABLE FOR YOUR KEY:");
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

listModels();
