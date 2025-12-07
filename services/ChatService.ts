import { ProfileService } from "./ProfileService";
import { AnalysisService } from "./AnalysisService";
import { GEMINI_API_KEY } from "../config/env";

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export const ChatService = {

    async generateResponse(message: string, history: ChatMessage[]): Promise<string> {
        try {
            // 1. Gather Context
            const profile = await ProfileService.getProfile();
            const analysis = await AnalysisService.getLastAnalysis();
            const dietPlan = await ProfileService.getDietPlan();

            // 2. Derive additional data
            const vitalScore = analysis ? AnalysisService.calculateVitalScore(analysis) : 'N/A';
            const strategy = profile ? AnalysisService.calculateNutritionalStrategy(profile) : null;

            const criticalBiomarkers = analysis?.biomarkers
                ? analysis.biomarkers.filter((b: any) => b.status === 'critical' || b.status === 'warning').map((b: any) => b.name).join(', ')
                : 'Nessuno';

            // 3. Construct System Prompt / Context Block
            let contextPrompt = `
      SEI PROACTIVE LAB AI.
      
      IL TUO RUOLO:
      - Aiutare l'utente a comprendere i suoi dati.
      - Dare consigli su stile di vita, nutrizione e benessere generale.
      - Motivare l'utente a raggiungere i suoi obiettivi.
      - Rispondere in modo breve, amichevole e professionale.
      - IMPORTANTE: Non fornire mai diagnosi mediche. Per problemi specifici, rimanda sempre a uno specialista.
      
      DATI UTENTE (Riservati, usa per personalizzare le risposte):
      - Nome: ${profile?.name || 'Utente'}
      - Età: ${profile?.age || 'N/A'}
      - BMI: ${strategy?.bmi || 'N/A'} (${strategy?.bmiStatus || ''})
      - Fabbisogno Stimato: ${strategy?.tdee || 'N/A'} kcal
      - Obiettivo Calcolato: ${strategy?.goalType || 'Mantenimento'}
      - Condizioni: ${profile?.conditions?.join(', ') || 'Nessuna'}
      `;

            if (analysis) {
                // Format Biomarkers
                const biomarkersList = analysis.biomarkers?.map((b: any) =>
                    `- ${b.name}: ${b.value} ${b.unit || ''} (Target: ${b.target || 'N/A'}) [${b.status}]`
                ).join('\n        ') || 'Nessun dato registrato.';

                // Format Lipid Profile
                const cholesterol = analysis.cholesterolAnalysis?.quantitative;
                const lipidInfo = cholesterol ? `
        - Colesterolo Totale: ${cholesterol.total || 'N/A'}
        - HDL: ${cholesterol.hdl || 'N/A'}
        - LDL: ${cholesterol.ldl || 'N/A'}
        - Trigliceridi: ${cholesterol.triglycerides || 'N/A'}` : 'N/A';

                // Format Risks
                const risksList = analysis.fattoriDiRischio?.map((r: any) =>
                    `- ${r.identificazione} (${r.gravita})`
                ).join('\n        ') || 'Nessun fattore rilevato.';

                // Format Supplements
                const supplementsCurrent = analysis.supplements?.current?.map((s: any) =>
                    `- ${s.name} (${s.action}): ${s.reason}`
                ).join('\n        ') || 'Nessuno';

                const supplementsRec = analysis.supplements?.recommended?.map((s: any) =>
                    `- ${s.name} (${s.dosage}): ${s.reason}`
                ).join('\n        ') || 'Nessuno';

                contextPrompt += `
        DETTAGLIO PARAMETRI (Accesso Completo):
        
        [VALORI RILEVATI]
        ${biomarkersList}
        
        [PROFILO METABOLICO]${lipidInfo}

        [AREE DI MIGLIORAMENTO]
        ${risksList}

        [ROUTINE INTEGRAZIONE]
        Attuali:
        ${supplementsCurrent}
        Consigliati:
        ${supplementsRec}

        [SINTESI BENESSERE]
        - Punteggio Vitale: ${vitalScore}/100
        - Panoramica: ${analysis.valutazioneGenerale?.panoramica || 'N/A'}
        `;
            }

            if (dietPlan && dietPlan.days?.length > 0) {
                // Determine Current Day Context
                const now = new Date();
                const dayName = now.toLocaleDateString('it-IT', { weekday: 'long' });
                const fullDate = now.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

                // Map JS Day (0=Sun, 1=Mon) to Plan Day (1=Mon, ..., 7=Sun)
                const jsDay = now.getDay();
                const currentPlanDay = jsDay === 0 ? 7 : jsDay;

                // Format Full Diet Plan
                const fullPlanText = dietPlan.days.map((day: any) => {
                    const mealsText = day.meals.map((m: any) =>
                        `   - ${m.type.toUpperCase()}: ${m.name} (${m.calories} kcal)\n     Ingredienti: ${m.ingredients?.join(', ') || 'N/A'}\n     Macros: P:${m.macros.protein}g C:${m.macros.carbs}g F:${m.macros.fats}g`
                    ).join('\n\n');

                    return `GIORNO ${day.day}:\n${mealsText}`;
                }).join('\n\n----------------\n\n');

                contextPrompt += `
        CONTESTO TEMPORALE:
        - DATA DI OGGI: ${fullDate.toUpperCase()}
        - GIORNO CORRENTE DEL PIANO: Giorno ${currentPlanDay} (Se l'utente chiede "oggi", riferisciti a questo giorno).

        PIANO NUTRIZIONALE ATTIVO (COMPLETO):
        - Durata: ${dietPlan.days.length} giorni.
        - Calorie Target: ${strategy?.goalCalories || 'N/A'} kcal
        
        DETTAGLIO GIORNALIERO:
        ${fullPlanText}
        `;
            }

            contextPrompt += `
      
      ISTRUZIONI DI RISPOSTA:
      - Rispondi in italiano.
      - Sii conciso (max 3-4 frasi per default, chiedi se vuole approfondire).
      - Usa un tono empatico e positivo.
      - Usa EMOJI con moderazione per sembrare amichevole 🌟.
      - FORMATTAZIONE: Usa il **GRASSETTO** per i concetti chiave e le liste puntate per elenchi.
      - NON inventare dati.
      - EVITA di salutare (es. "Ciao Nome") in ogni risposta. Entra subito nel merito della risposta.
      `;

            // 4. Construct Message Payload for Gemini REST API
            // Add System Prompt as the first part of context or just prepend to user message context.
            // Gemini Flash supports 'system_instruction' but strictly speaking we can just put it in the conversation history as 'user' or 'model' prompt logic.
            // Easiest is to prepend to the *current* prompt, but since we send history, we should only send context once?
            // Actually, for stateless REST calls, we usually send the whole chat.
            // We will inject the System Prompt as a "user" message at the very start of the history array we send to Gemini.

            // Map history to Gemini format
            const contents = history.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            }));

            // Add the NEW user message
            contents.push({
                role: 'user',
                parts: [{ text: `${contextPrompt}\n\nDOMANDA UTENTE: ${message}` }]
            });

            const response = await fetch(GEMINI_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: contents
                })
            });

            if (!response.ok) {
                throw new Error(`Gemini API Error: ${response.status}`);
            }

            const data = await response.json();

            if (!data.candidates || !data.candidates[0].content) {
                throw new Error('No response from AI');
            }

            return data.candidates[0].content.parts[0].text;

        } catch (error) {
            console.error("ChatService Error:", error);
            return "Scusami, ho avuto un piccolo problema di connessione. Riprova tra un attimo! 🔌";
        }
    }
};
