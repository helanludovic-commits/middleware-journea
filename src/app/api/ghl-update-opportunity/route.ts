import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { itineraryId, clientId, shareUrl } = await request.json();
    
    // Récupérer l'opportunity_id depuis Supabase
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: itinerary } = await supabase
      .from('itineraires')
      .select('ghl_opportunity_id')
      .eq('id', itineraryId)
      .single();
    
    if (itinerary?.ghl_opportunity_id) {
      // Mettre à jour l'opportunité GHL avec le lien
      const ghlResponse = await fetch(
        `https://services.leadconnectorhq.com/v1/opportunities/${itinerary.ghl_opportunity_id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            customFields: {
              'lien_itineraire': shareUrl // Créez ce custom field dans GHL
            }
          })
        }
      );
      
      if (!ghlResponse.ok) {
        throw new Error('Erreur mise à jour GHL');
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur API GHL:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}