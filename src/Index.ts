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

function checkFields(body: Object, res: any, ...fields: string[]): boolean {
    const missing: string[] = [];

    fields.forEach(field => {
        if (!(field in body)) {
            missing.push(field);
        }
    });

    if (missing.length > 0) {
        res.status(400).json({missingFields: missing});
        return false;
    }

    return true;
}

app.get('/test', async (req, res) => {
    if (!checkFields(req.query, res, 'field1', 'field2'))
        return;
    
    res.json({field1: req.query.field1, field2: req.query.field2});
});

app.get('/assignments', async (req, res) => {
    const result = await getAssignmentList(db);
    res.json(result);
});
app.get('/questions', async (req, res) => {
    if (!checkFields(req.query, res, 'assignment'))
        return;

    const assignmentId = parseInt(req.query.assignment as string);
    const result = await getQuestionList(db, assignmentId);
    res.json(result);
});

app.get('/questiondata', async (req, res) => {
    if (!checkFields(req.query, res, 'question'))
        return;

    const questionId = parseInt(req.query.question as string);
    const result = await getQuestionData(db, questionId);
    res.json(result);
});

app.get('/question', (req, res) => {
    const question = getQuestion();
    res.json(question);
});

app.post('/answer', (req, res) => {
    const query = req.body.query;
    const result = checkAnswer(query);
    res.json({result: result});
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});