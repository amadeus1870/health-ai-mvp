import { Colors } from '../constants/Colors';
import { ProfileService } from './ProfileService';
import { UserProfile } from '../types/Profile';
import { GEMINI_API_KEY, BACKEND_URL } from '../config/env';

// Using gemini-2.5-flash as explicitly requested by user
// BACKEND_URL is currently ignored to avoid shared IP rate limits on Firebase Functions.
// We use the local API key with client-side calls for better stability (unique IP per user).
const USE_BACKEND = false;
const GEMINI_URL = USE_BACKEND
  ? BACKEND_URL
  : `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const GEMINI_FLASH_URL = GEMINI_URL;

const fetchWithRetry = async (url: string, options: RequestInit, retries = 3, backoff = 2000): Promise<Response> => {
  try {
    const response = await fetch(url, options);

    if (response.status === 429) {
      if (retries > 0) {
        // 429: Too Many Requests. Wait significantly longer.
        // If header "Retry-After" exists, use it (though Gemini might not send it standardly).
        // Default wait: 60 seconds + backoff.
        const waitTime = 60000 + backoff;
        console.warn(`Gemini API Rate Limit (429). Waiting ${waitTime / 1000}s before retry... (Retries left: ${retries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return fetchWithRetry(url, options, retries - 1, backoff * 2);
      } else {
        // No retries left for 429
        console.error("Gemini API Rate Limit (429) - Max retries exceeded.");
        throw new Error("Quota exceeded. Please try again in a few minutes.");
      }
    }

    if (response.status >= 500 && retries > 0) {
      console.warn(`Gemini API Error (${response.status}). Retrying in ${backoff}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }

    return response;
  } catch (error) {
    if ((error as any).name === 'AbortError') {
      throw error;
    }
    if (retries > 0) {
      console.warn(`Fetch error. Retrying in ${backoff}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw error;
  }
};

const cleanJsonString = (jsonStr: string): string => {
  // 1. Remove Markdown code blocks
  let clean = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();

  // 2. Escape control characters inside strings
  // Regex matches a JSON string: " (escaped char OR any char except " or \) * "
  // We use a function to replace control chars ONLY inside the matched string
  return clean.replace(/"(?:\\.|[^"\\])*"/g, (match) => {
    return match.replace(/[\u0000-\u001F]/g, (char) => {
      switch (char) {
        case '\b': return '\\b';
        case '\f': return '\\f';
        case '\n': return '\\n';
        case '\r': return '\\r';
        case '\t': return '\\t';
        default: return ''; // Remove other control chars
      }
    });
  });
};

