'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ModernItineraryKanban from '@/components/ModernItineraryKanban';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export default function AssignedItineraryPage({ 
  params 
}: { 
  params: { clientId: string } 
}) {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchClientData();
  }, [params.clientId]);

  const fetchClientData = async () => {
    try {
      const response = await fetch(`/api/ghl-client/${params.clientId}`);
      const data = await response.json();
      
      if (data.success) {
        setClient(data.client);
      } else {
        setError('Client introuvable');
      }
    } catch (err) {
      setError('Erreur lors du chargement du client');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du client...</p>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Bandeau client assigné */}
      <div className="bg-green-50 border-b border-green-200">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <p className="text-sm text-green-800">
            <span className="font-medium">Client assigné :</span> {client.firstName} {client.lastName} ({client.email})
          </p>
        </div>
      </div>
      
      <ModernItineraryKanban preAssignedClient={client} />
    </div>
  );
}