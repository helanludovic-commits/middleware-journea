'use client';

import { useState, useEffect } from 'react';
import { Plus, Calendar, MapPin, Users, Share2, Trash2, Edit3, Euro, Eye } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Itinerary {
  id: string;
  titre: string;
  destination: string;
  date_debut: string;
  date_fin: string;
  nb_voyageurs: number;
  budget?: number;
  cout_agence?: number;
  statut: 'creation' | 'pending_payment' | 'paid';
  created_at: string;
  updated_at: string;
  client_id?: string;
}

export default function HomePage() {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newItinerary, setNewItinerary] = useState({
    titre: '',
    destination: '',
    dateType: 'dates' as 'dates' | 'duration',
    date_debut: '',
    date_fin: '',
    duration: 3,
    nb_voyageurs: 2,
    budget: 0,
    cout_agence: 0
  });

  useEffect(() => {
    fetchItineraries();
  }, []);

  const fetchItineraries = async () => {
    try {
      const { data, error } = await supabase
        .from('itineraires')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItineraries(data || []);
    } catch (error) {
      console.error('Error fetching itineraries:', error);
    } finally {
      setLoading(false);
    }
  };

  const createItinerary = async () => {
    try {
      let clientId = null;
      
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .limit(1)
        .single();
      
      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert([{ nom: 'Client Par Défaut', email: 'default@example.com' }])
          .select()
          .single();
        
        if (clientError) throw clientError;
        clientId = newClient.id;
      }

      const itineraryData = {
        titre: newItinerary.titre,
        destination: newItinerary.destination,
        date_debut: newItinerary.dateType === 'dates' 
          ? newItinerary.date_debut 
          : new Date().toISOString().split('T')[0],
        date_fin: newItinerary.dateType === 'dates' 
          ? newItinerary.date_fin 
          : new Date(Date.now() + newItinerary.duration * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        nb_voyageurs: newItinerary.nb_voyageurs,
        budget: newItinerary.budget || null,
        cout_agence: newItinerary.cout_agence || null,
        statut: 'creation',
        client_id: clientId,
        contenu: []
      };

      const { data, error } = await supabase
        .from('itineraires')
        .insert([itineraryData])
        .select()
        .single();

      if (error) throw error;

      setItineraries([data, ...itineraries]);
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Error creating itinerary:', error);
      alert('Erreur lors de la création de l\'itinéraire');
    }
  };

  const resetForm = () => {
    setNewItinerary({
      titre: '',
      destination: '',
      dateType: 'dates',
      date_debut: '',
      date_fin: '',
      duration: 3,
      nb_voyageurs: 2,
      budget: 0,
      cout_agence: 0
    });
  };

  const shareItinerary = async (id: string) => {
    const shareUrl = `${window.location.origin}/client/${id}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50';
      notification.textContent = 'Lien copié dans le presse-papiers !';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    } catch (error) {
      alert(`Lien de partage : ${shareUrl}`);
    }
  };

  const deleteItinerary = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet itinéraire ?')) return;
    
    try {
      const { error } = await supabase
        .from('itineraires')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setItineraries(itineraries.filter(itin => itin.id !== id));
    } catch (error) {
      console.error('Error deleting itinerary:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const updateStatus = async (id: string, newStatus: 'creation' | 'pending_payment' | 'paid') => {
    try {
      const { error } = await supabase
        .from('itineraires')
        .update({ statut: newStatus })
        .eq('id', id);

      if (error) throw error;

      setItineraries(itineraries.map(itin => 
        itin.id === id ? { ...itin, statut: newStatus } : itin
      ));
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'paid': 
        return { 
          color: 'bg-green-100 text-green-800 border-green-200', 
          text: 'Payé',
          icon: '✓'
        };
      case 'pending_payment': 
        return { 
          color: 'bg-orange-100 text-orange-800 border-orange-200', 
          text: 'En attente',
          icon: '⏳'
        };
      case 'creation':
      default: 
        return { 
          color: 'bg-blue-100 text-blue-800 border-blue-200', 
          text: 'Création',
          icon: '✏️'
        };
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des itinéraires...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projets de voyage</h1>
            <p className="mt-2 text-gray-600">Gérez tous vos projets de voyage client</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all hover:shadow-md"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau projet
          </button>
        </div>

        {itineraries.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-xl">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Aucun projet</h3>
            <p className="text-gray-600 mb-6">Commencez par créer votre premier projet de voyage</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all hover:shadow-md"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer un projet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {itineraries.map((itinerary) => {
              const statusConfig = getStatusConfig(itinerary.statut);
              return (
                <div key={itinerary.id} className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                  {/* Header avec gradient */}
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-bold leading-tight">{itinerary.titre}</h3>
                      <select
                        value={itinerary.statut}
                        onChange={(e) => updateStatus(itinerary.id, e.target.value as any)}
                        onClick={(e) => e.stopPropagation()}
                        className={`text-xs px-2 py-1 rounded-full border cursor-pointer ${statusConfig.color} focus:outline-none focus:ring-2 focus:ring-white`}
                      >
                        <option value="creation">Création</option>
                        <option value="pending_payment">En attente</option>
                        <option value="paid">Payé</option>
                      </select>
                    </div>
                    <div className="flex items-center text-white/90">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="text-sm">{itinerary.destination}</span>
                    </div>
                  </div>

                  {/* Corps de la carte */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{formatDate(itinerary.date_debut)}</span>
                      </div>
                      <span className="text-gray-400">→</span>
                      <div className="flex items-center text-gray-600">
                        <span>{formatDate(itinerary.date_fin)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <div className="flex items-center text-gray-600 text-sm mb-1">
                          <Users className="w-4 h-4 mr-1 text-gray-400" />
                          <span className="text-xs text-gray-500">Voyageurs</span>
                        </div>
                        <div className="text-lg font-semibold text-gray-900">{itinerary.nb_voyageurs}</div>
                      </div>
                      <div>
                        <div className="flex items-center text-gray-600 text-sm mb-1">
                          <Euro className="w-4 h-4 mr-1 text-gray-400" />
                          <span className="text-xs text-gray-500">Budget</span>
                        </div>
                        <div className="text-lg font-semibold text-gray-900">
                          {itinerary.budget ? `${itinerary.budget.toLocaleString()}€` : '-'}
                        </div>
                      </div>
                    </div>

                    {itinerary.cout_agence && (
                      <div className="bg-gray-50 rounded-lg p-3 -mx-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Coût agence</span>
                          <span className="text-sm font-semibold text-gray-900">{itinerary.cout_agence.toLocaleString()}€</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer avec actions */}
                  <div className="px-6 pb-6">
                    <div className="flex gap-2">
                      <Link 
                        href={`/generator/${itinerary.id}`}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Modifier</span>
                      </Link>
                      <button
                        onClick={() => window.open(`/client/${itinerary.id}`, '_blank')}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Aperçu</span>
                      </button>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => shareItinerary(itinerary.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Partager</span>
                      </button>
                      <button
                        onClick={() => deleteItinerary(itinerary.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Supprimer</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal - reste identique */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={() => setShowCreateModal(false)}></div>
              
              <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-6 pt-6 pb-4">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Créer un nouvel itinéraire</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom du projet *</label>
                      <input
                        type="text"
                        value={newItinerary.titre}
                        onChange={(e) => setNewItinerary({ ...newItinerary, titre: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ex: Voyage à Paris"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Destination *</label>
                      <input
                        type="text"
                        value={newItinerary.destination}
                        onChange={(e) => setNewItinerary({ ...newItinerary, destination: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ex: Paris, France"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Planification temporelle *</label>
                      <div className="space-y-2">
                        <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="dateType"
                            value="dates"
                            checked={newItinerary.dateType === 'dates'}
                            onChange={(e) => setNewItinerary({ ...newItinerary, dateType: e.target.value as 'dates' | 'duration' })}
                            className="mr-3"
                          />
                          <span>Dates précises (aller/retour)</span>
                        </label>
                        <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="dateType"
                            value="duration"
                            checked={newItinerary.dateType === 'duration'}
                            onChange={(e) => setNewItinerary({ ...newItinerary, dateType: e.target.value as 'dates' | 'duration' })}
                            className="mr-3"
                          />
                          <span>Nombre de jours</span>
                        </label>
                      </div>
                    </div>

                    {newItinerary.dateType === 'dates' ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date de début *</label>
                          <input
                            type="date"
                            value={newItinerary.date_debut}
                            onChange={(e) => setNewItinerary({ ...newItinerary, date_debut: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin *</label>
                          <input
                            type="date"
                            value={newItinerary.date_fin}
                            onChange={(e) => setNewItinerary({ ...newItinerary, date_fin: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de jours *</label>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setNewItinerary({ ...newItinerary, duration: Math.max(1, newItinerary.duration - 1) })}
                            className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors font-semibold"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={newItinerary.duration}
                            onChange={(e) => setNewItinerary({ ...newItinerary, duration: parseInt(e.target.value) || 1 })}
                            className="w-24 text-center border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold"
                          />
                          <button
                            type="button"
                            onClick={() => setNewItinerary({ ...newItinerary, duration: newItinerary.duration + 1 })}
                            className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors font-semibold"
                          >
                            +
                          </button>
                          <span className="text-sm text-gray-500">jour{newItinerary.duration > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de voyageurs *</label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setNewItinerary({ ...newItinerary, nb_voyageurs: Math.max(1, newItinerary.nb_voyageurs - 1) })}
                          className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors font-semibold"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={newItinerary.nb_voyageurs}
                          onChange={(e) => setNewItinerary({ ...newItinerary, nb_voyageurs: parseInt(e.target.value) || 1 })}
                          className="w-24 text-center border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => setNewItinerary({ ...newItinerary, nb_voyageurs: newItinerary.nb_voyageurs + 1 })}
                          className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors font-semibold"
                        >
                          +
                        </button>
                        <span className="text-sm text-gray-500">personne{newItinerary.nb_voyageurs > 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Budget voyageur (€)</label>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={newItinerary.budget || ''}
                          onChange={(e) => setNewItinerary({ ...newItinerary, budget: parseInt(e.target.value) || 0 })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Coût agence (€)</label>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          value={newItinerary.cout_agence || ''}
                          onChange={(e) => setNewItinerary({ ...newItinerary, cout_agence: parseInt(e.target.value) || 0 })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse gap-3">
                  <button
                    onClick={createItinerary}
                    disabled={!newItinerary.titre || !newItinerary.destination || (newItinerary.dateType === 'dates' && (!newItinerary.date_debut || !newItinerary.date_fin))}
                    className="w-full sm:w-auto inline-flex justify-center rounded-lg px-6 py-2.5 bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Créer le projet
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="mt-3 sm:mt-0 w-full sm:w-auto inline-flex justify-center rounded-lg px-6 py-2.5 border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}