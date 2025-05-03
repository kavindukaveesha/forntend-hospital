// src/app/importer/quotations/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  FileText,
  Printer,
  Download,
  Edit,
  Mail,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Package,
  Clock,
  CalendarDays,
  User,
  PhoneCall,
  AtSign,
  DollarSign,
  ShoppingCart,
  Truck,
  AlertTriangle,
  CreditCard,
  Calendar,
  CheckCircle,
  BarChart4,
  AlertCircle,
  Loader2,
  Trash
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { quotationService } from '@/services/api/quotations';
import jsPDF from 'jspdf';
import { getDrugImporterId } from '../../../../../utils/storage-helper';

// Define TypeScript interfaces
interface Medicine {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

type QuotationStatus =
  | 'PENDING'
  | 'SEND'
  | 'SENT'
  | 'ACCEPTED'
  | 'REJECT'
  | 'REJECTED'
  | 'EXPIRED'
  | 'PAID'
  | 'DELIVERED';

interface Payment {
  id: string;
  date: string;
  amount: number;
  method: 'Credit Card' | 'Bank Transfer' | 'Cash' | 'Insurance';
  status: 'Pending' | 'Completed' | 'Failed';
  reference?: string;
}

interface Delivery {
  id: string;
  date: string;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered';
  trackingNumber?: string;
  estimatedDelivery?: string;
}

interface MedicinePrice {
  medicineId: number;
  price: number;
  name?: string;
  quantity?: number;
}

interface Quotation {
  id: number;
  requestId: number;
  drugImporterId: number;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  createdDate?: string;
  updatedDate?: string;
  expiryDate?: string;
  validityDays?: number;
  status: QuotationStatus;
  medicinePrices?: MedicinePrice[];
  medicines?: Medicine[];
  subtotal?: number;
  discount?: number;
  total?: number;
  notes?: string;
  terms?: string;
  payment?: Payment;
  delivery?: Delivery;
}

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
}

