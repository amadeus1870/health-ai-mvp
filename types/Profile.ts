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
    smoke: 'No' | 'Sì';
    alcohol: 'No' | 'Occasionale' | 'Frequente';
    coffee: 'No' | '1-2' | '3+';
    sleep: 'Buono' | 'Medio' | 'Scarso' | 'Insonnia';
    stress: 'Basso' | 'Moderato' | 'Alto' | 'Estremo';
    dailyDiet: string;
    supplements: string[];
    otherSupplement: string;
    profilePicture?: string;
    activityLevel: 'Sedentario' | 'Leggermente attivo' | 'Moderatamente attivo' | 'Molto attivo' | 'Estremo';
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
    physicalDescription: 'Forma Media (Pancia piatta o quasi, aspetto sano)',
    symptoms: [],
    medications: false,
    medicationsList: '',
    habits: [],
    smoke: 'No',
    alcohol: 'No',
    coffee: 'No',
    sleep: 'Buono',
    stress: 'Basso',
    dailyDiet: '',
    supplements: [],
    otherSupplement: '',
    profilePicture: '',
    activityLevel: 'Sedentario',
    mealsPerDay: '3',
    snacksPerDay: '1',
    dietType: 'Onnivora',
    dietaryRestrictions: [],
    otherDietaryRestriction: '',
};
