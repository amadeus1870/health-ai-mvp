const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const fetch = require("node-fetch");

// Proxy function to call Gemini API
exports.callGemini = functions.runWith({ timeoutSeconds: 540, memory: "1GB" }).https.onRequest((req, res) => {
    cors(req, res, async () => {
        // 1. Validate Request Method
        if (req.method !== "POST") {
            return res.status(405).send("Method Not Allowed");
        }

        // 2. Get API Key from Environment Variables
        // IMPORTANT: You must set this using: firebase functions:config:set gemini.key="YOUR_KEY"
        const apiKey = functions.config().gemini.key;

        if (!apiKey) {
            console.error("API Key not configured.");
            return res.status(500).send("Server Configuration Error");
        }

        try {
            // 3. Forward request to Gemini
            // We assume the body contains the standard Gemini request structure
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

            const response = await fetch(geminiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(req.body),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Gemini API Error:", response.status, errorText);
                return res.status(response.status).send(errorText);
            }

            const data = await response.json();
            return res.status(200).json(data);

        } catch (error) {
            console.error("Proxy Error:", error);
            return res.status(500).send("Internal Server Error");
        }
    });
});
