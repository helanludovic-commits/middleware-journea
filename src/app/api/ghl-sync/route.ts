import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { itinerary, clientData } = await request.json();
    
    const response = await fetch('https://rest.gohighlevel.com/v1/contacts/', {
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
          itinerary_url: `${process.env.NEXT_PUBLIC_SITE_URL}/client/${itinerary.id}`
        }
      })
    });

    const result = await response.json();
    return NextResponse.json({ success: true, data: result });
    
  } catch (error) {
    console.error('GHL Sync Error:', error);
    return NextResponse.json({ success: false, error: 'Sync failed' }, { status: 500 });
  }
}