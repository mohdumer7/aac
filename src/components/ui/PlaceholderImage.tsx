// src/components/ui/PlaceholderImage.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import { FileImage, File } from 'lucide-react';

interface PlaceholderImageProps {
  className?: string;
  fileName?: string;
  fileType?: string;
}

/**
 * A placeholder component to display when images fail to load
 */
const PlaceholderImage: React.FC<PlaceholderImageProps> = ({ 
  className,
  fileName,
  fileType
}) => {
  // Determine if it's an image type
  const isImage = fileType?.startsWith('image/') || 
                 fileName?.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i);

  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center bg-gray-100 rounded-md p-4",
        className
      )}
    >
      {isImage ? (
        <FileImage className="h-10 w-10 text-gray-400" />
      ) : (
        <File className="h-10 w-10 text-gray-400" />
      )}
      
      {fileName && (
        <p className="mt-2 text-xs text-gray-500 text-center truncate max-w-full">
          {fileName}
        </p>
      )}
    </div>
  );
};

export default PlaceholderImage;