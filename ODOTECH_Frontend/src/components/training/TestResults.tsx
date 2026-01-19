import { XCircle, ArrowLeft, Trophy } from 'lucide-react';
import { type TestResult } from '../../interface/type';

interface TestResultsProps {
    result: TestResult;
    onClose: () => void;
}

export default function TestResults({ result, onClose }: TestResultsProps) {
    const passed = result.passed;

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm max-w-4xl mx-auto">
            <button
                onClick={onClose}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
                <ArrowLeft size={20} />
                Quay lại
            </button>

            <div className="text-center mb-8">
                <div className={`w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center ${passed ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                    {passed ? (
                        <Trophy size={48} className="text-green-600" />
                    ) : (
                        <XCircle size={48} className="text-red-600" />
                    )}
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {passed ? 'Chúc mừng! Bạn đã đạt' : 'Chưa đạt yêu cầu'}
                </h1>
                <p className="text-gray-600 mb-4">{result.test_title}</p>

                <div className={`text-6xl font-bold mb-2 ${passed ? 'text-green-600' : 'text-red-600'}`}>
                    {Number(result.score).toFixed(1)}%
                </div>
                <p className="text-gray-600">
                    Điểm đạt: {result.passing_score}% | Lần thử: {result.attempt_number}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="border border-gray-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900">
                        {Number(result.score).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Điểm số</div>
                </div>
                <div className="border border-gray-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900">
                        {result.attempt_number}
                    </div>
                    <div className="text-sm text-gray-600">Lần thử</div>
                </div>
                <div className="border border-gray-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900">
                        {new Date(result.submitted_at).toLocaleDateString('vi-VN')}
                    </div>
                    <div className="text-sm text-gray-600">Ngày làm</div>
                </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Thông tin chi tiết</h2>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Thời gian bắt đầu:</span>
                        <span className="font-medium">{new Date(result.started_at).toLocaleString('vi-VN')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Thời gian nộp bài:</span>
                        <span className="font-medium">{new Date(result.submitted_at).toLocaleString('vi-VN')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Số câu trả lời:</span>
                        <span className="font-medium">{Object.keys(result.answers).length} câu</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Trạng thái:</span>
                        <span className={`font-medium ${passed ? 'text-green-600' : 'text-red-600'}`}>
                            {passed ? 'Đạt' : 'Không đạt'}
                        </span>
                    </div>
                </div>
            </div>

            {!passed && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                        💡 <strong>Gợi ý:</strong> Hãy xem lại nội dung khóa học và thử lại. Bạn có thể cải thiện kết quả!
                    </p>
                </div>
            )}
        </div>
    );
}
