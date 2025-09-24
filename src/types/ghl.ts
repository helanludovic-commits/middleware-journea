export interface GHLContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  customFields?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface GHLCustomObject {
  id: string;
  contactId: string;
  name: string;
  data: Record<string, any>;
}

export interface GHLApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}