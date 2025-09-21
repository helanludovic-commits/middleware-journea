const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// --- FONCTION POUR METTRE À JOUR GHL ---
const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_API_BASE = 'https://services.leadconnectorhq.com/contacts';
const GHL_SUPABASE_ID_FIELD = process.env.GHL_SUPABASE_ID_FIELD;

async function updateGHLContact(contact_id, supabase_user_id) {
  if (!GHL_API_KEY || !GHL_SUPABASE_ID_FIELD) {
    console.error("[GHL_UPDATE] Variables d'environnement GHL manquantes.");
    return;
  }
  try {
    const payload = {
      customFields: [{ "id": GHL_SUPABASE_ID_FIELD, "value": supabase_user_id }]
    };
    await axios.put(`${GHL_API_BASE}/${contact_id}`, payload, {
      headers: {
        Authorization: `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      }
    });
    console.log(`[GHL_UPDATE] ✅ GHL contact mis à jour : ${contact_id}`);
  } catch (error) {
    console.error(`[GHL_UPDATE] ❌ Erreur mise à jour contact GHL (${contact_id}):`, error.response?.data || error.message);
  }
}

// --- HANDLER PRINCIPAL POUR VERCEL ---
module.exports = async function handler(req, res) {
  // On génère un ID unique pour chaque requête pour mieux suivre les logs
  const requestId = Math.random().toString(36).substring(2, 8);

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  console.log(`[${requestId}] 🎉 Webhook GHL reçu !`);

  try {
    const ghlContact = req.body;
    const userEmail = ghlContact.email;
    const ghlContactId = ghlContact.contact_id || ghlContact.id;

    if (!userEmail) {
      return res.status(200).send(`[${requestId}] Email manquant, traitement ignoré.`);
    }
    
    console.log(`[${requestId}] Données reçues pour le contact : ${userEmail} (ID: ${ghlContactId})`);

    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // LOG DE VÉRIFICATION SUGGÉRÉ
    console.log(`[${requestId}] Recherche utilisateur Supabase avec email :`, userEmail);

    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      email: userEmail
    });

    if (listError) throw listError;
    
    let supabaseUser;

    if (users && users.length === 0) {
      console.log(`[${requestId}] Utilisateur non trouvé. Création en cours...`);
      const { data: { user: newUser }, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: userEmail,
        email_confirm: true,
        app_metadata: {
          gohighlevel_contact_id: ghlContactId,
        },
      });
      if (createError) throw createError;
      supabaseUser = newUser;
      console.log(`[${requestId}] ✅ Nouvel utilisateur créé : ${supabaseUser.email} (id: ${supabaseUser.id})`);
    } else {
      supabaseUser = users[0];
      console.log(`[${requestId}] 👍 Utilisateur existant trouvé : ${supabaseUser.email} (id: ${supabaseUser.id})`);
    }

    if (ghlContactId && supabaseUser && supabaseUser.id) {
      await updateGHLContact(ghlContactId, supabaseUser.id);
    }

    return res.status(200).send(`[${requestId}] Webhook traité avec succès.`);

  } catch (err) {
    console.error(`[${requestId}] ❌ Erreur dans le webhook : `, err.message);
    return res.status(500).send("Erreur serveur");
  }
};