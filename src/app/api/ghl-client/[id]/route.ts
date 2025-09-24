import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetch(`https://rest.gohighlevel.com/v1/contacts/${params.id}`, {
      headers: {
        'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Contact not found');
    }

    const data = await response.json();
    
    const formattedClient = {
      id: data.contact.id,
      firstName: data.contact.firstName || '',
      lastName: data.contact.lastName || '',
      email: data.contact.email || '',
      phone: data.contact.phone || ''
    };

    return NextResponse.json({
      success: true,
      client: formattedClient
    });

  } catch (error) {
    console.error('Error fetching GHL client:', error);
    return NextResponse.json({
      success: false,
      error: 'Client not found'
    }, { status: 404 });
  }
}