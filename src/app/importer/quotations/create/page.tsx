// src/app/importer/quotations/create/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  SendHorizontal,
  PlusCircle,
  MinusCircle,
  Search,
  Filter,
  ChevronDown,
  CheckCircle,
  XCircle,
  Edit,
  Trash,
  AlertCircle,
  InfoIcon,
  DollarSign,
  FileText,
  Package,
  Loader2,
  Calendar,
  Clock,
  User,
  Calculator
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { quotationService } from '@/services/api/quotations';
import { drugImporterRequestService } from '@/services/api/drugimporter-donation-requests';
import { DonationRequest, Patient, DonationRequestResponse, MedicinePrice, PrescribedMedicine, QuotationResponse } from '@/lib/types/drugImporter';
import { getDrugImporterId } from '../../../../../utils/storage-helper';


export default function CreateQuotationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get('requestId') ? Number(searchParams.get('requestId')) : null;
  
  // Get drug importer ID from JWT token
  const drugImporterId = getDrugImporterId(1);
  
  // State for donation request details
  const [donationRequest, setDonationRequest] = useState<DonationRequest | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  
  // Define the 'FormData' type
  type FormData = {
    requestId: number;
    drugImporterId: number;
    status: string;
    discount: number;
    validityDays: number;
    notes: string;
    medicinePrices: MedicinePrice[];
  };
  
  // State for form data with proper typing
  const [formData, setFormData] = useState<FormData>({
    requestId: requestId || 0,
    drugImporterId: drugImporterId,
    status: 'PENDING',
    discount: 0,
    validityDays: 30,
    notes: '',
    medicinePrices: []
  });
  
  // UI state
  const [loading, setLoading] = useState(requestId !== null);
  const [submitting, setSubmitting] = useState(false);
  const [medicineSearchTerm, setMedicineSearchTerm] = useState('');
  const [defaultPrice, setDefaultPrice] = useState(2.00); // Default price for bulk setting
  const [error, setError] = useState<string | null>(null);
  
  // Fetch donation request details when component mounts
  useEffect(() => {
    const fetchDonationRequest = async () => {
      if (!requestId) return;
      
      try {
        setLoading(true);
        setError(null);
        const response = await drugImporterRequestService.getDonationRequestById(requestId);
        
        if (response) {
          const data = response as DonationRequestResponse;
          setDonationRequest(data.donationRequest);
          setPatient(data.patient);
          
          // Map the medicines from the donation request to the quotation format
          const medicinePrices: MedicinePrice[] = data.donationRequest?.prescribedMedicines?.map((med: PrescribedMedicine) => ({
            medicineId: med.medicineId || med.id || 0, // Handle potential undefined values
            name: med.medicine,
            quantity: med.amount,
            price: 0 // Start with zero price that user will update
          })) || [];
          
          setFormData(prev => ({
            ...prev,
            requestId: requestId,
            medicinePrices
          }));
        }
      } catch (error) {
        console.error('Error fetching donation request:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load donation request details';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    if (requestId) {
      fetchDonationRequest();
    }
  }, [requestId]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'discount' || name === 'validityDays' ? Number(value) : value
    }));
  };
  
  // Handle medicine price changes
  const handlePriceChange = (medicineId: number, price: string) => {
    setFormData(prev => ({
      ...prev,
      medicinePrices: prev.medicinePrices.map(medicine => 
        medicine.medicineId === medicineId ? { ...medicine, price: Number(price) || 0 } : medicine
      )
    }));
  };
  
  // Set price for all medicines
  const handleApplyPriceToAll = () => {
    if (defaultPrice <= 0) {
      toast.error('Please enter a valid price greater than zero');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      medicinePrices: prev.medicinePrices.map(medicine => ({
        ...medicine,
        price: defaultPrice
      }))
    }));
    
    toast.success(`Applied price $${defaultPrice.toFixed(2)} to all medicines`);
  };
  
  // Handle removing medicine from quotation
  const handleRemoveMedicine = (medicineId: number) => {
    setFormData(prev => ({
      ...prev,
      medicinePrices: prev.medicinePrices.filter(m => m.medicineId !== medicineId)
    }));
  };
  
  // Calculate totals
  const calculateTotals = () => {
    if (!formData.medicinePrices || formData.medicinePrices.length === 0) {
      return { subtotal: 0, discount: 0, total: 0, itemCount: 0 };
    }
    
    const subtotal = formData.medicinePrices.reduce((sum, medicine) => sum + (medicine.price || 0), 0);
    const discount = formData.discount ? (subtotal * formData.discount) / 100 : 0;
    const total = subtotal - discount;
    
    return {
      subtotal,
      discount,
      total,
      itemCount: formData.medicinePrices.length
    };
  };
  
  const totals = calculateTotals();
  
  // Filter medicines based on search
  const filteredMedicines = formData.medicinePrices.filter(medicine => 
    medicine.name?.toLowerCase().includes(medicineSearchTerm.toLowerCase() || '')
  );
  
  // Validate form before submission
  const validateForm = (): boolean => {
    if (!formData.requestId) {
      toast.error('Request ID is required');
      return false;
    }
    
    // Validate medicine prices
    const hasInvalidPrices = formData.medicinePrices.some(m => m.price <= 0);
    if (hasInvalidPrices) {
      toast.error('All medicines must have a price greater than zero');
      return false;
    }
    
    if (formData.medicinePrices.length === 0) {
      toast.error('At least one medicine is required');
      return false;
    }
    
    return true;
  };
  
  // Handle saving as draft
  const handleSaveDraft = async () => {
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Prepare data for submission - format according to backend requirements
      const quotationData = {
        ...formData,
        drugImporterId,
        status: 'PENDING',
        // Format medicine prices to match API structure - remove extra fields
        medicinePrices: formData.medicinePrices.map(m => ({
          medicineId: m.medicineId,
          price: m.price
        }))
      };
      
      // Call API to create quotation
      const createdQuotation = await quotationService.createQuotation(quotationData, drugImporterId);
      
      if (createdQuotation) {
        toast.success('Quotation saved as draft successfully!');
        router.push('/importer/quotations');
      }
    } catch (error) {
      console.error('Error saving quotation draft:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save quotation draft';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle sending quotation
  const handleSendQuotation = async () => {
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Prepare data for submission
      const quotationData = {
        ...formData,
        drugImporterId,
        status: 'SEND',
        // Format medicine prices to match API structure - remove extra fields
        medicinePrices: formData.medicinePrices.map(m => ({
          medicineId: m.medicineId,
          price: m.price
        }))
      };
      
      // Call API to create quotation
      const createdQuotation = await quotationService.createQuotation(quotationData, drugImporterId) as QuotationResponse;
      
      if (createdQuotation && createdQuotation.id) {
        // Send the quotation
        await quotationService.sendQuotation(createdQuotation.id, drugImporterId);
        toast.success('Quotation created and sent successfully!');
        router.push('/importer/quotations');
      } else {
        throw new Error('Failed to create quotation: Invalid response');
      }
    } catch (error) {
      console.error('Error sending quotation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send quotation';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle back navigation
  const handleBack = () => {
    router.back();
  };
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-lg font-medium">Loading donation request details...</p>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error && !loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-md mx-auto p-6">
          <AlertCircle className="size-12 text-red-500" />
          <h2 className="text-xl font-semibold">Error Loading Request</h2>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={handleBack}
            className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
          >
            <ArrowLeft className="mr-2 size-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };
  
  return (
    <div className='flex flex-col gap-6'>
      {/* Header with back button and actions */}
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div className='flex items-center gap-2'>
          <button
            onClick={handleBack}
            className='inline-flex size-10 items-center justify-center rounded-md border bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700'
            style={{ borderRadius: 'var(--radius)' }}
          >
            <ArrowLeft className='size-5' />
          </button>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>
              Create New Quotation
            </h1>
            {donationRequest && (
              <p className='text-muted-foreground'>
                For Request #{donationRequest.requestId}
              </p>
            )}
          </div>
        </div>

        <div className='flex flex-wrap gap-2'>
          <button
            onClick={handleSaveDraft}
            disabled={submitting}
            className='inline-flex items-center justify-center whitespace-nowrap rounded-md border bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700'
            style={{ borderRadius: 'var(--radius)' }}
          >
            {submitting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className='mr-2 size-4' />
            )}
            Save as Draft
          </button>
          <button
            onClick={handleSendQuotation}
            disabled={submitting || totals.itemCount === 0}
            className='inline-flex items-center justify-center whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90'
            style={{ borderRadius: 'var(--radius)' }}
          >
            {submitting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <SendHorizontal className='mr-2 size-4' />
            )}
            Send Quotation
          </button>
        </div>
      </div>

      {/* Main content grid */}
      <div className='grid gap-6 md:grid-cols-3'>
        {/* Left column */}
        <div className='space-y-6 md:col-span-2'>
          {/* Client Info */}
          {patient && (
            <div
              className='overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-gray-800'
              style={{ borderRadius: 'var(--radius)' }}
            >
              <div className='border-b px-4 py-3'>
                <h3 className='font-medium'>Client Information</h3>
              </div>
              <div className='grid grid-cols-1 gap-4 p-4 md:grid-cols-2'>
                <div>
                  <p className='text-muted-foreground text-sm'>Name</p>
                  <p className='font-medium'>{`${patient.firstName} ${patient.lastName}`}</p>
                </div>
                <div>
                  <p className='text-muted-foreground text-sm'>Email</p>
                  <p className='font-medium'>{patient.email || 'N/A'}</p>
                </div>
                <div>
                  <p className='text-muted-foreground text-sm'>Phone</p>
                  <p className='font-medium'>{patient.phoneNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className='text-muted-foreground text-sm'>Request Date</p>
                  <p className='font-medium'>
                    {donationRequest && formatDate(donationRequest.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Donation Request Details */}
          {donationRequest && (
            <div
              className='overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-gray-800'
              style={{ borderRadius: 'var(--radius)' }}
            >
              <div className='border-b px-4 py-3'>
                <h3 className='font-medium'>Donation Request Details</h3>
              </div>
              <div className='p-4'>
                <p className='mb-2 font-medium'>Description:</p>
                <p className='text-muted-foreground mb-4'>
                  {donationRequest.description || 'No description provided.'}
                </p>
                
                {donationRequest.documents && donationRequest.documents.length > 0 && (
                  <div className='mt-4'>
                    <p className='font-medium mb-2'>Documents:</p>
                    <ul className='space-y-1 text-sm'>
                      {donationRequest.documents.map((doc, index) => (
                        <li key={index} className='flex items-center gap-2'>
                          <FileText className='text-muted-foreground size-4' />
                          <span>{doc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Medicines List */}
          <div
            className='overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-gray-800'
            style={{ borderRadius: 'var(--radius)' }}
          >
            <div className='flex items-center justify-between border-b px-4 py-3'>
              <h3 className='font-medium'>Medicines</h3>
              <div className='text-muted-foreground text-sm'>{formData.medicinePrices.length} items</div>
            </div>
            
            {/* Bulk Price Setting */}
            <div className='border-b p-4'>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex items-center gap-2'>
                  <div className='relative flex items-center'>
                    <span className='absolute left-3 text-gray-500'>$</span>
                    <input
                      type='number'
                      value={defaultPrice}
                      onChange={(e) => setDefaultPrice(parseFloat(e.target.value) || 0)}
                      step='0.01'
                      min='0'
                      className='w-24 rounded-md border px-8 py-2 text-right focus:outline-none focus:ring-1 focus:ring-primary'
                      style={{ borderRadius: 'var(--radius)' }}
                    />
                  </div>
                  <button
                    onClick={handleApplyPriceToAll}
                    className='inline-flex items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-secondary/90'
                    style={{ borderRadius: 'var(--radius)' }}
                  >
                    <Calculator className='mr-2 size-4' />
                    Apply Price to All
                  </button>
                </div>
                
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
                  <input
                    type='text'
                    placeholder='Search medicines...'
                    value={medicineSearchTerm}
                    onChange={(e) => setMedicineSearchTerm(e.target.value)}
                    className='w-full rounded-md border bg-white py-2 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-primary'
                    style={{ borderRadius: 'var(--radius)' }}
                  />
                </div>
              </div>
            </div>
            
            {/* Medicine table */}
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead className='bg-gray-50 dark:bg-gray-900/50'>
                  <tr>
                    <th className='px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400'>
                      Medicine Name
                    </th>
                    <th className='px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400'>
                      Quantity
                    </th>
                    <th className='px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400'>
                      Price ($) <span className='text-red-500'>*</span>
                    </th>
                    <th className='px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y'>
                  {filteredMedicines.length > 0 ? (
                    filteredMedicines.map((medicine) => (
                      <tr
                        key={medicine.medicineId}
                        className='border-b transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/20'
                      >
                        <td className='px-4 py-3 align-middle font-medium'>
                          {medicine.name || 'Unknown Medicine'}
                        </td>
                        <td className='px-4 py-3 text-center align-middle'>
                          {medicine.quantity || 0}
                        </td>
                        <td className='px-4 py-3 align-middle'>
                          <div className='flex items-center justify-center'>
                            <span className='mr-1 text-gray-500 dark:text-gray-400'>
                              $
                            </span>
                            <input
                              type='number'
                              value={medicine.price || ''}
                              onChange={(e) => handlePriceChange(medicine.medicineId, e.target.value)}
                              step='0.01'
                              min='0'
                              className={`w-24 rounded-md border px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-primary ${
                                medicine.price <= 0 ? 'border-red-300 bg-red-50' : ''
                              }`}
                              style={{ borderRadius: 'var(--radius)' }}
                              placeholder='0.00'
                            />
                          </div>
                        </td>
                        <td className='px-4 py-3 align-middle'>
                          <div className='flex items-center justify-center'>
                            <button
                              onClick={() => handleRemoveMedicine(medicine.medicineId)}
                              className='text-gray-500 hover:text-red-500'
                              title='Remove medicine'
                              type="button"
                            >
                              <Trash className='size-4' />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className='px-4 py-6 text-center text-muted-foreground'
                      >
                        <div className='flex flex-col items-center gap-2'>
                          <Package className='size-6' />
                          <p>No medicines found.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {formData.medicinePrices.some(m => m.price <= 0) && (
              <div className='p-4 border-t'>
                <div className='flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800'>
                  <AlertCircle className='mt-0.5 size-5 flex-shrink-0' />
                  <div>
                    <p className='font-medium'>All medicines must be priced</p>
                    <p className='text-sm'>
                      Please enter a price greater than zero for all medicines, or use the "Apply Price to All" button.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quotation Notes */}
          <div
            className='overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-gray-800'
            style={{ borderRadius: 'var(--radius)' }}
          >
            <div className='border-b px-4 py-3'>
              <h3 className='font-medium'>Quotation Notes</h3>
            </div>
            <div className='p-4'>
              <textarea
                name='notes'
                value={formData.notes || ''}
                onChange={handleInputChange}
                placeholder='Add any special notes, terms, or conditions for this quotation...'
                rows={4}
                className='w-full rounded-md border p-3 focus:outline-none focus:ring-1 focus:ring-primary'
                style={{ borderRadius: 'var(--radius)' }}
              ></textarea>
            </div>
          </div>
        </div>

        {/* Right column - Summary and Settings */}
        <div className='space-y-6'>
          {/* Quotation Settings */}
          <div
            className='overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-gray-800'
            style={{ borderRadius: 'var(--radius)' }}
          >
            <div className='border-b px-4 py-3'>
              <h3 className='font-medium'>Quotation Settings</h3>
            </div>
            <div className='space-y-4 p-4'>
              <div>
                <label htmlFor="validityDays" className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                  Validity (Days)
                </label>
                <div className='flex items-center mt-1'>
                  <Clock className='mr-2 size-4 text-muted-foreground' />
                  <input
                    id="validityDays"
                    type='number'
                    name='validityDays'
                    value={formData.validityDays || 30}
                    onChange={handleInputChange}
                    min='1'
                    max='90'
                    className='w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary'
                    style={{ borderRadius: 'var(--radius)' }}
                  />
                </div>
                <p className='mt-1 text-xs text-muted-foreground'>
                  Quotation will be valid until {new Date(Date.now() + (formData.validityDays || 30) * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <label htmlFor="discount" className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                  Discount (%)
                </label>
                <div className='flex items-center mt-1'>
                  <DollarSign className='mr-2 size-4 text-muted-foreground' />
                  <input
                    id="discount"
                    type='number'
                    name='discount'
                    value={formData.discount || 0}
                    onChange={handleInputChange}
                    min='0'
                    max='100'
                    className='w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary'
                    style={{ borderRadius: 'var(--radius)' }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Quotation Summary */}
          <div
            className='overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-gray-800'
            style={{ borderRadius: 'var(--radius)' }}
          >
            <div className='border-b px-4 py-3'>
              <h3 className='font-medium'>Quotation Summary</h3>
            </div>
            <div className='space-y-4 p-4'>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground'>Items:</span>
                <span className='font-medium'>{totals.itemCount}</span>
              </div>
              
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground'>Subtotal:</span>
                <span className='font-medium'>${totals.subtotal.toFixed(2)}</span>
              </div>
              
              {formData.discount > 0 && (
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground'>Discount ({formData.discount}%):</span>
                  <span className='font-medium text-green-600'>-${totals.discount.toFixed(2)}</span>
                </div>
              )}
              
              <div className='h-px bg-gray-200 dark:bg-gray-700'></div>
              
              <div className='flex items-center justify-between'>
                <span className='font-medium'>Total:</span>
                <span className='text-xl font-bold'>${totals.total.toFixed(2)}</span>
              </div>
            </div>
            
            // Continuation of the CreateQuotationPage component

            <div className='border-t p-4'>
              <button
                onClick={handleSendQuotation}
                disabled={submitting || totals.itemCount === 0 || formData.medicinePrices.some(m => m.price <= 0)}
                className={`w-full inline-flex items-center justify-center rounded-md px-4 py-2 font-medium text-white ${
                  submitting || totals.itemCount === 0 || formData.medicinePrices.some(m => m.price <= 0)
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90'
                }`}
                style={{ borderRadius: 'var(--radius)' }}
                type="button"
              >
                {submitting ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <SendHorizontal className='mr-2 size-4' />
                )}
                Send Quotation
              </button>
              
              {totals.itemCount === 0 && (
                <p className='mt-2 text-center text-xs text-red-500'>
                  No medicines added to the quotation.
                </p>
              )}
              
              {totals.itemCount > 0 && formData.medicinePrices.some(m => m.price <= 0) && (
                <p className='mt-2 text-center text-xs text-red-500'>
                  All medicines must have a price greater than zero.
                </p>
              )}
            </div>
          </div>
          
          {/* Help Card */}
          <div
            className='overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-gray-800'
            style={{ borderRadius: 'var(--radius)' }}
          >
            <div className='border-b px-4 py-3'>
              <h3 className='font-medium'>Help</h3>
            </div>
            <div className='p-4'>
              <ul className='space-y-3 text-sm'>
                <li className='flex items-start gap-2'>
                  <CheckCircle className='mt-0.5 size-4 shrink-0 text-green-500' />
                  <span>Use "Apply Price to All" to quickly set all prices</span>
                </li>
                <li className='flex items-start gap-2'>
                  <CheckCircle className='mt-0.5 size-4 shrink-0 text-green-500' />
                  <span>Apply discount if needed</span>
                </li>
                <li className='flex items-start gap-2'>
                  <CheckCircle className='mt-0.5 size-4 shrink-0 text-green-500' />
                  <span>Set validity period for the quotation</span>
                </li>
                <li className='flex items-start gap-2'>
                  <CheckCircle className='mt-0.5 size-4 shrink-0 text-green-500' />
                  <span>Add notes for special terms or conditions</span>
                </li>
              </ul>
              
              <div className='mt-4 rounded-md bg-blue-50 p-3 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'>
                <div className='flex'>
                  <InfoIcon className='mt-0.5 size-4 shrink-0' />
                  <div className='ml-2'>
                    <p className='text-sm'>
                      You can save as draft to edit later, or send immediately to the client.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getDrugImporterIdFromJWT() {
  throw new Error('Function not implemented.');
}
