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
    
    const locationId = process.env.GHL_LOC