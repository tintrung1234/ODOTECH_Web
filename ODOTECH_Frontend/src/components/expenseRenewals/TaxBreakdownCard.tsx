import { type TaxBreakdown, formatCurrencyVnd } from '../../utils/taxCalculator';

type TaxBreakdownCardProps = {
    taxBreakdown: TaxBreakdown;
    netAmount: number;
};

export default function TaxBreakdownCard({ taxBreakdown, netAmount }: TaxBreakdownCardProps) {
    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs font-bold text-blue-900 mb-2">Chi tiết thuế & bảo hiểm:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-gray-700">TNCN:</div>
                <div className="text-right font-medium">{formatCurrencyVnd(taxBreakdown.personal_income_tax)}</div>

                <div className="text-gray-700">BHXH (8%):</div>
                <div className="text-right font-medium">{formatCurrencyVnd(taxBreakdown.social_insurance)}</div>

                <div className="text-gray-700">BHYT (1.5%):</div>
                <div className="text-right font-medium">{formatCurrencyVnd(taxBreakdown.health_insurance)}</div>

                <div className="text-gray-700">BHTN (1%):</div>
                <div className="text-right font-medium">{formatCurrencyVnd(taxBreakdown.unemployment_insurance)}</div>
            </div>
            <div className="mt-2 pt-2 border-t border-blue-300 flex justify-between text-sm font-bold text-blue-900">
                <span>Tổng thuế:</span>
                <span>{formatCurrencyVnd(taxBreakdown.total)}</span>
            </div>
            <div className="mt-1 pt-2 border-t border-blue-300 flex justify-between text-sm font-bold">
                <span className="text-gray-700">Lương Net:</span>
                <span className="text-green-700">{formatCurrencyVnd(netAmount)}</span>
            </div>
        </div>
    );
}
