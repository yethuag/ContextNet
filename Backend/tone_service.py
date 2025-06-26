from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline

app = FastAPI(title="Tone Inference Service")

# Load model once at startup
classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

LABELS = ["Negative", "Passive-Aggressive", "Sarcastic", "Positive", "Neutral", "Offensive"]

class TextInput(BaseModel):
    text: str

@app.post("/infer")
def infer_tone(input: TextInput):
    result = classifier(input.text, LABELS, multi_label=True)
    return result
