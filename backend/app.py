from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os, uuid
from pymongo import MongoClient

load_dotenv()

from pdf_processor import process_pdf_bytes
from chat_handler import answer_question

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all origins (you can later restrict to http://localhost:3000)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload-pdf/")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF allowed")

    contents = await file.read()
    doc_id = str(uuid.uuid4())

    pages = process_pdf_bytes(contents, doc_id)

    return {
        "doc_id": doc_id,
        "pages": pages
    }

@app.post("/query/")
async def query(payload: dict):
    doc_id = payload.get("doc_id")
    question = payload.get("question")
    if not doc_id or not question:
        raise HTTPException(status_code=400, detail="Missing doc_id or question")
    answer = answer_question(doc_id, question)
    return {"answer": answer}

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB = os.getenv("MONGO_DB")
MONGO_COLLECTION = os.getenv("MONGO_COLLECTION")

client = MongoClient(MONGO_URI)
db = client[MONGO_DB]
collection = db[MONGO_COLLECTION]

# Pydantic model
class Message(BaseModel):
    user_id: str
    from_user: str  # "user" or "bot"
    text: str

# Save a message
@app.post("/save-message/")
async def save_message(msg: Message):
    collection.insert_one(msg.dict())
    return {"status": "success"}

# Get messages for a user
@app.get("/get-messages/{user_id}")
async def get_messages(user_id: str):
    msgs = list(collection.find({"user_id": user_id}, {"_id": 0}))
    
    # Group by doc_id
    chat_groups = {}
    for m in msgs:
        doc_id = m.get("doc_id") or "no-doc"
        if doc_id not in chat_groups:
            chat_groups[doc_id] = {
                "messages": [],
                "docId": doc_id if doc_id != "no-doc" else None,
                "uploadedName": m.get("uploadedName") if "uploadedName" in m else None
            }
        chat_groups[doc_id]["messages"].append({"from": m["from_user"], "text": m["text"]})
    
    return {"chats": list(chat_groups.values())}
