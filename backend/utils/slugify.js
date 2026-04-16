/**
 * Utility: Slugify
 * Converts text to URL-friendly slug
 * Handles Bangla text by transliterating to English
 * Appends unique suffix to ensure slug uniqueness
 */

const { v4: uuidv4 } = require('uuid');

// Bangla to English transliteration map
const banglaToEnglish = {
    'অ': 'a', 'আ': 'a', 'ি': 'i', 'ী': 'i', 'উ': 'u', 'ঊ': 'u',
    'ঋ': 'ri', 'এ': 'e', 'ঐ': 'oi', 'ও': 'o', 'ঔ': 'ou',
    'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
    'চ': 'ch', 'ছ': 'chh', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'n',
    'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
    'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
    'প': 'p', 'ফ': 'ph', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
    'য': 'j', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh',
    'স': 's', 'হ': 'h', 'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y',
    'ৎ': 't', 'ং': 'ng', 'ঃ': 'h', 'ঁ': 'n',
    'া': 'a', 'ে': 'e', 'ো': 'o', 'ৌ': 'ou',
    'ু': 'u', 'ূ': 'u', 'ৃ': 'ri',
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
};

const transliterateBangla = (text) => {
    return text.split('').map(char => banglaToEnglish[char] || char).join('');
};

const generateShortSuffix = () => {
    // Generate a short unique suffix from UUID (first 8 chars)
    return uuidv4().slice(0, 8);
};

/**
 * Create a new slug from text with a unique suffix
 */
const slugify = (text, addUniqueSuffix = true) => {
    if (!text) return '';
    
    // First transliterate Bangla to English
    let slug = transliterateBangla(text);
    
    // Then apply standard slug transformations
    slug = slug
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
    
    // Append unique suffix if requested
    if (addUniqueSuffix) {
        const suffix = generateShortSuffix();
        slug = `${slug}-${suffix}`;
    }
    
    return slug;
};

/**
 * Update an existing slug (preserves the unique suffix)
 * @param {string} existingSlug - The existing slug with suffix (e.g., "old-title-a1b2c3d4")
 * @param {string} newTitle - The new title to update
 * @returns {string} - Updated slug with preserved suffix
 */
const updateSlugFromTitle = (existingSlug, newTitle) => {
    if (!existingSlug || !newTitle) return slugify(newTitle);
    
    // Extract the suffix from existing slug (last 8 chars after the last dash)
    const parts = existingSlug.split('-');
    const potentialSuffix = parts[parts.length - 1];
    
    // Check if it looks like a UUID suffix (8 hex lowercase characters)
    const isValidSuffix = /^[a-f0-9]{8}$/.test(potentialSuffix);
    
    if (!isValidSuffix) {
        // If no valid suffix found, generate a new slug
        return slugify(newTitle);
    }
    
    // Generate new slug from title without suffix
    const newSlugBase = slugify(newTitle, false);
    
    // Combine new title slug with preserved suffix
    return `${newSlugBase}-${potentialSuffix}`;
};

module.exports = slugify;
module.exports.generateShortSuffix = generateShortSuffix;
module.exports.updateSlugFromTitle = updateSlugFromTitle;
