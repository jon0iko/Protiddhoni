const INVISIBLE_UNICODE = /[\u200B-\u200D\uFEFF]/g;

export function normalizeSearchText(value: unknown): string {
    return String(value ?? '')
        .normalize('NFC')
        .replace(INVISIBLE_UNICODE, '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLocaleLowerCase('bn-BD');
}

function relationValue(relation: any, key: string): unknown {
    const value = Array.isArray(relation) ? relation[0] : relation;
    return value?.[key];
}

export function getContentSearchRank(content: any, searchText: string): number {
    const query = normalizeSearchText(searchText);
    if (!query) return Number.MAX_SAFE_INTEGER;

    const title = normalizeSearchText(content?.title);
    const excerpt = normalizeSearchText(content?.excerpt);
    const username = normalizeSearchText(relationValue(content?.author, 'username'));
    const fullName = normalizeSearchText(relationValue(content?.author, 'full_name'));
    const authorValues = [username, fullName].filter(Boolean);

    if (title === query) return 0;
    if (title.startsWith(query)) return 1;
    if (authorValues.some(value => value === query)) return 2;
    if (title.includes(query)) return 3;
    if (authorValues.some(value => value.startsWith(query))) return 4;
    if (authorValues.some(value => value.includes(query))) return 5;
    if (excerpt.includes(query)) return 6;

    return Number.MAX_SAFE_INTEGER;
}

function compareValues(left: any, right: any, column: string, order: string): number {
    const direction = order === 'asc' ? 1 : -1;

    if (column === 'title') {
        return normalizeSearchText(left?.title).localeCompare(
            normalizeSearchText(right?.title),
            'bn-BD'
        ) * direction;
    }

    if (column === 'view_count') {
        return ((Number(left?.view_count) || 0) - (Number(right?.view_count) || 0)) * direction;
    }

    const leftTime = new Date(left?.[column] || 0).getTime();
    const rightTime = new Date(right?.[column] || 0).getTime();
    return (leftTime - rightTime) * direction;
}

export function sortContentByRelevance(
    contents: any[],
    searchText: string,
    tieBreaker = { column: 'published_at', order: 'desc' }
): any[] {
    return [...contents].sort((left, right) => {
        const rankDifference =
            getContentSearchRank(left, searchText) - getContentSearchRank(right, searchText);

        if (rankDifference !== 0) return rankDifference;
        return compareValues(left, right, tieBreaker.column, tieBreaker.order);
    });
}
