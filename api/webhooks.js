const { createClient } = require('@supabase/supabase-js');

// --- HANDLER PRINCIPAL POUR VERCEL (Version Finale Multi-Tenant) ---
module.exports = async function handler(req, res) {
  const requestId = Math.random().toString(36).substring(2, 8);

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  console.log(`[${requestId}] 🎉 Webhook GHL reçu !`);

  try {
    const ghlContact = req.body;
    const userEmail = ghlContact.email;
    const ghlContactId = ghlContact.contact_id || ghlContact.id;
    const ghlLocationId = ghlContact.location?.id; // L'ID de l'agence partenaire
    const agenceName = ghlContact.location?.name; // Le nom de l'agence partenaire

    if (!userEmail || !ghlContactId || !ghlLocationId) {
      return res.status(200).send(`[${requestId}] Données essentielles manquantes (email, contact_id, location_id), traitement ignoré.`);
    }

    console.log(`[${requestId}] Traitement pour le contact : ${userEmail} de l'agence ${ghlLocationId}`);

    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // --- LOGIQUE MULTI-TENANT ---
    // 1. Vérifier si l'agence (tenant) existe déjà
    let { data: agence, error: findAgenceError } = await supabaseAdmin
      .from('agences')
      .select('id')
      .eq('ghl_location_id', ghlLocationId)
      .single();

    if (findAgenceError && findAgenceError.code !== 'PGRST116') { // PGRST116 = "Aucune ligne trouvée"
      throw findAgenceError;
    }

    // 2. Si l'agence n'existe pas, la créer
    if (!agence) {
      console.log(`[${requestId}] Agence ${ghlLocationId} non trouvée. Création en cours...`);
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
      console.log(`[${requestId}] ✅ Agence créée avec l'ID Supabase : ${agence.id}`);
    } else {
        console.log(`[${requestId}] 👍 Agence existante trouvée avec l'ID Supabase : ${agence.id}`);
    }

    // 3. Créer l'utilisateur dans Supabase Auth
    // On passe l'ID de l'agence (créée ou trouvée) dans les métadonnées pour le trigger
    console.log(`[${requestId}] Tentative de création d'utilisateur pour : ${userEmail}`);
    const { data: { user: newUser }, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: userEmail,
        email_confirm: true,
        app_metadata: {
            gohighlevel_contact_id: ghlContactId,
            gohighlevel_location_id: agence.id // On utilise l'ID UUID de notre table 'agences'
        }
    });

    if (createUserError) {
        if (createUserError.message.includes("already exists")) {
            console.log(`[${requestId}] 👍 L'utilisateur avec l'email ${userEmail} existe déjà. Processus terminé.`);
        } else {
            throw createUserError;
        }
    } else {
        console.log(`[${requestId}] ✅ Nouvel utilisateur créé : ${newUser.email}`);
    }

    return res.status(200).send(`[${requestId}] Webhook traité avec succès.`);

  } catch (err) {
    console.error(`[${requestId}] ❌ Erreur fatale dans le webhook : `, err.message);
    return res.status(500).send("Erreur serveur");
  }
};