'use client';

import { useState, useEffect } from 'react';
import { Plus, Eye, Edit, Share2, Trash2, Calendar, MapPin, User } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Itinerary, Client } from '@/types';
import { supabase, createItinerary } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    titre: '',
    client_id: '',
    destination: '',
    date_debut: '',
    date_fin: '',
    nb_voyageurs: '1',
    budget: '',
    description: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: clientsData } = await supabase
        .from('clients')
        .select('*')
        .order('nom');
      setClients(clientsData || []);

      const { data: itinerariesData } = await supabase
        .from('itineraires')
        .select(`*, client:clients(*)`)
        .order('created_at', { ascending: false });
      setItineraries(itinerariesData || []);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItinerary = async () => {
    if (!formData.titre || !formData.client_id) {
      alert('Titre et client obligatoires');
      return;
    }

    try {
      const newItinerary = await createItinerary({
        titre: formData.titre,
        client_id: formData.client_id,
        destination: formData.destination || null,
        date_debut: formData.date_debut || null,
        date_fin: formData.date_fin || null,
        nb_voyageurs: parseInt(formData.nb_voyageurs) || 1,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        description: formData.description || null,
        statut: 'en_attente'
      });

      setShowCreateModal(false);
      setFormData({
        titre: '', client_id: '', destination: '', date_debut: '',
        date_fin: '', nb_voyageurs: '1', budget: '', description: ''
      });
      
      // Rediriger vers le générateur
      router.push(`/generator/${newItinerary.id}`);
    } catch (error) {
      console.error('Erreur création:', error);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onGHLSync={() => {}} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Mes Itinéraires
            </h1>
            <p className="text-gray-600">
              {itineraries.length} itinéraire{itineraries.length > 1 ? 's' : ''}
            </p>
          </div>
          
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Créer un itinéraire
          </Button>
        </div>

        {itineraries.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Aucun itinéraire
            </h3>
            <p className="text-gray-500 mb-6">
              Créez votre premier itinéraire pour commencer
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un itinéraire
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-900">Titre</th>
                  <th className="text-left p-4 font-medium text-gray-900">Client</th>
                  <th className="text-left p-4 font-medium text-gray-900">Destination</th>
                  <th className="text-left p-4 font-medium text-gray-900">Dates</th>
                  <th className="text-left p-4 font-medium text-gray-900">Budget</th>
                  <th className="text-left p-4 font-medium text-gray-900">Statut</th>
                  <th className="text-left p-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {itineraries.map((itinerary) => (
                  <tr key={itinerary.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <button
                        onClick={() => router.push(`/generator/${itinerary.id}`)}
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        {itinerary.titre}
                      </button>
                    </td>
                    <td className="p-4 text-gray-900">
                      {itinerary.client?.nom || 'N/A'}
                    </td>
                    <td className="p-4 text-gray-600">
                      {itinerary.destination || '-'}
                    </td>
                    <td className="p-4 text-gray-600">
                      {itinerary.date_debut ? formatDate(itinerary.date_debut) : '-'}
                    </td>
                    <td className="p-4 text-gray-600">
                      {itinerary.budget ? `${itinerary.budget}€` : '-'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        itinerary.statut === 'valide' ? 'bg-green-100 text-green-800' :
                        itinerary.statut === 'en_cours' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {itinerary.statut}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/generator/${itinerary.id}`)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/client/${itinerary.client_id}`)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Share2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de création */}
      {showCreateModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowCreateModal(false)}
          title="Créer un nouvel itinéraire"
          size="lg"
        >
          <div className="space-y-4">
            <Input
              label="Titre *"
              value={formData.titre}
              onChange={(e) => setFormData(prev => ({ ...prev, titre: e.target.value }))}
              placeholder="Ex: Voyage en Italie"
            />
            
            <Select
              label="Client *"
              value={formData.client_id}
              onChange={(e) => setFormData(prev => ({ ...prev, client_id: e.target.value }))}
            >
              <option value="">Sélectionner un client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.nom}</option>
              ))}
            </Select>
            
            <Input
              label="Destination"
              value={formData.destination}
              onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
              placeholder="Ex: Rome, Italie"
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Date début"
                type="date"
                value={formData.date_debut}
                onChange={(e) => setFormData(prev => ({ ...prev, date_debut: e.target.value }))}
              />
              <Input
                label="Date fin"
                type="date"
                value={formData.date_fin}
                onChange={(e) => setFormData(prev => ({ ...prev, date_fin: e.target.value }))}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nombre de voyageurs"
                type="number"
                value={formData.nb_voyageurs}
                onChange={(e) => setFormData(prev => ({ ...prev, nb_voyageurs: e.target.value }))}
                min="1"
              />
              <Input
                label="Budget (€)"
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                placeholder="1500"
              />
            </div>
            
            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Notes, préférences du client..."
            />
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateItinerary}>
                Créer et continuer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}