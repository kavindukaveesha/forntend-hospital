/* eslint-disable tailwindcss/no-custom-classname */
'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  FileText,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Calendar,
  UserCircle,
  FileDown,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import { drugImporterRequestService } from '@/services/api/drugimporter-donation-requests';
import { tokenService } from '@/lib/axios';

interface DonationRequest {
  id: string;
  requestDate: string;
  clientName: string;
  type: 'clientRequest' | 'donorRequest';
  description: string;
  items: number;
  status: 'Pending' | 'Quotation Sent' | 'Accepted' | 'Declined';
}

interface ApiDonationRequest {
  donationRequest: {
    requestId: number;
    createdAt: string;
    description: string;
    prescribedMedicines: Array<any>;
  };
  patient: {
    firstName: string;
    lastName: string;
  };
  requestStatus?: {
    status: string;
  };
}

type SortableField = 'id' | 'requestDate' | 'clientName' | 'type' | 'items' | 'status';

export default function BillRequests() {
  // State for API data
  const [donationRequests, setDonationRequests] = useState<DonationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  // State for sorting
  const [sortField, setSortField] = useState<SortableField>('requestDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Fetch donation requests on mount
  useEffect(() => {
    const fetchDonationRequests = async () => {
      try {
        setLoading(true);
        // No need to pass drugImporterId - the service handles it internally
        const response = await drugImporterRequestService.getAllDonationRequests();
        
        if (!Array.isArray(response)) {
          throw new Error('Invalid response format');
        }
        
        // Map the response data to our interface
        const mappedData: DonationRequest[] = response.map((request: ApiDonationRequest) => ({
          id: `DR-${request.donationRequest.requestId}`,
          requestDate: request.donationRequest.createdAt.split('T')[0], // Extract date from ISO string
          clientName: `${request.patient.firstName} ${request.patient.lastName}`,
          type: 'clientRequest', // Default type
          description: request.donationRequest.description || '',
          items: request.donationRequest.prescribedMedicines?.length || 0,
          status: mapStatusFromApi(request.requestStatus?.status || 'PENDING'),
        }));
        
        setDonationRequests(mappedData);
      } catch (err) {
        console.error('Error fetching donation requests:', err);
        setError('Failed to load donation requests. Please try again.');
        toast.error('Failed to load donation requests.');
      } finally {
        setLoading(false);
      }
    };

    fetchDonationRequests();
  }, []);

  // Map API status to UI status
  const mapStatusFromApi = (apiStatus: string): DonationRequest['status'] => {
    switch (apiStatus.toUpperCase()) {
      case 'PENDING': return 'Pending';
      case 'ACCEPTED': return 'Accepted';
      case 'REJECT':
      case 'REJECTED': return 'Declined';
      case 'SEND':
      case 'SENT': return 'Quotation Sent';
      default: return 'Pending';
    }
  };

  // Handle search input
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Handle status filter
  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  // Handle type filter
  const handleTypeFilter = (type: string) => {
    setTypeFilter(type);
    setCurrentPage(1);
  };

  // Handle date filter
  const handleDateFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateFilter(e.target.value);
    setCurrentPage(1);
  };

  // Handle sort
  const handleSort = (field: SortableField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get type label
  const getTypeLabel = (type: string): string => {
    return type === 'clientRequest' ? 'Client Request' : 'Donor Request';
  };

  // Get type color
  const getTypeColor = (type: string): string => {
    return type === 'clientRequest'
      ? 'bg-primary/10 text-primary'
      : 'bg-secondary/10 text-secondary';
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Clock className='size-4' />;
      case 'Quotation Sent':
        return <FileText className='size-4' />;
      case 'Accepted':
        return <CheckCircle2 className='size-4' />;
      case 'Declined':
        return <XCircle className='size-4' />;
      default:
        return <HelpCircle className='size-4' />;
    }
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-500 hover:bg-amber-600';
      case 'Quotation Sent':
        return 'bg-secondary hover:bg-secondary/90';
      case 'Accepted':
        return 'bg-green-500 hover:bg-green-600';
      case 'Declined':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  // Generate and download PDF report client-side
  const handleDownloadReport = async () => {
    try {
      setGeneratingReport(true);
      toast.loading('Generating donation request report...');
      
      // Apply filters to get the data for the report
      const reportData = filteredData;
      
      // Create a new PDF document
      const doc = new jsPDF();
      
      // Add title to the PDF
      doc.setFontSize(16);
      doc.text('Donation Requests Report', 14, 15);
      
      // Add filters information
      doc.setFontSize(10);
      doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 14, 25);
      if (statusFilter !== 'All') doc.text(`Status Filter: ${statusFilter}`, 14, 30);
      if (typeFilter !== 'All') doc.text(`Type Filter: ${typeFilter}`, 14, 35);
      if (dateFilter) doc.text(`Date Filter: ${dateFilter}`, 14, 40);
      if (searchTerm) doc.text(`Search Term: ${searchTerm}`, 14, 45);
      
      // Define the table columns
      const columns = [
        { header: 'Request ID', dataKey: 'id' },
        { header: 'Date', dataKey: 'date' },
        { header: 'Client', dataKey: 'client' },
        { header: 'Type', dataKey: 'type' },
        { header: 'Items', dataKey: 'items' },
        { header: 'Status', dataKey: 'status' }
      ];
      
      // Prepare the data for the table
      const tableData = reportData.map((request) => ({
        id: request.id,
        date: new Date(request.requestDate).toLocaleDateString(),
        client: request.clientName,
        type: getTypeLabel(request.type),
        items: request.items.toString(),
        status: request.status
      }));
      
      // Add the table to the PDF
      try {
        (doc as any).autoTable({
          startY: 50,
          head: [columns.map(col => col.header)],
          body: tableData.map(row => columns.map(col => row[col.dataKey as keyof typeof row])),
          theme: 'grid',
          headStyles: { fillColor: [66, 139, 202], textColor: 255 },
          styles: { overflow: 'linebreak', cellWidth: 'auto' },
          columnStyles: { 
            0: { cellWidth: 30 }, // ID
            3: { cellWidth: 30 }, // Type
            4: { cellWidth: 20 }, // Items
            5: { cellWidth: 30 }  // Status
          }
        });
      } catch (tableError) {
        console.error('Error creating table:', tableError);
        throw new Error('Failed to create PDF table');
      }
      
      // Add summary information
      const totalRequests = reportData.length;
      const pendingCount = reportData.filter(r => r.status === 'Pending').length;
      const acceptedCount = reportData.filter(r => r.status === 'Accepted').length;
      const declinedCount = reportData.filter(r => r.status === 'Declined').length;
      const quotationSentCount = reportData.filter(r => r.status === 'Quotation Sent').length;
      
      doc.setFontSize(12);
      // Get final Y position safely
      const finalY = (doc as any).lastAutoTable?.finalY || 200;
      doc.text(`Summary: Total Requests: ${totalRequests}`, 14, finalY + 10);
      doc.text(`Pending: ${pendingCount} | Accepted: ${acceptedCount} | Declined: ${declinedCount} | Quotation Sent: ${quotationSentCount}`, 14, finalY + 16);
      
      // Save the PDF
      doc.save(`donation-requests-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.dismiss();
      toast.success('Report downloaded successfully');
    } catch (err) {
      toast.dismiss();
      console.error('Report generation error:', err);
      toast.error('Failed to generate report. Please try again.');
    } finally {
      setGeneratingReport(false);
    }
  };

  // Filter and sort the data
  const filteredData = donationRequests
    .filter((request) => {
      const matchesSearch =
        request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'All' || request.status === statusFilter;
      const matchesType = typeFilter === 'All' || request.type === typeFilter;
      const matchesDate = !dateFilter || request.requestDate === dateFilter;

      return matchesSearch && matchesStatus && matchesType && matchesDate;
    })
    .sort((a, b) => {
      if (sortField === 'items') {
        return sortDirection === 'asc'
          ? a[sortField] - b[sortField]
          : b[sortField] - a[sortField];
      } else {
        const aValue = a[sortField];
        const bValue = b[sortField];
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      }
    });

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className='flex h-[50vh] items-center justify-center'>
        <div className='text-center'>
          <Loader2 className='mx-auto mb-4 size-8 animate-spin text-primary' />
          <p className='text-muted-foreground'>Loading donation requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex h-[50vh] items-center justify-center'>
        <div className='text-center'>
          <AlertCircle className='mx-auto mb-4 size-8 text-red-500' />
          <p className='text-muted-foreground'>{error}</p>
          <button
            className='mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90'
            onClick={() => window.location.reload()}
            style={{ borderRadius: 'var(--radius)' }}
            type="button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-2'>
        <h1 className='text-3xl font-bold tracking-tight'>Donation Requests</h1>
        <p className='text-muted-foreground'>
          Manage client medicine donation requests
        </p>
      </div>

      {/* Filter and Search Section */}
      <div className='flex flex-col items-start justify-between gap-4 md:flex-row md:items-center'>
        <div className='flex w-full flex-col gap-2 sm:flex-row md:w-auto'>
          <div className='relative'>
            <Search className='text-muted-foreground absolute left-2.5 top-2.5 size-4' />
            <input
              type='text'
              placeholder='Search requests...'
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
                <option value='Pending'>Pending</option>
                <option value='Quotation Sent'>Quotation Sent</option>
                <option value='Accepted'>Accepted</option>
                <option value='Declined'>Declined</option>
              </select>
              <Filter className='text-muted-foreground pointer-events-none absolute right-2.5 top-2.5 size-4' />
            </div>

            <div className='relative inline-block'>
              <select
                className='appearance-none rounded-md border bg-white py-2 pl-4 pr-8 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800'
                value={typeFilter}
                onChange={(e) => handleTypeFilter(e.target.value)}
                style={{ borderRadius: 'var(--radius)' }}
              >
                <option value='All'>All Types</option>
                <option value='clientRequest'>Client Requests</option>
                <option value='donorRequest'>Donor Offers</option>
              </select>
              <UserCircle className='text-muted-foreground pointer-events-none absolute right-2.5 top-2.5 size-4' />
            </div>
          </div>
        </div>

        <div className='flex w-full gap-2 md:w-auto'>
          <button
            className='inline-flex items-center justify-center whitespace-nowrap rounded-md border bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700'
            style={{ borderRadius: 'var(--radius)' }}
            onClick={handleDownloadReport}
            disabled={generatingReport}
            type="button"
          >
            <FileDown className='mr-2 size-4' />
            {generatingReport ? 'Generating...' : 'Download Report'}
          </button>
        </div>
      </div>

      {/* Donation Requests Table */}
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
                    Request ID
                    <ArrowUpDown className='size-4' />
                  </div>
                </th>
                <th
                  className='cursor-pointer px-4 py-3 text-left font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                  onClick={() => handleSort('requestDate')}
                >
                  <div className='flex items-center gap-1'>
                    Date
                    <ArrowUpDown className='size-4' />
                  </div>
                </th>
                <th
                  className='cursor-pointer px-4 py-3 text-left font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                  onClick={() => handleSort('clientName')}
                >
                  <div className='flex items-center gap-1'>
                    Client
                    <ArrowUpDown className='size-4' />
                  </div>
                </th>
                <th
                  className='cursor-pointer px-4 py-3 text-left font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                  onClick={() => handleSort('type')}
                >
                  <div className='flex items-center gap-1'>
                    Type
                    <ArrowUpDown className='size-4' />
                  </div>
                </th>
                <th className='px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400'>
                  Description
                </th>
                <th
                  className='cursor-pointer px-4 py-3 text-right font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                  onClick={() => handleSort('items')}
                >
                  <div className='flex items-center justify-end gap-1'>
                    Items
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
              {currentItems.map((request) => (
                <tr
                  key={request.id}
                  className='border-b transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/20'
                >
                  <td className='px-4 py-3 align-middle font-medium'>
                    {request.id}
                  </td>
                  <td className='px-4 py-3 align-middle'>
                    {new Date(request.requestDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className='px-4 py-3 align-middle'>
                    {request.clientName}
                  </td>
                  <td className='px-4 py-3 align-middle'>
                    <div
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getTypeColor(request.type)}`}
                    >
                      {getTypeLabel(request.type)}
                    </div>
                  </td>
                  <td className='max-w-xs truncate px-4 py-3 align-middle'>
                    {request.description}
                  </td>
                  <td className='px-4 py-3 text-right align-middle'>
                    {request.items}
                  </td>
                  <td className='px-4 py-3 align-middle'>
                    <div
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(request.status)} text-white`}
                    >
                      {getStatusIcon(request.status)}
                      <span>{request.status}</span>
                    </div>
                  </td>
                  <td className='px-4 py-3 text-right align-middle'>
                    <Link href={`/importer/bill-requests/${request.id.replace('DR-', '')}`}>
                      <button 
                        className='inline-flex size-8 items-center justify-center rounded-md bg-secondary/10 text-secondary transition-colors hover:bg-secondary hover:text-white'
                        type="button"
                      >
                        <Eye className='size-4' />
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}

              {/* Show message when no results found */}
              {currentItems.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className='text-muted-foreground px-4 py-6 text-center'
                  >
                    <div className='flex flex-col items-center gap-2'>
                      <AlertCircle className='size-6' />
                      <p>No donation requests found matching your filters.</p>
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
            {filteredData.length} requests
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
                type="button"
              >
                <ChevronLeft className='size-4' />
              </button>

              {/* Page number buttons - show up to 5 pages */}
              {Array.from({ length: Math.min(5, totalPages) }).map(
                (_, index) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = index + 1;
                  } else if (currentPage <= 3) {
                    pageNum = index + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + index;
                  } else {
                    pageNum = currentPage - 2 + index;
                  }

                  return (
                    <button
                      key={pageNum}
                      className={`inline-flex size-8 items-center justify-center rounded-md border ${pageNum === currentPage ? 'bg-primary text-white' : 'bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700'}`}
                      onClick={() => paginate(pageNum)}
                      style={{ borderRadius: 'var(--radius)' }}
                      type="button"
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
                type="button"
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