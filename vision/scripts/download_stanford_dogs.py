# scripts/download_stanford_dogs.py
import os, tarfile, urllib.request
root = "data/stanford_dogs"; os.makedirs(root, exist_ok=True)
url = "http://vision.stanford.edu/aditya86/ImageNetDogs/images.tar"
fn = os.path.join(root, "images.tar")
if not os.path.exists(fn):
    urllib.request.urlretrieve(url, fn)
with tarfile.open(fn, "r:") as tar:
    tar.extractall(root)
print("OK: imagens em data/stanford_dogs/Images/")
