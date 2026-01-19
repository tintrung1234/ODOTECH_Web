import { ClipboardList, Clock, Target, RotateCcw } from 'lucide-react';
import { type Test, type TestResult } from '../../interface/type';

interface TestCardProps {
    test: Test;
    results: TestResult[];
    onStart: () => void;
    onViewResults: (result: TestResult) => void;
}

export default function TestCard({ test, results, onStart, onViewResults }: TestCardProps) {
    const attemptCount = results.length;
    const remainingAttempts = test.max_attempts - attemptCount;
    const bestResult = results.length > 0 ? results.reduce((best, current) =>
        current.score > best.score ? current : best
    ) : null;

    return (
        <div className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow bg-white">
            <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <ClipboardList size={20} className="text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 mb-1">{test.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{test.description}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                    <Clock size={14} />
                    <span>{test.duration_minutes} phút</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                    <Target size={14} />
                    <span>Đạt: {test.passing_score}%</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                    <ClipboardList size={14} />
                    <span>{test.questions.length} câu</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                    <RotateCcw size={14} />
                    <span>{remainingAttempts}/{test.max_attempts} lần</span>
                </div>
            </div>

            {bestResult && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">Kết quả tốt nhất:</div>
                    <div className="flex items-center justify-between">
                        <span className={`text-lg font-bold ${bestResult.passed ? 'text-green-600' : 'text-orange-600'}`}>
                            {Number(bestResult.score).toFixed(1)}%
                        </span>
                        <button
                            onClick={() => onViewResults(bestResult)}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Xem chi tiết
                        </button>
                    </div>
                </div>
            )}

            <button
                onClick={onStart}
                disabled={remainingAttempts <= 0}
                className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
                {remainingAttempts > 0 ? 'Bắt đầu làm bài' : 'Hết lượt làm bài'}
            </button>
        </div>
    );
}
