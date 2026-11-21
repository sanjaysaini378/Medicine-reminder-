import React, { useState } from 'react';
import { Droplets, FlaskConical, Pill, Syringe, Tablets } from 'lucide-react';
import { MedicineType } from '../types/medicine';
import { getMedicineImage } from '../data/medicineAssets';

interface MedicineVisualProps {
  type: MedicineType;
  name: string;
  photoUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const MedicineTypeIcon: React.FC<{ type: MedicineType; className?: string }> = ({
  type,
  className = 'w-5 h-5',
}) => {
  switch (type) {
    case 'tablet':
      return <Tablets className={className} />;
    case 'capsule':
      return <Pill className={className} />;
    case 'syrup':
      return <FlaskConical className={className} />;
    case 'injection':
      return <Syringe className={className} />;
    default:
      return <Droplets className={className} />;
  }
};

const SIZE_CLASSES: Record<NonNullable<MedicineVisualProps['size']>, string> = {
  sm: 'w-12 h-12 rounded-xl',
  md: 'w-16 h-16 rounded-2xl',
  lg: 'w-20 h-20 rounded-2xl',
  xl: 'w-28 h-28 rounded-3xl',
};

const ICON_FALLBACK_BG: Record<MedicineType, string> = {
  tablet: 'bg-teal-50 text-[#0D7A6F]',
  capsule: 'bg-sky-50 text-sky-700',
  syrup: 'bg-amber-50 text-amber-700',
  injection: 'bg-indigo-50 text-indigo-700',
  other: 'bg-slate-100 text-slate-700',
};

export const MedicineVisual: React.FC<MedicineVisualProps> = ({
  type,
  name,
  photoUrl,
  size = 'md',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);
  const src = getMedicineImage(type, photoUrl);

  return (
    <div
      className={`relative overflow-hidden shrink-0 border border-slate-200/80 ${SIZE_CLASSES[size]} ${ICON_FALLBACK_BG[type]} ${className}`}
    >
      {!imgError ? (
        <img
          src={src}
          alt={`${name} (${type})`}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-2">
          <MedicineTypeIcon type={type} className="w-7 h-7" />
        </div>
      )}
    </div>
  );
};
