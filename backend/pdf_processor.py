import io, os, json
import pdfplumber
from sentence_transformers import SentenceTransformer
import numpy as np
import faiss

EMBED_MODEL_NAME = os.getenv("EMBED_MODEL", "all-MiniLM-L6-v2")
EMBED_MODEL = SentenceTransformer(EMBED_MODEL_NAME)
FAISS_PATH = os.getenv("FAISS_PATH", "./faiss.index")
META_PATH = "metadata.json"

def extract_texts_from_bytes(pdf_bytes):
    pages = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for i, pg in enumerate(pdf.pages):
            text = pg.extract_text() or ""
            pages.append({"page": i+1, "text": text})
    return pages

def chunk_text(text, chunk_chars=1000, overlap=200):
    chunks = []
    start = 0
    L = len(text)
    while start < L:
        end = min(L, start + chunk_chars)
        chunks.append(text[start:end])
        start += (chunk_chars - overlap)
    return chunks

def process_pdf_bytes(pdf_bytes, doc_id):
    # -------------------------
    # 1. Extract pages + count
    # -------------------------
    pages = extract_texts_from_bytes(pdf_bytes)
    total_pages = len(pages)

    # -------------------------
    # 2. Chunk text
    # -------------------------
    chunk_texts = []
    metadata_entries = []

    for p in pages:
        chops = chunk_text(p["text"])
        for c in chops:
            chunk_texts.append(c)
            metadata_entries.append({
                "doc_id": doc_id,
                "page": p["page"],
                "text": c
            })

    if not chunk_texts:
        return total_pages  # still return page count even if no text found

    # -------------------------
    # 3. Embedding
    # -------------------------
    embeddings = EMBED_MODEL.encode(chunk_texts, show_progress_bar=False)
    vecs = np.array(embeddings).astype("float32")
    dim = vecs.shape[1]

    # -------------------------
    # 4. FAISS index update
    # -------------------------
    if os.path.exists(FAISS_PATH):
        index = faiss.read_index(FAISS_PATH)
    else:
        index = faiss.IndexFlatL2(dim)

    start_id = int(index.ntotal)
    index.add(vecs)
    faiss.write_index(index, FAISS_PATH)

    # -------------------------
    # 5. Metadata save
    # -------------------------
    if os.path.exists(META_PATH):
        meta = json.load(open(META_PATH, "r", encoding="utf-8"))
    else:
        meta = {"entries": []}

    for i, m in enumerate(metadata_entries):
        m["chunk_id"] = start_id + i
        meta["entries"].append(m)

    with open(META_PATH, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

    # -------------------------
    # 6. RETURN PAGE COUNT ✔
    # -------------------------
    return total_pages
