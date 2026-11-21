import { MedicineType } from '../types/medicine';

export const MEDICINE_TYPE_IMAGES: Record<MedicineType, string> = {
  tablet: '/src/assets/images/medicine_tablet_1795297710615.jpg',
  capsule: '/src/assets/images/medicine_capsule_1795297710614.jpg',
  syrup: '/src/assets/images/medicine_syrup_1795297716662.jpg',
  injection: '/src/assets/images/medicine_injection_1795297712535.jpg',
  other: '/src/assets/images/medicine_other_1795297711710.jpg',
};

export function getMedicineImage(type: MedicineType, customPhoto?: string): string {
  if (customPhoto && customPhoto.trim().length > 0) {
    return customPhoto;
  }
  return MEDICINE_TYPE_IMAGES[type] || MEDICINE_TYPE_IMAGES.tablet;
}
