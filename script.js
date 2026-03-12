// ===============================
// 🌍 LANGUAGE SYSTEM
// ===============================
let selectedLang = localStorage.getItem("SEHATGUIDE_LANG") || "en";

// ===============================
// 🔊 VOICE SYSTEM
// ===============================
let VOICE_ENABLED = localStorage.getItem("SEHATGUIDE_VOICE") === "true";

function speakText(text) {
  if (!VOICE_ENABLED || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const langMap = { en: "en-IN", hi: "hi-IN", mr: "mr-IN", ur: "ur-PK", de: "de-DE", kn: "kn-IN" };
  utterance.lang = langMap[selectedLang] || "en-IN";
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function updateVoiceButtonText() {
  const voiceBtn = document.getElementById("voiceBtn");
  if (!voiceBtn) return;
  const key = VOICE_ENABLED ? "btnVoiceOn" : "btnVoiceOff";
  voiceBtn.innerHTML = window.translations?.[selectedLang]?.[key] || (VOICE_ENABLED ? "🔊 Voice On" : "🔇 Voice Off");
}

// ===============================
// 🔤 LANGUAGE APPLY
// ===============================
function applyLanguage(lang) {
  selectedLang = lang;
  localStorage.setItem("SEHATGUIDE_LANG", lang);

  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.classList.remove("active");
    if (btn.dataset.lang === lang) btn.classList.add("active");
  });

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (window.translations?.[lang]?.[key]) el.innerHTML = window.translations[lang][key];
  });

  const userInput = document.getElementById("userInput");
  if (userInput && window.translations[lang]?.inputPlaceholder) userInput.placeholder = window.translations[lang].inputPlaceholder;

  const pinInput = document.getElementById("pinInput");
  if (pinInput && window.translations[lang]?.pinPlaceholder) pinInput.placeholder = window.translations[lang].pinPlaceholder;

  const cityInput = document.getElementById("doctorCityInput");
  if (cityInput && window.translations[lang]?.cityPlaceholder) cityInput.placeholder = window.translations[lang].cityPlaceholder;

  updateVoiceButtonText();
}

// ===============================
// 🔐 AUTH & USER PROFILE
// ===============================
if (typeof protectPage === "function") protectPage();

if (typeof getCurrentUser === "function") {
  const user = getCurrentUser();
  if (user) {
    const nameEl = document.getElementById("userName");
    const emailEl = document.getElementById("userEmail");
    if (nameEl) nameEl.innerText = "👤 " + user.name;
    if (emailEl) emailEl.innerText = user.email + " (" + user.role + ")";
  }
}

// ===============================
// 📌 POPUP SYSTEM
// ===============================
const popup = document.getElementById("popup");
const popupTitle = document.getElementById("popupTitle");
const popupBody = document.getElementById("popupBody");
const closePopup = document.getElementById("closePopup");

function showPopup(title, body) {
  if (!popup) return;
  popupTitle.innerText = title;
  popupBody.innerHTML = body;
  popup.style.display = "flex";
}

if (closePopup) closePopup.addEventListener("click", () => popup.style.display = "none");

