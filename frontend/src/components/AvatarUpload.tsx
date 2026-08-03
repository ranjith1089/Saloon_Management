import { useRef, useState } from 'react';
import { Loader2, Upload, X, User } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';

interface Props {
  value?: string | null;
  onChange: (url: string | null) => void;
  folder?: string;       // Cloudinary folder to bucket uploads into
  label?: string;
  size?: number;         // px, default 96
  disabled?: boolean;
}

/**
 * Circular avatar picker with click-to-upload. Streams the file to the
 * backend's Cloudinary proxy at POST /uploads/image and sets the returned URL.
 */
export default function AvatarUpload({ value, onChange, folder = 'salon', label = 'Photo', size = 96, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);

  // Keep local preview in sync when parent resets the value.
  if (value !== undefined && value !== preview && !uploading) {
    // avoid infinite loop by only setting when different
    setTimeout(() => setPreview(value || null), 0);
  }

  const pick = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please pick an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Max size 5 MB');
      return;
    }

    // Optimistic local preview while the upload runs.
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post(`/uploads/image?folder=${encodeURIComponent(folder)}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.data?.url;
      if (!url) throw new Error('No URL returned');
      onChange(url);
      setPreview(url);
      toast.success('Uploaded');
    } catch (err: any) {
      setPreview(value || null);
      const msg =
        err?.response?.status === 501
          ? 'File uploads not configured — ask an admin to set Cloudinary env vars.'
          : err?.response?.data?.message || 'Upload failed';
      toast.error(msg);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const clear = () => {
    setPreview(null);
    onChange(null);
  };

  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={pick}
          disabled={disabled || uploading}
          className="relative rounded-full overflow-hidden border-2 border-dashed border-gray-300 hover:border-primary-400 bg-gray-50 flex-shrink-0"
          style={{ width: size, height: size }}
          title="Click to upload a photo"
        >
          {preview ? (
            <img src={preview} alt="" className="w-full h-full object-cover" onError={() => setPreview(null)} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <User style={{ width: size * 0.4, height: size * 0.4 }} />
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
        </button>

        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={pick}
            disabled={disabled || uploading}
            className="btn-secondary text-xs !py-1.5 inline-flex items-center gap-1"
          >
            <Upload className="w-3.5 h-3.5" />
            {preview ? 'Change photo' : 'Upload photo'}
          </button>
          {preview && (
            <button
              type="button"
              onClick={clear}
              disabled={disabled || uploading}
              className="text-xs text-red-600 hover:underline inline-flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Remove
            </button>
          )}
          <p className="text-[11px] text-gray-400">JPG / PNG · max 5 MB</p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
    </div>
  );
}
