// app/importer/profile/page.tsx
'use client';
import React, { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

import {
  FaUser,
  FaIdCard,
  FaGlobe,
  FaFileAlt,
  FaPhone,
  FaEnvelope,
  FaEdit,
  FaSave,
  FaTimesCircle,
  FaFileUpload,
  FaIndustry,
  FaShieldAlt,
  FaExclamationTriangle,
  FaSignOutAlt,
} from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import InputField from '@/components/forms/InputField';
import FileUploadField from '@/components/forms/FileUploadField';
import drugImporterService from '@/services/api/drug-importer';
import authService from '@/services/api/auth';
import { showToast } from '../../../../utils/toast-helper';

interface ProfileFormData {
  fullName: string;
  companyName: string;
  nic: string;
  email: string;
  phoneNumber: string;
  website: string;
  importerLicense: string;
  tradeLicenseNumber: string;
  businessType: string;
  vatNumber: string;
  taxIdentificationNumber: string;
  additionalInfo: string;
  importerLicenseFile: File | null;
  tradeLicenseFile: File | null;
}

// Form validation functions
const validateProfileForm = (data: ProfileFormData): Record<string, string> => {
  const errors: Record<string, string> = {};

  // Required fields validation
  if (!data.fullName.trim()) {
    errors.fullName = 'Full name is required';
  } else if (data.fullName.length < 3) {
    errors.fullName = 'Full name must be at least 3 characters';
  }

  if (!data.companyName.trim()) {
    errors.companyName = 'Company name is required';
  } else if (data.companyName.length < 3) {
    errors.companyName = 'Company name must be at least 3 characters';
  }

  if (!data.nic.trim()) {
    errors.nic = 'NIC is required';
  } else if (!/^[0-9]{9}[vVxX]$|^[0-9]{12}$/.test(data.nic)) {
    errors.nic = 'Invalid NIC format';
  }

  if (!data.phoneNumber.trim()) {
    errors.phoneNumber = 'Phone number is required';
  } else if (!/^(?:\+94|0)[0-9]{9}$/.test(data.phoneNumber.replace(/\s+/g, ''))) {
    errors.phoneNumber = 'Invalid phone number format (e.g., +94XXXXXXXXX or 0XXXXXXXXX)';
  }

  if (!data.importerLicense.trim()) {
    errors.importerLicense = 'Importer license number is required';
  }

  // Optional fields validation
  if (data.website && !data.website.trim().startsWith('http')) {
    errors.website = 'Website must be a valid URL starting with http:// or https://';
  }

  // VAT number format validation
  if (data.vatNumber && !/^VAT-\d{3}-\d{3}$/.test(data.vatNumber)) {
    errors.vatNumber = 'Invalid VAT number format (e.g., VAT-123-456)';
  }

  // Tax ID validation
  if (data.taxIdentificationNumber && !/^TIN-\d{3}-\d{3}-\d{3}$/.test(data.taxIdentificationNumber)) {
    errors.taxIdentificationNumber = 'Invalid Tax ID format (e.g., TIN-123-456-789)';
  }

  return errors;
};

// File validation function
const validateFileUpload = (file: File): string | null => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  const maxSizeInBytes = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return 'File type not allowed. Please upload a PDF, JPEG, or PNG file.';
  }

  if (file.size > maxSizeInBytes) {
    return 'File size exceeds 5MB limit. Please upload a smaller file.';
  }

  return null;
};

// Check if token exists
const checkAuthentication = (): boolean => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return !!token;
};

