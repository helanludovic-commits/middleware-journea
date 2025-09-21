const { createClient } = require('@supabase/supabase-js');
const express = require('express');
const app = express();

app.use(express.json());

// La route qui reçoit le webhook de GHL
app.post('/api/webhook', async (req, res) => {
  console.log("🎉 Webhook de GoHighLevel reçu ! Démarrage du traitement...");

  try {
    // 1. Récupérer les données du contact envoyées par GHL
    const ghlContact = req.body;
    const userEmail = ghlContact.email;
    const ghlContactId = ghlContact.contact_id || ghlContact.id; // GHL utilise parfois des noms de champs différents

    if (!userEmail) {
      console.log("Email manquant, traitement ignoré.");
      return res.status(200).send('Webhook reçu, mais email manquant.');
    }

    // 2. Initialiser le client Supabase avec les clés sécurisées
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // 3. Chercher si un utilisateur existe déjà dans Supabase avec cet email
    const { data: { users }, error: findError } = await supabaseAdmin.auth.admin.listUsers({
      email: userEmail
    });

    if (findError) throw findError;

    // 4. Si l'utilisateur n'existe pas, le créer dans Supabase Auth
    if (users && users.length === 0) {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: userEmail,
        email_confirm: true, // On le confirme automatiquement
        app_metadata: {
          gohighlevel_contact_id: ghlContactId,
          gohighlevel_location_id: ghlContact.location?.id,
        },
      });
      if (createError) throw createError;
      console.log("✅ Nouvel utilisateur créé dans Supabase :", newUser.user.email);
    } else {
      console.log("👍 L'utilisateur existe déjà :", users[0].email);
      // Optionnel : vous pourriez mettre à jour ses métadonnées ici si nécessaire
    }

    // 5. Répondre à GHL que tout s'est bien passé
    res.status(200).send('Webhook traité et utilisateur synchronisé.');

  } catch (error) {
    console.error("❌ Erreur dans la logique Supabase :", error.message);
    res.status(500).send('Erreur Interne lors du traitement.');
  }
});

module.exports = app;