import Question from "../model/Question";
import { TemporaryDatabase } from "./DatabaseSandboxService";
import DatabaseConnection from "./DatabaseService";
import { QueryResult } from "../model/QueryResult";
import RouteResult from "../model/RouteResult";
import { STATUS_CODES } from "http";
import AppError from "../model/AppError";

const HISTORY_DELIMITOR = '\0';

// TODO: Use real values for user id
const DEFAULT_USER_ID = 1;

function compareResults(a: QueryResult, b: QueryResult) {
    if (a.rows.length !== b.rows.length) return false;

    return JSON.stringify(a) === JSON.stringify(b);
}

function formatQueryResult(result: QueryResult): RouteResult {
    return result.success
        ? { status: 200, responseJson: result.rows }
        : { status: 500, responseJson: { error: result.error } };
}

function checkQueryResult(result: QueryResult, requireRows: boolean) {
    if (!result.success) throw new AppError(500, result.error);
    if (requireRows && result.rows.length === 0) throw new AppError(404, "The query could not find any rows");
}

export async function getAssignmentList(db: DatabaseConnection) {
    const result: QueryResult = await db.exec(`
        SELECT
                a.id, a.title,
                COUNT(q.id) 'questions',
                COALESCE(SUM(q.points), 0) 'points'
            FROM assignments a
                LEFT JOIN questions q ON q.assignment_id = a.id
            GROUP BY a.id, a.title;`);

    return formatQueryResult(result);
}

export async function getQuestionList(db: DatabaseConnection, assignmentId: number) {
    const result: QueryResult = await db.exec(`
        SELECT id, question, points
            FROM questions
            WHERE assignment_id = @assignmentId;`, { 'assignmentId': assignmentId });

    return formatQueryResult(result);
}

export async function getQuestionData(db: DatabaseConnection, questionId: number): Promise<RouteResult> {
    const userQuestion = { 
        'questionId': questionId,
        'userId': DEFAULT_USER_ID
    };

    const result = await db.exec(`
        SELECT q.id, q.question, q.answer, c.context, q.points
            FROM questions q
            JOIN contexts c ON q.context_id = c.id
            LEFT JOIN users_assignments ua ON ua.assignment_id = q.assignment_id AND ua.user_id = @userId
            LEFT JOIN answers a ON a.ua_id = ua.id AND a.question_id = q.id
            WHERE q.id = @questionId;`, userQuestion );

    checkQueryResult(result, true);

    const historyResult = await db.exec(`
        SELECT h.[query]
            FROM query_history h
            JOIN answers a ON a.id = h.answer_id
            JOIN users_assignments ua ON a.ua_id = ua.id
            WHERE a.question_id = @questionId AND ua.user_id = @userId
            ORDER BY h.id ASC`, userQuestion);

    checkQueryResult(historyResult, false);

    const row = result.rows[0];

    const sandbox = new TemporaryDatabase(row.context);
    const expected = sandbox.exec(row.answer).rows;
    sandbox.destroy();

    return {
        status: 200,
        responseJson: {
            id: row.id,
            question: row.question,
            context: row.context,
            points: row.points,
            expected: expected,
            history: historyResult.rows.map(row => row.query)
        }
    };
}

export async function checkAnswer(db: DatabaseConnection, questionId: number, userQuery: string): Promise<RouteResult> {
    const questionResult: QueryResult = await db.exec(`
        SELECT q.answer, c.context, q.points, q.assignment_id
            FROM questions q
            JOIN contexts c ON q.context_id = c.id
            WHERE q.id = @id;`, { 'id': questionId } );

    checkQueryResult(questionResult, true);

    const question = questionResult.rows[0];

    const assignmentId = question.assignment_id;

    const uaParams = {
        user: DEFAULT_USER_ID,
        assignment: assignmentId
    };

    const uaResult = await db.exec(`SELECT *
        FROM users_assignments
        WHERE user_id = @user AND assignment_id = @assignment;`,
        uaParams);

    checkQueryResult(uaResult, false);
    
    if (uaResult.rows.length === 0) {
        const uaInsertResult = await db.exec(`INSERT INTO users_assignments (user_id, assignment_id) VALUES (@user, @assignment)`,
            uaParams);

        checkQueryResult(uaInsertResult, false);
    }

    const uaSelectResult = await db.exec(`
        SELECT id FROM users_assignments
        WHERE user_id = @user AND assignment_id = @assignment;`, uaParams);

    checkQueryResult(uaSelectResult, true);

    const uaId = uaSelectResult.rows[0].id;


    // Create a temporary database using the context queries provided with the question
    const tempDb = new TemporaryDatabase(question.context);
    
    const expected = tempDb.exec(question.answer);
    const actual   = tempDb.exec(userQuery);

    const isCorrect = compareResults(expected, actual);

    // Cleanup the temporary database
    tempDb.destroy();



    let answerSelectResult = await db.exec(`SELECT id FROM answers WHERE ua_id = @ua AND question_id = @question;`,
        { ua: uaId, question: questionId });
    let answerId;

    checkQueryResult(answerSelectResult, false);
    
    if (answerSelectResult.rows.length === 0) {
        // INSERT new answer
        const answerInsertResult = await db.exec(`INSERT INTO answers (ua_id, question_id, answer, score)
            VALUES (@ua, @question, @answer, @score)`,
        {
            ua: uaId,
            question: questionId,
            answer: userQuery,
            score: isCorrect ? question.points : 0
        });

        checkQueryResult(answerInsertResult, false);

        answerSelectResult = await db.exec(`SELECT id FROM answers WHERE ua_id = @ua AND question_id = @question;`,
            { ua: uaId, question: questionId });

        checkQueryResult(answerSelectResult, true);
        answerId = answerSelectResult.rows[0].id;
    } else {
        // UPDATE existing answer
        
        answerId = answerSelectResult.rows[0].id;

        const answerInsertResult = await db.exec(`UPDATE answers SET ua_id = @ua, question_id = @question, answer = @answer, score = @score
            WHERE id = @answerId`,
        {
            ua: uaId,
            question: questionId,
            answer: userQuery,
            score: isCorrect ? question.points : 0,
            answerId: answerId
        });

        checkQueryResult(answerInsertResult, false);
    }

    const queryHistoryResult = await db.exec(`INSERT INTO query_history (answer_id, [query]) VALUES (@answerId, @query)`,
        {
            answerId: answerId,
            query: userQuery
        });

    checkQueryResult(queryHistoryResult, false);

    return {
        status: 200,
        responseJson: {
            success: isCorrect,
            result: actual.success ? actual.rows : actual.error
        }
    };
}

export async function clearHistory(db: DatabaseConnection, questionId: number): Promise<RouteResult> {
    const answerResult = await db.exec(`
        SELECT a.id
            FROM answers a
            JOIN users_assignments ua ON a.ua_id = ua.id
            WHERE a.question_id = @questionId AND ua.user_id = @userId`,
        { questionId: questionId, userId: DEFAULT_USER_ID });

    checkQueryResult(answerResult, false);
    if (answerResult.rows.length > 0) {
        const answerId = answerResult.rows[0].id;
        const deleteResult = await db.exec(`DELETE FROM query_history WHERE answer_id = @answer`, {answer: answerId});
        checkQueryResult(deleteResult, false);
    }

    return {
        status: 200,
        responseJson: {}
    };
}