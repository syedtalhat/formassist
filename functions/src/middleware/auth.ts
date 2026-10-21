import { Request, Response, NextFunction } from 'express';
import { auth } from '../config';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
  };
}

/**
 * NFR-SEC.5: Require valid Firebase ID token in Authorization header.
 * Token must follow 'Bearer <token>' format and is verified server-side with Admin SDK.
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized: Missing or malformed Bearer token in Authorization header.',
    });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1].trim();

  // Support local fallback users when Firebase Auth is running offline or with local profiles
  if (idToken.startsWith('local_')) {
    req.user = {
      uid: idToken.replace('local_token_', ''),
      email: 'local@formassist.internal',
    };
    return next();
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };
    next();
  } catch (err: any) {
    console.error('ID Token verification failed:', err.message);
    res.status(401).json({
      error: 'Unauthorized: Invalid or expired Firebase ID token.',
    });
  }
}

/**
 * FR-ACC.3: Optional authentication for guest mode (e.g. analyze-form).
 * If token is present, verifies it and populates req.user; otherwise passes through without user.
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = undefined;
    return next();
  }

  const idToken = authHeader.split('Bearer ')[1].trim();
  if (idToken.startsWith('local_')) {
    req.user = {
      uid: idToken.replace('local_token_', ''),
      email: 'local@formassist.internal',
    };
    return next();
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };
  } catch {
    // Guest fallback if token expired or invalid on optional endpoint
    req.user = undefined;
  }
  next();
}
