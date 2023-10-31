import express from "express";
import cors from "cors";

import { getQuestion, checkAnswer, getAssignmentList, getQuestionList, getQuestionData } from "./service/AssignmentService";

import DatabaseConnection from "./service/DatabaseService";

const app = express();
const port = 3001;

// For parsing application/json
app.use(express.json());
 
// For parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// This is necessary to transfer data in a local environment
app.use(cors());

const db = new DatabaseConnection();
db.connect();

app.get('/assignments', async (req, res) => {
    const result = await getAssignmentList(db);
    res.json(result);
});
app.get('/questions', async (req, res) => {
    const assignment: number = 'assignment' in req.query
        ? parseInt(req.query.assignment as string)
        : -1;

    const result = await getQuestionList(db, assignment);
    res.json(result);
});

app.get('/questiondata', async (req, res) => {
    const question: number = 'question' in req.query
        ? parseInt(req.query.question as string)
        : -1;

    const result = await getQuestionData(db, question);
    res.json(result);
});

app.get('/question', (req, res) => {
    let question = getQuestion();
    res.json(question);
});

app.post('/answer', (req, res) => {
    let query = req.body.query;
    let result = checkAnswer(query);
    res.json({result: result});
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});