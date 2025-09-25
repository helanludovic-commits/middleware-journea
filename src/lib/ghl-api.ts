import { createClient, updateClient, createItinerary, updateItinerary, getClientByGHLId, getItineraryByGHLId } from './supabase';
import { Client, Itinerary } from '@/types';

// Types GHL
interface GHLContact {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  dateAdded: string;
  dateUpdated: string;
}

interface GHLOpportunity {
  id: string;
  name: string;
  monetaryValue: number;
  pipelineId: string;
  pipelineStageId: string;
  status: string;
  contactId: string;
  dateCreated: string;
  dateUpdated: string;
  customFields?: Array<{
    id: string;
    fieldKey: string;
    name: string;
    value: string;
  }>;
}

interface GHLPipeline {
  id: string;
  name: string;
  stages: Array<{
    id: string;
    name: string;
    position: number;
  }>;
}

class GHLApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'GHLApiError';
  }
}

const GHL_BASE_URL = 'https://services.leadconnectorhq.com';
const API_VERSION = 'v1';

async function makeGHLRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${GHL_BASE_URL}/${API_VERSION}/${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`GHL API Error [${response.status}]:`, errorText);
    throw new GHLApiError(
      `GHL API request failed: ${response.status} ${response.statusText}`,
      response.status
    );
  }

  return response.json();
}

export async function getGHLContacts(): Promise<GHLContact[]> {
  try {
    console.log('🔍 Récupération des contacts GHL...');
    
    const locationId = process.env.GHL_LOCATION_ID;
    if (!locationId) {
      throw new Error('GHL_LOCATION_ID manquant');
    }

    const response = await makeGHLRequest<{ contacts: GHLContact[] }>(
      `contacts/?locationId=${locationId}&limit=100`
    );

    console.log(`✅ ${response.contacts?.length || 0} contacts récupérés`);
    return response.contacts || [];
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des contacts GHL:', error);
    throw error;
  }
}

export async function getGHLOpportunities(): Promise<GHLOpportunity[]> {
  try {
    console.log('🎯 Récupération des opportunités GHL...');
    
    const locationId = process.env.GHL_LOCATION_ID;
    if (!locationId) {
      throw new Error('GHL_LOCATION_ID manquant');
    }

    const response = await makeGHLRequest<{ opportunities: GHLOpportunity[] }>(
      `opportunities/search?location_id=${locationId}&limit=100`
    );

    console.log(`✅ ${response.opportunities?.length || 0} opportunités récupérées`);
    return response.opportunities || [];
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des opportunités GHL:', error);
    throw error;
  }
}

export async function getGHLPipelines(): Promise<GHLPipeline[]> {
  try {
    console.log('📋 Récupération des pipelines GHL...');
    
    const locationId = process.env.GHL_LOCATION_ID;
    if (!locationId) {
      throw new Error('GHL_LOCATION_ID manquant');
    }

    const response = await makeGHLRequest<{ pipelines: GHLPipeline[] }>(
      `opportunities/pipelines?locationId=${locationId}`
    );

    console.log(`✅ ${response.pipelines?.length || 0} pipelines récupérés`);
    return response.pipelines || [];
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des pipelines GHL:', error);
    throw error;
  }
}

