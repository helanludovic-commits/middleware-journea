'use client';

import { useState, useEffect } from 'react';
import { Plus, Calendar, MapPin, Users, Share2, Trash2, Edit3, Euro, Eye } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
}

export default function HomePage() {
  const router = useRouter();
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newItinerary, setNewItinerary] = useState({
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
        budget: newItinerary.budget,
        cout_agence: newItinerary.cout_agence,
        statut: 'creation'
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
      
      // Redirection vers le générateur
      router.push(`/generator/${data.id}`);
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
          color: 'text-emerald-700 bg-emerald-50 border-emerald-200', 
          text: 'Payé'
        };
      case 'pending_payment': 
        return { 
          color: 'text-amber-700 bg-amber-50 border-amber-200', 
          text: 'En attente de paiement'
        };
      case 'creation':
      default: 
        return { 
          color: 'text-sky-700 bg-sky-50 border-sky-200', 
          text: 'En cours de création'
        };
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 mx-auto"></div>
          <p className="mt-4 text-slate-600">Chargement des itinéraires...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Projets de voyage</h1>
            <p className="mt-2 text-slate-600">Gérez tous vos projets de voyage client</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-slate-700 hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau projet
          </button>
        </div>

        {itineraries.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 text-center py-16">
            <MapPin className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-medium text-slate-800 mb-2">Aucun projet</h3>
            <p className="text-slate-600 mb-6">Commencez par créer votre premier projet de voyage</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-slate-700 hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer un projet
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {itineraries.map((itinerary, index) => {
              const statusConfig = getStatusConfig(itinerary.statut);
              return (
                <div 
                  key={itinerary.id} 
                  className={`p-6 hover:bg-slate-50 transition-colors ${
                    index !== itineraries.length - 1 ? 'border-b border-slate-200' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-6">
                    {/* Projet */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-slate-800 truncate">{itinerary.titre}</h3>
                      <div className="flex items-center text-sm text-slate-500 mt-1">
                        <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span className="truncate">{itinerary.destination}</span>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="hidden md:flex items-center text-sm text-slate-600 min-w-[200px]">
                      <Calendar className="w-4 h-4 mr-2 flex-shrink-0 text-slate-400" />
                      <span className="truncate">
                        {formatDate(itinerary.date_debut)} - {formatDate(itinerary.date_fin)}
                      </span>
                    </div>

                    {/* Voyageurs */}
                    <div className="hidden lg:flex items-center text-sm text-slate-600 min-w-[80px]">
                      <Users className="w-4 h-4 mr-2 flex-shrink-0 text-slate-400" />
                      <span>{itinerary.nb_voyageurs}</span>
                    </div>

                    {/* Budget */}
                    <div className="hidden xl:flex flex-col min-w-[120px]">
                      <div className="flex items-center text-sm text-slate-600">
                        <Euro className="w-4 h-4 mr-1 flex-shrink-0 text-slate-400" />
                        <span className="font-medium">
                          {itinerary.budget ? `${itinerary.budget.toLocaleString()} €` : '-'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 ml-5">Client</div>
                    </div>

                    {/* Coût agence */}
                    <div className="hidden xl:flex flex-col min-w-[120px]">
                      <div className="flex items-center text-sm text-slate-600">
                        <Euro className="w-4 h-4 mr-1 flex-shrink-0 text-slate-400" />
                        <span className="font-medium">
                          {itinerary.cout_agence ? `${itinerary.cout_agence.toLocaleString()} €` : '-'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 ml-5">Agence</div>
                    </div>

                    {/* Statut */}
                    <div className="min-w-[180px]">
                      <select
                        value={itinerary.statut}
                        onChange={(e) => updateStatus(itinerary.id, e.target.value as any)}
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium ${statusConfig.color} focus:outline-none focus:ring-2 focus:ring-slate-400 w-full cursor-pointer`}
                      >
                        <option value="creation">En cours de création</option>
                        <option value="pending_payment">En attente de paiement</option>
                        <option value="paid">Payé</option>
                      </select>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Link 
                        href={`/generator/${itinerary.id}`}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => window.open(`/client/${itinerary.id}`, '_blank')}
                        className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Aperçu"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => shareItinerary(itinerary.id)}
                        className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Partager"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteItinerary(itinerary.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de création */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-slate-900 bg-opacity-50 transition-opacity" onClick={() => setShowCreateModal(false)}></div>
              
              <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-6 pt-6 pb-4">
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Créer un nouvel itinéraire</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nom du projet</label>
                      <input
                        type="text"
                        value={newItinerary.titre}
                        onChange={(e) => setNewItinerary({ ...newItinerary, titre: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                        placeholder="Ex: Voyage à Paris"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Destination</label>
                      <input
                        type="text"
                        value={newItinerary.destination}
                        onChange={(e) => setNewItinerary({ ...newItinerary, destination: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                        placeholder="Ex: Paris, France"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">Planification temporelle</label>
                      <div className="space-y-3">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="dateType"
                            value="dates"
                            checked={newItinerary.dateType === 'dates'}
                            onChange={(e) => setNewItinerary({ ...newItinerary, dateType: e.target.value as 'dates' | 'duration' })}
                            className="mr-2 text-slate-700 focus:ring-slate-500"
                          />
                          <span className="text-sm text-slate-700">Dates précises (aller/retour)</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="dateType"
                            value="duration"
                            checked={newItinerary.dateType === 'duration'}
                            onChange={(e) => setNewItinerary({ ...newItinerary, dateType: e.target.value as 'dates' | 'duration' })}
                            className="mr-2 text-slate-700 focus:ring-slate-500"
                          />
                          <span className="text-sm text-slate-700">Nombre de jours</span>
                        </label>
                      </div>
                    </div>

                    {newItinerary.dateType === 'dates' ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Date de début</label>
                          <input
                            type="date"
                            value={newItinerary.date_debut}
                            onChange={(e) => setNewItinerary({ ...newItinerary, date_debut: e.target.value })}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Date de fin</label>
                          <input
                            type="date"
                            value={newItinerary.date_fin}
                            onChange={(e) => setNewItinerary({ ...newItinerary, date_fin: e.target.value })}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de jours</label>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setNewItinerary({ ...newItinerary, duration: Math.max(1, newItinerary.duration - 1) })}
                            className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-50 transition-colors"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={newItinerary.duration}
                            onChange={(e) => setNewItinerary({ ...newItinerary, duration: parseInt(e.target.value) || 1 })}
                            className="w-20 text-center border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => setNewItinerary({ ...newItinerary, duration: newItinerary.duration + 1 })}
                            className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-50 transition-colors"
                          >
                            +
                          </button>
                          <span className="text-sm text-slate-500">jour{newItinerary.duration > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de voyageurs</label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setNewItinerary({ ...newItinerary, nb_voyageurs: Math.max(1, newItinerary.nb_voyageurs - 1) })}
                          className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-50 transition-colors"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={newItinerary.nb_voyageurs}
                          onChange={(e) => setNewItinerary({ ...newItinerary, nb_voyageurs: parseInt(e.target.value) || 1 })}
                          className="w-20 text-center border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => setNewItinerary({ ...newItinerary, nb_voyageurs: newItinerary.nb_voyageurs + 1 })}
                          className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-50 transition-colors"
                        >
                          +
                        </button>
                        <span className="text-sm text-slate-500">personne{newItinerary.nb_voyageurs > 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Budget du voyageur (€)</label>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={newItinerary.budget}
                          onChange={(e) => setNewItinerary({ ...newItinerary, budget: parseInt(e.target.value) || 0 })}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Coût pour l'agence (€)</label>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          value={newItinerary.cout_agence}
                          onChange={(e) => setNewItinerary({ ...newItinerary, cout_agence: parseInt(e.target.value) || 0 })}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 px-6 py-4 flex flex-row-reverse gap-3">
                  <button
                    onClick={createItinerary}
                    disabled={!newItinerary.titre || !newItinerary.destination || (newItinerary.dateType === 'dates' && (!newItinerary.date_debut || !newItinerary.date_fin))}
                    className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Créer le projet
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
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