// ===============================
// 💉 VACCINE CENTERS (PIN SEARCH)
// ===============================
async function fetchVaccineCenters() {
  const pin = document.getElementById("pinInput").value.trim();
  const resultDiv = document.getElementById("vaccineResult");
  if (!pin || pin.length !== 6) {
    resultDiv.innerHTML = "<p style='color:#ff8080;'>❌ Please enter a valid 6-digit PIN.</p>";
    return;
  }
  resultDiv.innerHTML = "<p>⏳ Searching vaccine centers...</p>";

  try {
    const res = await fetch("/vaccine_fallback.json");
    const data = await res.json();
    const centers = data[pin] || [];
    resultDiv.innerHTML = "";
    if (!centers.length) {
      resultDiv.innerHTML = "<p>No vaccine centers found for this PIN.</p>";
      return;
    }

    // Save district for outbreak alerts
    localStorage.setItem("USER_DISTRICT", centers[0].district_name);

    centers.forEach(c => {
      const div = document.createElement("div");
      div.className = "vaccine-card";
      div.innerHTML = `
        <h4>${c.name || "Vaccine Center"}</h4>
        <p><b>Address:</b> ${c.address || "N/A"}</p>
        <p><b>Block:</b> ${c.block_name || "N/A"}</p>
        <p><b>District:</b> ${c.district_name || "N/A"}</p>
        <p><b>Vaccine:</b> ${c.vaccine || "N/A"}</p>
        <p><b>Min Age:</b> ${c.min_age_limit ?? "N/A"}+</p>
        <p><b>Available:</b> ${c.available_capacity ?? "N/A"}</p>
        ${c.maps_link ? `<p><a href="${c.maps_link}" target="_blank">📍 Open in Google Maps</a></p>` : ""}
      `;
      resultDiv.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    resultDiv.innerHTML = "<p style='color:#ff8080;'>❌ Error loading vaccine centers</p>";
  }
}

// ===============================
// 💉 VACCINATION SCHEDULE POPUP
// ===============================
const vaccBtn = document.getElementById("vaccBtn");
if (vaccBtn) {
  vaccBtn.addEventListener("click", () => {
    showPopup(
      "💉 National Immunization Schedule (NIS)",
      `
      <b>For Pregnant Women:</b><br/>
      TT-1: Early pregnancy, 0.5 ml, IM<br/>
      TT-2: 4 weeks after TT-1, 0.5 ml, IM<br/>
      TT-Booster: If 2 doses in last 3 yrs, 0.5 ml, IM<br/><br/>

      <b>For Infants:</b><br/>
      BCG: At birth, 0.1 ml, ID<br/>
      Hep B: At birth, 0.5 ml, IM<br/>
      OPV 1,2,3: 6,10,14 wks, 2 drops<br/>
      Pentavalent 1,2,3: 6,10,14 wks, 0.5 ml, IM<br/>
      IPV: 6 & 14 wks, 0.1 ml, ID<br/><br/>

      <b>For Children:</b><br/>
      DPT booster-1: 16-24 months, 0.5 ml, IM<br/>
      Measles/MR 2nd: 16-24 months, 0.5 ml, SC<br/>
      OPV Booster: 16-24 months, 2 drops<br/>
      TT: 10 & 16 yrs, 0.5 ml, IM<br/><br/>

      Tip: Visit nearest PHC/CHC for free vaccines.
      `
    );
  });
}

const outbreakBtn = document.getElementById("outbreakBtn");
if (outbreakBtn) {
  outbreakBtn.addEventListener("click", () => {
    showPopup(
      "🚨 Outbreak Alert",
      `
      ⚠️ Dengue risk increasing in nearby areas.<br/>
      Use mosquito nets and remove stagnant water.<br/>
      ⚠️ Flu cases rising in some regions.<br/>
      Maintain hygiene and drink warm fluids.<br/>
      ⚠️ COVID-19 precaution: Wear masks in crowded places.<br/>
      `
    );
  });
}
// ===============================
// 🩺 DOCTOR SEARCH & BOOKING
// ===============================
async function searchDoctors() {
  const city = document.getElementById("doctorCityInput").value.trim();
  const spec = document.getElementById("specialtySelect").value.trim();
  const resultDiv = document.getElementById("doctorResult");

  if (!city) {
    resultDiv.innerHTML = "<p style='color:#ff8080;'>❌ Please enter a city name.</p>";
    return;
  }

  resultDiv.innerHTML = "<p>⏳ Searching doctors...</p>";

  try {
    const res = await fetch("/doctors_fallback.json");
    const data = await res.json();
    let doctors = data[city] || [];

    if (spec && spec !== "All") {
      doctors = doctors.filter(d => (d.specialty || "").toLowerCase() === spec.toLowerCase());
    }

    resultDiv.innerHTML = "";
    if (!doctors.length) {
      resultDiv.innerHTML = "<p>❌ No doctors found.</p>";
      return;
    }

    doctors.forEach(d => {
      const div = document.createElement("div");
      div.className = "doctor-card";
      div.innerHTML = `
        <h4>${d.name || "Doctor"}</h4>
        <p><b>Specialty:</b> ${d.specialty || "N/A"}</p>
        <p><b>Hospital/Clinic:</b> ${d.hospital || "N/A"}</p>
        <p><b>Address:</b> ${d.address || "N/A"}</p>
        <p><b>Fees:</b> ₹${d.fees ?? "N/A"}</p>
        <p><b>Available Time:</b> ${d.time || "N/A"}</p>
        ${d.maps_link ? `<p><a href="${d.maps_link}" target="_blank">📍 Maps</a></p>` : ""}
        ${d.website ? `<p><a href="${d.website}" target="_blank">🌐 Website</a></p>` : ""}
        <button onclick="bookDoctor('${d.name || "Doctor"}')">📅 Book Appointment</button>
      `;
      resultDiv.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    resultDiv.innerHTML = "<p style='color:#ff8080;'>❌ Error loading doctors</p>";
  }
}

function bookDoctor(name) {
  showPopup("✅ Appointment Booked", `Your appointment request has been booked with <b>${name}</b>.<br/>(Demo booking)`);
}

// ===============================
// 🚨 OUTBREAK ALERTS
// ===============================
let outbreakData = [];
let outbreakIndex = 0;

async function loadOutbreakAlerts() {
  try {
    const res = await fetch("/outbreaks.json");
    outbreakData = await res.json();
    if (!outbreakData?.length) return;
    showNextAlert();
    setInterval(showNextAlert, 10000);
  } catch (err) {
    console.error(err);
  }
}

function showNextAlert() {
  if (!outbreakData.length) return;
  const alert = outbreakData[outbreakIndex];
  const alertText = `⚠️ ${alert.disease || "Disease"} outbreak in ${alert.district || "your area"}. ${alert.advisory || "Follow local health precautions."}`;
  const alertEl = document.getElementById("alertText");
  if (alertEl) alertEl.innerText = alertText;
  outbreakIndex = (outbreakIndex + 1) % outbreakData.length;
}

// ===============================
// 🩺 SYMPTOM CHECKER
// ===============================
const diseaseDatabase = [
  { symptoms: ["fever","cough","sore throat","runny nose"], disease: "Common Cold", advice: "Rest and drink warm fluids." },
  { symptoms: ["fever","cough","body pain"], disease: "Flu", advice: "Take rest and drink fluids." }
];

function checkSymptoms() {
  let input = document.getElementById("symptomsInput").value.toLowerCase();
  let userSymptoms = input.split(",");
  let bestMatch = null;

  diseaseDatabase.forEach(disease => {
    let match = disease.symptoms.some(symptom => userSymptoms.includes(symptom));
    if(match) bestMatch = disease;
  });

  document.getElementById("symptomResult").innerHTML = bestMatch ?
    `Possible Disease: ${bestMatch.disease}<br>Advice: ${bestMatch.advice}` :
    "Symptoms not recognized. Please consult a doctor.";
}

// ===============================
// 🤖 CHATBOT
// ===============================
let chatHistory = [];

function addMessage(sender, text) {
  const chatBody = document.getElementById("chatBody");
  if (!chatBody) return;
  const div = document.createElement("div");
  div.className = sender === "bot" ? "bot-msg" : "user-msg";
  div.innerHTML = text;
  chatBody.appendChild(div);
  chatBody.scrollTop = chatBody.scrollHeight;

  chatHistory.push({ sender, text });
  renderHistory();
  if(sender === "bot") speakText(text.replace(/<[^>]+>/g, ""));
}

function sendMessage() {
  const userInput = document.getElementById("userInput");
  const msg = userInput.value.trim();
  if (!msg) return;
  addMessage("user", msg);
  userInput.value = "";

  fetch("/chat", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ message: msg, lang: selectedLang })})
  .then(res => res.json())
  .then(data => addMessage("bot", data.reply || "❌ No reply from server"))
  .catch(err => { console.error(err); addMessage("bot", "❌ Server not responding.") });
}

// ===============================
// CHAT HISTORY SIDEBAR
// ===============================
function renderHistory() {
  const historyList = document.getElementById("historyList");
  if(!historyList) return;
  historyList.innerHTML = "";
  chatHistory.forEach(item => {
    const p = document.createElement("p");
    p.textContent = item.sender === "bot" ? `Bot: ${item.text.replace(/<[^>]+>/g,"")}` : `You: ${item.text}`;
    historyList.appendChild(p);
  });
  historyList.scrollTop = historyList.scrollHeight;
}

document.getElementById("clearHistoryBtn")?.addEventListener("click", () => { chatHistory=[]; renderHistory(); });

// ===============================
// CHAT TOGGLE
// ===============================
function toggleChatbot() {
  const chat = document.getElementById("chatCard");
  chat.style.display = (chat.style.display === "none" || chat.style.display === "") ? "block" : "none";
}

// ===============================
// DOM CONTENT LOADED
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  applyLanguage(selectedLang);

  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.addEventListener("click", () => applyLanguage(btn.dataset.lang));
  });

  const sendBtn = document.getElementById("sendBtn");
  const userInput = document.getElementById("userInput");
  if(sendBtn && userInput) {
    sendBtn.addEventListener("click", sendMessage);
    userInput.addEventListener("keydown", e => { if(e.key==="Enter") sendMessage(); });
  }

  const voiceBtn = document.getElementById("voiceBtn");
  if(voiceBtn) voiceBtn.addEventListener("click", () => {
    VOICE_ENABLED = !VOICE_ENABLED;
    localStorage.setItem("SEHATGUIDE_VOICE", VOICE_ENABLED);
    updateVoiceButtonText();
    if(!VOICE_ENABLED) speechSynthesis.cancel();
    else speakText("Voice enabled");
  });

  updateVoiceButtonText();

  // Start demo messages
  const startBtn = document.getElementById("startDemoBtn");
  if(startBtn) startBtn.addEventListener("click", startDemo);


  
  // Load outbreak alerts
  loadOutbreakAlerts();
});

