import { db } from '../config/firebaseConfig';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { UserProfile, initialUserProfile } from '../types/Profile';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_ID = 'current_user'; // For MVP without Auth
const PROFILE_COLLECTION = 'profiles';

export const ProfileService = {
    saveProfile: async (profile: UserProfile): Promise<void> => {
        try {
            const docRef = doc(db, PROFILE_COLLECTION, USER_ID);
            await setDoc(docRef, profile);
            await AsyncStorage.setItem('hasProfile', 'true');
        } catch (e) {
            console.error('Failed to save profile to Firestore', e);
            throw e;
        }
    },

    getProfile: async (): Promise<UserProfile> => {
        try {
            const docRef = doc(db, PROFILE_COLLECTION, USER_ID);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                await AsyncStorage.setItem('hasProfile', 'true'); // Sync local state
                return { ...initialUserProfile, ...docSnap.data() } as UserProfile;
            } else {
                return initialUserProfile;
            }
        } catch (e: any) {
            if (e?.code === 'unavailable' || e?.message?.includes('offline')) {
                console.log('Firestore offline: returning initial profile.');
            } else {
                console.error('Failed to fetch profile from Firestore', e);
            }
            return initialUserProfile;
        }
    },

    hasProfileLocal: async (): Promise<boolean> => {
        try {
            const value = await AsyncStorage.getItem('hasProfile');
            return value === 'true';
        } catch (e) {
            return false;
        }
    },

    clearProfile: async (): Promise<void> => {
        try {
            const docRef = doc(db, PROFILE_COLLECTION, USER_ID);
            await deleteDoc(docRef);
            await AsyncStorage.removeItem('hasProfile');
        } catch (e) {
            console.error('Failed to clear profile from Firestore', e);
            throw e;
        }
    },

    saveDietPlan: async (dietPlan: any): Promise<void> => {
        try {
            const docRef = doc(db, 'diet_plans', USER_ID);
            await setDoc(docRef, { plan: dietPlan, updatedAt: new Date().toISOString() });
        } catch (e) {
            console.error('Failed to save diet plan', e);
            throw e;
        }
    },

    getDietPlan: async (): Promise<any | null> => {
        try {
            const docRef = doc(db, 'diet_plans', USER_ID);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                // Return plan with updatedAt attached
                return { ...data.plan, updatedAt: data.updatedAt };
            }
            return null;
        } catch (e) {
            console.error('Failed to fetch diet plan', e);
            return null;
        }
    },

    clearDietPlan: async (): Promise<void> => {
        try {
            const docRef = doc(db, 'diet_plans', USER_ID);
            await deleteDoc(docRef);
        } catch (e) {
            console.error('Failed to clear diet plan', e);
            throw e;
        }
    }
};
