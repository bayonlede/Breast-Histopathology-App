# predict.py
import torch
import torchvision.transforms as transforms
from PIL import Image
import io
import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

# ---------------------------------------------------
# STEP 1: Load model
# ---------------------------------------------------
MODEL_PATH = "models/best_model.pth"

# Define the same architecture you trained (ResNet50)
model = torch.hub.load("pytorch/vision", "resnet50", pretrained=False)
num_classes = 2  # benign vs malignant
model.fc = torch.nn.Linear(model.fc.in_features, num_classes)

# Load trained weights
model.load_state_dict(torch.load(MODEL_PATH, map_location=torch.device("cpu"), weights_only=False))
model.eval()  # evaluation mode

# ---------------------------------------------------
# STEP 2: Define transforms (same as training)
# ---------------------------------------------------
imagenet_mean = [0.485, 0.456, 0.406]
imagenet_std  = [0.229, 0.224, 0.225]

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=imagenet_mean, std=imagenet_std),
])

# ---------------------------------------------------
# STEP 3: Prediction function
# ---------------------------------------------------
idx_to_label = {0: "benign", 1: "malignant"}

def predict_image(image_bytes: bytes):
    """
    Run inference on a single image (bytes).
    Returns the predicted label.
    """
    # Convert bytes to PIL image
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # Apply transforms
    input_tensor = transform(image).unsqueeze(0)  # add batch dimension

    # Run inference
    with torch.no_grad():
        outputs = model(input_tensor)
        _, predicted = torch.max(outputs, 1)

    return idx_to_label[predicted.item()]


def predict_multiple(images: list[bytes]):
    """
    Run inference on multiple images (list of bytes).
    Returns a list of predictions.
    """
    results = []
    for img_bytes in images:
        label = predict_image(img_bytes)
        results.append(label)
    return results
 
