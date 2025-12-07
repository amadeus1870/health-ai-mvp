import { DietPlan } from '../types/Diet';
import { categorizeIngredients } from './gemini';

export interface IngredientItem {
    name: string;
    checked: boolean;
}

export interface Category {
    name: string;
    items: IngredientItem[];
}

export const ShoppingListService = {
    generateList: async (dietPlan: DietPlan): Promise<Category[]> => {
        if (!dietPlan || !dietPlan.days) return [];

        const allIngredients: string[] = [];
        dietPlan.days.forEach(day => {
            day.meals.forEach(meal => {
                meal.ingredients.forEach(ing => {
                    allIngredients.push(ing.trim());
                });
            });
        });

        const aggregatedIngredients = ShoppingListService.aggregateIngredients(allIngredients);

        try {
            const categorizedData = await categorizeIngredients(aggregatedIngredients);

            return categorizedData.map(cat => ({
                name: cat.category,
                items: cat.items.map(name => ({
                    name: name.charAt(0).toUpperCase() + name.slice(1),
                    checked: false
                }))
            }));
        } catch (error) {
            // Fallback to simple list
            return [{
                name: "Tutti gli ingredienti",
                items: aggregatedIngredients.sort().map(name => ({
                    name: name.charAt(0).toUpperCase() + name.slice(1),
                    checked: false
                }))
            }];
        }
    },

    aggregateIngredients: (ingredients: string[]): string[] => {
        const map = new Map<string, { quantity: number, unit: string }>();
        const unparsable: string[] = [];

        ingredients.forEach(ing => {
            const normalized = ing.toLowerCase().trim();
            // Regex to capture Number (int/float with . or ,) and the rest
            const match = normalized.match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/);

            if (match) {
                let qty = parseFloat(match[1].replace(',', '.'));
                const rest = match[2].trim();

                // 1. Parse Unit and Name
                let { unit, name } = ShoppingListService.parseUnitAndName(rest);

                // 2. Normalize Name (Synonyms, cleaning)
                name = ShoppingListService.normalizeIngredientName(name);

                // 3. Convert to Standard Unit (e.g. Oil: cucchiaio -> 14g)
                const conversion = ShoppingListService.convertToStandardUnit(qty, unit, name);
                qty = conversion.qty;
                unit = conversion.unit;

                // 4. Aggregate
                const key = `${name}_${unit}`;

                if (map.has(key)) {
                    map.get(key)!.quantity += qty;
                } else {
                    map.set(key, { quantity: qty, unit });
                }
            } else {
                unparsable.push(ShoppingListService.normalizeIngredientName(normalized));
            }
        });

        const aggregated = Array.from(map.entries()).map(([key, item]) => {
            const name = key.split('_')[0];
            // Format to max 1 decimal for cleaner look (e.g. 14.5g)
            const qty = parseFloat(item.quantity.toFixed(1));
            return `${qty}${item.unit ? ' ' + item.unit : ''} ${name}`;
        });

        const uniqueUnparsable = Array.from(new Set(unparsable));

        return [...aggregated, ...uniqueUnparsable];
    },

    parseUnitAndName: (input: string): { unit: string, name: string } => {
        // Common units
        const units = [
            'gr', 'g', 'grammi', 'grammo',
            'ml', 'l', 'litri', 'litro',
            'kg', 'chili',
            'cucchiaio', 'cucchiai',
            'cucchiaino', 'cucchiaini',
            'tazza', 'tazze',
            'bicchiere', 'bicchieri',
            'fetta', 'fette',
            'spicchio', 'spicchi',
            'pizzico',
            'vasetto', 'vasetti'
        ];

        // Sort by length desc to match "cucchiai" before "cucchiaio" if needed
        units.sort((a, b) => b.length - a.length);

        for (const u of units) {
            // Check if input starts with unit + space
            if (input.startsWith(u + ' ') || input === u) {
                return {
                    unit: u,
                    name: input.slice(u.length).trim()
                };
            }
        }

        // No unit found, assume "pz" or empty
        return { unit: '', name: input };
    },

    convertToStandardUnit: (qty: number, unit: string, name: string): { qty: number, unit: string } => {
        // Normalize unit string
        let stdUnit = unit;
        if (['gr', 'grammi', 'grammo'].includes(unit)) stdUnit = 'g';
        if (['ml', 'millilitri'].includes(unit)) stdUnit = 'ml';
        if (['l', 'litri', 'litro'].includes(unit)) { qty *= 1000; stdUnit = 'ml'; }
        if (['kg', 'chili'].includes(unit)) { qty *= 1000; stdUnit = 'g'; }
        if (['cucchiaio', 'cucchiai'].includes(unit)) stdUnit = 'cucchiai';
        if (['cucchiaino', 'cucchiaini'].includes(unit)) stdUnit = 'cucchiaini';
        if (['costa', 'coste'].includes(unit)) stdUnit = 'gambo';
        if (['gambi'].includes(unit)) stdUnit = 'gambo';

        // OIL SPECIFIC CONVERSION
        if (name.includes('olio')) {
            if (stdUnit === 'cucchiai') {
                return { qty: qty * 14, unit: 'g' }; // ~14g per tablespoon
            }
            if (stdUnit === 'cucchiaini') {
                return { qty: qty * 5, unit: 'g' }; // ~5g per teaspoon
            }
            if (stdUnit === 'ml') {
                return { qty: qty, unit: 'g' }; // Approx 1:1 for simplicity
            }
        }

        return { qty, unit: stdUnit };
    },

    normalizeIngredientName: (name: string): string => {
        let normalized = name.toLowerCase().trim();

        // 1. Remove content in parentheses (e.g. "Merluzzo (filetto)" -> "Merluzzo")
        normalized = normalized.replace(/\(.*\)/g, '');

        // 2. Remove punctuation
        normalized = normalized.replace(/[.,;*]/g, '');

        // 3. Remove common adjectives/descriptions
        const wordsToRemove = [
            'fresco', 'freschi', 'fresca', 'fresche',
            'surgelato', 'surgelati', 'surgelata', 'surgelate',
            'congelato', 'congelati',
            'biologico', 'bio',
            'di stagione',
            'misto', 'misti', 'mix',
            'integrale', 'integrali', // Keep 'integrale' if it distinguishes the item (e.g. pasta), but often users want Pasta summed. Let's keep it for now as it's a distinct product, but remove 'mix'.
            'ricetta', // e.g. "per ricetta"
        ];

        // 4. Remove common cut/type prefixes if they are part of the name string
        // Note: We remove "di " later, so "filetto di merluzzo" -> "filetto merluzzo" -> "merluzzo"
        const prefixesToRemove = [
            'filetto', 'filetti',
            'trancio', 'tranci',
            'fetta', 'fette',
            'bistecca', 'bistecche',
            'petto', 'petti',
            'coscia', 'cosce',
            'sovra', // sovracoscia
            'macinato',
            'trita',
            'cubetti',
            'spremuta',
            'succo',
            'pizzico',
        ];

        // Apply removals
        let words = normalized.split(/\s+/);
        words = words.filter(w => !wordsToRemove.includes(w) && !prefixesToRemove.includes(w));
        normalized = words.join(' ');

        // 5. Remove stop words
        [' di ', ' del ', ' della ', ' dei ', ' delle ', ' al ', ' alla ', ' ai ', ' alle ', ' il ', ' lo ', ' la ', ' i ', ' gli ', ' le ', ' un ', ' una '].forEach(word => {
            normalized = normalized.replace(word, ' ');
        });

        normalized = normalized.trim();

        const synonyms: { [key: string]: string } = {
            // Oils
            'olio evo': 'olio extravergine d\'oliva',
            'olio d\'oliva': 'olio extravergine d\'oliva',
            'olio oliva': 'olio extravergine d\'oliva',
            'olio': 'olio extravergine d\'oliva',

            // Dairy
            'parmigiano': 'parmigiano reggiano',
            'grana': 'grana padano',
            'formaggio grana': 'grana padano',
            'yogurt bianco': 'yogurt',
            'yogurt greco magro': 'yogurt greco',
            'latte parzialmente scremato': 'latte',
            'latte scremato': 'latte',
            'latte intero': 'latte',

            // Meat
            'pollo': 'pollo', // identity
            'tacchino': 'tacchino',
            'manzo': 'manzo',
            'vitello': 'vitello',
            'suino': 'maiale',
            'maiale': 'maiale',
            'prosciutto crudo dolce': 'prosciutto crudo',
            'prosciutto cotto sgrassato': 'prosciutto cotto',

            // Fish
            'merluzzo': 'merluzzo',
            'nasello': 'merluzzo', // often assimilated
            'platessa': 'platessa',
            'orata': 'orata',
            'spigola': 'spigola',
            'branzino': 'spigola',
            'salmone': 'salmone',
            'tonno naturale': 'tonno in scatola',
            'tonno olio': 'tonno in scatola',
            'tonno': 'tonno in scatola', // Default assumptions

            // Grains/Carbs
            'riso basmati': 'riso',
            'riso venere': 'riso',
            'riso parboiled': 'riso',
            'spaghetti': 'pasta',
            'penne': 'pasta',
            'fusilli': 'pasta',
            'rigatoni': 'pasta',
            'farfalle': 'pasta',
            'pane comune': 'pane',
            'pane tostato': 'pane',
            'fette biscottate integrali': 'fette biscottate',

            // Veggies (Singularization)
            'carote': 'carota',
            'zucchine': 'zucchina',
            'melanzane': 'melanzana',
            'peperoni': 'peperone',
            'pomodori': 'pomodoro',
            'patate': 'patata',
            'cipolle': 'cipolla',
            'spinaci': 'spinaci', // usually plural
            'bietole': 'bietole',
            'broccoli': 'broccoli',
            'cavolfiori': 'cavolfiore',
            'finocchi': 'finocchio',
            'cetrioli': 'cetriolo',
            'fagiolini': 'fagiolini',
            'lattuga': 'insalata',
            'insalata mista': 'insalata',
            'rucola': 'rucola',

            // Fruits
            'mele': 'mela',
            'pere': 'pera',
            'banane': 'banana',
            'arance': 'arancia',
            'mandarini': 'mandarino',
            'kiwi': 'kiwi',
            'fragole': 'fragole',
            'mirtilli': 'mirtilli',

            // Other
            'uova medie': 'uova',
            'uova grandi': 'uova',
            'uovo': 'uova', // Singular to plural
            'albume d\'uovo': 'albume',
            'albumi': 'albume',
            'noci sgusciate': 'noci',
            'mandorle pelate': 'mandorle',
        };

        // 6. Check Exact Match Synonyms first
        if (synonyms[normalized]) return synonyms[normalized];

        // 7. Check Partial Match Synonyms (Iterate)
        // Check if any key is contained in normalized string (e.g. "pasta integrale" contains "pasta" key? No, "pasta" is value)
        // We look for keys IN the normalized string
        for (const [key, value] of Object.entries(synonyms)) {
            // Word boundary check to avoid "riso" matching "risotto" incorrectly if we only want exact word mapping
            const regex = new RegExp(`\\b${key}\\b`);
            if (regex.test(normalized)) {
                return value;
            }
        }

        return normalized;
    }
};
