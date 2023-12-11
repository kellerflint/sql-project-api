export default class Assignment {
    id: number;
    title: string;
    dueDate: Date;
    questionIds: number[];

    constructor(id: number, title: string, dueDate: Date, questionIds: number[]) {
        this.id = id;
        this.title = title;
        this.dueDate = dueDate;
        this.questionIds = questionIds;
    }
}