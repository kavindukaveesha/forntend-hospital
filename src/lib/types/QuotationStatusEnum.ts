/**
 * Enum for quotation status values
 * Matches the status values from the backend API
 */
export enum QuotationStatusEnum {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  PAID = 'PAID'
}

export default QuotationStatusEnum;