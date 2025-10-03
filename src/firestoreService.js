import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Firestore Service
 * Handles all database operations for budget data
 */

/**
 * Saves monthly budgets to Firestore
 * @param {string} userId - The user's unique ID
 * @param {object} monthlyBudgets - The budget data to save
 */
export const saveMonthlyBudgets = async (userId, monthlyBudgets) => {
  try {
    const userDocRef = doc(db, 'users', userId, 'budgets', 'data');
    await setDoc(userDocRef, {
      monthlyBudgets: monthlyBudgets,
      updatedAt: new Date().toISOString()
    });
    console.log('✅ Data saved to Firestore');
  } catch (error) {
    console.error('❌ Error saving to Firestore:', error);
    throw error;
  }
};

/**
 * Loads monthly budgets from Firestore
 * @param {string} userId - The user's unique ID
 * @returns {object} The user's budget data
 */
export const loadMonthlyBudgets = async (userId) => {
  try {
    const userDocRef = doc(db, 'users', userId, 'budgets', 'data');
    const docSnap = await getDoc(userDocRef);
    
    if (docSnap.exists()) {
      console.log('✅ Data loaded from Firestore');
      return docSnap.data().monthlyBudgets || {};
    } else {
      console.log('📝 No data found, starting fresh');
      return {};
    }
  } catch (error) {
    console.error('❌ Error loading from Firestore:', error);
    throw error;
  }
};

/**
 * Migrates data from localStorage to Firestore
 * @param {string} userId - The user's unique ID
 */
export const migrateLocalStorageToFirestore = async (userId) => {
  try {
    const localData = localStorage.getItem('monthlyBudgets');
    
    if (localData) {
      const parsedData = JSON.parse(localData);
      await saveMonthlyBudgets(userId, parsedData);
      console.log('✅ Migrated localStorage to Firestore');
      
      // Clear localStorage after successful migration
      localStorage.removeItem('monthlyBudgets');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Error migrating data:', error);
    return false;
  }
};