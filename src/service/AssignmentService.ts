import { TemporaryDatabase } from "./DatabaseSandboxService";
import DatabaseConnection from "./DatabaseService";
import { QueryResult } from "../model/QueryResult";
import RouteResult from "../model/RouteResult";
import AppError from "../model/AppError";
import AssignmentRepository from "./AssignmentRepository";
import QuestionAnswer from "../model/QuestionAnswer";
import Question from "../model/Question";

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
    const repo = new AssignmentRepository(db);
    const assignments = await repo.getAssignmentList();

    return {
        status: 200,
        responseJson: assignments
    };
}

export async function getQuestionList(db: DatabaseConnection, assignmentId: number) {
    const repo = new AssignmentRepository(db);
    const questions = await repo.getQuestionList(assignmentId);

    return {
        status: 200,
        responseJson: questions.map(question => {
            return {
                id: question.id,
                question: question.prompt,
                points: question.points
            };
        })
    };
}

export async function getQuestionData(db: DatabaseConnection, questionId: number): Promise<RouteResult> {
    const repo = new AssignmentRepository(db);

    const question = await repo.getQuestion(questionId);
    if (question === null) throw new AppError(404, "The requested question does not exist");

    const context = await repo.getContext(question.contextId);
    if (context === null) throw new AppError(404, "The requested context does not exist");

    const history = await repo.getQueryHistory(question.id, DEFAULT_USER_ID);

    const sandbox = new TemporaryDatabase(context.content);
    const expected = sandbox.exec(question.answerKey).rows;
    sandbox.destroy();

    return {
        status: 200,
        responseJson: {
            id: question.id,
            question: question.prompt,
            context: context.content,
            points: question.points,
            expected: expected,
            history: history
        }
    };
}

export async function checkAnswer(db: DatabaseConnection, questionId: number, userQuery: string): Promise<RouteResult> {
    const repo = new AssignmentRepository(db);
    const userId = DEFAULT_USER_ID;

    const question = await repo.getQuestion(questionId);
    if (question === null) throw new AppError(404, "The requested question does not exist");

    const context = await repo.getContext(question.contextId);
    if (context === null) throw new AppError(404, "The requested context does not exist");


    // Check whether the user's query is correct
    const tempDb = new TemporaryDatabase(context.content);
    
    const expected = tempDb.exec(question.answerKey);
    const actual   = tempDb.exec(userQuery);

    const isCorrect = compareResults(expected, actual);

    // Cleanup the temporary database
    tempDb.destroy();

    const answer = new QuestionAnswer(question.id, userId, userQuery, isCorrect ? question.points : 0);
    const answerId = await repo.setAnswer(answer);
    answer.id = answerId;

    await repo.appendQueryHistory(answer.id, userQuery);

    return {
        status: 200,
        responseJson: {
            success: isCorrect,
            result: actual.success ? actual.rows : actual.error
        }
    };
}

export async function clearHistory(db: DatabaseConnection, questionId: number): Promise<RouteResult> {
    const repo = new AssignmentRepository(db);
    await repo.clearQueryHistory(questionId, DEFAULT_USER_ID);

    return {
        status: 200,
        responseJson: {}
    };
}