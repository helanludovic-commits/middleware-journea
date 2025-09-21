const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_API_BASE = 'https://rest.gohighlevel.com/v1';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function updateGHLContact(contact_id, supabase_user_id) {
  try {
    const response = await axios.patch(
      `${GHL_API_BASE}/contacts/${contact_id}`,
      {
        customField: {
          supabase_user_id: supabase_user_id
        }
      },
      {
        headers: {
          Authorization: `Bearer ${GHL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('GHL contact mis à jour:', response.data);
  } catch (error) {
    console.error('Erreur mise à jour contact GHL:', error.response?.data || error.message);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const data = req.body;

    console.log("🎉 Webhook de GoHighLevel reçu !");
    console.log("Données reçues :", data);

    const email = data.email;
    if (!email) {
      return res.status(400).send("Email manquant");
    }

    // Vérifie si l'utilisateur existe déjà dans Supabase Auth
    const { data: users, error: listError } = await supabase.auth.admin.listUsers({
      email: email,
      limit: 1
    });

    if (listError) {
      console.error("Erreur récupération utilisateurs:", listError.message);
      return res.status(500).send("Erreur lors de la récupération utilisateur");
    }

    let user;
    if (users.length === 0) {
      // Crée un utilisateur Supabase
      const { user: createdUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        email_confirm: true,
        password: Math.random().toString(36).slice(-8),
        user_metadata: {
          full_name: data.full_name || '',
          first_name: data.first_name || '',
          last_name: data.last_name || ''
        }
      });

      if (createError) {
        console.error("Erreur création utilisateur :", createError.message);
        return res.status(500).send("Erreur lors de la création utilisateur");
      }
      user = createdUser;
      console.log(`Nouvel utilisateur créé : ${user.email} (id: ${user.id})`);
    } else {
      // Met à jour l'utilisateur existant
      user = users[0];
      console.log(`Utilisateur existant trouvé : ${user.email} (id: ${user.id})`);

      if (user && user.id) {
        await supabase.auth.admin.updateUserById(user.id, {
          user_metadata: {
            full_name: data.full_name || '',
            first_name: data.first_name || '',
            last_name: data.last_name || ''
          }
        });
      }
    }

    // Met à jour la fiche contact GHL avec l'id de l'utilisateur Supabase
    if (data.contact_id && user && user.id) {
      await updateGHLContact(data.contact_id, user.id);
    } else {
      console.warn("Pas de contact_id ou d'utilisateur valide pour mise à jour GHL.");
    }

    return res.status(200).send("Webhook traité avec succès.");

  } catch (err) {
    console.error("Erreur dans webhook : ", err);
    return res.status(500).send("Erreur serveur");
  }
};
