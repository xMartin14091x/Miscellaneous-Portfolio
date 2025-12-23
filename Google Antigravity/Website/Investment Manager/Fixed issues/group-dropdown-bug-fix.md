# Group Dropdown Menu Bug Fix

## Issue Summary
**Problem:** The 3-dots dropdown menu for group headers would blink/flicker when hovered over another group, and was solid when not hovered. The dropdown also failed to open on click initially.

**Resolution Date:** December 23, 2024

---

## Symptoms
1. Dropdown menu blinks on hover when overlapping another group
2. Dropdown solid when not hovered  
3. Dropdown appeared at top-right of page instead of below button
4. Click on 3-dots initiated drag instead of opening menu

---

## Root Cause Analysis

### Why Investment Card Dropdowns Worked
```jsx
<div className="investment-header">  // Simple flex container
    <button className="menu-btn" onClick={...}>
    {activeMenu && <div className="dropdown-menu">...}
</div>
```
- `investment-header` is a simple flex container
- No drag events, no parent click handlers
- Dropdown inside has no conflicting events

### Why Group Dropdowns Failed
```jsx
<div 
    className="group-header"
    onClick={() => toggleGroupExpand()}  // ❌ Captures clicks
    draggable                             // ❌ Captures mouse events
    onDragStart={...}
    onDragOver={...}
    onDragEnd={...}
>
    <button className="menu-btn" onClick={...}>
    {activeMenu && <div className="dropdown-menu">...}  // ❌ Inside draggable!
</div>
```

**Issues identified:**
1. `group-header` has `onClick` for expand/collapse - captures all clicks
2. `group-header` has `draggable` + drag events - captures mouse interactions
3. `group-header:hover` CSS (`filter: brightness(1.05)`) - triggers on underlying groups
4. Dropdown positioned inside draggable container - overlapping groups trigger their hover CSS
5. Low `z-index: 150` on group dropdown (vs `z-index: 9999` on general dropdown)

---

## Failed Attempts

### Attempt 1: Increase z-index
Changed `.group-header .dropdown-menu { z-index: 150 }` → `z-index: 9999`

**Result:** Did not fix blinking - the hover CSS on underlying groups still triggered

### Attempt 2: Click-outside handler
Added `handleOutsideClick` to close menus when clicking blank areas

**Result:** Broke FAB button due to class name mismatch (`.fab-btn` vs `.fab-button`)

### Attempt 3: Fixed positioning with position calculation
Used `position: fixed` with calculated coordinates

**Result:** Complex, still had hover conflicts

### Attempt 4: CSS animations removal
Removed opacity/visibility/transform transitions

**Result:** Did not address the structural problem

---

## Final Solution

### 1. Moved dropdown OUTSIDE group-header
**Before:**
```jsx
<div className="group-header" draggable {...dragEvents}>
    <button className="menu-btn">...</button>
    {activeMenu && <div className="dropdown-menu">...</div>}  // Inside draggable
</div>
```

**After:**
```jsx
<div className="group-header" draggable {...dragEvents}>
    <button className="menu-btn">...</button>
</div>
{activeMenu && <div className="dropdown-menu">...</div>}  // Outside draggable
```

### 2. Prevented drag on menu button
```jsx
<button
    className="menu-btn"
    draggable="false"
    onDragStart={(e) => e.stopPropagation()}
    onMouseDown={(e) => e.stopPropagation()}
    onClick={(e) => { e.stopPropagation(); setActiveMenu(...); }}
>
```

### 3. Added position:relative to parent container
```css
.investment-group {
    position: relative;  /* Added - enables absolute positioning of dropdown */
}
```

### 4. Inline styles for dropdown positioning
```jsx
<div 
    className="dropdown-menu group-dropdown" 
    style={{ position: 'absolute', top: '3rem', right: '0.5rem', zIndex: 9999 }}
>
```

---

## Files Modified

| File | Changes |
|------|---------|
| `PlanningPage.jsx` | Restructured group dropdown location, added drag prevention to menu button |
| `PlanningPage.css` | Added `position: relative` to `.investment-group` |

---

## Key Learnings

1. **Event bubbling in nested draggable elements** - Children of draggable elements inherit drag behavior unless explicitly prevented
2. **CSS hover on overlapping elements** - Absolute positioned elements can trigger hover on underlying elements if in same stacking context
3. **z-index only works with positioning** - Need `position: relative` on parent for absolute children to work correctly
4. **stopPropagation is not enough** - Also need `draggable="false"` and `onMouseDown` prevention for drag elements

---

## Testing Checklist
- [x] Click 3-dots button opens dropdown
- [x] Dropdown appears below button (not top of page)
- [x] Hovering dropdown does not cause blinking
- [x] Dropdown overlapping other groups works correctly
- [x] Can still drag group headers to reorder
- [x] Group expand/collapse still works
- [x] Edit and Delete buttons in dropdown work
