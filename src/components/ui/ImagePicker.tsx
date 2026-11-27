import { useRef, useState, type ReactNode } from 'react';
import { fileToDataUrl } from '../../utils/customImage';

/** Bouton « choisir une image » : ouvre la galerie ou l'appareil photo, réduit l'image et la renvoie. */
export function ImagePicker({
  onPick,
  children,
  className = '',
  maxWidth = 1000,
}: {
  onPick: (dataUrl: string) => void;
  children: ReactNode;
  className?: string;
  maxWidth?: number;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <button type="button" onClick={() => inputRef.current?.click()} className={className}>
        {children}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          try {
            setError(null);
            onPick(await fileToDataUrl(file, maxWidth));
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Image impossible à charger.');
          }
        }}
      />
      {error && (
        <span role="alert" className="block text-[12px] font-medium text-danger">
          {error}
        </span>
      )}
    </>
  );
}
