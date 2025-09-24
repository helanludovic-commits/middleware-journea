import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Types pour les tables Supabase
export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          nom: string;
          email: string | null;
          telephone: string | null;
          ghl_contact_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nom: string;
          email?: string | null;
          telephone?: string | null;
          ghl_contact_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nom?: string;
          email?: string | null;
          telephone?: string | null;
          ghl_contact_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      itineraires: {
        Row: {
          id: string;
          titre: string;
          description: string | null;
          destination: string | null;
          date_debut: string | null;
          date_fin: string | null;
          nb_voyageurs: number | null;
          budget: number | null;
          statut: 'en_attente' | 'en_cours' | 'valide' | 'archive';
          client_id: string;
          ghl_opportunity_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          titre: string;
          description?: string | null;
          destination?: string | null;
          date_debut?: string | null;
          date_fin?: string | null;
          nb_voyageurs?: number | null;
          budget?: number | null;
          statut?: 'en_attente' | 'en_cours' | 'valide' | 'archive';
          client_id: string;
          ghl_opportunity_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          titre?: string;
          description?: string | null;
          destination?: string | null;
          date_debut?: string | null;
          date_fin?: string | null;
          nb_voyageurs?: number | null;
          budget?: number | null;
          statut?: 'en_attente' | 'en_cours' | 'valide' | 'archive';
          client_id?: string;
          ghl_opportunity_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// Fonctions utilitaires pour les opérations courantes
export async function createClient(clientData: Database['public']['Tables']['clients']['Insert']) {
  const { data, error } = await supabase
    .from('clients')
    .insert({
      ...clientData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateClient(id: string, clientData: Database['public']['Tables']['clients']['Update']) {
  const { data, error } = await supabase
    .from('clients')
    .update({
      ...clientData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteClient(id: string) {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function createItinerary(itineraryData: Database['public']['Tables']['itineraires']['Insert']) {
  const { data, error } = await supabase
    .from('itineraires')
    .insert({
      ...itineraryData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateItinerary(id: string, itineraryData: Database['public']['Tables']['itineraires']['Update']) {
  const { data, error } = await supabase
    .from('itineraires')
    .update({
      ...itineraryData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteItinerary(id: string) {
  const { error } = await supabase
    .from('itineraires')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getClientByGHLId(ghlContactId: string) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('ghl_contact_id', ghlContactId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
  return data;
}

export async function getItineraryByGHLId(ghlOpportunityId: string) {
  const { data, error } = await supabase
    .from('itineraires')
    .select('*')
    .eq('ghl_opportunity_id', ghlOpportunityId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}