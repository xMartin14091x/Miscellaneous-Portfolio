import { createContext, useContext, useState, useMemo } from 'react';

const InvestmentContext = createContext();

export const useInvestment = () => {
    const context = useContext(InvestmentContext);
    if (!context) {
        throw new Error('useInvestment must be used within an InvestmentProvider');
    }
    return context;
};

export const InvestmentProvider = ({ children }) => {
    // Exchange rate: THB per USD
    const [exchangeRate, setExchangeRate] = useState(32);

    // Currency accounts
    const [accounts, setAccounts] = useState([]);

    // Investments
    const [investments, setInvestments] = useState([]);

    // Saved plans
    const [plans, setPlans] = useState([]);

    // Current plan name
    const [currentPlanName, setCurrentPlanName] = useState('');

    // Convert amount to THB (base currency for calculations)
    const toTHB = (amount, currency) => {
        if (currency === 'THB') return amount;
        return amount * exchangeRate; // USD to THB
    };

    // Convert THB back to original currency
    const fromTHB = (thbAmount, currency) => {
        if (currency === 'THB') return thbAmount;
        return thbAmount / exchangeRate; // THB to USD
    };

    // Calculate cost allocation for an investment
    // Logic: Take X% of ORIGINAL TOTAL funds from priority accounts
    // Allocate from A first, then B if A isn't enough, etc.
    // Returns: { costs: {accountId: amount}, couldFullyAllocate: boolean }
    const calculateInvestmentCost = (investment, availableBalances, originalTotalTHB) => {
        const percentage = Number(investment.percentage) || 0;
        if (percentage <= 0) return { costs: {}, couldFullyAllocate: true };

        if (originalTotalTHB <= 0) {
            return { costs: {}, couldFullyAllocate: percentage === 0 };
        }

        // Calculate how much we NEED in THB (percentage of ORIGINAL total)
        const neededTHB = (percentage / 100) * originalTotalTHB;
        let remainingNeededTHB = neededTHB;
        const costs = {};

        // Allocate from accounts in priority order (A first, then B, C...)
        for (const accountId of (investment.accountPriority || [])) {
            if (remainingNeededTHB <= 0.01) break; // Small tolerance for floating point

            const account = accounts.find(a => a.id === accountId);
            if (!account) continue;

            const available = availableBalances[accountId] || 0;
            if (available <= 0) continue;

            // Convert available to THB
            const availableTHB = toTHB(available, account.currency);

            // Take as much as we need (or all if not enough)
            const allocateTHB = Math.min(remainingNeededTHB, availableTHB);

            // Convert back to account's currency for display
            const allocateInCurrency = fromTHB(allocateTHB, account.currency);

            if (allocateInCurrency > 0) {
                costs[accountId] = allocateInCurrency;
                availableBalances[accountId] -= allocateInCurrency;
                remainingNeededTHB -= allocateTHB;
            }
        }

        // Could we fully allocate? (with small tolerance)
        const couldFullyAllocate = remainingNeededTHB < 0.01;

        return { costs, couldFullyAllocate };
    };

    // Calculate all investment costs and track allocation status
    const calculatedData = useMemo(() => {
        // Step 1: Calculate ORIGINAL total in THB from ALL accounts
        let originalTotalTHB = 0;
        accounts.forEach(acc => {
            originalTotalTHB += toTHB(acc.amount, acc.currency);
        });

        // Step 2: Start with full account balances for tracking remaining
        const availableBalances = {};
        accounts.forEach(acc => {
            availableBalances[acc.id] = acc.amount;
        });

        // Step 3: Calculate costs for each investment using ORIGINAL total
        const costs = {};
        const allocationStatus = {};

        investments.forEach(inv => {
            const result = calculateInvestmentCost(inv, availableBalances, originalTotalTHB);
            costs[inv.id] = result.costs;
            allocationStatus[inv.id] = result.couldFullyAllocate;
        });

        return { costs, allocationStatus };
    }, [accounts, investments, exchangeRate]);

    const calculatedCosts = calculatedData.costs;

    // Get total cost for an investment
    const getInvestmentTotalCost = (investmentId) => {
        const costs = calculatedCosts[investmentId] || {};
        return Object.values(costs).reduce((sum, cost) => sum + cost, 0);
    };

    // Get cost breakdown for an investment
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

    // Calculate remaining balance per account after all investments
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

    // Check if adding/updating an investment would exceed available funds
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

        // Check if new investment fits
        const costs = calculateInvestmentCost(investment, { ...testBalances });
        const totalNeeded = Object.values(costs).reduce((sum, c) => sum + c, 0);

        return totalNeeded > 0;
    };

    // Check if an investment couldn't be fully allocated (ran out of funds)
    // Red = couldn't allocate the full percentage from available accounts
    const isInvestmentOverspent = (investmentId) => {
        // Use the allocation status from calculatedData
        const couldAllocate = calculatedData.allocationStatus[investmentId];
        return couldAllocate === false;
    };

    // Generate DCA schedule based on start/end date and timeframe
    // Forever mode (no end date): shows all DCAs up to the first uncompleted one
    // When you complete that one, the next period appears
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
            if (interval.days) {
                newDate.setDate(newDate.getDate() + interval.days);
            } else if (interval.months) {
                newDate.setMonth(newDate.getMonth() + interval.months);
            } else if (interval.years) {
                newDate.setFullYear(newDate.getFullYear() + interval.years);
            }
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
            // With end date: show ALL scheduled DCAs
            while (i < maxIterations && current <= end) {
                schedule.push({
                    date: new Date(current),
                    completed: isDateCompleted(current)
                });
                current = advanceDate(current, interval);
                i++;
            }
        } else {
            // Forever mode (no end date): show all checked + one unchecked
            let foundUnchecked = false;
            while (i < maxIterations) {
                const completed = isDateCompleted(current);

                schedule.push({
                    date: new Date(current),
                    completed: completed
                });

                // If this one is not completed, it's the "next" one - stop after adding it
                if (!completed) {
                    foundUnchecked = true;
                    break;
                }

                current = advanceDate(current, interval);
                i++;
            }
        }

        return schedule;
    };

    // Toggle DCA completion
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

    // Get DCA completion count
    const getDcaCompletionCount = (investmentId) => {
        const inv = investments.find(i => i.id === investmentId);
        if (!inv) return { completed: 0, total: 0 };

        const schedule = generateDcaSchedule(inv);
        const completed = schedule.filter(s => s.completed).length;
        return { completed, total: schedule.length };
    };

    // Add account
    const addAccount = (account) => {
        setAccounts(prev => [...prev, { ...account, id: Date.now() }]);
    };

    // Remove account
    const removeAccount = (id) => {
        setAccounts(prev => prev.filter(acc => acc.id !== id));
    };

    // Update account
    const updateAccount = (id, updates) => {
        setAccounts(prev => prev.map(acc =>
            acc.id === id ? { ...acc, ...updates } : acc
        ));
    };

    // Add investment
    const addInvestment = (investment) => {
        setInvestments(prev => [...prev, {
            ...investment,
            id: Date.now(),
            dcaHistory: []
        }]);
    };

    // Remove investment
    const removeInvestment = (id) => {
        setInvestments(prev => prev.filter(inv => inv.id !== id));
    };

    // Update investment
    const updateInvestment = (id, updates) => {
        setInvestments(prev => prev.map(inv =>
            inv.id === id ? { ...inv, ...updates } : inv
        ));
    };

    // Save current state as a plan
    const savePlan = (name) => {
        const plan = {
            id: Date.now(),
            name,
            exchangeRate,
            accounts: [...accounts],
            investments: [...investments],
            createdAt: new Date().toISOString()
        };
        setPlans(prev => [...prev, plan]);
        setCurrentPlanName(name);
    };

    // Load a plan
    const loadPlan = (planId) => {
        const plan = plans.find(p => p.id === planId);
        if (plan) {
            setExchangeRate(plan.exchangeRate);
            setAccounts([...plan.accounts]);
            setInvestments([...plan.investments]);
            setCurrentPlanName(plan.name);
        }
    };

    // Delete a plan
    const deletePlan = (planId) => {
        setPlans(prev => prev.filter(p => p.id !== planId));
    };

    const value = {
        exchangeRate,
        setExchangeRate,
        accounts,
        addAccount,
        removeAccount,
        updateAccount,
        investments,
        addInvestment,
        removeInvestment,
        updateInvestment,
        plans,
        savePlan,
        loadPlan,
        deletePlan,
        currentPlanName,
        setCurrentPlanName,
        // New functions
        getInvestmentTotalCost,
        getInvestmentCostBreakdown,
        remainingBalances,
        validateInvestment,
        isInvestmentOverspent,
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
