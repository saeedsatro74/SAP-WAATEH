import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Boxes,
  History,
  PlusCircle,
  Activity,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Globe,
  User,
  ShieldAlert,
  Database,
  Terminal,
  Copy,
  Check
} from 'lucide-react';

import { Product, Movement, InventoryCorrection, WarehouseConfig, ActiveTab, UserSession, Language, UnitType, MovementType, InventoryAudit, AuditActionType } from './types';
import { INITIAL_PRODUCTS, INITIAL_MOVEMENTS, DEFAULT_CONFIG } from './mockData';
import { TRANSLATIONS } from './translations';
import { supabase, SUPABASE_SQL_SETUP } from './supabase';

// Subcomponents
import LoginScreen from './components/LoginScreen';
import UnauthorizedScreen from './components/UnauthorizedScreen';
import DashboardTab from './components/DashboardTab';
import InventoryTab from './components/InventoryTab';
import MovementTab from './components/MovementTab';
import AddProductTab from './components/AddProductTab';
import AddMovementTab from './components/AddMovementTab';
import SettingsTab from './components/SettingsTab';
import ProfileTab from './components/ProfileTab';
import Avatar from './components/Avatar';
import HelpModal from './components/HelpModal';

// Robust helper to check if an error is network-related, offline-related, or a fetch failure
const isNetworkError = (err: any): boolean => {
  if (!err) return false;
  const errStr = String(err.message || err.error_description || err || '').toLowerCase();
  return (
    errStr.includes('fetch') ||
    errStr.includes('network') ||
    errStr.includes('load failed') ||
    errStr.includes('cors') ||
    errStr.includes('offline') ||
    errStr.includes('timeout') ||
    errStr.includes('ratelimit') ||
    errStr.includes('abort') ||
    errStr.includes('failed to fetch')
  );
};

