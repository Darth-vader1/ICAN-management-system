/**
 * FileUpload Component
 * Drag-and-drop file upload with preview, progress tracking, and validation
 * Supports images, PDFs, and documents with size/type restrictions
 */

import React, { useCallback, useState } from 'react';
import { Upload, X, FileText, Image as ImageIcon, File } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onRemove?: () => void;
  accept?: string;
  maxSize?: number; // in bytes
  currentFile?: File | string | null;
  disabled?: boolean;
  className?: string;
  label?: string;
  description?: string;
  error?: string;
}

export function FileUpload({
  onFileSelect,
  onRemove,
  accept = 'image/*,.pdf,.doc,.docx',
  maxSize = 5 * 1024 * 1024, // 5MB default
  currentFile,
  disabled = false,
  className,
  label = 'Upload File',
  description = 'Drag and drop or click to browse',
  error
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `File size must be less than ${(maxSize / 1024 / 1024).toFixed(1)}MB`;
    }

    // Check file type if accept is specified
    if (accept && accept !== '*') {
      const acceptedTypes = accept.split(',').map(t => t.trim());
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const mimeType = file.type;

      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExtension === type.toLowerCase();
        }
        if (type.endsWith('/*')) {
          return mimeType.startsWith(type.replace('/*', ''));
        }
        return mimeType === type;
      });

      if (!isAccepted) {
        return `File type not accepted. Allowed: ${accept}`;
      }
    }

    return null;
  }, [accept, maxSize]);

  const handleFile = useCallback((file: File) => {
    setUploadError(null);

    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    onFileSelect(file);
  }, [validateFile, onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [disabled, handleFile]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleRemove = useCallback(() => {
    setPreview(null);
    setUploadError(null);
    if (onRemove) {
      onRemove();
    }
  }, [onRemove]);

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <ImageIcon className="h-8 w-8 text-blue-600" />;
    }
    if (ext === 'pdf') {
      return <FileText className="h-8 w-8 text-red-600" />;
    }
    return <File className="h-8 w-8 text-gray-600" />;
  };

  const displayedError = error || uploadError;
  const hasFile = currentFile !== null && currentFile !== undefined;
  const fileName = currentFile instanceof File ? currentFile.name : currentFile;

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {!hasFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'relative border-2 border-dashed rounded-lg p-6 transition-colors',
            isDragging && !disabled && 'border-blue-500 bg-blue-50',
            !isDragging && !disabled && 'border-gray-300 hover:border-gray-400',
            disabled && 'opacity-50 cursor-not-allowed bg-gray-50',
            displayedError && 'border-red-300 bg-red-50'
          )}
        >
          <input
            type="file"
            onChange={handleFileInputChange}
            accept={accept}
            disabled={disabled}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          <div className="text-center">
            <Upload className={cn(
              'mx-auto h-12 w-12 mb-3',
              isDragging ? 'text-blue-600' : 'text-gray-400'
            )} />
            <p className="text-sm font-medium text-gray-900 mb-1">
              {description}
            </p>
            <p className="text-xs text-gray-500">
              {accept === '*' ? 'Any file type' : accept.replace(/,/g, ', ')} • Max {(maxSize / 1024 / 1024).toFixed(1)}MB
            </p>
          </div>
        </div>
      ) : (
        <div className="border border-gray-300 rounded-lg p-4 bg-white">
          <div className="flex items-start gap-3">
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="h-16 w-16 rounded object-cover flex-shrink-0"
              />
            ) : (
              <div className="flex-shrink-0">
                {fileName && getFileIcon(fileName)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {fileName}
              </p>
              {currentFile instanceof File && (
                <p className="text-xs text-gray-500 mt-1">
                  {(currentFile.size / 1024).toFixed(1)} KB
                </p>
              )}
            </div>
            {onRemove && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={disabled}
                className="flex-shrink-0 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {displayedError && (
        <p className="text-sm text-red-600">
          {displayedError}
        </p>
      )}
    </div>
  );
}

// Progress Upload Variant (for showing upload progress)
interface FileUploadWithProgressProps extends FileUploadProps {
  progress?: number; // 0-100
  uploading?: boolean;
}

export function FileUploadWithProgress({
  progress = 0,
  uploading = false,
  ...props
}: FileUploadWithProgressProps) {
  return (
    <div className="space-y-2">
      <FileUpload {...props} disabled={props.disabled || uploading} />
      {uploading && (
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Uploading...</span>
            <span className="text-gray-900 font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}
    </div>
  );
}
