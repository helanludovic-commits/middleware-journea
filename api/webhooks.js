const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// --- FONCTION POUR METTRE À JOUR GHL ---
const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_API_BASE = 'https://services.leadconnectorhq.com/contacts';
const GHL_SUPABASE_ID_FIELD = process.env.GHL_SUPABASE_ID_FIELD;

async function updateGHLContact(contact_id, supabase_user_id) {
  if (!GHL_API_KEY || !GHL_SUPABASE_ID_FIELD) {
    console.error("Variables d'environnement GHL manquantes.");
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
    console.log(`✅ GHL contact mis à jour : ${contact_id}`);
  } catch (error) {
    console.error(`❌ Erreur mise à jour contact GHL (${contact_id}):`, error.response?.data || error.message);
  }
}

// --- HANDLER PRINCIPAL POUR VERCEL ---
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  console.log("🎉 Webhook GHL reçu !");

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

    // REPRISE DE LA BONNE MÉTHODE "listUsers"
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      email: userEmail
    });

    if (listError) throw listError;
    
    let supabaseUser;

    if (users && users.length === 0) {
      // Si l'utilisateur n'existe pas, on le crée
      const { data: { user: newUser }, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: userEmail,
        email_confirm: true,
        app_metadata: {
          gohighlevel_contact_id: ghlContactId,
        },
      });
      if (createError) throw createError;
      supabaseUser = newUser;
      console.log(`✅ Nouvel utilisateur créé : ${supabaseUser.email} (id: ${supabaseUser.id})`);
    } else {
      // Si l'utilisateur existe déjà, on récupère ses informations
      supabaseUser = users[0];
      console.log(`👍 Utilisateur existant : ${supabaseUser.email} (id: ${supabaseUser.id})`);
    }

    // Mise à jour GHL
    if (ghlContactId && supabaseUser && supabaseUser.id) {
      await updateGHLContact(ghlContactId, supabaseUser.id);
    }

    return res.status(200).send("Webhook traité avec succès.");

  } catch (err) {
    console.error("❌ Erreur dans le webhook : ", err.message);
    return res.status(500).send("Erreur serveur");
  }
};