import { db } from '../config/firebaseConfig';
import { doc, setDoc, getDoc, collection, addDoc, query, orderBy, limit, getDocs, deleteDoc } from 'firebase/firestore';
import { UserProfile } from '../types/Profile';

export const AnalysisService = {
    calculateNutritionalStrategy: (user: UserProfile) => {
        const heightM = parseFloat(user.height) / 100;
        const weightKg = parseFloat(user.weight);
        let bmi = 0;
        let bmiStatus = "N/A";
        let bmiColor = "#000";

        if (heightM > 0 && weightKg > 0) {
            bmi = weightKg / (heightM * heightM);
            if (bmi < 18.5) { bmiStatus = "Sottopeso"; bmiColor = "#3498db"; }
            else if (bmi < 25) { bmiStatus = "Normopeso"; bmiColor = "#2ecc71"; }
            else if (bmi < 30) { bmiStatus = "Sovrappeso"; bmiColor = "#f1c40f"; }
            else { bmiStatus = "Obeso"; bmiColor = "#e74c3c"; }
        }

        let bmr = 10 * weightKg + 6.25 * parseFloat(user.height) - 5 * parseFloat(user.age);
        bmr += user.gender === 'M' ? 5 : -161;

        const activityMultipliers: { [key: string]: number } = {
            'Sedentario': 1.2,
            'Leggermente attivo': 1.375,
            'Moderatamente attivo': 1.55,
            'Molto attivo': 1.725,
            'Estremo': 1.9
        };
        const multiplier = activityMultipliers[user.activityLevel] || 1.2;
        const tdee = Math.round(bmr * multiplier);

        let goalCalories = tdee;
        let goalType = "Mantenimento";

        if (bmi > 25) {
            goalCalories = tdee - 500;
            goalType = "Perdita Peso";
        } else if (bmi < 18.5) {
            goalCalories = tdee + 300;
            goalType = "Aumento Peso";
        }

        let proteinPct = 30;
        let carbsPct = 40;
        let fatsPct = 30;

        const hasDiabetes = user.conditions.includes("Diabete");
        if (hasDiabetes) {
            carbsPct = 30;
            proteinPct = 35;
            fatsPct = 35;
            goalType += " (Low Carb)";
        }

        return {
            bmi: parseFloat(bmi.toFixed(1)),
            bmiStatus,
            bmiColor,
            tdee,
            goalCalories: Math.round(goalCalories),
            goalType,
            macros: { protein: proteinPct, carbs: carbsPct, fats: fatsPct }
        };
    },

    calculateVitalScore: (data: any) => {
        if (!data) return 0;

        let biomarkerPenalty = 0;
        let riskPenalty = 0;
        let lipidPenalty = 0;
        let tumorBonus = 0;

        // 1. Biomarkers (Max Penalty: 50)
        // Bonus for optimal Tumor Markers
        const tumorMarkers = ['PSA', 'CEA', 'CA-125', 'CA-19.9', 'CA-15.3', 'AFP', 'B2M', 'TPA'];

        data.biomarkers?.forEach((b: any) => {
            if (b.status === 'critical') biomarkerPenalty += 5;
            else if (b.status === 'warning') biomarkerPenalty += 2;

            // Bonus check
            if (tumorMarkers.some(tm => b.name?.toUpperCase().includes(tm)) && b.status === 'optimal') {
                tumorBonus += 5;
            }
        });
        biomarkerPenalty = Math.min(biomarkerPenalty, 50);
        tumorBonus = Math.min(tumorBonus, 15); // Cap bonus at 15

        // 2. Risks (Max Penalty: 50)
        data.fattoriDiRischio?.forEach((r: any) => {
            const severity = r.gravita?.toLowerCase();
            if (severity === 'alto' || severity === 'medio alto' || severity === 'medio/alto') riskPenalty += 10;
            else if (severity === 'medio' || severity === 'medio basso' || severity === 'basso/medio') riskPenalty += 5;
            else if (severity === 'basso') riskPenalty += 2;
        });
        riskPenalty = Math.min(riskPenalty, 50);

        // 3. Lipid Profile (Max Penalty: 20)
        if (data.cholesterolAnalysis?.quantitative) {
            const q = data.cholesterolAnalysis.quantitative;
            const parse = (v: string) => parseFloat(v?.replace(/[^0-9.]/g, '') || '0');

            const total = parse(q.total);
            const ldl = parse(q.ldl);
            const hdl = parse(q.hdl);
            const trig = parse(q.triglycerides);

            // Smart Penalty Logic based on TG/HDL Ratio
            let tgHdlRatio = 0;
            if (hdl > 0) tgHdlRatio = trig / hdl;

            const isMetabolicallyHealthy = tgHdlRatio < 3; // Modern research threshold

            if (total > 200) {
                // If metabolically healthy, reduce penalty significantly
                lipidPenalty += isMetabolicallyHealthy ? 1 : 3;
            }
            if (ldl > 100) {
                // If metabolically healthy, reduce penalty significantly
                lipidPenalty += isMetabolicallyHealthy ? 1 : 3;
            }
            if (hdl < 40) lipidPenalty += 3; // Low HDL is always bad
            if (trig > 150) lipidPenalty += 3; // High Triglycerides is always bad
        }
        lipidPenalty = Math.min(lipidPenalty, 20);

        // Calculate Total
        // Base 100 - Penalties + Bonus
        let totalScore = 100 - (biomarkerPenalty + riskPenalty + lipidPenalty) + tumorBonus;

        // Cap at 100 (cannot exceed perfect health)
        totalScore = Math.min(100, totalScore);

        return Math.max(10, Math.round(totalScore));
    },

    saveAnalysis: async (analysisData: any) => {
        try {
            const userId = 'current_user'; // TODO: Replace with actual auth ID

            // Save as a new document in the history
            const docRef = await addDoc(collection(db, 'users', userId, 'analyses'), {
                ...analysisData,
                timestamp: new Date().toISOString(),
            });

            console.log('Analysis saved to history successfully');
            return docRef.id;
        } catch (error) {
            console.error('Error saving analysis:', error);
            throw error;
        }
    },

    getLastAnalysis: async () => {
        try {
            const userId = 'current_user';
            const q = query(
                collection(db, 'users', userId, 'analyses'),
                orderBy('timestamp', 'desc'),
                limit(1)
            );

            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                return { id: doc.id, ...doc.data() };
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error getting last analysis:', error);
            return null;
        }
    },

    getHistory: async () => {
        try {
            const userId = 'current_user';
            const q = query(
                collection(db, 'users', userId, 'analyses'),
                orderBy('timestamp', 'desc')
            );

            const querySnapshot = await getDocs(q);

            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting analysis history:', error);
            return [];
        }
    },

    deleteAnalysis: async (analysisId: string) => {
        try {
            const userId = 'current_user';
            await deleteDoc(doc(db, 'users', userId, 'analyses', analysisId));
            console.log('Analysis deleted successfully');
        } catch (error) {
            console.error('Error deleting analysis:', error);
            throw error;
        }
    }
};
