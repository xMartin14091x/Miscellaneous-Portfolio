/**
 * InvestmentContext.jsx - Investment Data Management & Multi-Plan Support
 * 
 * This is the core state management for the investment planning features.
 * It handles:
 * 1. Multiple investment plans with sidebar management
 * 2. Currency accounts (THB/USD) with amounts
 * 3. Investment allocations with percentage-based calculations
 * 4. DCA (Dollar Cost Averaging) schedules with completion tracking
 * 5. Real-time sync with Firebase Firestore
 * 6. Export to CSV/TXT
 * 
 * Data Structure in Firestore:
 * users/{userId}/plans/{planId}/
 *   - name, exchangeRate, accounts, investments, createdAt, updatedAt
 */

import { createContext, useContext, useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { doc, setDoc, getDoc, deleteDoc, collection, getDocs, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

// Create the investment context
const InvestmentContext = createContext();

/**
 * Custom hook to access investment state and methods
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

const useDebounce = (callback, delay) => {
    const timeoutRef = useRef(null);

    return useCallback((...args) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    }, [callback, delay]);
};

const isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// =============================================================================
// INVESTMENT PROVIDER
// =============================================================================

export const InvestmentProvider = ({ children }) => {
    const { user } = useAuth();

    // -------------------------------------------------------------------------
    // PLANS STATE
    // -------------------------------------------------------------------------
    const [plans, setPlans] = useState([]);  // Array of { id, name, createdAt }
    const [currentPlanId, setCurrentPlanId] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // -------------------------------------------------------------------------
    // CURRENT PLAN DATA STATE
    // -------------------------------------------------------------------------
    const [exchangeRate, setExchangeRate] = useState(32);
    const [accounts, setAccounts] = useState([]);
    const [investments, setInvestments] = useState([]);
    const [groups, setGroups] = useState([]); // Hierarchical investment groups

    // -------------------------------------------------------------------------
    // LOADING STATES
    // -------------------------------------------------------------------------
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const lastSavedData = useRef({ exchangeRate: 32, accounts: [], investments: [], groups: [] });

    // -------------------------------------------------------------------------
    // SIDEBAR TOGGLE
    // -------------------------------------------------------------------------
    const toggleSidebar = () => setSidebarOpen(prev => !prev);

    // -------------------------------------------------------------------------
    // DATA MIGRATION - Check for old data structure and migrate
    // -------------------------------------------------------------------------
    const migrateOldData = useCallback(async () => {
        if (!user) return false;

        try {
            const oldDataRef = doc(db, 'users', user.uid);
            const oldDataSnap = await getDoc(oldDataRef);

            if (oldDataSnap.exists()) {
                const oldData = oldDataSnap.data();

                // Check if this is old structure (has accounts/investments directly on user doc)
                if (oldData.accounts || oldData.investments) {
                    console.log('Migrating old data to new plan structure...');

                    // Create a new plan with the old data
                    const newPlanId = Date.now().toString();
                    const planRef = doc(db, 'users', user.uid, 'plans', newPlanId);

                    await setDoc(planRef, {
                        name: 'My Plan',
                        exchangeRate: oldData.exchangeRate || 32,
                        accounts: oldData.accounts || [],
                        investments: oldData.investments || [],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });

                    // Remove old data from user doc (keep preferences if any)
                    await setDoc(oldDataRef, {
                        migratedToPlans: true,
                        migratedAt: new Date().toISOString()
                    }, { merge: true });

                    // Delete old fields
                    const { accounts: _, investments: __, exchangeRate: ___, ...rest } = oldData;
                    await setDoc(oldDataRef, { ...rest, migratedToPlans: true });

                    console.log('Migration complete!');
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Error migrating old data:', error);
            return false;
        }
    }, [user]);

    // -------------------------------------------------------------------------
    // LOAD PLANS LIST
    // -------------------------------------------------------------------------
    useEffect(() => {
        if (!user) {
            setPlans([]);
            setCurrentPlanId(null);
            setAccounts([]);
            setInvestments([]);
            setExchangeRate(32);
            setIsLoading(false);
            return;
        }

        const loadPlans = async () => {
            setIsLoading(true);

            // First, check for and migrate old data if needed
            await migrateOldData();

            // Load all plans
            const plansRef = collection(db, 'users', user.uid, 'plans');
            const plansQuery = query(plansRef, orderBy('createdAt', 'asc'));

            const unsubscribe = onSnapshot(plansQuery, (snapshot) => {
                const plansList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name,
                    createdAt: doc.data().createdAt
                }));

                setPlans(plansList);

                // If no current plan selected and we have plans, select the first one
                if (!currentPlanId && plansList.length > 0) {
                    setCurrentPlanId(plansList[0].id);
                }

                setIsLoading(false);
            }, (error) => {
                console.error('Error loading plans:', error);
                setIsLoading(false);
            });

            return unsubscribe;
        };

        const unsubscribePromise = loadPlans();

        return () => {
            unsubscribePromise.then(unsub => unsub && unsub());
        };
    }, [user, migrateOldData]);

    // -------------------------------------------------------------------------
    // LOAD CURRENT PLAN DATA
    // -------------------------------------------------------------------------
    useEffect(() => {
        if (!user || !currentPlanId) {
            setAccounts([]);
            setInvestments([]);
            setExchangeRate(32);
            setIsInitialLoad(true);
            return;
        }

        setIsLoading(true);
        const planRef = doc(db, 'users', user.uid, 'plans', currentPlanId);

        const unsubscribe = onSnapshot(planRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();

                if (data.exchangeRate !== undefined) setExchangeRate(data.exchangeRate);
                if (data.accounts) setAccounts(data.accounts);
                if (data.investments) setInvestments(data.investments);
                // Always set groups - default to empty array if not present
                setGroups(data.groups ?? []);

                lastSavedData.current = {
                    exchangeRate: data.exchangeRate ?? 32,
                    accounts: data.accounts ?? [],
                    investments: data.investments ?? [],
                    groups: data.groups ?? []
                };
            }

            setIsLoading(false);
            setTimeout(() => setIsInitialLoad(false), 100);
        }, (error) => {
            console.error('Error loading plan data:', error);
            setIsLoading(false);
            setIsInitialLoad(false);
        });

        return () => unsubscribe();
    }, [user, currentPlanId]);

    // -------------------------------------------------------------------------
    // SAVE CURRENT PLAN DATA
    // -------------------------------------------------------------------------
    const savePlanToFirestore = useCallback(async (data) => {
        if (!user || !currentPlanId) return;

        if (isEqual(data, lastSavedData.current)) {
            return;
        }

        setIsSyncing(true);
        try {
            const planRef = doc(db, 'users', user.uid, 'plans', currentPlanId);
            await setDoc(planRef, {
                exchangeRate: data.exchangeRate,
                accounts: data.accounts,
                investments: data.investments,
                groups: data.groups ?? [],
                updatedAt: new Date().toISOString()
            }, { merge: true });

            lastSavedData.current = { ...data };
            setLastSyncTime(new Date());
        } catch (error) {
            console.error('Error saving plan:', error);
        } finally {
            setIsSyncing(false);
        }
    }, [user, currentPlanId]);

    const debouncedSave = useDebounce(savePlanToFirestore, 3000);

    useEffect(() => {
        if (!user || !currentPlanId || isInitialLoad) return;

        const currentData = { exchangeRate, accounts, investments, groups };
        if (!isEqual(currentData, lastSavedData.current)) {
            debouncedSave(currentData);
        }
    }, [exchangeRate, accounts, investments, groups, user, currentPlanId, isInitialLoad, debouncedSave]);

    // -------------------------------------------------------------------------
    // PLAN CRUD OPERATIONS
    // -------------------------------------------------------------------------
    const createPlan = async (name = 'Untitled Plan') => {
        if (!user) return null;

        try {
            const newPlanId = Date.now().toString();
            const planRef = doc(db, 'users', user.uid, 'plans', newPlanId);

            await setDoc(planRef, {
                name,
                exchangeRate: 32,
                accounts: [],
                investments: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            setCurrentPlanId(newPlanId);
            return newPlanId;
        } catch (error) {
            console.error('Error creating plan:', error);
            return null;
        }
    };

    const renamePlan = async (planId, newName) => {
        if (!user || !planId) return false;

        try {
            const planRef = doc(db, 'users', user.uid, 'plans', planId);
            await setDoc(planRef, { name: newName, updatedAt: new Date().toISOString() }, { merge: true });
            return true;
        } catch (error) {
            console.error('Error renaming plan:', error);
            return false;
        }
    };

    const deletePlan = async (planId) => {
        if (!user || !planId) return false;

        try {
            const planRef = doc(db, 'users', user.uid, 'plans', planId);
            await deleteDoc(planRef);

            // If we deleted the current plan, switch to another
            if (currentPlanId === planId) {
                const remainingPlans = plans.filter(p => p.id !== planId);
                setCurrentPlanId(remainingPlans.length > 0 ? remainingPlans[0].id : null);
            }
            return true;
        } catch (error) {
            console.error('Error deleting plan:', error);
            return false;
        }
    };

    /**
     * Reorder plans in sidebar
     */
    const reorderPlans = async (fromIndex, toIndex) => {
        if (!user || fromIndex === toIndex) return;

        const newPlans = [...plans];
        const [movedPlan] = newPlans.splice(fromIndex, 1);
        newPlans.splice(toIndex, 0, movedPlan);

        // Update order field for all plans
        try {
            const batch = [];
            newPlans.forEach((plan, index) => {
                const planRef = doc(db, 'users', user.uid, 'plans', plan.id);
                batch.push(setDoc(planRef, { order: index }, { merge: true }));
            });
            await Promise.all(batch);
        } catch (error) {
            console.error('Error reordering plans:', error);
        }
    };

    /**
     * Reorder groups at the same parent level
     */
    const reorderGroups = (parentGroupId, fromIndex, toIndex) => {
        if (fromIndex === toIndex) return;

        // Get siblings (groups with same parent)
        const siblings = groups.filter(g => g.parentGroupId === parentGroupId);
        const others = groups.filter(g => g.parentGroupId !== parentGroupId);

        const [movedGroup] = siblings.splice(fromIndex, 1);
        siblings.splice(toIndex, 0, movedGroup);

        setGroups([...others, ...siblings]);
    };

    /**
     * Reorder investments within same group (or ungrouped)
     */
    const reorderInvestments = (groupId, fromIndex, toIndex) => {
        if (fromIndex === toIndex) return;

        // Get investments in this group
        const inGroup = investments.filter(inv => inv.groupId === groupId);
        const others = investments.filter(inv => inv.groupId !== groupId);

        const [movedInv] = inGroup.splice(fromIndex, 1);
        inGroup.splice(toIndex, 0, movedInv);

        setInvestments([...others, ...inGroup]);
    };

    /**
     * Reorder accounts
     */
    const reorderAccounts = (fromIndex, toIndex) => {
        if (fromIndex === toIndex) return;

        const newAccounts = [...accounts];
        const [movedAccount] = newAccounts.splice(fromIndex, 1);
        newAccounts.splice(toIndex, 0, movedAccount);

        setAccounts(newAccounts);
    };

    const switchPlan = (planId) => {
        if (planId && plans.some(p => p.id === planId)) {
            setIsInitialLoad(true);
            setCurrentPlanId(planId);
        }
    };

    // -------------------------------------------------------------------------
    // EXPORT FUNCTIONS
    // -------------------------------------------------------------------------
    const exportPlanCSV = () => {
        const currentPlan = plans.find(p => p.id === currentPlanId);
        const planName = currentPlan?.name || 'plan';

        let csv = 'type,name,currency,amount,percentage,accountPriority,dcaType,dcaStartDate,dcaEndDate\n';

        accounts.forEach(acc => {
            csv += `account,"${acc.name}",${acc.currency},${acc.amount},,,,\n`;
        });

        investments.forEach(inv => {
            const priority = (inv.accountPriority || []).join('|');
            csv += `investment,"${inv.name}",,${inv.percentage},"${priority}",${inv.dcaType || ''},${inv.dcaStartDate || ''},${inv.dcaEndDate || ''}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${planName.replace(/[^a-z0-9]/gi, '_')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    /**
     * Exports plan as hierarchical TXT with groups, percentages, and DCA progress
     * Format shows: total funds, accounts, then hierarchical groups/investments
     */
    const exportPlanTXT = () => {
        const currentPlan = plans.find(p => p.id === currentPlanId);
        const planName = currentPlan?.name || 'plan';

        // Calculate total funds in THB
        const totalFundsTHB = accounts.reduce((sum, acc) => {
            if (acc.currency === 'THB') return sum + acc.amount;
            return sum + (acc.amount * exchangeRate);
        }, 0);

        // Helper to format DCA progress as "|" marks
        const formatDcaProgress = (investmentId) => {
            const inv = investments.find(i => i.id === investmentId);
            if (!inv?.dcaEndDate) return '';
            const schedule = generateDcaSchedule(inv);
            const completed = schedule.filter(s => s.completed).length;
            const bars = '|'.repeat(completed);
            const remaining = schedule.length - completed;
            if (remaining > 0) return ` | ${bars}`;
            return ` | ${bars}`;
        };

        // Helper to check if all investments are completed
        const isGroupCompleted = (groupId) => {
            const groupInvs = getGroupInvestments(groupId);
            const childGroups = getChildGroups(groupId);

            // Check investments
            for (const inv of groupInvs) {
                if (!inv.dcaEndDate) continue;
                const schedule = generateDcaSchedule(inv);
                if (schedule.some(s => !s.completed)) return null;
            }

            // Check child groups
            for (const child of childGroups) {
                if (!isGroupCompleted(child.id)) return null;
            }

            // Return latest end date
            let latestDate = null;
            groupInvs.forEach(inv => {
                if (inv.dcaEndDate && (!latestDate || inv.dcaEndDate > latestDate)) {
                    latestDate = inv.dcaEndDate;
                }
            });
            return latestDate;
        };

        // Helper to format date as DD/MM/YYYY
        const formatDate = (dateStr) => {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        };

        // Helper to render investments
        const renderInvestment = (inv, indent, groupFund) => {
            const cost = groupFund * (inv.percentage / 100);
            const dcaCount = inv.dcaEndDate ? generateDcaSchedule(inv).length : 1;
            const perDca = cost / dcaCount;
            const currency = accounts.find(a => inv.accountPriority?.includes(a.id))?.currency || 'THB';
            const symbol = currency === 'THB' ? '฿' : '$';
            const displayCost = currency === 'USD' ? cost / exchangeRate : cost;
            const displayPerDca = currency === 'USD' ? perDca / exchangeRate : perDca;
            const dcaProgress = formatDcaProgress(inv.id);

            let line = `${indent}${inv.name}: ${symbol}${displayCost.toLocaleString(undefined, { maximumFractionDigits: 2 })} (${inv.percentage}%)`;
            if (dcaCount > 1) {
                line += ` ${symbol}${displayPerDca.toLocaleString(undefined, { maximumFractionDigits: 2 })} x ${dcaCount}`;
            }
            line += dcaProgress;
            return line + '\n';
        };

        // Recursive helper to render groups
        const renderGroup = (group, indent = '') => {
            const groupFund = getGroupFundAmount(group.id);
            const completedDate = isGroupCompleted(group.id);
            const childGroups = getChildGroups(group.id);
            const groupInvs = getGroupInvestments(group.id);

            let txt = `${indent}${group.name}: ฿${groupFund.toLocaleString(undefined, { maximumFractionDigits: 0 })} (${group.percentage}%)`;
            if (completedDate) {
                txt += ` -- Completed ${formatDate(completedDate)}`;
            }
            txt += '\n';

            // Render investments in this group
            groupInvs.forEach(inv => {
                txt += renderInvestment(inv, indent + '    ', groupFund);
            });

            // Render child groups
            childGroups.forEach(child => {
                txt += renderGroup(child, indent + '    ');
            });

            return txt;
        };

        // Build TXT content
        let txt = '';

        // Header: Total funds
        txt += `฿${totalFundsTHB.toLocaleString(undefined, { maximumFractionDigits: 2 })} (100%)\n\n`;

        // Accounts section with exchange rate
        txt += '--- ACCOUNTS ---\n';
        txt += `Exchange Rate: ${exchangeRate}THB / 1USD\n`;
        accounts.forEach(acc => {
            const symbol = acc.currency === 'THB' ? '฿' : '$';
            const thbValue = acc.currency === 'THB' ? acc.amount : acc.amount * exchangeRate;
            const usdValue = acc.currency === 'USD' ? acc.amount : acc.amount / exchangeRate;
            const percentage = ((thbValue / totalFundsTHB) * 100).toFixed(1);

            if (acc.currency === 'THB') {
                txt += `${acc.name} (${acc.currency}): ฿${acc.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ($${usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}) [${percentage}%]\n`;
            } else {
                txt += `${acc.name} (${acc.currency}): $${acc.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} (฿${thbValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}) [${percentage}%]\n`;
            }
        });
        txt += '\n';

        // Investments section
        txt += '--- INVESTMENTS ---\n';

        // Root groups
        const rootGroups = getRootGroups();
        rootGroups.forEach(group => {
            txt += renderGroup(group, '');
            txt += '\n';
        });

        // Ungrouped investments
        const ungroupedInvs = getUngroupedInvestments();
        if (ungroupedInvs.length > 0) {
            if (rootGroups.length > 0) {
                txt += '--- UNGROUPED ---\n';
            }
            ungroupedInvs.forEach(inv => {
                txt += renderInvestment(inv, '', totalFundsTHB);
            });
        }

        // Download
        const blob = new Blob([txt], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${planName.replace(/[^a-z0-9]/gi, '_')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const importPlan = async (file) => {
        if (!user || !file) return false;

        try {
            const text = await file.text();
            const lines = text.split('\n').filter(line => line.trim());

            const newAccounts = [];
            const newInvestments = [];
            let newExchangeRate = 32;

            // Parse CSV
            if (file.name.endsWith('.csv')) {
                lines.slice(1).forEach(line => {
                    const parts = line.split(',').map(p => p.replace(/"/g, '').trim());
                    const [type, name, currency, amount, percentage, accountPriority, dcaType, dcaStartDate, dcaEndDate] = parts;

                    if (type === 'account') {
                        newAccounts.push({
                            id: Date.now() + Math.random(),
                            name,
                            currency,
                            amount: parseFloat(amount) || 0
                        });
                    } else if (type === 'investment') {
                        newInvestments.push({
                            id: Date.now() + Math.random(),
                            name,
                            percentage: parseFloat(percentage) || 0,
                            accountPriority: accountPriority ? accountPriority.split('|') : [],
                            dcaType: dcaType || 'monthly',
                            dcaStartDate: dcaStartDate || null,
                            dcaEndDate: dcaEndDate || null,
                            dcaHistory: []
                        });
                    }
                });
            }

            // Create new plan with imported data
            const planName = file.name.replace(/\.(csv|txt)$/i, '');
            const newPlanId = Date.now().toString();
            const planRef = doc(db, 'users', user.uid, 'plans', newPlanId);

            await setDoc(planRef, {
                name: planName,
                exchangeRate: newExchangeRate,
                accounts: newAccounts,
                investments: newInvestments,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            setCurrentPlanId(newPlanId);
            return true;
        } catch (error) {
            console.error('Error importing plan:', error);
            return false;
        }
    };

    // -------------------------------------------------------------------------
    // GROUP CRUD OPERATIONS
    // -------------------------------------------------------------------------
    const addGroup = (group) => {
        const newGroup = {
            id: Date.now().toString(),
            name: group.name || 'New Group',
            color: group.color || { r: 34, g: 197, b: 94 }, // Default green
            percentage: group.percentage || 100,
            parentGroupId: group.parentGroupId || null,
            createdAt: new Date().toISOString()
        };
        setGroups(prev => [...prev, newGroup]);
        return newGroup.id;
    };

    const updateGroup = (id, updates) => {
        setGroups(prev => prev.map(g =>
            g.id === id ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g
        ));
    };

    const removeGroup = (id) => {
        // Move all investments in this group to parent or ungrouped
        const group = groups.find(g => g.id === id);
        const parentId = group?.parentGroupId || null;

        // Move investments to parent group
        setInvestments(prev => prev.map(inv =>
            inv.groupId === id ? { ...inv, groupId: parentId } : inv
        ));

        // Move child groups to parent
        setGroups(prev => prev.map(g =>
            g.parentGroupId === id ? { ...g, parentGroupId: parentId } : g
        ));

        // Remove the group
        setGroups(prev => prev.filter(g => g.id !== id));
    };

    const moveInvestmentToGroup = (investmentId, groupId) => {
        setInvestments(prev => prev.map(inv =>
            inv.id === investmentId ? { ...inv, groupId: groupId || null } : inv
        ));
    };

    // -------------------------------------------------------------------------
    // GROUP FUND CALCULATION
    // -------------------------------------------------------------------------
    /**
     * Calculate the available fund amount for a group (in THB).
     * Accounts for parent group percentages recursively.
     */
    const getGroupFundAmount = useCallback((groupId) => {
        // Calculate total funds in THB
        const totalTHB = accounts.reduce((sum, acc) => sum + toTHB(acc.amount, acc.currency), 0);

        if (!groupId) return totalTHB; // Ungrouped uses full amount

        // Build the chain of parent groups
        const getGroupChain = (gId) => {
            const group = groups.find(g => g.id === gId);
            if (!group) return [];
            if (group.parentGroupId) {
                return [...getGroupChain(group.parentGroupId), group];
            }
            return [group];
        };

        const chain = getGroupChain(groupId);

        // Multiply percentages through the chain
        let availableFund = totalTHB;
        for (const group of chain) {
            availableFund = availableFund * ((group.percentage || 100) / 100);
        }

        return availableFund;
    }, [accounts, groups]);

    /**
     * Get root-level groups (no parent)
     */
    const getRootGroups = useCallback(() => {
        return groups.filter(g => !g.parentGroupId);
    }, [groups]);

    /**
     * Get child groups of a parent
     */
    const getChildGroups = useCallback((parentId) => {
        return groups.filter(g => g.parentGroupId === parentId);
    }, [groups]);

    /**
     * Get investments in a specific group
     */
    const getGroupInvestments = useCallback((groupId) => {
        return investments.filter(inv => inv.groupId === groupId);
    }, [investments]);

    /**
     * Get ungrouped investments
     */
    const getUngroupedInvestments = useCallback(() => {
        return investments.filter(inv => !inv.groupId);
    }, [investments]);

    // -------------------------------------------------------------------------
    // CURRENCY CONVERSION
    // -------------------------------------------------------------------------
    const toTHB = (amount, currency) => {
        if (currency === 'THB') return amount;
        return amount * exchangeRate;
    };

    const fromTHB = (thbAmount, currency) => {
        if (currency === 'THB') return thbAmount;
        return thbAmount / exchangeRate;
    };

    // -------------------------------------------------------------------------
    // INVESTMENT COST CALCULATION
    // -------------------------------------------------------------------------

    /**
     * Get cumulative percentage multiplier for an investment based on its group hierarchy
     * For nested groups: Total × ParentGroup% × ChildGroup% × Investment%
     * Returns a value between 0 and 1 (e.g., 0.5 for 50%)
     */
    const getGroupPercentageMultiplier = (groupId) => {
        if (!groupId) return 1; // Ungrouped investments use 100% of total

        let multiplier = 1;
        let currentGroupId = groupId;

        // Walk up the group hierarchy, multiplying percentages
        while (currentGroupId) {
            const group = groups.find(g => g.id === currentGroupId);
            if (!group) break;

            const groupPercentage = Number(group.percentage) || 100;
            multiplier *= (groupPercentage / 100);
            currentGroupId = group.parentGroupId;
        }

        return multiplier;
    };

    const calculateInvestmentCost = (investment, availableBalances, baseTHB) => {
        const percentage = Number(investment.percentage) || 0;
        if (percentage <= 0) return { costs: {}, couldFullyAllocate: true };
        if (baseTHB <= 0) return { costs: {}, couldFullyAllocate: percentage === 0 };

        const neededTHB = (percentage / 100) * baseTHB;
        let remainingNeededTHB = neededTHB;
        const costs = {};

        for (const accountId of (investment.accountPriority || [])) {
            if (remainingNeededTHB <= 0.01) break;

            const account = accounts.find(a => a.id === accountId);
            if (!account) continue;

            const available = availableBalances[accountId] || 0;
            if (available <= 0) continue;

            const availableTHB = toTHB(available, account.currency);
            const allocateTHB = Math.min(remainingNeededTHB, availableTHB);
            const allocateInCurrency = fromTHB(allocateTHB, account.currency);

            if (allocateInCurrency > 0) {
                costs[accountId] = allocateInCurrency;
                availableBalances[accountId] -= allocateInCurrency;
                remainingNeededTHB -= allocateTHB;
            }
        }

        return { costs, couldFullyAllocate: remainingNeededTHB < 0.01 };
    };

    const calculatedData = useMemo(() => {
        let originalTotalTHB = 0;
        accounts.forEach(acc => {
            originalTotalTHB += toTHB(acc.amount, acc.currency);
        });

        const availableBalances = {};
        accounts.forEach(acc => {
            availableBalances[acc.id] = acc.amount;
        });

        const costs = {};
        const allocationStatus = {};

        investments.forEach(inv => {
            // Get the group-adjusted base amount
            // For grouped investments: Total × Group1% × Group2% (cumulative)
            const groupMultiplier = getGroupPercentageMultiplier(inv.groupId);
            const adjustedBaseTHB = originalTotalTHB * groupMultiplier;

            const result = calculateInvestmentCost(inv, availableBalances, adjustedBaseTHB);
            costs[inv.id] = result.costs;
            allocationStatus[inv.id] = result.couldFullyAllocate;
        });

        return { costs, allocationStatus };
    }, [accounts, investments, groups, exchangeRate]);

    const calculatedCosts = calculatedData.costs;

    const getInvestmentTotalCost = (investmentId) => {
        const costs = calculatedCosts[investmentId] || {};
        return Object.values(costs).reduce((sum, cost) => sum + cost, 0);
    };

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

    const remainingBalances = useMemo(() => {
        const remaining = {};
        accounts.forEach(acc => {
            remaining[acc.id] = acc.amount;
        });

        Object.values(calculatedCosts).forEach(costs => {
            Object.entries(costs).forEach(([accountId, amount]) => {
                remaining[accountId] = (remaining[accountId] || 0) - amount;
            });
        });

        return remaining;
    }, [accounts, calculatedCosts]);

    const isInvestmentOverspent = (investmentId) => {
        return calculatedData.allocationStatus[investmentId] === false;
    };

    // -------------------------------------------------------------------------
    // DCA FUNCTIONS
    // -------------------------------------------------------------------------
    const generateDcaSchedule = (investment) => {
        if (!investment.dcaStartDate) return [];

        const start = new Date(investment.dcaStartDate);
        const end = investment.dcaEndDate ? new Date(investment.dcaEndDate) : null;
        const schedule = [];
        let current = new Date(start);

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

        const advanceDate = (date, interval) => {
            const newDate = new Date(date);
            if (interval.days) newDate.setDate(newDate.getDate() + interval.days);
            else if (interval.months) newDate.setMonth(newDate.getMonth() + interval.months);
            else if (interval.years) newDate.setFullYear(newDate.getFullYear() + interval.years);
            return newDate;
        };

        const isDateCompleted = (dateToCheck) => {
            return investment.dcaHistory?.some(h =>
                new Date(h.date).toDateString() === dateToCheck.toDateString() && h.completed
            ) || false;
        };

        const interval = getInterval();
        const maxIterations = 500;
        let i = 0;

        if (end) {
            while (i < maxIterations && current <= end) {
                schedule.push({ date: new Date(current), completed: isDateCompleted(current) });
                current = advanceDate(current, interval);
                i++;
            }
        } else {
            while (i < maxIterations) {
                const completed = isDateCompleted(current);
                schedule.push({ date: new Date(current), completed });
                if (!completed) break;
                current = advanceDate(current, interval);
                i++;
            }
        }

        return schedule;
    };

    const toggleDcaCompletion = (investmentId, date) => {
        setInvestments(prev => prev.map(inv => {
            if (inv.id !== investmentId) return inv;

            const dateStr = date.toISOString();
            const history = inv.dcaHistory || [];
            const existing = history.findIndex(h =>
                new Date(h.date).toDateString() === date.toDateString()
            );

            if (existing >= 0) {
                const updated = [...history];
                updated[existing] = { ...updated[existing], completed: !updated[existing].completed };
                return { ...inv, dcaHistory: updated };
            } else {
                return { ...inv, dcaHistory: [...history, { date: dateStr, completed: true }] };
            }
        }));
    };

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
    const addAccount = (account) => {
        setAccounts(prev => [...prev, { ...account, id: Date.now() }]);
    };

    const removeAccount = (id) => {
        setAccounts(prev => prev.filter(acc => acc.id !== id));
    };

    const updateAccount = (id, updates) => {
        setAccounts(prev => prev.map(acc =>
            acc.id === id ? { ...acc, ...updates } : acc
        ));
    };

    const addInvestment = (investment) => {
        setInvestments(prev => [...prev, { ...investment, id: Date.now(), dcaHistory: [] }]);
    };

    const removeInvestment = (id) => {
        setInvestments(prev => prev.filter(inv => inv.id !== id));
    };

    const updateInvestment = (id, updates) => {
        setInvestments(prev => prev.map(inv =>
            inv.id === id ? { ...inv, ...updates } : inv
        ));
    };

    // -------------------------------------------------------------------------
    // CONTEXT VALUE
    // -------------------------------------------------------------------------
    const value = {
        // Plans management
        plans,
        currentPlanId,
        createPlan,
        renamePlan,
        deletePlan,
        reorderPlans,
        reorderGroups,
        reorderInvestments,
        reorderAccounts,
        switchPlan,
        exportPlanCSV,
        exportPlanTXT,
        importPlan,

        // Sidebar
        sidebarOpen,
        toggleSidebar,

        // Current plan data
        exchangeRate,
        setExchangeRate,
        accounts,
        investments,
        groups,

        // Account CRUD
        addAccount,
        removeAccount,
        updateAccount,

        // Investment CRUD
        addInvestment,
        removeInvestment,
        updateInvestment,

        // Group CRUD
        addGroup,
        updateGroup,
        removeGroup,
        moveInvestmentToGroup,

        // Group getters
        getGroupFundAmount,
        getRootGroups,
        getChildGroups,
        getGroupInvestments,
        getUngroupedInvestments,

        // Sync states
        isLoading,
        isSyncing,
        lastSyncTime,

        // Calculations
        getInvestmentTotalCost,
        getInvestmentCostBreakdown,
        remainingBalances,
        isInvestmentOverspent,

        // DCA
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
