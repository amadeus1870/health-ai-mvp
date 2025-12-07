

export const ORGAN_MAPPING: Record<string, string[]> = {
    'Fegato': ['ALT', 'AST', 'GGT', 'Bilirubina', 'Fosfatasi Alcalina', 'Albumina', 'Proteine Totali', 'Transaminasi', 'Gamma GT', 'AFP', 'Alfa-feto'],
    'Colecisti': ['Bilirubina', 'GGT', 'Fosfatasi Alcalina', 'Gamma GT'],
    'Pancreas': ['Amilasi', 'Lipasi', 'Insulina', 'Glucosio', 'HbA1c', 'Glicemia', 'Emoglobina Glicata', 'CA 19-9', 'CA19', 'CA 19', 'CA 19.9', 'CA19.9'],
    'Reni': ['Creatinina', 'Azotemia', 'Urea', 'eGFR', 'Acido Urico', 'Sodio', 'Potassio', 'Filtrato Glomerulare'],
    'Cuore': ['Colesterolo', 'Trigliceridi', 'HDL', 'LDL', 'Omocisteina', 'PCR', 'Troponina', 'CPK', 'Creatinchinasi', 'Proteina C Reattiva'],
    'Tiroide': ['TSH', 'FT3', 'FT4', 'TPO', 'Tireostimolante', 'Tireotropina', 'Triiodotironina', 'Tiroxina', 'Tireoglobulina', 'Calcitonina'],
    'Stomaco': ['Gastrina', 'Pepsinogeno', 'Helicobacter', 'CA 72-4'],
    'Polmoni': ['Saturazione', 'CO2', 'Ossigeno', 'NSE', 'CYFRA 21-1'],
    'Cervello': ['Cortisolo', 'DHEA', 'Prolattina'],
    'Intestino': ['Vitamina B12', 'Folati', 'Ferro', 'Ferritina', 'Sideremia'],
    'Colon': ['Calprotectina', 'Sangue Occulto', 'CEA', 'Antigene Carcinoembrionario'],
    'Prostata': ['PSA', 'Antigene Prostatico', 'Esame Urine', 'Peso Specifico', 'pH'],
    'Ovaie/Seno': ['CA 125', 'CA 15-3', 'BRCA'],
};

export const WellnessService = {
    calculateOrganStatus: (analysisResults: any) => {
        const data: Record<string, any[]> = {};
        const status: Record<string, 'optimal' | 'warning' | 'critical' | 'neutral'> = {};

        Object.keys(ORGAN_MAPPING).forEach(organ => {
            status[organ] = 'neutral';

            if (analysisResults && analysisResults.biomarkers) {
                const relevantBios = analysisResults.biomarkers.filter((b: any) =>
                    b.name && ORGAN_MAPPING[organ].some(key => b.name.toLowerCase().includes(key.toLowerCase()))
                );

                if (relevantBios.length > 0) {
                    data[organ] = relevantBios;

                    if (relevantBios.some((b: any) => b.status === 'critical')) {
                        status[organ] = 'critical';
                    } else if (relevantBios.some((b: any) => b.status === 'warning')) {
                        status[organ] = 'warning';
                    } else {
                        status[organ] = 'optimal';
                    }
                }
            }
        });

        return { data, status };
    },

    calculateHealthScore: (analysisResults: any): number => {
        if (!analysisResults || !analysisResults.biomarkers || analysisResults.biomarkers.length === 0) {
            return 0; // No data
        }

        let score = 100;
        const totalBiomarkers = analysisResults.biomarkers.length;
        let warningCount = 0;
        let criticalCount = 0;

        analysisResults.biomarkers.forEach((b: any) => {
            if (b.status === 'warning') warningCount++;
            if (b.status === 'critical') criticalCount++;
        });

        // Simple scoring algorithm
        // Critical hits harder (-15), Warning less (-5)
        // But we constrain it not to drop below 0
        const penalty = (criticalCount * 15) + (warningCount * 5);
        score = Math.max(0, score - penalty);

        return score;
    }
};
