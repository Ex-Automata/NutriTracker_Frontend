// log.js
// Handles filling and showing log entry data from a template

const macroKeys = [
    { key: 'calories', label: 'Calories', unit: 'kcal', color: '' },
    { key: 'protein', label: 'Protein', unit: 'g', color: 'protein' },
    { key: 'carbs', label: 'Carbs', unit: 'g', color: 'carbs' },
    { key: 'fat', label: 'Fat', unit: 'g', color: 'fat' },
    { key: 'fiber', label: 'Fiber', unit: 'g' },
    { key: 'sugar', label: 'Sugar', unit: 'g' },
    { key: 'sodium', label: 'Sodium', unit: 'mg' },
];
const microKeys = [
    { key: 'potassium', label: 'Potassium', unit: 'mg' },
    { key: 'calcium', label: 'Calcium', unit: 'mg' },
    { key: 'iron', label: 'Iron', unit: 'mg' },
    { key: 'vitamin_a', label: 'Vitamin A', unit: 'μg' },
    { key: 'vitamin_c', label: 'Vitamin C', unit: 'mg' },
    { key: 'vitamin_d', label: 'Vitamin D', unit: 'μg' },
    { key: 'vitamin_e', label: 'Vitamin E', unit: 'mg' },
    { key: 'vitamin_k', label: 'Vitamin K', unit: 'μg' },
    { key: 'magnesium', label: 'Magnesium', unit: 'mg' },
    { key: 'zinc', label: 'Zinc', unit: 'mg' },
    { key: 'alcohol', label: 'Alcohol', unit: 'g' }
];
// Sports log fields
const sportsKeys = [
    { key: 'calories_spent', label: 'Calories Burned', unit: 'kcal' },
    { key: 'distance', label: 'Distance', unit: 'm' },
    { key: 'steps', label: 'Steps', unit: '' },
    { key: 'duration_min', label: 'Duration', unit: 'min' },
    { key: 'weight_kg', label: 'Weight Used', unit: 'kg' },
    { key: 'reps', label: 'Reps', unit: '' },
    { key: 'sets', label: 'Sets', unit: '' }
];
// Body log fields
const bodyKeys = [
    { key: 'weight_kg', label: 'Body Weight', unit: 'kg' },
    { key: 'body_fat_percentage', label: 'Body Fat', unit: '%' },
    { key: 'muscle_mass_kg', label: 'Muscle Mass', unit: 'kg' },
    { key: 'bp_systolic', label: 'BP Systolic', unit: 'mmHg' },
    { key: 'bp_diastolic', label: 'BP Diastolic', unit: 'mmHg' },
    { key: 'hdl_cholesterol', label: 'HDL Chol.', unit: 'mg/dL' },
    { key: 'ldl_cholesterol', label: 'LDL Chol.', unit: 'mg/dL' },
    { key: 'triglycerides', label: 'Triglycerides', unit: 'mg/dL' },
    { key: 'resting_heart_rate', label: 'Resting HR', unit: 'bpm' }
];

