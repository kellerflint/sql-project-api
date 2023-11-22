import express, { Request, Response, NextFunction } from "express";
import cors from "cors";

import { checkAnswer, getAssignmentList, getQuestionList, getQuestionData, clearHistory } from "./service/AssignmentService";

import DatabaseConnection from "./service/DatabaseService";
import AppError from "./model/AppError";
import RouteResult from "./model/RouteResult";

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

function checkFields(body: Object, res: any, ...fields: string[]) {
    const missing: string[] = [];

    fields.forEach(field => {
        if (!(field in body)) {
            missing.push(field);
        }
    });

    if (missing.length > 0) {
        throw new AppError(400, `The following fields are missing: ${missing.join(", ")}`);
    }
}

async function executeRoute(req: Request, res: Response, next: NextFunction, action: (req: Request) => Promise<RouteResult>) {
    try {
        const result = await action(req);
        res.status(result.status).json(result.responseJson);
    } catch (err) {
        next(err);
    }
}

app.get('/assignments', async (req, res, next) => {
    executeRoute(req, res, next, async (req) => {
        return await getAssignmentList(db);
    });
});
app.get('/questions', async (req, res, next) => {
    executeRoute(req, res, next, async (req) => {
        checkFields(req.query, res, 'assignment')

        const assignmentId = parseInt(req.query.assignment as string);
        return await getQuestionList(db, assignmentId);
    });
});

app.get('/question', async (req, res, next) => {
    executeRoute(req, res, next, async (req) => {
        checkFields(req.query, res, 'q')
        const questionId = parseInt(req.query.q as string);
        return await getQuestionData(db, questionId);
    });
});

app.post('/answer', async (req, res, next) => {
    executeRoute(req, res, next, async (req) => {
        checkFields(req.body, res, "query", "question")

        const question = parseInt(req.body.question as string);
        const query = req.body.query as string;
        return await checkAnswer(db, question, query);
    });
});

app.post('/clearhistory', async (req, res, next) => {
    executeRoute(req, res, next, async (req) => {
        checkFields(req.body, res, "question")
        return await clearHistory(db, req.body.question);
    });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    //console.error(err.stack);

    let status = 500;

    if ('status' in err && typeof err.status === 'number') {
        status = err.status;
    }
    
    res.status(status).send(err.message);
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});