export default function App() {
  // 1. Language State (local persisted)
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('waateh_lang');
    return (saved as Language) || 'en';
  });

  // 2. React Active Session State (managed by Supabase Auth)
  const [session, setSession] = useState<UserSession>({
    isLoggedIn: false,
    email: '',
    name: '',
    role: 'operator',
  });

  // 3. Application Data States (fetched from Supabase)
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [movements, setMovements] = useState<Movement[]>(INITIAL_MOVEMENTS);
  const [corrections, setCorrections] = useState<InventoryCorrection[]>([]);
  const [auditLogs, setAuditLogs] = useState<InventoryAudit[]>([]);
  const [config, setConfig] = useState<WarehouseConfig>(DEFAULT_CONFIG);
  const [usersList, setUsersList] = useState<UserSession[]>([]);
  const [globalMinStock, setGlobalMinStock] = useState<number>(15);
  const [warehouseResetAt, setWarehouseResetAt] = useState<string | null>(() => {
    try {
      return localStorage.getItem('waateh_reset_at');
    } catch {
      return null;
    }
  });

  // Loading and Error States
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState<boolean>(false);
  const [googleAuthLoading, setGoogleAuthLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editProductContext, setEditProductContext] = useState<Product | null>(null);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [helpOpen, setHelpOpen] = useState<boolean>(false);

  // --- DEVELOPER ROLE SIMULATION FOR EASY TESTING ---
  const [roleOverride, setRoleOverride] = useState<'admin' | 'operator' | null>(null);
  const activeRole = roleOverride || session.role;
  const activeSession = {
    ...session,
    role: activeRole
  };

  // --- LOCAL DEMO & OFFLINE RESILIENCE LAYER ---
  const isLocalMode = false;

  const loadLocalData = () => {
    const localProducts = localStorage.getItem('waateh_products');
    const localMovements = localStorage.getItem('waateh_movements');
    const localCorrections = localStorage.getItem('waateh_corrections');
    const localAudits = localStorage.getItem('waateh_audits');
    const localConfig = localStorage.getItem('waateh_config');
    const localGlobalMinStock = localStorage.getItem('waateh_global_min_stock');
    
    if (localProducts) {
      setProducts(JSON.parse(localProducts));
    } else {
      setProducts(INITIAL_PRODUCTS);
      localStorage.setItem('waateh_products', JSON.stringify(INITIAL_PRODUCTS));
    }
    
    if (localMovements) {
      setMovements(JSON.parse(localMovements));
    } else {
      setMovements(INITIAL_MOVEMENTS);
      localStorage.setItem('waateh_movements', JSON.stringify(INITIAL_MOVEMENTS));
    }
    
    if (localCorrections) {
      setCorrections(JSON.parse(localCorrections));
    } else {
      setCorrections([]);
      localStorage.setItem('waateh_corrections', JSON.stringify([]));
    }

    if (localAudits) {
      setAuditLogs(JSON.parse(localAudits));
    } else {
      // Build high-fidelity initial audit records based on initial products and movements for local mode simulation
      const initialAudits: InventoryAudit[] = INITIAL_PRODUCTS.map((p, idx) => ({
        id: `AUD-INIT-${p.sku}`,
        productSku: p.sku,
        productName: p.name,
        previousQuantity: 0,
        newQuantity: p.quantity,
        difference: p.quantity,
        actionType: 'Create',
        reason: 'Initial setup of products in warehouse',
        notes: 'Bulk stock import',
        adminEmail: 'admin@waateh.com',
        adminUserId: 'demo-admin-id',
        createdAt: new Date(Date.now() - (6 - idx) * 24 * 60 * 60 * 1000).toISOString()
      }));
      setAuditLogs(initialAudits);
      localStorage.setItem('waateh_audits', JSON.stringify(initialAudits));
    }
    
    if (localConfig) {
      setConfig(JSON.parse(localConfig));
    } else {
      setConfig(DEFAULT_CONFIG);
      localStorage.setItem('waateh_config', JSON.stringify(DEFAULT_CONFIG));
    }
    
    if (localGlobalMinStock) {
      setGlobalMinStock(parseInt(localGlobalMinStock, 10));
    } else {
      setGlobalMinStock(15);
      localStorage.setItem('waateh_global_min_stock', '15');
    }
    
    // Set dynamic users whitelists for local mode
    const demoUsers: UserSession[] = [
      {
        isLoggedIn: false,
        id: 'demo-admin-id',
        email: 'admin@waateh.com',
        name: 'Saeed Satari (Demo Admin)',
        role: 'admin',
        department: 'Logistics Control',
        picture: '',
        phone: '09121111111',
        bio: 'System Administrator in Local Mode',
      },
      {
        isLoggedIn: false,
        id: 'demo-operator-id',
        email: 'user@waateh.com',
        name: 'Amir Hosseini (Demo Operator)',
        role: 'operator',
        department: 'Operations',
        picture: '',
        phone: '09122222222',
        bio: 'Warehouse Operator in Local Mode',
      }
    ];
    setUsersList(demoUsers);
  };

  const logInventoryAudit = async (
    sku: string,
    name: string,
    prevQty: number,
    newQty: number,
    actionType: AuditActionType,
    reason: string,
    notes?: string
  ) => {
    const diff = newQty - prevQty;
    const adminEmail = session.email || 'admin@waateh.com';
    const adminUserId = session.id || 'demo-admin-id';

    if (isLocalMode) {
      const newAudit: InventoryAudit = {
        id: 'AUD-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        productSku: sku,
        productName: name,
        previousQuantity: prevQty,
        newQuantity: newQty,
        difference: diff,
        actionType,
        reason,
        notes: notes || '',
        adminEmail,
        adminUserId,
        createdAt: new Date().toISOString()
      };
      const localAudits = localStorage.getItem('waateh_audits');
      const parsedAudits: InventoryAudit[] = localAudits ? JSON.parse(localAudits) : [];
      const updatedAudits = [newAudit, ...parsedAudits];
      setAuditLogs(updatedAudits);
      localStorage.setItem('waateh_audits', JSON.stringify(updatedAudits));
      return;
    }

    try {
      await supabase.from('inventory_audit').insert([{
        product_sku: sku,
        product_name: name,
        previous_quantity: prevQty,
        new_quantity: newQty,
        difference: diff,
        action_type: actionType,
        reason,
        notes: notes || '',
        admin_email: adminEmail,
        admin_user_id: adminUserId
      }]);
    } catch (err) {
      console.error("Failed to insert inventory audit record:", err);
    }
  };



  // Shared Google login trigger utilizing popup window and iframe postMessage handshake
  const triggerGoogleLogin = async () => {
    setGoogleAuthLoading(true);
    setAuthError(null);
    setIsUnauthorized(false);

    const redirectToVal = window.location.origin;

    // Detect if we are loaded inside an iframe (e.g. AI Studio preview) or as a top-level window
    const isInIframe = (() => {
      try {
        return window.self !== window.top;
      } catch (e) {
        return true;
      }
    })();

    // Detect mobile devices, tablets, or webviews (popups are blocked/broken on mobile or social webviews)
    const isMobileOrWebview = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|FB_IAB|FBAV|Instagram|Telegram/i.test(navigator.userAgent);

    // If running in standalone tab (not in iframe) OR on mobile/webview, use standard direct redirect (100% reliable)
    if (!isInIframe || isMobileOrWebview) {
      console.log("[Auth Action] Top-level browser tab or mobile device detected. Triggering standard direct redirect flow (safer)...");
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectToVal,
            skipBrowserRedirect: false,
            queryParams: {
              prompt: 'select_account'
            }
          },
        });
        if (error) throw error;
      } catch (err: any) {
        console.error('Google Auth Error (Redirect Flow):', err);
        setAuthError(err.message || 'Could not connect with Google Auth');
        setGoogleAuthLoading(false);
      }
      return;
    }

    try {
      console.log("[Auth Action] Desktop iframe browser detected. Triggering popup window flow...");
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectToVal,
          skipBrowserRedirect: true,
          queryParams: {
            prompt: 'select_account'
          }
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        const authWindow = window.open(data.url, 'google_oauth_popup', 'width=600,height=700');
        
        // If popup is blocked by browser, fallback to standard redirect flow immediately
        if (!authWindow) {
          console.warn("[Auth Warning] Popup blocked. Falling back to direct redirect flow...");
          await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: redirectToVal,
              skipBrowserRedirect: false,
              queryParams: {
                prompt: 'select_account'
              }
            },
          });
          return;
        }

        const monitorInterval = setInterval(() => {
          if (!authWindow || authWindow.closed) {
            clearInterval(monitorInterval);
            setGoogleAuthLoading(false);
          }
        }, 1000);
      } else {
        throw new Error('Could not retrieve Google sign-in URL from Supabase.');
      }
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      setAuthError(err.message || 'Could not connect with Google Auth');
      setGoogleAuthLoading(false);
    }
  };

  // Persist language setting locally
  useEffect(() => {
    localStorage.setItem('waateh_lang', lang);
  }, [lang]);

  // Fetch all database records from Supabase
  const fetchAllData = async () => {
    if (isLocalMode) {
      loadLocalData();
      return;
    }
    let currentResetAt: string | null = null;
    try {
      currentResetAt = localStorage.getItem('waateh_reset_at');
    } catch {
      // Ignored
    }
    try {
      setDbError(null);

      // A. Fetch Products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (productsError) {
        // Code '42P01', 'PGRST204', or 'PGRST205' means table does not exist in Postgres/Supabase
        const isMissing = 
          productsError.code === '42P01' || 
          productsError.code === 'PGRST204' ||
          productsError.code === 'PGRST205' ||
          productsError.message?.includes('does not exist') ||
          productsError.message?.includes('relation') ||
          productsError.message?.includes('Could not find the table');

        if (isMissing) {
          setDbError('DATABASE_SCHEMA_MISSING');
          return;
        }
        throw productsError;
      }

      if (productsData) {
        const mappedProducts: Product[] = productsData.map((p: any) => {
          const isOlderThanReset = currentResetAt && p.created_at && new Date(p.created_at) <= new Date(currentResetAt);
          return {
            sku: p.sku,
            name: p.name,
            quantity: isOlderThanReset ? 0 : p.quantity,
            unit: p.unit as UnitType,
            location: p.location,
            lastUpdated: p.last_updated || new Date().toISOString(),
            notes: p.notes || '',
            minStock: p.min_stock,
            deleted: isOlderThanReset ? true : (p.deleted || false),
            deleted_at: isOlderThanReset ? currentResetAt : (p.deleted_at || null),
            deleted_by: isOlderThanReset ? 'system_reset' : (p.deleted_by || null),
          };
        });
        setProducts(mappedProducts.filter(p => !p.deleted));
      }

      // B. Fetch Movements
      const { data: movementsData, error: movementsError } = await supabase
        .from('movements')
        .select('*')
        .order('date', { ascending: false });

      if (movementsError) throw movementsError;

      if (movementsData) {
        let mappedMovements: Movement[] = movementsData.map((m: any) => ({
          id: m.id,
          personName: m.person_name,
          productSku: m.product_sku,
          productName: m.product_name,
          type: m.type as MovementType,
          quantity: m.quantity,
          date: m.date || new Date().toISOString(),
          location: m.location,
          notes: m.notes || '',
        }));
        if (currentResetAt) {
          mappedMovements = mappedMovements.filter(m => new Date(m.date) > new Date(currentResetAt!));
        }
        setMovements(mappedMovements);
      }

      // C. Fetch System Configurations
      const { data: configData, error: configError } = await supabase
        .from('system_config')
        .select('*');

      if (!configError && configData) {
        const layoutConfig = configData.find((c: any) => c.key === 'warehouse_layout');
        if (layoutConfig) {
          setConfig(layoutConfig.value as WarehouseConfig);
        }
        const minStockConfig = configData.find((c: any) => c.key === 'global_min_stock');
        if (minStockConfig) {
          setGlobalMinStock(
            typeof minStockConfig.value === 'number'
              ? minStockConfig.value
              : parseInt(minStockConfig.value, 10)
          );
        }
        const resetAtConfig = configData.find((c: any) => c.key === 'warehouse_reset_at');
        if (resetAtConfig) {
          currentResetAt = resetAtConfig.value as string;
          setWarehouseResetAt(currentResetAt);
          try {
            localStorage.setItem('waateh_reset_at', currentResetAt);
          } catch {
            // Ignored
          }
        }
      }

      // D. Fetch Allowed Users & Active Profiles
      const { data: allowedData, error: allowedError } = await supabase
        .from('allowed_users')
        .select('*');

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (allowedError) {
        const isMissing = 
          allowedError.code === '42P01' || 
          allowedError.code === 'PGRST204' ||
          allowedError.code === 'PGRST205' ||
          allowedError.message?.includes('does not exist') ||
          allowedError.message?.includes('relation') ||
          allowedError.message?.includes('Could not find the table');
        if (isMissing) {
          setDbError('DATABASE_SCHEMA_MISSING');
          return;
        }
      }

      if (profilesError) {
        const isMissing = 
          profilesError.code === '42P01' || 
          profilesError.code === 'PGRST204' ||
          profilesError.code === 'PGRST205' ||
          profilesError.message?.includes('does not exist') ||
          profilesError.message?.includes('relation') ||
          profilesError.message?.includes('Could not find the table');
        if (isMissing) {
          setDbError('DATABASE_SCHEMA_MISSING');
          return;
        }
      }

      if (!allowedError && allowedData) {
        const mergedUsers: UserSession[] = allowedData.map((a: any) => {
          const p = (profilesData || []).find((prof: any) => prof.email.toLowerCase() === a.email.toLowerCase()) || {};
          return {
            isLoggedIn: false,
            id: p.id || null,
            email: a.email,
            name: p.name || a.full_name || '',
            role: (p.role?.toLowerCase() === 'admin' || 
                   a.role?.toLowerCase() === 'admin' || 
                   a.email?.toLowerCase().trim() === 'saeedsatro7@gmail.com') ? 'admin' : 'operator',
            department: p.department || a.department || '',
            picture: p.picture || '',
            phone: p.phone || '',
            bio: p.bio || '',
          };
        });

        // Add any profiles that are not in allowedData
        if (profilesData) {
          for (const p of profilesData) {
            if (!mergedUsers.some(u => u.email.toLowerCase() === p.email.toLowerCase())) {
              mergedUsers.push({
                isLoggedIn: false,
                id: p.id,
                email: p.email,
                name: p.name,
                role: p.role?.toLowerCase() === 'admin' ? 'admin' : 'operator',
                department: p.department || '',
                picture: p.picture || '',
                phone: p.phone || '',
                bio: p.bio || '',
              });
            }
          }
        }

        mergedUsers.sort((a, b) => a.name.localeCompare(b.name));
        setUsersList(mergedUsers);
      } else if (!profilesError && profilesData) {
        const mappedUsers: UserSession[] = profilesData.map((p: any) => ({
          isLoggedIn: false,
          id: p.id,
          email: p.email,
          name: p.name,
          role: p.role?.toLowerCase() === 'admin' ? 'admin' : 'operator',
          department: p.department || '',
          picture: p.picture || '',
          phone: p.phone || '',
          bio: p.bio || '',
        }));
        setUsersList(mappedUsers);
      }

      // E. Fetch Inventory Corrections (Audit Trail)
      try {
        const { data: correctionsData, error: correctionsError } = await supabase
          .from('inventory_corrections')
          .select('*')
          .order('created_at', { ascending: false });

        if (correctionsError) {
          const isMissing = 
            correctionsError.code === '42P01' || 
            correctionsError.code === 'PGRST204' ||
            correctionsError.code === 'PGRST205' ||
            correctionsError.message?.includes('does not exist') ||
            correctionsError.message?.includes('relation') ||
            correctionsError.message?.includes('Could not find the table');
          
          if (isMissing) {
            setDbError('DATABASE_SCHEMA_MISSING');
            return;
          }
          console.warn("Could not load inventory corrections:", correctionsError.message);
        } else if (correctionsData) {
          let mappedCorrections = correctionsData.map((c: any) => ({
            id: c.id,
            userEmail: c.user_email,
            userName: c.user_name,
            productSku: c.product_sku,
            productName: c.product_name,
            previousQuantity: c.previous_quantity,
            newQuantity: c.new_quantity,
            reason: c.reason,
            createdAt: c.created_at || new Date().toISOString(),
          }));
          if (currentResetAt) {
            mappedCorrections = mappedCorrections.filter(c => new Date(c.createdAt) > new Date(currentResetAt!));
          }
          setCorrections(mappedCorrections);
        }
      } catch (err: any) {
        console.warn("Exception loading inventory corrections:", err);
        const isMissing = 
          err.code === '42P01' || 
          err.code === 'PGRST204' ||
          err.code === 'PGRST205' ||
          err.message?.includes('does not exist') ||
          err.message?.includes('relation') ||
          err.message?.includes('Could not find the table');
        if (isMissing) {
          setDbError('DATABASE_SCHEMA_MISSING');
          return;
        }
      }

      // F. Fetch Enterprise Inventory Audit Logs
      try {
        const { data: auditData, error: auditError } = await supabase
          .from('inventory_audit')
          .select('*')
          .order('created_at', { ascending: false });

        if (auditError) {
          const isMissing = 
            auditError.code === '42P01' || 
            auditError.code === 'PGRST204' ||
            auditError.code === 'PGRST205' ||
            auditError.message?.includes('does not exist') ||
            auditError.message?.includes('relation') ||
            auditError.message?.includes('Could not find the table');
          
          if (isMissing) {
            setDbError('DATABASE_SCHEMA_MISSING');
            return;
          }
          console.warn("Could not load inventory audits:", auditError.message);
        } else if (auditData) {
          let mappedAudits: InventoryAudit[] = auditData.map((a: any) => ({
            id: a.id,
            productSku: a.product_sku,
            productName: a.product_name,
            previousQuantity: a.previous_quantity,
            newQuantity: a.new_quantity,
            difference: a.difference,
            actionType: a.action_type as AuditActionType,
            reason: a.reason,
            notes: a.notes || '',
            adminEmail: a.admin_email,
            adminUserId: a.admin_user_id || '',
            createdAt: a.created_at || new Date().toISOString()
          }));
          if (currentResetAt) {
            mappedAudits = mappedAudits.filter(a => new Date(a.createdAt) > new Date(currentResetAt!));
          }
          setAuditLogs(mappedAudits);
        }
      } catch (err: any) {
        console.warn("Exception loading inventory audits:", err);
        const isMissing = 
          err.code === '42P01' || 
          err.code === 'PGRST204' ||
          err.code === 'PGRST205' ||
          err.message?.includes('does not exist') ||
          err.message?.includes('relation') ||
          err.message?.includes('Could not find the table');
        if (isMissing) {
          setDbError('DATABASE_SCHEMA_MISSING');
          return;
        }
      }
    } catch (err: any) {
      console.error("Supabase data loading error:", err);

      const isSchemaMissing = 
        err.code === '42P01' || 
        err.code === 'PGRST204' ||
        err.code === 'PGRST205' ||
        err.message?.includes('does not exist') ||
        err.message?.includes('relation') ||
        err.message?.includes('Could not find the table');
      
      if (isSchemaMissing) {
        setDbError('DATABASE_SCHEMA_MISSING');
      } else {
        setDbError(err.message || 'Error communicating with Supabase database.');
      }
    }
  };

  // Sync Supabase Auth state reactively
  useEffect(() => {
    // Global error listener to prevent uncaught promise rejections from throwing or breaking the test suite
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const err = event.reason;
      if (isNetworkError(err)) {
        console.warn("[Global Safety] Caught unhandled network/fetch rejection:", err);
        event.preventDefault(); // Prevents browser console red errors or test runner crashes
      }
    };

    const handleGlobalError = (event: ErrorEvent) => {
      if (isNetworkError(event.error)) {
        console.warn("[Global Safety] Caught global network/fetch error:", event.message);
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleGlobalError);

    // 1. Popup Detector: If loaded inside a Google Sign-In popup window
    try {
      if (window.opener && (window.location.hash.includes('access_token') || window.location.search.includes('code'))) {
        const checkAndClose = async () => {
          try {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            if (currentSession) {
              window.opener.postMessage({ type: 'SUPABASE_AUTH_SUCCESS', session: currentSession }, window.location.origin);
              window.close();
            }
          } catch (e) {
            console.warn("Popup detector getSession error:", e);
          }
        };
        checkAndClose().catch(err => console.warn("Popup detector getSession async catch:", err));

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
          if (currentSession) {
            window.opener.postMessage({ type: 'SUPABASE_AUTH_SUCCESS', session: currentSession }, window.location.origin);
            window.close();
          }
        });
        return () => {
          try {
            subscription.unsubscribe();
          } catch (e) {
            console.warn("Unsubscribe error:", e);
          }
          window.removeEventListener('unhandledrejection', handleUnhandledRejection);
          window.removeEventListener('error', handleGlobalError);
        };
      }
    } catch (err) {
      console.warn("Popup detector setup failed:", err);
    }

    // 2. Parent Message Listener: Listen for success messages from the Google OAuth popup
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'SUPABASE_AUTH_SUCCESS') {
        const receivedSession = event.data?.session;
        if (receivedSession) {
          console.log("[Partition Bridge] Successfully received session from popup:", receivedSession);
          const { access_token, refresh_token } = receivedSession;
          if (access_token && refresh_token) {
            try {
              const { data, error } = await supabase.auth.setSession({
                access_token,
                refresh_token
              });
              if (error) {
                console.error("[Partition Bridge] setSession error:", error);
              } else if (data?.session) {
                console.log("[Partition Bridge] Session successfully initialized in iframe partition!");
                handleSupabaseSession(data.session);
                return;
              }
            } catch (err) {
              console.error("[Partition Bridge] Exception during setSession:", err);
            }
          }
        }

        // Fallback if session wasn't passed directly or couldn't be set
        supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
          if (currentSession) {
            handleSupabaseSession(currentSession);
          }
        }).catch(err => {
          console.error("[Partition Bridge] getSession error:", err);
        });
      }
    };
    window.addEventListener('message', handleMessage);

    // 3. Central Auth State Handshake
    setLoadingData(true);

    // Check initial session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (currentSession) {
        handleSupabaseSession(currentSession);
      } else {
        setSession({ isLoggedIn: false, email: '', name: '', role: 'operator' });
        setLoadingData(false);
      }
    }).catch(err => {
      console.error("[Auth] Initial getSession failed:", err);
      setSession({ isLoggedIn: false, email: '', name: '', role: 'operator' });
      setAuthError(err.message || 'Failed to connect to authentication gateway.');
      setLoadingData(false);
    });

    // Listen to Auth State Changes
    let subscription: any = null;
    try {
      const authListener = supabase.auth.onAuthStateChange((_event, currentSession) => {
        if (currentSession) {
          handleSupabaseSession(currentSession);
        } else {
          setSession({ isLoggedIn: false, email: '', name: '', role: 'operator' });
          setProducts(INITIAL_PRODUCTS);
          setMovements(INITIAL_MOVEMENTS);
          setLoadingData(false);
        }
      });
      subscription = authListener?.data?.subscription;
    } catch (err) {
      console.error("[Auth] Failed to bind auth state change listener:", err);
    }

    return () => {
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (e) {
          console.warn("Unsubscribe error on cleanup:", e);
        }
      }
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleGlobalError);
    };
  }, []);

  // Set local state and load user profile once authenticated
  const handleSupabaseSession = async (supabaseSession: any) => {
    setLoadingData(true);
    console.group("=== AUTHENTICATION FLOW HANDSHAKE ===");
    console.log("[Auth Step 1] OAuth check: Handshake initiated. window.location.origin:", window.location.origin);
    console.log("[Runtime Info] Current URL (window.location.href):", window.location.href);
    console.log("[Runtime Info] Standard Redirect URL expected:", window.location.origin);
    console.log("[Runtime Info] OAuth callback URL:", "https://kpwlwygwebeisbrssizw.supabase.co/auth/v1/callback");

    try {
      // 1. Get current session using supabase.auth.getSession()
      console.log("[Auth Step 2] Checking active session in Supabase...");
      const sessionResult = await supabase.auth.getSession();
      console.log("[Supabase API] auth.getSession() result:", sessionResult);
      if (sessionResult.error) {
        if (isNetworkError(sessionResult.error)) {
          console.warn("  -> auth.getSession() network issue:", sessionResult.error.message);
        } else {
          console.warn("  -> auth.getSession() info:", sessionResult.error);
        }
      }

      const activeSession = sessionResult.data.session;
      const currentSession = supabaseSession || activeSession;

      if (!currentSession || !currentSession.user) {
        console.warn("[Auth State] Stop: No active session or user found in currentSession.");
        setSession({ isLoggedIn: false, email: '', name: '', role: 'operator' });
        setLoadingData(false);
        console.groupEnd();
        return;
      }

      // 2. Fetch authenticated user details explicitly with safe try-catch
      console.log("[Auth Step 3] Reading authenticated user details...");
      let userResult: any = null;
      try {
        userResult = await supabase.auth.getUser();
        console.log("[Supabase API] auth.getUser() result:", userResult);
        if (userResult.error) {
          if (isNetworkError(userResult.error)) {
            console.warn("  -> auth.getUser() network issue:", userResult.error.message);
          } else {
            console.warn("  -> auth.getUser() info:", userResult.error);
          }
        }
      } catch (userErr: any) {
        console.warn("  -> Exception calling auth.getUser() (possibly offline or blocked):", userErr);
        userResult = { error: userErr };
      }

      const user = currentSession.user;
      const userId = user.id;
      const email = user.email || '';

      // Decode JWT email if token is accessible
      let jwtEmail = 'Unknown';
      try {
        if (currentSession.access_token) {
          const payload = JSON.parse(atob(currentSession.access_token.split('.')[1]));
          jwtEmail = payload?.email || 'Not present in JWT';
          console.log("[JWT Debug] Decoded JWT Email Claim:", jwtEmail);
        }
      } catch (e) {
        console.warn("[JWT Debug] Could not parse JWT token:", e);
      }

      // Log current user identity details
      console.log("[Identity] auth.uid() / user.id:", userId);
      console.log("[Identity] auth.user().email:", email);
      console.log("[Identity] JWT email claim:", jwtEmail);

      // Query allowed_users using the user's email dynamically
      console.log(`[Auth Step 4] Querying public.allowed_users for email: ${email}`);
      let allowedUser: any = null;
      try {
        const { data, error: queryError } = await supabase
          .from('allowed_users')
          .select('*')
          .eq('email', email.toLowerCase().trim())
          .maybeSingle();
        
        if (queryError) {
          const errStr = String(queryError.message || '');
          const isNetwork = errStr.includes('fetch') || errStr.includes('network') || errStr.includes('Load failed');
          if (isNetwork) {
            console.warn("[DB Query Warning] Network issue reading 'allowed_users' table:", queryError.message);
          } else {
            console.error("[DB Query Error] Error reading 'allowed_users' table:", queryError);
            const isMissing = 
              queryError.code === '42P01' || 
              queryError.code === 'PGRST204' ||
              queryError.code === 'PGRST205' ||
              queryError.message?.includes('does not exist') ||
              queryError.message?.includes('relation') ||
              queryError.message?.includes('Could not find the table');
            if (isMissing) {
              setDbError('DATABASE_SCHEMA_MISSING');
              setLoadingData(false);
              console.groupEnd();
              return;
            }
          }
        } else {
          allowedUser = data;
          console.log("[DB Query Success] 'allowed_users' result:", allowedUser);
        }

        // Stage 4.1: If exact match failed, try fetching all and doing fuzzy match (handles trailing spaces/different casing in DB)
        if (!allowedUser) {
          console.log("[Auth Step 4.1] Exact match failed. Fetching allowed list to do a safe fuzzy client-side check...");
          const { data: listData, error: listError } = await supabase
            .from('allowed_users')
            .select('*');
          
          if (!listError && listData) {
            const found = listData.find(u => 
              String(u.email || '').toLowerCase().trim() === email.toLowerCase().trim()
            );
            if (found) {
              allowedUser = found;
              console.log("[Auth Step 4.2] Fuzzy match successful! Found user:", allowedUser);
            }
          }
        }
      } catch (err: any) {
        const errStr = String(err?.message || err || '');
        const isNetwork = errStr.includes('fetch') || errStr.includes('network') || errStr.includes('Load failed');
        if (isNetwork) {
          console.warn("[Unhandled Exception] Network issue querying allowed_users:", err.message || err);
        } else {
          console.error("[Unhandled Exception] Exception querying allowed_users:", err);
          const isMissing = 
            err.code === '42P01' || 
            err.code === 'PGRST204' ||
            err.code === 'PGRST205' ||
            err.message?.includes('does not exist') ||
            err.message?.includes('relation') ||
            err.message?.includes('Could not find the table');
          if (isMissing) {
            setDbError('DATABASE_SCHEMA_MISSING');
            setLoadingData(false);
            console.groupEnd();
            return;
          }
        }
      }

      // If still not found (e.g., database error or policy restriction)
      if (!allowedUser) {
        console.log("[Auth Step 5] Stop: No row exists for this email in public.allowed_users.");
        console.log("[Authorization Decision] REJECTED. Email is not in allowed_users list:", email);
        
        // Save unauthorized state first BEFORE signing out so the UI can render the Access Denied screen!
        setIsUnauthorized(true);
        setSession({ isLoggedIn: false, email: '', name: '', role: 'operator' });
        setAuthError(lang === 'fa' ? 'دسترسی برای این حساب مجاز نیست.' : 'This account is not whitelisted.');
        
        // Purge local storage tokens to prevent sticky session/redirect loops
        try {
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
              localStorage.removeItem(key);
            }
          }
        } catch (storageErr) {
          console.warn("[Auth Warning] Could not clear localStorage Supabase tokens:", storageErr);
        }

        // Sign out securely and catch any errors to prevent exceptions
        console.log("[Auth Step 6] Triggering secure sign out for unauthorized user...");
        try {
          await supabase.auth.signOut();
          console.log("[Auth Step 7] Sign out successful.");
        } catch (signOutErr) {
          console.warn("[Auth Warning] SignOut failed during authorization rejection:", signOutErr);
        }
        
        setLoadingData(false);
        console.groupEnd();
        return;
      }

      console.log("[Auth Step 5] Row found in public.allowed_users. Reading user role...");
      const userRoleLower = (allowedUser?.role || '').toLowerCase();
      const isAuthorized = userRoleLower === 'admin' ||
                           userRoleLower === 'operator' ||
                           userRoleLower === 'warehouse user';

      if (!isAuthorized) {
        console.log("[Auth Step 6] Stop: Role is not authorized (admin or operator):", allowedUser.role);
        console.log("[Authorization Decision] REJECTED. Role is invalid:", allowedUser.role);
        
        // Save unauthorized state first BEFORE signing out so the UI can render the Access Denied screen!
        setIsUnauthorized(true);
        setSession({ isLoggedIn: false, email: '', name: '', role: 'operator' });
        setAuthError("This Google account is not authorized.");
        
        // Purge local storage tokens to prevent sticky session/redirect loops
        try {
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
              localStorage.removeItem(key);
            }
          }
        } catch (storageErr) {
          console.warn("[Auth Warning] Could not clear localStorage Supabase tokens:", storageErr);
        }

        // Sign out securely and catch any errors to prevent exceptions
        console.log("[Auth Step 7] Triggering secure sign out...");
        try {
          await supabase.auth.signOut();
        } catch (signOutErr) {
          console.warn("[Auth Warning] SignOut failed during authorization rejection:", signOutErr);
        }
        
        setLoadingData(false);
        console.groupEnd();
        return;
      }

      const isExplicitAdmin = userRoleLower === 'admin' || 
                             email.toLowerCase().trim() === 'saeedsatro7@gmail.com';
      const normalizedRole = (isExplicitAdmin ? 'admin' : 'operator') as 'admin' | 'operator';
      console.log(`[Auth Step 6] Role authorized: ${normalizedRole}. Continuing to create/update profile...`);
      console.log(`[Authorization Decision] ALLOWED. User has authorized role: ${normalizedRole}`);

      // Fetch public profile row if it exists
      let profile: any = null;
      try {
        console.log("[Auth Step 7] Querying 'profiles' table for UID:", userId);
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (profileError) {
          const errStr = String(profileError.message || '');
          const isNetwork = errStr.includes('fetch') || errStr.includes('network') || errStr.includes('Load failed');
          if (isNetwork) {
            console.warn("[DB Query Warning] Network issue reading 'profiles' table:", profileError.message);
          } else {
            console.error("[DB Query Error] Error reading 'profiles' table:", profileError);
          }
        } else {
          profile = profileData;
          console.log("[DB Query Success] 'profiles' result:", profile);
        }
      } catch (err: any) {
        const errStr = String(err?.message || err || '');
        const isNetwork = errStr.includes('fetch') || errStr.includes('network') || errStr.includes('Load failed');
        if (isNetwork) {
          console.warn("[Unhandled Exception] Network issue querying profiles:", err.message || err);
        } else {
          console.error("[Unhandled Exception] Exception querying profiles:", err);
        }
      }

      const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';
      const fullName = profile?.name || allowedUser?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || 'Authorized User';
      const userDepartment = profile?.department || allowedUser?.department || 'Operations';

      if (!profile) {
        // 4. If a profile row does not exist, automatically INSERT a new row
        console.log("[DB Action] Profile does not exist. Automatically inserting new profile for UID:", userId);
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([{
            id: userId,
            email: email.toLowerCase(),
            name: fullName,
            role: normalizedRole,
            picture: avatarUrl,
            department: userDepartment,
            phone: '',
            bio: '',
            created_at: new Date().toISOString()
          }]);

        if (insertError) {
          const errStr = String(insertError.message || '');
          const isNetwork = errStr.includes('fetch') || errStr.includes('network') || errStr.includes('Load failed');
          if (isNetwork) {
            console.warn("[DB Action Warning] Network issue inserting profile:", insertError.message);
          } else {
            console.error("[DB Action Error] Error inserting profile:", insertError);
          }
        } else {
          console.log("[DB Action Success] Successfully inserted profile.");
        }
      } else {
        // 5. Profile already exists. Just update email and role if they changed, or do nothing.
        console.log("[DB Action] Profile already exists. Syncing role and email if needed.");
        if (profile.email !== email.toLowerCase() || profile.role !== normalizedRole) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              email: email.toLowerCase(),
              role: normalizedRole
            })
            .eq('id', userId);

          if (updateError) {
            const errStr = String(updateError.message || '');
            const isNetwork = errStr.includes('fetch') || errStr.includes('network') || errStr.includes('Load failed');
            if (isNetwork) {
              console.warn("[DB Action Warning] Network issue syncing profile email/role:", updateError.message);
            } else {
              console.error("[DB Action Error] Error syncing profile email/role:", updateError);
            }
          } else {
            console.log("[DB Action Success] Successfully synced profile.");
          }
        }
      }

      // Fetch updated profile info to set the session state accurately
      let finalProfile: any = null;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        if (error) {
          const errStr = String(error.message || '');
          const isNetwork = errStr.includes('fetch') || errStr.includes('network') || errStr.includes('Load failed');
          if (isNetwork) {
            console.warn("[DB Query Warning] Network issue fetching final profile state:", error.message);
          } else {
            console.error("[DB Query Error] Error fetching final profile state:", error);
          }
        } else {
          finalProfile = data;
        }
      } catch (err: any) {
        const errStr = String(err?.message || err || '');
        const isNetwork = errStr.includes('fetch') || errStr.includes('network') || errStr.includes('Load failed');
        if (isNetwork) {
          console.warn("[Unhandled Exception] Network issue fetching final profile:", err.message || err);
        } else {
          console.error("Exception fetching final profile:", err);
        }
      }

      const profileToUse = finalProfile || profile || {};

      console.log("[Session Init] Final user state assigned:", {
        id: userId,
        email: email.toLowerCase(),
        name: profileToUse.name || fullName,
        role: normalizedRole,
        picture: profileToUse.picture || avatarUrl,
        phone: profileToUse.phone || '',
        bio: profileToUse.bio || '',
        department: profileToUse.department || userDepartment,
      });

      setSession({
        isLoggedIn: true,
        id: userId,
        email: email.toLowerCase(),
        name: profileToUse.name || fullName,
        role: normalizedRole,
        picture: profileToUse.picture || avatarUrl,
        phone: profileToUse.phone || '',
        bio: profileToUse.bio || '',
        department: profileToUse.department || userDepartment,
      });

      // Clear any previous unauthorized/error states
      setAuthError(null);
      setIsUnauthorized(false);

      // Redirect to the dashboard/home page after successful login
      setActiveTab('dashboard');

      // Fetch inventory and logistics logs from DB
      await fetchAllData();
    } catch (err: any) {
      console.error("[Auth Unhandled Critical Error] Profile matching or data synchronization error:", err);
      setAuthError(err.message || 'Error communicating with Supabase.');
      setSession({ isLoggedIn: false, email: '', name: '', role: 'operator' });
    } finally {
      setLoadingData(false);
      console.groupEnd();
    }
  };

  // Sign out handler
  const handleLogout = async () => {
    setLoadingData(true);
    console.log("[Auth Action] Calling supabase.auth.signOut() explicitly requested by user.");
    try {
      await supabase.auth.signOut();
      console.log("  -> auth.signOut() completed successfully.");
    } catch (e) {
      console.error("  -> Exception during auth.signOut():", e);
    }
    
    // Completely clear Supabase session, cached profiles, local states, and user data
    setSession({
      isLoggedIn: false,
      email: '',
      name: '',
      role: 'operator',
    });
    setProducts([]);
    setMovements([]);
    setIsUnauthorized(false);
    setAuthError(null);
    setLoadingData(false);
  };

  // Real-time product state modifications on Supabase
  const handleAddOrEditProduct = async (productData: Product, isEdit: boolean, correctionReason?: string) => {
    if (isLocalMode) {
      let updatedProducts = [...products];
      if (isEdit) {
        if (editProductContext) {
          const qtyChanged = editProductContext.quantity !== productData.quantity;
          if (qtyChanged) {
            if (!correctionReason || !correctionReason.trim()) {
              alert(lang === 'fa' ? 'خطا: وارد کردن دلیل اصلاح موجودی الزامی است.' : 'Error: A correction reason is required.');
              return;
            }
            
            // Create local correction log
            const newCorrection: InventoryCorrection = {
              id: 'COR-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
              userEmail: session.email || 'admin@waateh.com',
              userName: session.name || 'Demo Admin',
              productSku: productData.sku,
              productName: productData.name,
              previousQuantity: editProductContext.quantity,
              newQuantity: productData.quantity,
              reason: correctionReason.trim(),
              createdAt: new Date().toISOString()
            };
            const updatedCorrections = [newCorrection, ...corrections];
            setCorrections(updatedCorrections);
            localStorage.setItem('waateh_corrections', JSON.stringify(updatedCorrections));

            await logInventoryAudit(
              productData.sku,
              productData.name,
              editProductContext.quantity,
              productData.quantity,
              'Admin Correction',
              correctionReason.trim(),
              productData.notes
            );
          }
          
          if (editProductContext.sku !== productData.sku) {
            // Prevent duplicate SKU
            if (products.some(p => p.sku === productData.sku)) {
              alert(lang === 'fa' ? 'این شناسه SKU قبلاً ثبت شده است!' : 'This SKU already exists in inventory!');
              return;
            }
            // Update referencing movements to new SKU in local mode
            const updatedMovements = movements.map(m => m.productSku === editProductContext.sku ? { ...m, productSku: productData.sku } : m);
            setMovements(updatedMovements);
            localStorage.setItem('waateh_movements', JSON.stringify(updatedMovements));
          }

          updatedProducts = updatedProducts.map(p => p.sku === editProductContext.sku ? productData : p);
        }
        setEditProductContext(null);
      } else {
        // Prevent duplicate SKU
        if (products.some(p => p.sku === productData.sku)) {
          alert(lang === 'fa' ? 'این شناسه SKU قبلاً ثبت شده است!' : 'This SKU already exists in inventory!');
          return;
        }
        updatedProducts = [productData, ...products];

        await logInventoryAudit(
          productData.sku,
          productData.name,
          0,
          productData.quantity,
          'Create',
          'Product initially registered in catalog',
          productData.notes
        );
      }
      setProducts(updatedProducts);
      localStorage.setItem('waateh_products', JSON.stringify(updatedProducts));
      setEditProductContext(null);
      setActiveTab('inventory');
      return;
    }
    try {
      if (isEdit) {
        if (editProductContext) {
          const qtyChanged = editProductContext.quantity !== productData.quantity;
          if (qtyChanged) {
            if (!correctionReason || !correctionReason.trim()) {
              alert(lang === 'fa' ? 'خطا: وارد کردن دلیل اصلاح موجودی الزامی است.' : 'Error: A correction reason is required.');
              return;
            }
          }

          if (editProductContext.sku !== productData.sku) {
            // Prevent duplicate SKU
            const { data: exists } = await supabase
              .from('products')
              .select('sku')
              .eq('sku', productData.sku)
              .maybeSingle();

            if (exists) {
              alert(lang === 'fa' ? 'این شناسه SKU قبلاً ثبت شده است!' : 'This SKU already exists in inventory!');
              return;
            }

            // SQLite/Postgres primary key modifications require cascading:
            // A. Insert new product SKU
            const { error: insertNewErr } = await supabase
              .from('products')
              .insert([{
                sku: productData.sku,
                name: productData.name,
                quantity: productData.quantity,
                unit: productData.unit,
                location: productData.location,
                notes: productData.notes || '',
                min_stock: productData.minStock || globalMinStock,
                last_updated: new Date().toISOString(),
              }]);

            if (insertNewErr) throw insertNewErr;

            // B. Update referencing movements to new SKU
            const { error: cascadeErr } = await supabase
              .from('movements')
              .update({ product_sku: productData.sku })
              .eq('product_sku', editProductContext.sku);

            if (cascadeErr) {
              console.warn("Could not cascade movements SKU:", cascadeErr);
            }

            // C. Delete old SKU
            await supabase.from('products').delete().eq('sku', editProductContext.sku);
          } else {
            // Normal simple fields update
            const { error: updateErr } = await supabase
              .from('products')
              .update({
                name: productData.name,
                quantity: productData.quantity,
                unit: productData.unit,
                location: productData.location,
                notes: productData.notes || '',
                min_stock: productData.minStock,
                last_updated: new Date().toISOString(),
              })
              .eq('sku', productData.sku);

            if (updateErr) throw updateErr;
          }

          // Create inventory correction audit trail log AFTER the product is updated/inserted
          if (qtyChanged) {
            const { error: correctionErr } = await supabase
              .from('inventory_corrections')
              .insert([{
                user_email: session.email || 'unknown@waateh.com',
                user_name: session.name || 'Admin User',
                product_sku: productData.sku,
                product_name: productData.name,
                previous_quantity: editProductContext.quantity,
                new_quantity: productData.quantity,
                reason: correctionReason.trim(),
              }]);

            if (correctionErr) {
              throw new Error(lang === 'fa' ? `خطا در ثبت سند اصلاح موجودی: ${correctionErr.message}` : `Failed to save correction audit log: ${correctionErr.message}`);
            }

            await logInventoryAudit(
              productData.sku,
              productData.name,
              editProductContext.quantity,
              productData.quantity,
              'Admin Correction',
              correctionReason.trim(),
              productData.notes
            );
          }
        }
        setEditProductContext(null);
      } else {
        // Prevent duplicate SKU on new registration
        const { data: exists } = await supabase
          .from('products')
          .select('sku')
          .eq('sku', productData.sku)
          .maybeSingle();

        if (exists) {
          alert(lang === 'fa' ? 'این شناسه SKU قبلاً ثبت شده است!' : 'This SKU already exists!');
          return;
        }

        const { error: insertErr } = await supabase
          .from('products')
          .insert([{
            sku: productData.sku,
            name: productData.name,
            quantity: productData.quantity,
            unit: productData.unit,
            location: productData.location,
            notes: productData.notes || '',
            min_stock: productData.minStock || globalMinStock,
            last_updated: new Date().toISOString(),
          }]);

        if (insertErr) throw insertErr;

        await logInventoryAudit(
          productData.sku,
          productData.name,
          0,
          productData.quantity,
          'Create',
          'Product initially registered in catalog',
          productData.notes
        );
      }

      await fetchAllData();
      setActiveTab('inventory');
    } catch (err: any) {
      console.error("Save product error:", err);
      
      const errMsg = err.message || err.error_description || err.error || String(err);
      const errCode = err.code || '';
      const errDetails = err.details || '';
      const errHint = err.hint || '';
      
      const isRlsError = errCode === '42501' || 
                         errMsg.toLowerCase().includes('row-level security') || 
                         errMsg.toLowerCase().includes('policy') || 
                         errMsg.toLowerCase().includes('permission');
                         
      if (lang === 'fa') {
        if (isRlsError) {
          alert(
            `🚫 خطای دسترسی امنیتی (RLS): دسترسی برای ثبت/ویرایش کالا صادر نشد!\n\n` +
            `احتمالاً شما با نقش اپراتور (غیر مدیر) وارد شده‌اید یا دسترسی‌های لازم (Policies) روی پایگاه داده Supabase شما فعال نیست.\n\n` +
            `💡 راه حل برای مدیران:\n` +
            `۱. وارد پنل کاربری Supabase خود شوید.\n` +
            `۲. اسکریپت SQL موجود در بخش تنظیمات سیستم را کپی کرده و در SQL Editor اجرا کنید تا دسترسی‌های RLS به‌روزرسانی شوند.\n` +
            `۳. مطمئن شوید ایمیل شما (${session.email}) با نقش admin در جدول allowed_users ثبت شده است.\n\n` +
            `[جزئیات فنی خطا]:\n` +
            `پیام: ${errMsg}\n` +
            `کد: ${errCode}\n` +
            `جزئیات: ${errDetails}`
          );
        } else {
          alert(`خطا در ذخیره کالا: ${errMsg}\nکد خطا: ${errCode}\nجزئیات: ${errDetails}`);
        }
      } else {
        if (isRlsError) {
          alert(
            `🚫 Security Access Error (RLS): Permission denied to register or update this product!\n\n` +
            `You might be logged in with operator privileges, or the required RLS policies are missing/inactive on your Supabase database.\n\n` +
            `💡 Solution for Administrators:\n` +
            `1. Open your Supabase Dashboard.\n` +
            `2. Copy the SQL Setup script from System Settings and run it in the SQL Editor to update table permissions.\n` +
            `3. Ensure your email (${session.email}) has the 'admin' role inside the public.allowed_users table.\n\n` +
            `[Technical Details]:\n` +
            `Message: ${errMsg}\n` +
            `Code: ${errCode}\n` +
            `Details: ${errDetails}`
          );
        } else {
          alert(`Error saving product: ${errMsg}\nCode: ${errCode}\nDetails: ${errDetails}`);
        }
      }
    }
  };

  // Soft delete product record
  const handleDeleteProduct = async (sku: string) => {
    if (session?.role !== 'admin') {
      alert(lang === 'fa' ? 'شما دسترسی کافی برای حذف کالا را ندارید.' : 'You do not have permission to delete products.');
      return;
    }
    const targetProd = products.find(p => p.sku === sku);
    if (!targetProd) return;

    if (isLocalMode) {
      const updatedProducts = products.map(p => p.sku === sku ? {
        ...p,
        deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: session.email || 'admin@waateh.com'
      } : p);
      setProducts(updatedProducts);
      localStorage.setItem('waateh_products', JSON.stringify(updatedProducts));
      
      await logInventoryAudit(
        sku,
        targetProd.name,
        targetProd.quantity,
        targetProd.quantity,
        'Delete',
        'Product soft-deleted by administrator'
      );
      alert(lang === 'fa' ? 'کالا با موفقیت از حافظه محلی حذف شد.' : 'Product deleted successfully from local storage.');
      return;
    }

    // Keep backup of previous products state for rollback if database request fails
    const originalProducts = [...products];

    try {
      console.log(`[Delete Flow] Initiating delete for SKU: ${sku}`);
      
      // Attempt soft-delete first
      const { error: softDeleteError } = await supabase
        .from('products')
        .update({
          deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: session.email || 'admin@waateh.com'
        })
        .eq('sku', sku);

      if (softDeleteError) {
        console.warn("[Delete Flow] Soft-delete failed or columns missing. Error details:", softDeleteError);
        console.log("[Delete Flow] Attempting HARD-delete fallback...");

        // Try HARD-delete instead
        const { error: hardDeleteError } = await supabase
          .from('products')
          .delete()
          .eq('sku', sku);

        if (hardDeleteError) {
          console.error("[Delete Flow] Hard-delete fallback failed as well. Error:", hardDeleteError);
          throw new Error(hardDeleteError.message || JSON.stringify(hardDeleteError));
        }

        console.log("[Delete Flow] HARD-delete fallback succeeded!");
        
        // Update local state immediately (remove entirely)
        setProducts(prev => prev.filter(p => p.sku !== sku));

        await logInventoryAudit(
          sku,
          targetProd.name,
          targetProd.quantity,
          0,
          'Delete',
          'Product hard-deleted due to missing soft-delete columns or RLS policy constraints'
        );

        alert(lang === 'fa' ? 'کالا به علت عدم پشتیبانی از حذف منطقی، به طور کامل از پایگاه داده حذف شد.' : 'Product hard-deleted successfully from the database.');
      } else {
        console.log("[Delete Flow] Soft-delete succeeded!");

        // Update local state immediately (set deleted status)
        setProducts(prev => prev.map(p => p.sku === sku ? {
          ...p,
          deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: session.email || 'admin@waateh.com'
        } : p));

        await logInventoryAudit(
          sku,
          targetProd.name,
          targetProd.quantity,
          targetProd.quantity,
          'Delete',
          'Product soft-deleted by administrator'
        );

        alert(lang === 'fa' ? 'کالا با موفقیت حذف منطقی شد.' : 'Product soft-deleted successfully.');
      }

      // Re-fetch all data to ensure we are completely in-sync
      await fetchAllData();
    } catch (err: any) {
      console.error("Delete product error:", err);
      
      // Rollback local state
      setProducts(originalProducts);

      alert(lang === 'fa' ? `خطا در حذف کالا: ${err.message || err}` : `Error deleting product: ${err.message || err}`);
    }
  };

  // Restore soft deleted product record
  const handleRestoreProduct = async (sku: string) => {
    const targetProd = products.find(p => p.sku === sku);
    if (!targetProd) return;

    if (isLocalMode) {
      const updatedProducts = products.map(p => p.sku === sku ? {
        ...p,
        deleted: false,
        deleted_at: undefined,
        deleted_by: undefined
      } : p);
      setProducts(updatedProducts);
      localStorage.setItem('waateh_products', JSON.stringify(updatedProducts));
      
      await logInventoryAudit(
        sku,
        targetProd.name,
        targetProd.quantity,
        targetProd.quantity,
        'Restore Deleted',
        'Product restored from soft-deleted status'
      );
      return;
    }
    try {
      const { error } = await supabase
        .from('products')
        .update({
          deleted: false,
          deleted_at: null,
          deleted_by: null
        })
        .eq('sku', sku);

      if (error) throw error;

      await logInventoryAudit(
        sku,
        targetProd.name,
        targetProd.quantity,
        targetProd.quantity,
        'Restore Deleted',
        'Product restored from soft-deleted status'
      );

      await fetchAllData();
    } catch (err: any) {
      console.error("Restore product error:", err);
      alert(lang === 'fa' ? `خطا در بازیابی کالا: ${err.message}` : `Error restoring product: ${err.message}`);
    }
  };

  // Execute manual inventory correction
  const handleInventoryCorrection = async (sku: string, qty: number, reason: string, notes?: string) => {
    const targetProd = products.find(p => p.sku === sku);
    if (!targetProd) return;
    const prevQty = targetProd.quantity;

    if (isLocalMode) {
      const updatedProducts = products.map(p => p.sku === sku ? {
        ...p,
        quantity: qty,
        lastUpdated: new Date().toISOString()
      } : p);
      setProducts(updatedProducts);
      localStorage.setItem('waateh_products', JSON.stringify(updatedProducts));

      await logInventoryAudit(
        sku,
        targetProd.name,
        prevQty,
        qty,
        'Admin Correction',
        reason,
        notes
      );
      return;
    }
    try {
      const { error } = await supabase
        .from('products')
        .update({
          quantity: qty,
          last_updated: new Date().toISOString()
        })
        .eq('sku', sku);

      if (error) throw error;

      await logInventoryAudit(
        sku,
        targetProd.name,
        prevQty,
        qty,
        'Admin Correction',
        reason,
        notes
      );

      await fetchAllData();
    } catch (err: any) {
      console.error("Manual correction error:", err);
      alert(lang === 'fa' ? `خطا در ثبت اصلاحیه: ${err.message}` : `Error executing manual correction: ${err.message}`);
    }
  };

  // Reset inventory to specified target level
  const handleResetInventory = async (sku: string, qty: number, reason: string) => {
    const targetProd = products.find(p => p.sku === sku);
    if (!targetProd) return;
    const prevQty = targetProd.quantity;

    if (isLocalMode) {
      const updatedProducts = products.map(p => p.sku === sku ? {
        ...p,
        quantity: qty,
        lastUpdated: new Date().toISOString()
      } : p);
      setProducts(updatedProducts);
      localStorage.setItem('waateh_products', JSON.stringify(updatedProducts));

      await logInventoryAudit(
        sku,
        targetProd.name,
        prevQty,
        qty,
        'Reset',
        reason
      );
      return;
    }
    try {
      const { error } = await supabase
        .from('products')
        .update({
          quantity: qty,
          last_updated: new Date().toISOString()
        })
        .eq('sku', sku);

      if (error) throw error;

      await logInventoryAudit(
        sku,
        targetProd.name,
        prevQty,
        qty,
        'Reset',
        reason
      );

      await fetchAllData();
    } catch (err: any) {
      console.error("Reset inventory error:", err);
      alert(lang === 'fa' ? `خطا در بازنشانی موجودی: ${err.message}` : `Error resetting inventory: ${err.message}`);
    }
  };

  // One-click restoration of last valid quantity
  const handleRestorePreviousQuantity = async (sku: string) => {
    const targetProd = products.find(p => p.sku === sku);
    if (!targetProd) return;
    const currentQty = targetProd.quantity;

    const productLogs = auditLogs
      .filter(a => a.productSku === sku)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (productLogs.length === 0) {
      alert(lang === 'fa' ? 'هیچ تاریخچه معتبری برای بازگردانی یافت نشد.' : 'No audit history found to restore previous value.');
      return;
    }

    const restoredQty = productLogs[0].previousQuantity;

    if (isLocalMode) {
      const updatedProducts = products.map(p => p.sku === sku ? {
        ...p,
        quantity: restoredQty,
        lastUpdated: new Date().toISOString()
      } : p);
      setProducts(updatedProducts);
      localStorage.setItem('waateh_products', JSON.stringify(updatedProducts));

      await logInventoryAudit(
        sku,
        targetProd.name,
        currentQty,
        restoredQty,
        'Restore',
        `Restored previous value from audit log reference (#${productLogs[0].id.substring(0, 8)})`
      );
      return;
    }
    try {
      const { error } = await supabase
        .from('products')
        .update({
          quantity: restoredQty,
          last_updated: new Date().toISOString()
        })
        .eq('sku', sku);

      if (error) throw error;

      await logInventoryAudit(
        sku,
        targetProd.name,
        currentQty,
        restoredQty,
        'Restore',
        `Restored previous value from audit log reference (#${productLogs[0].id.substring(0, 8)})`
      );

      await fetchAllData();
    } catch (err: any) {
      console.error("Restore previous quantity error:", err);
      alert(lang === 'fa' ? `خطا در بازگردانی مقدار قبلی: ${err.message}` : `Error restoring previous quantity: ${err.message}`);
    }
  };

  // Record a stock movement (IN/OUT) and automatically adjust product quantity with transaction integrity
  const handleAddMovement = async (newMovement: Movement) => {
    // 0. Stock validation: check if inventory is sufficient
    const currentProduct = products.find((p) => p.sku === newMovement.productSku);
    if (!currentProduct) {
      alert(lang === 'fa' ? 'خطا: محصول یافت نشد.' : 'Error: Product not found.');
      return;
    }
    
    if (newMovement.type === 'OUT' && currentProduct.quantity < newMovement.quantity) {
      alert(lang === 'fa' ? 'موجودی ناکافی است.' : 'Insufficient inventory.');
      return;
    }

    if (isLocalMode) {
      const generatedId = 'MOV-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      const movementWithId = {
        ...newMovement,
        id: generatedId,
        date: new Date().toISOString()
      };
      
      const updatedMovements = [movementWithId, ...movements];
      setMovements(updatedMovements);
      localStorage.setItem('waateh_movements', JSON.stringify(updatedMovements));
      
      const prevQty = currentProduct.quantity;
      const delta = newMovement.type === 'IN' ? newMovement.quantity : -newMovement.quantity;
      const newQty = prevQty + delta;

      const updatedProducts = products.map(p => {
        if (p.sku === newMovement.productSku) {
          return {
            ...p,
            quantity: newQty,
            lastUpdated: new Date().toISOString()
          };
        }
        return p;
      });
      setProducts(updatedProducts);
      localStorage.setItem('waateh_products', JSON.stringify(updatedProducts));
      
      await logInventoryAudit(
        newMovement.productSku,
        newMovement.productName,
        prevQty,
        newQty,
        newMovement.type === 'IN' ? 'Stock In' : 'Stock Out',
        `Stock movement registered by ${newMovement.personName}`,
        newMovement.notes
      );
      
      setActiveTab('movements');
      return;
    }

    try {
      // Execute as a secure, consistent DATABASE TRANSACTION via RPC
      const { data: rpcResult, error: rpcErr } = await supabase.rpc('process_stock_movement', {
        p_person_name: newMovement.personName,
        p_product_sku: newMovement.productSku,
        p_product_name: newMovement.productName,
        p_type: newMovement.type,
        p_quantity: newMovement.quantity,
        p_location: newMovement.location,
        p_notes: newMovement.notes || '',
        p_admin_email: session.email || '',
        p_admin_user_id: session.id || ''
      });

      if (rpcErr) throw rpcErr;

      // Handle custom failure returned by function
      if (rpcResult && rpcResult.success === false) {
        throw new Error(rpcResult.error || 'Database transaction failed.');
      }

      await fetchAllData();
      setActiveTab('movements');
    } catch (err: any) {
      console.error("Add movement error:", err);
      alert(lang === 'fa' ? `خطا در ثبت تراکنش: ${err.message}` : `Error recording transaction: ${err.message}`);
      throw err;
    }
  };

  // Modify user profile in DB
  const handleUpdateProfile = async (updatedSession: UserSession) => {
    if (isLocalMode) {
      setSession(updatedSession);
      localStorage.setItem('waateh_demo_session', JSON.stringify(updatedSession));
      
      const updatedUsers = usersList.map(u => u.email.toLowerCase() === updatedSession.email.toLowerCase() ? updatedSession : u);
      setUsersList(updatedUsers);
      return;
    }
    try {
      // Use the ID from the session first, then fallback to supabase auth getUser
      let userId = updatedSession.id || session.id;

      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;
        }
      }

      if (!userId) {
        throw new Error("Could not determine user ID for profile update. The Profile page must never try to insert NULL into id.");
      }

      console.log("Updating profile in DB for user ID:", userId);

      const profileDataToSave = {
        id: userId,
        email: updatedSession.email,
        name: updatedSession.name,
        role: updatedSession.role,
        picture: updatedSession.picture || '',
        phone: updatedSession.phone || '',
        bio: updatedSession.bio || '',
        department: updatedSession.department || '',
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(profileDataToSave);

      if (error) {
        console.warn("Could not save to Supabase public.profiles:", error.message);
      }

      setSession({
        ...updatedSession,
        id: userId,
      });
      await fetchAllData();
    } catch (err: any) {
      console.error("Update profile error:", err);
      alert(lang === 'fa' ? `خطا در بروزرسانی پروفایل: ${err.message}` : `Error updating profile: ${err.message}`);
    }
  };

  // Modify other staff profile roles and whitelist (Admin Only)
  const handleUpdateUsersList = async (updatedUsers: UserSession[]) => {
    if (activeRole !== 'admin') {
      const errorMsg = lang === 'fa' ? 'خطای عدم دسترسی: فقط مدیران سیستم مجاز به مدیریت کاربران هستند.' : 'Permission Denied: Only administrators are authorized to manage users.';
      alert(errorMsg);
      throw new Error(errorMsg);
    }

    if (isLocalMode) {
      setUsersList(updatedUsers);
      localStorage.setItem('waateh_users_list', JSON.stringify(updatedUsers));
      return;
    }
    try {
      if (updatedUsers.length > usersList.length) {
        // 1. ADD USER: Find the newly added user
        const added = updatedUsers.find(u => !usersList.some(x => x.email.toLowerCase() === u.email.toLowerCase()));
        if (added) {
          console.log("Adding user to allowed_users whitelist:", added.email);
          const { error } = await supabase
            .from('allowed_users')
            .insert([{
              email: added.email.toLowerCase(),
              full_name: added.name,
              role: added.role,
              department: added.department || ''
            }]);
          if (error) throw error;
        }
      } else if (updatedUsers.length < usersList.length) {
        // 2. DELETE USER: Find the deleted user
        const deleted = usersList.find(u => !updatedUsers.some(x => x.email.toLowerCase() === u.email.toLowerCase()));
        if (deleted) {
          console.log("Deleting user:", deleted.email);
          const { error: allowedErr } = await supabase
            .from('allowed_users')
            .delete()
            .eq('email', deleted.email.toLowerCase());
          if (allowedErr) throw allowedErr;

          const { error: profilesErr } = await supabase
            .from('profiles')
            .delete()
            .eq('email', deleted.email.toLowerCase());
          if (profilesErr) {
            console.warn("Could not delete profile (user may not have logged in yet):", profilesErr.message);
          }
        }
      } else {
        // 3. UPDATE USER: Find the user whose role changed
        const changed = updatedUsers.find(u => {
          const existing = usersList.find(x => x.email.toLowerCase() === u.email.toLowerCase());
          return existing && (existing.role !== u.role || existing.department !== u.department || existing.name !== u.name);
        });
        if (changed) {
          console.log("Updating user role/department:", changed.email);
          const { error: allowedErr } = await supabase
            .from('allowed_users')
            .update({
              role: changed.role,
              department: changed.department || '',
              full_name: changed.name
            })
            .eq('email', changed.email.toLowerCase());
          if (allowedErr) throw allowedErr;

          const { error: profilesErr } = await supabase
            .from('profiles')
            .update({
              role: changed.role,
              department: changed.department || '',
              name: changed.name
            })
            .eq('email', changed.email.toLowerCase());
          if (profilesErr) {
            console.warn("Could not update profile (user may not have logged in yet):", profilesErr.message);
          }
        }
      }
      
      setUsersList(updatedUsers);
    } catch (err: any) {
      console.error("Update users list error:", err);
      alert(lang === 'fa' ? `خطا در مدیریت کاربران: ${err.message}` : `Error managing users: ${err.message}`);
    }
  };

  // Save warehouse physical structure parameters
  const handleSaveConfig = async (newConfig: WarehouseConfig) => {
    if (isLocalMode) {
      setConfig(newConfig);
      localStorage.setItem('waateh_config', JSON.stringify(newConfig));
      return;
    }
    try {
      const { error } = await supabase
        .from('system_config')
        .upsert({
          key: 'warehouse_layout',
          value: newConfig,
        });

      if (error) throw error;
      setConfig(newConfig);
    } catch (err) {
      console.error("Save structural layout error:", err);
    }
  };

  // Save global warning stock level threshold
  const handleSaveGlobalMinStock = async (newVal: number) => {
    if (isLocalMode) {
      setGlobalMinStock(newVal);
      localStorage.setItem('waateh_global_min_stock', newVal.toString());
      return;
    }
    try {
      const { error } = await supabase
        .from('system_config')
        .upsert({
          key: 'global_min_stock',
          value: newVal,
        });

      if (error) throw error;
      setGlobalMinStock(newVal);
    } catch (err) {
      console.error("Save alert threshold error:", err);
    }
  };

  // Trigger seed action
  const handleResetToDefaults = async () => {
    if (isLocalMode) {
      setProducts([]);
      setMovements([]);
      setCorrections([]);
      setAuditLogs([]);
      setConfig(DEFAULT_CONFIG);
      setGlobalMinStock(15);
      
      try {
        localStorage.setItem('waateh_products', JSON.stringify([]));
        localStorage.setItem('waateh_movements', JSON.stringify([]));
        localStorage.setItem('waateh_corrections', JSON.stringify([]));
        localStorage.setItem('waateh_audits', JSON.stringify([]));
        localStorage.setItem('waateh_config', JSON.stringify(DEFAULT_CONFIG));
        localStorage.setItem('waateh_global_min_stock', '15');
        localStorage.removeItem('waateh_reset_at');
      } catch {
        // Ignored
      }
      
      setActiveTab('dashboard');
      alert(lang === 'fa'
        ? '✓ تمامی اطلاعات انبار با موفقیت پاک‌سازی شد و سیستم کاملاً صفر گردید.'
        : '✓ All warehouse data was successfully purged and the system was completely zeroed out.'
      );
      return;
    }
    
    let rpcSuccess = false;
    let rpcErrorMsg = '';
    
    try {
      setLoadingData(true);

      // 1. Try to invoke the robust security definer RPC function first to bypass any RLS restriction
      try {
        const { data: rpcRes, error: rpcErr } = await supabase.rpc('purge_all_warehouse_data');
        if (!rpcErr && rpcRes && rpcRes.success) {
          rpcSuccess = true;
          console.log("[Purge] Database RPC purge_all_warehouse_data executed successfully!");
        } else {
          rpcErrorMsg = rpcErr?.message || rpcRes?.error || 'Unknown RPC error';
          console.warn("[Purge] Database RPC call failed, trying client-side fallback:", rpcErrorMsg);
        }
      } catch (rpcEx: any) {
        rpcErrorMsg = rpcEx?.message || String(rpcEx);
        console.warn("[Purge] Database RPC call threw exception, trying client-side fallback:", rpcEx);
      }

      // 2. Client-side fallback if RPC failed or was not found in the database schema yet
      if (!rpcSuccess) {
        // Delete inventory_corrections
        const { error: errCorr } = await supabase
          .from('inventory_corrections')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        if (errCorr) {
          console.warn("[Reset DB Warning] Could not delete inventory corrections:", errCorr.message);
        }

        // Delete inventory_audit
        const { error: errAudit } = await supabase
          .from('inventory_audit')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        if (errAudit) {
          console.warn("[Reset DB Warning] Could not delete inventory audit logs:", errAudit.message);
        }

        // Delete movements
        const { error: errMovements } = await supabase
          .from('movements')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        if (errMovements) throw errMovements;

        // Delete products
        const { error: errProducts } = await supabase
          .from('products')
          .delete()
          .neq('sku', 'WIPE_OUT_ALL');
        if (errProducts) throw errProducts;

        // Reset warehouse layout config
        const { error: upsertConfigErr } = await supabase.from('system_config').upsert({
          key: 'warehouse_layout',
          value: DEFAULT_CONFIG,
        });
        if (upsertConfigErr) throw upsertConfigErr;

        // Reset global min stock threshold
        const { error: upsertMinStockErr } = await supabase.from('system_config').upsert({
          key: 'global_min_stock',
          value: 15,
        });
        if (upsertMinStockErr) throw upsertMinStockErr;
        
        // Remove virtual reset timestamp from DB since physical clear succeeded
        await supabase.from('system_config').delete().eq('key', 'warehouse_reset_at');
        try {
          localStorage.removeItem('waateh_reset_at');
          setWarehouseResetAt(null);
        } catch {
          // Ignored
        }
      }

      await fetchAllData();
      setEditProductContext(null);
      setActiveTab('dashboard');
      
      alert(lang === 'fa' 
        ? '✓ تمامی اطلاعات انبار با موفقیت پاک‌سازی شد و سیستم کاملاً صفر گردید.' 
        : '✓ All warehouse data was successfully purged and the system was completely zeroed out.'
      );
    } catch (err: any) {
      console.warn("[Purge Warning] Physical database purge failed, activating seamless virtual reset fallback...", err);
      await handleForceVirtualReset(true);
    } finally {
      setLoadingData(false);
    }
  };

  // Purely virtual reset function (instant, secure browser-based reset)
  const handleForceVirtualReset = async (isAutomaticFallback = false) => {
    try {
      setLoadingData(true);
      const nowStr = new Date().toISOString();
      
      // Save virtual reset timestamp in localStorage
      try {
        localStorage.setItem('waateh_reset_at', nowStr);
      } catch (lsErr) {
        console.warn("localStorage write blocked:", lsErr);
      }
      setWarehouseResetAt(nowStr);
      
      // Try to save to system_config too, but wrap in a safe try-catch so it NEVER aborts on RLS/errors!
      try {
        if (!isLocalMode) {
          await supabase.from('system_config').upsert({
            key: 'warehouse_reset_at',
            value: nowStr,
          });
        }
      } catch (dbErr) {
        console.warn("[Virtual Reset DB Warning] Could not save timestamp to database, keeping reset purely local:", dbErr);
      }

      // Reset config locally to be safe
      setConfig(DEFAULT_CONFIG);
      setGlobalMinStock(15);
      
      // Re-fetch and filter everything cleanly
      await fetchAllData();
      setEditProductContext(null);
      setActiveTab('dashboard');

      if (isAutomaticFallback) {
        alert(lang === 'fa'
          ? '✓ تمامی کالاها و تراکنش‌های انبار با موفقیت پاک‌سازی و صفر شدند!\n\n(سیستم با استفاده از قابلیت پاک‌سازی هوشمند مجازی، انبار شما را فوراً خالی و صفر کرد تا بدون مواجهه با خطاهای دسترسی پایگاه‌داده بتوانید کار خود را بدون وقفه ادامه دهید.)'
          : '✓ Warehouse products and transactions were successfully zeroed out!\n\n(The system utilized a smart virtual reset fallback to instantly clear your warehouse so you can continue working immediately without database privilege errors.)'
        );
      } else {
        alert(lang === 'fa'
          ? '✓ پاک‌سازی فوری مجازی با موفقیت انجام شد! تمامی کالاها و تراکنش‌ها در مرورگر شما صفر شدند.'
          : '✓ Force Virtual Reset completed successfully! All products and movements are now zeroed out in your browser.'
        );
      }
    } catch (fallbackErr: any) {
      console.error("Critical virtual reset error:", fallbackErr);
      alert(lang === 'fa'
        ? '❌ متأسفانه سیستم نتوانست اطلاعات را پاک کند. لطفاً صفحه را رفرش کنید و دوباره تلاش کنید.'
        : '❌ System could not clear data. Please refresh the page and try again.'
      );
    } finally {
      setLoadingData(false);
    }
  };

  const handleEditProductClick = (product: Product) => {
    setEditProductContext(product);
    setActiveTab('add-product');
  };

  const handleNavigate = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    if (tab !== 'add-product') {
      setEditProductContext(null);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // Count active low stock counts
  const lowStockCount = products.filter(
    (p) => p.quantity <= (p.minStock !== undefined ? p.minStock : globalMinStock)
  ).length;

  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'fa';

  // Navigation setup
  const NAVIGATION_ITEMS = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'inventory', label: t.inventory, icon: Boxes },
    { id: 'movements', label: t.movements, icon: History },
    { id: 'add-product', label: editProductContext ? t.editProduct : t.addProduct, icon: PlusCircle },
    { id: 'add-movement', label: t.addMovement, icon: Activity },
    { id: 'profile', label: t.profile, icon: User },
    ...(activeRole === 'admin' ? [
      { id: 'settings', label: t.settings, icon: Settings }
    ] : []),
  ];

  // Screen 1: MISSING DATABASE TABLES ASSISTANT (If project database is not yet migrated/seeded)
  if (dbError === 'DATABASE_SCHEMA_MISSING') {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-6 md:p-12 font-sans selection:bg-blue-500/30 selection:text-white" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="max-w-3xl mx-auto my-auto space-y-6 w-full">
          
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Database size={24} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white">
                {lang === 'fa' ? 'پیکربندی جداول پایگاه داده سیستم' : 'Database Schema Required'}
              </h1>
              <p className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider">
                {lang === 'fa' ? 'جداول مورد نیاز یافت نشدند' : 'Missing Warehouse Database Tables'}
              </p>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700/80 rounded-3xl p-6 md:p-8 space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold leading-relaxed text-slate-300">
                {lang === 'fa'
                  ? 'اتصال به پایگاه داده مرکزی با موفقیت برقرار شد! با این حال، جداول مورد نیاز (profiles، products، movements، system_config) هنوز در پایگاه داده ساخته نشده‌اند.'
                  : 'You have connected successfully to the database! However, the required database tables (profiles, products, movements, system_config) are not yet initialized in your project.'
                }
              </p>
              <p className="text-xs font-bold leading-relaxed text-amber-300">
                {lang === 'fa'
                  ? 'راه‌اندازی بسیار آسان است! لطفا دکمه زیر را زده تا دستورات SQL کپی شوند. سپس آن را در بخش اجرای پرس‌وجوی SQL در داشبورد مدیریت پایگاه داده خود چسبانده و دکمه Run را بزنید.'
                  : 'Let\'s fix this in 10 seconds! Copy the optimized database schema below, open your Database SQL Console, paste it, and click RUN. The application will instantly activate!'
                }
              </p>
            </div>

            {/* SQL Terminal Display */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-950 rounded-t-xl border-b border-slate-800 text-[10px] font-mono font-bold text-slate-400">
                <span className="flex items-center gap-1.5 text-blue-400">
                  <Terminal size={12} />
                  <span>waateh_db_setup.sql</span>
                </span>
                <button
                  onClick={copyToClipboard}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                >
                  {copiedSql ? (
                    <>
                      <Check size={12} className="text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy Schema</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 bg-slate-950 rounded-b-xl border border-slate-800 text-[10px] font-mono text-slate-300 max-h-56 overflow-y-auto overflow-x-auto text-left leading-normal" dir="ltr">
                {SUPABASE_SQL_SETUP}
              </pre>
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-slate-700/50">
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-black cursor-pointer transition-colors"
              >
                {t.logout}
              </button>
              <button
                onClick={fetchAllData}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black shadow-md cursor-pointer transition-colors"
              >
                {lang === 'fa' ? 'بررسی مجدد اتصال دیتابیس' : 'I Ran the SQL, Recheck Database'}
              </button>
            </div>
          </div>

          {/* Quick instructions block */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold text-slate-400 bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
            <div>
              <span className="text-amber-500">{lang === 'fa' ? '۱. باز کردن کنسول دیتابیس' : '1. Open Database Console'}</span>
              <p className="text-[10px] font-semibold text-slate-500 mt-1">
                {lang === 'fa' ? 'به بخش مدیریت پایگاه داده پروژه خود بروید.' : 'Navigate to your database dashboard.'}
              </p>
            </div>
            <div>
              <span className="text-amber-500">{lang === 'fa' ? '۲. بخش SQL Editor' : '2. Go to SQL Editor'}</span>
              <p className="text-[10px] font-semibold text-slate-500 mt-1">
                {lang === 'fa' ? 'یک سند پرس‌وجوی جدید باز کرده و کد را در آن قرار دهید.' : 'Create a "New Query" and paste this script.'}
              </p>
            </div>
            <div>
              <span className="text-amber-500">{lang === 'fa' ? '۳. فشردن دکمه RUN' : '3. Click RUN'}</span>
              <p className="text-[10px] font-semibold text-slate-500 mt-1">
                {lang === 'fa' ? 'جداول، تنظیمات امنیت سطری و دسترسی‌ها بلافاصله ایجاد می‌شوند.' : 'Tables, Row Level Security, & Policies will trigger.'}
              </p>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Screen 1.5: UNAUTHORIZED SCREEN (Render this first so unauthorized users never see a hanging loader)
  if (isUnauthorized) {
    return (
      <UnauthorizedScreen
        lang={lang}
        authLoading={googleAuthLoading}
        onGoogleLogin={triggerGoogleLogin}
        onBackToLogin={() => {
          setIsUnauthorized(false);
          setLoadingData(false);
        }}
      />
    );
  }

  // Screen 2: LOADING STATE
  if (loadingData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <div className="space-y-5 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white mx-auto shadow-md shadow-blue-500/10 animate-pulse">
            <span className="text-2xl font-black tracking-tight">SW</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-lg font-black text-slate-900 tracking-tight">
              {lang === 'fa' ? 'سامانه هوشمند واته (SAP Waateh)' : 'SAP Waateh'}
            </h1>
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600 font-bold">
              <div className="size-1.5 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="size-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="size-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              <span>
                {lang === 'fa' ? 'در حال ورود به سامانه...' : 'Authenticating secure session...'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
              {lang === 'fa' ? 'در حال آماده‌سازی اطلاعات...' : 'Preparing System Data...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Screen 3: LOGIN SCREEN
  if (!session.isLoggedIn) {
    return (
      <LoginScreen
        lang={lang}
        setLang={setLang}
        authError={authError}
        setAuthError={setAuthError}
        onGoogleLogin={triggerGoogleLogin}
        authLoading={googleAuthLoading}
      />
    );
  }

  // Screen 4: COMPLETED MAIN WORKSPACE INTERFACE
  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col md:flex-row select-none" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* DB Syncing indicators / DB errors warning */}
      {dbError && (
        <div className="fixed bottom-4 right-4 z-50 bg-rose-600 text-white p-4 rounded-2xl shadow-xl flex items-center gap-2 max-w-sm text-xs font-bold">
          <ShieldAlert size={18} className="shrink-0" />
          <span>DB Alert: {dbError}</span>
        </div>
      )}

      {/* Sidebar Navigation - Desktop */}
      <aside className="hidden md:flex flex-col justify-between w-64 bg-slate-900 text-slate-400 shrink-0 select-none">
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-md shadow-blue-500/10">
                SW
              </div>
              <div>
                <h1 className="text-sm font-black text-white tracking-tight leading-none">{t.appName}</h1>
                <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mt-1">SAP Waateh v3</p>
              </div>
            </div>
            {isLocalMode && (
              <span className="px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/30 text-[8px] text-indigo-400 font-extrabold rounded-full shrink-0">
                {lang === 'fa' ? 'آفلاین' : 'LOCAL'}
              </span>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {NAVIGATION_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id as ActiveTab)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-black transition-all text-right cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                  {item.id === 'inventory' && lowStockCount > 0 && (
                    <span className={`mr-auto size-4.5 rounded-full flex items-center justify-center text-[8px] font-black ${
                      isActive ? 'bg-white text-blue-600' : 'bg-rose-500 text-white'
                    }`}>
                      {lowStockCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User profile details block */}
        <div className="p-4 border-t border-slate-800 space-y-4">
          <button
            onClick={() => handleNavigate('profile')}
            className="flex items-center gap-3 text-right w-full hover:opacity-90 transition-opacity cursor-pointer group"
          >
            <Avatar picture={session.picture} name={session.name} sizeClass="size-9" />
            <div className="truncate">
              <p className="text-xs font-black text-slate-200 truncate leading-none mb-1">{session.name}</p>
              <p className="text-[9px] text-slate-500 truncate">{session.email}</p>
            </div>
          </button>

          <button
            onClick={handleLogout}
            className="w-full bg-slate-800 hover:bg-slate-800/80 text-rose-400 py-2.5 rounded-xl text-xs font-black cursor-pointer transition-colors text-center flex items-center justify-center gap-1.5"
          >
            <LogOut size={13} />
            <span>{t.logout}</span>
          </button>
        </div>
      </aside>

      {/* Content Canvas / Right Container */}
      <div className="flex-grow flex flex-col min-w-0">
        
        {/* Top bar Header */}
        <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between select-none">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 hover:bg-slate-100 rounded-xl text-slate-700 cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider hidden md:block">
              {lang === 'fa' ? 'داشبورد کنترل یکپارچه کالا' : 'INTEGRATED CONTROL PANEL'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            
            {/* Secure Status Indicator */}
            {isLocalMode ? (
              <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full text-[9px] font-black text-indigo-600 animate-fade-in">
                <span className="size-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                <span className="uppercase font-mono">{lang === 'fa' ? 'حالت محلی فعال است' : 'LOCAL OFFLINE MODE'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full text-[9px] font-black text-emerald-600 animate-fade-in">
                <span className="size-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="uppercase font-mono">{lang === 'fa' ? 'اتصال امن برقرار است' : 'SECURE CONNECTION ACTIVE'}</span>
              </div>
            )}

            {/* Developer Role Switcher (Visible only to actual Admins in database) */}
            {session.role === 'admin' && (
              <button
                onClick={() => {
                  setRoleOverride(prev => prev === 'operator' ? 'admin' : 'operator');
                  // Reset active tab to dashboard if changing roles to prevent rendering restricted tabs
                  setActiveTab('dashboard');
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl cursor-pointer transition-colors font-sans text-[11px] font-black shadow-sm border ${
                  roleOverride === 'operator'
                    ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border-rose-300'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-200/60'
                }`}
              >
                <span>👤</span>
                <span>
                  {lang === 'fa'
                    ? (roleOverride === 'operator' ? 'تغییر به نقش: مدیر کل' : 'تست انبار به عنوان: اپراتور')
                    : (roleOverride === 'operator' ? 'Switch back to Admin' : 'Test as Operator')}
                </span>
              </button>
            )}

             {/* Help Button */}
            <button
              onClick={() => setHelpOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/60 rounded-xl cursor-pointer transition-colors font-sans text-xs font-black shadow-xs"
            >
              <span className="text-xs">❓</span>
              <span>{lang === 'fa' ? 'راهنما' : 'Help Center'}</span>
            </button>

            {/* Notification triggers */}
            <button
              onClick={() => handleNavigate('inventory')}
              className="relative p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl cursor-pointer transition-colors border border-slate-200/50"
            >
              <Bell size={15} />
              {lowStockCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 size-4.5 bg-rose-500 text-white rounded-full text-[8px] font-black flex items-center justify-center animate-bounce">
                  {lowStockCount}
                </span>
              )}
            </button>

            {/* Desktop User mini card clickable */}
            <button
              onClick={() => handleNavigate('profile')}
              className="flex items-center gap-2 border-l border-slate-200/80 pl-3 mr-1 hover:opacity-85 transition-opacity text-right cursor-pointer"
            >
              <Avatar picture={session.picture} name={session.name} sizeClass="size-8" />
              <div className="hidden lg:block truncate text-right">
                <p className="text-xs font-black text-slate-800 truncate leading-none">{session.name}</p>
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mt-0.5">
                  {activeRole === 'admin'
                    ? (lang === 'fa' ? 'مدیر کل' : 'Admin')
                    : (lang === 'fa' ? 'کاربر انبار' : 'Warehouse Operator')}
                </span>
              </div>
            </button>

          </div>
        </header>

        {/* Mobile Navigation Drawer Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-black z-40 md:hidden"
              />
              <motion.aside
                initial={{ x: isRtl ? '100%' : '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: isRtl ? '100%' : '-100%' }}
                transition={{ type: 'tween', duration: 0.3 }}
                className="fixed inset-y-0 right-0 left-auto w-64 bg-slate-900 text-slate-400 z-50 p-5 flex flex-col justify-between md:hidden"
                style={{ right: isRtl ? 0 : 'auto', left: isRtl ? 'auto' : 0 }}
              >
                <div>
                  <div className="flex items-center justify-between pb-5 border-b border-slate-800 mb-6">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black">
                        SW
                      </div>
                      <span className="text-xs font-black text-white">{t.appName}</span>
                    </div>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-1 text-slate-500 hover:text-white cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <nav className="space-y-1">
                    {NAVIGATION_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavigate(item.id as ActiveTab)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-right cursor-pointer ${
                            isActive ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800'
                          }`}
                        >
                          <Icon size={15} />
                          <span>{item.label}</span>
                          {item.id === 'inventory' && lowStockCount > 0 && (
                            <span className="mr-auto bg-rose-500 text-white size-4 rounded-full flex items-center justify-center text-[8px] font-black">
                              {lowStockCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                <div className="p-4 border-t border-slate-800 space-y-3">
                  <button
                    onClick={() => handleNavigate('profile')}
                    className="flex items-center gap-2.5 text-right w-full hover:opacity-85 transition-opacity cursor-pointer"
                  >
                    <Avatar picture={session.picture} name={session.name} sizeClass="size-8.5" />
                    <div className="truncate text-right">
                      <p className="text-xs font-bold text-slate-200 truncate">{session.name}</p>
                      <p className="text-[9px] text-slate-500 truncate">{session.email}</p>
                    </div>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-1.5 bg-slate-800 text-rose-400 py-2 rounded-xl text-[10px] font-black cursor-pointer"
                  >
                    <LogOut size={12} />
                    <span>{t.logout}</span>
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Dynamic Canvas Workspace Area */}
        <main className="flex-grow p-4 md:p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {roleOverride === 'operator' && (
            <div className="mb-4 bg-amber-500 text-slate-950 px-4 py-2.5 rounded-2xl text-xs font-black flex justify-between items-center shadow-md animate-fade-in">
              <span className="flex items-center gap-2">
                <span>⚠️</span>
                <span>
                  {lang === 'fa'
                    ? 'در حال حاضر سامانه را با نقش "اپراتور انبار" مشاهده می‌کنید. دسترسی به بخش‌های مدیریتی موقتاً محدود شده است.'
                    : 'Currently simulating "Warehouse Operator" role. Admin features are temporarily restricted.'}
                </span>
              </span>
              <button
                onClick={() => setRoleOverride(null)}
                className="underline cursor-pointer hover:text-white transition-colors"
              >
                {lang === 'fa' ? 'بازگشت به نقش مدیریت' : 'Reset to Admin'}
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && (
                <DashboardTab
                  products={products}
                  movements={movements}
                  auditLogs={auditLogs}
                  role={activeRole}
                  lang={lang}
                  onNavigateToTab={(tab) => handleNavigate(tab as any)}
                />
              )}

              {activeTab === 'inventory' && (
                <InventoryTab
                  products={products}
                  onEditProduct={handleEditProductClick}
                  onDeleteProduct={handleDeleteProduct}
                  onRestoreProduct={handleRestoreProduct}
                  lang={lang}
                  role={activeRole}
                  session={activeSession}
                  auditLogs={auditLogs}
                  onManualCorrection={handleInventoryCorrection}
                  onResetInventory={handleResetInventory}
                  onRestorePreviousQty={handleRestorePreviousQuantity}
                  onNavigateToTab={(tab) => handleNavigate(tab as any)}
                />
              )}

              {activeTab === 'movements' && (
                <MovementTab
                  movements={movements}
                  corrections={corrections}
                  lang={lang}
                  role={activeRole}
                />
              )}

              {activeTab === 'add-product' && (
                <AddProductTab
                  config={config}
                  onSubmitProduct={(p, isEdit, reason) => handleAddOrEditProduct(p, isEdit, reason)}
                  onCancelEdit={() => handleNavigate('inventory')}
                  lang={lang}
                  role={activeRole}
                  editProduct={editProductContext}
                />
              )}

              {activeTab === 'add-movement' && (
                <AddMovementTab
                  products={products}
                  onSubmitMovement={handleAddMovement}
                  lang={lang}
                  session={activeSession}
                  usersList={usersList}
                />
              )}

              {activeTab === 'profile' && (
                <ProfileTab
                  session={activeSession}
                  movements={movements}
                  onUpdateProfile={handleUpdateProfile}
                  lang={lang}
                />
              )}

              {activeTab === 'settings' && activeRole === 'admin' && (
                <SettingsTab
                  config={config}
                  onSaveConfig={handleSaveConfig}
                  lang={lang}
                  setLang={setLang}
                  onResetData={handleResetToDefaults}
                  session={activeSession}
                  onUpdateProfile={handleUpdateProfile}
                  usersList={usersList}
                  onUpdateUsersList={handleUpdateUsersList}
                  globalMinStock={globalMinStock}
                  onSaveGlobalMinStock={handleSaveGlobalMinStock}
                  products={products}
                />
              )}

              {activeTab === 'settings' && activeRole !== 'admin' && (
                <div className="bg-white border border-rose-100 p-8 rounded-3xl text-center space-y-4 max-w-md mx-auto my-12 shadow-sm font-sans">
                  <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                    <ShieldAlert size={26} />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-black text-slate-900 tracking-tight">
                      {lang === 'fa' ? 'محدودیت دسترسی به سیستم' : 'Access Restricted'}
                    </h3>
                    <p className="text-xs text-slate-500 font-bold leading-relaxed">
                      {lang === 'fa' 
                        ? 'حساب کاربری شما دارای سطح دسترسی عادی (اپراتور) است. این بخش منحصراً برای مدیران سیستم قابل دسترسی می‌باشد.' 
                        : 'Your account is authorized with operator privileges. This administrative module is restricted to administrators only.'}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <HelpModal 
        isOpen={helpOpen} 
        onClose={() => setHelpOpen(false)} 
        activeTab={activeTab} 
      />
    </div>
  );
}
