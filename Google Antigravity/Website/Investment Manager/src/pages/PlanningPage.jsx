import { useState, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useInvestment } from '../context/InvestmentContext';
import './PlanningPage.css';

const PlanningPage = () => {
    const { t } = useLanguage();
    const {
        // Plans
        plans,
        currentPlanId,
        createPlan,
        renamePlan,
        deletePlan,
        switchPlan,
        exportPlanCSV,
        exportPlanTXT,
        importPlan,
        sidebarOpen,
        toggleSidebar,
        // Data
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
        // Groups
        groups,
        addGroup,
        updateGroup,
        removeGroup,
        moveInvestmentToGroup,
        getGroupFundAmount,
        getRootGroups,
        getChildGroups,
        getGroupInvestments,
        getUngroupedInvestments,
        // Util
        isLoading,
        isSyncing,
        getInvestmentCostBreakdown,
        isInvestmentOverspent,
        generateDcaSchedule,
        toggleDcaCompletion,
        getDcaCompletionCount,
        // Reorder
        reorderPlans,
        reorderGroups,
        reorderInvestments,
        reorderAccounts
    } = useInvestment();

    // UI State
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [showInvestmentModal, setShowInvestmentModal] = useState(false);
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [editingInvestment, setEditingInvestment] = useState(null);
    const [editingGroup, setEditingGroup] = useState(null);
    const [isEditingRate, setIsEditingRate] = useState(false);
    const [tempRate, setTempRate] = useState(exchangeRate);
    const [expandedInvestment, setExpandedInvestment] = useState(null);
    const [expandedGroups, setExpandedGroups] = useState({});
    const [activeMenu, setActiveMenu] = useState(null);
    const [fabOpen, setFabOpen] = useState(false);
    const [addPlanMenuOpen, setAddPlanMenuOpen] = useState(false);
    const [closingMenu, setClosingMenu] = useState(null); // Track menu being closed for exit animation
    const [renamingPlanId, setRenamingPlanId] = useState(null);
    const [renamePlanValue, setRenamePlanValue] = useState('');
    const fileInputRef = useRef(null);

    // Drag reorder state
    const [dragItem, setDragItem] = useState(null);
    const [dragOverItem, setDragOverItem] = useState(null);
    const dragType = useRef(null);

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
        dcaStartDate: new Date().toISOString().split('T')[0],
        dcaEndDate: ''
    });

    // Group Form State
    const [groupForm, setGroupForm] = useState({
        name: '',
        color: { r: 34, g: 197, b: 94 },
        gradient: null, // { start: {r,g,b}, end: {r,g,b} } or null for solid colors
        percentage: 100,
        parentGroupId: null
    });
    const [colorHue, setColorHue] = useState(145); // Default green hue
    const colorPickerRef = useRef(null);
    const [editingRgb, setEditingRgb] = useState(null); // 'r', 'g', 'b', or null
    const [rgbInputValue, setRgbInputValue] = useState('');

    // Preset color palettes
    const colorPalettes = {
        vibrant: [
            { r: 239, g: 68, b: 68 },   // Red
            { r: 249, g: 115, b: 22 },  // Orange
            { r: 234, g: 179, b: 8 },   // Yellow
            { r: 34, g: 197, b: 94 },   // Green
            { r: 6, g: 182, b: 212 },   // Cyan
            { r: 59, g: 130, b: 246 },  // Blue
            { r: 139, g: 92, b: 246 },  // Violet
            { r: 236, g: 72, b: 153 },  // Pink
        ],
        pastel: [
            { r: 254, g: 202, b: 202 }, // Pastel Red
            { r: 254, g: 215, b: 170 }, // Pastel Orange
            { r: 254, g: 240, b: 138 }, // Pastel Yellow
            { r: 187, g: 247, b: 208 }, // Pastel Green
            { r: 165, g: 243, b: 252 }, // Pastel Cyan
            { r: 191, g: 219, b: 254 }, // Pastel Blue
            { r: 221, g: 214, b: 254 }, // Pastel Violet
            { r: 251, g: 207, b: 232 }, // Pastel Pink
        ],
        earth: [
            { r: 120, g: 53, b: 15 },   // Brown
            { r: 180, g: 83, b: 9 },    // Amber
            { r: 146, g: 64, b: 14 },   // Rust
            { r: 101, g: 163, b: 13 },  // Lime
            { r: 22, g: 101, b: 52 },   // Forest
            { r: 13, g: 148, b: 136 },  // Teal
            { r: 30, g: 58, b: 138 },   // Navy
            { r: 76, g: 29, b: 149 },   // Indigo
        ]
    };
    // Gradient presets (start and end colors)
    const gradientPresets = [
        { name: 'Sunset', start: { r: 255, g: 94, b: 77 }, end: { r: 255, g: 195, b: 113 } },
        { name: 'Ocean', start: { r: 0, g: 180, b: 216 }, end: { r: 0, g: 119, b: 182 } },
        { name: 'Forest', start: { r: 34, g: 139, b: 34 }, end: { r: 144, g: 238, b: 144 } },
        { name: 'Purple', start: { r: 147, g: 51, b: 234 }, end: { r: 236, g: 72, b: 153 } },
        { name: 'Gold', start: { r: 255, g: 215, b: 0 }, end: { r: 255, g: 140, b: 0 } },
        { name: 'Mint', start: { r: 16, g: 185, b: 129 }, end: { r: 52, g: 211, b: 153 } },
    ];

    // Recent colors (latest used)
    const [recentColors, setRecentColors] = useState([]);

    // Add color to recent when form submits (track in separate effect)
    const addToRecentColors = (color) => {
        setRecentColors(prev => {
            const exists = prev.some(c => c.r === color.r && c.g === color.g && c.b === color.b);
            if (exists) return prev;
            const updated = [color, ...prev.slice(0, 7)]; // Keep last 8
            return updated;
        });
    };
    const handleRgbEdit = (channel) => {
        setEditingRgb(channel);
        setRgbInputValue(groupForm.color[channel].toString());
    };

    const handleRgbInputConfirm = () => {
        const value = Math.max(0, Math.min(255, parseInt(rgbInputValue) || 0));
        setGroupForm(prev => ({
            ...prev,
            color: { ...prev.color, [editingRgb]: value }
        }));
        setEditingRgb(null);
    };

    // HSV to RGB conversion
    const hsvToRgb = (h, s, v) => {
        const c = v * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = v - c;
        let r, g, b;
        if (h < 60) { r = c; g = x; b = 0; }
        else if (h < 120) { r = x; g = c; b = 0; }
        else if (h < 180) { r = 0; g = c; b = x; }
        else if (h < 240) { r = 0; g = x; b = c; }
        else if (h < 300) { r = x; g = 0; b = c; }
        else { r = c; g = 0; b = x; }
        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255)
        };
    };

    // Handle color picker click
    const handleColorPickerClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        const saturation = x;
        const brightness = 1 - y;
        const rgb = hsvToRgb(colorHue, saturation, brightness);
        setGroupForm(prev => ({ ...prev, color: rgb }));
    };

    // Handle hue bar click
    const handleHueClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const hue = x * 360;
        setColorHue(hue);
        const rgb = hsvToRgb(hue, 1, 1);
        setGroupForm(prev => ({ ...prev, color: rgb }));
    };

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
            dcaStartDate: new Date().toISOString().split('T')[0],
            dcaEndDate: ''
        });
        setShowInvestmentModal(false);
        setEditingInvestment(null);
    };

    // Group Handlers
    const handleGroupSubmit = (e) => {
        e.preventDefault();
        if (groupForm.name.trim()) {
            // Track recent color
            addToRecentColors(groupForm.color);

            if (editingGroup) {
                updateGroup(editingGroup.id, groupForm);
            } else {
                addGroup(groupForm);
            }
            resetGroupForm();
        }
    };

    const resetGroupForm = () => {
        setGroupForm({
            name: '',
            color: { r: 34, g: 197, b: 94 },
            gradient: null,
            percentage: 100,
            parentGroupId: null
        });
        setShowGroupModal(false);
        setEditingGroup(null);
    };

    const openEditGroup = (group) => {
        setEditingGroup(group);
        setGroupForm({
            name: group.name,
            color: group.color || { r: 34, g: 197, b: 94 },
            gradient: group.gradient || null,
            percentage: group.percentage || 100,
            parentGroupId: group.parentGroupId || null
        });
        setShowGroupModal(true);
        setActiveMenu(null);
    };

    const toggleGroupExpand = (groupId) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    // Drag handlers for reordering
    const handleDragStart = (e, index, type, parentId = null) => {
        dragType.current = { type, parentId };
        setDragItem(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (dragOverItem !== index) {
            setDragOverItem(index);
        }
    };

    const handleDragEnd = () => {
        if (dragItem !== null && dragOverItem !== null && dragItem !== dragOverItem) {
            const { type, parentId } = dragType.current || {};

            switch (type) {
                case 'plan':
                    reorderPlans(dragItem, dragOverItem);
                    break;
                case 'group':
                    reorderGroups(parentId, dragItem, dragOverItem);
                    break;
                case 'investment':
                    reorderInvestments(parentId, dragItem, dragOverItem);
                    break;
                case 'account':
                    reorderAccounts(dragItem, dragOverItem);
                    break;
            }
        }

        setDragItem(null);
        setDragOverItem(null);
        dragType.current = null;
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

    // Get per-DCA amount display
    const getPerDcaDisplay = (investmentId) => {
        const dcaCount = getDcaCompletionCount(investmentId);
        if (dcaCount.total === 0) return null;

        const breakdown = getInvestmentCostBreakdown(investmentId);
        if (breakdown.length === 0) return null;

        return breakdown.map(b => {
            const perDcaAmount = b.amount / dcaCount.total;
            const symbol = b.currency === 'THB' ? '฿' : '$';
            return `${symbol}${perDcaAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }).join(' + ');
    };

    // Render a single investment card
    const renderInvestmentCard = (investment, groupColor = null, index = 0, groupId = null) => {
        const dcaCount = getDcaCompletionCount(investment.id);
        const schedule = generateDcaSchedule(investment);
        const glowColor = groupColor || { r: 16, g: 185, b: 129 }; // Default green (#10b981) for ungrouped

        return (
            <div
                key={investment.id}
                className={`card investment-card ${expandedInvestment === investment.id ? 'expanded' : ''} ${isInvestmentOverspent(investment.id) ? 'overspent' : ''} ${dragItem === index && dragType.current?.type === 'investment' && dragType.current?.parentId === groupId ? 'dragging' : ''} ${dragOverItem === index && dragType.current?.type === 'investment' && dragType.current?.parentId === groupId ? 'drag-over' : ''}`}
                style={{
                    '--card-glow-color': `rgba(${glowColor.r}, ${glowColor.g}, ${glowColor.b}, 0.25)`,
                    '--card-glow-color-subtle': `rgba(${glowColor.r}, ${glowColor.g}, ${glowColor.b}, 0.15)`,
                    '--card-accent-color': `rgb(${glowColor.r}, ${glowColor.g}, ${glowColor.b})`
                }}
                draggable
                onDragStart={(e) => { e.stopPropagation(); handleDragStart(e, index, 'investment', groupId); }}
                onDragOver={(e) => { e.stopPropagation(); handleDragOver(e, index); }}
                onDragEnd={(e) => { e.stopPropagation(); handleDragEnd(); }}
            >
                {/* Row 1: Name + Percentage + 3-dot menu */}
                <div className="investment-header">
                    <span className="investment-name">{investment.name}</span>
                    <span className="investment-percentage" style={{ color: `rgb(${glowColor.r}, ${glowColor.g}, ${glowColor.b})` }}>{investment.percentage}%</span>
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
                    {(activeMenu === `inv-${investment.id}` || closingMenu === `inv-${investment.id}`) && (
                        <div className={`dropdown-menu ${closingMenu === `inv-${investment.id}` ? 'closing' : ''}`}>
                            <button onClick={() => openEditInvestment(investment)}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                                {t.edit}
                            </button>
                            {/* Move to group submenu */}
                            {groups.length > 0 && (
                                <div className="dropdown-submenu">
                                    <span className="submenu-label">{t.moveToGroup}</span>
                                    <button onClick={() => { moveInvestmentToGroup(investment.id, null); setActiveMenu(null); }}>
                                        {t.ungrouped}
                                    </button>
                                    {groups.map(g => (
                                        <button key={g.id} onClick={() => { moveInvestmentToGroup(investment.id, g.id); setActiveMenu(null); }}>
                                            <span className="group-color-dot" style={{ backgroundColor: `rgb(${g.color?.r || 34}, ${g.color?.g || 197}, ${g.color?.b || 94})` }}></span>
                                            {g.name}
                                        </button>
                                    ))}
                                </div>
                            )}
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

                {/* Row 2: Cost */}
                <div className="investment-cost-row">
                    <span
                        className={`investment-cost ${isInvestmentOverspent(investment.id) ? 'overspent-text' : ''}`}
                        style={!isInvestmentOverspent(investment.id) ? { color: `rgb(${glowColor.r}, ${glowColor.g}, ${glowColor.b})` } : {}}
                    >
                        {getCostDisplay(investment.id)}
                    </span>
                </div>

                {/* Row 3: DCA Type + Timeframe + Per DCA Cost */}
                <div className="investment-dca-row" onClick={() => setExpandedInvestment(expandedInvestment === investment.id ? null : investment.id)}>
                    <span
                        className="dca-type-badge"
                        style={{
                            backgroundColor: `rgba(${glowColor.r}, ${glowColor.g}, ${glowColor.b}, 0.15)`,
                            color: `rgb(${glowColor.r}, ${glowColor.g}, ${glowColor.b})`,
                            borderColor: `rgb(${glowColor.r}, ${glowColor.g}, ${glowColor.b})`
                        }}
                    >{getDcaDisplay(investment)}</span>
                    {dcaCount.total > 0 && (
                        <div className="dca-info-group">
                            <span className="dca-count-display">
                                {dcaCount.completed}/{dcaCount.total}
                                {investment.dcaEndDate && ` → ${formatDate(investment.dcaEndDate)}`}
                            </span>
                            {investment.dcaEndDate && (
                                <span
                                    className="dca-per-cost"
                                    style={{ color: `rgb(${glowColor.r}, ${glowColor.g}, ${glowColor.b})` }}
                                >
                                    {getPerDcaDisplay(investment.id)}/DCA
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Expanded DCA Schedule */}
                {expandedInvestment === investment.id && schedule.length > 0 && (
                    <div
                        className="dca-schedule-panel"
                        style={{
                            '--dca-accent-color': `rgb(${glowColor.r}, ${glowColor.g}, ${glowColor.b})`,
                            '--dca-accent-light': `rgba(${glowColor.r}, ${glowColor.g}, ${glowColor.b}, 0.15)`
                        }}
                    >
                        <div className="dca-dates-list">
                            {schedule.map((item, index) => (
                                <button
                                    key={index}
                                    className={`dca-date-item ${item.completed ? 'completed' : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleDcaCompletion(investment.id, item.date);
                                    }}
                                    style={item.completed ? {
                                        backgroundColor: `rgba(${glowColor.r}, ${glowColor.g}, ${glowColor.b}, 0.15)`,
                                        borderColor: `rgb(${glowColor.r}, ${glowColor.g}, ${glowColor.b})`
                                    } : {}}
                                >
                                    <span
                                        className="dca-checkbox"
                                        style={{
                                            borderColor: `rgb(${glowColor.r}, ${glowColor.g}, ${glowColor.b})`,
                                            color: item.completed ? `rgb(${glowColor.r}, ${glowColor.g}, ${glowColor.b})` : 'transparent'
                                        }}
                                    >{item.completed ? '✓' : ''}</span>
                                    <span className="dca-date">{formatDate(item.date)}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Render a group with its investments and child groups (recursive)
    const renderGroup = (group, depth = 0, index = 0, parentGroupId = null) => {
        const isExpanded = expandedGroups[group.id] !== false; // Default expanded
        const childGroups = getChildGroups(group.id);
        const groupInvestments = getGroupInvestments(group.id);
        const groupColor = group.color || { r: 34, g: 197, b: 94 };
        const groupGradient = group.gradient; // { start, end } or null
        const fundAmount = getGroupFundAmount(group.id);
        const dragKey = `group-${parentGroupId || 'root'}`;

        // Generate background style for header (gradient or solid)
        const headerBgStyle = groupGradient
            ? { background: `linear-gradient(135deg, rgba(${groupGradient.start.r}, ${groupGradient.start.g}, ${groupGradient.start.b}, 0.15), rgba(${groupGradient.end.r}, ${groupGradient.end.g}, ${groupGradient.end.b}, 0.15))` }
            : { backgroundColor: `rgba(${groupColor.r}, ${groupColor.g}, ${groupColor.b}, 0.1)` };

        // Generate color indicator style (gradient or solid)
        const indicatorStyle = groupGradient
            ? { background: `linear-gradient(135deg, rgb(${groupGradient.start.r}, ${groupGradient.start.g}, ${groupGradient.start.b}), rgb(${groupGradient.end.r}, ${groupGradient.end.g}, ${groupGradient.end.b}))` }
            : { backgroundColor: `rgb(${groupColor.r}, ${groupColor.g}, ${groupColor.b})` };

        return (
            <div
                key={group.id}
                className={`investment-group ${isExpanded ? 'expanded' : 'collapsed'} ${dragItem === index && dragType.current?.type === 'group' && dragType.current?.parentId === parentGroupId ? 'dragging' : ''} ${dragOverItem === index && dragType.current?.type === 'group' && dragType.current?.parentId === parentGroupId ? 'drag-over' : ''}`}
                style={{
                    marginLeft: depth > 0 ? '1.5rem' : 0,
                    '--group-border-color': groupGradient
                        ? `linear-gradient(to bottom, rgb(${groupGradient.start.r}, ${groupGradient.start.g}, ${groupGradient.start.b}), rgb(${groupGradient.end.r}, ${groupGradient.end.g}, ${groupGradient.end.b}))`
                        : `rgb(${groupColor.r}, ${groupColor.g}, ${groupColor.b})`
                }}
            >
                <div
                    className="group-header"
                    onClick={() => toggleGroupExpand(group.id)}
                    style={headerBgStyle}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index, 'group', parentGroupId)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                >
                    <span className="group-expand-icon">{isExpanded ? '▼' : '▶'}</span>
                    <span
                        className="group-color-indicator"
                        style={indicatorStyle}
                    ></span>
                    <span className="group-name" style={{ color: `rgb(${groupColor.r}, ${groupColor.g}, ${groupColor.b})` }}>{group.name}</span>
                    <span className="group-percentage" style={{ color: `rgb(${groupColor.r}, ${groupColor.g}, ${groupColor.b})` }}>{group.percentage}%</span>
                    <span className="group-fund" style={{ color: `rgb(${groupColor.r}, ${groupColor.g}, ${groupColor.b})` }}>
                        ฿{(Math.floor(fundAmount * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className="group-fund-usd">
                            ${(Math.floor((fundAmount / exchangeRate) * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </span>
                    <button
                        className="menu-btn"
                        draggable="false"
                        onDragStart={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === `grp-${group.id}` ? null : `grp-${group.id}`); }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="5" r="2"></circle>
                            <circle cx="12" cy="12" r="2"></circle>
                            <circle cx="12" cy="19" r="2"></circle>
                        </svg>
                    </button>
                </div>

                {/* Group dropdown - OUTSIDE group-header to prevent hover conflicts */}
                {(activeMenu === `grp-${group.id}` || closingMenu === `grp-${group.id}`) && (
                    <div className={`dropdown-menu group-dropdown ${closingMenu === `grp-${group.id}` ? 'closing' : ''}`} style={{ position: 'absolute', top: '3rem', right: '0.5rem', zIndex: 9999 }}>
                        <button onClick={() => openEditGroup(group)}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            {t.editGroup}
                        </button>
                        <button onClick={() => { removeGroup(group.id); setActiveMenu(null); }} className="delete-option">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                            {t.deleteGroup}
                        </button>
                    </div>
                )}

                {isExpanded && (
                    <div className="group-content">
                        {/* Investments in this group */}
                        {groupInvestments.length > 0 && (
                            <div
                                className="cards-grid investments-grid"
                                onDragStart={(e) => e.stopPropagation()}
                                onDragOver={(e) => e.stopPropagation()}
                                onDragEnd={(e) => e.stopPropagation()}
                            >
                                {groupInvestments.map((inv, idx) => renderInvestmentCard(inv, groupColor, idx, group.id))}
                            </div>
                        )}

                        {/* Child groups (recursive) */}
                        {childGroups.map((child, idx) => renderGroup(child, depth + 1, idx, group.id))}
                    </div>
                )}
            </div>
        );
    };

    // Plan management handlers
    const handleCreatePlan = async () => {
        await createPlan(t.untitledPlan);
        setAddPlanMenuOpen(false);
    };

    const handleImportPlan = () => {
        fileInputRef.current?.click();
        setAddPlanMenuOpen(false);
    };

    const handleFileImport = async (e) => {
        const file = e.target.files?.[0];
        if (file) {
            await importPlan(file);
            e.target.value = '';
        }
    };

    const handleStartRename = (plan) => {
        setRenamingPlanId(plan.id);
        setRenamePlanValue(plan.name);
        setActiveMenu(null);
    };

    const handleRenameSubmit = async () => {
        if (renamePlanValue.trim() && renamingPlanId) {
            await renamePlan(renamingPlanId, renamePlanValue.trim());
        }
        setRenamingPlanId(null);
        setRenamePlanValue('');
    };

    const handleDeletePlan = async (planId) => {
        if (window.confirm(t.confirmDeletePlan)) {
            await deletePlan(planId);
        }
        setActiveMenu(null);
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
        <div
            className="planning-page"
            onClick={(e) => {
                // Close menus when clicking outside dropdown/menu areas
                if (!e.target.closest('.dropdown-menu') &&
                    !e.target.closest('.plan-dropdown') &&
                    !e.target.closest('.menu-btn') &&
                    !e.target.closest('.plan-menu-btn') &&
                    !e.target.closest('.fab-button') &&
                    !e.target.closest('.add-plan-btn') &&
                    !e.target.closest('.add-plan-menu')) {
                    // Trigger closing animation
                    if (activeMenu) {
                        setClosingMenu(activeMenu);
                        setTimeout(() => {
                            setActiveMenu(null);
                            setClosingMenu(null);
                        }, 300); // Match CSS animation duration
                    } else {
                        setActiveMenu(null);
                    }
                    setFabOpen(false);
                    setAddPlanMenuOpen(false);
                }
            }}
        >
            {/* Hidden file input for import */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileImport}
                accept=".csv,.txt"
                style={{ display: 'none' }}
            />

            {/* Sync indicator */}
            {isSyncing && (
                <div className="sync-indicator">
                    <div className="sync-spinner"></div>
                    Saving...
                </div>
            )}

            {/* Main Layout with Sidebar */}
            <div className={`planning-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>

                {/* Sidebar */}
                <aside className={`planning-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                    <div className="sidebar-content">
                        <h3 className="sidebar-title">{t.plans}</h3>

                        {/* Plans List */}
                        <div className="plans-list">
                            {plans.length === 0 ? (
                                <p className="no-plans">{t.noPlansYet}</p>
                            ) : (
                                plans.map((plan, index) => (
                                    <div
                                        key={plan.id}
                                        className={`plan-item ${currentPlanId === plan.id ? 'active' : ''} ${dragItem === index && dragType.current?.type === 'plan' ? 'dragging' : ''} ${dragOverItem === index && dragType.current?.type === 'plan' ? 'drag-over' : ''}`}
                                        onClick={() => switchPlan(plan.id)}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, index, 'plan')}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDragEnd={handleDragEnd}
                                    >
                                        {renamingPlanId === plan.id ? (
                                            <input
                                                type="text"
                                                value={renamePlanValue}
                                                onChange={(e) => setRenamePlanValue(e.target.value)}
                                                onBlur={handleRenameSubmit}
                                                onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                                                onClick={(e) => e.stopPropagation()}
                                                className="plan-rename-input"
                                                autoFocus
                                            />
                                        ) : (
                                            <>
                                                <span className="plan-icon">📁</span>
                                                <span className="plan-name">{plan.name}</span>
                                            </>
                                        )}
                                        <button
                                            className="plan-menu-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveMenu(activeMenu === `plan-${plan.id}` ? null : `plan-${plan.id}`);
                                            }}
                                        >
                                            ⋮
                                        </button>
                                        {(activeMenu === `plan-${plan.id}` || closingMenu === `plan-${plan.id}`) && (
                                            <div className={`plan-dropdown ${closingMenu === `plan-${plan.id}` ? 'closing' : ''}`}>
                                                <button onClick={(e) => { e.stopPropagation(); handleStartRename(plan); }}>
                                                    ✏️ {t.renamePlan}
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); exportPlanCSV(); setActiveMenu(null); }}>
                                                    📤 {t.exportCSV}
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); exportPlanTXT(); setActiveMenu(null); }}>
                                                    📤 {t.exportTXT}
                                                </button>
                                                <button
                                                    className="delete-option"
                                                    onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan.id); }}
                                                >
                                                    🗑️ {t.deletePlan}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Add Plan Button */}
                        <div className="add-plan-wrapper">
                            <button
                                className="add-plan-btn"
                                onClick={() => setAddPlanMenuOpen(!addPlanMenuOpen)}
                            >
                                + {t.addPlan}
                            </button>
                            {addPlanMenuOpen && (
                                <div className="add-plan-menu">
                                    <button onClick={handleCreatePlan}>
                                        ✏️ {t.createManually}
                                    </button>
                                    <button onClick={handleImportPlan}>
                                        📥 {t.importPlan}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>

                {/* Sidebar Toggle Button - Outside sidebar for guaranteed visibility */}
                <button
                    className={`sidebar-toggle-btn ${sidebarOpen ? 'open' : 'closed'}`}
                    onClick={toggleSidebar}
                >
                    {sidebarOpen ? '‹' : '›'}
                </button>

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
                        {/* No Plan Selected Message */}
                        {!currentPlanId && plans.length === 0 && (
                            <div className="no-plan-message">
                                <p>{t.noPlansYet}</p>
                                <button onClick={handleCreatePlan} className="create-first-plan-btn">
                                    + {t.addPlan}
                                </button>
                            </div>
                        )}

                        {/* Accounts Section */}
                        {currentPlanId && accounts.length > 0 && (
                            <div className="section accounts-section">
                                <h3 className="section-label">{t.sectionAccount}</h3>
                                <div className="cards-grid">
                                    {accounts.map((account, index) => (
                                        <div
                                            key={account.id}
                                            className={`card account-card ${dragItem === index && dragType.current?.type === 'account' ? 'dragging' : ''} ${dragOverItem === index && dragType.current?.type === 'account' ? 'drag-over' : ''}`}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, index, 'account')}
                                            onDragOver={(e) => handleDragOver(e, index)}
                                            onDragEnd={handleDragEnd}
                                        >
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
                        {currentPlanId && (investments.length > 0 || groups.length > 0) && (
                            <div className="section investments-section">
                                <h3 className="section-label">{t.sectionInvestment}</h3>

                                {/* Render root groups */}
                                {getRootGroups().map((group, idx) => renderGroup(group, 0, idx, null))}

                                {/* Render ungrouped investments */}
                                {getUngroupedInvestments().length > 0 && (
                                    <div className="ungrouped-section">
                                        {groups.length > 0 && (
                                            <div className="ungrouped-header">
                                                <span className="ungrouped-label">{t.ungrouped}</span>
                                            </div>
                                        )}
                                        <div className="cards-grid investments-grid">
                                            {getUngroupedInvestments().map((inv, idx) => renderInvestmentCard(inv, null, idx, null))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* FAB Button */}
                    {currentPlanId && (
                        <div className={`fab-container ${fabOpen ? 'open' : ''}`}>
                            {fabOpen && (
                                <div className="fab-menu">
                                    <button
                                        className="fab-menu-item"
                                        onClick={() => { setShowAccountModal(true); setFabOpen(false); }}
                                    >
                                        💰 {t.addAccount}
                                    </button>
                                    <button
                                        className="fab-menu-item"
                                        onClick={() => { setShowGroupModal(true); setFabOpen(false); }}
                                    >
                                        📁 {t.addGrouping}
                                    </button>
                                    <button
                                        className={`fab-menu-item ${accounts.length === 0 ? 'disabled' : ''}`}
                                        onClick={() => {
                                            if (accounts.length > 0) {
                                                setShowInvestmentModal(true);
                                                setFabOpen(false);
                                            }
                                        }}
                                        title={accounts.length === 0 ? 'Add an account first' : ''}
                                    >
                                        📊 {t.addInvestment}
                                    </button>
                                </div>
                            )}
                            <button
                                className="fab-button"
                                onClick={() => setFabOpen(!fabOpen)}
                            >
                                {fabOpen ? '✕' : '+'}
                            </button>
                        </div>
                    )}
                </main>
            </div>

            {/* Account Modal */}
            {showAccountModal && (
                <div className="modal-overlay" onClick={resetAccountForm}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2>{editingAccount ? t.editAccount : t.addAccount}</h2>
                        <form onSubmit={handleAccountSubmit}>
                            <div className="form-group">
                                <label>{t.accountName}</label>
                                <input
                                    type="text"
                                    value={accountForm.name}
                                    onChange={(e) => setAccountForm(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder={t.accountName}
                                    required
                                />
                            </div>
                            <div className="form-row">
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
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
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
                    <div className="modal investment-modal" onClick={e => e.stopPropagation()}>
                        <h2>{editingInvestment ? t.editInvestment : t.addInvestment}</h2>
                        <form onSubmit={handleInvestmentSubmit}>
                            <div className="form-group">
                                <label>{t.investmentName}</label>
                                <input
                                    type="text"
                                    value={investmentForm.name}
                                    onChange={(e) => setInvestmentForm(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder={t.investmentName}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>{t.percentage} (%)</label>
                                <input
                                    type="number"
                                    value={investmentForm.percentage}
                                    onChange={(e) => setInvestmentForm(prev => ({ ...prev, percentage: e.target.value }))}
                                    min="0"
                                    max="100"
                                    step="0.1"
                                />
                            </div>

                            <div className="form-group">
                                <label>{t.accountPriority}</label>
                                <div className="priority-list">
                                    {accounts.map(account => {
                                        const priorityIndex = investmentForm.accountPriority.indexOf(account.id);
                                        const isSelected = priorityIndex >= 0;
                                        return (
                                            <button
                                                key={account.id}
                                                type="button"
                                                className={`priority-item ${isSelected ? 'selected' : ''}`}
                                                onClick={() => toggleAccountPriority(account.id)}
                                            >
                                                <span className="priority-badge">
                                                    {isSelected ? getPriorityLabel(priorityIndex) : ''}
                                                </span>
                                                <span>{account.name}</span>
                                                <span className="priority-currency">{account.currency}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>{t.dcaTimeframe}</label>
                                <div className="dca-options">
                                    {['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'].map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            className={`dca-option ${investmentForm.dcaType === type ? 'selected' : ''}`}
                                            onClick={() => setInvestmentForm(prev => ({ ...prev, dcaType: type }))}
                                        >
                                            {t[type]}
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

            {/* Group Modal */}
            {showGroupModal && (
                <div className="modal-overlay" onClick={resetGroupForm}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2>{editingGroup ? t.editGroup : t.addGrouping}</h2>
                        <form onSubmit={handleGroupSubmit}>
                            <div className="form-group">
                                <label>{t.groupName}</label>
                                <input
                                    type="text"
                                    value={groupForm.name}
                                    onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>{t.groupColor}</label>
                                <div className="color-picker-container">
                                    {/* Saturation/Brightness gradient */}
                                    <div
                                        className="color-gradient"
                                        ref={colorPickerRef}
                                        style={{ backgroundColor: `hsl(${colorHue}, 100%, 50%)` }}
                                        onClick={handleColorPickerClick}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const updateColor = (moveE) => {
                                                const x = Math.max(0, Math.min(1, (moveE.clientX - rect.left) / rect.width));
                                                const y = Math.max(0, Math.min(1, (moveE.clientY - rect.top) / rect.height));
                                                const saturation = x;
                                                const brightness = 1 - y;
                                                const rgb = hsvToRgb(colorHue, saturation, brightness);
                                                setGroupForm(prev => ({ ...prev, color: rgb }));
                                            };
                                            updateColor(e); // Apply immediately on mousedown
                                            const handleMove = (moveE) => updateColor(moveE);
                                            const handleUp = () => {
                                                document.removeEventListener('mousemove', handleMove);
                                                document.removeEventListener('mouseup', handleUp);
                                            };
                                            document.addEventListener('mousemove', handleMove);
                                            document.addEventListener('mouseup', handleUp);
                                        }}
                                    >
                                        <div className="color-gradient-white"></div>
                                        <div className="color-gradient-black"></div>
                                    </div>

                                    {/* Hue bar */}
                                    <div
                                        className="hue-bar"
                                        onClick={handleHueClick}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const updateHue = (moveE) => {
                                                const x = Math.max(0, Math.min(1, (moveE.clientX - rect.left) / rect.width));
                                                const hue = x * 360;
                                                setColorHue(hue);
                                                const rgb = hsvToRgb(hue, 1, 1);
                                                setGroupForm(prev => ({ ...prev, color: rgb }));
                                            };
                                            updateHue(e);
                                            const handleMove = (moveE) => updateHue(moveE);
                                            const handleUp = () => {
                                                document.removeEventListener('mousemove', handleMove);
                                                document.removeEventListener('mouseup', handleUp);
                                            };
                                            document.addEventListener('mousemove', handleMove);
                                            document.addEventListener('mouseup', handleUp);
                                        }}
                                    >
                                        <div
                                            className="hue-indicator"
                                            style={{ left: `${(colorHue / 360) * 100}%` }}
                                        ></div>
                                    </div>
                                    {/* Color preview with editable RGB */}
                                    <div className="color-preview-row">
                                        <div
                                            className="color-preview-large"
                                            style={{
                                                background: groupForm.gradient
                                                    ? `linear-gradient(135deg, rgb(${groupForm.gradient.start.r}, ${groupForm.gradient.start.g}, ${groupForm.gradient.start.b}), rgb(${groupForm.gradient.end.r}, ${groupForm.gradient.end.g}, ${groupForm.gradient.end.b}))`
                                                    : `rgb(${groupForm.color.r}, ${groupForm.color.g}, ${groupForm.color.b})`
                                            }}
                                        ></div>
                                        <div className="rgb-inputs">
                                            <span className="rgb-label">R:</span>
                                            {editingRgb === 'r' ? (
                                                <input
                                                    type="number"
                                                    className="rgb-input"
                                                    value={rgbInputValue}
                                                    onChange={(e) => setRgbInputValue(e.target.value)}
                                                    onBlur={handleRgbInputConfirm}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleRgbInputConfirm()}
                                                    autoFocus
                                                    min="0"
                                                    max="255"
                                                />
                                            ) : (
                                                <span className="rgb-value" onClick={() => handleRgbEdit('r')}>{groupForm.color.r}</span>
                                            )}
                                            <span className="rgb-label">G:</span>
                                            {editingRgb === 'g' ? (
                                                <input
                                                    type="number"
                                                    className="rgb-input"
                                                    value={rgbInputValue}
                                                    onChange={(e) => setRgbInputValue(e.target.value)}
                                                    onBlur={handleRgbInputConfirm}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleRgbInputConfirm()}
                                                    autoFocus
                                                    min="0"
                                                    max="255"
                                                />
                                            ) : (
                                                <span className="rgb-value" onClick={() => handleRgbEdit('g')}>{groupForm.color.g}</span>
                                            )}
                                            <span className="rgb-label">B:</span>
                                            {editingRgb === 'b' ? (
                                                <input
                                                    type="number"
                                                    className="rgb-input"
                                                    value={rgbInputValue}
                                                    onChange={(e) => setRgbInputValue(e.target.value)}
                                                    onBlur={handleRgbInputConfirm}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleRgbInputConfirm()}
                                                    autoFocus
                                                    min="0"
                                                    max="255"
                                                />
                                            ) : (
                                                <span className="rgb-value" onClick={() => handleRgbEdit('b')}>{groupForm.color.b}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Color Palettes */}
                                    <div className="color-palettes">
                                        <div className="palette-section">
                                            <span className="palette-label">Vibrant</span>
                                            <div className="palette-swatches">
                                                {colorPalettes.vibrant.map((color, i) => (
                                                    <div
                                                        key={i}
                                                        className="palette-swatch"
                                                        style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }}
                                                        onClick={() => setGroupForm(prev => ({ ...prev, color, gradient: null }))}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="palette-section">
                                            <span className="palette-label">Pastel</span>
                                            <div className="palette-swatches">
                                                {colorPalettes.pastel.map((color, i) => (
                                                    <div
                                                        key={i}
                                                        className="palette-swatch"
                                                        style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }}
                                                        onClick={() => setGroupForm(prev => ({ ...prev, color, gradient: null }))}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="palette-section">
                                            <span className="palette-label">Earth</span>
                                            <div className="palette-swatches">
                                                {colorPalettes.earth.map((color, i) => (
                                                    <div
                                                        key={i}
                                                        className="palette-swatch"
                                                        style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }}
                                                        onClick={() => setGroupForm(prev => ({ ...prev, color, gradient: null }))}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="palette-section">
                                            <span className="palette-label">Gradient</span>
                                            <div className="palette-swatches">
                                                {gradientPresets.map((g, i) => (
                                                    <div
                                                        key={`grad-${i}`}
                                                        className="palette-swatch gradient-swatch"
                                                        style={{
                                                            background: `linear-gradient(135deg, rgb(${g.start.r}, ${g.start.g}, ${g.start.b}), rgb(${g.end.r}, ${g.end.g}, ${g.end.b}))`
                                                        }}
                                                        onClick={() => setGroupForm(prev => ({
                                                            ...prev,
                                                            color: g.start,
                                                            gradient: { start: g.start, end: g.end }
                                                        }))}
                                                        title={g.name}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        {recentColors.length > 0 && (
                                            <div className="palette-section">
                                                <span className="palette-label">Recent</span>
                                                <div className="palette-swatches">
                                                    {recentColors.map((color, i) => (
                                                        <div
                                                            key={`recent-${i}`}
                                                            className="palette-swatch"
                                                            style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }}
                                                            onClick={() => setGroupForm(prev => ({ ...prev, color, gradient: null }))}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>{t.groupPercentage}: {groupForm.percentage}%</label>
                                <input
                                    type="range"
                                    min="1"
                                    max="100"
                                    value={groupForm.percentage}
                                    onChange={(e) => setGroupForm(prev => ({ ...prev, percentage: parseInt(e.target.value) }))}
                                    className="percentage-slider"
                                />
                            </div>
                            <div className="form-group">
                                <label>{t.parentGroup}</label>
                                <select
                                    value={groupForm.parentGroupId || ''}
                                    onChange={(e) => setGroupForm(prev => ({ ...prev, parentGroupId: e.target.value || null }))}
                                >
                                    <option value="">{t.noParent}</option>
                                    {groups
                                        .filter(g => editingGroup ? g.id !== editingGroup.id : true)
                                        .map(g => (
                                            <option key={g.id} value={g.id}>{g.name}</option>
                                        ))
                                    }
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={resetGroupForm}>
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