export const analyzeBiomarkers = async (files: { base64: string, mimeType: string }[], language: string = 'it') => {
  // 1. Fetch User Profile
  let profileContext = "USER PROFILE: Not available.";
  try {
    const profile = await ProfileService.getProfile();
    if (profile && profile.name) {
      profileContext = `
      USER PROFILE (ANAMNESIS):
      - Name: ${profile.name}
      - Age: ${profile.age}
      - Gender: ${profile.gender}
      - Height: ${profile.height} cm
      - Weight: ${profile.weight} kg
      - Waist Circumference: ${profile.waistCircumference} cm
      - Conditions: ${profile.conditions.join(', ') || 'None'} ${profile.otherCondition ? `(${profile.otherCondition})` : ''}
      - Symptoms: ${profile.symptoms.join(', ') || 'None'}
      - Medications: ${profile.medications ? profile.medicationsList : 'None'}
      - Habits: ${profile.habits.join(', ') || 'None'}
      - Smoking: ${profile.smoke}
      - Alcohol: ${profile.alcohol}
      - Daily Diet: ${profile.dailyDiet}
      - Sleep: ${profile.sleep}
      - Stress: ${profile.stress}
      - Supplements: ${profile.supplements.join(', ') || 'None'} ${profile.otherSupplement ? `(${profile.otherSupplement})` : ''}
      `;
    }
  } catch (error) {
    console.warn("Failed to load profile for analysis:", error);
  }

  const prompt = `
    ROLE: Data Extraction Specialist & Medical Analyst.
    OBJECTIVE: Extract EVERY SINGLE NUMERIC VALUE and textual finding from the medical reports.
    
    ${profileContext}

    CRITICAL COMPLIANCE:
    - FORBIDDEN: Diagnosis, Cure, Prescription.
    - REQUIRED: COMPLETE RAW EXTRACTION. Do not summarize. Do not skip "normal" values.
    - SAFETY: You are an AI consultant.
    - PERSONALIZATION: Tailor recommendations to the profile.
    - LANGUAGE: MUST BE ${language.toUpperCase()}. Translate everything.
    - FORMATTING: Use Markdown for all text fields (bold **text**, lists -, etc.) to improve readability.
    
    CRITICAL MEDICAL CONTEXT (MODERN RESEARCH):
    - CHOLESTEROL: High Total Cholesterol is NOT a standalone risk factor if metabolic health is good.
    - KEY INDICATOR: Triglycerides/HDL Ratio.
      - If TG/HDL < 3: High cholesterol is likely NOT dangerous (large buoyant LDL).
      - If TG/HDL > 3: Indicates insulin resistance and small dense LDL (dangerous).
    - APPLY THIS LOGIC in: General Evaluation, Risk Factors, and Recommendations. Do NOT be alarmist about high cholesterol if TG/HDL is low.
    
    ACTION:
    1.  **TRANSCRIPTION PHASE**: Go through the documents line by line.
    2.  **EXTRACTION**: Extract ALL biomarkers, including but not limited to:
        -   **Hematology**: Hemoglobin, Hematocrit, RBC, WBC, Platelets, MCV, MCH, MCHC, RDW.
        -   **Leukocyte Formula**: Neutrophils, Lymphocytes, Monocytes, Eosinophils, Basophils (both % and absolute values).
        -   **Electrolytes**: Sodium, Potassium, Chloride, Calcium, Magnesium, Phosphorus.
        -   **Liver**: ALT, AST, GGT, Bilirubin (all forms), Alkaline Phosphatase, Albumin, Total Protein.
        -   **Kidney**: Creatinine, Urea, Uric Acid, eGFR.
        -   **Lipids**: Cholesterol (Total, HDL, LDL), Triglycerides.
        -   **Thyroid**: TSH, FT3, FT4, TPO, TgAb.
        -   **Urine**: pH, Specific Gravity, Color, Aspect, Leukocytes, Nitrites, Glucose, Proteins, Ketones, Urobilinogen, Bilirubin, Erythrocytes.
        -   **Other**: Iron, Ferritin, Transferrin, Vitamin D, B12, Folate, CPK, LDH, Amylase, Lipase.
    3.  **NO FILTERING**: Even if a value is perfectly normal, IT MUST BE INCLUDED in the "biomarkers" list.
    
    OUTPUT FORMAT:
    Return ONLY a JSON object with this exact structure:
    {
      "valutazioneGenerale": {
        "panoramica": "Panoramica Completa dello Stato di Salute, integrando i risultati dei test con l'anamnesi dell'utente.",
        "risultati": "Principali Risultati e Implicazioni (inclusi marker tumorali o altro).",
        "tendenze": "Analisi delle Tendenze e dei Pattern di Salute.",
        "correlazioni": "Correlazioni tra Diversi Biomarcatori e i dati del Profilo (es. Sintomi correlati ai valori)."
      },
      "fattoriDiRischio": [
        { 
          "identificazione": "Identificazione dei Potenziali Rischi (basati su Test + Profilo)", 
          "gravita": "low/medium/high", 
          "probabilita": "Percentuale", 
          "spiegazione": "Analisi della Gravità e delle Probabilità di Rischio, spiegando PERCHÉ è un rischio per QUESTO utente specifico." 
        }
      ],
      "raccomandazioni": {
        "mediche": "Considerazioni basate sui risultati (evidenze scientifiche, no diagnosi).",
        "stileDiVita": "Suggerimenti per lo Stile di Vita e la Dieta, altamente personalizzati sul Profilo (es. se fuma, se dorme male).",
        "followUp": "Test e Procedure di Follow-up Consigliati.",
        "specialisti": "Rinvio a Specialisti se Necessario."
      },
      "cholesterolAnalysis": {
        "quantitative": { 
          "description": "Breve descrizione (max 50 parole) che spiega il significato di Totale, LDL, HDL, Trigliceridi e riassume la situazione dell'utente.",
          "total": "Value", 
          "hdl": "Value", 
          "ldl": "Value", 
          "triglycerides": "Value" 
        },
        "qualitative": {
          "description": "Qualitative description (approx 50 words) focusing on atherogenicity and insulin resistance.",
          "metrics": [
            { "name": "Non-HDL Cholesterol", "value": "Calc: Total - HDL", "status": "optimal/warning/critical", "interpretation": "Target < 130. Predisposition to plaque." },
            { "name": "TG/HDL Ratio", "value": "Calc: TG / HDL", "status": "optimal/warning/critical", "interpretation": "< 2.0 Ideal. > 3.0 Insulin Resistance." },
            { "name": "Remnant Cholesterol", "value": "Calc: Total - HDL - LDL", "status": "optimal/warning/critical", "interpretation": "Target < 30. CV Risk." },
            { "name": "Lipid Accumulation Product (LAP)", "value": "Calculate if waist/gender available, else 'N/A'", "status": "optimal/warning/critical", "interpretation": "Target < 30. Metabolic dysfunction risk." }
          ]
        }
      },
      "supplements": {
        "analysis": "Analysis of current supplements (from Profile) vs needs (from Test Results).",
        "current": [
          { "name": "Supplement Name (from Profile)", "action": "Conferma/Sospendi", "reason": "Explanation based on biomarkers and profile." }
        ],
        "recommended": [
          { "name": "Supplement Name", "reason": "Specific reason based on user data AND profile (e.g. 'Since you are Vegan...').", "dosage": "Morning/Lunch/Dinner dosage" }
        ]
      },
      "biomarkers": [
        { 
          "name": "Biomarker/Finding Name", 
          "value": "Value or Finding Result", 
          "unit": "Unit (or empty if N/A)", 
          "status": "optimal/warning/critical", // DO NOT TRANSLATE 
          "target": "Target Value (e.g. '< 100', 'Negative'). Leave empty ONLY if no target exists.",
          "meaning": "Brief explanation of what this marker indicates.",
          "cause": "Possible causes (only if status is warning/critical, else empty string).",
          "remedy": "Possible remedies (only if status is warning/critical, else empty string)."
        }
      ],
      "conclusione": "Sintesi dei Risultati, Raccomandazioni Finali e Prossimi Passi, con un tono incoraggiante e personalizzato."
    }
    
    IMPORTANT:
    - If LDL is missing, calculate Friedewald LDL = (Total - HDL - (Triglycerides / 5)).
    - For "status", use strictly "optimal", "warning", or "critical". DO NOT TRANSLATE THESE VALUES.
    - For "gravita", use strictly "low", "medium", or "high". DO NOT TRANSLATE THESE VALUES.
    - For supplements "action", use strictly "Conferma" or "Sospendi".
    - LANGUAGE: ${language.toUpperCase()}. All text values must be in ${language.toUpperCase()} EXCEPT for "status", "gravita" and "action" fields mentioned above.
  `;

  const imageParts = files.map(file => ({
    inline_data: { mime_type: file.mimeType, data: file.base64 }
  }));

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minutes timeout

    console.log("Sending request to Gemini...", GEMINI_URL);
    const response = await fetchWithRetry(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            ...imageParts
          ]
        }]
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error Body:", errorText);
      throw new Error(`Gemini API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates[0].content) {
      console.error("Unexpected Gemini Response:", JSON.stringify(data));
      throw new Error('No analysis result in response');
    }

    const textResponse = data.candidates[0].content.parts[0].text;
    const jsonString = cleanJsonString(textResponse);

    return JSON.parse(jsonString);

  } catch (error) {
    console.warn("Gemini Analysis Error:", error);
    throw error;
  }
};

export const categorizeIngredients = async (ingredients: string[], language: string = 'it'): Promise<{ category: string, items: string[] }[]> => {
  if (ingredients.length === 0) return [];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    const prompt = language === 'it'
      ? `Raggruppa i seguenti ingredienti per categoria merceologica (es. "Frutta e Verdura", "Carne e Pesce", "Latticini", "Cereali", "Dispensa", "Altro").`
      : `Group the following ingredients by category (e.g. "Fruit & Veg", "Meat & Fish", "Dairy", "Grains", "Pantry", "Other"). Language: ${language.toUpperCase()}.`;

    const response = await fetchWithRetry(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${prompt}
            
            Ingredients: ${JSON.stringify(ingredients)}

            Response ONLY with valid JSON:
            [
              { "category": "Category Name", "items": ["100g item 1", "2 item 2"] }
            ]`
          }]
        }]
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    const jsonStr = cleanJsonString(text);
    return JSON.parse(jsonStr);
  } catch (error) {
    console.warn("Categorization failed (using fallback):", error);
    // Fallback: return single category
    const fallbackMap: { [key: string]: string } = {
      it: "Tutti gli ingredienti",
      en: "All Ingredients",
      es: "Todos los ingredientes",
      fr: "Tous les ingrédients",
      de: "Alle Zutaten"
    };
    const fallbackCategory = fallbackMap[language] || "All Ingredients";
    return [{ category: fallbackCategory, items: ingredients.sort() }];
  }
};

