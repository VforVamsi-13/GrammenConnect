# 🌾 GrameenConnect  

> A voice-first, offline-ready AI platform idea empowering rural India with accessible digital services.

---

## 🚀 About GrameenConnect

**GrameenConnect** is a multilingual, AI-powered digital platform designed specifically for rural Indian citizens, especially elders and low-literacy users.  
It brings government services, healthcare guidance, agriculture tools, education, and community support into one simple, inclusive application.

GrameenConnect addresses real rural challenges such as low bandwidth, intermittent connectivity, limited literacy, and accessibility needs.

---

## 🎯 Core Value Proposition

- 🌐 **True Digital Inclusion** – One simple app for government schemes, health, farming, learning, and jobs  
- 😃 **Face-Login** – Passwordless and email-free login. 
- 🗣️ **Voice-First Experience** – Minimal typing with natural language voice commands  
- 📶 **Offline-Ready** – Works even with poor or no internet connectivity  
- 👴 **Elder-Friendly Design** – Large text, high contrast, simplified UI  
- 🇮🇳 **13 Indian Languages Supported**

---

## ⭐ Key Features

### 🔐 Face Authentication Login
- Passwordless and email-free login  
- Users simply look at the camera to register and sign in  
- Ideal for elders and low-literacy users  

---

### 📴 Full Offline Mode
- Toggle **Offline Ready Mode**  
- Access:
  - Saved learning modules  
  - Crop Disease Detection 
  - Community tools  
  - Essential services  
- Designed for rural connectivity limitations  

---

### 👓 Elder-Friendly Mode
- One-tap toggle  
- Larger fonts and buttons  
- High-contrast UI  
- Simplified navigation  

---

### 🤖 Sahayak AI – Voice-Controlled Assistant
- Floating AI button: **"Tell Sahayak what to do"**  
- Hands-free app navigation  
- Example voice commands:
  - "Open Kisan Mandi"  
  - "I have fever"  
  - "Plan trip to hospital"  
- Works across all supported languages  

---

### 🗣️ Language Support
Full UI, text-to-speech, and voice interaction in:

- English  
- Hindi  
- Bengali  
- Telugu  
- Marathi  
- Tamil  
- Urdu  
- Gujarati  
- Kannada  
- Malayalam  
- Punjabi  
- Odia  
- Assamese  

Includes phonetic typing support for non-English users.

---

## 🧰 Essential Services

### 🌾 Kisan Mandi
- Local farmer marketplace  
- Buy and sell produce using:
  - Photos  
  - Voice-based listings  
  - Direct calls  

---

### 🏥 Swasthya Saathi
- AI-powered symptom checker  
- Home remedy suggestions  
- Clear medical disclaimers  

---

### 🤝 Community Help
- Request or offer local assistance  
- Medical, documentation, and daily needs  
- Encourages community-level collaboration  

---

### 👁️ Vision Helper
- Upload or capture a photo  
- AI describes visible content  
- Helpful for low-vision users  

---

## 🧠 AI-Powered Tools

### 📄 Smart Resume Builder
- Speak personal and work details  
- AI generates professional resumes  

---

### 🏛️ Scheme Matcher
- Voice-based profile input  
- AI suggests relevant government schemes  

---

### 🗺️ Mobility Planner
- Voice-based travel planning  
- Considers mobility aids (wheelchair, crutches)  
- Accessible routes with Google Maps grounding  

---

### 🏢 Governance Aid
- Voice-based assistance for:
  - Government procedures  
  - Required documents  
  - Application workflows  

---

## 🌱 Learning Modules
- Bite-sized guides on:
  - UPI and digital payments  
  - Telehealth  
  - Crop insurance  
  - Modern farming techniques  
  - Digital literacy  
- Generated dynamically using Gemini AI  
- **Save for Offline** option available  

---

## 🌿 Plant Disease Prediction
- Upload/Capture crop leaf images  
- AI detects plant diseases  
- Enables early preventive action  
- Can chat for assistance while online
- Shows Disease spread in Map from Data

---

## 🌍 Vision Statement

> **GrameenConnect is the rural citizen’s digital companion —  
a single, face-login, voice-first, offline-ready app that brings government schemes, health advice, local markets, job tools, and education to millions left behind by Digital India.**

---

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Optionally, for Face-auth, Setup Backend from [Grameen Connect Face auth](https://github.com/VforVamsi-13/GrammenConnect-FaceAuth)
4. Run the GrameenConnect app:
   `npm run dev`


---

## Face-auth Backend Setup

The backend is built with **Node.js and Express**.

### Steps to run:

```bash
cd backend
npm install
npm start
```

The server will start on the port defined in the `.env` file (e.g. `http://localhost:4000`).

---

## Frontend Setup

The frontend is built using **React with Vite**.

### Steps to run:

```bash
cd frontend
npm install
npm run dev
```

The app will be available at the port shown in the terminal (default: `http://localhost:5173`).

---

## Environment Variables

Create a `.env` file in both backend and frontend directories and add the required environment variables.

**Example:**

```env
PORT=4000
VITE_GEMINI_API_KEY=your_api_key_here
```

> ⚠️ Do not commit `.env` files to version control.

---

## Face Authentication backend for GrameenConnect. 
[Project by Team SyntaxSquad, SquareHack Hackathon in IITD by Tale of Human Kind, Ashoka: Innovators for the Public]

## Supabase Setup

To use this application, you need to set up a Supabase project and create a `users` table.

## 1. Create Table

Run the following SQL in your Supabase SQL Editor:

```sql
create table users (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  face_embedding jsonb not null,
  created_at timestamp with time zone default now()
);

```

> Optional :
Enable Row Level Security (RLS)
For this demo, we'll keep it simple, but in production, you should secure this.


## 2. Environment Variables

Create a `.env` file in the `backend/` directory:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=5000
```

And in the `frontend/` directory (if needed for direct Supabase calls, but we'll use the backend proxy):
```env
VITE_API_URL=http://localhost:5000
```



---

## Development Workflow

Run the backend and frontend in **separate terminals**:

* Backend handles APIs and server logic
* Frontend handles UI and client-side logic

---

 
## Team SyntaxSquad

- **Abhisek Anand** — [GitHub](https://github.com/abhishekanand25)
- **Adithya Charan** — [GitHub](https://github.com/Adithya-charan)
- **Deepak Kambala** — [GitHub](https://github.com/Deepak-Kambala)
- **Vamsi Devarapalli** — [GitHub](https://github.com/VforVamsi-13/)
