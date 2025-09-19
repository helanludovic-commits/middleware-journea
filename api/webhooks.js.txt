// On importe la librairie Express pour créer notre 'serveur'
const express = require('express');
const app = express();

// Cette ligne est cruciale, elle permet à notre code de lire le format JSON envoyé par GHL
app.use(express.json());

// On définit la route qui va recevoir la requête du webhook
// Le chemin '/api/webhook' correspond au nom du fichier
app.post('/api/webhook', (req, res) => {

  console.log("🎉 Webhook de GoHighLevel reçu !");

  // Les données envoyées par GHL se trouvent dans "req.body"
  const webhookData = req.body;

  // On affiche les données dans les logs pour vérifier que ça fonctionne
  console.log("Données reçues :", webhookData);

  // On répond à GHL avec un statut "200 OK" pour dire qu'on a bien reçu les données
  res.status(200).send('Webhook reçu avec succès.');
});

// On exporte l'application pour que Vercel puisse l'utiliser
module.exports = app;