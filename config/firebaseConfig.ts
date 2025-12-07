import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace with your Health AI Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyDpz7kRhh3SEaxQa_fAaRIXe9IZRYKngVM",
    authDomain: "myproactivelab.firebaseapp.com",
    projectId: "myproactivelab",
    storageBucket: "myproactivelab.firebasestorage.app",
    messagingSenderId: "827250364792",
    appId: "1:827250364792:web:4b3ccdf96a332c05f0b88d",
    measurementId: "G-P4ZTPRDTPP"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
