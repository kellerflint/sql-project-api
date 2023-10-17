import Question from "./model/Question";
import alasql from "alasql";

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
    `SELECT * FROM Employees`);

function compareResults(a: Array<any>, b: Array<any>) {
    if (a.length != b.length) return false;

    // TODO: This isn't ideal, but it gets the job done for the time being. Write something better in the future.
    return JSON.stringify(a) === JSON.stringify(b);
}

export function getQuestion(req: Record<string, any>, res: Record<string, any>) {
    res.json({prompt: question.prompt, context: question.context});
}

export function checkAnswer(req: Record<string, any>, res: Record<string, any>) {
    let result;
    let userQuery = req.body.query;
    
    try {
        // Create a temporary database using the context queries provided with the question
        alasql("CREATE DATABASE tempdb; USE tempdb");
        alasql(question.context);

        // Execute the answer key query and the student's query, and compare the results
        let expected = alasql(question.answerKey);
        let actual   = alasql(userQuery);

        let isCorrect = compareResults(expected, actual);
        
        result = isCorrect ? "You answered correctly" : "You answered incorrectly";
    } 
    catch (error) {
        console.log(`Error occured when user submitted query: "${userQuery}"`);
        //result = "Something went wrong";
        result = "You answered incorrectly";
    }
    finally {
        // Cleanup the temporary database
        alasql("DROP DATABASE IF EXISTS tempdb");
    }

    res.json({result: result});
}