import React, { useState } from 'react';

interface AvatarProps {
  picture?: string | null;
  name: string;
  sizeClass?: string;
}

export default function Avatar({ picture, name, sizeClass = "size-8" }: AvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const initial = name ? name.trim().charAt(0).toUpperCase() : '?';

  if (picture && picture.startsWith('http') && !imgFailed) {
    return (
      <img
        src={picture}
        alt={name}
        className={`${sizeClass} rounded-full object-cover shrink-0 border border-slate-200/50 shadow-xs`}
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-extrabold flex items-center justify-center text-xs leading-none shadow-xs shrink-0 border border-blue-500`}
    >
      {initial}
    </div>
  );
}
