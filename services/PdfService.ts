import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { DietPlan } from '../types/Diet';
import { UserProfile } from '../types/Profile';
import { ShoppingListService } from './ShoppingListService';
import { AnalysisService } from './AnalysisService';
import i18n from '../config/i18n';

export const PdfService = {
    // Helper to convert basic Markdown to HTML
    formatMarkdown: (text: string): string => {
        if (!text) return '';
        let html = text
            // Bold (**text**)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Italic (*text*)
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Lists (- item)
            .replace(/^- (.*$)/gm, '<li>$1</li>');

        // Wrap lists in <ul> (simple heuristic: if contains <li>, wrap)
        // A better approach for simple lists:
        if (html.includes('<li>')) {
            // Check if it's just a list or mixed content.
            // For simplicity in this context, we'll just wrap the whole thing if it looks like a list block,
            // or replace consecutive <li>s with <ul>...</ul>.
            // Let's try to wrap groups of <li>
            html = html.replace(/(<li>.*<\/li>)+/g, '<ul>$&</ul>');
        }

        // Newlines to <br> (but not inside <ul> or after </li>)
        html = html.replace(/\n/g, '<br>');
        // Cleanup <br> after </ul> or </li>
        html = html.replace(/<\/ul><br>/g, '</ul>');
        html = html.replace(/<\/li><br>/g, '</li>');

        return html;
    },

    generateAndShareDietPdf: async (dietPlan: DietPlan, userProfile: UserProfile, language: string) => {
        try {
            const strategy = AnalysisService.calculateNutritionalStrategy(userProfile);
            const shoppingList = await ShoppingListService.generateList(dietPlan);

            const formatMarkdown = PdfService.formatMarkdown;
            const t = (key: string, options?: any) => i18n.t(key, { locale: language, ...options });

            const html = `
        <!DOCTYPE html>
        <html lang="${language}">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${t('pdf.dietTitle')} - ${userProfile.name}</title>
            <style>
                body { font-family: 'Helvetica', sans-serif; color: #333; line-height: 1.5; padding: 20px; }
                h1 { color: #FF9F43; text-align: center; margin-bottom: 10px; }
                h2 { color: #333; border-bottom: 2px solid #FF9F43; padding-bottom: 5px; margin-top: 30px; }
                h3 { color: #FF9F43; margin-top: 20px; margin-bottom: 5px; }
                .header-info { text-align: center; margin-bottom: 30px; font-size: 14px; color: #666; }
                .strategy-box { background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #eee; }
                .strategy-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                .day-container { margin-bottom: 30px; page-break-inside: avoid; }
                .meal-row { display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding: 10px 0; }
                .meal-info { flex: 1; }
                .meal-name { font-weight: bold; font-size: 16px; color: #333; }
                .meal-desc { font-size: 13px; color: #666; font-style: italic; margin-bottom: 4px; }
                .meal-ingredients { font-size: 13px; color: #444; }
                .meal-macros { width: 120px; text-align: right; font-size: 12px; color: #888; }
                .macro-tag { display: inline-block; padding: 2px 6px; border-radius: 4px; margin-left: 4px; font-weight: bold; }
                .shopping-list-category { margin-top: 15px; }
                .shopping-list-item { font-size: 14px; margin-bottom: 4px; }
                .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #999; }
                ul { margin: 5px 0; padding-left: 20px; }
                li { margin-bottom: 2px; }
            </style>
        </head>
        <body>
            <h1>${t('pdf.dietTitle')}</h1>
            <div class="header-info">
                ${t('pdf.generatedFor', { name: `<strong>${userProfile.name}</strong>`, date: new Date().toLocaleDateString(language) })}
            </div>

            <div class="strategy-box">
                <div class="strategy-row">
                    <strong>${t('pdf.goalCalories')}:</strong>
                    <span>${strategy.goalCalories} kcal / ${t('pdf.day').toLowerCase()}</span>
                </div>
                <div class="strategy-row">
                    <strong>${t('pdf.goal')}:</strong>
                    <span>${strategy.goalType}</span>
                </div>
                <div class="strategy-row">
                    <strong>${t('pdf.macros')}:</strong>
                    <span>${t('nutrition.protein')} ${strategy.macros.protein}% - ${t('nutrition.carbs')} ${strategy.macros.carbs}% - ${t('nutrition.fats')} ${strategy.macros.fats}%</span>
                </div>
            </div>

            ${dietPlan.days.map(day => `
                <div class="day-container">
                    <h2>${t('pdf.day')} ${day.day}</h2>
                    ${day.meals.map(meal => `
                        <div class="meal-row">
                            <div class="meal-info">
                                <div style="color: #FF9F43; font-size: 12px; font-weight: bold; text-transform: uppercase;">${meal.type}</div>
                                <div class="meal-name">${meal.name}</div>
                                ${meal.description ? `<div class="meal-desc">${formatMarkdown(meal.description)}</div>` : ''}
                                <div class="meal-ingredients">
                                    <strong>${t('pdf.ingredients')}:</strong> ${meal.ingredients.join(', ')}
                                </div>
                            </div>
                            <div class="meal-macros">
                                <div style="font-weight: bold; color: #333; font-size: 14px;">${meal.calories} kcal</div>
                                <div>P: ${meal.macros.protein}g</div>
                                <div>C: ${meal.macros.carbs}g</div>
                                <div>F: ${meal.macros.fats}g</div>
                            </div>
                        </div>
                    `).join('')}
                    <div style="text-align: right; margin-top: 10px; font-weight: bold; font-size: 14px;">
                        ${t('pdf.totalCalories')}: ${day.meals.reduce((sum, m) => sum + m.calories, 0)} kcal
                    </div>
                </div>
            `).join('')}

            <div style="page-break-before: always;"></div>

            <h2>${t('pdf.shoppingList')}</h2>
            <div style="column-count: 2; column-gap: 40px;">
                ${shoppingList.map(cat => `
                    <div class="shopping-list-category">
                        <h3 style="margin-top: 0;">${cat.name}</h3>
                        ${cat.items.map(item => `
                            <div class="shopping-list-item">
                                <span style="display: inline-block; width: 10px; height: 10px; border: 1px solid #ccc; margin-right: 5px;"></span>
                                ${item.name}
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>

            <div class="footer">
                ${t('pdf.footer')}
            </div>
        </body>
        </html>
        `;

            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });

        } catch (error) {
            console.error("Failed to generate PDF", error);
            throw error;
        }
    },

    generateAndShareAnalysisPdf: async (analysis: any, userProfile: UserProfile, vitalScore: number, language: string) => {
        try {
            // --- Ensure Data Safety (Prevent Crashes) ---
            // Map cholesterolAnalysis to profiloLipidico if needed
            if (!analysis.profiloLipidico && analysis.cholesterolAnalysis) {
                analysis.profiloLipidico = analysis.cholesterolAnalysis;
            }

            analysis.profiloLipidico = analysis.profiloLipidico || {};
            analysis.fattoriDiRischio = analysis.fattoriDiRischio || [];
            analysis.valutazioneGenerale = analysis.valutazioneGenerale || {};
            // Handle supplements carefully
            const supps = analysis.supplements || {};
            analysis.supplements = {
                current: supps.current || [],
                recommended: supps.recommended || []
            };
            analysis.raccomandazioni = analysis.raccomandazioni || {};
            analysis.conclusione = analysis.conclusione || '';

            // --- Helper Functions for Chart Logic ---
            const formatMarkdown = PdfService.formatMarkdown;
            const t = (key: string, options?: any) => i18n.t(key, { locale: language, ...options });

            // 1. Vital Score SVG Generator (Ticks)
            const generateVitalScoreSvg = (score: number, size: number) => {
                const radius = size / 2;
                const strokeWidth = 3;
                const numSegments = 60;
                const segmentLength = 15;
                // Center point
                const cx = radius;
                const cy = radius;

                let ticksHtml = '';
                for (let i = 0; i < numSegments; i++) {
                    const angle = (i / numSegments) * 360;
                    const radian = (angle - 90) * (Math.PI / 180);

                    const x1 = cx + (radius - 10) * Math.cos(radian);
                    const y1 = cy + (radius - 10) * Math.sin(radian);
                    const x2 = cx + (radius - 10 - segmentLength) * Math.cos(radian);
                    const y2 = cy + (radius - 10 - segmentLength) * Math.sin(radian);

                    const isActive = i < (score / 100) * numSegments;

                    // Color Logic
                    const ratio = i / numSegments;
                    let color = 'rgba(200, 200, 200, 0.3)'; // Inactive greyish
                    if (isActive) {
                        if (ratio < 0.33) color = '#FF453A'; // Red
                        else if (ratio < 0.66) color = '#FFD60A'; // Yellow
                        else color = '#32D74B'; // Green
                    }

                    ticksHtml += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" />`;
                }

                return `
                    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
                        ${ticksHtml}
                        <text x="50%" y="50%" text-anchor="middle" dy="0.3em" font-family="Helvetica" font-weight="bold" font-size="36" fill="#333">${Math.round(score)}</text>
                    </svg>
                `;
            };

            // 2. Global Risk SVG Generator (Solid Ring)
            const generateGlobalRiskSvg = (risks: any[], size: number) => {
                // Calculate Score
                let totalScore = 0;
                let maxScore = Math.max(risks.length * 3, 1); // Avoid div by 0
                risks.forEach(r => {
                    const severity = r.gravita?.toLowerCase();
                    if (severity?.includes('alto')) totalScore += 3;
                    else if (severity?.includes('medio')) totalScore += 2;
                    else totalScore += 1;
                });
                const percentage = totalScore / maxScore;

                // Color & Label
                let color = '#2ecc71'; // Green
                let label = t('analysis.riskLevels.low');
                if (percentage > 0.66) { color = '#b61b1b'; label = t('analysis.riskLevels.high'); }
                else if (percentage > 0.33) { color = '#FFB142'; label = t('analysis.riskLevels.medium'); }

                const radius = (size - 15) / 2;
                const circumference = 2 * Math.PI * radius;
                const offset = circumference * (1 - percentage);

                return `
                    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform: rotate(-90deg);">
                        <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" stroke="#eee" stroke-width="15" fill="none" />
                        <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" stroke="${color}" stroke-width="15" fill="none" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" stroke-linecap="round" />
                    </svg>
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #333;">${Math.round(percentage * 100)}%</div>
                        <div style="font-size: 14px; font-weight: bold; color: #333; margin-top: 2px;">${label}</div>
                    </div>
                `;
            };

            // 3. Comparison Bar HTML Generator (Lipid Profile)
            const generateComparisonRow = (label: string, valueStr: string | number, target: number, unit: string, isLowerBetter: boolean = true, isWarning: boolean = false) => {
                const value = parseFloat(String(valueStr || '0').replace(/[^0-9.]/g, '') || '0');
                const maxScale = Math.max(value, target) * 1.3;
                const userPercent = Math.min((value / maxScale) * 100, 100);
                const targetPercent = Math.min((target / maxScale) * 100, 100);

                const safeWidth = Math.min(userPercent, targetPercent);
                const excessWidth = Math.max(0, userPercent - targetPercent);

                // Colors
                const safeColor = '#2ecc71'; // Green
                let excessColor = isLowerBetter ? '#FF5252' : '#2ecc71'; // Red if higher is bad

                if (isWarning) {
                    excessColor = '#FFB142'; // Yellow/Orange for specific warnings like TG/HDL 2-3
                }

                return `
                <div style="margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px; align-items: flex-end;">
                        <div style="font-weight: bold; font-size: 14px; color: #333;">${label}</div>
                        <div style="font-size: 16px; font-weight: bold; color: #333;">${value}</div>
                    </div>
                    <div style="height: 24px; background-color: #F0F2F5; border-radius: 6px; position: relative; width: 100%;">
                        <!-- Safe Green Area -->
                        <div style="position: absolute; left: 0; height: 100%; width: ${safeWidth}%; background-color: ${safeColor}; border-radius: 6px 0 0 6px;"></div>
                        
                        <!-- Excess Area (if any) -->
                        ${excessWidth > 0 ? `<div style="position: absolute; left: ${targetPercent}%; height: 100%; width: ${excessWidth}%; background-color: ${excessColor}; border-radius: 0 6px 6px 0;"></div>` : ''}

                        <!-- Target Marker -->
                        <div style="position: absolute; left: ${targetPercent}%; top: 0; bottom: 0; width: 2px; background-color: #2D3436; z-index: 10;"></div>
                    </div>
                    <div style="text-align: right; font-size: 10px; color: #666; margin-top: 4px;">${t('pdf.target')}: ${isLowerBetter ? '<' : '>'} ${target} ${unit}</div>
                </div>
               `;
            };

            // 4. Radar Chart SVG Generator
            const generateRadarChartSvg = (lipidProfile: any, size: number) => {
                const parseVal = (v: string | number) => parseFloat(String(v || '0').replace(/[^0-9.]/g, '') || '0');

                // DATA PREPARATION (Matching RadarChart.tsx logic)
                // We define max 'fullMark' for axis scaling and 'target' for the safe zone.
                const dataPoints = [
                    {
                        label: t('analysis.charts.total'),
                        value: parseVal(lipidProfile.colesteroloTotale || lipidProfile.quantitative?.total),
                        fullMark: 300,
                        target: 200,
                        isOk: (parseVal(lipidProfile.colesteroloTotale || lipidProfile.quantitative?.total) < 200)
                    },
                    {
                        label: t('analysis.charts.ldl'),
                        value: parseVal(lipidProfile.colesteroloLDL || lipidProfile.quantitative?.ldl),
                        fullMark: 200,
                        target: 100,
                        isOk: (parseVal(lipidProfile.colesteroloLDL || lipidProfile.quantitative?.ldl) < 100)
                    },
                    {
                        label: t('analysis.charts.triglycerides'),
                        value: parseVal(lipidProfile.trigliceridi || lipidProfile.quantitative?.triglycerides),
                        fullMark: 300,
                        target: 150,
                        isOk: (parseVal(lipidProfile.trigliceridi || lipidProfile.quantitative?.triglycerides) < 150)
                    },
                    {
                        label: t('analysis.charts.hdl'),
                        value: parseVal(lipidProfile.colesteroloHDL || lipidProfile.quantitative?.hdl),
                        fullMark: 100,
                        target: 50, // HDL target > 50, so for plot we can stick to this. Visual logic usually implies outer = better for radar? 
                        // Actually in the app code viewed: normalizedValue = Math.min(item.target, item.fullMark).
                        // It aligns comparison. For HDL > 50 is good. Visualizing "Safe Zone" at 50 mark.
                        isOk: (parseVal(lipidProfile.colesteroloHDL || lipidProfile.quantitative?.hdl) > 50)
                    }
                ];

                const radius = (size / 2) - 40;
                const cx = size / 2;
                const cy = size / 2;
                const angleSlice = (Math.PI * 2) / dataPoints.length;

                // Helper to get coordinates
                const getCoordinates = (value: number, index: number, max: number) => {
                    const angle = index * angleSlice - Math.PI / 2; // Start from top (-90deg)
                    const normalized = Math.min(value / max, 1); // Cap at max
                    const r = normalized * radius;
                    return {
                        x: cx + r * Math.cos(angle),
                        y: cy + r * Math.sin(angle)
                    };
                };

                // 1. Grid (Concentric Polygons)
                const gridLevels = 4;
                let gridHtml = '';
                for (let level = 0; level < gridLevels; level++) {
                    const factor = (level + 1) / gridLevels;
                    const points = dataPoints.map((_, i) => {
                        const r = radius * factor;
                        const angle = i * angleSlice - Math.PI / 2;
                        return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
                    }).join(' ');
                    gridHtml += `<polygon points="${points}" stroke="#eee" stroke-width="1" fill="none" />`;
                }

                // 2. Axes Lines & Labels
                let axesHtml = '';
                dataPoints.forEach((item, i) => {
                    const angle = i * angleSlice - Math.PI / 2;
                    const endX = cx + radius * Math.cos(angle);
                    const endY = cy + radius * Math.sin(angle);

                    // Label Pos
                    const labelR = radius + 20;
                    const labelX = cx + labelR * Math.cos(angle);
                    const labelY = cy + labelR * Math.sin(angle);

                    axesHtml += `
                        <line x1="${cx}" y1="${cy}" x2="${endX}" y2="${endY}" stroke="#eee" stroke-width="1" />
                        <text x="${labelX}" y="${labelY}" text-anchor="middle" dominant-baseline="middle" font-size="10" fill="#666">${item.label}</text>
                    `;
                });

                // 3. Safe Zone Polygon (The "Ideal Values")
                const safePoints = dataPoints.map((item, i) => {
                    const { x, y } = getCoordinates(item.target, i, item.fullMark);
                    return `${x},${y}`;
                }).join(' ');

                // 4. User Data Polygon
                const userPoints = dataPoints.map((item, i) => {
                    const { x, y } = getCoordinates(item.value, i, item.fullMark);
                    return `${x},${y}`;
                }).join(' ');

                // 5. Data Points (Circles)
                const circlesHtml = dataPoints.map((item, i) => {
                    const { x, y } = getCoordinates(item.value, i, item.fullMark);
                    const color = item.isOk ? '#32D74B' : '#FF453A';
                    return `<circle cx="${x}" cy="${y}" r="4" fill="${color}" stroke="#fff" stroke-width="1" />`;
                }).join('');

                return `
                    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
                        <!-- Grid -->
                        ${gridHtml}
                        
                        <!-- Axes & Labels -->
                        ${axesHtml}

                        <!-- Safe Zone (Green Area) -->
                        <polygon points="${safePoints}" fill="#32D74B" fill-opacity="0.2" stroke="#32D74B" stroke-width="1" stroke-dasharray="4,4" />

                        <!-- User Data (Orange Area) -->
                        <polygon points="${userPoints}" fill="#E65100" fill-opacity="0.2" stroke="#E65100" stroke-width="2" />

                        <!-- User Value Points -->
                        ${circlesHtml}
                    </svg>
                `;
            };

            const html = `
                <!DOCTYPE html>
                <html lang="${language}">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${t('pdf.analysisTitle')} - ${userProfile.name}</title>
                    <style>
                        body { font-family: 'Helvetica', sans-serif; color: #333; line-height: 1.6; padding: 0; margin: 0; background-color: #fff; }
                        .container { max-width: 800px; margin: 0 auto; padding: 40px; }
                        .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; }
                        .logo { font-size: 24px; font-weight: bold; color: #E65100; margin-bottom: 5px; }
                        .date { font-size: 14px; color: #999; }
                        h1 { color: #333; font-size: 28px; margin-bottom: 10px; }
                        h2 { color: #E65100; font-size: 20px; border-bottom: 2px solid #FFE0B2; padding-bottom: 5px; margin-top: 40px; margin-bottom: 15px; }
                        h3 { color: #333; font-size: 16px; margin-top: 20px; margin-bottom: 10px; }
                        
                        /* Top Cards Grid */
                        .top-cards-container { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 40px; }
                        .summary-card { flex: 1; background: #fff; border: 1px solid #eee; border-radius: 12px; padding: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); display: flex; flex-direction: column; align-items: center; text-align: center; }
                        .summary-card-title { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 15px; }
                        .summary-card-desc { font-size: 12px; color: #666; margin-top: 15px; margin-bottom: 10px; line-height: 1.4; }
                        .summary-card-info { font-size: 11px; color: #888; background: #f9f9f9; padding: 10px; border-radius: 8px; width: 100%; text-align: left; margin-top: auto; border: 1px solid #f0f0f0; font-style: italic; }

                        .card-section { background-color: #fff; border-radius: 12px; margin-bottom: 20px; }
                        .card-content { padding: 15px; background-color: #FAFAFA; border-radius: 8px; }
                        .risk-item { margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee; }
                        .risk-item:last-child { border-bottom: none; }
                        .risk-high { color: #b61b1b; }
                        .risk-med { color: #FFB142; }
                        .risk-low { color: #2ecc71; }
                        .supp-grid { display: flex; flex-wrap: wrap; gap: 10px; }
                        .supp-card { flex: 1; min-width: 45%; background: #fff; padding: 10px; border-radius: 8px; border: 1px solid #eee; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
                        .supp-name { font-weight: bold; font-size: 14px; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center; }
                        .supp-dose { font-size: 12px; color: #666; margin-bottom: 4px; }
                        .supp-reason { font-size: 12px; color: #888; font-style: italic; }
                        .status-badge { font-size: 10px; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
                        .status-confirm { background-color: rgba(46, 204, 113, 0.15); color: #2ecc71; }
                        .status-suspend { background-color: rgba(255, 82, 82, 0.15); color: #FF5252; }
                        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #bbb; border-top: 1px solid #f0f0f0; padding-top: 20px; }
                        .disclaimer { font-size: 10px; color: #999; margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 8px; text-align: justify; }
                        ul { margin: 5px 0; padding-left: 20px; }
                        li { margin-bottom: 2px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>${t('pdf.analysisTitle')}</h1>
                            <h3 style="text-align: center; color: #666; margin-top: -10px; margin-bottom: 20px;">${t('pdf.analysisSubtitle')}</h3>
                            <div class="date">${t('pdf.generatedFor', { name: `<strong>${userProfile.name}</strong>`, date: new Date().toLocaleDateString(language) })}</div>
                        </div>

                        <!-- TOP 3 SUMMARY CARDS -->
                        <div class="top-cards-container">
                            <!-- 1. Vital Score -->
                            <div class="summary-card">
                                <div class="summary-card-title">${t('pdf.vitalScore')}</div>
                                ${generateVitalScoreSvg(vitalScore, 140)}
                                <div class="summary-card-desc">${t('pdf.vitalScoreDesc')}</div>
                                <div class="summary-card-info">${t('pdf.vitalScoreInfo')}</div>
                            </div>
                            
                            <!-- 2. Profilo Lipidico (Radar) -->
                            <div class="summary-card">
                                <div class="summary-card-title">${t('pdf.lipidProfile')}</div>
                                ${generateRadarChartSvg(analysis.profiloLipidico, 140)}
                                <div class="summary-card-desc">${t('pdf.lipidProfileDesc')}</div>
                                <div class="summary-card-info">${t('pdf.lipidProfileInfo')}</div>
                            </div>

                            <!-- 3. Rischio Globale -->
                            <div class="summary-card">
                                <div class="summary-card-title">${t('pdf.globalRisk')}</div>
                                <div style="position: relative; width: 140px; height: 140px; margin: 0 auto;">
                                    ${generateGlobalRiskSvg(analysis.fattoriDiRischio, 140)}
                                </div>
                                <div class="summary-card-desc">${t('pdf.globalRiskDesc')}</div>
                                <div class="summary-card-info">${t('pdf.globalRiskInfo')}</div>
                            </div>
                        </div>

                        <!-- DETAILED SECTIONS -->

                        <!-- 1. Profilo Lipidico -->
                        <h2>${t('pdf.lipidProfile')}</h2>
                        <div class="card-section">
                            
                            <!-- QUANTITATIVE ANALYSIS -->
                            <div style="margin-bottom: 30px;">
                                <div style="display: flex; align-items: center; margin-bottom: 10px; color: #E65100;">
                                    <span style="font-size: 18px; margin-right: 8px;">📊</span>
                                    <h3 style="margin: 0; color: #E65100;">${t('pdf.quantitativeAnalysis')}</h3>
                                </div>
                                <p style="font-size: 13px; color: #666; margin-bottom: 20px;">${formatMarkdown(analysis.profiloLipidico.quantitative?.description || analysis.profiloLipidico.analisi || t('pdf.dataNotAvailable'))}</p>

                                <div style="margin-bottom: 20px;">
                                    ${generateComparisonRow(t('analysis.charts.total'), analysis.profiloLipidico.colesteroloTotale || analysis.profiloLipidico.quantitative?.total, 200, 'mg/dL')}
                                    ${generateComparisonRow(t('analysis.charts.ldl'), analysis.profiloLipidico.colesteroloLDL || analysis.profiloLipidico.quantitative?.ldl, 100, 'mg/dL')}
                                    ${generateComparisonRow(t('analysis.charts.hdl'), analysis.profiloLipidico.colesteroloHDL || analysis.profiloLipidico.quantitative?.hdl, 50, 'mg/dL', false)}
                                    ${generateComparisonRow(t('analysis.charts.triglycerides'), analysis.profiloLipidico.trigliceridi || analysis.profiloLipidico.quantitative?.triglycerides, 150, 'mg/dL')}
                                </div>
                            </div>

                            <!-- QUALITATIVE ANALYSIS -->
                            ${analysis.profiloLipidico.qualitative ? `
                                <div>
                                    <div style="display: flex; align-items: center; margin-bottom: 10px; color: #E65100;">
                                        <span style="font-size: 18px; margin-right: 8px;">🧪</span>
                                        <h3 style="margin: 0; color: #E65100;">${t('pdf.qualitativeAnalysis')}</h3>
                                    </div>
                                    <p style="font-size: 13px; color: #666; margin-bottom: 20px;">${formatMarkdown(analysis.profiloLipidico.qualitative.description || '')}</p>

                                    ${analysis.profiloLipidico.qualitative.metrics ? analysis.profiloLipidico.qualitative.metrics.map((metric: any) => {
                // Logic from CholesterolCard.tsx to determine targets
                let target = 0;
                let unit = '';
                let isLowerBetter = true;

                if (metric.name.includes('Non-HDL')) { target = 130; unit = 'mg/dL'; }
                else if (metric.name.includes('TG/HDL')) { target = 2.0; unit = 'ratio'; }
                else if (metric.name.includes('Remnant')) { target = 30; unit = 'mg/dL'; }
                else if (metric.name.includes('LAP')) { target = 30; unit = 'score'; }

                let isWarning = false;
                if (metric.name.includes('TG/HDL')) {
                    const val = parseFloat(metric.value?.replace(/[^0-9.]/g, '') || '0');
                    if (val >= 2.0 && val <= 3.0) {
                        isWarning = true;
                    }
                }

                return `
                                            <div style="margin-bottom: 15px;">
                                                ${generateComparisonRow(metric.name, metric.value, target, unit, isLowerBetter, isWarning)}
                                                <div style="font-size: 12px; color: #888; font-style: italic; margin-top: -5px; padding-left: 5px;">
                                                    ${formatMarkdown(metric.interpretation)}
                                                </div>
                                            </div>
                                        `;
            }).join('') : ''}
                                </div>
                            ` : ''}
                        </div>

                        <!-- 2. Valutazione Generale -->
                        <h2>${t('pdf.generalEvaluation')}</h2>
                        <div class="card-section">
                            <div class="card-content">
                                <p><strong>${t('pdf.overview')}: </strong> ${formatMarkdown(analysis.valutazioneGenerale.panoramica || 'N/A')}</p>
                                <p><strong>${t('pdf.keyResults')}: </strong> ${formatMarkdown((analysis.valutazioneGenerale.risultati || 'N/A').replace(new RegExp(`^${t('pdf.keyResults')}:?\\s*`, 'i'), ''))}</p>
                                <p><strong>${t('pdf.trends')}: </strong> ${formatMarkdown(analysis.valutazioneGenerale.tendenze || 'N/A')}</p>
                                <p><strong>${t('pdf.correlations')}: </strong> ${formatMarkdown(analysis.valutazioneGenerale.correlazioni || 'N/A')}</p>
                            </div>
                        </div>

                        <!-- 3. Fattori di Rischio -->
                        <h2>${t('pdf.riskFactors')}</h2>
                        <div class="card-section">
                            ${analysis.fattoriDiRischio.length > 0 ? analysis.fattoriDiRischio.map((risk: any) => `
                                <div class="risk-item ${risk.gravita.toLowerCase().includes('high') || risk.gravita.toLowerCase().includes('alto') ? 'risk-high' : risk.gravita.toLowerCase().includes('medium') || risk.gravita.toLowerCase().includes('medio') ? 'risk-med' : 'risk-low'}">
                                    <div style="font-weight: bold; text-transform: uppercase; font-size: 12px; margin-bottom: 2px;">${t(`analysis.riskLevels.${risk.gravita.toLowerCase()}`) || risk.gravita}</div>
                                    <div style="font-weight: bold; font-size: 16px; margin-bottom: 5px; color: #333;">${formatMarkdown(risk.identificazione)}</div>
                                    <div style="font-size: 14px; color: #555;">${formatMarkdown(risk.spiegazione)}</div>
                                </div>
                            `).join('') : `<div style="padding: 10px; font-style: italic; color: #666;">${t('pdf.noRiskFactors')}</div>`}
                        </div>

                        <!-- 4. Raccomandazioni -->
                        <h2>${t('pdf.recommendations')}</h2>
                        <div class="card-section">
                            <div class="card-content">
                                <h3>${t('pdf.medicalConsiderations')}</h3>
                                <p>${formatMarkdown(analysis.raccomandazioni.mediche || 'N/A')}</p>
                                <h3>${t('pdf.lifestyle')}</h3>
                                <p>${formatMarkdown(analysis.raccomandazioni.stileDiVita || 'N/A')}</p>
                                <h3>${t('pdf.followUp')}</h3>
                                <p>${formatMarkdown(analysis.raccomandazioni.followUp || 'N/A')}</p>
                                <h3>${t('pdf.specialists')}</h3>
                                <p>${formatMarkdown(analysis.raccomandazioni.specialisti || 'N/A')}</p>
                            </div>
                        </div>

                        <!-- 5. Integrazione -->
                        <h2>${t('pdf.supplements')}</h2>
                        ${analysis.supplements.current.length > 0 ? `
                            <h3>${t('pdf.currentSupplements')}</h3>
                            <div class="supp-grid" style="margin-bottom: 20px;">
                                ${analysis.supplements.current.map((s: any) => {
                const isConfirm = s.action?.toLowerCase() === 'conferma';
                const badgeClass = isConfirm ? 'status-confirm' : 'status-suspend';
                const badgeText = isConfirm ? t('pdf.confirm') : t('pdf.suspend');
                return `
                                    <div class="supp-card">
                                        <div class="supp-name">
                                            <span>👤 ${s.name}</span>
                                            <span class="status-badge ${badgeClass}">${badgeText}</span>
                                        </div>
                                        ${s.dosage ? `<div class="supp-dose">${s.dosage}</div>` : ''}
                                        <div class="supp-reason">${formatMarkdown(s.reason || t('pdf.currentlyTaken'))}</div>
                                    </div>
                                    `;
            }).join('')}
                            </div>
                        ` : ''}

                        ${analysis.supplements.recommended.length > 0 ? `
                            <h3>${t('pdf.recommendedSupplements')}</h3>
                            <div class="supp-grid">
                                ${analysis.supplements.recommended.map((s: any) => `
                                    <div class="supp-card" style="border-left: 3px solid #E65100;">
                                        <div class="supp-name">⭐ ${s.name}</div>
                                        <div class="supp-dose">${s.dosage}</div>
                                        <div class="supp-reason">${formatMarkdown(s.reason)}</div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                        ${analysis.supplements.current.length === 0 && analysis.supplements.recommended.length === 0 ? `<p style="font-style:italic; color:#666;">${t('pdf.noSupplements')}</p>` : ''}

                        <!-- 6. Conclusione -->
                        <h2>${t('pdf.conclusion')}</h2>
                        <div class="card-section">
                            <div class="card-content" style="background-color: #f0f8ff; border: 1px solid #bcdff1;">
                                ${formatMarkdown(analysis.conclusione || t('pdf.noConclusion'))}
                            </div>
                        </div>

                        <div class="footer">
                            ${t('pdf.footer')}
                        </div>

                        <div class="disclaimer">
                            <strong>${t('pdf.disclaimerTitle')}</strong><br>
                            ${t('pdf.disclaimerText')}
                        </div>
                    </div>
                </body>
                </html>
            `;



            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });

        } catch (error) {
            console.error("Failed to generate Analysis PDF", error);
            throw error;
        }
    },

    generateBiomarkersPdf: async (biomarkers: any[], userProfile: UserProfile, language: string) => {
        try {
            const t = (key: string, options?: any) => i18n.t(key, { locale: language, ...options });

            const html = `
                <!DOCTYPE html>
                <html lang="${language}">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${t('pdf.biomarkersTitle')} - ${userProfile.name}</title>
                    <style>
                        body { font-family: 'Helvetica', sans-serif; color: #333; line-height: 1.6; padding: 40px; }
                        h1 { color: #E65100; text-align: center; margin-bottom: 30px; }
                        .header-info { text-align: center; margin-bottom: 40px; font-size: 14px; color: #666; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
                        th { background-color: #f9f9f9; color: #666; font-weight: bold; font-size: 14px; }
                        td { font-size: 14px; color: #333; }
                        .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
                        .status-ok { background-color: rgba(46, 204, 113, 0.2); color: #2ecc71; }
                        .status-warning { background-color: rgba(255, 177, 66, 0.2); color: #FFB142; }
                        .status-danger { background-color: rgba(255, 82, 82, 0.2); color: #FF5252; }
                        .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
                    </style>
                </head>
                <body>
                    <h1>${t('pdf.biomarkersTitle')}</h1>
                    <div class="header-info">
                        ${t('pdf.generatedFor', { name: `<strong>${userProfile.name}</strong>`, date: new Date().toLocaleDateString(language) })}
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>${t('pdf.name')}</th>
                                <th>${t('pdf.value')}</th>
                                <th>${t('pdf.unit')}</th>
                                <th>${t('pdf.target')}</th>
                                <th>${t('pdf.status')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${biomarkers.map(b => {
                let statusClass = 'status-ok';
                let statusText = 'OK';
                if (b.status?.toLowerCase().includes('fuori') || b.status?.toLowerCase().includes('alto') || b.status?.toLowerCase().includes('basso') || b.status?.toLowerCase().includes('warning') || b.status?.toLowerCase().includes('critical')) {
                    statusClass = 'status-danger';
                    statusText = t('pdf.attention');
                }

                return `
                                <tr>
                                    <td style="font-weight: bold;">${b.name}</td>
                                    <td>${b.value}</td>
                                    <td>${b.unit}</td>
                                    <td>${b.target}</td>
                                    <td><span class="status-badge ${statusClass}">${b.status || statusText}</span></td>
                                </tr>
                                `;
            }).join('')
                }
                        </tbody>
                    </table>

                    <div class="footer">
                        ${t('pdf.footer')}
                    </div>
                    <div style="font-size: 10px; color: #999; text-align: center; margin-top: 30px; line-height: 1.4; border-top: 1px solid #eee; padding-top: 15px;">
                        <strong>${t('pdf.disclaimerTitle')}:</strong><br>
                        ${t('pdf.disclaimerTextShort')}
                    </div>
                </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            console.error("Failed to generate Biomarkers PDF", error);
            throw error;
        }
    }

};