export const reAnalyzeBiomarkers = async (existingResults: any, language: string = 'it') => {
  // 1. Fetch User Profile
  let profileContext = "USER PROFILE: Not available.";
  try {
    const profile = await ProfileService.getProfile();
    if (profile && profile.name) {
      profileContext = `
      USER PROFILE (ANAMNESIS):
      - Name: ${profile.name}
      - Age: ${profile.age}
      - Gender: ${profile.gender}
      - Height: ${profile.height} cm
      - Weight: ${profile.weight} kg
      - Waist Circumference: ${profile.waistCircumference} cm
      - Conditions: ${profile.conditions.join(', ') || 'None'} ${profile.otherCondition ? `(${profile.otherCondition})` : ''}
      - Physical Description: ${profile.physicalDescription}
      - Symptoms: ${profile.symptoms.join(', ') || 'None'}
      - Medications: ${profile.medications ? profile.medicationsList : 'None'}
      - Habits: ${profile.habits.join(', ') || 'None'}
      - Smoking: ${profile.smoke}
      - Alcohol: ${profile.alcohol}
      - Daily Diet: ${profile.dailyDiet}
      - Sleep: ${profile.sleep}
      - Stress: ${profile.stress}
      - Supplements: ${profile.supplements.join(', ') || 'None'} ${profile.otherSupplement ? `(${profile.otherSupplement})` : ''}
      `;
    }
  } catch (error) {
    console.warn("Failed to load profile for re-analysis:", error);
  }

  // 2. Prepare Existing Data Context
  try {
    const existingBiomarkers = existingResults.biomarkers || [];
    const existingCholesterol = existingResults.cholesterolAnalysis?.quantitative || {};

    const dataContext = `
    EXISTING BIOMARKERS DATA:
    ${JSON.stringify(existingBiomarkers, null, 2)}

    EXISTING CHOLESTEROL DATA (Quantitative):
    ${JSON.stringify(existingCholesterol, null, 2)}
  `;

    const prompt = `
    ROLE: Medical Analyst & Health Consultant.
    OBJECTIVE: Re-evaluate the health status based on EXISTING BIOMARKER DATA and a NEW USER PROFILE.
    
    ${profileContext}

    ${dataContext}

    CRITICAL COMPLIANCE:
    - DO NOT CHANGE THE RAW VALUES of biomarkers. Use the provided "EXISTING BIOMARKERS DATA".
    - RE-EVALUATE "status", "meaning", "cause", "remedy" for each biomarker based on the NEW PROFILE.
    - RE-CALCULATE Risks, Recommendations, and Supplement advice based on the NEW PROFILE.
    - CONCISE OUTPUT: Keep explanations brief and to the point.
    - CONCISE OUTPUT: Keep explanations brief and to the point.
    - LANGUAGE: MUST BE ${language.toUpperCase()}.
    - CRITICAL: "status" fields MUST remain "optimal", "warning", or "critical". DO NOT TRANSLATE.
    - FORMATTING: Use Markdown for all text fields (bold **text**, lists -, etc.) to improve readability.

    CRITICAL MEDICAL CONTEXT (MODERN RESEARCH):
    - CHOLESTEROL: High Total Cholesterol is NOT a standalone risk factor if metabolic health is good.
    - KEY INDICATOR: Triglycerides/HDL Ratio.
      - If TG/HDL < 3: High cholesterol is likely NOT dangerous (large buoyant LDL).
      - If TG/HDL > 3: Indicates insulin resistance and small dense LDL (dangerous).
    - APPLY THIS LOGIC in: General Evaluation, Risk Factors, and Recommendations. Do NOT be alarmist about high cholesterol if TG/HDL is low.
    
    OUTPUT FORMAT:
    Return ONLY a JSON object with this exact structure (same as original analysis):
    {
      "valutazioneGenerale": {
        "panoramica": "Panoramica Aggiornata...",
        "risultati": "Risultati...",
        "tendenze": "Tendenze...",
        "correlazioni": "Nuove correlazioni col profilo aggiornato..."
      },
      "fattoriDiRischio": [
        { 
          "identificazione": "Rischio...", 
          "gravita": "Basso/Medio/Alto", 
          "probabilita": "Percentuale", 
          "spiegazione": "Spiegazione aggiornata..." 
        }
      ],
      "raccomandazioni": {
        "mediche": "Considerazioni basate sui risultati (evidenze scientifiche, no diagnosi).",
        "stileDiVita": "Suggerimenti Stile di Vita aggiornati...",
        "followUp": "Follow-up...",
        "specialisti": "Specialisti..."
      },
      "cholesterolAnalysis": {
        "quantitative": ${JSON.stringify(existingCholesterol)}, 
        "qualitative": {
          "description": "Descrizione aggiornata...",
          "metrics": [
            { "name": "Non-HDL Cholesterol", "value": "Calc...", "status": "...", "interpretation": "..." },
            { "name": "TG/HDL Ratio", "value": "Calc...", "status": "...", "interpretation": "..." },
            { "name": "Remnant Cholesterol", "value": "Calc...", "status": "...", "interpretation": "..." },
            { "name": "Lipid Accumulation Product (LAP)", "value": "Calculate...", "status": "...", "interpretation": "..." }
          ]
        }
      },
      "supplements": {
        "analysis": "Analysis of current supplements vs needs.",
        "current": [
          { "name": "Supplement Name", "action": "Conferma/Sospendi", "reason": "Explanation." }
        ],
        "recommended": [
          { "name": "Supplement Name", "reason": "Specific reason.", "dosage": "Dosage" }
        ]
      },
      "biomarkers": [
        { 
          "name": "Biomarker Name", 
          "value": "Value", 
          "unit": "Unit", 
          "status": "optimal/warning/critical", // DO NOT TRANSLATE 
          "target": "Target",
          "meaning": "Explanation",
          "cause": "Possible causes",
          "remedy": "Possible remedies"
        }
      ],
      "conclusione": "Sintesi dei Risultati e Raccomandazioni Finali."
    }
  `;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout

    const response = await fetchWithRetry(GEMINI_FLASH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.candidates || !data.candidates[0].content) {
      throw new Error('No result in response');
    }

    const textResponse = data.candidates[0].content.parts[0].text;

    // Robust JSON extraction: find first '{' and last '}'
    const firstOpenBrace = textResponse.indexOf('{');
    const lastCloseBrace = textResponse.lastIndexOf('}');

    if (firstOpenBrace === -1 || lastCloseBrace === -1) {
      throw new Error("Invalid JSON response from AI: No JSON object found.");
    }

    const jsonString = cleanJsonString(textResponse.substring(firstOpenBrace, lastCloseBrace + 1));

    return JSON.parse(jsonString);

  } catch (error: any) {
    if (error.message?.includes('503') || error.message?.includes('Overloaded')) {
      console.warn("Gemini Service Overloaded (503):", error.message);
    } else {
      console.warn("Gemini Re-Analysis Error:", error); // Changed to warn to avoid Red Box
    }
    throw error;
  }
};