const DrugImporterProfilePage: React.FC = () => {
  // State to manage edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Profile information state
  const [profileData, setProfileData] = useState<ProfileFormData>({
    fullName: '',
    companyName: '',
    nic: '',
    email: '',
    phoneNumber: '',
    website: '',
    importerLicense: '',
    tradeLicenseNumber: '',
    businessType: '',
    vatNumber: '',
    taxIdentificationNumber: '',
    additionalInfo: '',
    importerLicenseFile: null,
    tradeLicenseFile: null,
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const router = useRouter();

  // Check authentication first
  useEffect(() => {
    if (!checkAuthentication()) {
      showToast.error('You must be logged in to view this page.');
      router.push('/login');
      return;
    }
    setAuthChecked(true);
  }, [router]);

  // Load profile data on component mount after auth check
  useEffect(() => {
    if (!authChecked) return;
    
    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // First check if token is valid
        const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
        const isValidToken = await authService.validateToken(token);
        
        if (!isValidToken) {
          // If token isn't valid, clear it and redirect to login
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          showToast.error('Your session has expired. Please log in again.');
          router.push('/login');
          return;
        }
        
        // If token is valid, fetch profile
        const response = await drugImporterService.getCurrentProfile();
        if (response && response.data) {
          setProfile(response.data);
          updateProfileFormData(response.data);
        }
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        
        // If error is due to token issues, handle separately
        if (err.response?.status === 401 || 
            err.response?.status === 500 && 
            err.response?.data?.message?.includes('Invalid or Expired Token')) {
            
          // Clear tokens as they're invalid
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          
          setError('Your session has expired. Please log in again.');
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        } else {
          setError('Failed to load profile. Please try again later.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [router, authChecked]);

  // Helper function to update form data from profile
  const updateProfileFormData = (profileData: any) => {
    setProfileData({
      fullName: profileData.name || '',
      companyName: profileData.companyName || profileData.name || '',
      nic: profileData.nic || '',
      email: profileData.email || '',
      phoneNumber: profileData.phone || profileData.phoneNumber || '',
      website: profileData.website || '',
      importerLicense: profileData.licenseNumber || '',
      tradeLicenseNumber: profileData.tradeLicenseNumber || '',
      businessType: profileData.businessType || '',
      vatNumber: profileData.vatNumber || '',
      taxIdentificationNumber: profileData.taxIdentificationNumber || '',
      additionalInfo: profileData.address || profileData.additionalInfo || '',
      importerLicenseFile: null,
      tradeLicenseFile: null,
    });
  };

  // Handle input changes during editing
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error for this field if it exists
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
    fileType: 'importerLicenseFile' | 'tradeLicenseFile'
  ) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      const errorMessage = validateFileUpload(file);
      
      if (errorMessage) {
        setFormErrors(prev => ({
          ...prev,
          [fileType]: errorMessage
        }));
        
        showToast.error(errorMessage);
        return;
      }
      
      // Clear any previous error for this file
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fileType];
        return newErrors;
      });
      
      setProfileData((prev) => ({
        ...prev,
        [fileType]: file,
      }));
    }
  };

  // Save profile changes
  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateProfileForm(profileData);
    setFormErrors(validationErrors);
    
    if (Object.keys(validationErrors).length === 0) {
      setIsSubmitting(true);
      setError(null);
      
      try {
        // Create FormData object to send to backend
        const formData = new FormData();
        
        // Add all text fields
        Object.entries(profileData).forEach(([key, value]) => {
          if (value !== null && typeof value !== 'object') {
            formData.append(key, value.toString());
          }
        });
        
        // Add file fields if they exist
        if (profileData.importerLicenseFile) {
          formData.append('importerLicenseFile', profileData.importerLicenseFile);
        }
        
        if (profileData.tradeLicenseFile) {
          formData.append('tradeLicenseFile', profileData.tradeLicenseFile);
        }
        
        // Update profile via API
        const response = await drugImporterService.updateProfile(formData);
        
        if (response && response.data) {
          showToast.success("Your profile has been updated successfully.");
          setProfile(response.data);
          setIsEditing(false);
        }
      } catch (err: any) {
        console.error('Error updating profile:', err);
        
        // If error is due to token issues, handle separately
        if (err.response?.status === 401 || 
            err.response?.status === 500 && 
            err.response?.data?.message?.includes('Invalid or Expired Token')) {
            
          setError('Your session has expired. Please log in again.');
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        } else {
          setError(err?.message || 'Failed to update profile. Please try again.');
        }
      } finally {
        setIsSubmitting(false);
      }
    } else {
      showToast.error("Please check the form for errors and try again.");
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    if (profile) {
      // Reset form to profile values
      updateProfileFormData(profile);
    }
    
    setFormErrors({});
    setIsEditing(false);
  };
  
  // Handle account deactivation
  const handleDeactivateAccount = async () => {
    const confirmDeactivate = window.confirm(
      'Are you sure you want to deactivate your account? This action will:\n' +
      '- Suspend your active import licenses\n' +
      '- Remove access to the platform\n' +
      '- Permanently delete your profile data\n\n' +
      "Type 'DEACTIVATE' to confirm:"
    );

    if (confirmDeactivate) {
      const userConfirmation = window.prompt(
        "Please type 'DEACTIVATE' to confirm account deactivation:"
      );

      if (userConfirmation === 'DEACTIVATE') {
        setIsSubmitting(true);
        try {
          // Call the API to delete the account
          await drugImporterService.deleteAccount();
          
          // Clear user data
          localStorage.clear();
          sessionStorage.clear();
          
          // Show success message
          showToast.success("Your account has been successfully deactivated.");
          
          // Redirect to deactivation confirmation page
          router.push('/account/deactivated');
        } catch (err: any) {
          setError(err?.message || 'Failed to deactivate account. Please try again.');
        } finally {
          setIsSubmitting(false);
        }
      } else {
        showToast.info("Account deactivation cancelled.");
      }
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    // Call auth service to log out
    authService.logout();
    
    // Redirect to login page
    router.push('/login');
  };

  // Render read-only field
  const renderReadOnlyField = (
    label: string,
    value: string,
    Icon: React.ElementType
  ) => {
    return (
      <div className='space-y-1'>
        <label className='text-foreground/80 text-xs font-medium'>
          {label}
        </label>
        <div className='flex items-center gap-2'>
          <Icon className='text-foreground/40 size-3.5' />
          <p className='text-sm'>{value || 'Not provided'}</p>
        </div>
      </div>
    );
  };

  // Loading skeleton for profile
  const renderSkeletonProfile = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-28" />
        </div>
        <Separator />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-full" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-full" />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  };

  // If auth check fails, don't render anything - we're redirecting to login
  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='relative flex h-screen w-full'>
      {/* Profile Section - Full Width */}
      <div className='flex w-full items-center justify-center p-3 sm:p-5'>
        <Card className='flex h-[95vh] w-full max-w-4xl flex-col overflow-y-auto border-sidebar-border p-4 shadow-lg'>
          {/* Profile header */}
          <div className='mb-4 flex items-center justify-between'>
            <div>
              <h1 className='bg-gradient-to-r from-primary to-secondary bg-clip-text text-xl font-bold text-transparent sm:text-2xl'>
                Drug Importer Profile
              </h1>
              <p className='text-foreground/70 text-sm'>
                Manage your professional information
              </p>
            </div>

            {/* Logout Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2 text-destructive"
              disabled={isSubmitting}
            >
              <FaSignOutAlt className="size-4" />
              <span>Logout</span>
            </Button>
          </div>

          

          {/* Edit/Save Toggle - only show when profile is loaded */}
          {!isLoading && profile && (
            <div className='mb-4 flex justify-end'>
              {!isEditing ? (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setIsEditing(true)}
                  className='flex items-center gap-2'
                  disabled={isLoading || isSubmitting}
                >
                  <FaEdit className='size-4' /> Edit Profile
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleCancelEdit}
                    className='text-destructive flex items-center gap-2'
                    disabled={isLoading || isSubmitting}
                  >
                    <FaTimesCircle className='size-4' /> Cancel
                  </Button>
                  <Button
                    size='sm'
                    onClick={handleSaveProfile}
                    className='flex items-center gap-2'
                    disabled={isLoading || isSubmitting}
                  >
                    <FaSave className='size-4' /> {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className='flex grow flex-col'>
              {renderSkeletonProfile()}
            </div>
          )}

          {/* Profile Form */}
          {!isLoading && (profile || isEditing) && (
            <form className='flex grow flex-col'>
              <div className='grid grow grid-cols-1 gap-3'>
                {/* Personal and Company Details Grid */}
                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3'>
                  {isEditing ? (
                    <>
                      <InputField
                        id="fullName"
                        name="fullName"
                        label="Full Name"
                        value={profileData.fullName}
                        onChange={handleInputChange}
                        icon={FaUser}
                        placeholder="Your full name"
                        error={formErrors.fullName}
                        required
                      />

                      <InputField
                        id="companyName"
                        name="companyName"
                        label="Company Name"
                        value={profileData.companyName}
                        onChange={handleInputChange}
                        icon={FaIndustry}
                        placeholder="Your company name"
                        error={formErrors.companyName}
                        required
                      />

                      <InputField
                        id="nic"
                        name="nic"
                        label="NIC"
                        value={profileData.nic}
                        onChange={handleInputChange}
                        icon={FaIdCard}
                        placeholder="123456789X"
                        error={formErrors.nic}
                        required
                      />

                      <div className='space-y-1'>
                        <label className='text-foreground/80 text-xs font-medium'>
                          Email
                        </label>
                        <div className='flex items-center gap-2'>
                          <FaEnvelope className='text-foreground/40 size-3.5' />
                          <p className='text-sm'>{profileData.email}</p>
                        </div>
                      </div>

                      <InputField
                        id="phoneNumber"
                        name="phoneNumber"
                        label="Phone Number"
                        value={profileData.phoneNumber}
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
                        value={profileData.website || ''}
                        type="url"
                        onChange={handleInputChange}
                        icon={FaGlobe}
                        placeholder="https://yourdomain.com"
                        error={formErrors.website}
                      />
                    </>
                  ) : (
                    <>
                      {renderReadOnlyField('Full Name', profileData.fullName, FaUser)}
                      {renderReadOnlyField('Company Name', profileData.companyName, FaIndustry)}
                      {renderReadOnlyField('NIC', profileData.nic, FaIdCard)}
                      {renderReadOnlyField('Email', profileData.email, FaEnvelope)}
                      {renderReadOnlyField('Phone Number', profileData.phoneNumber, FaPhone)}
                      {renderReadOnlyField('Website', profileData.website || '', FaGlobe)}
                    </>
                  )}
                </div>

                {/* Business and License Details */}
                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3'>
                  {isEditing ? (
                    <>
                      <InputField
                        id="importerLicense"
                        name="importerLicense"
                        label="Importer License"
                        value={profileData.importerLicense}
                        onChange={handleInputChange}
                        icon={FaFileAlt}
                        placeholder="IMP-2023-5678"
                        error={formErrors.importerLicense}
                        required
                      />

                      <InputField
                        id="tradeLicenseNumber"
                        name="tradeLicenseNumber"
                        label="Trade License"
                        value={profileData.tradeLicenseNumber || ''}
                        onChange={handleInputChange}
                        icon={FaFileAlt}
                        placeholder="TL-2023-9876"
                        error={formErrors.tradeLicenseNumber}
                      />

                      <InputField
                        id="businessType"
                        name="businessType"
                        label="Business Type"
                        value={profileData.businessType || ''}
                        onChange={handleInputChange}
                        icon={FaIndustry}
                        placeholder="Pharmaceutical Imports"
                        error={formErrors.businessType}
                      />

                      <InputField
                        id="vatNumber"
                        name="vatNumber"
                        label="VAT Number"
                        value={profileData.vatNumber || ''}
                        onChange={handleInputChange}
                        icon={FaFileAlt}
                        placeholder="VAT-456-789"
                        error={formErrors.vatNumber}
                      />

                      <InputField
                        id="taxIdentificationNumber"
                        name="taxIdentificationNumber"
                        label="Tax ID"
                        value={profileData.taxIdentificationNumber || ''}
                        onChange={handleInputChange}
                        icon={FaFileAlt}
                        placeholder="TIN-123-456-789"
                        error={formErrors.taxIdentificationNumber}
                      />
                    </>
                  ) : (
                    <>
                      {renderReadOnlyField('Importer License', profileData.importerLicense, FaFileAlt)}
                      {renderReadOnlyField('Trade License', profileData.tradeLicenseNumber || '', FaFileAlt)}
                      {renderReadOnlyField('Business Type', profileData.businessType || '', FaIndustry)}
                      {renderReadOnlyField('VAT Number', profileData.vatNumber || '', FaFileAlt)}
                      {renderReadOnlyField('Tax ID', profileData.taxIdentificationNumber || '', FaFileAlt)}
                    </>
                  )}
                </div>

                {/* Additional Information */}
                <div className='space-y-1'>
                  <label className='text-foreground/80 text-xs font-medium'>
                    Additional Information
                  </label>
                  {isEditing ? (
                    <Textarea
                      name='additionalInfo'
                      value={profileData.additionalInfo || ''}
                      onChange={handleInputChange}
                      className='h-16 min-h-[60px] resize-none bg-background text-sm focus:border-primary'
                      placeholder='Additional details about your import business'
                    />
                  ) : (
                    <p className='text-sm'>{profileData.additionalInfo || 'No additional information provided.'}</p>
                  )}
                </div>

                {/* File Upload Section */}
                {isEditing && (
                  <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                    <FileUploadField
                      id="importerLicenseFile"
                      name="importerLicenseFile"
                      label="Importer License Proof"
                      file={profileData.importerLicenseFile}
                      onChange={(e) => handleFileChange(e, 'importerLicenseFile')}
                      icon={FaFileUpload}
                      placeholder="Upload Importer License"
                      error={formErrors.importerLicenseFile}
                    />

                    <FileUploadField
                      id="tradeLicenseFile"
                      name="tradeLicenseFile"
                      label="Trade License Proof"
                      file={profileData.tradeLicenseFile}
                      onChange={(e) => handleFileChange(e, 'tradeLicenseFile')}
                      icon={FaFileUpload}
                      placeholder="Upload Trade License"
                      error={formErrors.tradeLicenseFile}
                    />
                  </div>
                )}
              </div>

              {/* Account Actions */}
              <div className='mt-3 space-y-2 pt-2'>
                {/* Account Status and Verification */}
                <div className='flex items-center justify-between rounded-lg border border-sidebar-border bg-background p-3'>
                  <div className='flex items-center space-x-2'>
                    <FaShieldAlt className='text-primary' />
                    <div>
                      <h3 className='text-sm font-medium'>Account Status</h3>
                      <p className='text-foreground/70 text-xs'>
                        {profile?.enabled 
                          ? 'Verified Drug Importer' 
                          : 'Pending Verification'}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <span className={`text-xs font-medium ${profile?.enabled ? 'text-green-600' : 'text-amber-600'}`}>
                      {profile?.enabled ? 'Active' : 'Pending'}
                    </span>
                    <div className={`h-2 w-2 rounded-full ${profile?.enabled ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                  </div>
                </div>

                {/* Account Management Options */}
                <div className='grid grid-cols-2 gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      router.push('/importer/contact-preferences');
                    }}
                    className='w-full'
                    disabled={isSubmitting}
                  >
                    Contact Preferences
                  </Button>

                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      router.push('/importer/security-settings');
                    }}
                    className='w-full'
                    disabled={isSubmitting}
                  >
                    Security Settings
                  </Button>
                </div>

                {/* Deactivate Account Option */}
                <Button
                  variant='destructive'
                  className='mt-2 w-full'
                  onClick={handleDeactivateAccount}
                  disabled={isLoading || isSubmitting}
                >
                  Deactivate Account
                </Button>

                {/* Footer Links */}
                <div className='mt-4 text-center'>
                  <div className='text-foreground/70 flex justify-center space-x-4 text-xs'>
                    <Link
                      href='/privacy-policy'
                      className='transition-colors hover:text-primary'
                    >
                      Privacy Policy
                    </Link>
                    <Link
                      href='/terms-of-service'
                      className='transition-colors hover:text-primary'
                    >
                      Terms of Service
                    </Link>
                    <Link
                      href='/support'
                      className='transition-colors hover:text-primary'
                    >
                      Support
                    </Link>
                  </div>
                  <p className='text-foreground/50 mt-2 text-xs'>
                    © {new Date().getFullYear()} Drug Importer Portal. All rights
                    reserved.
                  </p>
                </div>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DrugImporterProfilePage;