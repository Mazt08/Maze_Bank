// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBEifKNxldIvXX9hLbsTxXeKzUCv3FGyj0",
  authDomain: "maze-bank-4e8da.firebaseapp.com",
  projectId: "maze-bank-4e8da",
  storageBucket: "maze-bank-4e8da.firebasestorage.app",
  messagingSenderId: "269045422310",
  appId: "1:269045422310:web:97c464e8eb7d9250ebc327",
  measurementId: "G-HJL74MZJSJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);