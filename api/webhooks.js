const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// --- FONCTION POUR METTRE À JOUR GHL (VERSION CORRIGÉE) ---
// Note : Assurez-vous d'avoir ajouté ces variables d'environnement sur Vercel
const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_API_BASE = 'https://services.leadconnectorhq.com/contacts'; // Base URL plus précise
const GHL_SUPABASE_ID_FIELD = process.env.GHL_SUPABASE_ID_FIELD;

async function updateGHLContact(contact_id, supabase_user_id) {
  // On vérifie qu'on a bien les informations nécessaires
  if (!GHL_API_KEY || !GHL_SUPABASE_ID_FIELD) {
    console.error("Clé API GHL ou ID de champ personnalisé manquant.");
    return;
  }
  
  try {
    // Voici le format de données correct pour l'API de GHL
    const payload = {
      customFields: [
        {
          "id": GHL_SUPABASE_ID_FIELD,
          "value": supabase_user_id
        }
      ]
    };

    const response = await axios.put(
      `${GHL_API_BASE}/${contact_id}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${GHL_API_KEY}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        }
      }
    );
    console.log('✅ GHL contact mis à jour:', contact_id);
  } catch (error) {
    // Affiche l'erreur exacte renvoyée par l'API de GHL
    console.error('❌ Erreur lors de la mise à jour du contact GHL:', error.response?.data || error.message);
  }
}


// --- HANDLER PRINCIPAL POUR VERCEL (VERSION CORRIGÉE) ---
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  console.log("🎉 Webhook de GoHighLevel reçu ! Démarrage du traitement...");

  try {
    const ghlContact = req.body;
    const userEmail = ghlContact.email;
    const ghlContactId = ghlContact.contact_id || ghlContact.id;

    if (!userEmail) {
      return res.status(200).send("Email manquant, traitement ignoré.");
    }
    
    // Initialisation du client Supabase
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Vérifie si l'utilisateur existe déjà
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({ email: userEmail });
    if (listError) throw listError;
    
    let supabaseUser; // On déclare la variable qui contiendra l'utilisateur final

    if (users && users.length === 0) {
      // Crée un utilisateur Supabase (SYNTAXE CORRIGÉE)
      const { data: { user: newUser }, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: userEmail,
        email_confirm: true,
        password: Math.random().toString(36).slice(-8), // Mot de passe aléatoire
        app_metadata: {
          gohighlevel_contact_id: ghlContactId,
          full_name: ghlContact.fullName || ghlContact.full_name || '',
        }
      });

      if (createError) throw createError;
      supabaseUser = newUser;
      console.log(`✅ Nouvel utilisateur créé : ${supabaseUser.email} (id: ${supabaseUser.id})`);

    } else {
      // Met à jour l'utilisateur existant (pas nécessaire de le mettre à jour ici, mais on récupère l'info)
      supabaseUser = users[0];
      console.log(`👍 Utilisateur existant trouvé : ${supabaseUser.email} (id: ${supabaseUser.id})`);
    }

    // Met à jour la fiche contact GHL avec l'id de l'utilisateur Supabase
    if (ghlContactId && supabaseUser && supabaseUser.id) {
      await updateGHLContact(ghlContactId, supabaseUser.id);
    } else {
      console.warn("Pas de contact_id ou d'utilisateur valide pour mise à jour GHL.");
    }

    return res.status(200).send("Webhook traité avec succès.");

  } catch (err) {
    console.error("❌ Erreur dans le webhook : ", err.message);
    return res.status(500).send("Erreur serveur");
  }
};