import { useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import * as adventurer from '@dicebear/adventurer';
import * as bottts from '@dicebear/bottts';
import * as lorelei from '@dicebear/lorelei';
import type { DiceBearStyleId, UserAvatarConfig } from '../types/dek';

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

function buildDiceBearDataUri(
  diceStyle: DiceBearStyleId,
  seed: string,
  bgColor: string,
): string {
  const opts = {
    seed: seed.trim() || 'DEK_Hero',
    backgroundColor: [bgColor.replace('#', '')],
  };
  if (diceStyle === 'adventurer') {
    return createAvatar(adventurer, opts).toDataUri();
  }
  if (diceStyle === 'bottts') {
    return createAvatar(bottts, opts).toDataUri();
  }
  return createAvatar(lorelei, opts).toDataUri();
}

export function UserAvatar({
  avatar,
  size = 'md',
  ring = true,
  className = '',
}: UserAvatarProps) {
  const src = useMemo(() => {
    if (avatar.mode === 'preset') {
      return `/avatars/${avatar.presetId}.jpg`;
    }
    return buildDiceBearDataUri(avatar.diceStyle, avatar.seed, avatar.bgColor);
  }, [avatar.mode, avatar.presetId, avatar.diceStyle, avatar.seed, avatar.bgColor]);

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-2xl bg-[#0B0E14] ${SIZE_CLASSES[size]} ${className}`}
      style={
        ring
          ? {
              boxShadow: `0 0 0 2px ${avatar.auraColor}, 0 0 12px ${avatar.auraColor}45`,
            }
          : undefined
      }
    >
      <img
        src={src}
        alt="Avatar Athlète DEK"
        className="h-full w-full object-cover"
      />
    </div>
  );
}
