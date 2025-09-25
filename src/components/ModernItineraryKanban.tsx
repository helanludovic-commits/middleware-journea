'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Calendar, MapPin, User, Euro, Clock, Search, Filter } from 'lucide-react';
import { Itinerary, Client } from '@/types';
import { ItineraryCard } from './ItineraryCard';
import { ItineraryModal } from './ItineraryModal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';

interface ModernItineraryKanbanProps {
  itineraries: Itinerary[];
  clients: Client[];
  preAssignedClient?: Client | null;
  onItineraryUpdate: (itinerary: Itinerary) => void;
  onItineraryDelete: (id: string) => void;
}

const COLUMNS = [
  { id: 'en_attente', title: 'En attente', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'en_cours', title: 'En cours', color: 'bg-blue-50 border-blue-200' },
  { id: 'valide', title: 'Validé', color: 'bg-green-50 border-green-200' },
  { id: 'archive', title: 'Archivé', color: 'bg-gray-50 border-gray-200' },
];

export function ModernItineraryKanban({ 
  itineraries, 
  clients, 
  preAssignedClient,
  onItineraryUpdate, 
  onItineraryDelete 
}: ModernItineraryKanbanProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItinerary, setEditingItinerary] = useState<Itinerary | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilter, setClientFilter] = useState('');

  // Filtrer les itinéraires
  const filteredItineraries = useMemo(() => {
    return itineraries.filter(itinerary => {
      // Si un client pré-assigné est défini, filtrer uniquement ses itinéraires
      if (preAssignedClient && itinerary.client_id !== preAssignedClient.id) {
        return false;
      }

      const matchesSearch = searchQuery === '' || 
        itinerary.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        itinerary.destination?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        itinerary.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesClient = clientFilter === '' || itinerary.client_id === clientFilter;

      return matchesSearch && matchesClient;
    });
  }, [itineraries, searchQuery, clientFilter, preAssignedClient]);

  // Organiser les itinéraires par colonne
  const itinerariesByStatus = useMemo(() => {
    const grouped: Record<string, Itinerary[]> = {};
    
    COLUMNS.forEach(column => {
      grouped[column.id] = filteredItineraries.filter(
        itinerary => itinerary.statut === column.id
      );
    });
    
    return grouped;
  }, [filteredItineraries]);

  const handleCreateItinerary = () => {
    setEditingItinerary(null);
    setIsModalOpen(true);
  };

  const handleEditItinerary = (itinerary: Itinerary) => {
    setEditingItinerary(itinerary);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItinerary(null);
  };

  const getClientById = (clientId: string): Client | undefined => {
    return clients.find(client => client.id === clientId);
  };

  const getTotalBudget = (status: string) => {
    return itinerariesByStatus[status]
      ?.reduce((sum, itinerary) => sum + (itinerary.budget || 0), 0) || 0;
  };

  return (
    <div className="space-y-6">
      {/* Barre de contrôles */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Rechercher un itinéraire..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {!preAssignedClient && (
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="pl-10 min-w-[200px]"
              >
                <option value="">Tous les clients</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.nom}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>
        
        <Button onClick={handleCreateItinerary} className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Nouvel itinéraire
        </Button>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {COLUMNS.map(column => {
          const count = itinerariesByStatus[column.id]?.length || 0;
          const budget = getTotalBudget(column.id);
          
          return (
            <div key={column.id} className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-sm text-gray-600 mb-1">{column.title}</div>
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              {budget > 0 && (
                <div className="text-xs text-green-600 font-medium">
                  {budget.toLocaleString()}€
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tableau Kanban */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {COLUMNS.map(column => (
          <div key={column.id} className={`kanban-column ${column.color} p-4`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{column.title}</h3>
              <div className="flex items-center space-x-2">
                <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                  {itinerariesByStatus[column.id]?.length || 0}
                </span>
              </div>
            </div>
            
            <div className="space-y-3 min-h-[400px]">
              {itinerariesByStatus[column.id]?.map(itinerary => (
                <ItineraryCard
                  key={itinerary.id}
                  itinerary={itinerary}
                  client={getClientById(itinerary.client_id)}
                  onClick={() => handleEditItinerary(itinerary)}
                />
              )) || []}
              
              {itinerariesByStatus[column.id]?.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucun itinéraire</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal pour créer/éditer un itinéraire */}
      {isModalOpen && (
        <ItineraryModal
          itinerary={editingItinerary}
          clients={clients}
          preAssignedClient={preAssignedClient}
          onSave={onItineraryUpdate}
          onDelete={onItineraryDelete}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

export default ModernItineraryKanban;