CREATE TABLE users (
    id INT PRIMARY KEY IDENTITY(1,1),
    username VARCHAR(255) NOT NULL,
    is_instructor TINYINT NOT NULL
);
 
CREATE TABLE assignments (
    id INT PRIMARY KEY IDENTITY(1,1),
    title VARCHAR(255) NOT NULL,
    due_date DATETIME
);

CREATE TABLE questions (
    id INT PRIMARY KEY IDENTITY(1,1),
    assignment_id INT NOT NULL FOREIGN KEY REFERENCES assignments(id),
    context_id INT NOT NULL FOREIGN KEY REFERENCES contexts(id),
 
    question VARCHAR(5000) NOT NULL,
    answer VARCHAR(5000) NOT NULL,

    points INT NOT NULL
);
 
CREATE TABLE contexts (
    id INT PRIMARY KEY IDENTITY(1,1),
    title VARCHAR(255),
    context VARCHAR(5000)
);
 
CREATE TABLE users_assignments (
    id INT PRIMARY KEY,
    user_id INT NOT NULL FOREIGN KEY REFERENCES users(id),
    assign_id INT NOT NULL FOREIGN KEY REFERENCES assignments(id)
);
 
CREATE TABLE answers (
    id INT PRIMARY KEY IDENTITY(1,1)
    ua_id INT NOT NULL FOREIGN KEY REFERENCES users_assignments(id),
    question_id INT NOT NULL FOREIGN KEY REFERENCES questions(id),
 
    answer VARCHAR(255),
    query_history VARCHAR(5000),
    score INT
);