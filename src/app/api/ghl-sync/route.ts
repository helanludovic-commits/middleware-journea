import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { itinerary, clientData } = await request.json();
    
    // 1. Créer/mettre à jour le contact dans GHL
    const contactResponse = await fetch('https://rest.gohighlevel.com/v1/contacts/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firstName: clientData.firstName,
        lastName: clientData.lastName,
        email: clientData.email,
        phone: clientData.phone,
        customFields: {
          itinerary_id: itinerary.id,
          itinerary_title: itinerary.title,
          itinerary_created: itinerary.createdAt,
          client_portal_url: `${process.env.NEXT_PUBLIC_SITE_URL}/client/${itinerary.id}`
        }
      })
    });

    const contactResult = await contactResponse.json();

    // 2. Créer un custom object dans GHL pour l'itinéraire
    if (contactResult.contact?.id) {
      const customObjectResponse = await fetch('https://rest.gohighlevel.com/v1/custom-objects/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Itinéraire de voyage',
          contactId: contactResult.contact.id,
          data: {
            title: itinerary.title,
            days_count: itinerary.days.length,
            elements_count: itinerary.days.reduce((acc, day) => acc + day.elements.length, 0),
            status: 'created',
            client_url: `${process.env.NEXT_PUBLIC_SITE_URL}/client/${itinerary.id}`,
            created_date: itinerary.createdAt
          }
        })
      });
    }

    return NextResponse.json({ 
      success: true, 
      contact: contactResult,
      message: 'Itinéraire synchronisé avec GHL'
    });
    
  } catch (error) {
    console.error('GHL Sync Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Synchronisation GHL échouée',
      details: error.message 
    }, { status: 500 });
  }
}