// ===============================
// DEMO CHAT
// ===============================
function startDemo() {
  const chatBody = document.getElementById("chatBody");
  chatBody.innerHTML = "";
  const userInput = document.getElementById("userInput");

  const demoMessages = [
    { sender:"bot", text:"👋 Hello! I’m SehatGuide AI, your health assistant." },
    { sender:"bot", text:"You can ask me about symptoms, vaccines, outbreaks, or doctors." },
    { sender:"user", text:"Hi! I want to know about dengue." },
    { sender:"bot", text:"Dengue is spread by mosquitoes. Use mosquito nets and remove stagnant water." },
    { sender:"user", text:"Where can I get vaccinated?" },
    { sender:"bot", text:"You can check vaccination centers in your area by entering your PIN code above." }
  ];

  let index=0;
  function showNext() {
    if(index<demoMessages.length){
      addMessage(demoMessages[index].sender, demoMessages[index].text);
      index++;
      setTimeout(showNext,1200);
    }
  }
  showNext();
}




function showPopup(title, body) {
  const popup = document.getElementById("popup");
  const popupTitle = document.getElementById("popupTitle");
  const popupBody = document.getElementById("popupBody");
  const closePopup = document.getElementById("closePopup");

  if(!popup || !popupTitle || !popupBody) return;

  popupTitle.innerHTML = title;
  popupBody.innerHTML = body;
  popup.style.display = "flex";

  if(closePopup){
    closePopup.onclick = () => popup.style.display = "none";
  }

}


