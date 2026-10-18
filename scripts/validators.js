import { downloadJSON, saveData } from "./storage";

export const patterns = {
    
    description: /^\S(?:.*\S)?$/,

    amount: /^(0|[1-9]\d*)(\.\d{1,2})?$/,

    date: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,

    category: /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/,

    duplicate: /\b(\w+)\s+\1\b/i
};

export function normalizeDescription(text) {
    return text.replace(/\s{2,}/g, ' ');
}

export function validDate(value) {
    if (!patterns.date.test(value)) {
        return false;
    }

    const [y, m, d] = value.split('-').map(Number);

    const date = new Date(
        Date.UTC(y, m - 1, d)
    );

    return (
        date.getUTCFullYear() === y &&
        date.getUTCMonth() === m - 1 &&
        date.getUTCDate() === d
    );
}

export function validateRecord(data) {
    const errors = {};

    if (
        typeof data.description !== 'string' ||
        !patterns.description.test(data.description) ||
        patterns.duplicate.test(data.description)
    ) {
        errors.description =
            'Remove leading/trailing spaces and repeated words.';
    }

    if (
        typeof data.amount !== 'string' ||
        !patterns.amount.test(data.amount) ||
        Number(data.amount) <= 0
    ) {
        errors.amount =
            'Enter an amount greater than zero, with up to two decimals.';
    }

    if (
        typeof data.category !== 'string' ||
        !patterns.category.test(data.category)
    ) {
        errors.category =
            'Use letters, spaces or hyphens only.';
    }

    if (
        typeof data.date !== 'string' ||
        !validDate(data.date)
    ) {
        errors.date =
            'Enter a real date in YYYY-MM-DD format.';
    }

    return errors;
}

export function validStoredRecord(r) {
    
    if (
        !r ||
        typeof r !== 'object' ||
        typeof r.id !== 'string' ||
        !/^txn_[A-Za-z0-9_-]+$/.test(r.id)
    ) {
        return false;
    }

    if (
        typeof r.amount !== 'number' ||
        !Number.isFinite(r.amount)
    ) {
        return false;
    }

    if (
        typeof r.createdAt !== 'string' ||
        typeof r.updatedAt !== 'string' ||
        !Number.isFinite(Date.parse(r.createdAt)) ||
        !Number.isFinite(Date.parse(r.updatedAt))
    ) {
        return false;
    }

    return Object.keys(
        validateRecord({
            ...r,
            amount: String(r.amount)
        })
    ).length === 0;
}

