import { ArrowLeft, BookOpen } from 'lucide-react';
import { type Course, type CourseEnrollment } from '../../interface/type';

interface CourseDetailProps {
    course: Course;
    enrollment?: CourseEnrollment;
    onEnroll: () => void;
    onClose: () => void;
}

export default function CourseDetail({ course, enrollment, onEnroll, onClose }: CourseDetailProps) {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
            <button
                onClick={onClose}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
                <ArrowLeft size={20} />
                Quay lại
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    {course.thumbnail_url ? (
                        <img src={course.thumbnail_url} alt={course.title} className="w-full h-64 object-cover rounded-lg mb-4" />
                    ) : (
                        <div className="w-full h-64 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                            <BookOpen size={64} className="text-white opacity-50" />
                        </div>
                    )}

                    <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
                    <p className="text-gray-700 mb-6">{course.description}</p>

                    <div className="prose max-w-none">
                        <h2 className="text-xl font-bold text-gray-900 mb-3">Nội dung khóa học</h2>
                        <div className="whitespace-pre-wrap text-gray-700">{course.content || 'Nội dung đang được cập nhật...'}</div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-bold text-gray-900 mb-3">Thông tin khóa học</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Danh mục:</span>
                                <span className="font-medium">{course.category}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Cấp độ:</span>
                                <span className="font-medium">{course.level}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Thời lượng:</span>
                                <span className="font-medium">{course.duration_hours} giờ</span>
                            </div>
                        </div>
                    </div>

                    {enrollment ? (
                        <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                            <h3 className="font-bold text-green-900 mb-3">Tiến độ của bạn</h3>
                            <div className="mb-2">
                                <div className="w-full bg-green-200 rounded-full h-3">
                                    <div
                                        className="bg-green-600 h-3 rounded-full transition-all"
                                        style={{ width: `${enrollment.progress}%` }}
                                    />
                                </div>
                            </div>
                            <p className="text-sm text-green-700 font-medium">{enrollment.progress}% hoàn thành</p>
                            <p className="text-xs text-green-600 mt-2">
                                Ghi danh: {new Date(enrollment.enrolled_at).toLocaleDateString('vi-VN')}
                            </p>
                        </div>
                    ) : (
                        <button
                            onClick={onEnroll}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                        >
                            Ghi danh khóa học
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
