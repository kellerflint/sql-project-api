import DatabaseConnection from "./DatabaseService";
import Question from "../model/Question";
import QuestionContext from "../model/QuestionContext";
import QuestionAnswer from "../model/QuestionAnswer";
import Assignment from "../model/Assignment";

export default class AssignmentRepository {
    private db: DatabaseConnection;

    constructor(db: DatabaseConnection) {
        this.db = db;
    }

    async getQuestion(questionId: number): Promise<Question|null> {
        const result = await this.db.exec(`
            SELECT id, assignment_id, question, answer, context_id, points
                FROM questions
                WHERE id = @questionId;`, { questionId: questionId } );

        if (result.rows.length === 0) return null;

        const row = result.rows[0];

        return new Question(
            row.id,
            row.assignment_id,
            row.question,
            row.answer,
            row.context_id,
            row.points
        );
    }

    async getAssignmentList() {
        const result = await this.db.exec(`
            SELECT
                    a.id, a.title, a.due_date,
                    COUNT(q.id) 'questions',
                    COALESCE(SUM(q.points), 0) 'points'
                FROM assignments a
                    LEFT JOIN questions q ON q.assignment_id = a.id
                GROUP BY a.id, a.title, a.due_date;`);

        return result.rows;
    }

    async getAssignment(assignmentId: number): Promise<Assignment|null> {
        const result = await this.db.exec(`SELECT * FROM assignments WHERE id = @assignmentId;`, { assignmentId: assignmentId });
        
        if (result.rows.length === 0) {
            return null;
        }

        const row = result.rows[0];

        const questionsResult = await this.db.exec(`SELECT id FROM questions WHERE assignment_id = @assignmentId`,
            { assignmentId: assignmentId });

        return new Assignment(row.id, row.title, row.due_date, questionsResult.rows.map(row => row.id));
    }

    async getQuestionList(assignmentId: number): Promise<Question[]> {
        const result = await this.db.exec(`
            SELECT id, assignment_id, context_id, question, answer, points
                FROM questions
                WHERE assignment_id = @assignmentId;`, { assignmentId: assignmentId });

        return result.rows.map(row => new Question(
            row.id,
            row.assignment_id,
            row.question,
            row.answer,
            row.context_id,
            row.points
        ));
    }

    async getContext(contextId: number): Promise<QuestionContext|null> {
        const result = await this.db.exec(`SELECT id, title, context FROM contexts WHERE id = @contextId`, { contextId: contextId });

        if (result.rows.length === 0) return null;

        const row = result.rows[0];

        return new QuestionContext(
            row.id,
            row.title,
            row.context
        );
    }

    async getAnswer(questionId: number, userId: number): Promise<QuestionAnswer|null> {
        const result = await this.db.exec(`
            SELECT id, user_id, question_id, answer, score
                FROM answers WHERE question_id = @questionId AND user_id = @userId`,
                { questionId: questionId, userId: userId });
    
        if (result.rows.length === 0) return null;

        const row = result.rows[0];

        const answer = new QuestionAnswer(
            row.user_id,
            row.question_id,
            row.answer,
            row.score
        );

        answer.id = row.id;

        return answer;
    }

    async setAnswer(answer: QuestionAnswer): Promise<number> {
        const previous = await this.getAnswer(answer.questionId, answer.userId);
        if (previous !== null) {
            // UPDATE existing answer
            await this.db.exec(`
                UPDATE answers SET answer = @answer, score = @score
                    WHERE id = @answerId`,
                {
                    answer: answer.answer,
                    score: answer.score,
                    answerId: previous.id
                });

            answer.id = previous.id;
        } else {
            // INSERT new answer
            await this.db.exec(`
                INSERT INTO answers (user_id, question_id, answer, score)
                    VALUES (@userId, @question, @answer, @score)`,
                {
                    userId: answer.userId,
                    question: answer.questionId,
                    answer: answer.answer,
                    score: answer.score
                });

            const newAnswer = await this.getAnswer(answer.questionId, answer.userId);
            if (newAnswer === null) throw new Error("Unable to insert answer");
            
            answer.id = newAnswer.id;
        }

        return answer.id;
    }

    async getQueryHistory(questionId: number, userId: number): Promise<any[]> {
        const historyResult = await this.db.exec(`
            SELECT h.[query]
                FROM query_history h
                JOIN answers a ON a.id = h.answer_id
                WHERE a.question_id = @questionId AND a.user_id = @userId
                ORDER BY h.id ASC`, { questionId: questionId, userId: userId });

        return historyResult.rows.map(row => row.query);
    }

    async appendQueryHistory(answerId: number, query: string) {
        await this.db.exec(`INSERT INTO query_history (answer_id, [query]) VALUES (@answerId, @query)`,
        {
            answerId: answerId,
            query: query
        });
    }

    async clearQueryHistory(questionId: number, userId: number) {
        const answerResult = await this.db.exec(`
            SELECT a.id
                FROM answers a
                WHERE a.question_id = @questionId AND a.user_id = @userId`,
            { questionId: questionId, userId: userId });

        if (answerResult.rows.length > 0) {
            const answerId = answerResult.rows[0].id;
            await this.db.exec(`DELETE FROM query_history WHERE answer_id = @answer`, {answer: answerId});
        }
    }
}