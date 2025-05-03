// components/forms/FileUploadField.tsx
import React from 'react';
import { IconType } from 'react-icons';

interface FileUploadFieldProps {
  id: string;
  name: string;
  label: string;
  icon: IconType;
  file: File | null;
  error?: string;
  placeholder?: string;
  hint?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>, field: string) => void;
}

const FileUploadField: React.FC<FileUploadFieldProps> = ({
  id,
  name,
  label,
  icon: Icon,
  file,
  error,
  placeholder = 'Upload document',
  hint = 'PDF, JPG, PNG (MAX. 5MB)',
  onChange,
}) => {
  return (
    <div className='space-y-1'>
      <label
        htmlFor={id}
        className='text-foreground/80 text-xs font-medium'
      >
        {label}
      </label>
      <div className='flex w-full items-center justify-center'>
        <label className={`flex h-16 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed ${error ? 'border-destructive' : 'border-sidebar-border'} bg-background transition-colors hover:bg-primary/5`}>
          <div className='flex items-center justify-center space-x-2'>
            <Icon className='size-5 text-primary' />
            <div>
              <p className='text-foreground/70 text-xs font-semibold'>
                {file ? file.name : placeholder}
              </p>
              <p className='text-foreground/50 text-xs'>
                {hint}
              </p>
            </div>
          </div>
          <input
            id={id}
            name={name}
            type='file'
            className='hidden'
            onChange={(e) => onChange(e, name)}
            accept='.pdf,.jpg,.jpeg,.png'
          />
        </label>
      </div>
      {error && (
        <p className='text-destructive mt-1 text-xs'>
          {error}
        </p>
      )}
    </div>
  );
};

export default FileUploadField;