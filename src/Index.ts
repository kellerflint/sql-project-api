import express from "express";
import cors from "cors";

import { getQuestion, checkAnswer } from "./service/AssignmentService";

const app = express();
const port = 3001;

// For parsing application/json
app.use(express.json());
 
// For parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// This is necessary to transfer data in a local environment
app.use(cors());


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