export const generateDietPlan = async (userProfile: any, analysisResults: any, language: string = 'it') => {
  const profileContext = `
    USER PROFILE:
  - Name: ${userProfile.name}
  - Age: ${userProfile.age}
  - Gender: ${userProfile.gender}
  - Height: ${userProfile.height} cm
    - Weight: ${userProfile.weight} kg
      - Activity Level: ${userProfile.activityLevel}
  - Diet Type: ${userProfile.dietType}
  - Restrictions: ${userProfile.dietaryRestrictions.join(', ') || 'None'} ${userProfile.otherDietaryRestriction ? `(${userProfile.otherDietaryRestriction})` : ''}
  - Goal: ${userProfile.goal || 'General Health'}
  - Meals per Day: ${userProfile.mealsPerDay}
  - Snacks per Day: ${userProfile.snacksPerDay}
  `;

  const analysisContext = analysisResults ? `
    BLOOD ANALYSIS INSIGHTS:
  - Deficiencies / Issues: ${JSON.stringify(analysisResults.biomarkers?.filter((b: any) => b.status !== 'optimal').map((b: any) => b.name) || [])}
  - Recommendations: ${JSON.stringify(analysisResults.raccomandazioni?.stileDiVita || '')}
  ` : "No blood analysis available.";

  const mealsCount = parseInt(userProfile.mealsPerDay) || 3;
  const snacksCount = parseInt(userProfile.snacksPerDay) || 0;

  let mealStructure = "Colazione, Pranzo, Cena";

  if (mealsCount >= 5) {
    mealStructure = "Colazione, Spuntino, Pranzo, Merenda, Cena";
  } else if (mealsCount === 4) {
    mealStructure = "Colazione, Pranzo, Merenda, Cena";
  } else if (mealsCount === 3) {
    mealStructure = "Colazione, Pranzo, Cena";
  } else if (mealsCount === 2) {
    mealStructure = "Pranzo, Cena"; // Common for 2 meals (Skipping breakfast)
  } else if (mealsCount === 1) {
    mealStructure = "Cena"; // OMAD
  }

  // Adjust for snacks if explicitly requested and not already covered
  if (snacksCount > 0 && mealsCount < 5) {
    if (mealsCount === 3 && snacksCount >= 2) mealStructure = "Colazione, Spuntino, Pranzo, Merenda, Cena";
    else if (mealsCount === 3 && snacksCount === 1) mealStructure = "Colazione, Pranzo, Merenda, Cena";
    else if (mealsCount === 2 && snacksCount >= 1) mealStructure = "Spuntino, Pranzo, Cena"; // Example
  }

  const prompt = `
  ROLE: Expert Nutritionist & Chef.
    OBJECTIVE: Create a detailed 14 - DAY MEAL PLAN(Bi - Weekly) for this user.

      ${profileContext}
    
    ${analysisContext}

    CRITICAL REQUIREMENTS:
  1. ** STRICT ADHERENCE TO DIET TYPE **: User is "${userProfile.dietType}".Do NOT include any forbidden foods.
    2. ** STRICT ADHERENCE TO RESTRICTIONS **: User has "${userProfile.dietaryRestrictions.join(', ') || 'None'}".RESPECT THIS ABSOLUTELY.
    3. ** MEAL STRUCTURE **: You MUST generate exactly these meals per day: ${mealStructure}.
  4. ** HEALTH FOCUSED **: Incorporate foods that help with identified deficiencies.
    5. ** CONCISE OUTPUT **: Keep descriptions VERY brief(max 15 words).
    6. ** INGREDIENT NAMING RULES **:
  - Use SINGLE nouns(e.g., "Carota" NOT "Carote").
        - NO adjectives(e.g., "Mela" NOT "Mela rossa croccante", "Merluzzo" NOT "Filetto di Merluzzo fresco").
        - NO composites(e.g., "Broccoli" AND "Carote" separately, NOT "Mix broccoli e carote").
        - Use STANDARD names(e.g., "Olio EVO", "Pollo", "Riso", "Pasta").
    7. ** LANGUAGE **: ${language.toUpperCase()}.
  8. ** FORMATTING **: You can use basic Markdown(bold ** text **) in descriptions for emphasis if needed.

    OUTPUT FORMAT:
    Return ONLY a JSON object with this structure:
  {
    "week1": [
      {
        "day": 1,
        "meals": [
          {
            "type": "Meal Type",
            "name": "Dish Name",
            "description": "Brief prep (max 15 words)",
            "ingredients": ["100g Main Item 1", "200g Main Item 2"],
            "calories": 300,
            "macros": { "protein": 10, "carbs": 40, "fats": 10 }
          },
          ... (Repeat for all meals in structure: ${mealStructure})
    ]
  },
        ... (Days 2 - 7)
      ],
"week2": [
  ... (Days 8 - 14)
]
    }
`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600000); // 600 second timeout (10 mins)

    console.log("Sending DIET PLAN request to Gemini...", GEMINI_URL);
    const response = await fetchWithRetry(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API Error: ${response.status} - ${errorText} `);
    }

    const data = await response.json();
    if (!data.candidates || !data.candidates[0].content) {
      throw new Error('No diet plan result in response');
    }

    const textResponse = data.candidates[0].content.parts[0].text;
    const firstOpenBrace = textResponse.indexOf('{');
    const lastCloseBrace = textResponse.lastIndexOf('}');

    if (firstOpenBrace === -1 || lastCloseBrace === -1) {
      throw new Error("Invalid JSON response from AI");
    }

    const jsonString = textResponse.substring(firstOpenBrace, lastCloseBrace + 1);
    return JSON.parse(jsonString);

  } catch (error) {
    console.warn("Gemini Diet Plan Error:", error); // Changed to warn
    throw error;
  }
};

export const generateDayDiet = async (
  dayNumber: number,
  userProfile: any,
  targetCalories: number,
  targetMacros: any,
  previousDays: any[] = [],
  analysisResults: any = null,
  language: string = 'it'
) => {
  const profileContext = `
    USER PROFILE:
- Name: Utente
- Age: ${userProfile.age}
- Gender: ${userProfile.gender}
- Height: ${userProfile.height} cm
  - Weight: ${userProfile.weight} kg
    - Activity Level: ${userProfile.activityLevel}
- Diet Type: ${userProfile.dietType}
- Restrictions: ${userProfile.dietaryRestrictions.join(', ') || 'None'} ${userProfile.otherDietaryRestriction ? `(${userProfile.otherDietaryRestriction})` : ''}
- Goal: ${userProfile.goal || 'General Health'}
- Meals per Day: ${userProfile.mealsPerDay}
- Snacks per Day: ${userProfile.snacksPerDay}
- TARGET CALORIES: ${targetCalories} kcal(STRICT LIMIT)
  - TARGET MACROS: Protein ${targetMacros.protein}%, Carbs ${targetMacros.carbs}%, Fats ${targetMacros.fats}%
    `;

  const analysisContext = analysisResults ? `
    BLOOD ANALYSIS INSIGHTS:
- Deficiencies / Issues: ${JSON.stringify(analysisResults.biomarkers?.filter((b: any) => b.status !== 'optimal').map((b: any) => b.name) || [])}
- Recommendations: ${JSON.stringify(analysisResults.raccomandazioni?.stileDiVita || '')}
` : "No blood analysis available.";

  const previousDaysContext = previousDays.length > 0 ? `
    PREVIOUS DAYS MEALS(Do not repeat exact same main dishes if possible):
    ${JSON.stringify(previousDays.map(d => d.meals.map((m: any) => m.name)), null, 2)}
` : "No previous days generated yet.";

  const mealsCount = parseInt(userProfile.mealsPerDay) || 3;
  const snacksCount = parseInt(userProfile.snacksPerDay) || 0;

  let mealStructure = "Colazione, Pranzo, Cena";

  if (mealsCount >= 5) {
    mealStructure = "Colazione, Spuntino, Pranzo, Merenda, Cena";
  } else if (mealsCount === 4) {
    mealStructure = "Colazione, Pranzo, Merenda, Cena";
  } else if (mealsCount === 3) {
    mealStructure = "Colazione, Pranzo, Cena";
  } else if (mealsCount === 2) {
    mealStructure = "Pranzo, Cena";
  } else if (mealsCount === 1) {
    mealStructure = "Cena";
  }

  if (snacksCount > 0 && mealsCount < 5) {
    if (mealsCount === 3 && snacksCount >= 2) mealStructure = "Colazione, Spuntino, Pranzo, Merenda, Cena";
    else if (mealsCount === 3 && snacksCount === 1) mealStructure = "Colazione, Pranzo, Merenda, Cena";
    else if (mealsCount === 2 && snacksCount >= 1) mealStructure = "Spuntino, Pranzo, Cena";
  }

  const prompt = `
ROLE: Expert Nutritionist & Chef.
  OBJECTIVE: Create a meal plan for DAY ${dayNumber} of a 7 - day plan.

    ${profileContext}
    
    ${analysisContext}

    ${previousDaysContext}

    RANDOM SEED: ${Date.now()} (Use this to vary the output from previous runs)

IMPORTANT: You must calculate the sum of calories for the generated meals.
  TARGET: ${targetCalories} kcal.
    ALLOWED RANGE: ${targetCalories - 50} - ${targetCalories + 50} kcal.

    CRITICAL REQUIREMENTS:
1. ** CALORIE SUM CHECK **: The sum of calories of all meals MUST be between ${targetCalories - 50} and ${targetCalories + 50}. THIS IS THE MOST IMPORTANT RULE.FAIL IF NOT MET.
    2. ** STRICT ADHERENCE TO DIET TYPE **: User is "${userProfile.dietType}".
    3. ** STRICT ADHERENCE TO RESTRICTIONS **: User has "${userProfile.dietaryRestrictions.join(', ') || 'None'}".
    4. ** MEAL STRUCTURE **: Generate exactly: ${mealStructure}.
5. ** VARIETY **: Try to vary from previous days.
    6. ** CONCISE **: Max 15 words per description.Max 5 ingredients WITH QUANTITIES.
    7. ** INGREDIENT NAMING RULES **:
- CRITICAL: Use GENERIC, SINGULAR names.
        - BAD: "Filetto di Salmone", "Uova medie", "Spinaci freschi", "Mix verdure".
        - GOOD: "Salmone", "Uovo", "Spinaci", "Verdure".
        - ALWAYS separate mixed ingredients(e.g., "100g Carote", "100g Broccoli" INSTEAD OF "200g Mix carote e broccoli").
    8. ** LANGUAGE **: ${language.toUpperCase()}.

    OUTPUT FORMAT:
    Return ONLY a JSON object for this single day:
  {
    "day": ${dayNumber},
    "meals": [
      {
        "type": "Meal Type",
        "name": "Dish Name",
        "description": "Brief prep",
        "ingredients": ["100g Item 1", "1 Item 2"],
        "calories": 300, // Ensure this contributes correctly to the total
        "macros": { "protein": 10, "carbs": 40, "fats": 10 }
      },
      ... (Repeat for: ${mealStructure})
      ]
  }
`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minutes timeout to allow for rate limit waits

    // console.log(`Sending DAY ${ dayNumber } request to Gemini...`);
    const response = await fetchWithRetry(GEMINI_FLASH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API Error: ${response.status} - ${errorText} `);
    }

    const data = await response.json();
    if (!data.candidates || !data.candidates[0].content) {
      throw new Error('No result in response');
    }

    const textResponse = data.candidates[0].content.parts[0].text;
    const firstOpenBrace = textResponse.indexOf('{');
    const lastCloseBrace = textResponse.lastIndexOf('}');

    if (firstOpenBrace === -1 || lastCloseBrace === -1) {
      throw new Error("Invalid JSON response");
    }

    const jsonString = textResponse.substring(firstOpenBrace, lastCloseBrace + 1);
    return JSON.parse(jsonString);

  } catch (error) {
    console.warn(`Gemini Day ${dayNumber} Error: `, error);
    throw error;
  }
};
export const generateAlternativeMeals = async (originalMeal: any, userProfile: any, language: string = 'it') => {
  const profileContext = `
    USER PROFILE:
- Name: Utente
- Diet Type: ${userProfile.dietType}
- Restrictions: ${userProfile.dietaryRestrictions.join(', ') || 'None'}
- Goal: ${userProfile.goal || 'General Health'}
`;

  const prompt = `
ROLE: Expert Nutritionist.
  OBJECTIVE: Generate 3 ALTERNATIVE MEAL OPTIONS to replace the following meal:
    
    ORIGINAL MEAL:
- Type: ${originalMeal.type}
- Name: ${originalMeal.name}
- Calories: ${originalMeal.calories}
- Macros: P:${originalMeal.macros.protein} g, C:${originalMeal.macros.carbs} g, F:${originalMeal.macros.fats} g

    ${profileContext}

    CRITICAL REQUIREMENTS:
1. ** SAME MEAL TYPE **: Must be "${originalMeal.type}".
    2. ** SIMILAR MACROS **: Try to keep calories and macros within +/- 10% of the original.
3. ** DIET COMPLIANCE **: Strictly adhere to "${userProfile.dietType}" and restrictions.
    4. ** VARIETY **: Options must be different from the original and from each other.
    5. ** INGREDIENT NAMING RULES **:
- Use generic names: "Pollo", "Merluzzo", "Zucchine"(No "Filetto di...", "fresco", etc.).
    6. ** LANGUAGE **: ${language.toUpperCase()}.

    OUTPUT FORMAT:
    Return ONLY a JSON object with this structure:
{
  "alternatives": [
    {
      "type": "${originalMeal.type}",
      "name": "Option 1 Name",
      "description": "Brief prep",
      "ingredients": ["100g Item 1", "1 Item 2"],
      "calories": 300,
      "macros": { "protein": 10, "carbs": 40, "fats": 10 }
    },
    ... (Option 2 and 3)
  ]
}
`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    const response = await fetchWithRetry(GEMINI_FLASH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      }),
      signal: controller.signal
    }, 3, 2000); // Start with 2s backoff for meal swap
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.status} `);
    }

    const data = await response.json();
    if (!data.candidates || !data.candidates[0].content) {
      throw new Error('No result in response');
    }

    const textResponse = data.candidates[0].content.parts[0].text;
    const firstOpenBrace = textResponse.indexOf('{');
    const lastCloseBrace = textResponse.lastIndexOf('}');

    if (firstOpenBrace === -1 || lastCloseBrace === -1) {
      throw new Error("Invalid JSON response");
    }

    const jsonString = textResponse.substring(firstOpenBrace, lastCloseBrace + 1);
    const result = JSON.parse(jsonString);
    return result.alternatives || [];

  } catch (error) {
    console.warn("Gemini Meal Swap Error:", error);
    throw error;
  }
};
