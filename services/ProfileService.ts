import { UserProfile, initialUserProfile } from '../types/Profile';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEY = 'user_profile_v1';
const DIET_PLAN_KEY = 'user_diet_plan_v1';

export const ProfileService = {
    saveProfile: async (profile: UserProfile): Promise<void> => {
        try {
            await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
        } catch (e) {
            console.error('Failed to save profile locally', e);
            throw e;
        }
    },

    getProfile: async (): Promise<UserProfile> => {
        try {
            const jsonValue = await AsyncStorage.getItem(PROFILE_KEY);
            if (jsonValue != null) {
                return { ...initialUserProfile, ...JSON.parse(jsonValue) };
            } else {
                return initialUserProfile;
            }
        } catch (e) {
            console.error('Failed to fetch profile locally', e);
            return initialUserProfile;
        }
    },

    hasProfileLocal: async (): Promise<boolean> => {
        try {
            const value = await AsyncStorage.getItem(PROFILE_KEY);
            return value !== null;
        } catch (e) {
            return false;
        }
    },

    clearProfile: async (): Promise<void> => {
        try {
            await AsyncStorage.removeItem(PROFILE_KEY);
        } catch (e) {
            console.error('Failed to clear profile locally', e);
            throw e;
        }
    },

    saveDietPlan: async (dietPlan: any): Promise<void> => {
        try {
            const data = { plan: dietPlan, updatedAt: new Date().toISOString() };
            await AsyncStorage.setItem(DIET_PLAN_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save diet plan locally', e);
            throw e;
        }
    },

    getDietPlan: async (): Promise<any | null> => {
        try {
            const jsonValue = await AsyncStorage.getItem(DIET_PLAN_KEY);
            if (jsonValue != null) {
                const data = JSON.parse(jsonValue);
                // Return plan with updatedAt attached
                return { ...data.plan, updatedAt: data.updatedAt };
            }
            return null;
        } catch (e) {
            console.error('Failed to fetch diet plan locally', e);
            return null;
        }
    },

    clearDietPlan: async (): Promise<void> => {
        try {
            await AsyncStorage.removeItem(DIET_PLAN_KEY);
        } catch (e) {
            console.error('Failed to clear diet plan locally', e);
            throw e;
        }
    }
};
