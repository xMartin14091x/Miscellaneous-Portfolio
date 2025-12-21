import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useInvestment } from '../context/InvestmentContext';
import './PlanningPage.css';

const PlanningPage = () => {
    const { t } = useLanguage();
    const {
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
        isLoading,
        isSyncing,
        getInvestmentCostBreakdown,
        isInvestmentOverspent,
        generateDcaSchedule,
        toggleDcaCompletion,
        getDcaCompletionCount
    } = useInvestment();

    // UI State
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [showInvestmentModal, setShowInvestmentModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [editingInvestment, setEditingInvestment] = useState(null);
    const [isEditingRate, setIsEditingRate] = useState(false);
    const [tempRate, setTempRate] = useState(exchangeRate);
    const [expandedInvestment, setExpandedInvestment] = useState(null);
    const [activeMenu, setActiveMenu] = useState(null);

    // Account Form State
    const [accountForm, setAccountForm] = useState({
        name: '',
        currency: 'THB',
        amount: 0
    });

    // Investment Form State
    const [investmentForm, setInvestmentForm] = useState({
        name: '',
        percentage: 0,
        accountPriority: [],
        dcaType: 'monthly',
        customDcaValue: 1,
        customDcaUnit: 'months',
        dcaStartDate: '',
        dcaEndDate: ''
    });

    // Format date as DD/Month/YYYY
    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const day = d.getDate();
        const month = t.monthNames[d.getMonth()];
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // Handle Exchange Rate
    const handleRateSubmit = () => {
        setExchangeRate(Number(tempRate) || 32);
        setIsEditingRate(false);
    };

    // Open account modal for editing
    const openEditAccount = (account) => {
        setEditingAccount(account);
        setAccountForm({
            name: account.name,
            currency: account.currency,
            amount: account.amount
        });
        setShowAccountModal(true);
        setActiveMenu(null);
    };

    // Open investment modal for editing
    const openEditInvestment = (investment) => {
        setEditingInvestment(investment);
        setInvestmentForm({
            name: investment.name,
            percentage: investment.percentage,
            accountPriority: investment.accountPriority || [],
            dcaType: investment.dcaType || 'monthly',
            customDcaValue: investment.customDcaValue || 1,
            customDcaUnit: investment.customDcaUnit || 'months',
            dcaStartDate: investment.dcaStartDate || '',
            dcaEndDate: investment.dcaEndDate || ''
        });
        setShowInvestmentModal(true);
        setActiveMenu(null);
    };

    // Handle Account Form
    const handleAccountSubmit = (e) => {
        e.preventDefault();
        if (accountForm.name.trim()) {
            if (editingAccount) {
                updateAccount(editingAccount.id, {
                    name: accountForm.name,
                    currency: accountForm.currency,
                    amount: Number(accountForm.amount) || 0
                });
            } else {
                addAccount({
                    name: accountForm.name,
                    currency: accountForm.currency,
                    amount: Number(accountForm.amount) || 0
                });
            }
            resetAccountForm();
        }
    };

    const resetAccountForm = () => {
        setAccountForm({ name: '', currency: 'THB', amount: 0 });
        setShowAccountModal(false);
        setEditingAccount(null);
    };

    // Handle Investment Form
    const handleInvestmentSubmit = (e) => {
        e.preventDefault();
        if (investmentForm.name.trim() && accounts.length > 0) {
            const investmentData = {
                name: investmentForm.name,
                percentage: Number(investmentForm.percentage) || 0,
                accountPriority: investmentForm.accountPriority.length > 0
                    ? investmentForm.accountPriority
                    : [accounts[0].id],
                dcaType: investmentForm.dcaType,
                customDcaValue: investmentForm.customDcaValue,
                customDcaUnit: investmentForm.customDcaUnit,
                dcaStartDate: investmentForm.dcaStartDate,
                dcaEndDate: investmentForm.dcaEndDate
            };

            if (editingInvestment) {
                updateInvestment(editingInvestment.id, investmentData);
            } else {
                addInvestment(investmentData);
            }
            resetInvestmentForm();
        }
    };

    const resetInvestmentForm = () => {
        setInvestmentForm({
            name: '',
            percentage: 0,
            accountPriority: [],
            dcaType: 'monthly',
            customDcaValue: 1,
            customDcaUnit: 'months',
            dcaStartDate: '',
            dcaEndDate: ''
        });
        setShowInvestmentModal(false);
        setEditingInvestment(null);
    };

    // Toggle account in priority list
    const toggleAccountPriority = (accountId) => {
        setInvestmentForm(prev => {
            const current = prev.accountPriority;
            if (current.includes(accountId)) {
                return { ...prev, accountPriority: current.filter(id => id !== accountId) };
            } else {
                return { ...prev, accountPriority: [...current, accountId] };
            }
        });
    };

    // Get priority label
    const getPriorityLabel = (index) => {
        const labels = [t.primary, t.secondary, t.tertiary];
        return labels[index] || `#${index + 1}`;
    };

    // Get DCA display text
    const getDcaDisplay = (investment) => {
        if (investment.dcaType === 'custom') {
            return `${t.every} ${investment.customDcaValue} ${t[investment.customDcaUnit]}`;
        }
        return t[investment.dcaType];
    };

    // Get cost display for investment
    const getCostDisplay = (investmentId) => {
        const breakdown = getInvestmentCostBreakdown(investmentId);
        if (breakdown.length === 0) return '-';

        return breakdown.map(b => {
            const symbol = b.currency === 'THB' ? '฿' : '$';
            return `${symbol}${b.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }).join(' + ');
    };

    // Get per-DCA amount display (total cost / number of DCAs)
    const getPerDcaDisplay = (investmentId) => {
        const dcaCount = getDcaCompletionCount(investmentId);
        if (dcaCount.total === 0) return null;

        const breakdown = getInvestmentCostBreakdown(investmentId);
        if (breakdown.length === 0) return null;

        // Divide each account's cost by total DCA periods
        return breakdown.map(b => {
            const perDcaAmount = b.amount / dcaCount.total;
            const symbol = b.currency === 'THB' ? '฿' : '$';
            return `${symbol}${perDcaAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }).join(' + ');
    };

    // Show loading state
    if (isLoading) {
        return (
            <div className="planning-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading your data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="planning-page">
            {/* Sync indicator */}
            {isSyncing && (
                <div className="sync-indicator">
                    <div className="sync-spinner"></div>
                    Saving...
                </div>
            )}

            {/* Main Layout - no sidebar needed, data auto-saves */}
            <div className="planning-layout sidebar-closed">
                {/* Main Content Area */}
                <main className="planning-main">
                    {/* Exchange Rate Button - Top Right (Sticky) */}
                    <div className="exchange-rate-wrapper">
                        {isEditingRate ? (
                            <div className="exchange-rate-edit">
                                <input
                                    type="number"
                                    value={tempRate}
                                    onChange={(e) => setTempRate(e.target.value)}
                                    className="rate-input"
                                    autoFocus
                                    onBlur={handleRateSubmit}
                                    onKeyDown={(e) => e.key === 'Enter' && handleRateSubmit()}
                                />
                                <span className="rate-suffix">THB = 1 USD</span>
                            </div>
                        ) : (
                            <button
                                className="exchange-rate-btn"
                                onClick={() => { setTempRate(exchangeRate); setIsEditingRate(true); }}
                            >
                                <span className="rate-text">{exchangeRate} THB = 1 USD</span>
                                <span className="rate-label">{t.exchangeRate}</span>
                            </button>
                        )}
                    </div>

                    {/* Content Container */}
                    <div className="content-container">
                        {/* Accounts Section */}
                        {accounts.length > 0 && (
                            <div className="section accounts-section">
                                <h3 className="section-label">{t.addAccount.replace('Add ', '')}</h3>
                                <div className="cards-grid">
                                    {accounts.map(account => (
                                        <div key={account.id} className="card account-card">
                                            <div className="card-content">
                                                <span className="card-title">{account.name}</span>
                                                <span className="card-subtitle">{account.currency}</span>
                                                <span className="card-value">
                                                    {account.currency === 'THB' ? '฿' : '$'}
                                                    {account.amount.toLocaleString()}
                                                </span>
                                            </div>
                                            <button
                                                className="menu-btn"
                                                onClick={() => setActiveMenu(activeMenu === `acc-${account.id}` ? null : `acc-${account.id}`)}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                    <circle cx="12" cy="5" r="2"></circle>
                                                    <circle cx="12" cy="12" r="2"></circle>
                                                    <circle cx="12" cy="19" r="2"></circle>
                                                </svg>
                                            </button>
                                            {activeMenu === `acc-${account.id}` && (
                                                <div className="dropdown-menu">
                                                    <button onClick={() => openEditAccount(account)}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                        </svg>
                                                        {t.edit}
                                                    </button>
                                                    <button onClick={() => { removeAccount(account.id); setActiveMenu(null); }} className="delete-option">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <polyline points="3 6 5 6 21 6"></polyline>
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                        </svg>
                                                        {t.delete}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Investments Section */}
                        {investments.length > 0 && (
                            <div className="section investments-section">
                                <h3 className="section-label">{t.addInvestment.replace('Add ', '')}</h3>
                                <div className="cards-grid investments-grid">
                                    {investments.map(investment => {
                                        const dcaCount = getDcaCompletionCount(investment.id);
                                        const schedule = generateDcaSchedule(investment);

                                        return (
                                            <div
                                                key={investment.id}
                                                className={`card investment-card ${expandedInvestment === investment.id ? 'expanded' : ''} ${isInvestmentOverspent(investment.id) ? 'overspent' : ''}`}
                                            >
                                                {/* Card Header */}
                                                <div className="investment-header">
                                                    <span className="investment-name">{investment.name}</span>
                                                    <button
                                                        className="menu-btn visible"
                                                        onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === `inv-${investment.id}` ? null : `inv-${investment.id}`); }}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                            <circle cx="12" cy="5" r="2"></circle>
                                                            <circle cx="12" cy="12" r="2"></circle>
                                                            <circle cx="12" cy="19" r="2"></circle>
                                                        </svg>
                                                    </button>
                                                    {activeMenu === `inv-${investment.id}` && (
                                                        <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                                                            <button onClick={() => openEditInvestment(investment)}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                                </svg>
                                                                {t.edit}
                                                            </button>
                                                            <button onClick={() => { removeInvestment(investment.id); setActiveMenu(null); }} className="delete-option">
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <polyline points="3 6 5 6 21 6"></polyline>
                                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                                </svg>
                                                                {t.delete}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Percentage */}
                                                <div className="investment-percentage">{investment.percentage}%</div>

                                                {/* Cost (auto-calculated) */}
                                                <div className="investment-cost">
                                                    {getCostDisplay(investment.id)}
                                                </div>

                                                {/* DCA Info */}
                                                <div
                                                    className="investment-dca"
                                                    onClick={() => setExpandedInvestment(expandedInvestment === investment.id ? null : investment.id)}
                                                >
                                                    <span className="dca-timeframe">{getDcaDisplay(investment)}</span>
                                                    {investment.dcaStartDate && (
                                                        <>
                                                            <span className="dca-count">
                                                                {dcaCount.completed}/{dcaCount.total}
                                                            </span>
                                                            {investment.dcaEndDate && dcaCount.total > 0 && (
                                                                <span className="dca-per-amount">
                                                                    {getPerDcaDisplay(investment.id)}/ea
                                                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>

                                                {/* Expanded DCA Schedule */}
                                                {expandedInvestment === investment.id && (
                                                    <div className="dca-schedule">
                                                        <h4>{t.dcaSchedule}</h4>
                                                        {schedule.length === 0 ? (
                                                            <p className="no-schedule">{t.noSchedule}</p>
                                                        ) : (
                                                            <div className="schedule-list">
                                                                {schedule.map((item, idx) => (
                                                                    <label key={idx} className="schedule-item">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={item.completed}
                                                                            onChange={() => toggleDcaCompletion(investment.id, item.date)}
                                                                        />
                                                                        <span className={item.completed ? 'completed' : ''}>
                                                                            {formatDate(item.date)}
                                                                        </span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Add Buttons */}
                        <div className="add-buttons">
                            <button
                                className="add-btn"
                                onClick={() => { resetAccountForm(); setShowAccountModal(true); }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                {t.addAccount}
                            </button>

                            <button
                                className="add-btn primary"
                                onClick={() => { resetInvestmentForm(); setShowInvestmentModal(true); }}
                                disabled={accounts.length === 0}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                {t.addInvestment}
                            </button>
                        </div>
                    </div>
                </main>
            </div>

            {/* Click outside to close menu */}
            {activeMenu && (
                <div className="menu-backdrop" onClick={() => setActiveMenu(null)} />
            )}

            {/* Account Modal */}
            {showAccountModal && (
                <div className="modal-overlay" onClick={resetAccountForm}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3>{editingAccount ? t.editAccount : t.addAccount}</h3>
                        <form onSubmit={handleAccountSubmit}>
                            <div className="form-group">
                                <label>{t.accountName}</label>
                                <input
                                    type="text"
                                    value={accountForm.name}
                                    onChange={(e) => setAccountForm(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder={t.accountName}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label>{t.currency}</label>
                                <select
                                    value={accountForm.currency}
                                    onChange={(e) => setAccountForm(prev => ({ ...prev, currency: e.target.value }))}
                                >
                                    <option value="THB">THB (฿)</option>
                                    <option value="USD">USD ($)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>{t.amount}</label>
                                <input
                                    type="number"
                                    value={accountForm.amount}
                                    onChange={(e) => setAccountForm(prev => ({ ...prev, amount: e.target.value }))}
                                    placeholder="0"
                                    min="0"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={resetAccountForm}>
                                    {t.cancel}
                                </button>
                                <button type="submit" className="btn-save">
                                    {t.save}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Investment Modal */}
            {showInvestmentModal && (
                <div className="modal-overlay" onClick={resetInvestmentForm}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <h3>{editingInvestment ? t.editInvestment : t.addInvestment}</h3>
                        <form onSubmit={handleInvestmentSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>{t.investmentName}</label>
                                    <input
                                        type="text"
                                        value={investmentForm.name}
                                        onChange={(e) => setInvestmentForm(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder={t.investmentName}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div className="form-group small">
                                    <label>{t.percentage}</label>
                                    <input
                                        type="number"
                                        value={investmentForm.percentage}
                                        onChange={(e) => setInvestmentForm(prev => ({ ...prev, percentage: e.target.value }))}
                                        placeholder="0"
                                        min="0"
                                        max="100"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>{t.accountPriority}</label>
                                <div className="priority-list">
                                    {accounts.map(account => (
                                        <button
                                            key={account.id}
                                            type="button"
                                            className={`priority-btn ${investmentForm.accountPriority.includes(account.id) ? 'selected' : ''}`}
                                            onClick={() => toggleAccountPriority(account.id)}
                                        >
                                            <span className="priority-order">
                                                {investmentForm.accountPriority.includes(account.id)
                                                    ? getPriorityLabel(investmentForm.accountPriority.indexOf(account.id))
                                                    : '-'}
                                            </span>
                                            <span className="priority-name">{account.name}</span>
                                            <span className="priority-currency">{account.currency}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>{t.dcaTimeframe}</label>
                                <div className="dca-options">
                                    {['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'].map(option => (
                                        <button
                                            key={option}
                                            type="button"
                                            className={`dca-option ${investmentForm.dcaType === option ? 'selected' : ''}`}
                                            onClick={() => setInvestmentForm(prev => ({ ...prev, dcaType: option }))}
                                        >
                                            {t[option]}
                                        </button>
                                    ))}
                                </div>
                                {investmentForm.dcaType === 'custom' && (
                                    <div className="custom-dca">
                                        <span>{t.every}</span>
                                        <input
                                            type="number"
                                            value={investmentForm.customDcaValue}
                                            onChange={(e) => setInvestmentForm(prev => ({ ...prev, customDcaValue: e.target.value }))}
                                            min="1"
                                            className="custom-dca-input"
                                        />
                                        <select
                                            value={investmentForm.customDcaUnit}
                                            onChange={(e) => setInvestmentForm(prev => ({ ...prev, customDcaUnit: e.target.value }))}
                                            className="custom-dca-select"
                                        >
                                            <option value="days">{t.days}</option>
                                            <option value="months">{t.months}</option>
                                            <option value="years">{t.years}</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>{t.startDate}</label>
                                    <input
                                        type="date"
                                        value={investmentForm.dcaStartDate}
                                        onChange={(e) => setInvestmentForm(prev => ({ ...prev, dcaStartDate: e.target.value }))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{t.endDate}</label>
                                    <input
                                        type="date"
                                        value={investmentForm.dcaEndDate}
                                        onChange={(e) => setInvestmentForm(prev => ({ ...prev, dcaEndDate: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={resetInvestmentForm}>
                                    {t.cancel}
                                </button>
                                <button type="submit" className="btn-save">
                                    {t.save}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlanningPage;
