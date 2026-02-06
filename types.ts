
export type ComplexName = 'Casa de Esperanza' | 'Casa de Los Sueños' | string;

export type UserRole = 'RESIDENT' | 'PM_MANAGER' | 'PM_STAFF' | 'SECURITY' | 'SUPERVISOR' | 'SUPER_ADMIN';

export interface Credentials {
  username: string;
  password: string;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  actor: string;
  action: string;
  details: string;
}

export interface PropertyRequest {
  id: string;
  propertyName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestDate: number;
  credentials?: Credentials;
  managerName?: string;
  contactEmail?: string;
  address?: string; // Street Address
  state?: string;
  city?: string;
  zipCode?: string;
  phoneNumber?: string;
}

export interface ManagementStaffRequest {
  id: string;
  propertyName: string;
  firstName: string;
  lastName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestDate: number;
  credentials?: Credentials;
}

export interface SecurityOfficerRequest {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestDate: number;
  credentials?: Credentials;
  firstName: string;
  lastName: string;
  badgeNumber: string;
  onDutyProperty?: string;
}

export interface ResidentProfile {
  id: string;
  complex: ComplexName;
  unitNumber: string;
  firstName: string;
  middleInitial?: string;
  lastName: string;
  dateOfBirth: string;
  moveInDate: string;
  leaseExpirationDate: string;
  dlNumber: string;
  dlImageUrl: string;
  residentImageUrl: string;
  residentIdCardUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  credentials?: Credentials;
  notes?: string;
  internalSecurityNotes?: string[];
  acceptingVisitors: boolean;
  allowedVisitors: string[];
}

export type MaintenanceType = 'Lights Out' | 'Broken Fence' | 'Broken Window' | 'Gate Malfunction';

export interface MaintenanceRequest {
  id: string;
  type: MaintenanceType;
  details: string;
  reportedBy: string;
  reportedAt: number;
  propertyName: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  adminNotes?: string;
}

export interface AlertNote {
  id: string;
  residentId: string;
  residentName: string;
  unitNumber: string;
  propertyName: string;
  officerName: string;
  details: string;
  timestamp: number;
  thermsStatus: 'YES' | 'NO' | 'NOT_YET';
  thermsReportNumber?: string;
  attachmentUrl?: string;
  status: 'UNDER_REVIEW' | 'STORED_INTERNAL' | 'FORWARDED_TO_PM';
}

export interface VisitorProfile {
  id: string;
  residentId: string;
  residentUnit: string;
  complex: ComplexName;
  firstName: string;
  lastName: string;
  visitorImageUrl?: string; 
  visitorIdImageUrl?: string; 
  relationship: string;
  vehicleInfo?: string; // Make, Model, Plate
  checkInTime: number;
  expectedDurationHours: number; 
  expirationTime: number; 
  checkOutTime?: number;
  status: 'ACTIVE' | 'CHECKED_OUT' | 'OVERSTAYED';
  reEntryWithoutCheckOut?: boolean;
}

export interface ResidentCheckInLog {
  id: string;
  residentId: string;
  residentName: string;
  propertyName: string;
  timestamp: number;
  officerName: string;
  status: 'GRANTED' | 'DENIED';
  searchQuery: string;
}

export interface VisitorOverstayAlert {
  id: string;
  visitorName: string;
  residentName: string;
  unitNumber: string;
  propertyName: string;
  consecutiveDays: number;
  lastCheckIn: number;
}
