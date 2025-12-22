import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { rustApi } from '@/lib/rustBack';
import { toast } from 'sonner';
import { Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ImageUploaderProps {
  onImageUploaded: (url: string) => void;
  maxSizeMB?: number;
}

export default function ImageUploader({ onImageUploaded, maxSizeMB = 5 }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadUrlMutation = rustApi.post.getImageUploadUrl.useMutation();

  const compressImage = async (file: File, maxSizeMB: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Максимальные размеры
          const maxWidth = 1920;
          const maxHeight = 1920;

          // Масштабирование если изображение слишком большое
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = (height / width) * maxWidth;
              width = maxWidth;
            } else {
              width = (width / height) * maxHeight;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Начинаем с качества 0.8 и уменьшаем если файл слишком большой
          let quality = 0.8;
          const targetSizeBytes = maxSizeMB * 1024 * 1024;

          const tryCompress = () => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('Failed to compress image'));
                  return;
                }

                // Если размер подходит или качество уже минимальное, возвращаем результат
                if (blob.size <= targetSizeBytes || quality <= 0.1) {
                  resolve(blob);
                } else {
                  // Уменьшаем качество и пробуем снова
                  quality -= 0.1;
                  tryCompress();
                }
              },
              'image/jpeg',
              quality
            );
          };

          tryCompress();
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Проверка размера (max 20MB для начала, потом сожмем)
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Image is too large (max 20MB)');
      return;
    }

    setUploading(true);
    setProgress(10);

    try {
      // Сжатие изображения
      setProgress(30);
      const compressedBlob = await compressImage(file, maxSizeMB);
      const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });
      
      setProgress(50);

      // Получение URL для загрузки
      let uploadData;
      try {
        uploadData = await uploadUrlMutation.mutateAsync({ 
          contentType: 'image/jpeg' 
        });
      } catch (urlError: any) {
        // Тихо обрабатываем S3 ошибку и показываем понятное сообщение
        toast.error(
          'Image upload is not configured', 
          {
            description: 'S3 storage is not set up. You can paste an image URL instead or ask admin to configure S3. See SETUP_S3.md for details.',
            duration: 10000,
          }
        );
        setUploading(false);
        setProgress(0);
        return; // Выходим без выброса ошибки
      }

      const { url } = uploadData;
      setProgress(70);

      // Загрузка на S3
      const uploadResponse = await fetch(url, {
        method: 'PUT',
        body: compressedFile,
        headers: {
          'Content-Type': 'image/jpeg',
        },
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('S3 Upload failed:', uploadResponse.status, errorText);
        throw new Error(`Failed to upload image: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }

      setProgress(100);

      // Получаем чистый URL без query параметров
      const imageUrl = url.split('?')[0];
      onImageUploaded(imageUrl);
      
      toast.success(`Image uploaded! Original: ${(file.size / 1024 / 1024).toFixed(2)}MB → Compressed: ${(compressedBlob.size / 1024 / 1024).toFixed(2)}MB`);
    } catch (error) {
      // Обрабатываем только реальные ошибки загрузки (не S3 конфигурацию)
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
      if (!errorMessage.includes('S3')) {
        toast.error(errorMessage);
      }
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUrlSubmit = async () => {
    if (!imageUrl.trim()) {
      toast.error('Please enter an image URL');
      return;
    }

    try {
      const url = new URL(imageUrl);
      if (!url.protocol.startsWith('http')) {
        toast.error('URL must start with http:// or https://');
        return;
      }

      // Проверяем, что URL действительно загружается как изображение
      setUploading(true);
      const img = new Image();
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load image from URL'));
        img.src = imageUrl;
      });
      
      setUploading(false);
      onImageUploaded(imageUrl);
      toast.success('Image URL added!');
      setImageUrl('');
      setShowUrlInput(false);
    } catch (error) {
      setUploading(false);
      if (error instanceof TypeError) {
        toast.error('Invalid URL format');
      } else {
        toast.error('Failed to load image from this URL. Make sure it\'s a direct link to an image.');
      }
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || showUrlInput}
          className="border-2 border-black"
        >
          <ImageIcon className="h-4 w-4 mr-2" />
          {uploading ? 'Uploading...' : 'Upload Image'}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => setShowUrlInput(!showUrlInput)}
          disabled={uploading}
          className="border-2 border-black"
        >
          <LinkIcon className="h-4 w-4 mr-2" />
          Paste URL
        </Button>
      </div>

      {showUrlInput && (
        <div className="flex gap-2">
          <Input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://i.imgur.com/example.jpg"
            className="border-2 border-black"
            disabled={uploading}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleUrlSubmit();
              }
            }}
          />
          <Button
            type="button"
            onClick={handleUrlSubmit}
            disabled={uploading}
            className="bg-black text-white border-2 border-black"
          >
            {uploading ? 'Checking...' : 'Add'}
          </Button>
        </div>
      )}

      {uploading && (
        <div className="space-y-1">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-slate-500">Compressing and uploading... {progress}%</p>
        </div>
      )}

      {showUrlInput && (
        <p className="text-xs text-gray-500">
          Tip: Use free image hosting like <a href="https://imgur.com" target="_blank" rel="noopener" className="underline">imgur.com</a> or <a href="https://imgbb.com" target="_blank" rel="noopener" className="underline">imgbb.com</a>
        </p>
      )}
    </div>
  );
}
