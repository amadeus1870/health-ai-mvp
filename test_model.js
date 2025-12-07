
const GEMINI_API_KEY = 'AIzaSyAr-65FWjzAftrWg_pcUiGwHCS_SG98m3c';
const MODEL_NAME = 'gemini-2.5-flash';
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;

async function testModel() {
    console.log(`Testing model: ${MODEL_NAME}`);
    try {
        const response = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Hello" }] }]
            })
        });

        console.log(`Status: ${response.status}`);
        const text = await response.text();
        console.log(`Response: ${text}`);
    } catch (e) {
        console.error("Error:", e);
    }
}

testModel();
