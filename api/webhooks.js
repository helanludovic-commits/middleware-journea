const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// --- VARIABLES D'ENVIRONNEMENT (à configurer sur Vercel) ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_SUPABASE_ID_FIELD = process.env.GHL_SUPABASE_ID_FIELD; // L'ID unique de votre champ personnalisé

// --- FONCTION POUR METTRE À JOUR GHL (Version Finale) ---
async function updateGHLContact(requestId, contact_id, supabase_user_id) {
  if (!GHL_API_KEY || !GHL_SUPABASE_ID_FIELD) {
    console.error(`[${requestId}] [GHL_UPDATE] ❌ Variables d'environnement GHL manquantes.`);
    return;
  }
  try {
    const payload = {
      customFields: [{ "id": GHL_SUPABASE_ID_FIELD, "value": supabase_user_id }]
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

// --- HANDLER PRINCIPAL POUR VERCEL (Version Finale) ---
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

    // Puisque GHL bloque les doublons, nous procédons directement à la création.
    // Supabase renverra une erreur si l'email existe déjà, ce qui est une sécurité supplémentaire.
    console.log(`[${requestId}] [SUPABASE] Tentative de création d'utilisateur pour : ${userEmail}`);
    
    const { data: { user: newUser }, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: userEmail,
      email_confirm: true, // L'utilisateur est confirmé automatiquement
      app_metadata: {
        gohighlevel_contact_id: ghlContactId,
        gohighlevel_location_id: ghlContact.location?.id,
        full_name: ghlContact.fullName || ghlContact.full_name || '',
      },
    });

    if (createError) {
      // Si Supabase renvoie une erreur (ex: l'utilisateur existe déjà par sécurité), on la logue
      console.error(`[${requestId}] [SUPABASE] ❌ Erreur création utilisateur Supabase :`, createError.message);
      // On peut quand même tenter de mettre à jour GHL si l'utilisateur existe déjà
      if (createError.message.includes("already exists")) {
          console.log(`[${requestId}] [SUPABASE] 👍 L'utilisateur existe déjà, on continue...`);
          // On ne fait rien de plus ici, mais on pourrait récupérer l'ID existant si besoin
      } else {
          throw createError; // Si c'est une autre erreur, on arrête
      }
    }

    if (newUser) {
      console.log(`[${requestId}] [SUPABASE] ✅ Nouvel utilisateur créé : ${newUser.email} (id: ${newUser.id})`);
      // On met à jour GHL uniquement si un nouvel utilisateur a été créé
      await updateGHLContact(requestId, ghlContactId, newUser.id);
    }

    return res.status(200).send(`[${requestId}] Webhook traité avec succès.`);

  } catch (err) {
    console.error(`[${requestId}] ❌ Erreur fatale dans le webhook : `, err.message);
    return res.status(500).send("Erreur serveur");
  }
};