'use client';

import { useState, useEffect } from 'react';
import ModernItineraryKanban from '@/components/ModernItineraryKanban';
import { Navbar } from '@/components/Navbar';
import { Itinerary, Client } from '@/types';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Charger les clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('nom');
      
      if (clientsError) throw clientsError;
      setClients(clientsData || []);

      // Charger les itinéraires avec les relations
      const { data: itinerariesData, error: itinerariesError } = await supabase
        .from('itineraires')
        .select(`
          *,
          client:clients(*)
        `)
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
        // Recharger les données après la synchronisation
        await loadData();
      } else {
        throw new Error('Erreur lors de la synchronisation GHL');
      }
    } catch (err) {
      console.error('Erreur GHL Sync:', err);
      setError('Erreur lors de la synchronisation avec GoHighLevel');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Erreur</h2>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={loadData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Réessayer
          </button>
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
            Gestion des Itinéraires
          </h1>
          <p className="text-gray-600">
            {itineraries.length} itinéraire{itineraries.length > 1 ? 's' : ''} • {clients.length} client{clients.length > 1 ? 's' : ''}
          </p>
        </div>
        
        <ModernItineraryKanban
          itineraries={itineraries}
          clients={clients}
          onItineraryUpdate={handleItineraryUpdate}
          onItineraryDelete={handleItineraryDelete}
        />
      </div>
    </div>
  );
}