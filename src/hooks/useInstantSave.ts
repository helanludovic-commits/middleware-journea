// src/hooks/useInstantSave.ts
import { useEffect, useRef, useState } from 'react';

interface UseInstantSaveOptions {
  onSave: (data: any) => Promise<void>;
  onError?: (error: Error) => void;
  enabled?: boolean;
}

interface SaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
}

export function useInstantSave<T>(
  data: T,
  options: UseInstantSaveOptions
): SaveState & {
  saveNow: () => Promise<void>;
} {
  const { onSave, enabled = true, onError } = options;

  const [state, setState] = useState<SaveState>({
    isSaving: false,
    lastSaved: null,
    error: null
  });

  const isFirstRender = useRef(true);
  const lastDataRef = useRef<T>(data);
  const saveInProgressRef = useRef(false);

  // Fonction de sauvegarde
  const saveData = async (dataToSave: T) => {
    if (!onSave || !enabled || saveInProgressRef.current) return;

    saveInProgressRef.current = true;
    setState(prev => ({ 
      ...prev, 
      isSaving: true, 
      error: null
    }));

    try {
      await onSave(dataToSave);
      setState(prev => ({ 
        ...prev, 
        isSaving: false, 
        lastSaved: new Date(),
        error: null
      }));
      console.log('💾 Sauvegarde instantanée réussie à', new Date().toLocaleTimeString());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de sauvegarde';
      setState(prev => ({ 
        ...prev, 
        isSaving: false, 
        error: errorMessage
      }));
      
      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage));
      }
      console.error('❌ Erreur de sauvegarde:', error);
    } finally {
      saveInProgressRef.current = false;
    }
  };

  // Fonction de sauvegarde manuelle
  const saveNow = async () => {
    await saveData(data);
  };

  // Sauvegarde INSTANTANÉE à chaque changement
  useEffect(() => {
    // Ignorer le premier rendu
    if (isFirstRender.current) {
      isFirstRender.current = false;
      lastDataRef.current = data;
      return;
    }

    // Vérifier si les données ont changé
    const hasChanged = JSON.stringify(data) !== JSON.stringify(lastDataRef.current);
    if (!hasChanged || !enabled || !onSave) return;

    lastDataRef.current = data;

    // SAUVEGARDE IMMÉDIATE - Pas de délai !
    saveData(data);
  }, [data, enabled, onSave]);

  return {
    ...state,
    saveNow
  };
}