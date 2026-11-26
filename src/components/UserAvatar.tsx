import { useEffect, useState } from 'react';
import type { UserAvatarConfig } from '../types/dek';

interface UserAvatarProps {
  avatar: UserAvatarConfig;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  ring?: boolean;
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<UserAvatarProps['size']>, string> = {
  xs: 'h-7 w-7',
  sm: 'h-9 w-9',
  md: 'h-11 w-11',
  lg: 'h-14 w-14',
  xl: 'h-20 w-20',
};

// Cache partagé des avatars DiceBear déjà générés (clé : style|graine|fond)
const diceBearCache = new Map<string, string>();
let diceBearModule: Promise<typeof import('../utils/diceBearAvatar')> | null = null;
const loadDiceBear = () => (diceBearModule ??= import('../utils/diceBearAvatar'));

function useDiceBearUri(avatar: UserAvatarConfig): string | undefined {
  const key =
    avatar.mode === 'custom' ? `${avatar.diceStyle}|${avatar.seed}|${avatar.bgColor}` : null;
  const [, setVersion] = useState(0);

  useEffect(() => {
    if (!key || diceBearCache.has(key)) return;
    let alive = true;
    loadDiceBear()
      .then((m) => {
        diceBearCache.set(key, m.buildDiceBearDataUri(avatar.diceStyle, avatar.seed, avatar.bgColor));
        if (alive) setVersion((v) => v + 1);
      })
      .catch(() => {
        // Hors-ligne : on garde le fond neutre
      });
    return () => {
      alive = false;
    };
  }, [key, avatar.diceStyle, avatar.seed, avatar.bgColor]);

  return key ? diceBearCache.get(key) : undefined;
}

export function UserAvatar({
  avatar,
  size = 'md',
  ring = true,
  className = '',
}: UserAvatarProps) {
  const diceUri = useDiceBearUri(avatar);
  const src = avatar.mode === 'preset' ? `/avatars/${avatar.presetId}.jpg` : diceUri;

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full bg-tile ${ring ? 'ring-1 ring-white/10' : ''} ${SIZE_CLASSES[size]} ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt="Avatar Athlète DEK"
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full" style={{ backgroundColor: `#${avatar.bgColor.replace('#', '')}` }} />
      )}
    </div>
  );
}
