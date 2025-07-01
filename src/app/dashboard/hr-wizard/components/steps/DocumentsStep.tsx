import React, { useState, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { Upload, FileText, X, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FormField, FormItem, FormMessage } from '@/components/ui/form';
import { WizardStepProps } from '../types';
import { cn } from '@/lib/utils';

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  progress?: number;
  status?: 'uploading' | 'completed' | 'error';
  error?: string;
}

interface DocumentsStepProps extends WizardStepProps {
  onUpload?: (file: File, documentType: string) => Promise<void>;
  onDelete?: (documentId: string) => Promise<void>;
}

export const DocumentsStep: React.FC<DocumentsStepProps> = ({
  formMethods,
  onNext,
  onBack,
  onSaveDraft,
  onUpload,
  onDelete,
  isSubmitting = false,
  isLastStep = false,
  isFirstStep = false,
}) => {
  const { control, watch, setValue } = formMethods;
  const documents: Document[] = watch('documents') || [];
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});

  // Handle file selection
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      await handleFiles(Array.from(files));
      // Reset the input to allow selecting the same file again
      e.target.value = '';
    },
    []
  );

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        await handleFiles(files);
      }
    },
    []
  );

  // Process uploaded files
  const handleFiles = useCallback(
    async (files: File[]) => {
      if (!onUpload) return;

      const newDocuments = [...documents];
      const newUploadingFiles = { ...uploadingFiles };

      for (const file of files) {
        const documentId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Add the document to the list with uploading state
        const newDoc: Document = {
          id: documentId,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          status: 'uploading',
        };

        newDocuments.push(newDoc);
        newUploadingFiles[documentId] = true;
        
        // Update the form with the new document
        setValue('documents', newDocuments, { shouldDirty: true });
        setUploadingFiles(newUploadingFiles);

        try {
          // Call the upload function
          await onUpload(file, file.type || 'other');
          
          // Update the document status to completed
          const updatedDocs = newDocuments.map(doc => 
            doc.id === documentId 
              ? { ...doc, status: 'completed' as const }
              : doc
          );
          
          setValue('documents', updatedDocs, { shouldDirty: true });
          toast.success(`Uploaded ${file.name} successfully`);
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          
          // Update the document status to error
          const updatedDocs = newDocuments.map(doc => 
            doc.id === documentId 
              ? { 
                  ...doc, 
                  status: 'error' as const, 
                  error: 'Failed to upload document' 
                } 
              : doc
          );
          
          setValue('documents', updatedDocs, { shouldDirty: true });
          toast.error(`Failed to upload ${file.name}`);
        } finally {
          // Remove from uploading state
          const { [documentId]: _, ...remainingUploads } = uploadingFiles;
          setUploadingFiles(remainingUploads);
        }
      }
    },
    [documents, onUpload, setValue, uploadingFiles]
  );

  // Handle document deletion
  const handleDelete = useCallback(
    async (documentId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      
      if (!onDelete) return;
      
      try {
        // Optimistically remove the document from the UI
        const updatedDocs = documents.filter(doc => doc.id !== documentId);
        setValue('documents', updatedDocs, { shouldDirty: true });
        
        // Call the delete function
        await onDelete(documentId);
        toast.success('Document deleted successfully');
      } catch (error) {
        console.error('Error deleting document:', error);
        toast.error('Failed to delete document');
        // Revert the UI if deletion fails
        setValue('documents', documents, { shouldDirty: true });
      }
    },
    [documents, onDelete, setValue]
  );

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon based on file type
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FileText className="h-5 w-5 text-green-600" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileText className="h-5 w-5 text-purple-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Required Documents</h3>
        <p className="text-sm text-muted-foreground">
          Upload all required documents for employee onboarding.
        </p>
      </div>

      {/* Document upload area */}
      <div 
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragging ? 'border-primary bg-primary/5' : 'border-border'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {isDragging ? 'Drop files here' : 'Drag and drop files here'}
            </p>
            <p className="text-xs text-muted-foreground">
              or click to browse files (PDF, DOC, XLS, JPG up to 10MB)
            </p>
          </div>
          <Button 
            type="button" 
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            Select Files
          </Button>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            multiple
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
          />
        </div>
      </div>

      {/* Uploaded documents list */}
      {documents.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Uploaded Documents ({documents.length})</h4>
          <div className="border rounded-lg divide-y">
            {documents.map((doc) => (
              <div 
                key={doc.id} 
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(doc.name)}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(doc.size)}
                      {doc.status === 'uploading' && ' • Uploading...'}
                      {doc.status === 'error' && ' • Upload failed'}
                    </p>
                    
                    {/* Upload progress */}
                    {doc.status === 'uploading' && doc.progress !== undefined && (
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-primary h-1.5 rounded-full" 
                          style={{ width: `${doc.progress}%` }}
                        />
                      </div>
                    )}
                    
                    {/* Error message */}
                    {doc.status === 'error' && doc.error && (
                      <p className="text-xs text-red-500 mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {doc.error}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {doc.status === 'completed' && doc.url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => window.open(doc.url, '_blank')}
                      title="View document"
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => handleDelete(doc.id, e)}
                    disabled={uploadingFiles[doc.id]}
                    title="Delete document"
                  >
                    {uploadingFiles[doc.id] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Required documents checklist */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Required Documents Checklist</h4>
        <div className="space-y-2">
          {[
            'Passport Copy',
            'Visa Copy',
            'Emirates ID (Front & Back)',
            'Passport Size Photo',
            'Educational Certificates',
            'Previous Experience Certificates',
            'Labor Contract',
            'Insurance Card',
          ].map((docName) => {
            const isUploaded = documents?.some(
              (doc) => doc?.name.toLowerCase().includes(docName.split(' ')[0].toLowerCase())
            );
            
            return (
              <div key={docName} className="flex items-center space-x-3">
                <div className={cn(
                  'h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0',
                  isUploaded 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-muted text-muted-foreground'
                )}>
                  {isUploaded ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <div className="h-1.5 w-1.5 rounded-full bg-current" />
                  )}
                </div>
                <span className={cn(
                  'text-sm',
                  isUploaded ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {docName}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DocumentsStep;
