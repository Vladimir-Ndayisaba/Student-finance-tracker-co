export function compileRegex(pattern, ignoreCase = true) {
    if (!pattern) {
        return null;
    }

    if (pattern.length > 100) {
        throw new Error(
            'Search pattern must be 100 characters or fewer.'
        );
    }

    try {
        return new RegExp(
            pattern,
            ignoreCase ? 'gi' : 'g'
        );
    } catch {
        throw new Error('Invalid regular expression.');
    }
}

export function sortRecords(records, mode) {
    const result = [...records];

    const [field, direction] = mode.split('-');
    const sign = direction === 'asc' ? 1 : -1;

    return result.sort((a, b) =>
        sign * (
            field === 'amount'
                ? a.amount - b.amount
                : field === 'date'
                    ? a.date.localeCompare(b.date)
                    : a.description.localeCompare(b.description)
        )
    );
}

export function matchesRecord(r, re) {
    if (!re) {
        return true;
    }

    re.lastIndex = 0;

    return [
        r.description,
        r.category,
        r.date,
        r.amount.toFixed(2)
    ].some(v => {
        re.lastIndex = 0;
        return re.test(v);
    });
}

export function highlightInto(el, value, re) {
    const text = String(value);

    el.replaceChildren();

    if (!re) {
        el.textContent = text;
        return;
    }

    const safe = new RegExp(
        re.source,
        re.flags.includes('g') ? re.flags : re.flags + 'g'
    );

    let last = 0;
    let match;

    while ((match = safe.exec(text)) !== null) {
        if (match.index > last) {
            el.append(
                document.createTextNode(
                    text.slice(last, match.index)
                )
            );
        }

        if (match[0].length) {
            const mark = document.createElement('mark');

            mark.textContent = match[0];
            el.append(mark);

            last = safe.lastIndex;
        } else {
            safe.lastIndex++;

            if (safe.lastIndex > text.length) {
                break;
            }
        }
    }

    el.append(
        document.createTextNode(text.slice(last))
    );
}