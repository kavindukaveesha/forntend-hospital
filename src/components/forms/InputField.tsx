// components/forms/InputField.tsx
import React from 'react';
import { Input } from '@/components/ui/input';
import { IconType } from 'react-icons';

interface InputFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  type?: string;
  placeholder?: string;
  icon: IconType;
  error?: string;
  required?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const InputField: React.FC<InputFieldProps> = ({
  id,
  name,
  label,
  value,
  type = 'text',
  placeholder,
  icon: Icon,
  error,
  required = false,
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
      <div className='relative'>
        <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2'>
          <Icon className='text-foreground/40 size-3.5' />
        </div>
        <Input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          className={`h-9 bg-background py-1 pl-8 text-sm focus:border-primary ${error ? 'border-destructive' : ''}`}
          placeholder={placeholder}
        />
        {error && (
          <p className='text-destructive mt-1 text-xs'>
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default InputField;