const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.https://supabase.com/dashboard/project/scnheuukfniglzcachga;
const supabaseServiceRoleKey = process.env.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbmhldXVrZm5pZ2x6Y2FjaGdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODIzNDY3NiwiZXhwIjoyMDczODEwNjc2fQ.k6lihY2egFhSfHonu6pYkaTS9hltlOc_C23mAOmrRnc;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

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

    // Vérifie si l'utilisateur existe dans Supabase Auth via l'API admin
    const { data: users, error: listError } = await supabase.auth.admin.listUsers({
      email: email,
      limit: 1,
    });

    if (listError) {
      console.error("Erreur liste utilisateurs :", listError.message);
      return res.status(500).send('Erreur lors de la récupération utilisateur');
    }

    if (users.length === 0) {
      // Crée un utilisateur Supabase si inexistant
      const { user, error: createError } = await supabase.auth.admin.createUser({
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
        return res.status(500).send('Erreur lors de la création utilisateur');
      }
      console.log(`Nouvel utilisateur créé : ${user.email} (id: ${user.id})`);
    } else {
      // Met à jour potentiellement l'utilisateur existant
      const user = users[0];
      console.log(`Utilisateur existant trouvé : ${user.email} (id: ${user.id})`);
      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          full_name: data.full_name || '',
          first_name: data.first_name || '',
          last_name: data.last_name || ''
        }
      });
    }

    return res.status(200).send('Webhook traité avec succès.');
  } catch (err) {
    console.error('Erreur dans webhook : ', err);
    return res.status(500).send('Erreur serveur');
  }
};
