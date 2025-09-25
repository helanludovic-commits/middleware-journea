'use client';

import { useState, useEffect } from 'react';
import { ModernItineraryKanban } from '@/components/ModernItineraryKanban';
import { Navbar } from '@/components/Navbar';
import { Itinerary, Client } from '@/types';
import { supabase } from '@/lib/supabase';

interface PageProps {
  params: Promise<{ clientId: string }>;
}

export default async function ItineraryClientPage({ params }: PageProps) {
  // Attendre la résolution des params
  const { clientId } = await params;
  
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (clientId) {
      loadData();
    }
  }, [clientId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Charger le client spécifique
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();
      
      if (clientError) throw clientError;
      setClient(clientData);

      // Charger les itinéraires du client
      const { data: itinerariesData, error: itinerariesError } = await supabase
        .from('itineraires')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      
      if (itinerariesError) throw itinerariesError;
      setItineraries(itinerariesData || []);
      
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleItineraryUpdate = (updatedItinerary: Itinerary) => {
    setItineraries(prev => 
      prev.map(item => 
        item.id === updatedItinerary.id ? updatedItinerary : item
      )
    );
  };

  const handleItineraryDelete = (itineraryId: string) => {
    setItineraries(prev => prev.filter(item => item.id !== itineraryId));
  };

  const handleGHLSync = async () => {
    try {
      const response = await fetch('/api/ghl-sync', {
        method: 'POST',
      });
      
      if (response.ok) {
        await loadData();
      }
    } catch (err) {
      console.error('Erreur GHL Sync:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Erreur</h2>
          <p className="text-gray-600">{error || 'Client introuvable'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onGHLSync={handleGHLSync} />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Itinéraires de {client.n