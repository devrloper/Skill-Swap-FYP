// Firestore helper functions for CRUD operations
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';
import { User, Connection, Session, Interview } from './types';

// User operations
export const createUser = async (userId: string, userData: Partial<User>) => {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    ...userData,
    createdAt: Date.now(),
  });
};

export const getUser = async (userId: string): Promise<User | null> => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return { id: userSnap.id, ...userSnap.data() } as User;
  }
  return null;
};

export const updateUser = async (userId: string, userData: Partial<User>) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, userData as any);
};

export const getAllUsers = async (): Promise<User[]> => {
  const usersRef = collection(db, 'users');
  const querySnapshot = await getDocs(usersRef);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
};

// Connection operations
export const createConnection = async (
  userId1: string,
  userId2: string,
  requestedBy: string
): Promise<string> => {
  const connectionRef = doc(collection(db, 'connections'));
  await setDoc(connectionRef, {
    users: [userId1, userId2],
    status: 'pending',
    requestedBy,
    createdAt: Date.now(),
  });
  return connectionRef.id;
};

export const getConnection = async (connectionId: string): Promise<Connection | null> => {
  const connectionRef = doc(db, 'connections', connectionId);
  const connectionSnap = await getDoc(connectionRef);
  if (connectionSnap.exists()) {
    return { id: connectionSnap.id, ...connectionSnap.data() } as Connection;
  }
  return null;
};

export const updateConnection = async (connectionId: string, data: Partial<Connection>) => {
  const connectionRef = doc(db, 'connections', connectionId);
  await updateDoc(connectionRef, data as any);
};

export const getUserConnections = async (userId: string): Promise<Connection[]> => {
  const connectionsRef = collection(db, 'connections');
  const q = query(connectionsRef, where('users', 'array-contains', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Connection));
};

// Session operations
export const createSession = async (sessionData: Omit<Session, 'id' | 'createdAt'>): Promise<string> => {
  const sessionRef = doc(collection(db, 'sessions'));
  await setDoc(sessionRef, {
    ...sessionData,
    createdAt: Date.now(),
  });
  return sessionRef.id;
};

export const getSession = async (sessionId: string): Promise<Session | null> => {
  const sessionRef = doc(db, 'sessions', sessionId);
  const sessionSnap = await getDoc(sessionRef);
  if (sessionSnap.exists()) {
    return { id: sessionSnap.id, ...sessionSnap.data() } as Session;
  }
  return null;
};

export const getUserSessions = async (userId: string): Promise<Session[]> => {
  const sessionsRef = collection(db, 'sessions');
  const q = query(
    sessionsRef,
    where('participants', 'array-contains', userId),
    orderBy('dateTime', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session));
};

export const updateSession = async (sessionId: string, data: Partial<Session>) => {
  const sessionRef = doc(db, 'sessions', sessionId);
  await updateDoc(sessionRef, data as any);
};

// Interview operations
export const saveInterview = async (userId: string, interviewData: Omit<Interview, 'id' | 'userId'>): Promise<string> => {
  const interviewRef = doc(db, 'interviews', userId);
  await setDoc(interviewRef, {
    userId,
    ...interviewData,
  });
  return interviewRef.id;
};

export const getInterview = async (userId: string): Promise<Interview | null> => {
  const interviewRef = doc(db, 'interviews', userId);
  const interviewSnap = await getDoc(interviewRef);
  if (interviewSnap.exists()) {
    return { id: interviewSnap.id, ...interviewSnap.data() } as Interview;
  }
  return null;
};