export async function syncGHLContacts(): Promise<{ synced: number; errors: number }> {
  let synced = 0;
  let errors = 0;

  try {
    const ghlContacts = await getGHLContacts();
    
    for (const ghlContact of ghlContacts) {
      try {
        // Construire le nom complet
        const nom = ghlContact.name || 
          [ghlContact.firstName, ghlContact.lastName].filter(Boolean).join(' ') ||
          'Contact sans nom';

        // Vérifier si le client existe déjà
        const existingClient = await getClientByGHLId(ghlContact.id);
        
        if (existingClient) {
          // Mettre à jour le client existant
          await updateClient(existingClient.id, {
            nom,
            email: ghlContact.email || existingClient.email,
            telephone: ghlContact.phone || existingClient.telephone,
            updated_at: new Date().toISOString(),
          });
          console.log(`📝 Client mis à jour: ${nom}`);
        } else {
          // Créer un nouveau client
          await createClient({
            nom,
            email: ghlContact.email,
            telephone: ghlContact.phone,
            ghl_contact_id: ghlContact.id,
          });
          console.log(`➕ Nouveau client créé: ${nom}`);
        }
        
        synced++;
      } catch (error) {
        console.error(`❌ Erreur lors de la synchronisation du contact ${ghlContact.id}:`, error);
        errors++;
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur générale lors de la synchronisation des contacts:', error);
    errors++;
  }

  return { synced, errors };
}

function mapGHLStatusToItineraryStatus(ghlStageId: string): 'en_attente' | 'en_cours' | 'valide' | 'archive' {
  // Cette fonction doit être adaptée en fonction de votre configuration GHL
  // Pour l'instant, une logique simple basée sur des noms communs
  const stageMapping: Record<string, 'en_attente' | 'en_cours' | 'valide' | 'archive'> = {
    // Vous devrez adapter ces IDs en fonction de vos pipelines GHL réels
    'new': 'en_attente',
    'contacted': 'en_cours',
    'qualified': 'en_cours',
    'proposal': 'en_cours',
    'negotiation': 'en_cours',
    'won': 'valide',
    'lost': 'archive',
    'closed': 'archive',
  };

  return stageMapping[ghlStageId] || 'en_attente';
}

export async function syncGHLOpportunities(): Promise<{ synced: number; errors: number }> {
  let synced = 0;
  let errors = 0;

  try {
    const [ghlOpportunities, pipelines] = await Promise.all([
      getGHLOpportunities(),
      getGHLPipelines()
    ]);
    
    // Créer un mapping des stages pour la conversion de statut
    const stageMapping = new Map<string, string>();
    pipelines.forEach(pipeline => {
      pipeline.stages.forEach(stage => {
        stageMapping.set(stage.id, stage.name.toLowerCase());
      });
    });
    
    for (const ghlOpportunity of ghlOpportunities) {
      try {
        // Trouver le client correspondant
        const client = await getClientByGHLId(ghlOpportunity.contactId);
        if (!client) {
          console.warn(`⚠️ Client non trouvé pour l'opportunité ${ghlOpportunity.id}`);
          errors++;
          continue;
        }

        // Extraire les informations de l'opportunité
        const stageName = stageMapping.get(ghlOpportunity.pipelineStageId) || '';
        const statut = mapGHLStatusToItineraryStatus(stageName);

        // Chercher des champs personnalisés pour plus d'informations
        const destination = ghlOpportunity.customFields?.find(
          field => field.fieldKey.toLowerCase().includes('destination')
        )?.value;

        const dateDebut = ghlOpportunity.customFields?.find(
          field => field.fieldKey.toLowerCase().includes('date_debut') || 
                  field.fieldKey.toLowerCase().includes('start_date')
        )?.value;

        const dateFin = ghlOpportunity.customFields?.find(
          field => field.fieldKey.toLowerCase().includes('date_fin') || 
                  field.fieldKey.toLowerCase().includes('end_date')
        )?.value;

        const nbVoyageurs = ghlOpportunity.customFields?.find(
          field => field.fieldKey.toLowerCase().includes('voyageurs') || 
                  field.fieldKey.toLowerCase().includes('travelers')
        )?.value;

        // Vérifier si l'itinéraire existe déjà
        const existingItinerary = await getItineraryByGHLId(ghlOpportunity.id);
        
        if (existingItinerary) {
          // Mettre à jour l'itinéraire existant
          await updateItinerary(existingItinerary.id, {
            titre: ghlOpportunity.name,
            budget: ghlOpportunity.monetaryValue || existingItinerary.budget,
            statut,
            destination: destination || existingItinerary.destination,
            date_debut: dateDebut || existingItinerary.date_debut,
            date_fin: dateFin || existingItinerary.date_fin,
            nb_voyageurs: nbVoyageurs ? parseInt(nbVoyageurs) : existingItinerary.nb_voyageurs,
            updated_at: new Date().toISOString(),
          });
          console.log(`📝 Itinéraire mis à jour: ${ghlOpportunity.name}`);
        } else {
          // Créer un nouvel itinéraire
          await createItinerary({
            titre: ghlOpportunity.name,
            client_id: client.id,
            budget: ghlOpportunity.monetaryValue,
            statut,
            destination,
            date_debut: dateDebut,
            date_fin: dateFin,
            nb_voyageurs: nbVoyageurs ? parseInt(nbVoyageurs) : null,
            ghl_opportunity_id: ghlOpportunity.id,
          });
          console.log(`➕ Nouvel itinéraire créé: ${ghlOpportunity.name}`);
        }
        
        synced++;
      } catch (error) {
        console.error(`❌ Erreur lors de la synchronisation de l'opportunité ${ghlOpportunity.id}:`, error);
        errors++;
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur générale lors de la synchronisation des opportunités:', error);
    errors++;
  }

  return { synced, errors };
}

export async function updateGHLOpportunity(
  opportunityId: string, 
  updates: Partial<GHLOpportunity>
): Promise<void> {
  try {
    await makeGHLRequest(`opportunities/${opportunityId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    console.log(`✅ Opportunité GHL mise à jour: ${opportunityId}`);
  } catch (error) {
    console.error(`❌ Erreur lors de la mise à jour de l'opportunité GHL ${opportunityId}:`, error);
    throw error;
  }
}