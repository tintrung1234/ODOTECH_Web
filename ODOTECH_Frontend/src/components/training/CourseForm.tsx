import { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { type Course, type CourseCategory, type CourseLevel, type CourseStatus } from '../../interface/type';

interface CourseFormProps {
    course: Course | null;
    onClose: () => void;
    onSave: () => void;
}

export default function CourseForm({ course, onClose, onSave }: CourseFormProps) {
    const apiBaseUrl = useMemo(() => {
        const envUrl = import.meta.env.VITE_API_URL;
        return (envUrl && envUrl.trim()) ? envUrl.trim().replace(/\/$/, '') : 'http://localhost:5000';
    }, []);

    const [formData, setFormData] = useState({
        title: course?.title || '',
        description: course?.description || '',
        category: course?.category || 'general',
        level: course?.level || 'beginner',
        duration_hours: course?.duration_hours || 0,
        content: course?.content || '',
        status: course?.status || 'draft',
    });

    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const url = course
                ? `${apiBaseUrl}/api/courses/${course.id}`
                : `${apiBaseUrl}/api/courses`;
            const method = course ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                onSave();
            } else {
                alert('Lỗi khi lưu khóa học');
            }
        } catch (error) {
            console.error('Error saving course:', error);
            alert('Lỗi khi lưu khóa học');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
                    <h3 className="text-xl font-bold text-gray-900">
                        {course ? 'Chỉnh sửa khóa học' : 'Tạo khóa học mới'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên khóa học *</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value as CourseCategory })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                            >
                                <option value="general">Tổng quát</option>
                                <option value="technical">Kỹ thuật</option>
                                <option value="soft-skills">Kỹ năng mềm</option>
                                <option value="compliance">Tuân thủ</option>
                                <option value="product">Sản phẩm</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cấp độ</label>
                            <select
                                value={formData.level}
                                onChange={(e) => setFormData({ ...formData, level: e.target.value as CourseLevel })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                            >
                                <option value="beginner">Cơ bản</option>
                                <option value="intermediate">Trung cấp</option>
                                <option value="advanced">Nâng cao</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Thời lượng (giờ)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={formData.duration_hours}
                                onChange={(e) => setFormData({ ...formData, duration_hours: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as CourseStatus })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                            >
                                <option value="draft">Nháp</option>
                                <option value="published">Công khai</option>
                                <option value="archived">Lưu trữ</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung khóa học</label>
                        <textarea
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            rows={10}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none font-mono text-sm"
                            placeholder="Nhập nội dung khóa học..."
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
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
                            className="flex-1 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? 'Đang lưu...' : 'Lưu khóa học'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
