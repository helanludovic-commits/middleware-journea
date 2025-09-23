'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Calendar, FileText, Download, ArrowLeft } from 'lucide-react';

interface TravelElement {
  id: string;
  type: 'accommodation' | 'transport' | 'activity' | 'restaurant' | 'procedure';
  name: string;
  details: Record<string, any>;
}

interface Day {
  id: string;
  name: string;
  elements: TravelElement[];
}

export default function ClientItineraryPage() {
  const params = useParams();
  const itineraryId = params.id as string;
  const [days, setDays] = useState<Day[]>([]);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    // Charger l'itinéraire depuis localStorage
    const savedItinerary = localStorage.getItem(itineraryId);
    if (savedItinerary) {
      setDays(JSON.parse(savedItinerary));
    }
  }, [itineraryId]);

  const elementTypes = {
    accommodation: { name: "Hébergement", icon: "🏨", color: "bg-blue-500" },
    transport: { name: "Transport", icon: "✈️", color: "bg-green-500" },
    activity: { name: "Activité", icon: "🎯", color: "bg-orange-500" },
    restaurant: { name: "Restaurant", icon: "🍽️", color: "bg-purple-500" },
    procedure: { name: "Démarche", icon: "📋", color: "bg-lime-500" }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* En-tête */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              Votre itinéraire de voyage
            </h1>
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Contenu principal */}
          <div className="lg:col-span-3">
            {/* Navigation par onglets */}
            <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
              {days.map((day, index) => (
                <button
                  key={day.id}
                  onClick={() => setActiveTab(index)}
                  className={`px-6 py-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === index
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {day.name}
                </button>
              ))}
            </div>

            {/* Contenu de l'onglet actif */}
            {days[activeTab] && (
              <div className="space-y-6">
                {days[activeTab].elements.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune activité prévue pour ce jour</p>
                  </div>
                ) : (
                  days[activeTab].elements.map(element => {
                    const elementType = elementTypes[element.type];
                    return (
                      <div key={element.id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`p-2 rounded-full ${elementType.color} text-white`}>
                            <span className="text-lg">{elementType.icon}</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{element.name}</h3>
                            <p className="text-sm text-gray-500">{elementType.name}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {Object.entries(element.details).map(([key, value]) => {
                            if (key !== 'name' && value) {
                              return (
                                <div key={key} className="flex justify-between">
                                  <span className="font-medium text-gray-600 capitalize">{key}:</span>
                                  <span className="text-gray-900">{value}</span>
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Sidebar documents */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Documents de voyage
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="font-medium text-sm">Billets d'avion.pdf</p>
                      <p className="text-xs text-gray-500">Ajouté aujourd'hui</p>
                    </div>
                  </div>
                  <button className="p-1 hover:bg-gray-200 rounded">
                    <Download className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="font-medium text-sm">Réservation hôtel.pdf</p>
                      <p className="text-xs text-gray-500">Ajouté hier</p>
                    </div>
                  </div>
                  <button className="p-1 hover:bg-gray-200 rounded">
                    <Download className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
              
              <div className="mt-6 text-center text-gray-500 text-sm">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Documents partagés par votre agent</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}