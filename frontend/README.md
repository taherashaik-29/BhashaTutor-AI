# BhashaTutor AI

### An AI-Powered Multilingual Learning Assistant

## 1. Project Overview

BhashaTutor AI is an AI-powered learning assistant that helps students learn in multiple languages. It provides AI-generated answers, supports Hindi and Telugu conversations, generates study notes from uploaded PDF documents, and creates practice quizzes.

## 2. Objectives

- To provide AI-powered answers to students' questions.
- To support multilingual learning.
- To upload and process PDF documents.
- To generate study notes from PDF content.
- To create quizzes with answers and explanations.
- To help students manage their chat conversations.

## 3. Features

- **AI Chat:** Answers students' questions using AI.
- **Multilingual Support:** Supports conversations in English, Hindi, and Telugu.
- **PDF Upload:** Allows users to upload PDF documents.
- **Study Notes:** Generates notes from uploaded PDF content.
- **Quiz Generation:** Creates multiple-choice questions with answers and explanations.
- **Score Calculation:** Calculates the user's quiz score.
- **Chat History:** Displays previous conversations.
- **New Chat:** Allows users to start a new conversation.
- **Delete Chat:** Allows users to remove conversations.

## 4. Technologies Used

### Frontend
- React
- Vite
- JavaScript
- CSS

### Backend
- Python
- FastAPI
- Uvicorn

### AI and Libraries
- Groq API
- React Markdown
- Remark GFM
- pypdf
- python-multipart

## 5. System Architecture

1. The user interacts with the React frontend.
2. The frontend sends requests to the FastAPI backend.
3. The backend processes the requests.
4. The Groq API provides AI-generated responses when required.
5. For PDF processing, the backend extracts text from the uploaded document.
6. The generated answers, notes, and quizzes are displayed on the frontend.

## 6. Installation and Execution

### Prerequisites
- Python
- Node.js and npm
- Visual Studio Code
- A Groq API key

### Step 1: Start the Backend

Open a terminal in Visual Studio Code and run:

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn main:app --reload
```

Backend URL: http://127.0.0.1:8000

API documentation: http://127.0.0.1:8000/docs

### Step 2: Start the Frontend

Open a second terminal and run:

```powershell
cd frontend
npm run dev
```

Open the local URL displayed by Vite, usually:

http://localhost:5173

Keep both terminals running while using the application.

## 7. Testing and Results

The following features were tested successfully:

- AI chat responses
- Hindi and Telugu language support
- PDF upload and status
- Study notes generation
- Quiz generation
- Answer selection
- Quiz score calculation
- Correct answers and explanations
- Chat history
- New chat
- Delete chat
- Backend stability
- API key safety

## 8. Security

The Groq API key is stored in the backend environment configuration file. It must not be exposed in frontend code, screenshots, public repositories, or shared project files.

The `.env` file should be excluded from Git and public submissions. Only placeholder values should be included in `.env.example`.

## 9. Conclusion

BhashaTutor AI combines multilingual AI chat, PDF-based learning, study note generation, and interactive quizzes in one application. It aims to make learning more accessible and help students understand and revise their study materials efficiently.

## 10. Future Enhancements

- Support for more languages.
- Downloadable study notes.
- User accounts and cloud-based chat history.
- Quiz difficulty levels.
- Learning progress tracking.
- Personalized study recommendations.
