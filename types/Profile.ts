export interface UserProfile {
    name: string;
    age: string;
    gender: 'M' | 'F' | 'Other' | '';
    height: string;
    weight: string;
    waistCircumference: string;
    conditions: string[];
    otherCondition: string;
    physicalDescription: string;
    symptoms: string[];
    medications: boolean;
    medicationsList: string;
    habits: string[];
    smoke: 'no' | 'yes';
    alcohol: 'no' | 'occasional' | 'frequent';
    coffee: 'no' | '1-2' | '3+';
    sleep: 'good' | 'average' | 'poor' | 'insomnia';
    stress: 'low' | 'moderate' | 'high' | 'extreme';
    dailyDiet: string;
    supplements: string[];
    otherSupplement: string;
    profilePicture?: string;
    activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extreme';
    mealsPerDay: string;
    snacksPerDay: string;
    dietType: string;
    dietaryRestrictions: string[];
    otherDietaryRestriction: string;
}

export const initialUserProfile: UserProfile = {
    name: '',
    age: '',
    gender: 'M',
    height: '',
    weight: '',
    waistCircumference: '',
    conditions: [],
    otherCondition: '',
    physicalDescription: 'average',
    symptoms: [],
    medications: false,
    medicationsList: '',
    habits: [],
    smoke: 'no',
    alcohol: 'no',
    coffee: 'no',
    sleep: 'good',
    stress: 'low',
    dailyDiet: '',
    supplements: [],
    otherSupplement: '',
    profilePicture: '',
    activityLevel: 'sedentary',
    mealsPerDay: '3',
    snacksPerDay: '1',
    dietType: 'omnivore',
    dietaryRestrictions: [],
    otherDietaryRestriction: '',
};
