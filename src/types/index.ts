// Types principaux pour l'application de gestion d'itinéraires

export interface Client {
  id: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  ghl_contact_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Itinerary {
  id: string;
  titre: string;
  description: string | null;
  destination: string | null;
  date_debut: string | null;
  date_fin: string | null;
  nb_voyageurs: number | null;
  budget: number | null;
  statut: ItineraryStatus;
  client_id: string;
  ghl_opportunity_id: string | null;
  created_at: string;
  updated_at: string;
  client?: Client; // Relation optionnelle pour les jointures
}

export type ItineraryStatus = 'en_attente' | 'en_cours' | 'valide' | 'archive';

// Types pour les formulaires
export interface CreateClientData {
  nom: string;
  email?: string;
  telephone?: string;
  ghl_contact_id?: string;
}

export interface UpdateClientData extends Partial<CreateClientData> {
  id: string;
}

export interface CreateItineraryData {
  titre: string;
  description?: string;
  destination?: string;
  date_debut?: string;
  date_fin?: string;
  nb_voyageurs?: number;
  budget?: number;
  statut: ItineraryStatus;
  client_id: string;
  ghl_opportunity_id?: string;
}

export interface UpdateItineraryData extends Partial<CreateItineraryData> {
  id: string;
}

// Types pour les colonnes Kanban
export interface KanbanColumn {
  id: ItineraryStatus;
  title: string;
  color: string;
  itineraries: Itinerary[];
}

// Types pour les statistiques
export interface DashboardStats {
  totalItineraries: number;
  totalClients: number;
  totalBudget: number;
  averageBudget: number;
  itinerariesByStatus: Record<ItineraryStatus, number>;
  budgetByStatus: Record<ItineraryStatus, number>;
  recentItineraries: Itinerary[];
  topClients: Array<{
    client: Client;
    itinerariesCount: number;
    totalBudget: number;
  }>;
}

// Types pour les filtres
export interface ItineraryFilters {
  search?: string;
  client_id?: string;
  statut?: ItineraryStatus;
  date_debut_min?: string;
  date_debut_max?: string;
  budget_min?: number;
  budget_max?: number;
  destination?: string;
}

export interface ClientFilters {
  search?: string;
  has_email?: boolean;
  has_phone?: boolean;
  has_ghl_id?: boolean;
}

// Types pour l'API GoHighLevel
export interface GHLContact {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  dateAdded: string;
  dateUpdated: string;
  tags?: string[];
  customFields?: GHLCustomField[];
}

export interface GHLOpportunity {
  id: string;
  name: string;
  monetaryValue: number;
  pipelineId: string;
  pipelineStageId: string;
  status: string;
  contactId: string;
  dateCreated: string;
  dateUpdated: string;
  customFields?: GHLCustomField[];
  notes?: string;
}

export interface GHLCustomField {
  id: string;
  fieldKey: string;
  name: string;
  value: string;
  type?: string;
}

export interface GHLPipeline {
  id: string;
  name: string;
  stages: GHLPipelineStage[];
}

export interface GHLPipelineStage {
  id: string;
  name: string;
  position: number;
}

// Types pour la synchronisation
export interface SyncResult {
  synced: number;
  errors: number;
  details?: string[];
}

export interface GHLSyncStatus {
  configured: boolean;
  lastSync: string | null;
  status: 'ready' | 'syncing' | 'error' | 'not_configured';
  lastSyncResults?: {
    contacts: SyncResult;
    opportunities: SyncResult;
    timestamp: string;
  };
}

// Types pour les notifications/messages
export interface NotificationMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// Types pour les modales
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface ConfirmationModalProps extends ModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

// Types pour les composants de formulaire
export interface FormFieldProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

// Types pour les validations
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Types utilitaires
export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Énumérations
export enum ItineraryStatusEnum {
  EN_ATTENTE = 'en_attente',
  EN_COURS = 'en_cours',
  VALIDE = 'valide',
  ARCHIVE = 'archive',
}

export enum NotificationTypeEnum {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

// Types pour l'export/import
export interface ExportOptions {
  format: 'json' | 'csv' | 'xlsx';
  includeClients: boolean;
  includeItineraries: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  filters?: ItineraryFilters;
}

export interface ImportResult {
  success: number;
  errors: number;
  details: Array<{
    row: number;
    type: 'success' | 'error';
    message: string;
  }>;
}