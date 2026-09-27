import { InspectorUser, Institution, InspectionCheckItem } from '../types';

export const DEMO_INSPECTORS: InspectorUser[] = [
  {
    id: 'insp-001',
    name: 'Dr. Anand Verma',
    username: 'anand.verma',
    role: 'FIELD_INSPECTOR',
    designation: 'Senior Monitoring & Field Evaluation Officer',
    zone: 'North Zone - Uttar Pradesh (Central)',
    badgeNumber: 'MoSJE-INSP-2026-9501',
    phone: '+91 98765 43210',
    email: 'anand.verma@gov.mosje.in'
  },
  {
    id: 'insp-002',
    name: 'Meenakshi Sundaram',
    username: 'meenakshi.s',
    role: 'NODAL_OFFICER',
    designation: 'Central Nodal Review Officer & Joint Secretary Secretariat',
    zone: 'MoSJE HQ - Shastri Bhawan, New Delhi',
    badgeNumber: 'MoSJE-HQ-8821',
    phone: '+91 98110 54321',
    email: 'm.sundaram@gov.mosje.in'
  }
];

export const INITIAL_INSTITUTIONS: Institution[] = [
  {
    id: 'inst-101',
    code: 'MOSJE/UP/SC/2026/092',
    name: 'Shanti Niketan Vridhashram & Senior Citizen Home',
    scheme: 'Atal Vayo Abhyuday Yojana (AVAY)',
    category: 'Senior Citizen Home (AVAY)',
    address: 'Plot 14, Sector 7, Gomti Nagar Extension',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
    targetLat: 26.8467,
    targetLng: 80.9462,
    sanctionedCapacity: 50,
    registeredBeneficiaries: 46,
    lastInspectionDate: '2025-11-14',
    nextScheduledDate: '2026-09-26',
    status: 'SCHEDULED',
    assignedInspector: 'Dr. Anand Verma',
    complianceGrade: 'A',
    grantStatus: 'Active'
  },
  {
    id: 'inst-102',
    code: 'MOSJE/UP/IRC/2026/184',
    name: 'Navchetna Drug De-Addiction & Rehabilitation Centre',
    scheme: 'National Action Plan for Drug Demand Reduction (NAPDDR)',
    category: 'De-Addiction Centre (IRCA/NAPDDR)',
    address: 'Near Old Cantt Road, Lanka',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    targetLat: 25.2820,
    targetLng: 82.9995,
    sanctionedCapacity: 30,
    registeredBeneficiaries: 28,
    lastInspectionDate: '2026-02-10',
    nextScheduledDate: '2026-09-28',
    status: 'SCHEDULED',
    assignedInspector: 'Dr. Anand Verma',
    complianceGrade: 'B',
    grantStatus: 'Active'
  },
  {
    id: 'inst-103',
    code: 'MOSJE/UP/DDRC/2026/045',
    name: 'District Disability Rehabilitation Centre (DDRC)',
    scheme: 'Rights of Persons with Disabilities Act (SIPDA)',
    category: 'Disability Rehab Centre (DDRC)',
    address: 'Civil Lines, Opposite District Hospital',
    district: 'Kanpur Nagar',
    state: 'Uttar Pradesh',
    targetLat: 26.4712,
    targetLng: 80.3318,
    sanctionedCapacity: 120,
    registeredBeneficiaries: 114,
    lastInspectionDate: '2026-08-19',
    nextScheduledDate: '2026-10-02',
    status: 'SCHEDULED',
    assignedInspector: 'Dr. Anand Verma',
    complianceGrade: 'A+',
    grantStatus: 'Active'
  },
  {
    id: 'inst-104',
    code: 'MOSJE/UP/SCH/2026/220',
    name: 'Snehalaya Senior Citizen Care & Assisted Living Home',
    scheme: 'Integrated Programme for Senior Citizens (IPSrC)',
    category: 'Senior Citizen Home (AVAY)',
    address: '42/A, Civil Lines, Near Circuit House',
    district: 'Prayagraj',
    state: 'Uttar Pradesh',
    targetLat: 25.4358,
    targetLng: 81.8463,
    sanctionedCapacity: 60,
    registeredBeneficiaries: 58,
    lastInspectionDate: '2026-01-15',
    nextScheduledDate: '2026-10-08',
    status: 'SCHEDULED',
    assignedInspector: 'Dr. Anand Verma',
    complianceGrade: 'A',
    grantStatus: 'Active'
  },
  {
    id: 'inst-105',
    code: 'MOSJE/UP/RC/2026/115',
    name: 'Prerna De-Addiction & Community Rehabilitation Centre',
    scheme: 'Nasha Mukt Bharat Abhiyaan',
    category: 'De-Addiction Centre (IRCA/NAPDDR)',
    address: 'B-12 Industrial Area, Naini',
    district: 'Prayagraj',
    state: 'Uttar Pradesh',
    targetLat: 25.3900,
    targetLng: 81.8700,
    sanctionedCapacity: 40,
    registeredBeneficiaries: 37,
    lastInspectionDate: '2025-12-20',
    nextScheduledDate: '2026-10-15',
    status: 'SCHEDULED',
    assignedInspector: 'Dr. Anand Verma',
    complianceGrade: 'B',
    grantStatus: 'Active'
  },
  {
    id: 'inst-106',
    code: 'MOSJE/UP/YAS/2026/310',
    name: 'PM-YASASVI Residential Welfare Hostel',
    scheme: 'PM Young Achievers Scholarship Scheme (PM-YASASVI)',
    category: 'Residential Hostel (PM-YASASVI)',
    address: 'Campus-2, Taramandal Road',
    district: 'Gorakhpur',
    state: 'Uttar Pradesh',
    targetLat: 26.7606,
    targetLng: 83.3732,
    sanctionedCapacity: 100,
    registeredBeneficiaries: 95,
    lastInspectionDate: '2025-10-02',
    nextScheduledDate: '2026-10-22',
    status: 'SCHEDULED',
    assignedInspector: 'Dr. Anand Verma',
    complianceGrade: 'A',
    grantStatus: 'Active'
  }
];

