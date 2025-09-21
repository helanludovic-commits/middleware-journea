module.exports = function handler(req, res) {
  if (req.method === 'POST') {
    console.log("🎉 Webhook de GoHighLevel reçu !");
    const webhookData = req.body;
    console.log("Données reçues :", webhookData);
    res.status(200).send('Webhook reçu avec succès.');
  } else {
    res.status(405).send('Method Not Allowed');
  }
};
