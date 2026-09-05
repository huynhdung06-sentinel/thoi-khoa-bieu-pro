import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  signInAnonymously
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  deleteDoc, 
  serverTimestamp, 
  updateDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { FamilyAccount, ChildProfile, SubAccountToken } from '../types';

const app = initializeApp(firebaseConfig);
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export const getFamilyData = async (userId: string): Promise<FamilyAccount | null> => {
  try {
    const familyRef = doc(db, 'families', userId);
    const familySnap = await getDoc(familyRef);
    if (!familySnap.exists()) return null;

    const data = familySnap.data();
    
    // Fetch children
    const childrenRef = collection(db, 'families', userId, 'children');
    const childrenSnap = await getDocs(childrenRef);
    const children: ChildProfile[] = [];
    childrenSnap.forEach(childDoc => {
      const childData = childDoc.data();
      children.push({
        id: childDoc.id,
        name: childData.name,
        grade: childData.grade,
        className: childData.className,
        avatar: childData.avatar,
        studentCode: childData.studentCode || '',
      });
    });

    return {
      parentName: data.parentName,
      parentPin: data.parentPin,
      parentEmail: data.parentEmail || '',
      children: children,
    };
  } catch (error) {
    console.error("Error getting family data:", error);
    return null;
  }
};

export const createFamilyAccount = async (userId: string, data: { parentName: string; parentPin: string; parentEmail?: string }) => {
  const familyRef = doc(db, 'families', userId);
  await setDoc(familyRef, {
    parentName: data.parentName,
    parentPin: data.parentPin,
    parentEmail: (data.parentEmail || '').toLowerCase().trim(),
    ownerId: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

export const createChildProfile = async (userId: string, child: Omit<ChildProfile, 'id'>): Promise<ChildProfile> => {
  const childRef = doc(collection(db, 'families', userId, 'children'));
  await setDoc(childRef, {
    name: child.name,
    grade: child.grade,
    className: child.className || '',
    avatar: child.avatar || '',
    studentCode: (child.studentCode || '').trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { ...child, id: childRef.id };
};

export const updateChildProfile = async (userId: string, child: ChildProfile) => {
  const childRef = doc(db, 'families', userId, 'children', child.id);
  await updateDoc(childRef, {
    name: child.name,
    grade: child.grade,
    className: child.className || '',
    avatar: child.avatar || '',
    studentCode: (child.studentCode || '').trim(),
    updatedAt: serverTimestamp(),
  });
};

// Tìm và xác thực học sinh bằng Email cha mẹ + Mã riêng của con
export const loginAsStudentWithParentEmail = async (parentEmail: string, studentCode: string): Promise<{
  parentUserId: string;
  familyData: FamilyAccount;
  childProfile: ChildProfile;
} | null> => {
  try {
    const cleanEmail = parentEmail.toLowerCase().trim();
    const cleanCode = studentCode.trim().toUpperCase();

    // Query family by parentEmail
    const familiesRef = collection(db, 'families');
    const q = query(familiesRef, where('parentEmail', '==', cleanEmail));
    const snap = await getDocs(q);

    if (snap.empty) {
      return null;
    }

    const familyDoc = snap.docs[0];
    const parentUserId = familyDoc.id;
    const familyData = familyDoc.data();

    // Get children of this family
    const childrenRef = collection(db, 'families', parentUserId, 'children');
    const childrenSnap = await getDocs(childrenRef);

    const childrenList: ChildProfile[] = [];
    let matchedChild: ChildProfile | null = null;

    childrenSnap.forEach(docSnap => {
      const c = docSnap.data();
      const childObj: ChildProfile = {
        id: docSnap.id,
        name: c.name,
        grade: c.grade,
        className: c.className,
        avatar: c.avatar,
        studentCode: c.studentCode || '',
      };
      childrenList.push(childObj);

      // Check match (so sánh không phân biệt hoa thường)
      if (childObj.studentCode && childObj.studentCode.trim().toUpperCase() === cleanCode) {
        matchedChild = childObj;
      }
    });

    if (!matchedChild) {
      return null;
    }

    return {
      parentUserId,
      familyData: {
        parentName: familyData.parentName,
        parentPin: familyData.parentPin,
        parentEmail: familyData.parentEmail,
        children: childrenList,
      },
      childProfile: matchedChild
    };
  } catch (err) {
    console.error('Error logging in as student:', err);
    return null;
  }
};

export const deleteChildProfile = async (userId: string, childId: string) => {
  const childRef = doc(db, 'families', userId, 'children', childId);
  await deleteDoc(childRef);
};

const removeUndefined = (obj: any): any => {
  if (obj === undefined) return null;
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  } else if (obj !== null && typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      if (obj[key] !== undefined) {
        newObj[key] = removeUndefined(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
};

export const saveChildData = async (userId: string, childId: string, appState: any) => {
  const dataRef = doc(db, 'families', userId, 'children', childId, 'data', 'appState');
  
  const cleanState = removeUndefined(appState);

  await setDoc(dataRef, {
    ...cleanState,
    updatedAt: serverTimestamp(),
  });
};

export const getChildData = async (userId: string, childId: string) => {
  const dataRef = doc(db, 'families', userId, 'children', childId, 'data', 'appState');
  const snap = await getDoc(dataRef);
  if (snap.exists()) {
    return snap.data();
  }
  return null;
};

// ----------------- CLOUD SYNC BY FAMILY CODE (Cross-device instant sync) -----------------

export const syncFamilyByCodeToCloud = async (family: FamilyAccount): Promise<boolean> => {
  try {
    const rawCode = family.familyCode || '';
    const cleanCode = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!cleanCode || cleanCode.length < 4) return false;

    const famRef = doc(db, 'families_by_code', cleanCode);
    const cleanPayload = removeUndefined({
      familyCode: cleanCode,
      parentName: (family.parentName || 'Phụ Huynh').trim(),
      parentPin: (family.parentPin || '1234').trim(),
      parentEmail: (family.parentEmail || '').toLowerCase().trim(),
      securityQuestion: family.securityQuestion || '',
      securityAnswer: (family.securityAnswer || '').trim(),
      children: Array.isArray(family.children) ? family.children.map(c => ({
        id: c.id,
        name: c.name,
        grade: c.grade || '',
        className: c.className || '',
        avatar: c.avatar || '👦',
        studentCode: c.studentCode || '',
      })) : [],
      updatedAt: serverTimestamp(),
    });

    await setDoc(famRef, cleanPayload, { merge: true });
    return true;
  } catch (err) {
    console.error('Error syncing family to cloud by code:', err);
    return false;
  }
};

export const fetchFamilyByCodeFromCloud = async (familyCode: string): Promise<FamilyAccount | null> => {
  try {
    if (!navigator.onLine) return null;

    const cleanCode = familyCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!cleanCode || cleanCode.length < 4) return null;

    const famRef = doc(db, 'families_by_code', cleanCode);
    const snap = await getDoc(famRef);
    if (!snap.exists()) return null;

    const data = snap.data();
    return {
      familyCode: data.familyCode || cleanCode,
      parentName: data.parentName || 'Phụ Huynh',
      parentPin: data.parentPin || '',
      parentEmail: data.parentEmail || '',
      securityQuestion: data.securityQuestion || '',
      securityAnswer: data.securityAnswer || '',
      children: Array.isArray(data.children) ? data.children : [],
    };
  } catch (err: any) {
    if (err?.message?.includes('offline')) {
      console.warn('Network offline, could not fetch family from cloud.');
    } else {
      console.error('Error fetching family from cloud by code:', err);
    }
    return null;
  }
};

export const syncChildDataByCodeToCloud = async (familyCode: string, childId: string, appState: any): Promise<boolean> => {
  try {
    if (!navigator.onLine) return false;

    const cleanCode = familyCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!cleanCode || !childId) return false;

    const dataRef = doc(db, 'families_by_code', cleanCode, 'children_data', childId);
    const cleanState = removeUndefined(appState);
    await setDoc(dataRef, {
      ...cleanState,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('Error syncing child data by code to cloud:', err);
    return false;
  }
};

export const fetchChildDataByCodeFromCloud = async (familyCode: string, childId: string): Promise<any | null> => {
  try {
    if (!navigator.onLine) return null;

    const cleanCode = familyCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!cleanCode || !childId) return null;

    const dataRef = doc(db, 'families_by_code', cleanCode, 'children_data', childId);
    const snap = await getDoc(dataRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err: any) {
    if (err?.message?.includes('offline')) {
      console.warn('Network offline, could not fetch child data from cloud.');
    } else {
      console.error('Error fetching child data by code from cloud:', err);
    }
    return null;
  }
};

// =========================================================================
// 🚀 ARCHITECTURE: SUB-ACCOUNT (CHA - CON) OFFLINE-FIRST & REALTIME SYNC
// =========================================================================

/**
 * 0ms Client-side Sub-Account Token generator
 */
export const generateSubId = (parentId: string, childSuffix?: string): string => {
  const cleanParent = (parentId || 'FAM').replace(/[^A-Za-z0-9]/g, '').slice(-4).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  const namePart = childSuffix ? childSuffix.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase() : 'CON';
  return `CON_${cleanParent}_${namePart}_${rand}`;
};

/**
 * Encode SubAccountToken into a lightweight URL-safe Base64 string
 */
export const encodeSubAccountToken = (token: SubAccountToken): string => {
  try {
    const jsonStr = JSON.stringify(token);
    return btoa(unescape(encodeURIComponent(jsonStr)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch (err) {
    console.error('Error encoding token:', err);
    return '';
  }
};

/**
 * Decode lightweight URL-safe Base64 string back into SubAccountToken
 */
export const decodeSubAccountToken = (tokenStr: string): SubAccountToken | null => {
  try {
    if (!tokenStr || typeof tokenStr !== 'string') return null;
    let base64 = tokenStr.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const jsonStr = decodeURIComponent(escape(atob(base64)));
    const parsed = JSON.parse(jsonStr);
    if (parsed && parsed.subId && parsed.role === 'sub_account') {
      return parsed as SubAccountToken;
    }
    return null;
  } catch (err) {
    // Fallback: try raw JSON parse in case it was passed unencoded
    try {
      const directParsed = JSON.parse(tokenStr);
      if (directParsed && directParsed.subId) return directParsed;
    } catch {}
    console.warn('Could not decode token string:', err);
    return null;
  }
};

/**
 * Firebase Anonymous Auth for instantaneous, zero-delay sub-account sessions
 */
export const signInAnonymouslyUser = async () => {
  try {
    if (auth.currentUser) return auth.currentUser;
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (err) {
    console.warn('Anonymous auth offline/fallback:', err);
    return null;
  }
};

/**
 * Background creation of sub_accounts doc (runs non-blocking 0ms)
 */
export const initSubAccountDoc = async (data: {
  parentId: string;
  subId: string;
  childProfile: Partial<ChildProfile>;
  initialAppState?: any;
}) => {
  try {
    const subRef = doc(db, 'sub_accounts', data.subId);
    const payload = removeUndefined({
      subId: data.subId,
      parentId: data.parentId,
      role: 'sub_account',
      childProfile: data.childProfile,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(subRef, payload, { merge: true });

    if (data.initialAppState) {
      const dataRef = doc(db, 'sub_accounts', data.subId, 'data', 'current');
      const cleanState = removeUndefined(data.initialAppState);
      await setDoc(dataRef, {
        ...cleanState,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
  } catch (err) {
    console.error('Background initSubAccountDoc error:', err);
  }
};

/**
 * 2-way Realtime Stream: Subscribe to sub_accounts/{subId}/data/current via onSnapshot
 */
export const subscribeSubAccountData = (
  subId: string, 
  onData: (data: any) => void,
  onError?: (err: any) => void
): Unsubscribe => {
  const dataRef = doc(db, 'sub_accounts', subId, 'data', 'current');
  return onSnapshot(
    dataRef, 
    (snap) => {
      if (snap.exists()) {
        onData(snap.data());
      } else {
        onData(null);
      }
    },
    (err) => {
      console.warn(`[Realtime Sync] Snapshot error for ${subId}:`, err);
      if (onError) onError(err);
    }
  );
};

/**
 * Save state directly to sub_accounts/{subId}/data/current
 */
export const saveSubAccountData = async (subId: string, appState: any): Promise<boolean> => {
  try {
    if (!subId) return false;
    const cleanState = removeUndefined(appState);
    const dataRef = doc(db, 'sub_accounts', subId, 'data', 'current');
    await setDoc(dataRef, {
      ...cleanState,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('Error saving sub account data:', err);
    return false;
  }
};

/**
 * Fetch sub_accounts document definition
 */
export const fetchSubAccountDoc = async (subId: string): Promise<any | null> => {
  try {
    const subRef = doc(db, 'sub_accounts', subId);
    const snap = await getDoc(subRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err) {
    console.error('Error fetching sub account doc:', err);
    return null;
  }
};


