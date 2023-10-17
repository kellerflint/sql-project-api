import express from "express";
import cors from "cors";

import apiFunction from "./ApiTest";

const app = express();
const port = 3001;

// For parsing application/json
app.use(express.json());
 
// For parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// This is necessary to transfer data in a local environment
app.use(cors());

app.post('/api', apiFunction);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});