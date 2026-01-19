import { useState, useEffect } from 'react';
import { BookOpen, GraduationCap, ClipboardList, Trophy, Plus, XCircle } from 'lucide-react';
import { type Course, type Test, type CourseEnrollment, type TestResult } from '../interface/type';
import { getTokenUser, normalizeRole, type CanonicalRole } from '../utils/auth';
import CourseCard from '../components/training/CourseCard';
import TestCard from '../components/training/TestCard';
import TestTaking from '../components/training/TestTaking';
import TestResults from '../components/training/TestResults';
import CourseForm from '../components/training/CourseForm';
import TestForm from '../components/training/TestForm';
import CourseDetail from '../components/training/CourseDetail';

const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export default function Training() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [myEnrollments, setMyEnrollments] = useState<CourseEnrollment[]>([]);
    const [tests, setTests] = useState<Test[]>([]);
    const [myResults, setMyResults] = useState<TestResult[]>([]);
    const [role, setRole] = useState<CanonicalRole>('unknown');
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState<'my-courses' | 'all-courses' | 'tests' | 'results' | 'manage'>('my-courses');
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [takingTest, setTakingTest] = useState<Test | null>(null);
    const [viewingResult, setViewingResult] = useState<TestResult | null>(null);

    // Editing states for manager/admin
    const [showCourseForm, setShowCourseForm] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [showTestForm, setShowTestForm] = useState(false);
    const [editingTest, setEditingTest] = useState<Test | null>(null);
    const [viewingTestResultList, setViewingTestResultList] = useState<any[] | null>(null);

    const isAdmin = role === 'admin';
    const isManager = role === 'sales_manager' || role === 'dev_manager' || role === 'head_sales' || role === 'head_tech';
    const canManage = isAdmin || isManager;

    const handleViewTestResults = async (testId: number) => {
        try {
            const res = await fetch(`${apiBaseUrl}/api/tests/${testId}/results`, { credentials: 'include' });
            if (res.ok) {
                const results = await res.json();
                setViewingTestResultList(results);
            }
        } catch (error) {
            console.error('Error loading test results:', error);
            alert('Lỗi khi tải danh sách kết quả');
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [coursesRes, enrollmentsRes, testsRes, resultsRes] = await Promise.all([
                fetch(`${apiBaseUrl}/api/courses?limit=100`, { credentials: 'include' }),
                fetch(`${apiBaseUrl}/api/courses/my-enrollments`, { credentials: 'include' }),
                fetch(`${apiBaseUrl}/api/tests?limit=100`, { credentials: 'include' }),
                fetch(`${apiBaseUrl}/api/tests/my-results`, { credentials: 'include' }),
            ]);

            if (coursesRes.ok) {
                const coursesData = await coursesRes.json();
                setCourses(coursesData);
            }
            if (enrollmentsRes.ok) {
                const enrollmentsData = await enrollmentsRes.json();
                setMyEnrollments(enrollmentsData);
            }
            if (testsRes.ok) {
                const testsData = await testsRes.json();
                setTests(testsData);
            }
            if (resultsRes.ok) {
                const resultsData = await resultsRes.json();
                setMyResults(resultsData);
            }
        } catch (error) {
            console.error('Error loading training data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                const user = await getTokenUser();
                const nextRole = normalizeRole(user?.role);
                setRole(nextRole);
                await loadData();
            } catch (err) {
                console.error('Initialization error:', err);
                // Attempt to load data even if auth check fails might not be safe, 
                // but let's try to proceed to see if it's an API issue or Auth issue.
                await loadData();
            }
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleEnroll = async (courseId: number) => {
        try {
            const res = await fetch(`${apiBaseUrl}/api/courses/${courseId}/enroll`, {
                method: 'POST',
                credentials: 'include',
            });
            if (res.ok) {
                await loadData();
                alert('Ghi danh khóa học thành công!');
            } else {
                const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
                console.error('Error enrolling:', errorData);
                alert(`Lỗi khi ghi danh: ${errorData.message || 'Vui lòng thử lại'}`);
            }
        } catch (error) {
            console.error('Error enrolling:', error);
            alert('Lỗi kết nối khi ghi danh. Vui lòng kiểm tra kết nối mạng và thử lại.');
        }
    };

    const handleTestSubmit = async (testId: number, answers: Record<number, number>, startedAt: string) => {
        try {
            const res = await fetch(`${apiBaseUrl}/api/tests/${testId}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ answers, started_at: startedAt }),
            });
            if (res.ok) {
                const result = await res.json();
                setViewingResult(result);
                setTakingTest(null);
                await loadData();
            } else {
                const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
                console.error('Error submitting test:', errorData);
                alert(`Lỗi khi nộp bài: ${errorData.message || 'Vui lòng thử lại'}`);
            }
        } catch (error) {
            console.error('Error submitting test:', error);
            alert('Lỗi kết nối khi nộp bài. Vui lòng kiểm tra kết nối mạng và thử lại.');
        }
    };

    if (loading) {
        return (
            <main className="flex-1 px-6 py-3">
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="text-gray-600">Đang tải dữ liệu...</div>
                </div>
            </main>
        );
    }

    if (takingTest) {
        return (
            <main className="flex-1 px-6 py-3">
                <TestTaking
                    test={takingTest}
                    onSubmit={handleTestSubmit}
                    onCancel={() => setTakingTest(null)}
                />
            </main>
        );
    }

    if (viewingResult) {
        return (
            <main className="flex-1 px-6 py-3">
                <TestResults
                    result={viewingResult}
                    onClose={() => setViewingResult(null)}
                />
            </main>
        );
    }

    if (selectedCourse) {
        return (
            <main className="flex-1 px-6 py-3">
                <CourseDetail
                    course={selectedCourse}
                    enrollment={myEnrollments.find(e => Number(e.course_id) === Number(selectedCourse.id))}
                    onEnroll={() => handleEnroll(selectedCourse.id)}
                    onClose={() => setSelectedCourse(null)}
                />
            </main>
        );
    }

    return (
        <main className="flex-1 px-6 py-3">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                            <GraduationCap size={32} className="text-blue-600" />
                            Hệ thống Đào tạo
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">Quản lý khóa học và bài kiểm tra</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-gray-200 mb-6">
                    <button
                        onClick={() => setActiveTab('my-courses')}
                        className={`px-4 py-2 font-medium transition-colors ${activeTab === 'my-courses'
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <BookOpen size={16} className="inline mr-2" />
                        Khóa học của tôi
                    </button>
                    <button
                        onClick={() => setActiveTab('all-courses')}
                        className={`px-4 py-2 font-medium transition-colors ${activeTab === 'all-courses'
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Tất cả khóa học
                    </button>
                    <button
                        onClick={() => setActiveTab('tests')}
                        className={`px-4 py-2 font-medium transition-colors ${activeTab === 'tests'
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <ClipboardList size={16} className="inline mr-2" />
                        Bài kiểm tra
                    </button>
                    <button
                        onClick={() => setActiveTab('results')}
                        className={`px-4 py-2 font-medium transition-colors ${activeTab === 'results'
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <Trophy size={16} className="inline mr-2" />
                        Kết quả của tôi
                    </button>
                    {canManage && (
                        <button
                            onClick={() => setActiveTab('manage')}
                            className={`px-4 py-2 font-medium transition-colors ${activeTab === 'manage'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Quản lý
                        </button>
                    )}
                </div>

                {/* Tab Content */}
                {activeTab === 'my-courses' && (
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Khóa học đã ghi danh</h2>
                        {myEnrollments.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <BookOpen size={48} className="mx-auto mb-3 opacity-20" />
                                <p>Bạn chưa ghi danh khóa học nào</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {myEnrollments.map((enrollment) => {
                                    // Convert to numbers for comparison (API may return strings)
                                    const course = courses.find(c => Number(c.id) === Number(enrollment.course_id));
                                    if (!course) {
                                        console.warn('Course not found for enrollment:', enrollment);
                                        return null;
                                    }
                                    return (
                                        <CourseCard
                                            key={course.id}
                                            course={course}
                                            enrollment={enrollment}
                                            onClick={() => setSelectedCourse(course)}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'all-courses' && (
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Tất cả khóa học</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {courses.filter(c => c.status === 'published').map((course) => (
                                <CourseCard
                                    key={course.id}
                                    course={course}
                                    enrollment={myEnrollments.find(e => Number(e.course_id) === Number(course.id))}
                                    onClick={() => setSelectedCourse(course)}
                                    onEnroll={() => handleEnroll(course.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'tests' && (
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Bài kiểm tra</h2>
                        {tests.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <ClipboardList size={48} className="mx-auto mb-3 opacity-20" />
                                <p>Chưa có bài kiểm tra nào</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {tests.map((test) => {
                                    return (
                                        <TestCard
                                            key={test.id}
                                            test={test}
                                            results={myResults.filter(r => Number(r.test_id) === Number(test.id))}
                                            onStart={() => setTakingTest(test)}
                                            onViewResults={(result) => setViewingResult(result)}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'results' && (
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Kết quả của tôi</h2>
                        {myResults.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Trophy size={48} className="mx-auto mb-3 opacity-20" />
                                <p>Chưa có kết quả nào</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {myResults.map((result) => (
                                    <div
                                        key={result.id}
                                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
                                        onClick={() => setViewingResult(result)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{result.test_title}</h3>
                                                <p className="text-sm text-gray-600">
                                                    Lần thử: {result.attempt_number} | Ngày: {new Date(result.created_at).toLocaleDateString('vi-VN')}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-2xl font-bold ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                                                    {result.score.toFixed(1)}%
                                                </div>
                                                <div className={`text-sm font-medium ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                                                    {result.passed ? 'Đạt' : 'Không đạt'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'manage' && canManage && (
                    <div>
                        <div className="flex gap-4 mb-6">
                            <button
                                onClick={() => {
                                    setEditingCourse(null);
                                    setShowCourseForm(true);
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                            >
                                <Plus size={16} />
                                Tạo khóa học
                            </button>
                            <button
                                onClick={() => {
                                    setEditingTest(null);
                                    setShowTestForm(true);
                                }}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                            >
                                <Plus size={16} />
                                Tạo bài kiểm tra
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-3">Khóa học</h3>
                                <div className="space-y-2">
                                    {courses.map((course) => (
                                        <div key={course.id} className="border border-gray-200 rounded p-3 flex items-center justify-between">
                                            <div>
                                                <div className="font-medium">{course.title}</div>
                                                <div className="text-sm text-gray-600">Status: {course.status}</div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setEditingCourse(course);
                                                    setShowCourseForm(true);
                                                }}
                                                className="cursor-pointer text-blue-600 hover:text-blue-700 text-sm font-medium"
                                            >
                                                Sửa
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-3">Bài kiểm tra</h3>
                                <div className="space-y-2">
                                    {tests.map((test) => (
                                        <div key={test.id} className="border border-gray-200 rounded p-3 flex items-center justify-between">
                                            <div>
                                                <div className="font-medium">{test.title}</div>
                                                <div className="text-sm text-gray-600">
                                                    {test.questions.length} câu | Status: {test.status}
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleViewTestResults(test.id)}
                                                    className="cursor-pointer text-green-600 hover:text-green-700 text-sm font-medium"
                                                >
                                                    Xem kết quả
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingTest(test);
                                                        setShowTestForm(true);
                                                    }}
                                                    className="cursor-pointer text-blue-600 hover:text-blue-700 text-sm font-medium"
                                                >
                                                    Sửa
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showCourseForm && (
                <CourseForm
                    course={editingCourse}
                    onClose={() => {
                        setShowCourseForm(false);
                        setEditingCourse(null);
                    }}
                    onSave={async () => {
                        await loadData();
                        setShowCourseForm(false);
                        setEditingCourse(null);
                    }}
                />
            )}

            {showTestForm && (
                <TestForm
                    test={editingTest}
                    courses={courses}
                    onClose={() => {
                        setShowTestForm(false);
                        setEditingTest(null);
                    }}
                    onSave={async () => {
                        await loadData();
                        setShowTestForm(false);
                        fetch(`${apiBaseUrl}/api/courses/my-enrollments`, { credentials: 'include' });
                        setEditingTest(null);
                    }}
                />
            )}

            {viewingTestResultList && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <h3 className="text-xl font-bold text-gray-900">Danh sách kết quả làm bài</h3>
                            <button
                                onClick={() => setViewingTestResultList(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>
                        <div className="p-0 overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người làm bài</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Điểm số</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày nộp</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lần thử</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {viewingTestResultList.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                                Chưa có ai làm bài kiểm tra này
                                            </td>
                                        </tr>
                                    ) : (
                                        viewingTestResultList.map((result: any) => (
                                            <tr key={result.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{result.account_name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.account_email}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{Number(result.score).toFixed(1)}%</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${result.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {result.passed ? 'Đạt' : 'Không đạt'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(result.submitted_at).toLocaleDateString('vi-VN')} {new Date(result.submitted_at).toLocaleTimeString('vi-VN')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                                    {result.attempt_number}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
