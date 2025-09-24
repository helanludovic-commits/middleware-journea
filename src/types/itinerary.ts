export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  data: string;
  uploadedAt: string;
}

export interface TravelElement {
  id: string;
  type: 'accommodation' | 'transport' | 'activity' | 'restaurant' | 'procedure';
  name: string;
  details: Record<string, any>;
  files?: FileAttachment[];
}

export interface Day {
  id: string;
  name: string;
  elements: TravelElement[];
}

export interface ClientData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface Itinerary {
  id: string;
  title: string;
  days: Day[];
  clientData: ClientData;
  createdAt: string;
  updatedAt: string;
}