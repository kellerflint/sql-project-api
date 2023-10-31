import Question from "../model/Question";
import { TemporaryDatabase } from "./DatabaseSandboxService";
import DatabaseConnection, { QueryResult } from "./DatabaseService";

const question = new Question(
    // Prompt for the user
    `Select all columns from the "Employees" table.`,

    // SQL queries to configure the context
    `CREATE TABLE Employees (ID INT, Name VARCHAR(255), Supervisor INT);
    INSERT INTO Employees VALUES
        (1, "Joe", NULL),
        (2, "Bill", 1),
        (3, "Jill", NULL),
        (4, "Bob", 3),
        (5, "Marvin", 1);`,

    // Answer key query
    `SELECT * FROM Employees`
);

function compareResults(a: QueryResult, b: QueryResult) {
    if (a.rows.length !== b.rows.length) return false;

    return JSON.stringify(a) === JSON.stringify(b);
}

function formatQueryResult(result: QueryResult) {
    return result.success ? result.rows : { "error": result.error };
}
function formatSingleQueryResult(result: QueryResult) {
    return result.success
        ? (result.rows.length > 0 ? result.rows[0] : { "error": "No data was found" })
        : { "error": result.error };
}

export function getQuestion() {
    return {prompt: question.prompt, context: question.context};
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
            WHERE assignment_id = ${assignmentId};`);

    return formatQueryResult(result);
}

export async function getQuestionData(db: DatabaseConnection, questionId: number) {
    const result: QueryResult = await db.exec(`
        SELECT q.id, q.question, c.context, q.points
            FROM questions q
            JOIN contexts c ON q.context_id = c.id
            WHERE q.id = ${questionId};`);

    return formatSingleQueryResult(result);
}

export function checkAnswer(userQuery: string) {
    let result;

    // Create a temporary database using the context queries provided with the question
    let db = new TemporaryDatabase(question.context);
    
    const expected = db.exec(question.answerKey);
    const actual   = db.exec(userQuery);

    let isCorrect = compareResults(expected, actual);
    result = isCorrect ? "You answered correctly" : "You answered incorrectly";

    // Cleanup the temporary database
    db.destroy();

    return result;
}