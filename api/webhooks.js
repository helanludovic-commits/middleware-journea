const { createClient } = require('@supabase/supabase-js');

// --- HANDLER PRINCIPAL POUR VERCEL (Architecture Simplifiée) ---
module.exports = async function handler(req, res) {
  const requestId = Math.random().toString(36).substring(2, 8);
  
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }
  
  console.log(`[${requestId}] 🎉 Webhook GHL reçu !`);
  
  try {
    const ghlContact = req.body;
    
    // Extraction des données GHL
    const userEmail = ghlContact.email;
    const ghlContactId = ghlContact.contact_id || ghlContact.id;
    const ghlLocationId = ghlContact.location?.id;
    const agenceName = ghlContact.location?.name;
    
    // Extraction nom/prénom avec différentes variantes possibles
    const firstName = ghlContact.firstName || ghlContact.first_name || '';
    const lastName = ghlContact.lastName || ghlContact.last_name || '';
    const fullName = ghlContact.name || `${firstName} ${lastName}`.trim() || userEmail.split('@')[0];
    const phone = ghlContact.phone || ghlContact.phoneNumber || null;
    
    // Validation des données essentielles
    if (!userEmail || !ghlContactId) {
      return res.status(200).send(`[${requestId}] Données essentielles manquantes (email, contact_id), traitement ignoré.`);
    }
    
    console.log(`[${requestId}] Traitement pour le contact : ${userEmail} (${fullName})`);
    
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // --- GESTION DES AGENCES (optionnel) ---
    let agenceId = null;
    if (ghlLocationId) {
      // Vérifier si l'agence existe
      let { data: agence, error: findAgenceError } = await supabaseAdmin
        .from('agences')
        .select('id')
        .eq('ghl_location_id', ghlLocationId)
        .single();
      
      if (findAgenceError && findAgenceError.code !== 'PGRST116') {
        throw findAgenceError;
      }
      
      // Créer l'agence si elle n'existe pas
      if (!agence && agenceName) {
        console.log(`[${requestId}] Création de l'agence : ${agenceName}`);
        const { data: newAgence, error: createAgenceError } = await supabaseAdmin
          .from('agences')
          .insert({
            nom_agence: agenceName,
            ghl_location_id: ghlLocationId
          })
          .select('id')
          .single();
        
        if (createAgenceError) throw createAgenceError;
        agence = newAgence;
        console.log(`[${requestId}] ✅ Agence créée : ${agence.id}`);
      }
      
      agenceId = agence?.id;
    }
    
    // --- GESTION DU CLIENT PRINCIPAL ---
    // Vérifier si le client existe déjà
    let { data: existingClient, error: findClientError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('ghl_contact_id', ghlContactId)
      .single();
    
    if (findClientError && findClientError.code !== 'PGRST116') {
      throw findClientError;
    }
    
    if (existingClient) {
      // Mettre à jour le client existant
      console.log(`[${requestId}] Mise à jour du client existant : ${fullName}`);
      const { data: updatedClient, error: updateError } = await supabaseAdmin
        .from('clients')
        .update({
          nom: fullName,
          email: userEmail,
          telephone: phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingClient.id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      console.log(`[${requestId}] ✅ Client mis à jour : ${updatedClient.nom}`);
      
    } else {
      // Créer un nouveau client
      console.log(`[${requestId}] Création d'un nouveau client : ${fullName}`);
      const { data: newClient, error: createError } = await supabaseAdmin
        .from('clients')
        .insert({
          nom: fullName,
          email: userEmail,
          telephone: phone,
          ghl_contact_id: ghlContactId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createError) throw createError;
      console.log(`[${requestId}] ✅ Nouveau client créé : ${newClient.nom} (ID: ${newClient.id})`);
    }
    
    return res.status(200).send(`[${requestId}] Client ${fullName} traité avec succès dans Supabase.`);
    
  } catch (err) {
    console.error(`[${requestId}] ❌ Erreur fatale dans le webhook :`, err.message);
    return res.status(500).send("Erreur serveur");
  }
};