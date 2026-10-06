import os, zipfile, urllib.request, tarfile
root = "data/oxford_pets"
os.makedirs(root, exist_ok=True)

# imagens
imgs_url = "https://www.robots.ox.ac.uk/~vgg/data/pets/data/images.tar.gz"
ann_url  = "https://www.robots.ox.ac.uk/~vgg/data/pets/data/annotations.tar.gz"

for url in [imgs_url, ann_url]:
    fn = os.path.join(root, os.path.basename(url))
    if not os.path.exists(fn):
        print("baixando", url)
        urllib.request.urlretrieve(url, fn)
    print("extraindo", fn)
    with tarfile.open(fn, "r:gz") as tar:
        tar.extractall(root)

print("ok. imagens em data/oxford_pets/images")