// 1️⃣ Load your fallback medical database
let medicalDB = {};

async function loadMedicalDB() {
  try {
    const res = await fetch("/medicalDatabase.json"); // make sure the path is correct
    medicalDB = await res.json();
    console.log("Medical DB loaded", medicalDB);
  } catch (err) {
    console.error("Failed to load medical database:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadMedicalDB();
});

// 2️⃣ Modify sendMessage() to use server first, fallback second
function sendMessage() {
  const userInput = document.getElementById("userInput");
  const msg = userInput.value.trim();
  if (!msg) return;
  addMessage("user", msg);
  userInput.value = "";

  // Try server first
  fetch("/chat", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ message: msg, lang: selectedLang })
  })
  .then(res => res.json())
  .then(data => {
    if(data.reply) addMessage("bot", data.reply);
    else fallbackReply(msg); // use fallback if no server reply
  })
  .catch(err => {
    console.error(err);
    fallbackReply(msg); // server failed → fallback
  });
}

// 3️⃣ Fallback logic using local JSON
function fallbackReply(msg) {
  const lowerMsg = msg.toLowerCase();
  let reply = "🤖 Sorry, I don't understand that.";

  try {
    if(lowerMsg.includes("vaccine") || lowerMsg.includes("vaccination")) {
      const pins = Object.keys(medicalDB.vaccineCenters || {});
      if(pins.length) {
        const center = medicalDB.vaccineCenters[pins[0]][0];
        reply = `💉 Vaccine Center:\n${center.name}\nAddress: ${center.address}\nDistrict: ${center.district_name}`;
      }
    } else if(lowerMsg.includes("doctor")) {
      const cities = Object.keys(medicalDB.doctors || {});
      if(cities.length) {
        const doc = medicalDB.doctors[cities[0]][0];
        reply = `🩺 Doctor: ${doc.name}\nSpecialty: ${doc.specialty}\nClinic: ${doc.hospital}`;
      }
    } else if(lowerMsg.includes("dengue") || lowerMsg.includes("outbreak")) {
      reply = "⚠️ Dengue risk increasing in nearby areas. Use mosquito nets and remove stagnant water.";
    } else {
      const symptoms = lowerMsg.split(",").map(s => s.trim());
      const found = medicalDB.diseases?.find(d =>
        d.symptoms.some(symptom => symptoms.includes(symptom))
      );
      if(found) {
        reply = `Possible Disease: ${found.disease}\nAdvice: ${found.advice}`;
      }
    }
  } catch(err) {
    console.error(err);
    reply = "❌ Error processing your request.";
  }

  addMessage("bot", reply);
}
