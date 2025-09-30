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
      // Créer d'abord un client par défaut si nécessaire
      let clientId = null;
      
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .limit(1)
        .single();
      
      if (existingClient) {
        clientId = existingClient.id;
      } else {
        // Créer un client par défaut
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
          color: 'text-green-700 bg-green-100 border-green-200', 
          text: 'Payé'
        };
      case 'pending_payment': 
        return { 
          color: 'text-orange-700 bg-orange-100 border-orange-200', 
          text: 'En attente de paiement'
        };
      case 'creation':
      default: 
        return { 
          color: 'text-blue-700 bg-blue-100 border-blue-200', 
          text: 'En cours de création'
        };
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des itinéraires...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projets de voyage</h1>
            <p className="mt-2 text-gray-600">Gérez tous vos projets de voyage client</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau projet
          </button>
        </div>

        {itineraries.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Aucun projet</h3>
            <p className="text-gray-600 mb-6">Commencez par créer votre premier projet de voyage</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer un projet
            </button>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Projet
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Voyageurs
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Budget client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Coût agence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {itineraries.map((itinerary) => {
                    const statusConfig = getStatusConfig(itinerary.statut);
                    return (
                      <tr key={itinerary.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{itinerary.titre}</div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {itinerary.destination}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(itinerary.date_debut)} - {formatDate(itinerary.date_fin)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            {itinerary.nb_voyageurs}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 flex items-center">
                            <Euro className="w-3 h-3 mr-1" />
                            {itinerary.budget ? `${itinerary.budget.toLocaleString()} €` : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 flex items-center">
                            <Euro className="w-3 h-3 mr-1" />
                            {itinerary.cout_agence ? `${itinerary.cout_agence.toLocaleString()} €` : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={itinerary.statut}
                            onChange={(e) => updateStatus(itinerary.id, e.target.value as any)}
                            className={`text-xs px-2 py-1 rounded-full border cursor-pointer ${statusConfig.color} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          >
                            <option value="creation">En cours de création</option>
                            <option value="pending_payment">En attente de paiement</option>
                            <option value="paid">Payé</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-3">
                            <Link 
                              href={`/generator/${itinerary.id}`}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                              title="Modifier"
                            >
                              <Edit3 className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => window.open(`/client/${itinerary.id}`, '_blank')}
                              className="text-purple-600 hover:text-purple-900 transition-colors"
                              title="Aperçu"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => shareItinerary(itinerary.id)}
                              className="text-green-600 hover:text-green-900 transition-colors"
                              title="Partager"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteItinerary(itinerary.id)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal de création */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCreateModal(false)}></div>
              
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">Créer un nouvel itinéraire</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom du projet *</label>
                      <input
                        type="text"
                        value={newItinerary.titre}
                        onChange={(e) => setNewItinerary({ ...newItinerary, titre: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ex: Voyage à Paris"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Destination *</label>
                      <input
                        type="text"
                        value={newItinerary.destination}
                        onChange={(e) => setNewItinerary({ ...newItinerary, destination: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ex: Paris, France"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Planification temporelle *</label>
                      <div className="space-y-3">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="dateType"
                            value="dates"
                            checked={newItinerary.dateType === 'dates'}
                            onChange={(e) => setNewItinerary({ ...newItinerary, dateType: e.target.value as 'dates' | 'duration' })}
                            className="mr-2"
                          />
                          <span>Dates précises (aller/retour)</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="dateType"
                            value="duration"
                            checked={newItinerary.dateType === 'duration'}
                            onChange={(e) => setNewItinerary({ ...newItinerary, dateType: e.target.value as 'dates' | 'duration' })}
                            className="mr-2"
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
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin *</label>
                          <input
                            type="date"
                            value={newItinerary.date_fin}
                            onChange={(e) => setNewItinerary({ ...newItinerary, date_fin: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
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
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={newItinerary.duration}
                            onChange={(e) => setNewItinerary({ ...newItinerary, duration: parseInt(e.target.value) || 1 })}
                            className="w-20 text-center border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => setNewItinerary({ ...newItinerary, duration: newItinerary.duration + 1 })}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
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
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={newItinerary.nb_voyageurs}
                          onChange={(e) => setNewItinerary({ ...newItinerary, nb_voyageurs: parseInt(e.target.value) || 1 })}
                          className="w-20 text-center border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setNewItinerary({ ...newItinerary, nb_voyageurs: newItinerary.nb_voyageurs + 1 })}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                          +
                        </button>
                        <span className="text-sm text-gray-500">personne{newItinerary.nb_voyageurs > 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Budget du voyageur (€)</label>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={newItinerary.budget || ''}
                          onChange={(e) => setNewItinerary({ ...newItinerary, budget: parseInt(e.target.value) || 0 })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Coût pour l'agence (€)</label>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          value={newItinerary.cout_agence || ''}
                          onChange={(e) => setNewItinerary({ ...newItinerary, cout_agence: parseInt(e.target.value) || 0 })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={createItinerary}
                    disabled={!newItinerary.titre || !newItinerary.destination || (newItinerary.dateType === 'dates' && (!newItinerary.date_debut || !newItinerary.date_fin))}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Créer le projet
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
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