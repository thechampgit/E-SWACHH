import data from '@/app/lib/placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

/**
 * Centrally managed placeholder image data to prevent undefined access crashes.
 */
export const PlaceHolderImages: ImagePlaceholder[] = data.placeholderImages || [];