// Delete confirmation modal component
const DeleteModal = ({ isOpen, onClose, onConfirm, isProcessing }: DeleteModalProps) => {
  if (!isOpen) return null;
  
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
      <div
        className='w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800'
        style={{ borderRadius: 'var(--radius)' }}
      >
        <h3 className='mb-4 text-xl font-bold'>Delete Quotation</h3>
        <div className='space-y-4'>
          <div className='flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200'>
            <AlertTriangle className='mt-0.5 size-5 flex-shrink-0' />
            <div>
              <p className='font-medium'>Are you sure you want to delete this quotation?</p>
              <p className='text-sm'>This action cannot be undone.</p>
            </div>
          </div>
          <div className='mt-6 flex justify-end gap-2'>
            <button
              onClick={onClose}
              className='rounded-md border px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              style={{ borderRadius: 'var(--radius)' }}
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isProcessing}
              className='flex items-center rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600'
              style={{ borderRadius: 'var(--radius)' }}
              type="button"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash className='mr-2 size-4' />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function QuotationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const quotationId = params.id ? Number(params.id) : 0;
  
  // Get drug importer ID from local storage with fallback value
  const drugImporterId = getDrugImporterId(1);

  // UI state
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<Payment['method']>('Credit Card');
  const [paymentReference, setPaymentReference] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Shipping modal state
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  
  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Fetch quotation data on mount
  useEffect(() => {
    const fetchQuotation = async () => {
      if (!quotationId) {
        setError("Invalid quotation ID");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        const data = await quotationService.getQuotationById(quotationId, drugImporterId);
        
        if (data) {
          // Transform API response to match our UI needs
          const enhancedData: Quotation = {
            ...data,
            status: data.status as QuotationStatus || 'PENDING',
            medicines: data.medicinePrices?.map(item => ({
              id: item.medicineId,
              name: item.name || item.medicine || `Medicine ${item.medicineId}`,
              category: 'Prescription', // Default category
              quantity: item.quantity || item.amount || 1,
              unit: 'Units',
              unitPrice: item.price,
              totalPrice: (item.price * (item.quantity || item.amount || 1))
            })) || [],
            subtotal: data.medicinePrices?.reduce((sum, item) => 
              sum + (item.price * (item.quantity || item.amount || 1)), 0) || 0
          };
          
          // Calculate total based on subtotal and discount
          enhancedData.total = enhancedData.subtotal - 
            (enhancedData.discount ? ((enhancedData.subtotal * enhancedData.discount) / 100) : 0);
            
          setQuotation(enhancedData);
        } else {
          setError('Quotation not found');
        }
      } catch (err) {
        console.error('Error fetching quotation:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load quotation details';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotation();
  }, [quotationId, drugImporterId]);

  // Handle back navigation
  const handleBack = (): void => {
    router.back();
  };

  // Handle updating the quotation status
  const handleUpdateStatus = async (newStatus: QuotationStatus): Promise<void> => {
    if (!quotation) return;

    try {
      setIsProcessing(true);
      
      const updatedQuotation = {
        ...quotation,
        status: newStatus,
        drugImporterId,
        medicinePrices: quotation.medicinePrices?.map(price => ({
          medicineId: price.medicineId,
          price: price.price
        })) || []
      };
      
      const result = await quotationService.updateQuotation(
        quotation.id, 
        updatedQuotation, 
        drugImporterId
      );
      
      if (result) {
        toast.success(`Quotation ${mapApiStatusToDisplay(newStatus)}`);
        setQuotation({
          ...quotation,
          status: newStatus
        });
      } else {
        throw new Error(`Failed to update quotation status to ${newStatus}`);
      }
    } catch (err) {
      console.error('Error updating quotation status:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update quotation status';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle sending a quotation
  const handleSendQuotation = async (): Promise<void> => {
    if (!quotation) return;
    
    try {
      setIsProcessing(true);
      const result = await quotationService.sendQuotation(quotation.id, drugImporterId);
      
      if (result) {
        toast.success('Quotation sent successfully!');
        setQuotation({
          ...quotation,
          status: 'SENT'
        });
      } else {
        throw new Error('Failed to send quotation');
      }
    } catch (err) {
      console.error('Error sending quotation:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send quotation';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle deleting a quotation
  const handleDeleteQuotation = async (): Promise<void> => {
    if (!quotation) return;
    
    try {
      setIsProcessing(true);
      const success = await quotationService.deleteQuotation(quotation.id, drugImporterId);
      
      if (success) {
        toast.success('Quotation deleted successfully!');
        setIsDeleteModalOpen(false);
        router.push('/importer/quotations');
      } else {
        throw new Error('Failed to delete quotation');
      }
    } catch (err) {
      console.error('Error deleting quotation:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete quotation';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle printing
  const handlePrint = () => {
    if (!quotation) return;
    
    const printContent = `
      <html>
        <head>
          <title>Quotation QT-${quotation.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .summary { margin-top: 20px; }
            .summary div { margin: 5px 0; }
          </style>
        </head>
        <body>
          <h1>Quotation QT-${quotation.id}</h1>
          <p><strong>Request ID:</strong> BR-${quotation.requestId}</p>
          <p><strong>Client:</strong> ${quotation.clientName || 'N/A'}</p>
          <p><strong>Status:</strong> ${mapApiStatusToDisplay(quotation.status)}</p>
          <p><strong>Created Date:</strong> ${formatDate(quotation.createdDate)}</p>
          <p><strong>Expiry Date:</strong> ${formatDate(quotation.expiryDate)}</p>
          
          <h2>Medicines</h2>
          <table>
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${quotation.medicines?.map(medicine => `
                <tr>
                  <td>${medicine.name} (${medicine.category})${medicine.notes ? `<br><small>${medicine.notes}</small>` : ''}</td>
                  <td>${medicine.quantity} ${medicine.unit}</td>
                  <td>$${medicine.unitPrice.toFixed(2)}</td>
                  <td>$${medicine.totalPrice.toFixed(2)}</td>
                </tr>
              `).join('') || '<tr><td colspan="4">No medicines</td></tr>'}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3">Subtotal:</td>
                <td>$${quotation.subtotal?.toFixed(2) || '0.00'}</td>
              </tr>
              ${quotation.discount && quotation.discount > 0 ? `
                <tr>
                  <td colspan="3">Discount (${quotation.discount}%):</td>
                  <td>-$${((quotation.subtotal || 0) * quotation.discount / 100).toFixed(2)}</td>
                </tr>
              ` : ''}
              <tr>
                <td colspan="3">Total:</td>
                <td>$${quotation.total?.toFixed(2) || '0.00'}</td>
              </tr>
            </tfoot>
          </table>

          ${quotation.notes ? `
            <div class="summary">
              <h2>Notes</h2>
              <p>${quotation.notes}</p>
            </div>
          ` : ''}

          ${quotation.payment ? `
            <div class="summary">
              <h2>Payment Information</h2>
              <div><strong>Method:</strong> ${quotation.payment.method}</div>
              <div><strong>Amount:</strong> $${quotation.payment.amount.toFixed(2)}</div>
              <div><strong>Date:</strong> ${formatDate(quotation.payment.date)}</div>
              ${quotation.payment.reference ? `<div><strong>Reference:</strong> ${quotation.payment.reference}</div>` : ''}
            </div>
          ` : ''}

          ${quotation.delivery ? `
            <div class="summary">
              <h2>Delivery Information</h2>
              <div><strong>Status:</strong> ${quotation.delivery.status}</div>
              <div><strong>Date:</strong> ${formatDate(quotation.delivery.date)}</div>
              ${quotation.delivery.trackingNumber ? `<div><strong>Tracking Number:</strong> ${quotation.delivery.trackingNumber}</div>` : ''}
              ${quotation.delivery.estimatedDelivery ? `<div><strong>Estimated Delivery:</strong> ${formatDate(quotation.delivery.estimatedDelivery)}</div>` : ''}
            </div>
          ` : ''}

        </body>
      </html>
    `;

    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      } else {
        toast.error('Failed to open print window. Please check your popup settings.');
      }
    } catch (err) {
      console.error('Error printing quotation:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to print quotation';
      toast.error(errorMessage);
    }
  };

  // Handle PDF download
  const handleDownloadPDF = () => {
    if (!quotation) return;
    
    try {
      const doc = new jsPDF();
      let yOffset = 20;

      // Header
      doc.setFontSize(20);
      doc.text(`Quotation QT-${quotation.id}`, 105, yOffset, { align: 'center' });
      yOffset += 10;

      // Quotation Details
      doc.setFontSize(12);
      doc.text(`Request ID: BR-${quotation.requestId}`, 20, yOffset);
      yOffset += 7;
      doc.text(`Client: ${quotation.clientName || 'N/A'}`, 20, yOffset);
      yOffset += 7;
      doc.text(`Status: ${mapApiStatusToDisplay(quotation.status)}`, 20, yOffset);
      yOffset += 7;
      doc.text(`Created Date: ${formatDate(quotation.createdDate)}`, 20, yOffset);
      yOffset += 7;
      doc.text(`Expiry Date: ${formatDate(quotation.expiryDate)}`, 20, yOffset);
      yOffset += 15;

      // Medicines Table
      doc.setFontSize(14);
      doc.text('Medicines', 20, yOffset);
      yOffset += 10;

      // Use try-catch for autoTable in case it fails
      try {
        const tableData = quotation.medicines?.map(medicine => [
          `${medicine.name} (${medicine.category})${medicine.notes ? `\n${medicine.notes}` : ''}`,
          `${medicine.quantity} ${medicine.unit}`,
          `$${medicine.unitPrice.toFixed(2)}`,
          `$${medicine.totalPrice.toFixed(2)}`
        ]) || [['No medicines', '', '', '']];

        // Use jspdf-autotable
        (doc as any).autoTable({
          startY: yOffset,
          head: [['Medicine', 'Quantity', 'Unit Price', 'Total']],
          body: tableData,
          theme: 'grid',
          styles: { fontSize: 10 },
          columnStyles: { 0: { cellWidth: 80 } }
        });

        // @ts-ignore - autoTable adds this property to the document
        yOffset = (doc as any).lastAutoTable.finalY + 10;
      } catch (tableError) {
        console.error('Error generating table:', tableError);
        yOffset += 10;
        doc.text('Could not generate medicine table.', 20, yOffset);
        yOffset += 10;
      }

      // Summary
      doc.setFontSize(12);
      doc.text(`Subtotal: $${quotation.subtotal?.toFixed(2) || '0.00'}`, 150, yOffset, { align: 'right' });
      yOffset += 7;
      if (quotation.discount && quotation.discount > 0) {
        doc.text(`Discount (${quotation.discount}%): -$${((quotation.subtotal || 0) * quotation.discount / 100).toFixed(2)}`, 150, yOffset, { align: 'right' });
        yOffset += 7;
      }
      doc.text(`Total: $${quotation.total?.toFixed(2) || '0.00'}`, 150, yOffset, { align: 'right' });
      yOffset += 15;

      // Notes
      if (quotation.notes) {
        doc.setFontSize(14);
        doc.text('Notes', 20, yOffset);
        yOffset += 10;
        doc.setFontSize(10);
        doc.text(quotation.notes, 20, yOffset, { maxWidth: 170 });
        yOffset += 20;
      }

      // Payment Information
      if (quotation.payment) {
        doc.setFontSize(14);
        doc.text('Payment Information', 20, yOffset);
        yOffset += 10;
        doc.setFontSize(10);
        doc.text(`Method: ${quotation.payment.method}`, 20, yOffset);
        yOffset += 7;
        doc.text(`Amount: $${quotation.payment.amount.toFixed(2)}`, 20, yOffset);
        yOffset += 7;
        doc.text(`Date: ${formatDate(quotation.payment.date)}`, 20, yOffset);
        yOffset += 7;
        if (quotation.payment.reference) {
          doc.text(`Reference: ${quotation.payment.reference}`, 20, yOffset);
          yOffset += 7;
        }
      }

      // Delivery Information
      if (quotation.delivery) {
        yOffset += 10;
        doc.setFontSize(14);
        doc.text('Delivery Information', 20, yOffset);
        yOffset += 10;
        doc.setFontSize(10);
        doc.text(`Status: ${quotation.delivery.status}`, 20, yOffset);
        yOffset += 7;
        doc.text(`Date: ${formatDate(quotation.delivery.date)}`, 20, yOffset);
        yOffset += 7;
        if (quotation.delivery.trackingNumber) {
          doc.text(`Tracking Number: ${quotation.delivery.trackingNumber}`, 20, yOffset);
          yOffset += 7;
        }
        if (quotation.delivery.estimatedDelivery) {
          doc.text(`Estimated Delivery: ${formatDate(quotation.delivery.estimatedDelivery)}`, 20, yOffset);
        }
      }

      // Save PDF
      doc.save(`Quotation_QT-${quotation.id}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (err) {
      console.error('Error generating PDF:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to download PDF';
      toast.error(errorMessage);
    }
  };

  // Handle processing payment
  const handleProcessPayment = (): void => {
    setIsProcessing(true);
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      setIsPaymentModalOpen(false);
      toast.success('Payment processed successfully!');
      
      if (quotation) {
        setQuotation({
          ...quotation,
          status: 'PAID',
          payment: {
            id: `PAY-${Date.now()}`,
            method: paymentMethod,
            amount: quotation.total || 0,
            date: new Date().toISOString(),
            status: 'Completed',
            reference: paymentReference
          }
        });
      }
    }, 1500);
  };

  // Handle shipping
  const handleShipOrder = (): void => {
    setIsProcessing(true);
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      setIsShippingModalOpen(false);
      toast.success('Order has been marked as shipped!');
      
      if (quotation) {
        setQuotation({
          ...quotation,
          status: 'DELIVERED',
          delivery: {
            id: `DEL-${Date.now()}`,
            date: new Date().toISOString(),
            status: 'Shipped',
            trackingNumber,
            estimatedDelivery
          }
        });
      }
    }, 1500);
  };

  // Map API status to display status
  const mapApiStatusToDisplay = (status: QuotationStatus): string => {
    switch (status) {
      case 'PENDING': return 'Draft';
      case 'SEND': 
      case 'SENT': return 'Sent';
      case 'ACCEPTED': return 'Accepted';
      case 'REJECT': 
      case 'REJECTED': return 'Rejected';
      case 'EXPIRED': return 'Expired';
      case 'PAID': return 'Paid';
      case 'DELIVERED': return 'Delivered';
      default: return 'Unknown';
    }
  };

  // Get status badge color
  const getStatusColor = (status: string): string => {
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
      case 'Paid':
        return 'bg-purple-500';
      case 'Delivered':
        return 'bg-teal-500';
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
        return <Mail className='size-4' />;
      case 'Accepted':
        return <CheckCircle2 className='size-4' />;
      case 'Rejected':
        return <XCircle className='size-4' />;
      case 'Expired':
        return <Clock className='size-4' />;
      case 'Paid':
        return <DollarSign className='size-4' />;
      case 'Delivered':
        return <Package className='size-4' />;
      default:
        return <AlertCircle className='size-4' />;
    }
  };

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

  // Calculate totals
  const totalItems = quotation?.medicines?.reduce(
    (sum, medicine) => sum + medicine.quantity,
    0
  ) || 0;

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-lg font-medium">Loading quotation details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !quotation) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center p-4'>
        <AlertCircle className='mb-4 size-16 text-red-500' />
        <h1 className='mb-2 text-2xl font-bold'>Quotation Not Found</h1>
        <p className='mb-4 text-gray-500'>
          {error || 'The quotation you requested could not be found or has been removed.'}
        </p>
        <Link href='/importer/quotations'>
          <button 
            className='inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90'
            style={{ borderRadius: 'var(--radius)' }}
            type="button"
          >
            <ArrowLeft className='mr-2 size-4' />
            Back to Quotations
          </button>
        </Link>
      </div>
    );
  }

  // Determine display status
  const displayStatus = mapApiStatusToDisplay(quotation.status);

  return (
    <div className='flex flex-col gap-6'>
      {/* Header with back button and actions */}
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div className='flex items-center gap-2'>
          <button
            onClick={handleBack}
            className='inline-flex size-10 items-center justify-center rounded-md border bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700'
            style={{ borderRadius: 'var(--radius)' }}
            type="button"
          >
            <ArrowLeft className='size-5' />
          </button>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>
              Quotation QT-{quotation.id}
            </h1>
            <p className='text-muted-foreground'>
              Request ID: BR-{quotation.requestId}
            </p>
          </div>
        </div>
        <div className='flex flex-wrap gap-2'>
          <button
            onClick={handlePrint}
            className='inline-flex items-center justify-center whitespace-nowrap rounded-md border bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700'
            style={{ borderRadius: 'var(--radius)' }}
            type="button"
          >
            <Printer className='mr-2 size-4' />
            Print
          </button>
          <button
            onClick={handleDownloadPDF}
            className='inline-flex items-center justify-center whitespace-nowrap rounded-md border bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700'
            style={{ borderRadius: 'var(--radius)' }}
            type="button"
          >
            <Download className='mr-2 size-4' />
            Download PDF
          </button>
          {(quotation.status === 'SEND' || quotation.status === 'SENT') && (<button
              onClick={() => handleSendQuotation()}
              className='inline-flex items-center justify-center whitespace-nowrap rounded-md border bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700'
              style={{ borderRadius: 'var(--radius)' }}
              type="button"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Mail className='mr-2 size-4' />
              )}
              Resend
            </button>
          )}
          {quotation.status === 'PENDING' && (
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className='inline-flex items-center justify-center whitespace-nowrap rounded-md border bg-red-50 text-red-700 border-red-200 px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800 dark:hover:bg-red-900/40'
              style={{ borderRadius: 'var(--radius)' }}
              type="button"
            >
              <Trash className='mr-2 size-4' />
              Delete
            </button>
          )}
        </div>
      </div>
      
      {/* Status badge */}
      <div
        className={`inline-flex items-center gap-2 rounded-full px-4 py-1 text-sm font-medium ${getStatusColor(displayStatus)} w-fit text-white`}
      >
        {getStatusIcon(displayStatus)}
        <span>{displayStatus}</span>
      </div>
      
      {/* Main content grid */}
      <div className='grid gap-6 md:grid-cols-3'>
        {/* Left column - Client info and summary */}
        <div className='space-y-6 md:col-span-1'>
          {/* Client Info Card */}
          {(quotation.clientName || quotation.clientEmail || quotation.clientPhone) && (
            <div
              className='overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-gray-800'
              style={{ borderRadius: 'var(--radius)' }}
            >
              <div className='border-b px-4 py-3'>
                <h3 className='font-medium'>Client Information</h3>
              </div>
              <div className='space-y-4 p-4'>
                {quotation.clientName && (
                  <div className='flex items-start gap-3'>
                    <User className='text-muted-foreground mt-0.5 size-5' />
                    <div>
                      <div className='font-medium'>{quotation.clientName}</div>
                    </div>
                  </div>
                )}
                {quotation.clientEmail && (
                  <div className='flex items-start gap-3'>
                    <AtSign className='text-muted-foreground mt-0.5 size-5' />
                    <div>
                      <div className='text-sm'>{quotation.clientEmail}</div>
                    </div>
                  </div>
                )}
                {quotation.clientPhone && (
                  <div className='flex items-start gap-3'>
                    <PhoneCall className='text-muted-foreground mt-0.5 size-5' />
                    <div>
                      <div className='text-sm'>{quotation.clientPhone}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Quotation Details Card */}
          <div
            className='overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-gray-800'
            style={{ borderRadius: 'var(--radius)' }}
          >
            <div className='border-b px-4 py-3'>
              <h3 className='font-medium'>Quotation Details</h3>
            </div>
            <div className='space-y-4 p-4'>
              <div className='flex items-start gap-3'>
                <Calendar className='text-muted-foreground mt-0.5 size-5' />
                <div>
                  <div className='text-muted-foreground text-sm'>
                    Created Date
                  </div>
                  <div className='font-medium'>
                    {formatDate(quotation.createdDate)}
                  </div>
                </div>
              </div>
              
              {quotation.validityDays && (
                <div className='flex items-start gap-3'>
                  <Clock className='text-muted-foreground mt-0.5 size-5' />
                  <div>
                    <div className='text-muted-foreground text-sm'>
                      Validity
                    </div>
                    <div className='font-medium'>
                      {quotation.validityDays} days
                    </div>
                  </div>
                </div>
              )}
              
              {quotation.expiryDate && (
                <div className='flex items-start gap-3'>
                  <CalendarDays className='text-muted-foreground mt-0.5 size-5' />
                  <div>
                    <div className='text-muted-foreground text-sm'>
                      Expiry Date
                    </div>
                    <div className='font-medium'>
                      {formatDate(quotation.expiryDate)}
                    </div>
                  </div>
                </div>
              )}
              
              <div className='flex items-start gap-3'>
                <ShoppingCart className='text-muted-foreground mt-0.5 size-5' />
                <div>
                  <div className='text-muted-foreground text-sm'>
                    Medicines
                  </div>
                  <div className='font-medium'>
                    {quotation.medicines?.length || 0} items
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Payment Info Card */}
          {quotation.payment && (
            <div
              className='overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-gray-800'
              style={{ borderRadius: 'var(--radius)' }}
            >
              <div className='border-b px-4 py-3'>
                <h3 className='font-medium'>Payment Information</h3>
              </div>
              <div className='space-y-4 p-4'>
                <div className='flex items-start gap-3'>
                  <CreditCard className='text-muted-foreground mt-0.5 size-5' />
                  <div>
                    <div className='text-muted-foreground text-sm'>
                      Payment Method
                    </div>
                    <div className='font-medium'>
                      {quotation.payment.method}
                    </div>
                  </div>
                </div>
                <div className='flex items-start gap-3'>
                  <Calendar className='text-muted-foreground mt-0.5 size-5' />
                  <div>
                    <div className='text-muted-foreground text-sm'>
                      Payment Date
                    </div>
                    <div className='font-medium'>
                      {formatDate(quotation.payment.date)}
                    </div>
                  </div>
                </div>
                <div className='flex items-start gap-3'>
                  <DollarSign className='text-muted-foreground mt-0.5 size-5' />
                  <div>
                    <div className='text-muted-foreground text-sm'>Amount</div>
                    <div className='font-medium'>
                      ${quotation.payment.amount.toFixed(2)}
                    </div>
                  </div>
                </div>
                {quotation.payment.reference && (
                  <div className='flex items-start gap-3'>
                    <FileText className='text-muted-foreground mt-0.5 size-5' />
                    <div>
                      <div className='text-muted-foreground text-sm'>
                        Reference
                      </div>
                      <div className='font-medium'>
                        {quotation.payment.reference}
                      </div>
                    </div>
                  </div>
                )}
                <div className='flex items-start gap-3'>
                  <CheckCircle className='mt-0.5 size-5 text-green-500' />
                  <div>
                    <div className='text-sm font-medium text-green-500'>
                      Payment {quotation.payment.status}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Delivery Info Card */}
          {quotation.delivery && (
            <div
              className='overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-gray-800'
              style={{ borderRadius: 'var(--radius)' }}
            >
              <div className='border-b px-4 py-3'>
                <h3 className='font-medium'>Delivery Information</h3>
              </div>
              <div className='space-y-4 p-4'>
                <div className='flex items-start gap-3'>
                  <Calendar className='text-muted-foreground mt-0.5 size-5' />
                  <div>
                    <div className='text-muted-foreground text-sm'>
                      Shipping Date
                    </div>
                    <div className='font-medium'>
                      {formatDate(quotation.delivery.date)}
                    </div>
                  </div>
                </div>
                <div className='flex items-start gap-3'>
                  <Truck className='text-muted-foreground mt-0.5 size-5' />
                  <div>
                    <div className='text-muted-foreground text-sm'>Status</div>
                    <div className='font-medium'>
                      {quotation.delivery.status}
                    </div>
                  </div>
                </div>
                {quotation.delivery.trackingNumber && (
                  <div className='flex items-start gap-3'>
                    <Package className='text-muted-foreground mt-0.5 size-5' />
                    <div>
                      <div className='text-muted-foreground text-sm'>
                        Tracking Number
                      </div>
                      <div className='font-medium'>
                        {quotation.delivery.trackingNumber}
                      </div>
                    </div>
                  </div>
                )}
                {quotation.delivery.estimatedDelivery && (
                  <div className='flex items-start gap-3'>
                    <CalendarDays className='text-muted-foreground mt-0.5 size-5' />
                    <div>
                      <div className='text-muted-foreground text-sm'>
                        Estimated Delivery
                      </div>
                      <div className='font-medium'>
                        {formatDate(quotation.delivery.estimatedDelivery)}
                      </div>
                    </div>
                  </div>
                )}
                {quotation.delivery.trackingNumber && (
                  <a
                    href='#'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center text-primary hover:underline'
                  >
                    <ExternalLink className='mr-1 size-4' />
                    Track Package
                  </a>
                )}
              </div>
            </div>
          )}
          
          {/* Summary Card */}
          <div
            className='overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-gray-800'
            style={{ borderRadius: 'var(--radius)' }}
          >
            <div className='border-b px-4 py-3'>
              <h3 className='font-medium'>Summary</h3>
            </div>
            <div className='space-y-4 p-4'>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground'>Items:</span>
                <span className='font-medium'>{quotation.medicines?.length || 0}</span>
              </div>
              
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground'>Subtotal:</span>
                <span className='font-medium'>${quotation.subtotal?.toFixed(2) || '0.00'}</span>
              </div>
              
              {quotation.discount && quotation.discount > 0 && (
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground'>Discount ({quotation.discount}%):</span>
                  <span className='font-medium text-green-600'>
                    -${((quotation.subtotal || 0) * quotation.discount / 100).toFixed(2)}
                  </span>
                </div>
              )}
              
              <div className='h-px bg-gray-200 dark:bg-gray-700'></div>
              
              <div className='flex items-center justify-between'>
                <span className='font-medium'>Total:</span>
                <span className='text-xl font-bold'>${quotation.total?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right column - Medicines list and actions */}
        <div className='space-y-6 md:col-span-2'>
          {/* Medicines List Card */}
          <div
            className='overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-gray-800'
            style={{ borderRadius: 'var(--radius)' }}
          >
            <div className='flex items-center justify-between border-b px-4 py-3'>
              <h3 className='font-medium'>Medicines</h3>
              <div className='text-muted-foreground text-sm'>{quotation.medicines?.length || 0} items</div>
            </div>
            <div className='p-4'>
              <div className='overflow-hidden rounded-md border'>
                <table className='w-full text-sm'>
                  <thead className='bg-gray-50 dark:bg-gray-900/50'>
                    <tr>
                      <th className='px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400'>
                        Medicine
                      </th>
                      <th className='px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400'>
                        Quantity
                      </th>
                      <th className='px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400'>
                        Unit Price
                      </th>
                      <th className='px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400'>
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y'>
                    {quotation.medicines && quotation.medicines.length > 0 ? (
                      quotation.medicines.map((medicine) => (
                        <tr
                          key={medicine.id}
                          className='border-b transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/20'
                        >
                          <td className='px-4 py-3 align-middle'>
                            <div>
                              <div className='font-medium'>{medicine.name}</div>
                              <div className='text-muted-foreground text-xs'>
                                {medicine.category}
                              </div>
                              {medicine.notes && (
                                <div className='mt-1 text-xs italic text-amber-600 dark:text-amber-400'>
                                  {medicine.notes}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className='px-4 py-3 text-center align-middle'>
                            {medicine.quantity} {medicine.unit}
                          </td>
                          <td className='px-4 py-3 text-right align-middle'>
                            ${medicine.unitPrice.toFixed(2)}
                          </td>
                          <td className='px-4 py-3 text-right align-middle font-medium'>
                            ${medicine.totalPrice.toFixed(2)}
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
                            <p>No medicines in this quotation.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className='bg-gray-50 dark:bg-gray-900/50'>
                    <tr>
                      <td colSpan={2} className='px-4 py-3 align-middle'></td>
                      <td className='px-4 py-3 text-right align-middle font-medium text-gray-500 dark:text-gray-400'>
                        Subtotal:
                      </td>
                      <td className='px-4 py-3 text-right align-middle font-medium'>
                        ${quotation.subtotal?.toFixed(2) || '0.00'}
                      </td>
                    </tr>
                    {quotation.discount && quotation.discount > 0 && (
                      <tr>
                        <td colSpan={2} className='px-4 py-3 align-middle'></td>
                        <td className='px-4 py-3 text-right align-middle font-medium text-gray-500 dark:text-gray-400'>
                          Discount:
                        </td>
                        <td className='px-4 py-3 text-right align-middle font-medium text-green-600 dark:text-green-400'>
                          -${((quotation.subtotal || 0) * quotation.discount / 100).toFixed(2)}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan={2} className='px-4 py-3 align-middle'></td>
                      <td className='px-4 py-3 text-right align-middle font-medium text-gray-900 dark:text-gray-100'>
                        Total:
                      </td>
                      <td className='px-4 py-3 text-right align-middle font-bold text-gray-900 dark:text-gray-100'>
                        ${quotation.total?.toFixed(2) || '0.00'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
          
          {/* Notes Card */}
          {quotation.notes && (
            <div
              className='overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-gray-800'
              style={{ borderRadius: 'var(--radius)' }}
            >
              <div className='border-b px-4 py-3'>
                <h3 className='font-medium'>Notes</h3>
              </div>
              <div className='p-4'>
                <p className='text-muted-foreground text-sm'>{quotation.notes}</p>
              </div>
            </div>
          )}
          
          {/* Action Buttons Card */}
          <div
            className='overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-gray-800'
            style={{ borderRadius: 'var(--radius)' }}
          >
            <div className='border-b px-4 py-3'>
              <h3 className='font-medium'>Actions</h3>
            </div>
            <div className='p-4'>
              <div className='grid gap-4 sm:grid-cols-2'>
                {/* Conditional buttons based on status */}
                {(quotation.status === 'SEND' || quotation.status === 'SENT') && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus('ACCEPTED' as QuotationStatus)}
                      className='inline-flex items-center justify-center whitespace-nowrap rounded-md bg-green-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-600'
                      style={{ borderRadius: 'var(--radius)' }}
                      type="button"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className='mr-2 size-4' />
                      )}
                      Accept Quotation
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('REJECTED' as QuotationStatus)}
                      className='inline-flex items-center justify-center whitespace-nowrap rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-600'
                      style={{ borderRadius: 'var(--radius)' }}
                      type="button"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <XCircle className='mr-2 size-4' />
                      )}
                      Reject Quotation
                    </button>
                  </>
                )}
                
                {quotation.status === 'ACCEPTED' && !quotation.payment && (
                  <button
                    onClick={() => setIsPaymentModalOpen(true)}
                    className='inline-flex items-center justify-center whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90'
                    style={{ borderRadius: 'var(--radius)' }}
                    type="button"
                  >
                    <CreditCard className='mr-2 size-4' />
                    Process Payment
                  </button>
                )}
                
                {quotation.status === 'PAID' && !quotation.delivery && (
                  <button
                    onClick={() => setIsShippingModalOpen(true)}
                    className='inline-flex items-center justify-center whitespace-nowrap rounded-md bg-green-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-600'
                    style={{ borderRadius: 'var(--radius)' }}
                    type="button"
                  >
                    <Truck className='mr-2 size-4' />
                    Ship Medicines
                  </button>
                )}
                
                {quotation.status === 'PENDING' && (
                  <Link href={`/importer/quotations/edit/${quotation.id}`}>
                    <button
                      className='inline-flex items-center justify-center whitespace-nowrap rounded-md bg-secondary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-secondary/90 w-full'
                      style={{ borderRadius: 'var(--radius)' }}
                      type="button"
                    >
                      <Edit className='mr-2 size-4' />
                      Edit Quotation
                    </button>
                  </Link>
                )}
                
                {quotation.status === 'PENDING' && (
                  <button
                    onClick={() => handleSendQuotation()}
                    className='inline-flex items-center justify-center whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90'
                    style={{ borderRadius: 'var(--radius)' }}
                    type="button"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <Mail className='mr-2 size-4' />
                    )}
                    Send Quotation
                  </button>
                )}
              </div>
              
              {/* Status warnings */}
              {(quotation.status === 'REJECT' || quotation.status === 'REJECTED') && (
                <div className='mt-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200'>
                  <AlertTriangle className='mt-0.5 size-5 flex-shrink-0' />
                  <div>
                    <p className='font-medium'>This quotation has been rejected</p>
                    <p className='text-sm'>
                      You may need to create a new quotation with different terms or pricing.
                    </p>
                  </div>
                </div>
              )}
              
              {quotation.status === 'EXPIRED' && (
                <div className='mt-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200'>
                  <AlertTriangle className='mt-0.5 size-5 flex-shrink-0' />
                  <div>
                    <p className='font-medium'>This quotation has expired</p>
                    <p className='text-sm'>
                      You may need to create a new quotation with updated pricing and availability.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Activity Timeline */}
          <div
            className='overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-gray-800'
            style={{ borderRadius: 'var(--radius)' }}
          >
            <div className='border-b px-4 py-3'>
              <h3 className='font-medium'>Activity Timeline</h3>
            </div>
            <div className='p-4'>
              <div className='relative space-y-8 border-l border-gray-200 pl-6 dark:border-gray-700'>
                <div className='relative'>
                  <div className='absolute -left-9 top-0.5 h-4 w-4 rounded-full bg-primary'></div>
                  <div>
                    <p className='font-medium'>Quotation Created</p>
                    <time className='text-muted-foreground text-xs'>
                      {formatDate(quotation.createdDate)} {quotation.createdDate ? new Date(quotation.createdDate).toLocaleTimeString() : ''}
                    </time>
                  </div>
                </div>
                
                {quotation.status !== 'PENDING' && (
                  <div className='relative'>
                    <div className='absolute -left-9 top-0.5 h-4 w-4 rounded-full bg-blue-500'></div>
                    <div>
                      <p className='font-medium'>Quotation Sent to Client</p>
                      <time className='text-muted-foreground text-xs'>
                        {formatDate(quotation.updatedDate)} {quotation.updatedDate ? new Date(quotation.updatedDate).toLocaleTimeString() : ''}
                      </time>
                    </div>
                  </div>
                )}
                
                {quotation.status === 'ACCEPTED' && (
                  <div className='relative'>
                    <div className='absolute -left-9 top-0.5 h-4 w-4 rounded-full bg-green-500'></div>
                    <div>
                      <p className='font-medium'>Quotation Accepted</p>
                      <time className='text-muted-foreground text-xs'>
                        {formatDate(quotation.updatedDate)} {quotation.updatedDate ? new Date(quotation.updatedDate).toLocaleTimeString() : ''}
                      </time>
                    </div>
                  </div>
                )}
                
                {(quotation.status === 'REJECT' || quotation.status === 'REJECTED') && (
                  <div className='relative'>
                    <div className='absolute -left-9 top-0.5 h-4 w-4 rounded-full bg-red-500'></div>
                    <div>
                      <p className='font-medium'>Quotation Rejected</p>
                      <time className='text-muted-foreground text-xs'>
                        {formatDate(quotation.updatedDate)} {quotation.updatedDate ? new Date(quotation.updatedDate).toLocaleTimeString() : ''}
                      </time>
                    </div>
                  </div>
                )}
                
                {quotation.payment && (
                  <div className='relative'>
                    <div className='absolute -left-9 top-0.5 h-4 w-4 rounded-full bg-purple-500'></div>
                    <div>
                      <p className='font-medium'>Payment Received</p>
                      <time className='text-muted-foreground text-xs'>
                        {formatDate(quotation.payment.date)} {new Date(quotation.payment.date).toLocaleTimeString()}
                      </time>
                      <p className='text-xs text-gray-500'>
                        {quotation.payment.method} - ${quotation.payment.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
                
                {quotation.delivery && (
                  <div className='relative'>
                    <div className='absolute -left-9 top-0.5 h-4 w-4 rounded-full bg-teal-500'></div>
                    <div>
                      <p className='font-medium'>Medicines Shipped</p>
                      <time className='text-muted-foreground text-xs'>
                        {formatDate(quotation.delivery.date)} {new Date(quotation.delivery.date).toLocaleTimeString()}
                      </time>
                      {quotation.delivery.trackingNumber && (
                        <p className='text-xs text-gray-500'>
                          Tracking: {quotation.delivery.trackingNumber}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
          <div
            className='w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800'
            style={{ borderRadius: 'var(--radius)' }}
          >
            <h3 className='mb-4 text-xl font-bold'>Process Payment</h3>
            <div className='space-y-4'>
              <div>
                <label
                  className='mb-1 block text-sm font-medium'
                  htmlFor='paymentMethod'
                >
                  Payment Method
                </label>
                <select
                  id='paymentMethod'
                  className='w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary'
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as Payment['method'])
                  }
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  <option value='Credit Card'>Credit Card</option>
                  <option value='Bank Transfer'>Bank Transfer</option>
                  <option value='Cash'>Cash</option>
                  <option value='Insurance'>Insurance</option>
                </select>
              </div>
              <div>
                <label
                  className='mb-1 block text-sm font-medium'
                  htmlFor='paymentRef'
                >
                  Reference Number
                </label>
                <input
                  id='paymentRef'
                  type='text'
                  className='w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary'
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder='Transaction ID, check number, etc.'
                  style={{ borderRadius: 'var(--radius)' }}
                />
              </div>
              <div className='rounded-md bg-gray-50 p-3 dark:bg-gray-900/30'>
                <div className='mb-2 flex justify-between'>
                  <span>Total Amount:</span>
                  <span className='font-bold'>
                    ${quotation.total?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className='text-muted-foreground text-xs'>
                  This will mark the quotation as paid and allow for shipping of medicines.
                </div>
              </div>
              <div className='mt-6 flex justify-end gap-2'>
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className='rounded-md border px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  style={{ borderRadius: 'var(--radius)' }}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessPayment}
                  disabled={isProcessing}
                  className='flex items-center rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90'
                  style={{ borderRadius: 'var(--radius)' }}
                  type="button"
                >
                  {isProcessing ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <DollarSign className='mr-1 size-4' />
                  )}
                  {isProcessing ? 'Processing...' : 'Process Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Shipping Modal */}
      {isShippingModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
          <div
            className='w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800'
            style={{ borderRadius: 'var(--radius)' }}
          >
            <h3 className='mb-4 text-xl font-bold'>Ship Medicines</h3>
            <div className='space-y-4'>
              <div>
                <label
                  className='mb-1 block text-sm font-medium'
                  htmlFor='trackingNumber'
                >
                  Tracking Number
                </label>
                <input
                  id='trackingNumber'
                  type='text'
                  className='w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary'
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder='Enter shipping tracking number'
                  style={{ borderRadius: 'var(--radius)' }}
                />
              </div>
              <div>
                <label
                  className='mb-1 block text-sm font-medium'
                  htmlFor='estimatedDelivery'
                >
                  Estimated Delivery Date
                </label>
                <input
                  id='estimatedDelivery'
                  type='date'
                  className='w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary'
                  value={estimatedDelivery}
                  onChange={(e) => setEstimatedDelivery(e.target.value)}
                  style={{ borderRadius: 'var(--radius)' }}
                />
              </div>
              <div className='rounded-md bg-gray-50 p-3 dark:bg-gray-900/30'>
                <div className='flex flex-col gap-1'>
                  <div className='flex justify-between'>
                    <span>Total Medicines:</span>
                    <span className='font-bold'>
                      {quotation.medicines?.length || 0} products
                    </span>
                  </div>
                </div>
              </div>
              <div className='mt-6 flex justify-end gap-2'>
                <button
                  onClick={() => setIsShippingModalOpen(false)}
                  className='rounded-md border px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  style={{ borderRadius: 'var(--radius)' }}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleShipOrder}
                  disabled={
                    isProcessing || !trackingNumber || !estimatedDelivery
                  }
                  className='flex items-center rounded-md bg-green-500 px-4 py-2 text-white hover:bg-green-600'
                  style={{ borderRadius: 'var(--radius)' }}
                  type="button"
                >
                  {isProcessing ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Truck className='mr-1 size-4' />
                  )}
                  {isProcessing ? 'Processing...' : 'Ship Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteQuotation}
        isProcessing={isProcessing}
      />
      
      {/* CSS Variable styles */}
      <style jsx global>{`
        :root {
          --radius: 0.5rem;
        }
        .bg-primary {
          background-color: hsl(215, 100%, 50%);
        }
        .bg-primary\\/90 {
          background-color: hsla(215, 100%, 50%, 0.9);
        }
        .text-primary {
          color: hsl(215, 100%, 50%);
        }
        .border-primary {
          border-color: hsl(215, 100%, 50%);
        }
        .focus\\:ring-primary:focus {
          --tw-ring-color: hsl(215, 100%, 50%);
        }
        .hover\\:bg-primary\\/90:hover {
          background-color: hsla(215, 100%, 50%, 0.9);
        }
        .bg-secondary {
          background-color: hsl(280, 100%, 50%);
        }
        .bg-secondary\\/90 {
          background-color: hsla(280, 100%, 50%, 0.9);
        }
        .hover\\:bg-secondary\\/90:hover {
          background-color: hsla(280, 100%, 50%, 0.9);
        }
        .text-muted-foreground {
          color: hsl(215, 20%, 65%);
        }
      `}</style>
    </div>
  );
}