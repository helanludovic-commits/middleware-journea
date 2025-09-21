const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_API_BASE = 'https://services.leadconnectorhq.com/contacts';

async function updateGHLContact(contact_id, supabase_user_id) {
  if (!GHL_API_KEY) {
    console.error("❌ Clé API GHL manquante.");
    return;
  }
  try {
    const payload = {
      customFields: [
        {
          key: "supabase_user_id",
          value: supabase_user_id
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
          Version: '2021-07-28'
        }
      }
    );
    console.log('✅ GHL contact mis à jour:', response.data);
  } catch (error) {
    console.error('❌ Erreur mise à jour contact GHL:', error.response?.data || error.message);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }
  try {
    const ghlContact = req.body;
    console.log("🎉 Webhook GHL reçu :", ghlContact);

    const userEmail = ghlContact.email;
    const ghlContactId = ghlContact.contact_id || ghlContact.id;

    if (!userEmail) {
      console.warn("⚠️ Email manquant, webhook ignoré.");
      return res.status(200).send("Email manquant, traitement ignoré.");
    }

    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({ email: userEmail });
    if (listError) throw listError;

    let supabaseUser;
    if (!users || users.length === 0) {
      const { data: { user: newUser }, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: userEmail,
        email_confirm: true,
        password: Math.random().toString(36).slice(-8),
        app_metadata: {
          gohighlevel_contact_id: ghlContactId,
          full_name: ghlContact.fullName || ghlContact.full_name || '',
        }
      });
      if (createError) throw createError;
      supabaseUser = newUser;
      console.log(`✅ Nouvel utilisateur créé : ${supabaseUser.email} (id: ${supabaseUser.id})`);
    } else {
      supabaseUser = users[0];
      console.log(`👍 Utilisateur existant : ${supabaseUser.email} (id: ${supabaseUser.id})`);
    }

    if (ghlContactId && supabaseUser && supabaseUser.id) {
      await updateGHLContact(ghlContactId, supabaseUser.id);
    } else {
      console.warn("⚠️ Pas de contact_id ou utilisateur valide pour mise à jour GHL.");
    }

    res.status(200).send("Webhook traité avec succès.");
  } catch (error) {
    console.error("❌ Erreur webhook :", error.message || error);
    res.status(500).send("Erreur serveur");
  }
};
