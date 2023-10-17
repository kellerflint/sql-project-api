export default class Question {
    prompt: string;
    context: string;
    answerKey: string;

    constructor(prompt: string, context: string, answerKey: string) {
        this.prompt = prompt;
        this.context = context;
        this.answerKey = answerKey;
    }
}

// const QUESTIONS: Array<Question> = [
//     new Question("Select all columns from the \"Employees\" table.", "SELECT * FROM Employees"),
//     new Question("Select the \"Revenue\" column from the \"Companies\" table.", "SELECT Revenue FROM Companies")
// ];