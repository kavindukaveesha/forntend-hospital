// src/app/importer/quotations/page.tsx
'use client';

import { SetStateAction, useState, useEffect } from 'react';
import {
  Search,
  Filter,
  FileText,
  Download,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
  PlusCircle,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { quotationService } from '@/services/api/quotations';
import { QuotationDTO, QuotationStatusEnum } from '@/lib/types/drugImporter';

export default function QuotationsPage() {
  // State for handling pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  // State for sorting
  const [sortField, setSortField] = useState('createdDate');
  const [sortDirection, setSortDirection] = useState('desc');

  // State for quotations data
  const [quotations, setQuotations] = useState<QuotationDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  // Fetch quotations on mount
  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        setLoading(true);
        // In a real app, you'd get the drugImporterId from the user context/authentication
        // For now, we'll use a placeholder value
        const drugImporterId = 1; // This should come from auth context
        const data = await quotationService.getAllQuotations(drugImporterId);
        setQuotations(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching quotations:', err);
        setError('Failed to load quotations. Please try again later.');
        toast.error('Failed to load quotations');
      } finally {
        setLoading(false);
      }
    };

    fetchQuotations();
  }, []);

  // Handle search input
  const handleSearch = (e: { target: { value: SetStateAction<string> } }) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle status filter
  const handleStatusFilter = (status: SetStateAction<string>) => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Handle date filter
  const handleDateFilter = (e: {
    target: { value: SetStateAction<string> };
  }) => {
    setDateFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when filtering by date
  };

  // Handle sort
  const handleSort = (field: SetStateAction<string>) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Map API status to display status
  const mapApiStatusToDisplay = (statusEnum: QuotationStatusEnum | string | undefined) => {
    if (!statusEnum) return 'Draft';
    
    switch (statusEnum) {
      case QuotationStatusEnum.DRAFT:
      case 'DRAFT':
        return 'Draft';
      case QuotationStatusEnum.SENT:
      case 'SENT':
        return 'Sent';
      case QuotationStatusEnum.ACCEPTED:
      case 'ACCEPTED':
        return 'Accepted';
      case QuotationStatusEnum.REJECTED:
      case 'REJECTED':
        return 'Rejected';
      default:
        return 'Draft';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-500';
      case 'Sent':
        return 'bg-blue-500';
      case 'Accepted':
        return 'bg-green-500';
      case 'Rejected':
        return 'bg-red-500';
      case 'Expired':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Draft':
        return <FileText className='size-4' />;
      case 'Sent':
        return <Clock className='size-4' />;
      case 'Accepted':
        return <CheckCircle2 className='size-4' />;
      case 'Rejected':
        return <XCircle className='size-4' />;
      case 'Expired':
        return <AlertCircle className='size-4' />;
      default:
        return <FileText className='size-4' />;
    }
  };

  // Safe access to status, handling potential nulls or undefined
  const getQuotationStatus = (quotation: QuotationDTO): QuotationStatusEnum | string | undefined => {
    return quotation?.quotationStatus?.status;
  };

  // Filter and sort the data
  const filteredData = quotations
    .filter((quotation) => {
      const quotationId = `QT-${quotation.id}`;
      const requestId = `BR-${quotation.requestId}`;
      
      // We don't have client name in the DTO directly, so we'll search by ID
      const matchesSearch =
        quotationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        requestId.toLowerCase().includes(searchTerm.toLowerCase());

      const status = getQuotationStatus(quotation);
      const displayStatus = mapApiStatusToDisplay(status);
      const matchesStatus =
        statusFilter === 'All' || displayStatus === statusFilter;

      // Format dates for comparison
      const quotationDate = quotation.createdDate ? new Date(quotation.createdDate).toISOString().split('T')[0] : '';
      const matchesDate = !dateFilter || quotationDate === dateFilter;

      return matchesSearch && matchesStatus && matchesDate;
    })
    .sort((a, b) => {
      if (sortField === 'id' || sortField === 'requestId') {
        // Sort by number
        return sortDirection === 'asc'
          ? (a[sortField] || 0) - (b[sortField] || 0)
          : (b[sortField] || 0) - (a[sortField] || 0);
      } else if (sortField === 'createdDate' || sortField === 'validityEndDate') {
        // Sort by date
        const dateA = a[sortField] ? new Date(a[sortField]) : new Date(0);
        const dateB = b[sortField] ? new Date(b[sortField]) : new Date(0);
        return sortDirection === 'asc'
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      } else if (sortField === 'status') {
        // Sort by status
        const statusA = mapApiStatusToDisplay(getQuotationStatus(a));
        const statusB = mapApiStatusToDisplay(getQuotationStatus(b));
        if (statusA < statusB) return sortDirection === 'asc' ? -1 : 1;
        if (statusA > statusB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      } else {
        // Default sort
        return sortDirection === 'asc' ? 1 : -1;
      }
    });

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber: SetStateAction<number>) =>
    setCurrentPage(pageNumber);

  // Handle loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-lg font-medium">Loading quotations...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <AlertCircle className="mb-4 size-16 text-red-500" />
        <h1 className="mb-2 text-2xl font-bold">Error Loading Quotations</h1>
        <p className="mb-4 text-center text-gray-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          style={{ borderRadius: 'var(--radius)' }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Handle empty state
  if (quotations.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div className='flex flex-col gap-2'>
          <h1 className='text-3xl font-bold tracking-tight'>Quotations</h1>
          <p className='text-muted-foreground'>
            Manage and track all quotations sent to clients
          </p>
        </div>
        
        <div className="flex flex-col items-center justify-center py-12">
          <FileText className="mb-4 size-16 text-gray-400" />
          <h2 className="mb-2 text-xl font-semibold">No Quotations Found</h2>
          <p className="mb-6 text-center text-gray-500">
            You haven't created any quotations yet.
          </p>
          <Link href="/importer/quotations/create/page">
            <button
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              style={{ borderRadius: 'var(--radius)' }}
            >
              <PlusCircle className="mr-2 size-4" />
              Create Your First Quotation
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-2'>
        <h1 className='text-3xl font-bold tracking-tight'>Quotations</h1>
        <p className='text-muted-foreground'>
          Manage and track all quotations sent to clients
        </p>
      </div>

      {/* Filter and Search Section */}
      <div className='flex flex-col items-start justify-between gap-4 md:flex-row md:items-center'>
        <div className='flex w-full flex-col gap-2 sm:flex-row md:w-auto'>
          <div className='relative'>
            <Search className='text-muted-foreground absolute left-2.5 top-2.5 size-4' />
            <input
              type='text'
              placeholder='Search quotations...'
              className='w-full rounded-md border bg-white py-2 pl-8 pr-4 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 sm:w-64'
              value={searchTerm}
              onChange={handleSearch}
              style={{ borderRadius: 'var(--radius)' }}
            />
          </div>

          <div className='flex gap-2'>
            <div className='relative'>
              <Calendar className='text-muted-foreground absolute left-2.5 top-2.5 size-4' />
              <input
                type='date'
                className='rounded-md border bg-white py-2 pl-8 pr-4 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800'
                value={dateFilter}
                onChange={handleDateFilter}
                style={{ borderRadius: 'var(--radius)' }}
              />
            </div>

            <div className='relative inline-block'>
              <select
                className='appearance-none rounded-md border bg-white py-2 pl-4 pr-8 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800'
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                style={{ borderRadius: 'var(--radius)' }}
              >
                <option value='All'>All Statuses</option>
                <option value='Draft'>Draft</option>
                <option value='Sent'>Sent</option>
                <option value='Accepted'>Accepted</option>
                <option value='Rejected'>Rejected</option>
              </select>
              <Filter className='text-muted-foreground pointer-events-none absolute right-2.5 top-2.5 size-4' />
            </div>
          </div>
        </div>

        <div className='flex w-full gap-2 md:w-auto'>
          <button
            className='inline-flex items-center justify-center whitespace-nowrap rounded-md border bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700'
            style={{ borderRadius: 'var(--radius)' }}
          >
            <Download className='mr-2 size-4' />
            Export
          </button>
          <Link href='/importer/quotations/create/page'>
            <button
              className='inline-flex items-center justify-center whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary'
              style={{ borderRadius: 'var(--radius)' }}
            >
              <PlusCircle className='mr-2 size-4' />
              New Quotation
            </button>
          </Link>
        </div>
      </div>

      {/* Quotations Table */}
      <div
        className='overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-gray-800'
        style={{ borderRadius: 'var(--radius)' }}
      >
        <div className='overflow-x-auto'>
          <table className='w-full caption-bottom text-sm'>
            <thead className='bg-gray-50 dark:bg-gray-900/50'>
              <tr>
                <th
                  className='cursor-pointer px-4 py-3 text-left font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                  onClick={() => handleSort('id')}
                >
                  <div className='flex items-center gap-1'>
                    Quotation ID
                    <ArrowUpDown className='size-4' />
                  </div>
                </th>
                <th
                  className='cursor-pointer px-4 py-3 text-left font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                  onClick={() => handleSort('requestId')}
                >
                  <div className='flex items-center gap-1'>
                    Request ID
                    <ArrowUpDown className='size-4' />
                  </div>
                </th>
                <th
                  className='cursor-pointer px-4 py-3 text-left font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                  onClick={() => handleSort('createdDate')}
                >
                  <div className='flex items-center gap-1'>
                    Created Date
                    <ArrowUpDown className='size-4' />
                  </div>
                </th>
                <th
                  className='cursor-pointer px-4 py-3 text-left font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                  onClick={() => handleSort('validityEndDate')}
                >
                  <div className='flex items-center gap-1'>
                    Expiry Date
                    <ArrowUpDown className='size-4' />
                  </div>
                </th>
                <th
                  className='cursor-pointer px-4 py-3 text-right font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                  onClick={() => handleSort('medicinePrices')}
                >
                  <div className='flex items-center justify-end gap-1'>
                    Items
                    <ArrowUpDown className='size-4' />
                  </div>
                </th>
                <th
                  className='cursor-pointer px-4 py-3 text-right font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                >
                  <div className='flex items-center justify-end gap-1'>
                    Amount
                    <ArrowUpDown className='size-4' />
                  </div>
                </th>
                <th
                  className='cursor-pointer px-4 py-3 text-left font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                  onClick={() => handleSort('status')}
                >
                  <div className='flex items-center gap-1'>
                    Status
                    <ArrowUpDown className='size-4' />
                  </div>
                </th>
                <th className='px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='divide-y'>
              {currentItems.map((quotation) => {
                const status = getQuotationStatus(quotation);
                const displayStatus = mapApiStatusToDisplay(status);
                const quotationId = `QT-${quotation.id}`;
                const requestId = `BR-${quotation.requestId}`;
                const itemCount = quotation.medicinePrices?.length || 0;
                
                // Calculate total amount from medicine prices - handle potential null safely
                const totalAmount = quotation.medicinePrices?.reduce((sum, item) => sum + (item?.price || 0), 0) || 0;
                // Apply discount if available
                const finalAmount = quotation.discount ? totalAmount - (totalAmount * quotation.discount / 100) : totalAmount;
                
                return (
                  <tr
                    key={quotation.id}
                    className='border-b transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/20'
                  >
                    <td className='px-4 py-3 align-middle font-medium'>
                      {quotationId}
                    </td>
                    <td className='px-4 py-3 align-middle'>
                      {requestId}
                    </td>
                    <td className='px-4 py-3 align-middle'>
                      {quotation.createdDate 
                        ? new Date(quotation.createdDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'N/A'}
                    </td>
                    <td className='px-4 py-3 align-middle'>
                      {quotation.validityEndDate 
                        ? new Date(quotation.validityEndDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'N/A'}
                    </td>
                    <td className='px-4 py-3 text-right align-middle'>
                      {itemCount}
                    </td>
                    <td className='px-4 py-3 text-right align-middle font-medium'>
                      ${finalAmount.toFixed(2)}
                    </td>
                    <td className='px-4 py-3 align-middle'>
                      <div
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(displayStatus)} text-white`}
                      >
                        {getStatusIcon(displayStatus)}
                        <span>{displayStatus}</span>
                      </div>
                    </td>
                    <td className='px-4 py-3 text-right align-middle'>
                      <Link href={`/importer/quotations/${quotation.id}`}>
                        <button className='inline-flex size-8 items-center justify-center rounded-md bg-secondary/10 text-secondary transition-colors hover:bg-secondary hover:text-white'>
                          <Eye className='size-4' />
                        </button>
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {/* Show message when no results found */}
              {currentItems.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className='text-muted-foreground px-4 py-6 text-center'
                  >
                    <div className='flex flex-col items-center gap-2'>
                      <AlertCircle className='size-6' />
                      <p>No quotations found matching your filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className='flex items-center justify-between border-t p-4'>
          <div className='text-muted-foreground text-sm'>
            Showing {filteredData.length > 0 ? indexOfFirstItem + 1 : 0}-
            {Math.min(indexOfLastItem, filteredData.length)} of{' '}
            {filteredData.length} quotations
          </div>

          <div className='flex items-center gap-2'>
            <select
              className='h-8 rounded-md border bg-white px-2 text-sm dark:bg-gray-800'
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{ borderRadius: 'var(--radius)' }}
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>

            <div className='flex gap-1'>
              <button
                className={`inline-flex size-8 items-center justify-center rounded-md border ${currentPage === 1 ? 'cursor-not-allowed bg-gray-100 opacity-50 dark:bg-gray-800' : 'bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700'}`}
                onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                disabled={currentPage === 1}
                style={{ borderRadius: 'var(--radius)' }}
              >
                <ChevronLeft className='size-4' />
              </button>

              {/* Page number buttons - show up to 5 pages */}
              {Array.from({ length: Math.min(5, totalPages) }).map(
                (_, index) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    // If 5 or fewer pages, show all
                    pageNum = index + 1;
                  } else if (currentPage <= 3) {
                    // If near the start, show first 5 pages
                    pageNum = index + 1;
                  } else if (currentPage >= totalPages - 2) {
                    // If near the end, show last 5 pages
                    pageNum = totalPages - 4 + index;
                  } else {
                    // Otherwise show 2 before and 2 after current page
                    pageNum = currentPage - 2 + index;
                  }

                  return (
                    <button
                      key={pageNum}
                      className={`inline-flex size-8 items-center justify-center rounded-md border ${pageNum === currentPage ? 'bg-primary text-white' : 'bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700'}`}
                      onClick={() => paginate(pageNum)}
                      style={{ borderRadius: 'var(--radius)' }}
                    >
                      {pageNum}
                    </button>
                  );
                }
              )}

              <button
                className={`inline-flex size-8 items-center justify-center rounded-md border ${currentPage === totalPages || totalPages === 0 ? 'cursor-not-allowed bg-gray-100 opacity-50 dark:bg-gray-800' : 'bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700'}`}
                onClick={() =>
                  currentPage < totalPages && paginate(currentPage + 1)
                }
                disabled={currentPage === totalPages || totalPages === 0}
                style={{ borderRadius: 'var(--radius)' }}
              >
                <ChevronRight className='size-4' />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}