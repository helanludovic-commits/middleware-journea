import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Attendre la résolution des params
    const { id } = await params;
    
    // Votre logique ici
    return NextResponse.json({
      success: true,
      clientId: id,
      message: 'Client récupéré avec succès'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du client' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Votre logique de mise à jour ici
    
    return NextResponse.json({
      success: true,
      clientId: id,
      message: 'Client mis à jour avec succès'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du client' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Votre logique de suppression ici
    
    return NextResponse.json({
      success: true,
      clientId: id,
      message: 'Client supprimé avec succès'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du client' },
      { status: 500 }
    );
  }
}