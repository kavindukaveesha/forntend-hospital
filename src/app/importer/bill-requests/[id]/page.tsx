/* eslint-disable tailwindcss/no-custom-classname */
'use client';

import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  User,
  FileText,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Send,
  Mail,
  Download,
  Printer,
  ChevronDown,
  ShieldAlert,
  Eye,
  Filter,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { drugImporterRequestService } from '@/services/api/drugimporter-donation-requests';

// Define TypeScript interfaces
interface Medicine {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  status: 'Available' | 'Low Stock' | 'Out of Stock';
}

type RequestType = 'clientRequest' | 'donorRequest';
type RequestStatus = 'Pending' | 'Quotation Sent' | 'Accepted' | 'Declined';

interface BillRequest {
  id: string;
  requestId: number; // Original requestId from the API
  requestDate: string;
  clientName: string;
  patientId: number; // Added patientId for reference
  email: string | null;
  phone: string | null;
  type: RequestType;
  description: string;
  items: number;
  status: RequestStatus;
  notes?: string | null;
  attachments?: string[] | null;
  medicinesList: Medicine[];
}

export default function BillRequestDetail() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.id as string;

  // State for request data
  const [requestData, setRequestData] = useState<BillRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState(false);

  // State for medicine list search
  const [searchMedicine, setSearchMedicine] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Fetch request data on mount
  useEffect(() => {
    const fetchRequestData = async () => {
      try {
        setLoading(true);
        const response = await drugImporterRequestService.getDonationRequestById(Number(requestId));
        
        // Map the medicines
        const mappedMedicines: Medicine[] = (response?.donationRequest?.prescribedMedicines || [])?.map((med: any, index: number) => ({
          id: index + 1,
          name: med.medicine,
          category: 'Unknown', // Placeholder; adjust if category data is available
          quantity: med.amount,
          unit: 'Units', // Placeholder; adjust based on API or backend data
          status: med.amount > 10 ? 'Available' : med.amount > 0 ? 'Low Stock' : 'Out of Stock',
        }));

        // Map the request data
        const mappedRequest: BillRequest = {
          id: response?.donationRequest ? `DR-${response.donationRequest.requestId}` : '',
          requestId: response?.donationRequest ? response.donationRequest.requestId : '',
          patientId: response?.donationRequest ? response.donationRequest.patientId : '',
          requestDate: response?.donationRequest ? response.donationRequest.createdAt.split('T')[0] : '',
          clientName: response?.patient ? `${response.patient.firstName} ${response.patient.lastName}` : '',
          email: response?.patient ? response.patient.email || null : null,
          phone: response?.patient ? response.patient.phoneNumber || null : null,
          type: 'clientRequest',
          description: response?.donationRequest ? response.donationRequest.description : '',
          items: response?.donationRequest ? response.donationRequest.prescribedMedicines.length : 0,
          status: response?.requestStatus?.status === 'PENDING' ? 'Pending' :
                 response?.requestStatus?.status === 'ACCEPTED' ? 'Accepted' :
                 response?.requestStatus?.status === 'REJECT' ? 'Declined' :
                 response?.requestStatus?.status === 'SEND' ? 'Quotation Sent' : 'Pending',
          notes: null,
          attachments: response?.donationRequest?.documents?.length ? response.donationRequest.documents : null,
          medicinesList: mappedMedicines
        };

        setRequestData(mappedRequest);
      } catch (err) {
        setError('Failed to load donation request details. Please try again.');
        toast.error('Failed to load donation request details.');
      } finally {
        setLoading(false);
      }
    };

    fetchRequestData();
  }, [requestId]);

  // Handle back navigation
  const handleBack = (): void => {
    router.back();
  };

  // Handle accept action - redirect to quotation creation
  const handleAcceptRequest = async () => {
    if (!requestData) return;
    
    try {
      setProcessingAction(true);
      // Update the request status to ACCEPTED
      await drugImporterRequestService.updateRequestStatus(requestData.requestId, 'ACCEPTED');
      
      toast.success('Request accepted. Redirecting to create quotation...');
      
      // Navigate to quotation creation page with request details
      router.push(`/importer/quotations/create/page?requestId=${requestData.requestId}`);
    } catch (err) {
      toast.error('Failed to accept request.');
      setProcessingAction(false);
    }
  };

  // Handle decline action
  const handleDeclineRequest = async () => {
    if (!requestData) return;
    
    try {
      setProcessingAction(true);
      // Update the request status to REJECT
      await drugImporterRequestService.updateRequestStatus(requestData.requestId, 'REJECT');
      
      // Update local state
      setRequestData(prev => prev ? {...prev, status: 'Declined'} : null);
      toast.success('Request declined successfully.');
    } catch (err) {
      toast.error('Failed to decline request.');
    } finally {
      setProcessingAction(false);
    }
  };

  // Get status color
  const getStatusColor = (status: RequestStatus): string => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-500';
      case 'Quotation Sent':
        return 'bg-secondary';
      case 'Accepted':
        return 'bg-green-500';
      case 'Declined':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Get status icon
  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case 'Pending':
        return <Clock className='size-5' />;
      case 'Quotation Sent':
        return <FileText className='size-5' />;
      case 'Accepted':
        return <CheckCircle className='size-5' />;
      case 'Declined':
        return <XCircle className='size-5' />;
      default:
        return <AlertCircle className='size-5' />;
    }
  };

  // Get medicine status color
  const getMedicineStatusColor = (status: Medicine['status']): string => {
    switch (status) {
      case 'Available':
        return 'text-green-500';
      case 'Low Stock':
        return 'text-amber-500';
      case 'Out of Stock':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  // Filter medicines based on search and filters
  const filteredMedicines = requestData?.medicinesList.filter((medicine: Medicine) => {
    const matchesSearch = medicine.name
      .toLowerCase()
      .includes(searchMedicine.toLowerCase());
    const matchesCategory =
      categoryFilter === 'All' || medicine.category === categoryFilter;
    const matchesStatus =
      statusFilter === 'All' || medicine.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  }) || [];

  // Get unique categories for filter dropdown
  const categories: string[] = [
    'All',
    ...Array.from(new Set(requestData?.medicinesList.map((med) => med.category) || [])),
  ];

  // Loading state
  if (loading) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center p-4'>
        <div className='loader mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-t-4 border-gray-200 border-t-primary'></div>
        <p className='text-muted-foreground'>Loading donation request details...</p>
      </div>
    );
  }

  // Error state
  if (error || !requestData) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center p-4'>
        <AlertCircle className='mb-4 size-16 text-red-500' />
        <h1 className='mb-2 text-2xl font-bold'>Request Not Found</h1>
        <p className='mb-4 text-gray-500'>
          The donation request you're looking for doesn't exist or has been removed.
        </p>
        <Link href='/importer/bill-requests'>
          <button className='inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90'>
            <ArrowLeft className='mr-2 size-4' />
            Back to Donation Requests
          </button>
        </Link>
      </div>
    );
  }

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
              {requestData.id}
            </h1>
            <p className='text-muted-foreground'>
              Client Donation Request
            </p>
          </div>
        </div>

        <div className='flex flex-wrap gap-2'>
          <button
            className='inline-flex items-center justify-center whitespace-nowrap rounded-md border bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700'
            style={{ borderRadius: 'var(--radius)' }}
          >
            <Printer className='mr-2 size-4' />
            Print
          </button>
          <button
            className='inline-flex items-center justify-center whitespace-nowrap rounded-md border bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700'
            style={{ borderRadius: 'var(--radius)' }}
          >
            <Download className='mr-2 size-4' />
            Export
          </button>
        </div>
      </div>

      {/* Status badge */}
      <div
        className={`inline-flex items-center gap-2 rounded-full px-4 py-1 text-sm font-medium ${getStatusColor(requestData.status)} w-fit text-white`}
      >
        {getStatusIcon(requestData.status)}
        <span>{requestData.status}</span>
      </div>

      {/* Main content grid */}
      <div className='grid gap-6 md:grid-cols-3'>
        {/* Request details - left column */}
        <div className='space-y-6 md:col-span-1'>
          {/* Client Info Card */}
          <div
            className='overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-gray-800'
            style={{ borderRadius: 'var(--radius)' }}
          >
            <div className='border-b px-4 py-3'>
              <h3 className='font-medium'>Client Information</h3>
            </div>
            <div className='space-y-4 p-4'>
              <div className='flex items-start gap-3'>
                <User className='text-muted-foreground mt-0.5 size-5' />
                <div>
                  <div className='font-medium'>{requestData.clientName}</div>
                  {requestData.email ? (
                    <div className='text-muted-foreground text-sm'>{requestData.email}</div>
                  ) : (
                    <div className='text-muted-foreground text-sm italic'>Email not available</div>
                  )}
                  {requestData.phone ? (
                    <div className='text-muted-foreground text-sm'>{requestData.phone}</div>
                  ) : (
                    <div className='text-muted-foreground text-sm italic'>Phone not available</div>
                  )}
                </div>
              </div>

              <div className='flex items-start gap-3'>
                <Calendar className='text-muted-foreground mt-0.5 size-5' />
                <div>
                  <div className='text-muted-foreground text-sm'>Request Date</div>
                  <div className='font-medium'>
                    {new Date(requestData.requestDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              <div className='flex items-start gap-3'>
                <Package className='text-muted-foreground mt-0.5 size-5' />
                <div>
                  <div className='text-muted-foreground text-sm'>Total Items</div>
                  <div className='font-medium'>{requestData.items}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Attachments Card */}
          {requestData.attachments && requestData.attachments.length > 0 && (
            <div
              className='overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-gray-800'
              style={{ borderRadius: 'var(--radius)' }}
            >
              <div className='border-b px-4 py-3'>
                <h3 className='font-medium'>Attachments</h3>
              </div>
              <div className='p-4'>
                <ul className='space-y-2'>
                  {requestData.attachments.map((file, index) => (
                    <li
                      key={index}
                      className='flex items-center justify-between rounded-md p-2 hover:bg-gray-50 dark:hover:bg-gray-700'
                    >
                      <div className='flex items-center gap-2'>
                        <FileText className='text-muted-foreground size-4' />
                        <span className='text-sm'>{file}</span>
                      </div>
                      <button className='text-sm font-medium text-blue-500 hover:text-blue-700'>
                        Download
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Notes Card */}
          {requestData.notes && (
            <div
              className='overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-gray-800'
              style={{ borderRadius: 'var(--radius)' }}
            >
              <div className='border-b px-4 py-3'>
                <h3 className='font-medium'>Notes</h3>
              </div>
              <div className='p-4'>
                <p className='text-muted-foreground text-sm'>{requestData.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Medicine List - right column (wider) */}
        <div className='space-y-6 md:col-span-2'>
          {/* Description Card */}
          <div
            className='overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-gray-800'
            style={{ borderRadius: 'var(--radius)' }}
          >
            <div className='border-b px-4 py-3'>
              <h3 className='font-medium'>Description</h3>
            </div>
            <div className='p-4'>
              <p className='text-muted-foreground text-sm'>{requestData.description}</p>
            </div>
          </div>

          {/* Medicine List Card */}
          <div
            className='overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-gray-800'
            style={{ borderRadius: 'var(--radius)' }}
          >
            <div className='flex items-center justify-between border-b px-4 py-3'>
              <h3 className='font-medium'>Medicine List</h3>
              <div className='text-muted-foreground text-sm'>{requestData.medicinesList.length} items</div>
            </div>

            {/* Search and filters */}
            <div className='flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between'>
              <div className='relative w-full sm:w-64'>
                <Search className='text-muted-foreground absolute left-2.5 top-2.5 size-4' />
                <input
                  type='text'
                  placeholder='Search medicines...'
                  className='w-full rounded-md border bg-white py-2 pl-8 pr-4 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800'
                  value={searchMedicine}
                  onChange={(e) => setSearchMedicine(e.target.value)}
                  style={{ borderRadius: 'var(--radius)' }}
                />
              </div>

              <div className='flex gap-2'>
                {/* Category filter */}
                <div className='relative'>
                  <select
                    className='appearance-none rounded-md border bg-white py-2 pl-4 pr-8 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800'
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    style={{ borderRadius: 'var(--radius)' }}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className='text-muted-foreground pointer-events-none absolute right-2.5 top-2.5 size-4' />
                </div>

                {/* Status filter */}
                <div className='relative'>
                  <select
                    className='appearance-none rounded-md border bg-white py-2 pl-4 pr-8 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800'
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ borderRadius: 'var(--radius)' }}
                  >
                    <option value='All'>All Statuses</option>
                    <option value='Available'>Available</option>
                    <option value='Low Stock'>Low Stock</option>
                    <option value='Out of Stock'>Out of Stock</option>
                  </select>
                  <Filter className='text-muted-foreground pointer-events-none absolute right-2.5 top-2.5 size-4' />
                </div>
              </div>
            </div>

            {/* Medicines table */}
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead className='bg-gray-50 dark:bg-gray-900/50'>
                  <tr>
                    <th className='px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400'>
                      Name
                    </th>
                    <th className='px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400'>
                      Category
                    </th>
                    <th className='px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400'>
                      Quantity
                    </th>
                    <th className='px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400'>
                      Unit
                    </th>
                    <th className='px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400'>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y'>
                  {filteredMedicines.length > 0 ? (
                    filteredMedicines.map((medicine: Medicine) => (
                      <tr
                        key={medicine.id}
                        className='border-b transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/20'
                      >
                        <td className='px-4 py-3 align-middle font-medium'>
                          {medicine.name}
                        </td>
                        <td className='text-muted-foreground px-4 py-3 align-middle'>
                          {medicine.category}
                        </td>
                        <td className='px-4 py-3 text-right align-middle'>
                          {medicine.quantity}
                        </td>
                        <td className='text-muted-foreground px-4 py-3 align-middle'>
                          {medicine.unit}
                        </td>
                        <td className='px-4 py-3 align-middle'>
                          <span
                            className={`font-medium ${getMedicineStatusColor(medicine.status)}`}
                          >
                            {medicine.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className='text-muted-foreground px-4 py-6 text-center'
                      >
                        <div className='flex flex-col items-center gap-2'>
                          <Mail className='size-6' />
                          <p>No medicines found matching your filters.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action buttons card */}
          <div
            className='rounded-lg border bg-white p-4 shadow-sm dark:bg-gray-800'
            style={{ borderRadius: 'var(--radius)' }}
          >
            <div className='space-y-4'>
              <h3 className='font-medium'>Actions</h3>

              <div className='flex flex-wrap gap-3'>
                {requestData.status === 'Pending' && (
                  <>
                    <button
                      className='inline-flex items-center justify-center whitespace-nowrap rounded-md bg-green-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green-500'
                      style={{ borderRadius: 'var(--radius)' }}
                      onClick={handleAcceptRequest}
                      disabled={processingAction}
                    >
                      {processingAction ? (
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-2 border-white border-t-transparent"></div>
                      ) : (
                        <CheckCircle className='mr-2 size-4' />
                      )}
                      Accept & Create Quotation
                    </button>
                    <button
                      className='inline-flex items-center justify-center whitespace-nowrap rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500'
                      style={{ borderRadius: 'var(--radius)' }}
                      onClick={handleDeclineRequest}
                      disabled={processingAction}
                    >
                      {processingAction ? (
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-2 border-white border-t-transparent"></div>
                      ) : (
                        <XCircle className='mr-2 size-4' />
                      )}
                      Decline Request
                    </button>
                  </>
                )}

                {requestData.status === 'Accepted' && (
                  <Link href={`/importer/quotations/create?requestId=${requestData.requestId}`}>
                    <button
                      className='inline-flex items-center justify-center whitespace-nowrap rounded-md bg-secondary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-secondary'
                      style={{ borderRadius: 'var(--radius)' }}
                    >
                      <Send className='mr-2 size-4' />
                      Create Quotation
                    </button>
                  </Link>
                )}

                {requestData.status === 'Quotation Sent' && (
                  <Link href={`/importer/quotations/${requestData.requestId}`}>
                    <button
                      className='inline-flex items-center justify-center whitespace-nowrap rounded-md bg-secondary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-secondary'
                      style={{ borderRadius: 'var(--radius)' }}
                    >
                      <Eye className='mr-2 size-4' />
                      View Quotation
                    </button>
                  </Link>
                )}
              </div>

              {/* Warning for declined requests */}
              {requestData.status === 'Declined' && (
                <div className='flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200'>
                  <ShieldAlert className='mt-0.5 size-5 flex-shrink-0' />
                  <div>
                    <p className='font-medium'>This request has been declined</p>
                    <p className='text-sm'>
                      Once a request is declined, it cannot be reopened. You would need to create a new request if needed.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}