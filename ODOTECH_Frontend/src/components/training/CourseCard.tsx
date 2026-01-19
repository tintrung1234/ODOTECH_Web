import { BookOpen, Clock, Award } from 'lucide-react';
import { type Course, type CourseEnrollment } from '../../interface/type';

interface CourseCardProps {
    course: Course;
    enrollment?: CourseEnrollment;
    onClick: () => void;
    onEnroll?: () => void;
}

export default function CourseCard({ course, enrollment, onClick, onEnroll }: CourseCardProps) {
    const categoryLabels: Record<string, string> = {
        general: 'Tổng quát',
        technical: 'Kỹ thuật',
        'soft-skills': 'Kỹ năng mềm',
        compliance: 'Tuân thủ',
        product: 'Sản phẩm',
    };

    const levelLabels: Record<string, string> = {
        beginner: 'Cơ bản',
        intermediate: 'Trung cấp',
        advanced: 'Nâng cao',
    };

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer bg-white">
            <div onClick={onClick}>
                {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt={course.title} className="w-full h-40 object-cover" />
                ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <BookOpen size={48} className="text-white opacity-50" />
                    </div>
                )}

                <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                            {categoryLabels[course.category] || course.category}
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                            {levelLabels[course.level] || course.level}
                        </span>
                    </div>

                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{course.description}</p>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>{course.duration_hours}h</span>
                        </div>
                        {enrollment && (
                            <div className="flex items-center gap-1">
                                <Award size={14} />
                                <span>{enrollment.progress}%</span>
                            </div>
                        )}
                    </div>

                    {enrollment && (
                        <div className="mb-3">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                    style={{ width: `${enrollment.progress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {!enrollment && onEnroll && (
                <div className="px-4 pb-4">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEnroll();
                        }}
                        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                        Ghi danh
                    </button>
                </div>
            )}
        </div>
    );
}
