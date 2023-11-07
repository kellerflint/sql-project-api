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
    } else if (result.rows.length === 0) {
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
        SELECT q.answer, c.context, q.points, q.assignment_id
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


    // TODO: Use a real value here
    const userId = 1;

    const assignmentId = question.assignment_id;

    const uaParams = {
        user: userId,
        assignment: assignmentId
    };

    const uaResult = await db.exec(`SELECT *
        FROM users_assignments
        WHERE user_id = @user AND assignment_id = @assignment;`,
        uaParams);

    if (!uaResult.success) {
        return {
            status: 500,
            responseJson: { error: uaResult.error }
        };
    } else if (uaResult.rows.length === 0) {
        // TODO: Make sure there are no duplicates
        const uaInsertResult = await db.exec(`INSERT INTO users_assignments (user_id, assignment_id) VALUES (@user, @assignment)`,
            uaParams);

        if (!uaInsertResult.success) {
            return {
                status: 500,
                responseJson: { error: uaInsertResult.error }
            };
        }
    }

    const uaSelectResult = await db.exec(`
        SEELCT id FROM users_assignments
        WHERE user_id = @user AND assignment_id = @assignment;`, uaParams);

    if (!uaSelectResult.success) {
        return {
            status: 500,
            responseJson: { error: uaSelectResult.error }
        };
    } else if (uaSelectResult.rows.length === 0) {
        return {
            status: 404,
            responseJson: { error: "The given user assignment does not exist" }
        };
    }

    const uaId = uaSelectResult.rows[0].id;


    // Create a temporary database using the context queries provided with the question
    const tempDb = new TemporaryDatabase(question.context);
    
    const expected = tempDb.exec(question.answer);
    const actual   = tempDb.exec(userQuery);

    const isCorrect = compareResults(expected, actual);

    // Cleanup the temporary database
    tempDb.destroy();






    const answerSelectResult = await db.exec(`SELECT id, query_history FROM answer WHERE ua_id = @ua AND question_id = @question;`,
        { ua: uaId, question: questionId });

    if (!answerSelectResult.success) {
        return {
            status: 500,
            responseJson: { error: answerSelectResult.error }
        };
    } else if (answerSelectResult.rows.length === 0) {
        // INSERT new answer
        const answerInsertResult = await db.exec(`INSERT INTO answers (ua_id, question_id, answer, query_history, score)
            VALUES (@ua, @question, @answer, @history, @score)`,
        {
            ua: uaId,
            question: questionId,
            answer: userQuery,
            history: userQuery,
            score: isCorrect ? question.points : 0
        });

        if (!answerInsertResult.success) {
            return {
                status: 500,
                responseJson: { error: answerInsertResult.error }
            };
        }
    } else {
        // UPDATE existing answer
        
        const answerId = answerSelectResult.rows[0].id;
        const previousHistory = answerSelectResult.rows[0].query_history;;

        const answerInsertResult = await db.exec(`UPDATE answers SET ua_id = @ua, question_id = @question, answer = @answer, query_history = @history, score = @score
            WHERE id = @answerId`,
        {
            ua: uaId,
            question: questionId,
            answer: userQuery,
            history: previousHistory + ", " + userQuery,
            score: isCorrect ? question.points : 0,
            answerId: answerId
        });

        if (!answerInsertResult.success) {
            return {
                status: 500,
                responseJson: { error: answerInsertResult.error }
            };
        }
    }



    return {
        status: 200,
        responseJson: {
            success: isCorrect,
            result: actual.success ? actual.rows : actual.error
        }
    };
}