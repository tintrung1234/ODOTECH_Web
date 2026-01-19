/**
 * Course model for ODOTECH Training System
 */

function formatCourse(course) {
    return {
        id: Number(course.id),
        title: course.title || '',
        description: course.description || '',
        instructor_id: course.instructor_id ? Number(course.instructor_id) : null,
        category: course.category || 'general',
        level: course.level || 'beginner',
        duration_hours: course.duration_hours ? Number(course.duration_hours) : 0,
        thumbnail_url: course.thumbnail_url || '',
        content: course.content || '',
        status: course.status || 'draft',
        created_at: course.created_at,
        updated_at: course.updated_at,
    };
}

function mapDbCourse(row) {
    if (!row) return null;
    return formatCourse({
        id: row.id,
        title: row.title,
        description: row.description,
        instructor_id: row.instructor_id,
        category: row.category,
        level: row.level,
        duration_hours: row.duration_hours,
        thumbnail_url: row.thumbnail_url,
        content: row.content,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
    });
}

module.exports = {
    formatCourse,
    mapDbCourse,
};
