import { useState, useMemo } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { type Test, type Course, type TestQuestion } from '../../interface/type';

interface TestFormProps {
    test: Test | null;
    courses: Course[];
    onClose: () => void;
    onSave: () => void;
}

export default function TestForm({ test, courses, onClose, onSave }: TestFormProps) {
    const apiBaseUrl = useMemo(() => {
        const envUrl = import.meta.env.VITE_API_URL;
        return (envUrl && envUrl.trim()) ? envUrl.trim().replace(/\/$/, '') : 'http://localhost:5000';
    }, []);

    const [formData, setFormData] = useState({
        course_id: test?.course_id || null,
        title: test?.title || '',
        description: test?.description || '',
        duration_minutes: test?.duration_minutes || 30,
        passing_score: test?.passing_score || 70,
        max_attempts: test?.max_attempts || 3,
        status: test?.status || 'draft',
    });

    const [questions, setQuestions] = useState<TestQuestion[]>(
        test?.questions || [
            {
                id: 1,
                type: 'multiple_choice',
                question: '',
                options: ['', '', '', ''],
                correct_answer: 0,
                points: 10,
            },
        ]
    );

    const [saving, setSaving] = useState(false);

    const addQuestion = () => {
        const newId = Math.max(...questions.map(q => q.id), 0) + 1;
        setQuestions([
            ...questions,
            {
                id: newId,
                type: 'multiple_choice',
                question: '',
                options: ['', '', '', ''],
                correct_answer: 0,
                points: 10,
            },
        ]);
    };

    const removeQuestion = (id: number) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    const updateQuestion = (id: number, updates: Partial<TestQuestion>) => {
        setQuestions(questions.map(q => (q.id === id ? { ...q, ...updates } : q)));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const url = test
                ? `${apiBaseUrl}/api/tests/${test.id}`
                : `${apiBaseUrl}/api/tests`;
            const method = test ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ ...formData, questions }),
            });

            if (res.ok) {
                onSave();
            } else {
                alert('Lỗi khi lưu bài kiểm tra');
            }
        } catch (error) {
            console.error('Error saving test:', error);
            alert('Lỗi khi lưu bài kiểm tra');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h3 className="text-xl font-bold text-gray-900">
                        {test ? 'Chỉnh sửa bài kiểm tra' : 'Tạo bài kiểm tra mới'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tên bài kiểm tra *</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Khóa học (tùy chọn)</label>
                            <select
                                value={formData.course_id || ''}
                                onChange={(e) => setFormData({ ...formData, course_id: e.target.value ? parseInt(e.target.value) : null })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                            >
                                <option value="">Không liên kết</option>
                                {courses.map(course => (
                                    <option key={course.id} value={course.id}>{course.title}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian (phút)</label>
                            <input
                                type="number"
                                min="1"
                                value={formData.duration_minutes}
                                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Điểm đạt (%)</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={formData.passing_score}
                                onChange={(e) => setFormData({ ...formData, passing_score: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Số lần làm tối đa</label>
                            <input
                                type="number"
                                min="1"
                                value={formData.max_attempts}
                                onChange={(e) => setFormData({ ...formData, max_attempts: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-bold text-gray-900">Câu hỏi ({questions.length})</h4>
                            <button
                                type="button"
                                onClick={addQuestion}
                                className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
                            >
                                <Plus size={16} />
                                Thêm câu hỏi
                            </button>
                        </div>

                        <div className="space-y-4">
                            {questions.map((q, index) => (
                                <div key={q.id} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <span className="font-bold text-gray-900">Câu {index + 1}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeQuestion(q.id)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Câu hỏi</label>
                                            <input
                                                type="text"
                                                value={q.question}
                                                onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                                                placeholder="Nhập câu hỏi..."
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            {q.options.map((option, optIdx) => (
                                                <div key={optIdx} className="flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        checked={q.correct_answer === optIdx}
                                                        onChange={() => updateQuestion(q.id, { correct_answer: optIdx })}
                                                        className="w-4 h-4 text-green-600"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={option}
                                                        onChange={(e) => {
                                                            const newOptions = [...q.options];
                                                            newOptions[optIdx] = e.target.value;
                                                            updateQuestion(q.id, { options: newOptions });
                                                        }}
                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none text-sm"
                                                        placeholder={`Đáp án ${String.fromCharCode(65 + optIdx)}`}
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <input
                                                type="number"
                                                min="1"
                                                value={q.points}
                                                onChange={(e) => updateQuestion(q.id, { points: parseInt(e.target.value) })}
                                                className="w-20 px-2 py-1 border border-gray-300 rounded focus:border-blue-500 outline-none"
                                            />
                                            <span>điểm</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 px-5 py-2.5 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50"
                        >
                            {saving ? 'Đang lưu...' : 'Lưu bài kiểm tra'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