export const STANDARD_CHECKLIST: InspectionCheckItem[] = [
  {
    id: 'chk-1',
    category: 'Infrastructure & Safety',
    question: 'Physical premises accessible with wheelchair ramps and tactile paving (Sugamya Bharat Abhiyan compliance)',
    status: 'passed',
    remarks: 'Entrance ramp gradient satisfies 1:12 standard with dual handrails',
    isMandatory: true,
    scoreWeight: 15
  },
  {
    id: 'chk-2',
    category: 'Infrastructure & Safety',
    question: 'Valid Fire Safety NOC displayed, working extinguishers and emergency exit plan functional',
    status: 'passed',
    remarks: 'Fire extinguishers inspected in May 2026; mock drill conducted',
    isMandatory: true,
    scoreWeight: 10
  },
  {
    id: 'chk-3',
    category: 'Beneficiary Care & Count',
    question: 'Physical head-count matches the live biometric/Aadhaar attendance register',
    status: 'passed',
    remarks: '44 residents present physically; 2 on permitted hospital leave with gate pass',
    isMandatory: true,
    scoreWeight: 20
  },
  {
    id: 'chk-4',
    category: 'Hygiene & Food',
    question: 'Hygienic kitchen with nutritional diet chart approved by licensed dietician/medical officer',
    status: 'passed',
    remarks: 'RO water purifier operational with TDS log; clean pantry',
    isMandatory: true,
    scoreWeight: 15
  },
  {
    id: 'chk-5',
    category: 'Medical & Staff Attendance',
    question: 'Duty doctor/nurse logbook updated with vital signs and emergency contact registers',
    status: 'passed',
    remarks: 'Doctor visits every alternate day; medicine stock within expiry date',
    isMandatory: true,
    scoreWeight: 15
  },
  {
    id: 'chk-6',
    category: 'Medical & Staff Attendance',
    question: 'Full sanctioned staff (counselor, warden, cook, caregiver) present and biometric punched',
    status: 'conditional',
    remarks: 'Warden present; night caregiver absent on unapproved leave, substitute deployed',
    isMandatory: false,
    scoreWeight: 10
  },
  {
    id: 'chk-7',
    category: 'Statutory & Financials',
    question: 'MoSJE grant-in-aid expenditure register and PFMS linked passbook verified',
    status: 'passed',
    remarks: 'PFMS expenditure vouchers tally with approved sub-heads',
    isMandatory: true,
    scoreWeight: 15
  }
];
