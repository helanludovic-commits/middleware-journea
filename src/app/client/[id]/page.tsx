'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Calendar, MapPin, User, Bed, Car, Utensils, ClipboardList, ChevronRight, ChevronLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface FileAttachment {
  id: string;
  name: string;
  type: string;
  data: string;
  uploadedAt: string;
}

interface TravelElement {
  id: string;
  type: 'accommodation' | 'transport' | 'activity' | 'restaurant' | 'procedure';
  name: string;
  details: Record<string, any>;
  files?: FileAttachment[];
}

interface Day {
  id: string;
  name: string;
  elements: TravelElement[];
}

interface Itinerary {
  id: string;
  titre: string;
  destination?: string;
  date_debut?: string;
  date_fin?: string;
  nb_voyageurs?: number;
  budget?: number;
  statut: string;
  contenu?: Day[]; // Les jours et éléments
  created_at: string;
  updated_at: string;
  client_id: string;
}

interface Client {
  id: string;
  nom: string;
  email?: string;
  telephone?: string;
}

export default function ClientPortalPage() {
  const params = useParams();
  const itineraryId = params.id as string;
  
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  useEffect(() => {
    if (itineraryId) {
      loadItineraryData();
    }
  }, [itineraryId]);

  const loadItineraryData = async () => {
    try {
      setLoading(true);
      
      // Charger l'itinéraire avec le client
      const { data: itineraryData, error: itineraryError } = await supabase
        .from('itineraires')
        .select(`*, client:clients(*)`)
        .eq('id', itineraryId)
        .single();
      
      if (itineraryError) throw itineraryError;

      // Parser le contenu JSON
      let parsedItinerary = { ...itineraryData };
      if (itineraryData.contenu) {
        try {
          // Si contenu est une string JSON, le parser
          if (typeof itineraryData.contenu === 'string') {
            parsedItinerary.contenu = JSON.parse(itineraryData.contenu);
          }
        } catch (e) {
          console.error('Erreur parsing contenu:', e);
        }
      }

      setItinerary(parsedItinerary);
      setClient(itineraryData.client);
      
    } catch (err) {
      console.error('Erreur lors du chargement de l\'itinéraire:', err);
      setError('Itinéraire introuvable');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getElementIcon = (type: string) => {
    switch (type) {
      case 'accommodation': return <Bed className="w-5 h-5 text-blue-600" />;
      case 'transport': return <Car className="w-5 h-5 text-green-600" />;
      case 'activity': return <MapPin className="w-5 h-5 text-orange-600" />;
      case 'restaurant': return <Utensils className="w-5 h-5 text-purple-600" />;
      case 'procedure': return <ClipboardList className="w-5 h-5 text-lime-600" />;
      default: return <MapPin className="w-5 h-5 text-gray-600" />;
    }
  };

  const getElementTypeLabel = (type: string) => {
    switch (type) {
      case 'accommodation': return 'Hébergement';
      case 'transport': return 'Transport';
      case 'activity': return 'Activité';
      case 'restaurant': return 'Restaurant';
      case 'procedure': return 'Démarche';
      default: return 'Autre';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de votre itinéraire...</p>
        </div>
      </div>
    );
  }

  if (error || !itinerary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Itinéraire introuvable</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const days = itinerary.contenu || [];
  const selectedDay = days[selectedDayIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {itinerary.titre}
              </h1>
              <div className="flex items-center gap-4 text-gray-600">
                {itinerary.destination && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{itinerary.destination}</span>
                  </div>
                )}
                {itinerary.nb_voyageurs && (
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{itinerary.nb_voyageurs} voyageur{itinerary.nb_voyageurs > 1 ? 's' : ''}</span>
                  </div>
                )}
                {itinerary.date_debut && itinerary.date_fin && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(itinerary.date_debut)} - {formatDate(itinerary.date_fin)}</span>
                  </div>
                )}
              </div>
            </div>
            {itinerary.budget && (
              <div className="text-right">
                <div className="text-sm text-gray-600">Budget</div>
                <div className="text-2xl font-bold text-green-600">{itinerary.budget}€</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Informations client */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Vos informations</h2>
              {client && (
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Nom :</span>
                    <span className="ml-2 text-gray-600">{client.nom}</span>
                  </div>
                  {client.email && (
                    <div>
                      <span className="font-medium text-gray-700">Email :</span>
                      <span className="ml-2 text-gray-600">{client.email}</span>
                    </div>
                  )}
                  {client.telephone && (
                    <div>
                      <span className="font-medium text-gray-700">Tél :</span>
                      <span className="ml-2 text-gray-600">{client.telephone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation des jours */}
            {days.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Navigation</h3>
                <div className="space-y-2">
                  {days.map((day, index) => (
                    <button
                      key={day.id}
                      onClick={() => setSelectedDayIndex(index)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        index === selectedDayIndex
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{day.name}</span>
                        <span className="text-xs">{day.elements.length} activité{day.elements.length > 1 ? 's' : ''}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Contenu principal - Détails du jour sélectionné */}
          <div className="lg:col-span-3">
            {days.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Itinéraire en préparation
                </h3>
                <p className="text-gray-600">
                  Votre agent de voyage prépare votre itinéraire détaillé.
                </p>
              </div>
            ) : selectedDay ? (
              <div>
                {/* En-tête du jour */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">{selectedDay.name}</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedDayIndex(Math.max(0, selectedDayIndex - 1))}
                        disabled={selectedDayIndex === 0}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setSelectedDayIndex(Math.min(days.length - 1, selectedDayIndex + 1))}
                        disabled={selectedDayIndex === days.length - 1}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Éléments du jour */}
                <div className="space-y-4">
                  {selectedDay.elements.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                      <p className="text-gray-600">Aucune activité prévue pour ce jour</p>
                    </div>
                  ) : (
                    selectedDay.elements.map((element, index) => (
                      <div key={element.id} className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                              {getElementIcon(element.type)}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-gray-500">
                                {getElementTypeLabel(element.type)}
                              </span>
                              {element.details.time && (
                                <span className="text-sm text-gray-500">• {element.details.time}</span>
                              )}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">{element.name}</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              {Object.entries(element.details).map(([key, value]) => {
                                if (key !== 'name' && value) {
                                  return (
                                    <div key={key} className="flex">
                                      <span className="font-medium text-gray-700 capitalize min-w-[100px]">{key}:</span>
                                      <span className="text-gray-600">{String(value)}</span>
                                    </div>
                                  );
                                }
                                return null;
                              })}
                            </div>

                            {element.files && element.files.length > 0 && (
                              <div className="mt-4 pt-4 border-t">
                                <div className="text-sm font-medium text-gray-700 mb-2">Documents joints:</div>
                                <div className="flex flex-wrap gap-2">
                                  {element.files.map(file => (
                                    <a
                                      key={file.id}
                                      href={file.data}
                                      download={file.name}
                                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full hover:bg-blue-200"
                                    >
                                      📎 {file.name}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}