import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword as firebaseSignIn,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth 상태 변경:', firebaseUser ? '로그인됨' : '로그아웃됨');
      
      if (firebaseUser) {
        console.log('Firebase 사용자 UID:', firebaseUser.uid);
        console.log('Firebase 사용자 이메일:', firebaseUser.email);
        
        try {
          // Firestore에서 사용자 정보 가져오기
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          console.log('Firestore 문서 존재 여부:', userDoc.exists());
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const user: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: userData.displayName,
              photoURL: userData.photoURL,
              createdAt: userData.createdAt.toDate(),
            };
            setUser(user);
            console.log('사용자 정보 설정:', user);
          } else {
            console.log('Firestore에서 사용자 정보를 찾을 수 없음');
            // 기본 사용자 정보로 설정
            const defaultUser: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '사용자',
              photoURL: firebaseUser.photoURL || null,
              createdAt: new Date(),
            };
            setUser(defaultUser);
          }
        } catch (error) {
          console.error('사용자 정보 가져오기 오류:', error);
          // 기본 사용자 정보로 설정
          const defaultUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '사용자',
            photoURL: firebaseUser.photoURL || null,
            createdAt: new Date(),
          };
          setUser(defaultUser);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      console.log('Firebase Auth 사용자 생성 성공:', firebaseUser.uid);

      // Firebase Auth 프로필 업데이트
      await updateProfile(firebaseUser, { displayName });
      console.log('프로필 업데이트 성공');

      // Firestore에 사용자 정보 저장
      const userData: Omit<User, 'uid'> = {
        email,
        displayName,
        photoURL: null,
        createdAt: new Date(),
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      console.log('Firestore 사용자 정보 저장 성공');
      
    } catch (error: any) {
      console.error('회원가입 오류 상세:', {
        code: error.code,
        message: error.message,
        fullError: error
      });
      
      // 더 구체적인 오류 메시지
      let errorMessage = '회원가입에 실패했습니다.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = '이미 사용 중인 이메일입니다.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = '비밀번호가 너무 약합니다.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '유효하지 않은 이메일 형식입니다.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = '이메일/비밀번호 로그인이 활성화되지 않았습니다.';
      }
      
      throw new Error(errorMessage);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('로그인 시작:', { email });
      const userCredential = await firebaseSignIn(auth, email, password);
      console.log('로그인 성공:', userCredential.user.uid);
      
      // 로그인 성공 후 사용자 정보를 즉시 설정
      const firebaseUser = userCredential.user;
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const user: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          createdAt: userData.createdAt.toDate(),
        };
        setUser(user);
        console.log('로그인 후 사용자 정보 설정 완료');
      } else {
        // 기본 사용자 정보로 설정
        const defaultUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '사용자',
          photoURL: firebaseUser.photoURL || null,
          createdAt: new Date(),
        };
        setUser(defaultUser);
        console.log('로그인 후 기본 사용자 정보 설정 완료');
      }
    } catch (error: any) {
      console.error('로그인 오류:', error);
      throw error;
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
