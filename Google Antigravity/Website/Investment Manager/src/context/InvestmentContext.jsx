/**
 * InvestmentContext.jsx - Investment Data Management & Firestore Sync
 * 
 * This is the core state management for the investment planning features.
 * It handles:
 * 1. Currency accounts (THB/USD) with amounts
 * 2. Investment allocations with percentage-based calculations
 * 3. DCA (Dollar Cost Averaging) schedules with completion tracking
 * 4. Real-time sync with Firebase Firestore
 * 
 * Key Features:
 * - Auto-save: Changes are saved 1 second after the last edit (debounced)
 * - Smart save: Only saves if data actually changed
 * - Real-time sync: Uses Firestore onSnapshot for cross-device sync
 * - Offline support: Works offline, syncs when back online
 * 
 * Data Flow:
 * 1. User logs in → loads data from Firestore
 * 2. User makes changes → local state updates immediately
 * 3. After 1 second of no changes → saves to Firestore
 * 4. Other devices receive update via onSnapshot
 * 
 * Usage:
 *   const { accounts, addAccount, investments, isLoading } = useInvestment();
 */

import { createContext, useContext, useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

// Create the investment context
const InvestmentContext = createContext();

/**
 * Custom hook to access investment state and methods
 * Must be used within an InvestmentProvider
 */
export const useInvestment = () => {
    const context = useContext(InvestmentContext);
    if (!context) {
        throw new Error('useInvestment must be used within an InvestmentProvider');
    }
    return context;
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Custom hook for debouncing function calls
 * Used to delay saving to Firestore until user stops making changes
 * 
 * @param {Function} callback - Function to call after delay
 * @param {number} delay - Delay in milliseconds
 */
const useDebounce = (callback, delay) => {
    const timeoutRef = useState(null);

    return useCallback((...args) => {
        // Clear any existing timeout
        if (timeoutRef[0]) {
            clearTimeout(timeoutRef[0]);
        }
        // Set new timeout
        timeoutRef[0] = setTimeout(() => {
            callback(...args);
        }, delay);
    }, [callback, delay]);
};

/**
 * Deep comparison of two objects using JSON serialization
 * Used to check if data has actually changed before saving
 */
const isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// =============================================================================
// INVESTMENT PROVIDER
// =============================================================================

export const InvestmentProvider = ({ children }) => {
    // Get current user from auth context
    const { user } = useAuth();

    // -------------------------------------------------------------------------
    // STATE
    // -------------------------------------------------------------------------

    // Exchange rate: How many THB per 1 USD (default: 32)
    const [exchangeRate, setExchangeRate] = useState(32);

    // Currency accounts - array of { id, name, currency, amount }
    const [accounts, setAccounts] = useState([]);

    // Investments - array of investment objects (see data model below)
    const [investments, setInvestments] = useState([]);

    // Loading state: true while fetching data from Firestore
    const [isLoading, setIsLoading] = useState(true);

    // Syncing state: true while saving to Firestore
    const [isSyncing, setIsSyncing] = useState(false);

    // Last successful sync timestamp
    const [lastSyncTime, setLastSyncTime] = useState(null);

    // Flag to prevent saving during initial data load
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Ref to track last saved data (for change detection)
    const lastSavedData = useRef({ exchangeRate: 32, accounts: [], investments: [] });

    // -------------------------------------------------------------------------
    // FIRESTORE SYNC
    // -------------------------------------------------------------------------

    /**
     * Save data to Firestore
     * Only saves if data has actually changed from last save
     */
    const saveToFirestore = useCallback(async (data) => {
        if (!user) return;

        // Check if data actually changed - skip save if identical
        if (isEqual(data, lastSavedData.current)) {
            console.log('No changes detected, skipping save');
            return;
        }

        setIsSyncing(true);
        try {
            // Save to users/{userId} document
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, {
                exchangeRate: data.exchangeRate,
                accounts: data.accounts,
                investments: data.investments,
                updatedAt: new Date().toISOString()
            }, { merge: true });  // merge: true keeps other fields

            // Update reference to track what was saved
            lastSavedData.current = { ...data };
            setLastSyncTime(new Date());
            console.log('Data saved to Firestore');
        } catch (error) {
            console.error('Error saving to Firestore:', error);
        } finally {
            setIsSyncing(false);
        }
    }, [user]);

    // Create debounced version - saves 1 second after last change
    const debouncedSave = useDebounce(saveToFirestore, 1000);

    /**
     * Effect: Auto-save when data changes
     * Triggers after any change to accounts, investments, or exchange rate
     * Skipped during initial load to prevent echo saves
     */
    useEffect(() => {
        if (!user || isInitialLoad) return;

        const currentData = { exchangeRate, accounts, investments };

        // Only trigger save if data actually changed
        if (!isEqual(currentData, lastSavedData.current)) {
            debouncedSave(currentData);
        }
    }, [exchangeRate, accounts, investments, user, isInitialLoad, debouncedSave]);

    /**
     * Effect: Load data from Firestore when user logs in
     * Uses onSnapshot for real-time updates (cross-device sync)
     */
    useEffect(() => {
        if (!user) {
            // User logged out - clear all data
            setAccounts([]);
            setInvestments([]);
            setExchangeRate(32);
            setIsLoading(false);
            setIsInitialLoad(true);
            return;
        }

        setIsLoading(true);
        const userDocRef = doc(db, 'users', user.uid);

        // Set up real-time listener - fires on initial load AND on any changes
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                console.log('Loaded data from Firestore:', data);

                // Update state with loaded data
                if (data.exchangeRate !== undefined) {
                    setExchangeRate(data.exchangeRate);
                }
                if (data.accounts) {
                    setAccounts(data.accounts);
                }
                if (data.investments) {
                    setInvestments(data.investments);
                }

                // Update lastSavedData to match (prevents unnecessary re-saves)
                lastSavedData.current = {
                    exchangeRate: data.exchangeRate ?? 32,
                    accounts: data.accounts ?? [],
                    investments: data.investments ?? []
                };
            } else {
                console.log('No existing data in Firestore, starting fresh');
                lastSavedData.current = { exchangeRate: 32, accounts: [], investments: [] };
            }

            setIsLoading(false);
            // Brief delay before enabling saves to prevent echo
            setTimeout(() => setIsInitialLoad(false), 100);
        }, (error) => {
            console.error('Error loading from Firestore:', error);
            setIsLoading(false);
            setIsInitialLoad(false);
        });

        // Cleanup: unsubscribe when user changes or component unmounts
        return () => unsubscribe();
    }, [user]);

    // -------------------------------------------------------------------------
    // CURRENCY CONVERSION
    // -------------------------------------------------------------------------

    /**
     * Convert amount to THB (base currency for calculations)
     * All internal calculations use THB for consistency
     */
    const toTHB = (amount, currency) => {
        if (currency === 'THB') return amount;
        return amount * exchangeRate; // USD to THB
    };

    /**
     * Convert THB back to original currency for display
     */
    const fromTHB = (thbAmount, currency) => {
        if (currency === 'THB') return thbAmount;
        return thbAmount / exchangeRate; // THB to USD
    };

    // -------------------------------------------------------------------------
    // INVESTMENT COST CALCULATION
    // -------------------------------------------------------------------------

    /**
     * Calculate cost allocation for a single investment
     * 
     * Logic:
     * 1. Calculate needed amount = percentage × total funds (in THB)
     * 2. Allocate from accounts in priority order
     * 3. If account A has enough, take from A only
     * 4. If not, take what A has, then continue to B, etc.
     * 
     * @param {Object} investment - The investment to calculate
     * @param {Object} availableBalances - Map of accountId → available amount
     * @param {number} originalTotalTHB - Total funds in THB
     * @returns {{ costs: Object, couldFullyAllocate: boolean }}
     */
    const calculateInvestmentCost = (investment, availableBalances, originalTotalTHB) => {
        const percentage = Number(investment.percentage) || 0;
        if (percentage <= 0) return { costs: {}, couldFullyAllocate: true };

        if (originalTotalTHB <= 0) {
            return { costs: {}, couldFullyAllocate: percentage === 0 };
        }

        // How much do we need in THB?
        const neededTHB = (percentage / 100) * originalTotalTHB;
        let remainingNeededTHB = neededTHB;
        const costs = {};  // Will store accountId → amount allocated

        // Allocate from accounts in priority order
        for (const accountId of (investment.accountPriority || [])) {
            if (remainingNeededTHB <= 0.01) break;  // Small tolerance for floating point

            const account = accounts.find(a => a.id === accountId);
            if (!account) continue;

            const available = availableBalances[accountId] || 0;
            if (available <= 0) continue;

            // Convert available balance to THB for comparison
            const availableTHB = toTHB(available, account.currency);

            // Take the minimum of what we need and what's available
            const allocateTHB = Math.min(remainingNeededTHB, availableTHB);

            // Convert back to account's currency for storage/display
            const allocateInCurrency = fromTHB(allocateTHB, account.currency);

            if (allocateInCurrency > 0) {
                costs[accountId] = allocateInCurrency;
                availableBalances[accountId] -= allocateInCurrency;
                remainingNeededTHB -= allocateTHB;
            }
        }

        // Check if we could allocate the full amount
        const couldFullyAllocate = remainingNeededTHB < 0.01;
        return { costs, couldFullyAllocate };
    };

    /**
     * Memoized calculation of all investment costs
     * Recalculates when accounts, investments, or exchange rate changes
     */
    const calculatedData = useMemo(() => {
        // Step 1: Calculate total funds in THB
        let originalTotalTHB = 0;
        accounts.forEach(acc => {
            originalTotalTHB += toTHB(acc.amount, acc.currency);
        });

        // Step 2: Start with full balances for each account
        const availableBalances = {};
        accounts.forEach(acc => {
            availableBalances[acc.id] = acc.amount;
        });

        // Step 3: Calculate costs for each investment
        const costs = {};           // investmentId → { accountId → amount }
        const allocationStatus = {}; // investmentId → boolean (could fully allocate?)

        investments.forEach(inv => {
            const result = calculateInvestmentCost(inv, availableBalances, originalTotalTHB);
            costs[inv.id] = result.costs;
            allocationStatus[inv.id] = result.couldFullyAllocate;
        });

        return { costs, allocationStatus };
    }, [accounts, investments, exchangeRate]);

    // Shorthand for accessing costs
    const calculatedCosts = calculatedData.costs;

    // -------------------------------------------------------------------------
    // INVESTMENT HELPERS
    // -------------------------------------------------------------------------

    /**
     * Get total cost for an investment (sum of all account allocations)
     */
    const getInvestmentTotalCost = (investmentId) => {
        const costs = calculatedCosts[investmentId] || {};
        return Object.values(costs).reduce((sum, cost) => sum + cost, 0);
    };

    /**
     * Get detailed cost breakdown for display
     * Returns array of { accountId, accountName, currency, amount }
     */
    const getInvestmentCostBreakdown = (investmentId) => {
        const costs = calculatedCosts[investmentId] || {};
        return Object.entries(costs).map(([accountId, amount]) => {
            const account = accounts.find(a => a.id === Number(accountId));
            return {
                accountId: Number(accountId),
                accountName: account?.name || 'Unknown',
                currency: account?.currency || 'THB',
                amount
            };
        });
    };

    /**
     * Calculate remaining balance per account after all investments
     * Used to show how much is left in each account
     */
    const remainingBalances = useMemo(() => {
        const remaining = {};
        accounts.forEach(acc => {
            remaining[acc.id] = acc.amount;
        });

        // Subtract all investment allocations
        Object.values(calculatedCosts).forEach(costs => {
            Object.entries(costs).forEach(([accountId, amount]) => {
                remaining[accountId] = (remaining[accountId] || 0) - amount;
            });
        });

        return remaining;
    }, [accounts, calculatedCosts]);

    /**
     * Validate if an investment can be covered by available funds
     * Used when adding/editing investments
     */
    const validateInvestment = (investment, isUpdate = false) => {
        const testBalances = {};
        accounts.forEach(acc => {
            testBalances[acc.id] = acc.amount;
        });

        // Deduct existing investments (except the one being updated)
        investments.forEach(inv => {
            if (isUpdate && inv.id === investment.id) return;
            const costs = calculatedCosts[inv.id] || {};
            Object.entries(costs).forEach(([accountId, amount]) => {
                testBalances[accountId] = (testBalances[accountId] || 0) - amount;
            });
        });

        const costs = calculateInvestmentCost(investment, { ...testBalances });
        const totalNeeded = Object.values(costs).reduce((sum, c) => sum + c, 0);

        return totalNeeded > 0;
    };

    /**
     * Check if an investment is "overspent" (couldn't be fully allocated)
     * Used to show red styling on the investment card
     */
    const isInvestmentOverspent = (investmentId) => {
        const couldAllocate = calculatedData.allocationStatus[investmentId];
        return couldAllocate === false;
    };

    // -------------------------------------------------------------------------
    // DCA (DOLLAR COST AVERAGING) FUNCTIONS
    // -------------------------------------------------------------------------

    /**
     * Generate DCA schedule based on investment settings
     * 
     * Two modes:
     * 1. With end date: Shows all scheduled dates from start to end
     * 2. Forever mode (no end): Shows completed dates + next uncompleted
     * 
     * @param {Object} investment - Investment with DCA settings
     * @returns {Array<{ date: Date, completed: boolean }>}
     */
    const generateDcaSchedule = (investment) => {
        if (!investment.dcaStartDate) return [];

        const start = new Date(investment.dcaStartDate);
        const end = investment.dcaEndDate ? new Date(investment.dcaEndDate) : null;
        const schedule = [];
        let current = new Date(start);

        // Determine interval based on DCA type
        const getInterval = () => {
            switch (investment.dcaType) {
                case 'daily': return { days: 1 };
                case 'weekly': return { days: 7 };
                case 'monthly': return { months: 1 };
                case 'quarterly': return { months: 3 };
                case 'yearly': return { years: 1 };
                case 'custom':
                    const val = Number(investment.customDcaValue) || 1;
                    switch (investment.customDcaUnit) {
                        case 'days': return { days: val };
                        case 'months': return { months: val };
                        case 'years': return { years: val };
                        default: return { months: val };
                    }
                default: return { months: 1 };
            }
        };

        // Helper to advance date by interval
        const advanceDate = (date, interval) => {
            const newDate = new Date(date);
            if (interval.days) {
                newDate.setDate(newDate.getDate() + interval.days);
            } else if (interval.months) {
                newDate.setMonth(newDate.getMonth() + interval.months);
            } else if (interval.years) {
                newDate.setFullYear(newDate.getFullYear() + interval.years);
            }
            return newDate;
        };

        // Check if a date is marked as completed in history
        const isDateCompleted = (dateToCheck) => {
            return investment.dcaHistory?.some(h =>
                new Date(h.date).toDateString() === dateToCheck.toDateString() && h.completed
            ) || false;
        };

        const interval = getInterval();
        const maxIterations = 500;  // Safety limit
        let i = 0;

        if (end) {
            // Mode 1: With end date - show all scheduled DCAs
            while (i < maxIterations && current <= end) {
                schedule.push({
                    date: new Date(current),
                    completed: isDateCompleted(current)
                });
                current = advanceDate(current, interval);
                i++;
            }
        } else {
            // Mode 2: Forever - show completed + first uncompleted
            while (i < maxIterations) {
                const completed = isDateCompleted(current);

                schedule.push({
                    date: new Date(current),
                    completed: completed
                });

                // Stop after first uncompleted (this is the "next" one)
                if (!completed) {
                    break;
                }

                current = advanceDate(current, interval);
                i++;
            }
        }

        return schedule;
    };

    /**
     * Toggle DCA completion status for a specific date
     * Updates the dcaHistory array on the investment
     */
    const toggleDcaCompletion = (investmentId, date) => {
        setInvestments(prev => prev.map(inv => {
            if (inv.id !== investmentId) return inv;

            const dateStr = date.toISOString();
            const history = inv.dcaHistory || [];
            const existing = history.findIndex(h =>
                new Date(h.date).toDateString() === date.toDateString()
            );

            if (existing >= 0) {
                // Toggle existing entry
                const updated = [...history];
                updated[existing] = { ...updated[existing], completed: !updated[existing].completed };
                return { ...inv, dcaHistory: updated };
            } else {
                // Add new completed entry
                return { ...inv, dcaHistory: [...history, { date: dateStr, completed: true }] };
            }
        }));
    };

    /**
     * Get DCA completion statistics
     * Returns { completed: number, total: number }
     */
    const getDcaCompletionCount = (investmentId) => {
        const inv = investments.find(i => i.id === investmentId);
        if (!inv) return { completed: 0, total: 0 };

        const schedule = generateDcaSchedule(inv);
        const completed = schedule.filter(s => s.completed).length;
        return { completed, total: schedule.length };
    };

    // -------------------------------------------------------------------------
    // CRUD OPERATIONS
    // -------------------------------------------------------------------------

    /**
     * Add a new account
     * ID is auto-generated using timestamp
     */
    const addAccount = (account) => {
        setAccounts(prev => [...prev, { ...account, id: Date.now() }]);
    };

    /**
     * Remove an account by ID
     */
    const removeAccount = (id) => {
        setAccounts(prev => prev.filter(acc => acc.id !== id));
    };

    /**
     * Update an existing account
     * Merges updates with existing account data
     */
    const updateAccount = (id, updates) => {
        setAccounts(prev => prev.map(acc =>
            acc.id === id ? { ...acc, ...updates } : acc
        ));
    };

    /**
     * Add a new investment
     * ID is auto-generated, dcaHistory initialized empty
     */
    const addInvestment = (investment) => {
        setInvestments(prev => [...prev, {
            ...investment,
            id: Date.now(),
            dcaHistory: []
        }]);
    };

    /**
     * Remove an investment by ID
     */
    const removeInvestment = (id) => {
        setInvestments(prev => prev.filter(inv => inv.id !== id));
    };

    /**
     * Update an existing investment
     * Merges updates with existing investment data
     */
    const updateInvestment = (id, updates) => {
        setInvestments(prev => prev.map(inv =>
            inv.id === id ? { ...inv, ...updates } : inv
        ));
    };

    // -------------------------------------------------------------------------
    // CONTEXT VALUE
    // -------------------------------------------------------------------------

    const value = {
        // State
        exchangeRate,
        setExchangeRate,
        accounts,
        investments,

        // CRUD operations
        addAccount,
        removeAccount,
        updateAccount,
        addInvestment,
        removeInvestment,
        updateInvestment,

        // Sync states
        isLoading,      // True while loading from Firestore
        isSyncing,      // True while saving to Firestore
        lastSyncTime,   // Last successful sync timestamp

        // Calculation functions
        getInvestmentTotalCost,
        getInvestmentCostBreakdown,
        remainingBalances,
        validateInvestment,
        isInvestmentOverspent,

        // DCA functions
        generateDcaSchedule,
        toggleDcaCompletion,
        getDcaCompletionCount
    };

    return (
        <InvestmentContext.Provider value={value}>
            {children}
        </InvestmentContext.Provider>
    );
};
