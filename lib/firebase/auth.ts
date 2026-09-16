'use client';

/**
 * Firebase Auth stubs for proponent (admin) access.
 * TODO: wire to Firebase Auth once credentials and session handling exist.
 */

export async function loginAdmin(email: string, password: string): Promise<void> {
  // TODO: signInWithEmailAndPassword via getAuth(getFirebaseApp())
  void email;
  void password;
}

export async function signupAdmin(
  name: string,
  email: string,
  password: string,
  accessCode: string,
): Promise<void> {
  // TODO: validate access code, then createUserWithEmailAndPassword
  void name;
  void email;
  void password;
  void accessCode;
}

export async function logoutAdmin(): Promise<void> {
  // TODO: signOut(getAuth())
}

export async function getCurrentAdmin(): Promise<{ email: string } | null> {
  // TODO: read auth.currentUser / onAuthStateChanged
  return null;
}
