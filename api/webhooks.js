const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Variables d'environnement (à configurer sur Vercel)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GHL_API_KEY = process.env.GHL_API_KEY;

async function updateGHLContact(requestId, contact_id, supabase_user_id) {
  if (!GHL_API_KEY) {
    console.error(`[${requestId}] [GHL_UPDATE] ❌ Clé API GHL manquante.`);
    return;
  }
  try {
    const payload = {
      customFields: [{ key: "supabase_user_id", value: supabase_user_id }]
    };
    await axios.put(`https://services.leadconnectorhq.com/contacts/${contact_id}`, payload, {
      headers: {
        Authorization: `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      }
    });
    console.log(`[${requestId}] [GHL_UPDATE] ✅ GHL contact mis à jour : ${contact_id}`);
  } catch (error) {
    console.error(`[${requestId}] [GHL_UPDATE] ❌ Erreur mise à jour contact GHL (${contact_id}):`, error.response?.data || error.message);
  }
}

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
    if (!userEmail || !ghlContactId) {
      return res.status(200).send(`[${requestId}] Email ou ID de contact manquant, traitement ignoré.`);
    }

    console.log(`[${requestId}] Traitement pour le contact : ${userEmail} (ID: ${ghlContactId})`);
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    console.log(`[${requestId}] [SUPABASE] Tentative de création d'utilisateur pour : ${userEmail}`);

    const { data: { user: newUser }, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: userEmail,
      email_confirm: true,
      app_metadata: {
        gohighlevel_contact_id: ghlContactId,
        gohighlevel_location_id: ghlContact.location?.id,
        full_name: ghlContact.fullName || ghlContact.full_name || '',
      }
    });

    if (createError) {
      console.error(`[${requestId}] [SUPABASE] ❌ Erreur création utilisateur Supabase :`, createError.message);
      if (createError.message.includes("already exists")) {
        console.log(`[${requestId}] [SUPABASE] 👍 L'utilisateur existe déjà, on continue...`);
      } else {
        throw createError;
      }
    }

    if (newUser) {
      console.log(`[${requestId}] [SUPABASE] ✅ Nouvel utilisateur créé : ${newUser.email} (id: ${newUser.id})`);
      await updateGHLContact(requestId, ghlContactId, newUser.id);
    }

    return res.status(200).send(`[${requestId}] Webhook traité avec succès.`);
  } catch (err) {
    console.error(`[${requestId}] ❌ Erreur fatale dans le webhook : `, err.message);
    return res.status(500).send("Erreur serveur");
  }
};
