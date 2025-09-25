'use client';

import React, { useState, useEffect } from 'react';
import { Save, Trash2, X, User, MapPin, Calendar, Euro, Users } from 'lucide-react';
import { Itinerary, Client, ItineraryStatus, CreateItineraryData, UpdateItineraryData } from '@/types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Textarea } from './ui/Textarea';
import { createItinerary, updateItinerary, deleteItinerary } from '@/lib/supabase';

interface ItineraryModalProps {
  itinerary: Itinerary | null;
  clients: Client[];
  preAssignedClient?: Client | null;
  onSave: (itinerary: Itinerary) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

interface FormData {
  titre: string;
  description: string;
  destination: string;
  date_debut: string;
  date_fin: string;
  nb_voyageurs: string;
  budget: string;
  statut: ItineraryStatus;
  client_id: string;
}

interface FormErrors {
  titre?: string;
  client_id?: string;
  date_debut?: string;
  date_fin?: string;
  nb_voyageurs?: string;
  budget?: string;
}

export function ItineraryModal({
  itinerary,
  clients,
  preAssignedClient,
  onSave,
  onDelete,
  onClose
}: ItineraryModalProps) {
  const [formData, setFormData] = useState<FormData>({
    titre: '',
    description: '',
    destination: '',
    date_debut: '',
    date_fin: '',
    nb_voyageurs: '',
    budget: '',
    statut: 'en_attente',
    client_id: preAssignedClient?.id || ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isEditing = !!itinerary;

  useEffect(() => {
    if (itinerary) {
      setFormData({
        titre: itinerary.titre,
        description: itinerary.description || '',
        destination: itinerary.destination || '',
        date_debut: itinerary.date_debut || '',
        date_fin: itinerary.date_fin || '',
        nb_voyageurs: itinerary.nb_voyageurs?.toString() || '',
        budget: itinerary.budget?.toString() || '',
        statut: itinerary.statut,
        client_id: itinerary.client_id
      });
    } else if (preAssignedClient) {
      setFormData(prev => ({ ...prev, client_id: preAssignedClient.id }));
    }
  }, [itinerary, preAssignedClient]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.titre.trim()) {
      newErrors.titre = 'Le titre est obligatoire';
    }

    if (!formData.client_id) {
      newErrors.client_id = 'Le client est obligatoire';
    }

    if (formData.date_debut && formData.date_fin) {
      const startDate = new Date(formData.date_debut);
      const endDate = new Date(formData.date_fin);
      if (endDate < startDate) {
        newErrors.date_fin = 'La date de fin doit être après la date de début';
      }
    }

    if (formData.nb_voyageurs && (parseInt(formData.nb_voyageurs) < 1 || parseInt(formData.nb_voyageurs) > 50)) {
      newErrors.nb_voyageurs = 'Le nombre de voyageurs doit être entre 1 et 50';
    }

    if (formData.budget && parseFloat(formData.budget) < 0) {
      newErrors.budget = 'Le budget ne peut pas être négatif';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const data = {
        titre: formData.titre.trim(),
        description: formData.description.trim() || null,
        destination: formData.destination.trim() || null,
        date_debut: formData.date_debut || null,
        date_fin: formData.date_fin || null,
        nb_voyageurs: formData.nb_voyageurs ? parseInt(formData.nb_voyageurs) : null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        statut: formData.statut,
        client_id: formData.client_id
      };

      let savedItinerary: Itinerary;

      if (isEditing) {
        savedItinerary = await updateItinerary(itinerary!.id, data);
      } else {
        savedItinerary = await createItinerary(data);
      }

      onSave(savedItinerary);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!itinerary) return;

    setLoading(true);
    try {
      await deleteItinerary(itinerary.id);
      onDelete(itinerary.id);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={true}
        onClose={onClose}
        title={isEditing ? 'Modifier l\'itinéraire' : 'Nouvel itinéraire'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Titre *"
            value={formData.titre}
            onChange={(e) => handleInputChange('titre', e.target.value)}
            error={errors.titre}
            placeholder="Ex: Voyage en Italie"
            required
          />

          {!preAssignedClient && (
            <Select
              label="Client *"
              value={formData.client_id}
              onChange={(e) => handleInputChange('client_id', e.target.value)}
              error={errors.client_id}
              required
            >
              <option value="">Sélectionner un client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.nom}
                </option>
              ))}
            </Select>
          )}

          {preAssignedClient && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center text-blue-800">
                <User className="h-4 w-4 mr-2" />
                <span className="font-medium">Client: {preAssignedClient.nom}</span>
              </div>
            </div>
          )}

          <Input
            label="Destination"
            value={formData.destination}
            onChange={(e) => handleInputChange('destination', e.target.value)}
            placeholder="Ex: Rome, Italie"
          />

          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Date de début"
              type="date"
              value={formData.date_debut}
              onChange={(e) => handleInputChange('date_debut', e.target.value)}
              error={errors.date_debut}
            />
            <Input
              label="Date de fin"
              type="date"
              value={formData.date_fin}
              onChange={(e) => handleInputChange('date_fin', e.target.value)}
              error={errors.date_fin}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Nombre de voyageurs"
              type="number"
              min="1"
              max="50"
              value={formData.nb_voyageurs}
              onChange={(e) => handleInputChange('nb_voyageurs', e.target.value)}
              error={errors.nb_voyageurs}
              placeholder="1"
            />
            <Input
              label="Budget (€)"
              type="number"
              min="0"
              step="0.01"
              value={formData.budget}
              onChange={(e) => handleInputChange('budget', e.target.value)}
              error={errors.budget}
              placeholder="1500"
            />
          </div>

          <Select
            label="Statut"
            value={formData.statut}
            onChange={(e) => handleInputChange('statut', e.target.value as ItineraryStatus)}
          >
            <option value="en_attente">En attente</option>
            <option value="en_cours">En cours</option>
            <option value="valide">Validé</option>
            <option value="archive">Archivé</option>
          </Select>

          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Détails du voyage, préférences du client, notes..."
            rows={4}
          />

          <div className="flex justify-between pt-4 border-t">
            <div>
              {isEditing && (
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              )}
            </div>
            
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
              >
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? 'Modifier' : 'Créer'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {showDeleteConfirm && (
        <Modal
          isOpen={true}
          onClose={() => setShowDeleteConfirm(false)}
          title="Confirmer la suppression"
          size="sm"
        >
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Supprimer cet itinéraire ?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Cette action est irréversible. L'itinéraire "{itinerary?.titre}" sera définitivement supprimé.
            </p>
            <div className="flex justify-center space-x-3">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                loading={loading}
              >
                Supprimer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}