export interface Meal {
    type: 'Colazione' | 'Spuntino' | 'Pranzo' | 'Merenda' | 'Cena';
    name: string;
    description: string;
    ingredients: string[];
    calories: number;
    macros: {
        protein: number;
        carbs: number;
        fats: number;
    };
}

export interface DayPlan {
    day: number;
    meals: Meal[];
}

export interface DietPlan {
    days: DayPlan[];
    updatedAt?: string;
}
