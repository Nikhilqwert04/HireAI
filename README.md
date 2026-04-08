# HireAI

![HireAI Banner](https://raw.githubusercontent.com/kaihere14/HireAI/main/client/public/next.svg)

[![Next.js](https://img.shields.io/badge/Next.js-15+-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![OpenAI](https://img.shields.io/badge/OpenAI-Powered-412991?style=for-the-badge&logo=openai)](https://openai.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=for-the-badge)](https://opensource.org/licenses/ISC)

HireAI is a cutting-edge, AI-driven recruitment platform designed to revolutionize the hiring process. By leveraging Large Language Models and advanced audio processing, HireAI provides an automated, unbiased, and highly interactive environment for both recruiters and candidates.

---

## 🚀 Overview

HireAI bridges the gap between talent and opportunity through automation. The platform features a high-performance frontend with glassmorphic UI elements and a robust backend capable of handling real-time AI interviews, voice transcription, and text-to-speech synthesis.

- **Target Audience**: HR Departments, Tech Startups, and Candidates looking for a modern interview experience.
- **Status**: Active Development (v1.0.0)

## ✨ Features

- **AI-Powered Interviews**: Real-time conversational AI that asks relevant technical questions based on job descriptions.
- **Voice Intelligence**: 
    - **Transcription**: Convert candidate speech to text using Whisper-grade processing.
    - **Speech Synthesis**: AI-generated voice responses for a natural interview flow.
- **Interactive Job Board**: Dynamic listing of open roles with specific skill matching.
- **Modern UI/UX**: 
    - Parallax background effects and liquid blobs.
    - Glassmorphism design language.
    - Dark/Light mode support.
    - Scroll-reveal animations for immersive storytelling.
- **Candidate Portal**: Secure area for candidates to track applications and participate in screening.

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 15+ (App Router)
- **Library**: React 19
- **Styling**: Tailwind CSS 4, CSS Modules
- **Language**: TypeScript
- **Icons/Assets**: SVG-based dynamic iconography

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js (v5.2.1)
- **AI Integration**: OpenAI SDK (GPT-4o/Whisper/TTS)
- **File Handling**: Multer (Memory Storage)
- **Environment**: Dotenv

### Tooling
- **Linting**: ESLint 9
- **Formatting**: Prettier
- **Git Hooks**: Husky & lint-staged

## 🏗 Architecture

The project follows a decoupled client-server architecture:

```text
├── client/             # Next.js Frontend
│   ├── app/            # App Router (Pages & Layouts)
│   └── public/         # Static Assets
├── server/             # Express Backend
│   └── src/            # AI Services & API Routes
└── .husky/             # Pre-commit hooks for code quality
```

## 🚦 Getting Started

### Prerequisites
- Node.js (v20 or higher)
- pnpm (recommended) or npm
- OpenAI API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kaihere14/HireAI.git
   cd HireAI
   ```

2. **Setup Server**
   ```bash
   cd server
   npm install
   ```
   Create a `.env` file in the `server` directory:
   ```env
   PORT=5001
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Setup Client**
   ```bash
   cd ../client
   npm install
   ```

### Running the Application

**Start Backend:**
```bash
cd server
npm run dev
```

**Start Frontend:**
```bash
cd client
npm run dev
```
The application will be available at `http://localhost:3000`.

---

## 🔌 API Documentation

The backend service exposes the following endpoints:

### 1. AI Chat (`/ask`)
Processes interview questions and answers.
- **Method**: `POST`
- **Body**: `{ "answer": string, "prevQuestion": string }`
- **Response**: `{ "response": string }`

### 2. Audio Transcription (`/transcribe`)
Converts audio files to text.
- **Method**: `POST`
- **Body**: `multipart/form-data` (field: `audio`)
- **Response**: `{ "text": string }`

### 3. Text-to-Speech (`/speak`)
Converts text into playable audio.
- **Method**: `POST`
- **Body**: `{ "text": string }`
- **Response**: `audio/wav` stream

---

## 🛠 Development Workflow

This project uses **Husky** and **lint-staged** to ensure code quality.

- **Linting**: `npm run lint` (Available in both client and server)
- **Formatting**: `npm run format` (Uses Prettier)
- **Pre-commit**: Automatically runs linting and formatting on changed files.

### Directory Structure Highlights
- `client/app/page.tsx`: Main entry point featuring the interactive landing page and portal logic.
- `server/src/ai.service.js`: Core logic for interacting with OpenAI services.
- `server/src/server.js`: Express configuration and route definitions.

---

## 🗺 Roadmap
- [ ] Integration with LinkedIn API for profile parsing.
- [ ] Real-time video analysis for sentiment detection.
- [ ] Multi-language support for global hiring.
- [ ] Advanced analytics dashboard for recruiters.

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the **ISC License**. See `server/package.json` for more information.

---

**HireAI** - Built with ❤️ for the future of work.