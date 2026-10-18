
import { money, records, settings } from './state.js';
import { highlightInto } from './search.js';

export const $ = id => document.getElementById(id);

export function status(id, message, error = false) {
    const el = $(id);

    el.textContent = message;
    el.classList.toggle('is-error', error);
}

export function renderTable(items, re, onEdit, onDelete) {
    const tbody = $('transaction-list');

    tbody.replaceChildren();

    if (!items.length) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');

        td.colSpan = 5;
        td.textContent = 'No matching transactions.';

        tr.append(td);
        tbody.append(tr);

        return;
    }

    for (const r of items) {
        const tr = document.createElement('tr');
        tr.className = 'transaction-row';

        const fields = [
            ['date', r.date],
            ['description', r.description],
            ['category', r.category],
            ['amount', money(r.amount)]
        ];

        for (const [field, value] of fields) {
            const td = document.createElement('td');

            td.dataset.label =
                field[0].toUpperCase() + field.slice(1);

            highlightInto(td, value, re);
            tr.append(td);
        }

        const td = document.createElement('td');
        td.dataset.label = 'Actions';

        const edit = document.createElement('button');

        edit.type = 'button';
        edit.textContent = 'Edit';
        edit.className = 'small-button';

        edit.setAttribute(
            'aria-label',
            'Edit ' + r.description
        );

        edit.addEventListener('click', () => onEdit(r));

        const del = document.createElement('button');

        del.type = 'button';
        del.textContent = 'Delete';
        del.className = 'small-button danger-button';

        del.setAttribute(
            'aria-label',
            'Delete ' + r.description
        );

        del.addEventListener('click', () => onDelete(r));

        td.append(
            edit,
            document.createTextNode(' '),
            del
        );

        tr.append(td);
        tbody.append(tr);
    }
}

export function renderStats() {

    const sum = records.reduce(
        (n, r) => n + r.amount,
        0
    );

    $('total-records').textContent = records.length;
    $('total-spent').textContent = money(sum);

    const totals = {};

    for (const r of records) {
        totals[r.category] =
            (totals[r.category] || 0) + r.amount;
    }

    const top = Object.entries(totals)
        .sort((a, b) => b[1] - a[1])[0];

    $('top-category').textContent = top ? top[0] : 'None';

    const now = new Date();

    const today = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    );

    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);

        d.setDate(today.getDate() - 6 + i);

        return [
            d.getFullYear(),
            String(d.getMonth() + 1).padStart(2, '0'),
            String(d.getDate()).padStart(2, '0')
        ].join('-');
    });

    const vals = days.map(d =>
        records
            .filter(r => r.date === d)
            .reduce((s, r) => s + r.amount, 0)
    );

    const weekTotal = vals.reduce(
        (a, b) => a + b,
        0
    );

    $('week-total').textContent = money(weekTotal);

    const monthly = records
        .filter(r => r.date.startsWith(days[6].slice(0, 7)))
        .reduce((s, r) => s + r.amount, 0);

    const remaining = settings.budget - monthly;

    $('budget-spent').textContent = money(monthly);
    $('budget-cap').textContent = money(settings.budget);

    const percent = settings.budget
        ? Math.min(100, monthly / settings.budget * 100)
        : (monthly ? 100 : 0);

    $('budget-progress').style.width = percent + '%';

    const bar = $('budget-bar');

    bar.setAttribute(
        'aria-valuemax',
        String(settings.budget)
    );

    bar.setAttribute(
        'aria-valuenow',
        String(Math.min(monthly, settings.budget))
    );

    bar.setAttribute(
        'aria-valuetext',
        `${money(monthly)} spent of ${money(settings.budget)}`
    );

    const msg = remaining < 0
        ? 'Budget exceeded by ' + money(-remaining)
        : money(remaining) + ' remaining this month.';

    const live = $('budget-status');

    live.textContent = msg;

    live.setAttribute(
        'role',
        remaining < 0 ? 'alert' : 'status'
    );

    live.setAttribute(
        'aria-live',
        remaining < 0 ? 'assertive' : 'polite'
    );

    live.classList.toggle('is-error', remaining < 0);

    const chart = $('spending-chart');

    chart.replaceChildren();

    const max = Math.max(1, ...vals);

    for (let i = 0; i < 7; i++) {
        const item = document.createElement('div');
        item.className = 'chart-item';

        const bar = document.createElement('div');
        bar.className = 'chart-bar';

        bar.style.height =
            Math.round(vals[i] / max * 110) + 'px';

        const label = document.createElement('span');
        label.textContent = days[i].slice(5);

        item.title = days[i] + ': ' + money(vals[i]);

        item.append(bar, label);
        chart.append(item);
    }

    chart.setAttribute(
        'aria-label',
        'Last seven days spending: ' +
        days.map((d, i) =>
            d + ' ' + money(vals[i])
        ).join(', ')
    );
}

