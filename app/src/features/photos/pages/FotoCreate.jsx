import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../components/PageHeader";
import FormCard from "../../../components/forms/FormCard";
import { loadPets } from "@features/pets/services/petsStorage";
import { addPhotosUpToQuota } from "@features/photos/services/photosStorage";
import { compressImageSmart, fileToDataURL } from "../../../utils/image";
import { useToast } from "../../../components/ui/ToastProvider";
import { useConfirm } from "../../../components/ui/ConfirmProvider";
import { ImagePlus, Camera } from "lucide-react";
import { addPhotoPostsById } from "@features/feed/services/feedStorage";

export default function FotoCreate() {
  const pets = loadPets();
  const [petIds, setPetIds] = useState(pets[0] ? [String(pets[0].id)] : []);
  const [caption, setCaption] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  function togglePet(idStr) {
    setPetIds((prev) =>
      prev.includes(idStr) ? prev.filter((x) => x !== idStr) : [...prev, idStr]
    );
  }

  function onSelectFiles(list) {
    const onlyImages = Array.from(list).filter((f) =>
      f.type.startsWith("image/")
    );
    if (onlyImages.length !== list.length)
      toast.info("Apenas imagens são aceitas.");
    setFiles((prev) => [...prev, ...onlyImages]);
    const urls = onlyImages.map((f) => ({
      url: URL.createObjectURL(f),
      name: f.name,
      size: f.size,
    }));
    setPreviews((prev) => [...prev, ...urls]);
  }

  function onDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer?.files?.length) onSelectFiles(e.dataTransfer.files);
  }
  function onDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  function removePreview(idx) {
    URL.revokeObjectURL(previews[idx].url);
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (files.length === 0) return toast.info("Selecione ao menos uma imagem.");

    const proceed = await confirm({
      title: "Enviar fotos?",
      message: `Você vai salvar ${files.length} foto${
        files.length > 1 ? "s" : ""
      }.`,
      confirmText: "Salvar",
      variant: "primary",
    });
    if (!proceed) return;

    setIsUploading(true);
    try {
      const quality = files.length > 3 ? 0.8 : 0.85;
      const processed = [];
      let failed = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const { dataUrl, width, height } = await compressImageSmart(file, {
            maxWidth: 1600,
            maxHeight: 1600,
            quality,
            smallThreshold: 220 * 1024,
            maxMegapixels: 24,
          });
          processed.push({
            id: Date.now() + i,
            petIds: petIds.map(Number),
            caption: caption?.trim() || "",
            src: dataUrl,
            width,
            height,
            createdAt: Date.now(),
            originalName: file.name,
          });
        } catch (err) {
          try {
            const original = await fileToDataURL(file);
            processed.push({
              id: Date.now() + i,
              petIds: petIds.map(Number),
              caption: caption?.trim() || "",
              src: original,
              width: null,
              height: null,
              createdAt: Date.now(),
              originalName: file.name,
            });
          } catch {
            failed++;
          }
        }
      }

      previews.forEach((p) => URL.revokeObjectURL(p.url));

      if (processed.length === 0) {
        toast.error(
          "Não foi possível processar as imagens. Tente outras fotos."
        );
        return;
      }

      const { saved, total } = addPhotosUpToQuota(processed);

      // cria posts no feed por referência (somente as que salvaram)
      const savedPhotos = processed.slice(0, saved);
      if (savedPhotos.length > 0) {
        // addPhotoPostsById(savedPhotos, { id: "me", name: "Você" });
      }

      if (failed > 0)
        toast.info(`Algumas imagens não puderam ser processadas (${failed}).`);
      if (saved === 0) {
        toast.error("Limite de armazenamento do navegador atingido.");
        return;
      }
      if (saved < total)
        toast.info(
          `Salvamos ${saved} de ${total} fotos (limite de armazenamento).`
        );
      else
        toast.success(
          `${saved} foto${saved > 1 ? "s" : ""} salva${saved > 1 ? "s" : ""}`
        );

      navigate("/dashboard/fotos");
    } catch {
      toast.error("Falha ao processar/salvar as imagens");
    } finally {
      setIsUploading(false);
    }
  }

  const input =
    "w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors border-slate-300 bg-white focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:focus:border-slate-600";
  function openFileDialog() {
    document.getElementById("photo-input")?.click();
  }
  function openCameraDialog() {
    document.getElementById("camera-input")?.click();
  }

  return (
    <div className="w-full">
      <PageHeader
        title="Nova Foto"
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Fotos", to: "/dashboard/fotos" },
          { label: "Nova" },
        ]}
        description="Envie imagens para a galeria. As fotos serão comprimidas automaticamente."
      />
      <FormCard title="Upload" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Pets (opcional)</label>
            {pets.length === 0 ? (
              <p className="mt-1 text-xs opacity-70">
                Cadastre um pet para associar as fotos (opcional).
              </p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {pets.map((p) => {
                  const idStr = String(p.id);
                  const active = petIds.includes(idStr);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        setPetIds((prev) =>
                          prev.includes(idStr)
                            ? prev.filter((x) => x !== idStr)
                            : [...prev, idStr]
                        )
                      }
                      className={`rounded-full border px-3 py-1 text-xs ${
                        active
                          ? "border-slate-900 bg-slate-900 text-white dark:border-slate-200 dark:bg-slate-200 dark:text-slate-900"
                          : "border-slate-300 bg-white hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                      }`}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium">Legenda</label>
            <input
              className={input}
              placeholder="Opcional (usada em todas as fotos deste envio)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium">Imagens</label>
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onClick={openFileDialog}
              className="mt-2 flex min-h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:bg-slate-900/60"
            >
              <ImagePlus className="h-6 w-6 opacity-70" />
              <div className="text-sm">
                Arraste e solte as imagens aqui, ou clique para selecionar
              </div>
              <div className="text-xs opacity-70">
                JPG/PNG recomendados. Máx. ~10–15 imagens por vez.
              </div>
              <input
                id="photo-input"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => onSelectFiles(e.target.files)}
              />
            </div>

            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={openFileDialog}
                className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <ImagePlus className="h-4 w-4" /> Escolher arquivos
              </button>
              <button
                type="button"
                onClick={openCameraDialog}
                className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <Camera className="h-4 w-4" /> Tirar foto
              </button>
              <input
                id="camera-input"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) =>
                  e.target.files && onSelectFiles(e.target.files)
                }
              />
            </div>

            {previews.length > 0 && (
              <div className="mt-4 grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(120px,1fr))]">
                {previews.map((p, idx) => (
                  <div
                    key={idx}
                    className="group relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800"
                  >
                    <img
                      src={p.url}
                      alt={p.name}
                      className="h-32 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePreview(idx)}
                      className="absolute right-1 top-1 rounded-md border border-slate-300 bg-white/90 px-2 py-0.5 text-xs opacity-0 shadow-sm transition-opacity group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-900/90"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {isUploading && (
          <p className="mt-2 text-xs opacity-70">Processando imagens…</p>
        )}
      </FormCard>
    </div>
  );
}
