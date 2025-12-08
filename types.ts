
export interface Company {
  id: string;
  name: string;
  createdAt: number;
}

export interface Department {
  id: string;
  name: string;
  companyId: string;
}

export type CooperationStatus = -2 | -1 | 0 | 1 | 2;

export interface Customer {
  id: string;
  companyId: string;
  name: string;
  phone?: string;
  email?: string;
  hometown?: string; // Format: "Province-City-District"
  hobbies?: string;
  familyInfo?: string;
  departmentId?: string; // Links to Department
  jobTitle?: string;
  managerId?: string; // Links to another Customer
  notes?: string;
  status?: CooperationStatus;
  photo?: string; // Base64 string
  createdAt: number;
}

// Helper types for UI
export interface OrgNode extends Customer {
  children?: OrgNode[];
  depth?: number;
  x?: number;
  y?: number;
}
