/**
 * Test model for ODOTECH Training System
 */

function formatTest(test) {
    return {
        id: Number(test.id),
        course_id: test.course_id ? Number(test.course_id) : null,
        title: test.title || '',
        description: test.description || '',
        questions: test.questions || [],
        duration_minutes: test.duration_minutes ? Number(test.duration_minutes) : 30,
        passing_score: test.passing_score ? Number(test.passing_score) : 70,
        max_attempts: test.max_attempts ? Number(test.max_attempts) : 3,
        status: test.status || 'draft',
        created_by: test.created_by ? Number(test.created_by) : null,
        created_at: test.created_at,
        updated_at: test.updated_at,
    };
}

function mapDbTest(row) {
    if (!row) return null;

    // Parse questions if it's a string
    let questions = row.questions;
    if (typeof questions === 'string') {
        try {
            questions = JSON.parse(questions);
        } catch (e) {
            console.error('Error parsing questions JSON:', e);
            questions = [];
        }
    }

    return formatTest({
        id: row.id,
        course_id: row.course_id,
        title: row.title,
        description: row.description,
        questions: questions || [],
        duration_minutes: row.duration_minutes,
        passing_score: row.passing_score,
        max_attempts: row.max_attempts,
        status: row.status,
        created_by: row.created_by,
        created_at: row.created_at,
        updated_at: row.updated_at,
    });
}

/**
 * Calculate score based on answers
 * @param {Array} questions - Array of question objects with correct_answer and points
 * @param {Object} answers - Object mapping question IDs to selected answers
 * @returns {Object} { score: number, totalPoints: number, correctCount: number }
 */
function calculateScore(questions, answers) {
    let totalPoints = 0;
    let earnedPoints = 0;
    let correctCount = 0;

    questions.forEach((q) => {
        const points = Number(q.points) || 10;
        totalPoints += points;

        const userAnswer = answers[q.id];
        if (userAnswer !== undefined && userAnswer === q.correct_answer) {
            earnedPoints += points;
            correctCount++;
        }
    });

    const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

    return {
        score: Number(score.toFixed(2)),
        totalPoints,
        earnedPoints,
        correctCount,
        totalQuestions: questions.length,
    };
}

module.exports = {
    formatTest,
    mapDbTest,
    calculateScore,
};
