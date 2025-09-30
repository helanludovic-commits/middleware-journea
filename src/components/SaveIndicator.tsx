// src/components/SaveIndicator.tsx
import React from 'react';
import { Save, Check, AlertCircle, Loader2 } from 'lucide-react';

interface SaveIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
  pendingChanges: boolean;
  onSaveNow?: () => void;
}

export function SaveIndicator({ 
  isSaving, 
  lastSaved, 
  error, 
  pendingChanges, 
  onSaveNow 
}: SaveIndicatorProps) {
  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'à l\'instant';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `il y a ${minutes} min`;
    } else {
      return `à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    }
  };

  const getStatusColor = () => {
    if (error) return 'text-red-600 bg-red-50';
    if (isSaving) return 'text-blue-600 bg-blue-50';
    if (pendingChanges) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  const getStatusIcon = () => {
    if (error) return <AlertCircle className="w-4 h-4" />;
    if (isSaving) return <Loader2 className="w-4 h-4 animate-spin" />;
    if (pendingChanges) return <Save className="w-4 h-4" />;
    return <Check className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (error) return 'Erreur de sauvegarde';
    if (isSaving) return 'Sauvegarde en cours...';
    if (pendingChanges) return 'Modifications non sauvegardées';
    if (lastSaved) return `Sauvegardé ${formatLastSaved(lastSaved)}`;
    return 'Aucune modification';
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors ${getStatusColor()}`}>
      {getStatusIcon()}
      <span>{getStatusText()}</span>
      
      {/* Bouton de sauvegarde manuelle en cas d'erreur */}
      {error && onSaveNow && (
        <button
          onClick={onSaveNow}
          className="ml-2 text-xs underline hover:no-underline"
          title="Réessayer la sauvegarde"
        >
          Réessayer
        </button>
      )}
      
      {/* Bouton de sauvegarde manuelle pour les changements en attente */}
      {pendingChanges && !isSaving && onSaveNow && (
        <button
          onClick={onSaveNow}
          className="ml-2 text-xs underline hover:no-underline"
          title="Sauvegarder maintenant"
        >
          Sauvegarder
        </button>
      )}
    </div>
  );
}