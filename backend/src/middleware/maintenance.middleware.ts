import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Maintenance mode configuration
const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === 'true';
const MAINTENANCE_PASSWORD = process.env.MAINTENANCE_PASSWORD;

// Token storage (in production, use Redis or database)
const activeTokens = new Set<string>();
const TOKEN_EXPIRY = 30 * 60 * 1000; // 30 minutes
const FAILED_ATTEMPTS = new Map<string, { count: number; lastAttempt: number }>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

interface MaintenanceRequest extends Request {
  isMaintenanceAdmin?: boolean;
}

/**
 * Check if maintenance mode is enabled
 */
export function isMaintenanceEnabled(): boolean {
  return MAINTENANCE_MODE;
}

/**
 * Verify maintenance password (constant-time comparison to prevent timing attacks)
 */
export function verifyPassword(password: string): boolean {
  if (!MAINTENANCE_PASSWORD) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(MAINTENANCE_PASSWORD);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Generate maintenance token
 */
export function generateToken(): string {
  const token = crypto.randomBytes(32).toString('base64url');
  activeTokens.add(token);
  
  // Auto-remove after expiry
  setTimeout(() => {
    activeTokens.delete(token);
  }, TOKEN_EXPIRY);
  
  return token;
}

/**
 * Verify maintenance token
 */
export function verifyToken(token: string): boolean {
  return activeTokens.has(token);
}

/**
 * Check if IP is locked out
 */
export function isLockedOut(ip: string): boolean {
  const attempt = FAILED_ATTEMPTS.get(ip);
  if (!attempt) return false;
  
  const timeSinceLastAttempt = Date.now() - attempt.lastAttempt;
  return attempt.count >= MAX_FAILED_ATTEMPTS && timeSinceLastAttempt < LOCKOUT_TIME;
}

/**
 * Record failed attempt
 */
export function recordFailedAttempt(ip: string): void {
  const attempt = FAILED_ATTEMPTS.get(ip) || { count: 0, lastAttempt: 0 };
  attempt.count++;
  attempt.lastAttempt = Date.now();
  FAILED_ATTEMPTS.set(ip, attempt);
  
  // Reset after lockout time
  setTimeout(() => {
    const current = FAILED_ATTEMPTS.get(ip);
    if (current && Date.now() - current.lastAttempt >= LOCKOUT_TIME) {
      FAILED_ATTEMPTS.delete(ip);
    }
  }, LOCKOUT_TIME);
}

/**
 * Clear failed attempts for IP
 */
export function clearFailedAttempts(ip: string): void {
  FAILED_ATTEMPTS.delete(ip);
}

/**
 * Maintenance authentication middleware
 */
export function requireMaintenanceAuth(req: MaintenanceRequest, res: Response, next: NextFunction): void {
  const token = req.headers['x-maintenance-token'] as string;
  
  if (!token || !verifyToken(token)) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid or missing maintenance token'
    });
    return;
  }
  
  req.isMaintenanceAdmin = true;
  next();
}

/**
 * Login endpoint handler
 */
export async function handleMaintenanceLogin(req: Request, res: Response): Promise<void> {
  if (!isMaintenanceEnabled()) {
    res.status(404).json({ success: false, error: 'Maintenance mode is disabled' });
    return;
  }

  if (!MAINTENANCE_PASSWORD) {
    console.error('Maintenance login rejected: MAINTENANCE_PASSWORD is not configured');
    res.status(503).json({ success: false, error: 'Maintenance authentication is unavailable' });
    return;
  }

  const { password } = req.body;
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  
  // Check if IP is locked out
  if (isLockedOut(ip)) {
    res.status(429).json({
      success: false,
      error: 'Too many failed attempts. Please try again later.',
      lockoutRemaining: LOCKOUT_TIME / 1000 / 60 // minutes
    });
    return;
  }
  
  // Verify password
  if (!verifyPassword(password)) {
    recordFailedAttempt(ip);
    const attempt = FAILED_ATTEMPTS.get(ip);
    const remainingAttempts = MAX_FAILED_ATTEMPTS - (attempt?.count || 0);
    
    res.status(401).json({
      success: false,
      error: 'Invalid password',
      remainingAttempts,
      maxAttempts: MAX_FAILED_ATTEMPTS
    });
    return;
  }
  
  // Clear failed attempts on successful login
  clearFailedAttempts(ip);
  
  // Generate and return token
  const token = generateToken();
  res.json({
    success: true,
    data: {
      token,
      expiry: TOKEN_EXPIRY,
      maintenanceMode: MAINTENANCE_MODE
    }
  });
}

/**
 * Verify token endpoint handler
 */
export async function handleTokenVerify(req: Request, res: Response): Promise<void> {
  const token = req.headers['x-maintenance-token'] as string;
  
  if (!token || !verifyToken(token)) {
    res.status(401).json({
      success: false,
      valid: false
    });
    return;
  }
  
  res.json({
    success: true,
    valid: true,
    maintenanceMode: MAINTENANCE_MODE
  });
}
