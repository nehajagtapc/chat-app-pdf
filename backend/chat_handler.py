import os
import json
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

# Load embedding model
EMBED_MODEL_NAME = os.getenv("EMBED_MODEL", "all-MiniLM-L6-v2")
EMBED_MODEL = SentenceTransformer(EMBED_MODEL_NAME)

FAISS_PATH = os.getenv("FAISS_PATH", "./faiss.index")
META_PATH = "metadata.json"


def retrieve_similar(question, top_k=4):
    """Retrieve top-k similar document chunks."""
    q_emb = EMBED_MODEL.encode([question]).astype("float32")
    if not os.path.exists(FAISS_PATH) or not os.path.exists(META_PATH):
        return []

    index = faiss.read_index(FAISS_PATH)
    D, I = index.search(q_emb, top_k)
    ids = I[0].tolist()

    meta = json.load(open(META_PATH, "r", encoding="utf-8"))
    results = [entry for entry in meta["entries"] if entry["chunk_id"] in ids]
    id_to_entry = {e["chunk_id"]: e for e in results}
    ordered = [id_to_entry[i] for i in ids if i in id_to_entry]
    return ordered


def list_available_models():
    """Print all available Gemini models."""
    try:
        models = genai.models.list()
        print("Available Gemini Models:")
        for m in models:
            print(f"- {m['name']} ({m.get('description', 'No description')})")
        return [m['name'] for m in models]
    except Exception as e:
        print("Error fetching models:", e)
        return []


def call_gemini_system(prompt):
    """Send prompt to Gemini for answer generation."""
    try:
        available_models = list_available_models()
        # Pick the first available model as default
        model_name = available_models[0] if available_models else "gemini-2.5-pro"
        model = genai.GenerativeModel(model_name)
        response = model.generate_content(prompt)

        # Debug print for backend logs
        print("Gemini raw response:", response)

        # Safely extract text
        if hasattr(response, "text") and response.text:
            return response.text.strip()
        elif hasattr(response, "candidates") and response.candidates:
            return response.candidates[0].content.parts[0].text.strip()
        else:
            return "Gemini returned an empty response."

    except Exception as e:
        print("Error calling Gemini:", e)
        return f"Error calling Gemini: {e}"


def answer_question(doc_id, question):
    """Generate an answer based on uploaded PDF embeddings."""
    contexts = retrieve_similar(question, top_k=5)
    if not contexts:
        return "No document or context found for that doc_id."

    prompt = (
        "Use the excerpts below (with page numbers) to answer the question. "
        "If answer not present, say so.\n\n"
    )
    for c in contexts:
        prompt += f"Page {c['page']}:\n{c['text']}\n---\n"

    prompt += f"\nQuestion: {question}\nAnswer:"

    answer = call_gemini_system(prompt)
    pages = sorted({c["page"] for c in contexts})
    return f"{answer}\n\n[Sourced pages: {', '.join(map(str, pages))}]"