window.setLogData = function(entry, log, dailyGoals = {}, opts) {
    console.log('[setLogData] called with log:', log, 'dailyGoals:', dailyGoals);
    // Helper to show/hide by class
    function show(el) {
        if (el) {
            el.classList.add('visible');
            el.classList.remove('hidden');
            el.style.display = ''; // Remove inline style if present
        }
    }
    function hide(el) {
        if (el) {
            el.classList.remove('visible');
            el.classList.add('hidden');
            el.style.display = ''; // Or set el.style.display = 'none'; if you want to force it
        }
    }

    // Title
    const title = entry.querySelector('#log-title');
    if (title && (log.title || log.activity_type)) {
        title.textContent = log.title || log.activity_type;
    }
    // Details
    //const details = entry.querySelector('#log-details');
    //if (details && log.details) {
    //    details.textContent = log.details;
    //    show(details);
    //} else { hide(details); }
    const isPending = entry.classList.contains('pending');
    // Macros
    macroKeys.forEach(macro => {
        const val = (log.macros && log.macros[macro.key]) || log[macro.key];
        const goal = dailyGoals[macro.key] || log[macro.key + '_goal'] || 0;
        const label = entry.querySelector(`#log-bar-label-${macro.key}`);
        const bar = entry.querySelector(`#log-bar-${macro.key}`);
        const fill = entry.querySelector(`#log-bar-fill-${macro.key}`);
        const barRow = label && label.parentElement && label.parentElement.classList.contains('bar-row') ? label.parentElement : null;
        if (val != null && !isNaN(val) && bar && fill && label && goal) {
            let percent = Math.round((val / goal.goal) * 100);
            if (goal && !isNaN(goal) && goal > 0) percent = Math.min(100, Math.round((val / goal) * 100));
            fill.style.width = percent + '%';
            const labelText = label.querySelector('.bar-label-text');
            const labelValue = label.querySelector('.bar-label-value');
            labelText.textContent = macro.label;
            let valueText = `${val}${macro.unit ? ' ' + macro.unit : ''}${goal ? ' / ' + goal.goal + (macro.unit ? ' ' + macro.unit : '') : ''}`;
            if (opts.static) {
                if (barRow) barRow.classList.add('static-bar-row');
                if (labelValue) labelValue.style.display = 'none';
                bar.setAttribute('title', valueText);
                label.classList.add('small');
            } else {
                if (barRow) barRow.classList.remove('static-bar-row');
                if (labelValue) labelValue.style.display = '';
                bar.removeAttribute('title');
            }
            if (isPending) {
                labelValue.innerHTML = `<input type='number' class='log-value-input' value='${val}' style='width:60px' min='0'><span class='bar-label-value-unit'>${macro.unit}</span>`;
                const input = labelValue.querySelector('input');
                input.addEventListener('change', e => {
                    if (log.macros && macro.key in log.macros) log.macros[macro.key] = Number(e.target.value);
                    else log[macro.key] = Number(e.target.value);
                    let newVal = Number(e.target.value);
                    let percent = goal && goal.goal > 0 ? Math.min(100, Math.round((newVal / goal.goal) * 100)) : 10;
                    fill.style.width = percent + '%';
                });
            } else {
                labelValue.innerHTML = `${val}<span class='bar-label-value-unit'>${macro.unit}</span>${goal ? ' / ' + goal + `<span class='bar-label-value-unit'>${macro.unit}</span>` : ''}`;
            }
            show(label);
            show(bar);
        } else { 
            hide(label); hide(bar); }
    });
    // Micros
    microKeys.forEach(micro => {
        const val = (log.micros && log.micros[micro.key]) || log[micro.key];
        const label = entry.querySelector(`#log-bar-label-${micro.key}`);
        const bar = entry.querySelector(`#log-bar-${micro.key}`);
        const fill = entry.querySelector(`#log-bar-fill-${micro.key}`);
        const barRow = label && label.parentElement && label.parentElement.classList.contains('bar-row') ? label.parentElement : null;
        if (val != null && !isNaN(val) && bar && fill && label) {
            let percent = 100;
            const goal = dailyGoals[micro.key] || log[micro.key + '_goal'] || null;
            if (goal && !isNaN(goal) && goal > 0) {
                percent = Math.min(100, Math.round((val / goal) * 100));
            }
            fill.style.width = percent + '%';
            const labelText = label.querySelector('.bar-label-text');
            const labelValue = label.querySelector('.bar-label-value');
            labelText.textContent = micro.label;
            let valueText = `${val}${micro.unit ? ' ' + micro.unit : ''}${goal ? ' / ' + goal + (micro.unit ? ' ' + micro.unit : '') : ''}`;
            if (opts.static) {
                if (barRow) barRow.classList.add('static-bar-row');
                if (labelValue) labelValue.style.display = 'none';
                bar.setAttribute('title', valueText);
            } else {
                if (barRow) barRow.classList.remove('static-bar-row');
                if (labelValue) labelValue.style.display = '';
                bar.removeAttribute('title');
            }
            if (isPending) {
                labelValue.innerHTML = `<input type='number' class='log-value-input' value='${val}' style='width:60px' min='0'><span class='bar-label-value-unit'>${micro.unit}</span>${goal ? ' / ' + goal + `<span class='bar-label-value-unit'>${micro.unit}</span>` : ''}`;
                const input = labelValue.querySelector('input');
                input.addEventListener('change', e => {
                    if (log.micros && micro.key in log.micros) log.micros[micro.key] = Number(e.target.value);
                    else log[micro.key] = Number(e.target.value);
                    let newVal = Number(e.target.value);
                    let percent = goal && goal > 0 ? Math.min(100, Math.round((newVal / goal) * 100)) : 100;
                    fill.style.width = percent + '%';
                });
            } else {
                labelValue.innerHTML = `${val}<span class='bar-label-value-unit'>${micro.unit}</span>${goal ? ' / ' + goal + `<span class='bar-label-value-unit'>${micro.unit}</span>` : ''}`;
            }
            show(label);
            show(bar);
        } else { hide(label); hide(bar); }
    });
    // Sports log fields
    sportsKeys.forEach(field => {
        const val = log[field.key];
        const label = entry.querySelector(`#log-bar-label-${field.key}`);
        const bar = entry.querySelector(`#log-bar-${field.key}`);
        const fill = entry.querySelector(`#log-bar-fill-${field.key}`);
        const barRow = label && label.parentElement && label.parentElement.classList.contains('bar-row') ? label.parentElement : null;
        if (val != null && !isNaN(val) && bar && fill && label) {
            fill.style.width = '10%';
            const labelText = label.querySelector('.bar-label-text');
            const labelValue = label.querySelector('.bar-label-value');
            labelText.textContent = field.label;
            let valueText = `${val}${field.unit ? ' ' + field.unit : ''}`;
            if (opts.static) {
                if (barRow) barRow.classList.add('static-bar-row');
                if (labelValue) labelValue.style.display = 'none';
                bar.setAttribute('title', valueText);
            } else {
                if (barRow) barRow.classList.remove('static-bar-row');
                if (labelValue) labelValue.style.display = '';
                bar.removeAttribute('title');
            }
            if (isPending) {
                labelValue.innerHTML = `<input type='number' class='log-value-input' value='${val}' style='width:60px' min='0'><span class='bar-label-value-unit'>${field.unit}</span>`;
                const input = labelValue.querySelector('input');
                input.addEventListener('change', e => {
                    log[field.key] = Number(e.target.value);
                });
            } else {
                labelValue.innerHTML = `${val}<span class='bar-label-value-unit'>${field.unit}</span>`;
            }
            show(label); show(bar);
        } else { hide(label); hide(bar); }
    });
    // Body log fields
    bodyKeys.forEach(field => {
        const val = log[field.key];
        const label = entry.querySelector(`#log-bar-label-${field.key}`);
        const bar = entry.querySelector(`#log-bar-${field.key}`);
        const fill = entry.querySelector(`#log-bar-fill-${field.key}`);
        const barRow = label && label.parentElement && label.parentElement.classList.contains('bar-row') ? label.parentElement : null;
        if (val != null && !isNaN(val) && bar && fill && label) {
            fill.style.width = '10%';
            const labelText = label.querySelector('.bar-label-text');
            const labelValue = label.querySelector('.bar-label-value');
            labelText.textContent = field.label;
            let valueText = `${val}${field.unit ? ' ' + field.unit : ''}`;
            if (opts.static) {
                if (barRow) barRow.classList.add('static-bar-row');
                if (labelValue) labelValue.style.display = 'none';
                bar.setAttribute('title', valueText);
            } else {
                if (barRow) barRow.classList.remove('static-bar-row');
                if (labelValue) labelValue.style.display = '';
                bar.removeAttribute('title');
            }
            if (isPending) {
                labelValue.innerHTML = `<input type='number' class='log-value-input' value='${val}' style='width:60px' min='0'><span class='bar-label-value-unit'>${field.unit}</span>`;
                const input = labelValue.querySelector('input');
                input.addEventListener('change', e => {
                    log[field.key] = Number(e.target.value);
                });
            } else {
                labelValue.innerHTML = `${val}<span class='bar-label-value-unit'>${field.unit}</span>`;
            }
            show(label); show(bar);
        } else { hide(label); hide(bar); }
    });
}
