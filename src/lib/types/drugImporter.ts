// src/lib/types.ts

// Auth Types
export interface LoginUserDto {
  email: string;
  password: string;
  [x: string]: any;
}

export interface RegisterUserDto {
  email: string;
  password: string;
  role: string;
}

// Patient Types
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER'
}

export enum GovernmentIdType {
  NIC = 'NIC',
  BIRTH_CERTIFICATE = 'BIRTH_CERTIFICATE',
  PASSPORT = 'PASSPORT'
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface PatientCreateDto {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  phoneNumber: string;
  email?: string;
  permanentAddress: string;
  currentAddress?: string;
  profileImageUrl?: string;
  governmentIdType: GovernmentIdType;
  governmentIdNumber: string;
  governmentIdDocumentUrl: string;
}

export interface PatientUpdateDto {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: Gender;
  phoneNumber?: string;
  email?: string;
  permanentAddress?: string;
  currentAddress?: string;
  profileImageUrl?: string;
}

export interface PatientFilter {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  dateOfBirth_lte?: string;
  dateOfBirth_gte?: string;
  gender?: Gender;
  phoneNumber?: string;
  email?: string;
  permanentAddress?: string;
  currentAddress?: string;
}

export interface PatientResponseDto {
  patientId: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phoneNumber: string;
  email?: string | null;
  permanentAddress: string;
  currentAddress?: string | null;
  profileImageUrl?: string | null;
  verification?: VerificationResponseDto;
}

export interface VerificationResponseDto {
  verificationId: number;
  governmentIdType: GovernmentIdType;
  governmentIdNumber: string;
  governmentIdDocumentUrl: string;
  verificationStatus: VerificationStatus;
}

// Donation Request Types
export enum DonationRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface PrescribedMedicine {
  medicineId?: number;
  id?: number;
  medicine: string;
  amount: number;
}

export interface DonationRequestCreateDto {
  patientId: number;
  title: string;
  description: string;
  prescriptionUrl: string;
  expectedDate: string;
  hospitalName: string;
  images?: string[];
  documents?: string[];
  prescribedMedicines: PrescribedMedicine[];
}

export interface DonationRequestUpdateDto {
  title?: string;
  description?: string;
  prescriptionUrl?: string;
  expectedDate?: string;
  hospitalName?: string;
  images?: string[];
  documents?: string[];
  prescribedMedicines?: PrescribedMedicine[];
}

export interface DonationRequestConfirmDto {
  status: DonationRequestStatus;
  messageToPatient?: string;
}

export interface DonationRequestResponseDto {
  requestId: number;
  patientId: number;
  title: string;
  description: string;
  prescriptionUrl: string;
  status: DonationRequestStatus;
  createdAt: string;
  expectedDate: string;
  hospitalName: string;
  messageToPatient?: string;
  adminId?: number;
  adminApprovedAt?: string;
  defaultPrice?: number;
  images?: string[];
  documents?: string[];
  prescribedMedicines?: PrescribedMedicine[];
}

export interface DonationRequest {
  requestId: number;
  description: string;
  createdAt: string;
  documents?: string[];
  prescribedMedicines: PrescribedMedicine[];
  title?: string;
  status?: DonationRequestStatus;
  expectedDate?: string;
  hospitalName?: string;
}

// Drug Importer Types
export interface DrugImporterRegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  address?: string;
  licenseNumber: string;
  website?: string;
  nic?: string;
  additionalText?: string;
  nicotineProofUrl?: string;
  licenseProofUrl?: string;
}

export interface DrugImporterUpdateRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  licenseNumber?: string;
  website?: string;
  nic?: string;
  additionalText?: string;
  removeNicotineProof?: boolean;
  removeLicenseProof?: boolean;
  nicotineProofUrl?: string;
  licenseProofUrl?: string;
}

export interface DrugImporterRequestDetailDto {
  donationRequest: DonationRequestResponseDto;
  patient: PatientResponseDto;
  requestStatus: RequestStatus;
}

export interface DonationRequestResponse {
  donationRequest: DonationRequest;
  patient: Patient;
  requestStatus?: RequestStatus;
}

// Quotation Types
export enum RequestStatusEnum {
  PENDING = 'PENDING',
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  DRAFT = 'DRAFT',
  SEND = 'SEND',
  REJECT = 'REJECT'
}

export enum QuotationStatusEnum {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED'
}

export interface UpdateRequest {
  status: RequestStatusEnum;
}

export interface MedicinePrice {
  medicineId: number;
  price: number;
  name?: string;
  quantity?: number;
}

export interface QuotationMedicinePriceDTO {
  id?: number;
  medicineId: number;
  price: number;
  medicine?: string;
  amount?: number;
}

export interface QuotationStatusDTO {
  id: number;
  requestId: number;
  drugImporterId: number;
  status: QuotationStatusEnum | string;
  createdDate: string;
  updatedDate: string;
}

export interface QuotationFormData {
  requestId: number;
  drugImporterId: number;
  status: string;
  discount: number;
  validityDays: number;
  notes: string;
  medicinePrices: MedicinePrice[];
}

export interface QuotationDTO {
  id?: number;
  drugImporterId: number;
  requestId: number;
  discount?: number;
  notes?: string;
  validityDays?: number;
  validityEndDate?: string;
  createdDate?: string;
  updatedDate?: string;
  medicinePrices: QuotationMedicinePriceDTO[];
  quotationStatus?: QuotationStatusDTO;
  status?: RequestStatusEnum;
}

export interface QuotationResponse {
  id: number;
  drugImporterId: number;
  requestId: number;
  discount?: number;
  status?: string;
  createdDate?: string;
  updatedDate?: string;
  medicinePrices?: QuotationMedicinePriceDTO[];
}

export interface Patient {
  firstName: string;
  lastName: string;
  email: string | null;
  phoneNumber: string | null;
  patientId?: number;
  dateOfBirth?: string;
  gender?: string;
  permanentAddress?: string;
  currentAddress?: string | null;
  profileImageUrl?: string | null;
}

export interface RequestStatus {
  id: number;
  requestId: number;
  drugImporterId: number;
  status: RequestStatusEnum;
}

export interface RequestStatusResponse {
  id: number;
  requestId: number;
  drugImporterId: number;
  status: RequestStatusEnum;
}

// Pagination and Response Types
export interface Pagination {
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface ApiResponse<T> {
  timestamp: string;
  status: number;
  data: T;
  message: string;
  error?: string;
  path?: string;
  pagination?: Pagination;
}

export interface Pageable {
  page: number;
  size: number;
  sort?: string[];
}

export interface DrugImporterResponse {
  id: number;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  licenseNumber?: string;
  nicotineProofFilePath?: string;
  licenseProofFilePath?: string;
  enabled: boolean;
}