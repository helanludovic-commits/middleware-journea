'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Share2, Calendar, Bed, Car, MapPin, Utensils, ClipboardList, Edit, Trash2, X, Paperclip, ArrowLeft, Save } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

// Types
interface FileAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
  path: string;
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

interface ItineraryData {
  id: string;
  titre: string;
  days: Day[];
  client?: any;
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

// Ajoutez cet objet au début du fichier, après les interfaces (ligne ~40)
const fieldLabels: Record<string, string> = {
  // Hébergement
  name: "Nom",
  address: "Adresse",
  checkin: "Arrivée",
  checkout: "Départ",
  price: "Prix",
  stars: "Étoiles",
  
  // Transport
  type: "Type",
  departure: "Départ",
  arrival: "Arrivée",
  time: "Heure",
  number: "Numéro",
  
  // Activité
  location: "Lieu",
  duration: "Durée",
  
  // Restaurant
  cuisine: "Type de cuisine",
  
  // Démarche
  description: "Description",
  deadline: "Date limite"
};

// Configuration des types d'éléments
const elementTypes: Record<string, {
  name: string;
  icon: any;
  color: string;
  fields: FieldConfig[];
}> = {
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
  }
};

// Composant élément avec drag & drop
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
                <span className="capitalize">{fieldLabels[key] || key}:</span>
                <span>{value}</span>
              </div>
            );
          }
          return null;
        })}
      </div>

      {element.files && element.files.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-500 mb-1">Fichiers joints:</div>
          <div className="flex flex-wrap gap-1">
            {element.files.map(file => (
              <span key={file.id} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                <Paperclip className="w-3 h-3 mr-1" />
                {file.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Composant jour avec drag & drop
function DraggableDay({ 
  day, 
  index,
  onAddElement, 
  onDeleteDay, 
  onEditElement, 
  onDeleteElement,
  onMoveDay,
  onDropElement, 
  onReorderElements
}: {
  day: Day;
  index: number;
  onAddElement: (dayId: string) => void;
  onDeleteDay: (dayId: string) => void;
  onEditElement: (element: TravelElement) => void;
  onDeleteElement: (dayId: string, elementId: string) => void;
  onMoveDay: (fromIndex: number, toIndex: number) => void;
  onDropElement: (elementId: string, sourceDayId: string, targetDayId: string) => void;
  onReorderElements: (dayId: string, fromIndex: number, toIndex: number) => void;
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

      <div className="flex-1 p-4 min-h-[300px]">
        <div className="space-y-3">
          {day.elements.map((element, elementIndex) => (
            <div
              key={element.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({ 
                  elementId: element.id, 
                  sourceDayId: day.id,
                  sourceIndex: elementIndex,
                  type: 'element-reorder'
                }));
              }}
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                
                if (data.type === 'element-reorder' && data.sourceDayId === day.id) {
                  onReorderElements(day.id, data.sourceIndex, elementIndex);
                }
              }}
              className="cursor-move"
            >
              <DraggableElement
                element={element}
                dayId={day.id}
                onEdit={onEditElement}
                onDelete={(elementId) => onDeleteElement(day.id, elementId)}
              />
            </div>
          ))}
        </div>
        
        {day.elements.length === 0 && (
          <div className="text-center text-gray-400 py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Glissez des éléments ici</p>
          </div>
        )}
      </div>

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
function ElementFormModal({ isOpen, onClose, onSave, elementType, initialData, itineraryId }: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  elementType: keyof typeof elementTypes | null;
  initialData?: TravelElement;
  itineraryId: string; // ⬅️ AJOUTEZ CETTE LIGNE
}) {
  const [formData, setFormData] = useState(initialData?.details || {});
  const [files, setFiles] = useState<FileAttachment[]>(initialData?.files || []);

  React.useEffect(() => {
    if (initialData) {
      setFormData(initialData.details);
      setFiles(initialData.files || []);
    } else {
      setFormData({});
      setFiles([]);
    }
  }, [initialData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
  
    for (const file of selectedFiles) {
      try {
        // 1. Upload vers Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${itineraryId}/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 2. Récupérer l'URL publique
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);

        // 3. Enregistrer dans la table documents
        const { data: insertedDoc, error: dbError } = await supabase
          .from('documents')
          .insert({
            itineraire_id: itineraryId,
            client_id: itinerary?.client?.id || null,
            nom_fichier: file.name,
            url_fichier: publicUrl,
            type_fichier: file.type,
            date_ajout: new Date().toISOString(),
            agence_id: itinerary?.agence_id || null  // ✅ NOUVEAU
          })
          .select()
          .single();

        if (dbError) {
          console.error('❌ Erreur insertion DB:', dbError);
          alert(`Erreur base de données: ${dbError.message}`);
        } else {
          console.log('✅ Document inséré:', insertedDoc);
        }

        // 4. Créer l'objet fichier pour l'affichage local
        const newFile: FileAttachment = {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: file.type,
          url: publicUrl,
          path: filePath,
          uploadedAt: new Date().toISOString()
        };
      
        setFiles(prev => [...prev, newFile]);
      } catch (error) {
        console.error('Erreur upload:', error);
        alert(`Erreur lors de l'upload de ${file.name}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    }
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

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
      details: formData,
      files: files
    });
    setFormData({});
    setFiles([]);
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
              
              {field.type === 'select' && 'options' in field && field.options ? (
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

          {/* Section upload de fichiers */}
          <div className="border-t pt-4 mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fichiers joints (PDFs, images)
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
              multiple
              onChange={handleFileUpload}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            
            {files.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="text-xs text-gray-500">Fichiers ajoutés:</div>
                {files.map(file => (
                  <div key={file.id} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-3 h-3 text-gray-400" />
                      <a 
                        href={file.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        download={file.name}
                        className="text-blue-600 hover:underline"
                      >
                        {file.name}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(file.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
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

// Composant principal
export default function GeneratorPage() {
  const params = useParams();
  const router = useRouter();
  const itineraryId = params.id as string;
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [itinerary, setItinerary] = useState<ItineraryData | null>(null);
  const [days, setDays] = useState<Day[]>([
    { id: 'day-1', name: 'Jour 1', elements: [] },
    { id: 'day-2', name: 'Jour 2', elements: [] }
  ]);
  const [loading, setLoading] = useState(true);

  // États des modales
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedElementType, setSelectedElementType] = useState<keyof typeof elementTypes | null>(null);
  const [currentDayId, setCurrentDayId] = useState<string | null>(null);
  const [editingElement, setEditingElement] = useState<TravelElement | null>(null);
  
  // États de sauvegarde
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const saveItinerary = async () => {
    if (!itinerary) return;

    setIsSaving(true);
    try {
      // 1. Sauvegarde localStorage (immédiate, toujours réussie)
      localStorage.setItem(`itinerary-${itineraryId}`, JSON.stringify({
        ...itinerary,
        days,
        lastSaved: new Date().toISOString()
      }));

      // 2. Sauvegarde Supabase (en arrière-plan)
      const { error } = await supabase
        .from('itineraires')
        .update({ 
          contenu: days, // Pas besoin de JSON.stringify avec JSONB
          updated_at: new Date().toISOString()
        })
        .eq('id', itineraryId);

      if (error) {
        console.error('Erreur Supabase:', error);
        // On continue quand même car localStorage a fonctionné
        console.warn('Données sauvegardées localement uniquement');
      } else {
        console.log('✅ Sauvegarde complète (local + cloud)');
      }

      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('❌ Erreur de sauvegarde:', error);
      // Afficher le détail de l'erreur pour déboguer
      if (error instanceof Error) {
        alert(`Erreur: ${error.message}`);
      } else {
        alert('Erreur lors de la sauvegarde. Données sauvegardées localement.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!loading && itinerary) {
      setHasUnsavedChanges(true);
    }
  }, [days]);

  useEffect(() => {
    if (hasUnsavedChanges && !loading && itinerary) {
      const autoSaveInterval = setInterval(() => {
        saveItinerary();
      }, 10000);
    
      return () => clearInterval(autoSaveInterval);
    }
  }, [hasUnsavedChanges, days, loading, itinerary]);
  
  useEffect(() => {
    loadItinerary();
  }, [itineraryId]);

  const loadItinerary = async () => {
    try {
      const { data: itineraryData, error } = await supabase
        .from('itineraires')
        .select(`*, client:clients(*)`)
        .eq('id', itineraryId)
        .single();
      
      if (error) throw error;
      setItinerary(itineraryData);
    
      // Charger les jours depuis Supabase en priorité
      if (itineraryData.contenu && Array.isArray(itineraryData.contenu)) {
        setDays(itineraryData.contenu);
        console.log('✅ Données chargées depuis Supabase');
      } else {
        // Fallback sur localStorage si pas de données dans Supabase
        const savedDays = JSON.parse(localStorage.getItem(`itinerary-${itineraryId}`) || 'null');
        if (savedDays?.days) {
          setDays(savedDays.days);
          console.log('📦 Données chargées depuis localStorage');
        }
      }
    } catch (error) {
      console.error('Erreur chargement itinéraire:', error);
      // En cas d'erreur totale, charger depuis localStorage
      const savedDays = JSON.parse(localStorage.getItem(`itinerary-${itineraryId}`) || 'null');
      if (savedDays?.days) {
        setDays(savedDays.days);
        console.log('📦 Données de secours chargées depuis localStorage');
      }
    } finally {
      setLoading(false);
    }   
  };

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

  // Réorganiser les éléments dans un même jour
  const reorderElements = (dayId: string, fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    setDays(days => days.map(day => {
      if (day.id === dayId) {
        const newElements = [...day.elements];
        const [movedElement] = newElements.splice(fromIndex, 1);
        newElements.splice(toIndex, 0, movedElement);
        return { ...day, elements: newElements };
      }
      return day;
    }));
  };

  const openAddElement = (dayId: string) => {
    setCurrentDayId(dayId);
    setEditingElement(null);
    setShowTypeModal(true);
  };

  const selectElementType = (type: keyof typeof elementTypes) => {
    setSelectedElementType(type);
    setShowTypeModal(false);
    setShowFormModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Itinéraire introuvable</h2>
          <Button onClick={() => router.push('/')}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar onGHLSync={() => {}} />
      
      {/* En-tête */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => router.push('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-blue-600" />
                  {itinerary.titre}
                </h1>
                <p className="text-gray-600">Client: {itinerary.client?.nom}</p>
              </div>
            </div>
      
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                {isSaving && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                    <span>Sauvegarde...</span>
                  </div>
                )}
                {!isSaving && lastSaved && (
                  <div className="text-green-600 text-xs">
                    Sauvegardé à {lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
                {!isSaving && hasUnsavedChanges && (
                  <div className="text-orange-600 text-xs">
                    Modifications non sauvegardées
                  </div>
                )}
              </div>

              <Button 
                onClick={saveItinerary}
                disabled={isSaving || !hasUnsavedChanges}
                variant={hasUnsavedChanges ? "primary" : "outline"}
                className={hasUnsavedChanges ? "animate-pulse" : ""}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Sauvegarder
                  </>
                )}
              </Button>

              <div className="flex gap-3">
                <Button onClick={addDay} variant="secondary">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un jour
                </Button>
                <Button onClick={() => {
                  const url = `${window.location.origin}/client/${itineraryId}`;
                  setShareUrl(url);
                  setShowShareModal(true);
                }}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Partager
                </Button>
              </div>
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
              onEditElement={(element) => {
                const dayId = days.find(day => 
                  day.elements.some(el => el.id === element.id)
                )?.id;
          
                if (dayId) {
                  setCurrentDayId(dayId);
                  setEditingElement(element);
                  setSelectedElementType(element.type);
                  setShowFormModal(true);
                }
              }}
              onDeleteElement={(dayId, elementId) => {
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
              }}
              onMoveDay={moveDay}
              onDropElement={dropElement}
              onReorderElements={reorderElements}
            />
          ))}
        </div>
      </main>
  
      {/* Modal de partage */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Partager l'itinéraire</h3>
              <button onClick={() => setShowShareModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lien de partage client
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 p-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl);
                      alert('Lien copié !');
                    }}
                    variant="outline"
                  >
                    Copier
                  </Button>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => window.open(shareUrl, '_blank')}
                  variant="outline"
                  className="flex-1"
                >
                  Aperçu client
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      await fetch('/api/ghl-update-opportunity', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          itineraryId: itinerary?.id,
                          clientId: itinerary?.client?.id,
                          shareUrl: shareUrl
                        })
                      });
                      alert('Lien envoyé au client et ajouté à GHL !');
                      setShowShareModal(false);
                    } catch (error) {
                      console.error('Erreur GHL:', error);
                      alert('Lien copié, mais erreur de synchronisation GHL');
                    }
                  }}
                  className="flex-1"
                >
                  Envoyer au client
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modales */}
      <TypeSelectionModal
        isOpen={showTypeModal}
        onClose={() => setShowTypeModal(false)}
        onSelect={selectElementType}
      />

      <ElementFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        itineraryId={itineraryId} // ⬅️ AJOUTEZ CETTE LIGNE
        onSave={(elementData) => {
          if (!currentDayId) return;

          const newElement: TravelElement = {
            id: editingElement?.id || `element-${Date.now()}`,
            type: elementData.type,
            name: elementData.name,
            details: elementData.details,
            files: elementData.files || []
          };

          setDays(days => days.map(day => {
            if (day.id === currentDayId) {
              if (editingElement) {
                return {
                  ...day,
                  elements: day.elements.map(el => 
                    el.id === editingElement.id ? newElement : el
                  )
                };
              } else {
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
        }}
        elementType={selectedElementType}
        initialData={editingElement || undefined}
      />
    </div>
  );
}

