'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Calendar, MapPin, Clock, User, Phone, Mail, FileText } from 'lucide-react';
import { Itinerary, Client } from '@/types';
import { supabase } from '@/lib/supabase';

export default function ClientPortalPage() {
  const params = useParams();
  const clientId = params.id as string;
  
  const [client, setClient] = useState<Client | null>(null);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (clientId) {
      loadClientData();
    }
  }, [clientId]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      
      // Charger les données du client
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
        .order('date_debut', { ascending: true });
      
      if (itinerariesError) throw itinerariesError;
      setItineraries(itinerariesData || []);
      
    } catch (err) {
      console.error('Erreur lors du chargement des données client:', err);
      setError('Client introuvable ou erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_attente': return 'bg-yellow-100 text-yellow-800';
      case 'en_cours': return 'bg-blue-100 text-blue-800';
      case 'valide': return 'bg-green-100 text-green-800';
      case 'archive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'en_attente': return 'En attente';
      case 'en_cours': return 'En cours';
      case 'valide': return 'Validé';
      case 'archive': return 'Archivé';
      default: return status;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de votre espace client...</p>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Erreur</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Espace Client - {client.nom}
              </h1>
              <p className="text-gray-600">Vos itinéraires de voyage</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Informations client */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Vos informations</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-gray-400" />
              <span className="text-gray-900">{client.nom}</span>
            </div>
            {client.email && (
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <span className="text-gray-900">{client.email}</span>
              </div>
            )}
            {client.telephone && (
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <span className="text-gray-900">{client.telephone}</span>
              </div>
            )}
            {client.ghl_contact_id && (
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <span className="text-gray-600 text-sm">ID GHL: {client.ghl_contact_id}</span>
              </div>
            )}
          </div>
        </div>

        {/* Liste des itinéraires */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Vos itinéraires ({itineraries.length})
          </h2>
          
          {itineraries.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun itinéraire pour le moment
              </h3>
              <p className="text-gray-600">
                Vos futurs itinéraires de voyage apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {itineraries.map((itinerary) => (
                <div key={itinerary.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {itinerary.titre}
                      </h3>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`status-badge ${getStatusColor(itinerary.statut)}`}>
                          {getStatusLabel(itinerary.statut)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      {itinerary.budget && (
                        <div className="text-lg font-bold text-green-600 mb-1">
                          {itinerary.budget}€
                        </div>
                      )}
                      <div className="text-sm text-gray-500">
                        Créé le {formatDate(itinerary.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    {itinerary.destination && (
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-900">{itinerary.destination}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-900">
                        {itinerary.date_debut ? formatDate(itinerary.date_debut) : 'Date à définir'}
                        {itinerary.date_fin && ` - ${formatDate(itinerary.date_fin)}`}
                      </span>
                    </div>
                    {itinerary.nb_voyageurs && (
                      <div className="flex items-center space-x-3">
                        <User className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-900">
                          {itinerary.nb_voyageurs} voyageur{itinerary.nb_voyageurs > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-900">
                        Dernière mise à jour: {formatDate(itinerary.updated_at)}
                      </span>
                    </div>
                  </div>

                  {itinerary.description && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {itinerary.description}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-16">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-gray-600">
            Pour toute question concernant vos itinéraires, contactez-nous.
          </p>
        </div>
      </div>
    </div>
  );
}