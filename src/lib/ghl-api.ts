const GHL_API_BASE = 'https://rest.gohighlevel.com/v1';

export async function syncItineraryToGHL(itinerary: any, clientData: any) {
  const response = await fetch(`${GHL_API_BASE}/contacts/`, {
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
        travel_dates: itinerary.dates,
        itinerary_url: `${process.env.NEXT_PUBLIC_SITE_URL}/client/${itinerary.id}`
      }
    })
  });

  return response.json();
}

export async function updateItineraryInGHL(contactId: string, itinerary: any) {
  const response = await fetch(`${GHL_API_BASE}/contacts/${contactId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      customFields: {
        itinerary_updated: new Date().toISOString(),
        itinerary_status: 'updated'
      }
    })
  });

  return response.json();
}
