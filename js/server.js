const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

// Remplacez par vos informations d'application Airtable
const clientId = 'YOUR_CLIENT_ID';
const clientSecret = 'YOUR_CLIENT_SECRET';
const redirectUri = 'YOUR_REDIRECT_URI';

app.use(bodyParser.json());

app.post('/exchange-token', async (req, res) => {
    const { code } = req.body;

    try {
        const response = await fetch('https://api.airtable.com/v0/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                code: code,
                grant_type: 'authorization_code'
            })
        });

        const data = await response.json();
        if (data.access_token) {
            res.json({ access_token: data.access_token });
        } else {
            res.status(400).json({ error: 'Failed to exchange token' });
        }
    } catch (error) {
        console.error('Erreur lors de l\'échange du jeton :', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
});