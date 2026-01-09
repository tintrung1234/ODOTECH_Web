import { useEffect, useMemo, useState } from 'react';

import type { Account } from '../components/projectsDasboard/interface/type';
import { getTokenUser } from '../utils/auth';

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function SalaryDraft() {
  const apiBaseUrl = useMemo(() => {
    const envUrl = import.meta.env.VITE_API_URL;
    return envUrl && envUrl.trim() ? envUrl.trim().replace(/\/$/, '') : 'http://localhost:5000';
  }, []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const [baseSalary, setBaseSalary] = useState<number>(0);
  const [payable, setPayable] = useState<number>(0);
  const [bonus, setBonus] = useState<number>(0);
  const [deduction, setDeduction] = useState<number>(0);

  const net = useMemo(() => {
    return toNumber(baseSalary) + toNumber(bonus) - toNumber(deduction) - toNumber(payable);
  }, [baseSalary, bonus, deduction, payable]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const user = await getTokenUser();
        const uid = typeof user?.uid === 'number' ? user.uid : null;
        if (!uid) return;

        const res = await fetch(`${apiBaseUrl}/api/accounts/${uid}`, { credentials: 'include' });
        if (!res.ok) return;
        const acc = (await res.json()) as Account;

        setBaseSalary(toNumber(acc.salary));
        setPayable(toNumber(acc.payable));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Không tải được dữ liệu lương.');
      } finally {
        setLoading(false);
      }
    })();
  }, [apiBaseUrl]);

  return (
    <main className="flex-1 px-6 py-3">
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="mb-5">
          <h1 className="text-3xl font-extrabold text-gray-900">Form tính lương nháp</h1>
          <div className="text-sm text-gray-600 mt-1">Mục đích: nhân sự tự tính lương cá nhân (tạm tính).</div>
        </div>

        {error ? (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-gray-200 p-5">
            <div className="text-lg font-semibold text-gray-900">Thông tin nhập</div>
            <div className="text-sm text-gray-600 mt-1">Các giá trị này chỉ để tạm tính, không lưu vào hệ thống.</div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lương cơ bản</label>
                <input
                  type="number"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(toNumber(e.target.value))}
                  disabled={loading}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Công nợ</label>
                <input
                  type="number"
                  value={payable}
                  onChange={(e) => setPayable(toNumber(e.target.value))}
                  disabled={loading}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thưởng (tạm)</label>
                <input
                  type="number"
                  value={bonus}
                  onChange={(e) => setBonus(toNumber(e.target.value))}
                  disabled={loading}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Khấu trừ (tạm)</label>
                <input
                  type="number"
                  value={deduction}
                  onChange={(e) => setDeduction(toNumber(e.target.value))}
                  disabled={loading}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white outline-none focus:border-gray-600"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-5">
            <div className="text-lg font-semibold text-gray-900">Kết quả</div>
            <div className="text-sm text-gray-600 mt-1">Tạm tính = Lương cơ bản + Thưởng - Khấu trừ - Công nợ</div>

            <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5">
              <div className="text-sm text-gray-600">Lương tạm tính</div>
              <div className="text-3xl font-extrabold text-gray-900 mt-1">{net.toLocaleString('vi-VN')}</div>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              Lưu ý: Chưa tính thuế, BHXH, phụ cấp, OT, KPI, và các quy định nội bộ.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
