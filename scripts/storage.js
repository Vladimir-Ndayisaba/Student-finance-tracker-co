
import { validStoredRecord } from './validators.js';

const KEY = 'student-finance:v1';

export function validateDataset(data) {
    if (
        !Array.isArray(data) ||
        data.length > 10000 ||
        !data.every(validStoredRecord)
    ) {
        throw new Error(
            'JSON must contain an array of valid transactions (maximum 10,000).'
        );
    }

    if (
        new Set(data.map(r => r.id)).size !== data.length
    ) {
        throw new Error('Duplicate transaction IDs found.');
    }

    return data;
}

export function loadData() {
    try {
        const raw = localStorage.getItem(KEY);

        return raw
            ? validateDataset(JSON.parse(raw))
            : [];

    } catch (e) {
        console.error(e);

        throw new Error(
            'Saved data is invalid. Export a backup before resetting storage.'
        );
    }
}

export function saveData(records) {
    localStorage.setItem(
        KEY,
        JSON.stringify(validateDataset(records))
    );
}

export function downloadJSON(records) {
    const blob = new Blob(
        [JSON.stringify(records, null, 2)],
        { type: 'application/json' }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');

    a.href = url;
    a.download = 'transactions.json';
    a.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function readJSON(file) {
    if (file.size > 2_000_000) {
        throw new Error('File exceeds 2 MB.');
    }

    return validateDataset(
        JSON.parse(await file.text())
    );
}