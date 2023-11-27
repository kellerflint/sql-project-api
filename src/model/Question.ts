export default class Question {
    id: number;
    assignmentId: number;
    prompt: string;
    answerKey: string;
    contextId: number;
    points: number;

    constructor(id: number, assignmentId: number, prompt: string, answerKey: string, contextId: number, points: number) {
        this.id = id;
        this.assignmentId = assignmentId;
        this.prompt = prompt;
        this.answerKey = answerKey;
        this.contextId = contextId;
        this.points = points;
    }
}