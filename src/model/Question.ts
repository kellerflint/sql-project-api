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