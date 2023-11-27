export default class QuestionAnswer {
    readonly questionId: number;
    readonly userId: number;
    answer: string;
    score: number;
    id: number = -1;

    constructor(questionId: number, userId: number, answer: string = "", score: number = 0) {
        this.questionId = questionId;
        this.userId = userId;
        this.answer = answer;
        this.score = score;
    }
}