/**
 * Tax Calculation Utilities for Vietnamese Payroll
 * Calculates personal income tax, social insurance, health insurance, and unemployment insurance
 */

/**
 * Calculate Vietnamese personal income tax and insurance contributions
 * @param {number} grossAmount - Gross salary before tax
 * @returns {object} Tax breakdown and net amount
 */
function calculateVietnameseTax(grossAmount) {
    if (!grossAmount || grossAmount <= 0) {
        return {
            gross_amount: 0,
            tax_amount: 0,
            net_amount: 0,
            tax_breakdown: {
                personal_income_tax: 0,
                social_insurance: 0,
                health_insurance: 0,
                unemployment_insurance: 0,
                total: 0,
            },
        };
    }

    // Insurance contributions (based on gross salary)
    const socialInsurance = Math.round(grossAmount * 0.08); // 8% BHXH
    const healthInsurance = Math.round(grossAmount * 0.015); // 1.5% BHYT
    const unemploymentInsurance = Math.round(grossAmount * 0.01); // 1% BHTN

    // Calculate taxable income
    const personalDeduction = 11000000; // 11 million VND personal deduction
    const insuranceDeductions = socialInsurance + healthInsurance + unemploymentInsurance;
    const taxableIncome = grossAmount - insuranceDeductions - personalDeduction;

    // Progressive personal income tax calculation
    let personalIncomeTax = 0;
    if (taxableIncome > 0) {
        if (taxableIncome <= 5000000) {
            personalIncomeTax = Math.round(taxableIncome * 0.05); // 5%
        } else if (taxableIncome <= 10000000) {
            personalIncomeTax = Math.round(250000 + (taxableIncome - 5000000) * 0.10); // 10%
        } else if (taxableIncome <= 18000000) {
            personalIncomeTax = Math.round(750000 + (taxableIncome - 10000000) * 0.15); // 15%
        } else if (taxableIncome <= 32000000) {
            personalIncomeTax = Math.round(1950000 + (taxableIncome - 18000000) * 0.20); // 20%
        } else if (taxableIncome <= 52000000) {
            personalIncomeTax = Math.round(4750000 + (taxableIncome - 32000000) * 0.25); // 25%
        } else if (taxableIncome <= 80000000) {
            personalIncomeTax = Math.round(9750000 + (taxableIncome - 52000000) * 0.30); // 30%
        } else {
            personalIncomeTax = Math.round(18150000 + (taxableIncome - 80000000) * 0.35); // 35%
        }
    }

    const totalTax = personalIncomeTax + socialInsurance + healthInsurance + unemploymentInsurance;
    const netAmount = grossAmount - totalTax;

    return {
        gross_amount: grossAmount,
        tax_amount: totalTax,
        net_amount: netAmount,
        tax_breakdown: {
            personal_income_tax: personalIncomeTax,
            social_insurance: socialInsurance,
            health_insurance: healthInsurance,
            unemployment_insurance: unemploymentInsurance,
            total: totalTax,
        },
    };
}

/**
 * Format tax breakdown for display
 * @param {object} taxBreakdown - Tax breakdown object
 * @returns {string} Formatted string
 */
function formatTaxBreakdown(taxBreakdown) {
    if (!taxBreakdown) return "Chưa có thông tin thuế";

    return `TNCN: ${formatCurrency(taxBreakdown.personal_income_tax)}, ` +
        `BHXH: ${formatCurrency(taxBreakdown.social_insurance)}, ` +
        `BHYT: ${formatCurrency(taxBreakdown.health_insurance)}, ` +
        `BHTN: ${formatCurrency(taxBreakdown.unemployment_insurance)}`;
}

/**
 * Format currency in VND
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency
 */
function formatCurrency(amount) {
    if (amount === null || amount === undefined) return "0 đ";
    return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
}

module.exports = {
    calculateVietnameseTax,
    formatTaxBreakdown,
    formatCurrency,
};
