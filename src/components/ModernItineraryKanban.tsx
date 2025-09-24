'use client';

import React, { useState } from 'react';
import { Plus, Share2, Calendar, Bed, Car, MapPin, Utensils, ClipboardList, Edit, Trash2, X } from 'lucide-react';

// Types
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

interface ClientData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface FieldConfig {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  min?: number;
  max?: number;
  options?: string[];
}

// Configuration des types d'éléments
const elementTypes = {
  accommodation: { 
    name: "Hébergement", 
    icon: Bed, 
    color: "bg-blue-500",
    fields: [
      { key: "name", label: "Nom de l'hébergement", type: "text", required: true },
      { key: "address", label: "Adresse", type: "text", required: true },
      { key: "checkin", label: "Check-in", type: "time" },
      { key: "checkout", label: "Check-out", type: "time" },
      { key: "price", label: "Prix", type: "text" },
      { key: "stars", label: "Étoiles", type: "number", min: 1, max: 5 }
    ] as FieldConfig[]
  },
  transport: { 
    name: "Transport", 
    icon: Car, 
    color: "bg-green-500",
    fields: [
      { key: "type", label: "Type", type: "select", options: ["Avion", "Train", "Voiture", "Bus"], required: true },
      { key: "departure", label: "Départ", type: "text", required: true },
      { key: "arrival", label: "Arrivée", type: "text", required: true },
      { key: "time", label: "Heure de départ", type: "time" },
      { key: "number", label: "Numéro de vol/train", type: "text" },
      { key: "price", label: "Prix", type: "text" }
    ] as FieldConfig[]
  },
  activity: { 
    name: "Activité", 
    icon: MapPin, 
    color: "bg-orange-500",
    fields: [
      { key: "name", label: "Nom de l'activité", type: "text", required: true },
      { key: "location", label: "Lieu", type: "text", required: true },
      { key: "time", label: "Heure", type: "time" },
      { key: "duration", label: "Durée", type: "text" },
      { key: "price", label: "Prix", type: "text" }
    ] as FieldConfig[]
  },
  restaurant: { 
    name: "Restaurant", 
    icon: Utensils, 
    color: "bg-purple-500",
    fields: [
      { key: "name", label: "Nom du restaurant", type: "text", required: true },
      { key: "address", label: "Adresse", type: "text", required: true },
      { key: "time", label: "Heure de réservation", type: "time" },
      { key: "cuisine", label: "Type de cuisine", type: "text" },
      { key: "price", label: "Prix moyen", type: "text" }
    ] as FieldConfig[]
  },
  procedure: { 
    name: "Démarche", 
    icon: ClipboardList, 
    color: "bg-lime-500",
    fields: [
      { key: "name", label: "Nom de la démarche", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea", required: true },
      { key: "deadline", label: "Date limite", type: "date" },
      { key: "location", label: "Lieu", type: "text" }
    ] as FieldConfig[]
  }
};

// Composant élément avec drag & drop natif
function DraggableElement({ element, onEdit, onDelete, dayId }: { 
  element: TravelElement; 
  onEdit: (element: TravelElement) => void;
  onDelete: (id: string) => void;
  dayId: string;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', JSON.stringify({ elementId: element.id, sourceDayId: dayId }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const elementType = elementTypes[element.type];
  const Icon = elementType.icon;

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onEdit(element)}
      className={`bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-all cursor-move group ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-white text-xs font-medium ${elementType.color}`}>
          <Icon className="w-3 h-3" />
          <span>{elementType.name}</span>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(element);
            }}
            className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600"
          >
            <Edit className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(element.id);
            }}
            className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-red-600"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      
      <h4 className="font-medium text-gray-900 mb-1">{element.name}</h4>
      
      <div className="text-xs text-gray-600 space-y-1">
        {Object.entries(element.details).map(([key, value]) => {
          if (key !== 'name' && value) {
            return (
              <div key={key} className="flex justify-between">
                <span className="capitalize">{key}:</span>
                <span>{value}</span>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

// Composant jour avec drag & drop natif
function DraggableDay({ 
  day, 
  index,
  onAddElement, 
  onDeleteDay, 
  onEditElement, 
  onDeleteElement,
  onMoveDay,
  onDropElement 
}: {
  day: Day;
  index: number;
  onAddElement: (dayId: string) => void;
  onDeleteDay: (dayId: string) => void;
  onEditElement: (element: TravelElement) => void;
  onDeleteElement: (dayId: string, elementId: string) => void;
  onMoveDay: (fromIndex: number, toIndex: number) => void;
  onDropElement: (elementId: string, sourceDayId: string, targetDayId: string) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', JSON.stringify({ dayIndex: index, type: 'day' }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      
      if (data.type === 'day') {
        onMoveDay(data.dayIndex, index);
      } else if (data.elementId && data.sourceDayId) {
        onDropElement(data.elementId, data.sourceDayId, day.id);
      }
    } catch (error) {
      console.error('Error parsing drag data:', error);
    }
  };

  return (
    <div
      className={`bg-gray-50 rounded-lg border border-gray-200 w-80 flex-shrink-0 flex flex-col transition-all ${
        isDragging ? 'opacity-50' : ''
      } ${isDragOver ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* En-tête du jour */}
      <div 
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className="flex items-center justify-between p-4 border-b border-gray-200 cursor-move hover:bg-gray-100"
      >
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {day.name}
        </h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteDay(day.id);
          }}
          className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-red-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Zone des éléments */}
      <div className="flex-1 p-4 min-h-[300px]">
        <div className="space-y-3">
          {day.elements.map(element => (
            <DraggableElement
              key={element.id}
              element={element}
              dayId={day.id}
              onEdit={onEditElement}
              onDelete={(elementId) => onDeleteElement(day.id, elementId)}
            />
          ))}
        </div>
        
        {day.elements.length === 0 && (
          <div className="text-center text-gray-400 py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Glissez des éléments ici</p>
          </div>
        )}
      </div>

      {/* Bouton ajouter élément */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => onAddElement(day.id)}
          className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter un élément
        </button>
      </div>
    </div>
  );
}

// Modal de sélection de type
function TypeSelectionModal({ isOpen, onClose, onSelect }: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: keyof typeof elementTypes) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Choisir le type d'élément</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(elementTypes).map(([key, type]) => {
            const Icon = type.icon;
            return (
              <button
                key={key}
                onClick={() => onSelect(key as keyof typeof elementTypes)}
                className="flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
              >
                <div className={`p-3 rounded-full ${type.color} text-white`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="font-medium">{type.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Modal de formulaire
function ElementFormModal({ isOpen, onClose, onSave, elementType, initialData }: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  elementType: keyof typeof elementTypes | null;
  initialData?: TravelElement;
}) {
  const [formData, setFormData] = useState(initialData?.details || {});

  React.useEffect(() => {
    if (initialData) {
      setFormData(initialData.details);
    } else {
      setFormData({});
    }
  }, [initialData]);

  if (!isOpen || !elementType) return null;

  const type = elementTypes[elementType];

  const handleSubmit = () => {
    const requiredFields = type.fields.filter(field => field.required);
    const missingFields = requiredFields.filter(field => !formData[field.key]);
    
    if (missingFields.length > 0) {
      alert(`Veuillez remplir les champs obligatoires : ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    onSave({
      type: elementType,
      name: formData.name || '',
      details: formData
    });
    setFormData({});
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">
            {initialData ? 'Modifier' : 'Ajouter'} {type.name}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          {type.fields.map(field => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              
              {field.type === 'select' && field.options ? (
                <select
                  value={formData[field.key] || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sélectionner</option>
                  {field.options.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  value={formData[field.key] || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <input
                  type={field.type}
                  value={formData[field.key] || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                  min={field.min}
                  max={field.max}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              )}
            </div>
          ))}
          
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {initialData ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Modal pour les données client
function ClientDataModal({ isOpen, onClose, onSave, clientData, setClientData }: {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  clientData: ClientData;
  setClientData: React.Dispatch<React.SetStateAction<ClientData>>;
}) {
  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!clientData.firstName || !clientData.lastName || !clientData.email) {
      alert('Veuillez remplir au moins le prénom, nom et email');
      return;
    }
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Informations client</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prénom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={clientData.firstName}
              onChange={(e) => setClientData(prev => ({ ...prev, firstName: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Prénom du client"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={clientData.lastName}
              onChange={(e) => setClientData(prev => ({ ...prev, lastName: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nom du client"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={clientData.email}
              onChange={(e) => setClientData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="email@exemple.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone
            </label>
            <input
              type="tel"
              value={clientData.phone}
              onChange={(e) => setClientData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="+33 6 12 34 56 78"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button 
            onClick={onClose} 
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Annuler
          </button>
          <button 
            onClick={handleSubmit} 
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Créer & Partager
          </button>
        </div>
      </div>
    </div>
  );
}

// Composant principal
export default function ModernItineraryKanban() {
  const [days, setDays] = useState<Day[]>([
    { id: 'day-1', name: 'Jour 1', elements: [] },
    { id: 'day-2', name: 'Jour 2', elements: [] }
  ]);
  
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedElementType, setSelectedElementType] = useState<keyof typeof elementTypes | null>(null);
  const [currentDayId, setCurrentDayId] = useState<string | null>(null);
  const [editingElement, setEditingElement] = useState<TravelElement | null>(null);
  const [clientData, setClientData] = useState<ClientData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  // Ajouter un jour
  const addDay = () => {
    const newDay: Day = {
      id: `day-${Date.now()}`,
      name: `Jour ${days.length + 1}`,
      elements: []
    };
    setDays([...days, newDay]);
  };

  // Supprimer un jour
  const deleteDay = (dayId: string) => {
    if (days.length <= 1) {
      alert('Vous devez garder au moins un jour');
      return;
    }
    
    if (confirm('Êtes-vous sûr de vouloir supprimer ce jour ?')) {
      const newDays = days.filter(day => day.id !== dayId);
      // Renommer les jours restants
      setDays(newDays.map((day, index) => ({
        ...day,
        name: `Jour ${index + 1}`
      })));
    }
  };

  // Déplacer un jour
  const moveDay = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    const newDays = [...days];
    const movedDay = newDays.splice(fromIndex, 1)[0];
    newDays.splice(toIndex, 0, movedDay);
    
    // Renommer les jours pour maintenir la cohérence
    setDays(newDays.map((day, index) => ({
      ...day,
      name: `Jour ${index + 1}`
    })));
  };

  // Déplacer un élément entre jours
  const dropElement = (elementId: string, sourceDayId: string, targetDayId: string) => {
    if (sourceDayId === targetDayId) return;

    setDays(days => {
      const newDays = [...days];
      const sourceDay = newDays.find(day => day.id === sourceDayId);
      const targetDay = newDays.find(day => day.id === targetDayId);
      
      if (sourceDay && targetDay) {
        const elementIndex = sourceDay.elements.findIndex(el => el.id === elementId);
        if (elementIndex !== -1) {
          const element = sourceDay.elements.splice(elementIndex, 1)[0];
          targetDay.elements.push(element);
        }
      }
      
      return newDays;
    });
  };

  // Ouvrir le modal d'ajout d'élément
  const openAddElement = (dayId: string) => {
    setCurrentDayId(dayId);
    setEditingElement(null);
    setShowTypeModal(true);
  };

  // Sélectionner le type d'élément
  const selectElementType = (type: keyof typeof elementTypes) => {
    setSelectedElementType(type);
    setShowTypeModal(false);
    setShowFormModal(true);
  };

  // Sauvegarder un élément
  const saveElement = (elementData: any) => {
    if (!currentDayId) return;

    const newElement: TravelElement = {
      id: editingElement?.id || `element-${Date.now()}`,
      type: elementData.type,
      name: elementData.name,
      details: elementData.details
    };

    setDays(days => days.map(day => {
      if (day.id === currentDayId) {
        if (editingElement) {
          // Modifier l'élément existant
          return {
            ...day,
            elements: day.elements.map(el => 
              el.id === editingElement.id ? newElement : el
            )
          };
        } else {
          // Ajouter un nouvel élément
          return {
            ...day,
            elements: [...day.elements, newElement]
          };
        }
      }
      return day;
    }));

    setEditingElement(null);
    setCurrentDayId(null);
  };

  // Modifier un élément
  const editElement = (element: TravelElement) => {
    const dayId = days.find(day => 
      day.elements.some(el => el.id === element.id)
    )?.id;
    
    if (dayId) {
      setCurrentDayId(dayId);
      setEditingElement(element);
      setSelectedElementType(element.type);
      setShowFormModal(true);
    }
  };

  // Supprimer un élément
  const deleteElement = (dayId: string, elementId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
      setDays(days => days.map(day => {
        if (day.id === dayId) {
          return {
            ...day,
            elements: day.elements.filter(el => el.id !== elementId)
          };
        }
        return day;
      }));
    }
  };

  // Partager l'itinéraire - ouvre le modal client
  const shareItinerary = () => {
    setShowClientModal(true);
  };

  // Finaliser le partage - version simplifiée sans GHL
  const finalizeShare = () => {
    const itineraryData = {
      id: `itinerary-${Date.now()}`,
      title: `Voyage ${clientData.firstName} ${clientData.lastName}`,
      days: days,
      createdAt: new Date().toISOString(),
      clientData: clientData
    };

    // Sauvegarder localement
    localStorage.setItem(itineraryData.id, JSON.stringify(days));
    
    // Générer URL de partage
    const shareUrl = `${window.location.origin}/client/${itineraryData.id}`;
    
    // Copier dans le presse-papiers
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert(`Itinéraire créé avec succès !\n\nLien client copié dans le presse-papiers :\n${shareUrl}\n\nPartagez ce lien avec ${clientData.firstName} ${clientData.lastName}`);
    }).catch(() => {
      alert(`Itinéraire créé avec succès !\n\nLien client : ${shareUrl}`);
    });
    
    // Réinitialiser les données client
    setClientData({
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    });
    
    setShowClientModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* En-tête */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              Générateur d'itinéraires
            </h1>
            <div className="flex gap-3">
              <button
                onClick={addDay}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter un jour
              </button>
              <button
                onClick={shareItinerary}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Partager
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="flex gap-6 overflow-x-auto pb-6">
          {days.map((day, index) => (
            <DraggableDay
              key={day.id}
              day={day}
              index={index}
              onAddElement={openAddElement}
              onDeleteDay={deleteDay}
              onEditElement={editElement}
              onDeleteElement={deleteElement}
              onMoveDay={moveDay}
              onDropElement={dropElement}
            />
          ))}
        </div>
      </main>

      {/* Modals */}
      <TypeSelectionModal
        isOpen={showTypeModal}
        onClose={() => setShowTypeModal(false)}
        onSelect={selectElementType}
      />

      <ElementFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSave={saveElement}
        elementType={selectedElementType}
        initialData={editingElement || undefined}
      />

      <ClientDataModal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        onSave={finalizeShare}
        clientData={clientData}
        setClientData={setClientData}
      />
    </div>
  );
}