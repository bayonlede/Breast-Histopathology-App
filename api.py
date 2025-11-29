# api.py
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from PIL import Image
import torch
import torchvision.transforms as transforms
import io
from typing import List
import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"


app = FastAPI(title="Breast Histopathology AI")

# Serve static files (CSS, JS) from the web folder
app.mount("/static", StaticFiles(directory="web"), name="static")

# Allow frontend calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model
MODEL_PATH = "models/best_model.pth"
model = torch.hub.load("pytorch/vision", "resnet50", pretrained=False)
num_classes = 2
model.fc = torch.nn.Linear(model.fc.in_features, num_classes)
model.load_state_dict(torch.load(MODEL_PATH, map_location=torch.device("cpu"), weights_only=False))
model.eval()

# Transforms
imagenet_mean = [0.485, 0.456, 0.406]
imagenet_std  = [0.229, 0.224, 0.225]
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=imagenet_mean, std=imagenet_std),
])

@app.post("/predict")
async def predict(
    files: List[UploadFile] = File(...),
    slide_id: str = Form("unknown_slide")
):
    """
    Upload patches from one or more slides.
    Returns predictions grouped by slide_id.
    """

    idx_to_label = {0: "benign", 1: "malignant"}
    results = []

    for file in files:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        input_tensor = transform(image).unsqueeze(0)

        with torch.no_grad():
            outputs = model(input_tensor)
            _, predicted = torch.max(outputs, 1)

        label = idx_to_label[predicted.item()]
        results.append({"filename": file.filename, "prediction": label})

    return {
        "slide_id": slide_id,
        "num_patches": len(results),
        "patch_predictions": results
    }

@app.get("/")
def root():
    """Serve the main web application"""
    return FileResponse("web/index.html")

@app.get("/health")
def health():
    """Health check endpoint"""
    return {"message": "✅ Breast Histopathology AI API is running!"}
 
