export type InspectionCondition = 'Normal' | 'Need more improvement' | 'Very bad condition';

export interface InspectionPhotoData {
  imageUrl: string;
  originalImageUrl?: string;
  enhancedImageUrl?: string;
  isAiEnhanced?: boolean;
  aiEnhancementDetails?: {
    sharpnessBoost: number;
    contrastBoost: number;
    brightnessBoost: number;
    dehazed: boolean;
  };
  rotationDegrees: number;
  latitude: number;
  longitude: number;
  areaName: string;
  pincode: string;
  date: string; // DD/MM/YYYY
  time: string; // e.g. 10:30 AM
}

export interface InspectionItemSection {
  id: string;
  itemName: string;
  condition: InspectionCondition;
  photo?: InspectionPhotoData;
  detailedDescription: string;
}

export interface InspectorUser {
  id: string;
  name: string;
  username: string;
  role: 'FIELD_INSPECTOR' | 'NODAL_OFFICER' | 'ADMIN';
  designation: string;
  zone: string;
  badgeNumber: string;
  phone: string;
  email: string;
}

export type InstitutionCategory = 
  | 'Senior Citizen Home (AVAY)'
  | 'De-Addiction Centre (IRCA/NAPDDR)'
  | 'Disability Rehab Centre (DDRC)'
  | 'Residential Hostel (PM-YASASVI)';

export interface InspectionCheckItem {
  id: string;
  category: 'Infrastructure & Safety' | 'Beneficiary Care & Count' | 'Hygiene & Food' | 'Medical & Staff Attendance' | 'Statutory & Financials';
  question: string;
  status: 'passed' | 'failed' | 'conditional' | 'pending';
  remarks?: string;
  isMandatory: boolean;
  scoreWeight: number;
}

export interface InspectionEvidence {
  id: string;
  tag: string;
  imageUrl: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  hashSignature: string;
}

export interface Institution {
  id: string;
  code: string;
  name: string;
  scheme: string;
  category: InstitutionCategory;
  address: string;
  district: string;
  state: string;
  targetLat: number;
  targetLng: number;
  sanctionedCapacity: number;
  registeredBeneficiaries: number;
  lastInspectionDate: string;
  nextScheduledDate: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  assignedInspector: string;
  complianceGrade?: 'A+' | 'A' | 'B' | 'C' | 'CRITICAL';
  grantStatus: 'Active' | 'Under Review' | 'Flagged';
}

export interface InspectionReport {
  id: string;
  institutionId: string;
  institutionName: string;
  category: InstitutionCategory;
  inspectorId: string;
  inspectorName: string;
  date: string;
  timeStarted: string;
  timeFinished?: string;
  geofenceVerified: boolean;
  actualBeneficiariesCount: number;
  registeredBeneficiariesCount: number;
  checklist: InspectionCheckItem[];
  evidences: InspectionEvidence[];
  overallScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'CRITICAL';
  status: 'DRAFT_OFFLINE' | 'SYNCED' | 'SUBMITTED_FOR_REVIEW';
  aiAnomalyNotes: string[];
  inspectorNotes: string;
  syncTimestamp?: string;
  inspectionSections?: InspectionItemSection[];
  inspectorPhoto?: InspectionPhotoData;
}
