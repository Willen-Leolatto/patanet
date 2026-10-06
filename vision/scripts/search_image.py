import sys, json, faiss, numpy as np
from PIL import Image
import torch
from transformers import CLIPModel, CLIPProcessor

device = "cuda" if torch.cuda.is_available() else "cpu"
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device).eval()
proc  = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32", use_fast=True)

def embed(path):
    img = Image.open(path).convert("RGB")
    inputs = proc(images=img, return_tensors="pt").to(device)
    with torch.no_grad():
        e = model.get_image_features(**inputs)
    e = torch.nn.functional.normalize(e, dim=-1)
    return e.squeeze(0).cpu().numpy().astype("float32")

index = faiss.read_index("index/pets.faiss")
meta = json.load(open("index/pets_meta.json"))

qvec = embed(sys.argv[1]).reshape(1,-1)
D, I = index.search(qvec, 5)

out = [{"score": float(D[0][k]), **meta[int(I[0][k])]} for k in range(5)]
print(json.dumps(out, indent=2))
