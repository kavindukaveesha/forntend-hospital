// app/importer/register/page.tsx
'use client';
import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FaUser,
  FaIdCard,
  FaGlobe,
  FaFileAlt,
  FaPhone,
  FaEnvelope,
  FaLock,
  FaPassport,
  FaFileUpload,
} from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { ThemeModeToggle } from '@/components/ThemeModeToggle';
import InputField from '@/components/forms/InputField';
import FileUploadField from '@/components/forms/FileUploadField';
import { useToast } from '@/hooks/use-toast';
import dynamic from 'next/dynamic';
import { drugImporterService } from '../../../services/api';
import { Textarea } from '@/components/ui/textarea';


// Validation functions
function validateFileUpload(file: File): string | null {
  // Check file size (max 5MB)
  const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSizeInBytes) {
    return "File size exceeds 5MB limit";
  }

  // Check file type (PDF, JPG, JPEG, PNG)
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  if (!allowedTypes.includes(file.type)) {
    return "Only PDF, JPG, JPEG, and PNG files are allowed";
  }

  // File is valid
  return null;
}

function validateRegistrationForm(data: {
  fullName: string;
  nic: string;
  email: string;
  licenseNumber: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  website: string;
  additionalInfo: string;
  nicProof: File | null;
  licenseProof: File | null;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  // Full Name validation
  if (!data.fullName.trim()) {
    errors.fullName = "Full name is required";
  } else if (data.fullName.trim().length < 2) {
    errors.fullName = "Full name must be at least 2 characters";
  }

  // NIC validation
  if (!data.nic.trim()) {
    errors.nic = "NIC is required";
  } else if (data.nic.trim().length < 5) {
    errors.nic = "NIC must be at least 5 characters";
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email.trim()) {
    errors.email = "Email is required";
  } else if (!emailRegex.test(data.email)) {
    errors.email = "Please enter a valid email address";
  }

  // License Number validation
  if (!data.licenseNumber.trim()) {
    errors.licenseNumber = "License number is required";
  }

  // Phone Number validation
  const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  if (!data.phoneNumber.trim()) {
    errors.phoneNumber = "Phone number is required";
  } else if (!phoneRegex.test(data.phoneNumber)) {
    errors.phoneNumber = "Please enter a valid phone number";
  }

  // Website validation (optional)
  if (data.website && data.website.trim()) {
    const websiteRegex = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?$/;
    if (!websiteRegex.test(data.website)) {
      errors.website = "Please enter a valid website URL";
    }
  }

  // Password validation
  if (!data.password) {
    errors.password = "Password is required";
  } else if (data.password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  }

  // Confirm Password validation
  if (!data.confirmPassword) {
    errors.confirmPassword = "Please confirm your password";
  } else if (data.confirmPassword !== data.password) {
    errors.confirmPassword = "Passwords do not match";
  }

  // File validations
  if (!data.nicProof) {
    errors.nicProof = "NIC proof document is required";
  }

  if (!data.licenseProof) {
    errors.licenseProof = "License proof document is required";
  }

  return errors;
}

// Registration form data type
interface RegistrationFormData {
  fullName: string;
  nic: string;
  email: string;
  licenseNumber: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  website: string;
  additionalInfo: string;
  nicProof: File | null;
  licenseProof: File | null;
}

const RegistrationPage = () => {
  // Registration form state
  const [registrationData, setRegistrationData] = useState<RegistrationFormData>({
    fullName: '',
    nic: '',
    email: '',
    licenseNumber: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    website: '',
    additionalInfo: '',
    nicProof: null,
    licenseProof: null,
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setRegistrationData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle file input changes
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: 'nicProof' | 'licenseProof'
  ) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      const errorMessage = validateFileUpload(file);
      
      if (errorMessage) {
        setFormErrors(prev => ({
          ...prev,
          [fileType]: errorMessage
        }));
        
        toast({
          title: "File Error",
          description: errorMessage,
          variant: "destructive",
        });
        
        return;
      }
      
      // Clear any previous error for this file
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fileType];
        return newErrors;
      });
      
      setRegistrationData((prev) => ({
        ...prev,
        [fileType]: file,
      }));
    }
  };

  // Function to simulate file upload and get URL
  const uploadFile = async (file: File): Promise<string> => {
    // This is a mock function - in a real application, you would use a proper file upload service
    // For example, you might upload to your server or a service like AWS S3
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return a mock URL
    return `https://example.com/uploads/${file.name}`;
  };

  // Handle form submission
  const handleRegistration = async (e: FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateRegistrationForm(registrationData);
    setFormErrors(validationErrors);
    
    if (Object.keys(validationErrors).length === 0) {
      setIsLoading(true);
      
      try {
        let nicotineProofUrl = "";
        let licenseProofUrl = "";
        
        // Upload files if they exist
        if (registrationData.nicProof) {
          nicotineProofUrl = await uploadFile(registrationData.nicProof);
        }
        
        if (registrationData.licenseProof) {
          licenseProofUrl = await uploadFile(registrationData.licenseProof);
        }
        
        // Map form data to API format
        const requestData = {
          name: registrationData.fullName,
          email: registrationData.email,
          password: registrationData.password,
          phone: registrationData.phoneNumber,
          licenseNumber: registrationData.licenseNumber,
          website: registrationData.website || undefined,
          nic: registrationData.nic,
          additionalText: registrationData.additionalInfo || undefined,
          nicotineProofUrl,
          licenseProofUrl
        };
        
        // Call registration service
        await drugImporterService.register(requestData);
        
        toast({
          title: "Registration Successful",
          description: "Your account registration has been submitted. Please check your email for verification.",
        });
        
        // Navigate to login page after successful registration
        router.push('/auth/login');
      } catch (error: any) {
        toast({
          title: "Registration Failed",
          description: error.message || "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      toast({
        title: "Validation Error",
        description: "Please check the form for errors and try again.",
        variant: "destructive",
      });
    }
  };

  // Rest of component remains the same
  return (
    <div className='relative flex h-screen w-full'>
      {/* Theme toggle positioned in the top right */}
      <div className='absolute right-4 top-4 z-50'>
        <ThemeModeToggle />
      </div>

      {/* Form Section */}
      <div className='flex w-full items-center justify-center p-3 sm:p-5 lg:w-1/2'>
        <Card className='flex h-[95vh] w-full max-w-xl flex-col overflow-y-auto border-sidebar-border p-4 shadow-lg'>
          {/* Form header */}
          <div className='mb-3 text-center'>
            <h1 className='bg-gradient-to-r from-primary to-secondary bg-clip-text text-xl font-bold text-transparent sm:text-2xl'>
              Registration Request Form
            </h1>
            <p className='text-foreground/70 text-sm'>
              Create an account to access the medical portal
            </p>
          </div>

          {/* Form content */}
          <form className='flex grow flex-col' onSubmit={handleRegistration}>
            <div className='grid grow grid-cols-1 gap-3'>
              {/* Input Fields Grid */}
              <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3'>
                <InputField
                  id="fullName"
                  name="fullName"
                  label="Full Name"
                  value={registrationData.fullName}
                  onChange={handleInputChange}
                  icon={FaUser}
                  placeholder="Dr. John Smith"
                  error={formErrors.fullName}
                  required
                />

                <InputField
                  id="nic"
                  name="nic"
                  label="NIC"
                  value={registrationData.nic}
                  onChange={handleInputChange}
                  icon={FaIdCard}
                  placeholder="123456789X"
                  error={formErrors.nic}
                  required
                />

                <InputField
                  id="email"
                  name="email"
                  label="Email"
                  value={registrationData.email}
                  type="email"
                  onChange={handleInputChange}
                  icon={FaEnvelope}
                  placeholder="example@gmail.com"
                  error={formErrors.email}
                  required
                />

                <InputField
                  id="licenseNumber"
                  name="licenseNumber"
                  label="License Number"
                  value={registrationData.licenseNumber}
                  onChange={handleInputChange}
                  icon={FaFileAlt}
                  placeholder="MED-12345"
                  error={formErrors.licenseNumber}
                  required
                />

                <InputField
                  id="phoneNumber"
                  name="phoneNumber"
                  label="Phone Number"
                  value={registrationData.phoneNumber}
                  type="tel"
                  onChange={handleInputChange}
                  icon={FaPhone}
                  placeholder="+94 123 456 678"
                  error={formErrors.phoneNumber}
                  required
                />

                <InputField
                  id="website"
                  name="website"
                  label="Website"
                  value={registrationData.website || ''}
                  type="url"
                  onChange={handleInputChange}
                  icon={FaGlobe}
                  placeholder="https://yourdomain.com"
                  error={formErrors.website}
                />
              </div>

              {/* Password Fields */}
              <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                <InputField
                  id="password"
                  name="password"
                  label="Password"
                  value={registrationData.password}
                  type="password"
                  onChange={handleInputChange}
                  icon={FaLock}
                  placeholder="••••••••"
                  error={formErrors.password}
                  required
                />

                <InputField
                  id="confirmPassword"
                  name="confirmPassword"
                  label="Confirm Password"
                  value={registrationData.confirmPassword}
                  type="password"
                  onChange={handleInputChange}
                  icon={FaLock}
                  placeholder="••••••••"
                  error={formErrors.confirmPassword}
                  required
                />
              </div>

              {/* Additional Information */}
              <div className='space-y-1'>
                <label
                  htmlFor='additionalInfo'
                  className='text-foreground/80 text-xs font-medium'
                >
                  Additional Information
                </label>
                {typeof window !== 'undefined' && (
                  <Textarea
                    id='additionalInfo'
                    name='additionalInfo'
                    value={registrationData.additionalInfo || ''}
                    onChange={handleInputChange}
                    className='h-16 min-h-[60px] resize-none bg-background text-sm focus:border-primary'
                    placeholder='Please share any additional details about your practice'
                  />
                )}
              </div>

              {/* File Upload Section */}
              <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                <FileUploadField
                  id="nicProof"
                  name="nicProof"
                  label="NIC Proof"
                  file={registrationData.nicProof}
                  onChange={(e) => handleFileChange(e, 'nicProof')}
                  icon={FaPassport}
                  placeholder="Upload NIC document"
                  error={formErrors.nicProof}
                />

                <FileUploadField
                  id="licenseProof"
                  name="licenseProof"
                  label="License Proof"
                  file={registrationData.licenseProof}
                  onChange={(e) => handleFileChange(e, 'licenseProof')}
                  icon={FaFileUpload}
                  placeholder="Upload license document"
                  error={formErrors.licenseProof}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className='mt-3 space-y-2 pt-2'>
              {/* Submit Button */}
              <Button
                type='submit'
                className='h-10 w-full bg-primary text-white hover:bg-primary-600'
                size='sm'
                disabled={isLoading}
              >
                {isLoading ? 'Submitting...' : 'Submit Registration'}
              </Button>

              {/* Login redirect text */}
              <div className='text-center'>
                <p className='text-foreground/70 text-xs'>
                  Already have an account?{' '}
                  <Link
                    href='/auth/login'
                    className='font-medium text-primary transition-colors hover:text-primary-600'
                  >
                    Sign in instead
                  </Link>
                </p>
              </div>
            </div>
          </form>
        </Card>
      </div>

      {/* Image Section */}
      <div className='relative hidden h-full bg-primary/5 lg:block lg:w-1/2'>
        <div className='absolute inset-0 flex items-center justify-center'>
          <Image
            src='https://images.unsplash.com/photo-1582750433449-648ed127bb54?q=80&w=1887&auto=format&fit=crop'
            alt='Medical professional'
            fill
            className='object-cover'
            priority
          />
        </div>
        {/* Gradient overlay */}
        <div className='absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-primary/20 to-transparent p-8 text-center'>
          <h2 className='text-xl font-bold text-primary md:text-2xl'>
            Join Our Medical Community
          </h2>
          <p className='text-foreground/80'>
            Access advanced tools for medical professionals
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;