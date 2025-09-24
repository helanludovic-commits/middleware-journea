'use client';

import React from 'react';
import { Calendar, MapPin, User, Euro, Clock } from 'lucide-react';
import { Itinerary, Client } from '@/types';
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils';

interface ItineraryCardProps {
  itinerary: Itinerary;
  client?: Client;
  onClick: () => void;
}

export function ItineraryCard({ itinerary, client, onClick }: ItineraryCardProps) {
  const formatDateShort = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  };

  const getDaysUntilStart = () => {
    if (!itinerary.date_debut) return null;
    const today = new Date();
    const startDate = new Date(itinerary.date_debut);
    const diffTime = startDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilStart = getDaysUntilStart();

  return (
    <div
      className="kanban-card group hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={onClick}
    >
      {/* Header avec titre et statut */}
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-medium text-gray-900 text-sm leading-tight flex-1 pr-2">
          {itinerary.titre}
        </h4>
        {daysUntilStart !== null && daysUntilStart >= 0 && daysUntilStart <= 30 && (
          <div className="flex-shrink-0">
            {daysUntilStart === 0 ? (
              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                Aujourd'hui
              </span>
            ) : daysUntilStart <= 7 ? (
              <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium">
                {daysUntilStart}j
              </span>
            ) : (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                {daysUntilStart}j
              </span>
            )}
          </div>
        )}
      </div>

      {/* Informations client */}
      {client && (
        <div className="flex items-center text-sm text-gray-600 mb-3">
          <User className="h-3 w-3 mr-1.5" />
          <span className="truncate">{client.nom}</span>
        </div>
      )}

      {/* Informations principales */}
      <div className="space-y-2 mb-3">
        {itinerary.destination && (
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-3 w-3 mr-1.5 flex-shrink-0" />
            <span className="truncate">{itinerary.destination}</span>
          </div>
        )}

        {itinerary.date_debut && (
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-3 w-3 mr-1.5 flex-shrink-0" />
            <span>
              {formatDateShort(itinerary.date_debut)}
              {itinerary.date_fin && ` - ${formatDateShort(itinerary.date_fin)}`}
            </span>
          </div>
        )}

        {itinerary.nb_voyageurs && (
          <div className="flex items-center text-sm text-gray-600">
            <User className="h-3 w-3 mr-1.5 flex-shrink-0" />
            <span>
              {itinerary.nb_voyageurs} voyageur{itinerary.nb_voyageurs > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Budget et dernière mise à jour */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div>
          {itinerary.budget ? (
            <div className="text-sm font-medium text-green-600">
              {formatCurrency(itinerary.budget)}
            </div>
          ) : (
            <div className="text-sm text-gray-400">Budget à définir</div>
          )}
        </div>
        
        <div className="flex items-center text-xs text-gray-400">
          <Clock className="h-3 w-3 mr-1" />
          <span>
            {formatDateShort(itinerary.updated_at)}
          </span>
        </div>
      </div>

      {/* Description (si présente) */}
      {itinerary.description && (
        <div className="mt-3 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-600 line-clamp-2">
            {itinerary.description}
          </p>
        </div>
      )}

      {/* Indicateur de connexion GHL */}
      {itinerary.ghl_opportunity_id && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-2 h-2 bg-blue-400 rounded-full" title="Connecté à GoHighLevel" />
        </div>
      )}
    </div>
  );
}