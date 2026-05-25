/**
 * Ticket pricing helpers for percentage discounts.
 * Maps ticket_categories.price → original_price; discount_value (when percentage) → discount_percentage.
 */

function calculateDiscountedPrice(originalPrice, discountType = 'none', discountValue = 0) {
    const base = parseFloat(originalPrice) || 0;
    const type = discountType || 'none';
    const value = parseFloat(discountValue) || 0;

    if (base <= 0) return 0;

    if (type === 'percentage' && value > 0 && value <= 100) {
        return Math.round(base * (1 - value / 100) * 100) / 100;
    }
    if (type === 'fixed' && value > 0) {
        return Math.round(Math.max(0, base - value) * 100) / 100;
    }
    return Math.round(base * 100) / 100;
}

function normalizePercentageDiscount(input = {}) {
    let discountType = input.discount_type || 'none';
    let discountValue =
        input.discount_value !== undefined && input.discount_value !== null
            ? parseFloat(input.discount_value)
            : NaN;

    if (
        (input.discount_percentage !== undefined && input.discount_percentage !== null) ||
        (input.discountPercentage !== undefined && input.discountPercentage !== null)
    ) {
        const pct = parseFloat(input.discount_percentage ?? input.discountPercentage);
        discountValue = isNaN(pct) ? 0 : pct;
        discountType = discountValue > 0 ? 'percentage' : 'none';
    }

    if (isNaN(discountValue)) discountValue = 0;
    if (discountValue < 0) {
        return { error: 'Discount percentage cannot be negative' };
    }
    if (discountType === 'percentage' && discountValue > 100) {
        return { error: 'Discount percentage must be between 0 and 100' };
    }
    if (discountValue === 0 || discountType === 'none') {
        return { discount_type: 'none', discount_value: 0 };
    }
    if (discountType !== 'none' && discountType !== 'percentage' && discountType !== 'fixed') {
        return { error: 'Invalid discount type. Must be none, percentage, or fixed' };
    }

    return { discount_type: discountType, discount_value: discountValue };
}

function enrichTicketCategory(row) {
    if (!row) return row;

    const originalPrice = parseFloat(row.price) || 0;
    const discountType = row.discount_type || 'none';
    const discountValue = parseFloat(row.discount_value) || 0;
    const discountedPrice = calculateDiscountedPrice(originalPrice, discountType, discountValue);

    let discountPercentage = 0;
    if (discountType === 'percentage' && discountValue > 0) {
        discountPercentage = discountValue;
    } else if (discountType === 'fixed' && discountValue > 0 && originalPrice > 0) {
        discountPercentage = Math.round((discountValue / originalPrice) * 100);
    }

    return {
        ...row,
        original_price: originalPrice,
        discount_percentage: discountPercentage,
        discounted_price: discountedPrice,
    };
}

module.exports = {
    calculateDiscountedPrice,
    normalizePercentageDiscount,
    enrichTicketCategory,
};
