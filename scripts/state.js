
import { loadData, saveData } from './storage.js';

export const defaults = {
    budget: 500,
    base: 'USD',
    rates: {
        USD: 1,
        RWF: 1450,
        EUR: 0.86
    }
};

export let records = [];

export let settings = {
    ...defaults,
    rates: { ...defaults.rates }
};

export function initState() {
    records = loadData();

    try {
        const s = JSON.parse(
            localStorage.getItem('student-finance:settings') || 'null'
        );

        if (
            s &&
            Number.isFinite(s.budget) &&
            s.budget >= 0 &&
            ['USD', 'RWF', 'EUR'].includes(s.base) &&
            s.rates &&
            Object.values(s.rates).every(
                v => Number.isFinite(v) && v > 0
            )
        ) {
            settings = {
                ...defaults,
                ...s
            };
        }
    } catch {}
}

export function setRecords(next) {
    saveData(next);
    records = next;
}

export function setSettings(next) {
    localStorage.setItem(
        'student-finance:settings',
        JSON.stringify(next)
    );

    settings = next;
}

export function makeId() {
    return 'txn_' + (
        crypto.randomUUID
            ? crypto.randomUUID()
            : Date.now() + '_' +
              Math.random().toString(36).slice(2)
    );
}

export function convert(amount) {
    return amount * settings.rates[settings.base];
}

export function money(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: settings.base,
        maximumFractionDigits: settings.base === 'RWF' ? 0 : 2
    }).format(convert(amount));
}