// src/components/ui/FilePreviewDialog.tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import PlaceholderImage from './PlaceholderImage';
import { cn } from '@/lib/utils';

interface FilePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  file: any;
  formatFileSize?: (bytes: number) => string;
}

const FilePreviewDialog: React.FC<FilePreviewDialogProps> = ({
  isOpen,
  onClose,
  file,
  formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  if (!file) return null;
  
  const isImage = file.fileType?.startsWith('image/');
  const isVideo = file.fileType?.startsWith('video/');
  const isPdf = file.fileType?.includes('pdf');
  
  const getFileUrl = () => {
    // If we have a direct URL, use it
    if (file.url) {
      return file.url.startsWith('http') ? file.url : `${file.url}`;
    }
    
    // If we have a stored filename, construct the URL
    return `/uploads/${file.storedFileName || file.fileName || file.originalName || ''}`;
  };
  
  const getDownloadUrl = () => {
    const filename = file.storedFileName || file.fileName;
    const originalName = file.originalName || file.fileName || 'download';
    
    if (!filename) return getFileUrl(); // Fallback to direct URL if no filename
    
    return `/api/download?file=${encodeURIComponent(filename)}&originalName=${encodeURIComponent(originalName)}`;
  };
  
  // Handle file download
  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    const downloadUrl = getDownloadUrl();
    
    // Create a temporary anchor element and trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', file.originalName || file.fileName || 'download');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "p-0 border-none max-w-4xl overflow-hidden",
        isFullscreen ? "w-[95vw] h-[95vh] max-h-[95vh]" : ""
      )}>
        <DialogHeader className="p-4 flex-row justify-between items-center border-b">
          <DialogTitle className="text-lg font-medium flex items-center">
            {file.fileName}
            {file.fileSize && (
              <span className="ml-2 text-sm text-gray-500 font-normal">
                ({formatFileSize(file.fileSize)})
              </span>
            )}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </DialogHeader>
        
        <div className={cn(
          "flex items-center justify-center bg-gray-50", 
          isFullscreen ? "h-[calc(95vh-9rem)]" : "h-[60vh]"
        )}>
          {isImage && !imageError ? (
            <img 
              src={getFileUrl()} 
              alt={file.fileName || "Image preview"} 
              className="max-h-full max-w-full object-contain"
              onError={() => setImageError(true)}
            />
          ) : isVideo ? (
            <video
              src={getFileUrl()}
              controls
              className="max-h-full max-w-full"
              onError={() => setImageError(true)}
            >
              Your browser does not support video playback.
            </video>
          ) : isPdf ? (
            <iframe
              src={`${getFileUrl()}#toolbar=0&navpanes=0`}
              className="w-full h-full"
              title={file.fileName || "PDF preview"}
            />
          ) : (
            <PlaceholderImage 
              className="w-48 h-48"
              fileName={file.fileName}
              fileType={file.fileType}
            />
          )}
        </div>
        
        <DialogFooter className="p-4 border-t flex-row justify-between">
          <div className="text-sm text-gray-500">
            {file.fileType}
          </div>

        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FilePreviewDialog;