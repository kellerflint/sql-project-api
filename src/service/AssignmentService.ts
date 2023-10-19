import Question from "../model/Question";
import { TemporaryDatabase } from "./DatabaseSandboxService";

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

function compareResults(a: Array<any>, b: Array<any>) {
    if (a.length !== b.length) return false;

    return JSON.stringify(a) === JSON.stringify(b);
}

export function getQuestion() {
    return {prompt: question.prompt, context: question.context};
}

export function checkAnswer(userQuery: string) {
    let result;

    // Create a temporary database using the context queries provided with the question
    let db = new TemporaryDatabase(question.context);
    
    let expected = db.exec(question.answerKey);
    let actual   = db.exec(userQuery);

    let isCorrect = compareResults(expected, actual);
    result = isCorrect ? "You answered correctly" : "You answered incorrectly";

    // Cleanup the temporary database
    db.destroy();

    return result;
}