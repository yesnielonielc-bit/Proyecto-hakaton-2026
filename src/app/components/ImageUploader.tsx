import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, X, Loader2, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploaderProps {
  userId: string;
  images: { id?: string; url: string }[];
  onImagesChange: (images: { id?: string; url: string }[]) => void;
  maxImages?: number;
}

export function ImageUploader({ userId, images, onImagesChange, maxImages = 5 }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      toast.error(`Máximo ${maxImages} imágenes permitidas`);
      return;
    }

    setUploading(true);
    const newImages: { url: string }[] = [];

    for (const file of Array.from(files)) {
      // Validar tipo y tamaño
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} no es una imagen válida`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} es muy grande (máx 5MB)`);
        continue;
      }

      try {
        const ext = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, file, { cacheControl: '3600', upsert: false });

        if (uploadError) {
          console.error(uploadError);
          toast.error(`Error al subir ${file.name}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        newImages.push({ url: urlData.publicUrl });
      } catch (err) {
        console.error(err);
        toast.error(`Error al procesar ${file.name}`);
      }
    }

    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
      toast.success(`${newImages.length} imagen(es) subida(s)`);
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemove = async (index: number) => {
    const image = images[index];
    // Si la imagen está en Supabase Storage, intentar borrarla del bucket también
    if (image.url.includes('product-images')) {
      try {
        const path = image.url.split('/product-images/')[1];
        if (path) await supabase.storage.from('product-images').remove([path]);
      } catch {
        // si falla el borrado del archivo, igual la quitamos de la lista
      }
    }
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {/* Grid de imágenes */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img, i) => (
            <div key={i} className="relative group aspect-square">
              <img src={img.url} alt="" className="w-full h-full object-cover rounded-lg" />
              {i === 0 && (
                <span className="absolute bottom-1 left-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  Principal
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Botón de subida */}
      {images.length < maxImages && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="image-upload-input"
          />
          <label
            htmlFor="image-upload-input"
            className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-6 cursor-pointer transition-colors ${
              uploading ? 'border-gray-200 bg-gray-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                <span className="text-sm text-gray-500">Subiendo imágenes...</span>
              </>
            ) : (
              <>
                <ImagePlus className="h-6 w-6 text-gray-400" />
                <span className="text-sm text-gray-500">
                  Haz clic para subir fotos ({images.length}/{maxImages})
                </span>
                <span className="text-xs text-gray-400">PNG, JPG hasta 5MB</span>
              </>
            )}
          </label>
        </div>
      )}
    </div>
  );
}
