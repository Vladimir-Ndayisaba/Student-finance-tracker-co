
import {
    patterns,
    normalizeDescription,
    validateRecord
} from './validators.js';

import {
    compileRegex,
    sortRecords,
    matchesRecord
} from './search.js';

import {
    records,
    settings,
    initState,
    setRecords,
    setSettings,
    makeId
} from './state.js';

import {
    readJSON,
    downloadJSON,
    saveData
} from './storage.js';

import {
    $,
    status,
    renderTable,
    renderStats
} from './ui.js';

let editing = null;

function draw() {
    let re = null;

    try {
        re = compileRegex(
            $('search').value,
            $('case-insensitive').checked
        );

        status('search-error', '');

    } catch (e) {
        status('search-error', e.message, true);
        return;
    }

    const sorted = sortRecords(
        records,
        $('sort').value
    );

    const filtered = sorted.filter(
        r => matchesRecord(r, re)
    );

    renderTable(
        filtered,
        re,
        startEdit,
        deleteRecord
    );

    renderStats();
}

function formData() {
    return {
        description: normalizeDescription(
            $('description').value
        ),
        amount: $('amount').value,
        category: $('category').value,
        date: $('date').value
    };
}

function validateForm() {
    const data = formData();
    const errors = validateRecord(data);

    for (const name of [
        'description',
        'amount',
        'category',
        'date'
    ]) {
        status(
            name + '-error',
            errors[name] || '',
            !!errors[name]
        );

        $(name).setAttribute(
            'aria-invalid',
            String(!!errors[name])
        );
    }

    return { data, errors };
}

function startEdit(r) {
    editing = r.id;

    $('transaction-id').value = r.id;

    for (const name of [
        'description',
        'amount',
        'category',
        'date'
    ]) {
        $(name).value = r[name];
    }

    $('form-heading').textContent = 'Edit Transaction';
    $('save-button').textContent = 'Save Changes';
    $('cancel-edit').hidden = false;

    $('add-transaction').scrollIntoView();
    $('description').focus();
}

function cancelEdit() {
    editing = null;

    $('transaction-form').reset();

    $('form-heading').textContent = 'Add Transaction';
    $('save-button').textContent = 'Add Transaction';
    $('cancel-edit').hidden = true;

    for (const n of [
        'description',
        'amount',
        'category',
        'date'
    ]) {
        status(n + '-error', '');
        $(n).removeAttribute('aria-invalid');
    }

    setToday();
}

function deleteRecord(r) {
    if (!confirm('Delete ' + r.description + '?')) {
        return;
    }

    try {
        const updatedRecords = records.filter(
            x => x.id !== r.id
        );

        setRecords(updatedRecords);

        if (editing === r.id) {
            cancelEdit();
        }

        draw();

        status(
            'form-status',
            'Transaction deleted.'
        );

    } catch (e) {
        status('form-status', e.message, true);
    }
}

function setToday() {
    const d = new Date();

    $('date').value = [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, '0'),
        String(d.getDate()).padStart(2, '0')
    ].join('-');
}

function setup() {
    try {
        initState();

    } catch (e) {
        status('data-status', e.message, true);

        $('transaction-form')
            .querySelector('button[type=submit]')
            .disabled = true;

        return;
    }

    $('budget-input').value = settings.budget;
    $('base-currency').value = settings.base;
    $('rwf-rate').value = settings.rates.RWF;
    $('eur-rate').value = settings.rates.EUR;

    setToday();

    for (const id of [
        'search',
        'sort',
        'case-insensitive'
    ]) {
        $(id).addEventListener(
            id === 'search' ? 'input' : 'change',
            draw
        );
    }

    for (const id of [
        'description',
        'amount',
        'category',
        'date'
    ]) {
        $(id).addEventListener(
            'input',
            validateForm
        );
    }

    $('transaction-form').addEventListener(
        'submit',
        e => {
            e.preventDefault();

            const { data, errors } = validateForm();

            if (Object.keys(errors).length) {
                status(
                    'form-status',
                    'Correct the highlighted fields.',
                    true
                );
                return;
            }

            const now = new Date().toISOString();

            const old = records.find(
                r => r.id === editing
            );

            const next = {
                id: old?.id || makeId(),
                description: data.description,
                amount: Number(data.amount),
                category: data.category,
                date: data.date,
                createdAt: old?.createdAt || now,
                updatedAt: now
            };

            try {
                const updatedRecords = old
                    ? records.map(r =>
                        r.id === editing ? next : r
                    )
                    : [...records, next];

                setRecords(updatedRecords);

                cancelEdit();
                draw();

                status(
                    'form-status',
                    old
                        ? 'Transaction updated.'
                        : 'Transaction added.'
                );

            } catch (err) {
                status(
                    'form-status',
                    err.message,
                    true
                );
            }
        }
    );

    $('cancel-edit').addEventListener(
        'click',
        cancelEdit
    );

    function saveSettings() {
        const budget = Number(
            $('budget-input').value
        );

        const rwf = Number(
            $('rwf-rate').value
        );

        const eur = Number(
            $('eur-rate').value
        );

        if (
            !$('budget-input').value ||
            budget < 0 ||
            !Number.isFinite(budget) ||
            !$('rwf-rate').value ||
            !$('eur-rate').value ||
            rwf <= 0 ||
            eur <= 0 ||
            !Number.isFinite(rwf) ||
            !Number.isFinite(eur)
        ) {
            status(
                'settings-status',
                'Enter a nonnegative budget and positive exchange rates.',
                true
            );
            return;
        }

        try {
            setSettings({
                budget,
                base: $('base-currency').value,
                rates: {
                    USD: 1,
                    RWF: rwf,
                    EUR: eur
                }
            });

            draw();

            status(
                'settings-status',
                'Settings saved.'
            );

        } catch (e) {
            status(
                'settings-status',
                e.message,
                true
            );
        }
    }

    for (const id of [
        'budget-input',
        'base-currency',
        'rwf-rate',
        'eur-rate'
    ]) {
        $(id).addEventListener(
            'change',
            saveSettings
        );
    }

    $('export-button').addEventListener(
        'click',
        () => {
            downloadJSON(records);

            status(
                'data-status',
                'JSON export started.'
            );
        }
    );

    $('import-file').addEventListener(
        'change',
        async e => {
            const file = e.target.files[0];

            if (!file) {
                return;
            }

            try {
                const incoming = await readJSON(file);

                const confirmed = confirm(
                    'Replace all existing transactions with ' +
                    incoming.length +
                    ' imported records?'
                );

                if (!confirmed) {
                    return;
                }

                setRecords(incoming);

                cancelEdit();
                draw();

                status(
                    'data-status',
                    'Imported ' +
                    incoming.length +
                    ' transactions.'
                );

            } catch (err) {
                status(
                    'data-status',
                    'Import failed: ' + err.message,
                    true
                );

            } finally {
                e.target.value = '';
            }
        }
    );

    draw();
}

setup();
