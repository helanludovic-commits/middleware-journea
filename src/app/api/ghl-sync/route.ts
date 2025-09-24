import { NextRequest, NextResponse } from 'next/server';
import { syncGHLContacts, syncGHLOpportunities } from '@/lib/ghl-api';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Début de la synchronisation GHL');

    // Vérification de l'API key GHL
    if (!process.env.GHL_API_KEY) {
      console.error('❌ API Key GHL manquante');
      return NextResponse.json(
        { error: 'Configuration GHL manquante' },
        { status: 500 }
      );
    }

    const results = {
      contacts: { synced: 0, errors: 0 },
      opportunities: { synced: 0, errors: 0 },
      startTime: new Date().toISOString(),
      endTime: '',
      success: false
    };

    try {
      // 1. Synchroniser les contacts GHL → clients
      console.log('📞 Synchronisation des contacts GHL...');
      const contactsResult = await syncGHLContacts();
      results.contacts = contactsResult;
      console.log(`✅ Contacts synchronisés: ${contactsResult.synced}, erreurs: ${contactsResult.errors}`);
      
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation des contacts:', error);
      results.contacts.errors++;
    }

    try {
      // 2. Synchroniser les opportunités GHL → itinéraires
      console.log('🎯 Synchronisation des opportunités GHL...');
      const opportunitiesResult = await syncGHLOpportunities();
      results.opportunities = opportunitiesResult;
      console.log(`✅ Opportunités synchronisées: ${opportunitiesResult.synced}, erreurs: ${opportunitiesResult.errors}`);
      
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation des opportunités:', error);
      results.opportunities.errors++;
    }

    results.endTime = new Date().toISOString();
    results.success = true;

    const totalSynced = results.contacts.synced + results.opportunities.synced;
    const totalErrors = results.contacts.errors + results.opportunities.errors;

    console.log(`🎉 Synchronisation terminée: ${totalSynced} éléments synchronisés, ${totalErrors} erreurs`);

    return NextResponse.json({
      success: true,
      message: `Synchronisation réussie: ${totalSynced} éléments synchronisés`,
      results
    });

  } catch (error) {
    console.error('💥 Erreur générale lors de la synchronisation GHL:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la synchronisation GHL',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Endpoint pour vérifier le statut de l'API GHL
  try {
    const isConfigured = !!process.env.GHL_API_KEY && !!process.env.GHL_LOCATION_ID;
    
    return NextResponse.json({
      configured: isConfigured,
      lastSync: null, // Vous pouvez stocker cette info en base si nécessaire
      status: isConfigured ? 'ready' : 'not_configured'
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du statut GHL' },
      { status: 500 }
    );
  }
}