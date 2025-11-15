# Chat-App-PDF — AI-Powered PDF Chat Application
## Overview: 
Chat-App-PDF is an AI-driven web application that allows users to upload PDF documents and interact with them through a smart chat interface.
Once a PDF is uploaded, the system extracts its content and processes it using Gemini 2.5 Pro along with other supported Gemini models, enabling intelligent, context-aware responses, summaries, and document insights.


# Tech Stack:
## Frontend
- React.js – Core framework for building the interactive user interface.
- React-PDF – Component to render PDF documents directly in the browser.
- Axios – For HTTP requests to the backend API.
- CSS / Material UI / Tailwind – Styling and responsive design for modern UI.
- React Hooks (useState, useEffect) – Manage state and side-effects.

## Backend
- Node.js & Express.js – Handles REST API endpoints and backend logic.
- Multer – Middleware for PDF file uploads.
- pdf-parse / pdf-lib – Libraries to extract text from PDFs for AI processing.
- Dotenv – Environment variable management (API keys, DB URI, server ports).

## Database
- MongoDB – Stores uploaded PDFs, extracted text, chat history, and user sessions.
- Mongoose – Provides schemas and models for structured data handling and simplifies MongoDB operations.

## AI / NLP Integration
- Gemini 2.5 Pro – Google’s advanced AI model for reasoning, document understanding, and conversational responses.
- Used to answer PDF-related queries, summarize sections, and provide intelligent explanations.
- Supports multimodal input (text, PDF content, images) for rich AI interactions.
- LangChain – Optional framework to handle document context and manage conversational flows.

## Supporting Tools & Utilities
- Git & GitHub – Version control and repository management.
- Node Package Manager (npm / yarn) – Dependency management.

# Installation Guide
Follow the steps below to set up and run the Chat-App-PDF project on your local machine.
1. Clone the Repository:
```
   git clone https://github.com/nehajagtapc/chat-app-pdf.git
   cd chat-app-pdf
```

2. Create a Virtual Environment (Optional but Recommended):
```
python -m venv venv
```

3. Activate the environment:

Windows:
```
venv\Scripts\activate
```

Mac / Linux:
```
source venv/bin/activate
```

4. Install all dependencies from requirements.txt
```
pip install -r requirements.txt
```

5. How to start application:
```
cd frontend
npm install
```
Start the frontend: 
```
npm start
```
Frontend runs on:
- http://localhost:3000

6. Open a new terminal and navigate to the backend folder:
```
  cd backend
```
```
 uvicorn app:app --reload --port 8000
```

7. Configure Environment Variables:
```
  PORT=8000
  MONGO_URI=your_mongodb_uri
  GEMINI_API_KEY=your_gemini_api_key
```

## Architecture Flow:
<img width="1158" height="583" alt="image" src="https://github.com/user-attachments/assets/19091f24-9533-42f4-9848-ba627207801e" />


## Project Folder Structure
```
  chat-app-pdf/
    ├── backend/
    │   ├── app.py        # API request handlers  
    │   ├── chat_handler.py             # Database schemas (MongoDB)  
    │   ├── pdf_processor.py            # Express routes  
    # Backend server  
    │   └── .env                # Backend environment variables  
    │
    ├── frontend/
    │   ├── node_modules      
    │   ├── public/index.html    
    │   ├── src/
    │   │   ├── components/      # UI components (PDFViewer, ChatBox)  
        │   │   ├── ChatInterface.jsx/            
        │   │   ├── Feedback.jsx/
        │   │   ├── HistoryDB.jsx/              
    │   │   ├── App.js           # Main React component  
    │   │   └── index.js         # React entry point  
    │   └── package.json         # Frontend dependencies  
    │
    ├── .gitignore  
    └── README.md
```

## Gemini Model Overview
| **Model**                      | **Use Case / Strengths**                                                                                                                                                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **gemini-2.5-pro**             | Google’s most advanced *thinking* model. Excellent for deep reasoning, math/STEM tasks, PDF and long-document understanding, code generation, and agentic workflows. Supports multimodal input (text, images, audio, video, PDFs). |
| **gemini-2.5-flash**           | High-speed, low-latency model ideal for fast responses in production apps. Cost-efficient and supports multimodal input.                                                                                                           |
| **gemini-2.5-flash-lite**      | Lightweight and extremely cheap. Suitable for high-throughput, large-volume requests where performance must be fast and economical.                                                                                                |
| **gemini-2.5-pro-preview-tts** | Text-to-speech model for generating voice/audio output. Useful for assistants, podcasts, and conversational voice agents.                                                                                                          |

## OpenAI Models (Supported)
| **OpenAI Model**                         | **Strengths / Use Case**                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **GPT-4o**                               | High-performance multimodal model (vision, text, audio). Suitable for rich document chat and reasoning. |
| **GPT-4.1 / GPT-4.1-mini**               | Faster, cost-optimized versions with strong reasoning. Good for production workloads.                   |
| **GPT-4o-mini**                          | Very fast, economical, suitable for quick chat responses.                                               |
| **o3 / o1 / o1-mini (Reasoning Models)** | Designed specifically for deep reasoning, coding tasks, and advanced logic.                             |
| **GPT-3.5 Turbo**                        | Lightweight, cheap, suitable for fallback or simple summarization.                                      |

## Future Improvements
- Add support for multiple AI models (Gemini Pro, Flash, OpenAI GPT-4o, etc.)
- Implement real-time AI streaming responses
- Enable multi-PDF upload and cross-document search
- Integrate vector database (Pinecone / ChromaDB) for better retrieval
- Enhance authentication with JWT & user roles
- Add PDF text highlighting with citation in chat
- Auto-generate insights dashboard from uploaded PDF
- Support more formats (DOCX, PPTX, images, scanned PDFs with OCR)
- Deploy full app on cloud platforms (AWS/GCP/Vercel)

## Author
**Neha Jagtap**
- Full Stack Developer | AI Integration | Cloud Enthusiast
