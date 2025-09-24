import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch('https://rest.gohighlevel.com/v1/contacts/', {
      headers: {
        'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch contacts from GHL');
    }

    const data = await response.json();
    
    // Formater les contacts pour l'interface
    const formattedContacts = data.contacts?.map((contact: any) => ({
      id: contact.id,
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      email: contact.email || '',
      phone: contact.phone || '',
      createdAt: contact.dateAdded,
      hasItineraries: contact.customFields?.itinerary_count || 0
    })) || [];

    return NextResponse.json({
      success: true,
      clients: formattedContacts
    });

  } catch (error) {
    console.error('Error fetching GHL clients:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch clients'
    }, { status: 500 });
  }
}