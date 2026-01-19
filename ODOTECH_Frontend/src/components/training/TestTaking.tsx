import { useState, useEffect } from 'react';
import { Clock, AlertCircle, Send } from 'lucide-react';
import { type Test } from '../../interface/type';

interface TestTakingProps {
    test: Test;
    onSubmit: (testId: number, answers: Record<number, number>, startedAt: string) => void;
    onCancel: () => void;
}

export default function TestTaking({ test, onSubmit, onCancel }: TestTakingProps) {
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [timeLeft, setTimeLeft] = useState(test.duration_minutes * 60);
    const [startedAt] = useState(new Date().toISOString());

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSubmit = () => {
        onSubmit(test.id, answers, startedAt);
    };

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const answeredCount = Object.keys(answers).length;

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{test.title}</h1>
                    <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                </div>
                <div className="text-right">
                    <div className={`text-3xl font-bold ${timeLeft < 60 ? 'text-red-600' : 'text-blue-600'}`}>
                        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                        <Clock size={14} />
                        Thời gian còn lại
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Tiến độ: {answeredCount}/{test.questions.length} câu</span>
                    <span>Điểm đạt: {test.passing_score}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${(answeredCount / test.questions.length) * 100}%` }}
                    />
                </div>
            </div>

            <div className="space-y-6 mb-6">
                {test.questions.map((question, index) => (
                    <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 font-bold text-blue-700">
                                {index + 1}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900">{question.question}</p>
                                <p className="text-xs text-gray-500 mt-1">{question.points} điểm</p>
                            </div>
                        </div>

                        <div className="space-y-2 ml-11">
                            {question.options.map((option, optionIndex) => (
                                <label
                                    key={optionIndex}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${answers[question.id] === optionIndex
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name={`question-${question.id}`}
                                        checked={answers[question.id] === optionIndex}
                                        onChange={() => setAnswers({ ...answers, [question.id]: optionIndex })}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="text-gray-700">{option}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {answeredCount < test.questions.length && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                    <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                        Bạn chưa trả lời {test.questions.length - answeredCount} câu hỏi. Hãy kiểm tra lại trước khi nộp bài.
                    </div>
                </div>
            )}

            <div className="flex gap-3">
                <button
                    onClick={onCancel}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                    Hủy bỏ
                </button>
                <button
                    onClick={handleSubmit}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2"
                >
                    <Send size={20} />
                    Nộp bài
                </button>
            </div>
        </div>
    );
}
