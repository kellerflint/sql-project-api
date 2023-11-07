import express from "express";
import cors from "cors";

import { checkAnswer, getAssignmentList, getQuestionList, getQuestionData } from "./service/AssignmentService";

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

app.get('/assignments', async (req, res) => {
    const result = await getAssignmentList(db);
    res.status(result.status).json(result.responseJson);
});
app.get('/questions', async (req, res) => {
    if (!checkFields(req.query, res, 'assignment')) return;

    const assignmentId = parseInt(req.query.assignment as string);
    const result = await getQuestionList(db, assignmentId);

    res.status(result.status).json(result.responseJson);
});

app.get('/question', async (req, res) => {
    if (!checkFields(req.query, res, 'q')) return;

    const questionId = parseInt(req.query.q as string);
    const result = await getQuestionData(db, questionId);
    res.status(result.status).json(result.responseJson);
});

app.post('/answer', async (req, res) => {
    if (!checkFields(req.body, res, "query", "question")) return;

    const question = parseInt(req.body.question as string);
    const query = req.body.query as string;
    const result = await checkAnswer(db, question, query);

    res.status(result.status).json(result.responseJson);
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});