import Question from "../model/Question";
import { TemporaryDatabase } from "./DatabaseSandboxService";
import DatabaseConnection from "./DatabaseService";
import { QueryResult } from "../model/QueryResult";
import RouteResult from "../model/RouteResult";
import { STATUS_CODES } from "http";

function compareResults(a: QueryResult, b: QueryResult) {
    if (a.rows.length !== b.rows.length) return false;

    return JSON.stringify(a) === JSON.stringify(b);
}

function formatQueryResult(result: QueryResult): RouteResult {
    return result.success
        ? { status: 200, responseJson: result.rows }
        : { status: 500, responseJson: { error: result.error } };
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
    const result: QueryResult = await db.exec(`
        SELECT q.id, q.question, q.answer, c.context, q.points
            FROM questions q
            JOIN contexts c ON q.context_id = c.id
            WHERE q.id = @questionId;`, { 'questionId': questionId } );

    if (!result.success) {
        return {
            status: 500,
            responseJson: { error: result.error }
        }
    } else if (result.rows.length == 0) {
        return {
            status: 404,
            responseJson: { error: "The requested question does not exist" }
        }
    } else {
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
                expected: expected
            }
        };
    }
}

export async function checkAnswer(db: DatabaseConnection, questionId: number, userQuery: string): Promise<RouteResult> {
    const questionResult: QueryResult = await db.exec(`
        SELECT q.answer, c.context
            FROM questions q
            JOIN contexts c ON q.context_id = c.id
            WHERE q.id = @id;`, { 'id': questionId } );

    if (!questionResult.success) {
        return {
            status: 500,
            responseJson: { error: questionResult.error }
        };
    } else if (questionResult.rows.length == 0) {
        return {
            status: 404,
            responseJson: { error: "The given question ID does not exist" }
        };
    }

    const question = questionResult.rows[0];

    // Create a temporary database using the context queries provided with the question
    const tempDb = new TemporaryDatabase(question.context);
    
    const expected = tempDb.exec(question.answer);
    const actual   = tempDb.exec(userQuery);

    const isCorrect = compareResults(expected, actual);
    const result = isCorrect ? "You answered correctly" : "You answered incorrectly";

    // Cleanup the temporary database
    tempDb.destroy();

    return {
        status: 200,
        responseJson: {
            success: isCorrect,
            result: actual.success ? actual.rows : actual.error
        }
    };
}