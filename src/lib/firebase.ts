import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
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
  where
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { FamilyAccount, ChildProfile } from '../types';

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
  } catch (err) {
    console.error('Error fetching family from cloud by code:', err);
    return null;
  }
};

export const syncChildDataByCodeToCloud = async (familyCode: string, childId: string, appState: any): Promise<boolean> => {
  try {
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
    const cleanCode = familyCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!cleanCode || !childId) return null;

    const dataRef = doc(db, 'families_by_code', cleanCode, 'children_data', childId);
    const snap = await getDoc(dataRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err) {
    console.error('Error fetching child data by code from cloud:', err);
    return null;
  }
};

