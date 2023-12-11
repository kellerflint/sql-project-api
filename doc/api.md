# API

## routes

### GET /assignments
This route returns an array of assignment objects. It does not require any input parameters.

Each assignment object in the returned array uses following format:

|Field|Type|Notes|
|-|-|-|
|id|number|Assignment ID|
|title|string|Assignment title|
|due_date|string (SQL DATETIME format)|Assignment due date|
|questions|number|Number of questions|
|points|number|Total number of points|

### GET /questions
This route returns an array of question objects that belong to the assignment with the given ID.

#### Input
|Field|Type|Notes|
|-|-|-|
|assignment|number|Assignment ID|
#### Output
Each array element uses the following format.
|Field|Type|Notes|
|-|-|-|
|id|number|Question ID|
|question|string|Question prompt|
|points|number|Question points|

### GET /question
Returns detailed information about a specific question.

#### Input
|Field|Type|Notes|
|-|-|-|
|q|number|Question ID|

#### Output
|Field|Type|Notes|
|-|-|-|
|id|number|Question ID|
|question|string|Question prompt|
|context|string|Question context query (as described in [database.md](database.md))|
|points|number|Question points|
|expected|array|Array of expected rows|
|History|array|Array of past queries|

### POST /answer
Submits a user query and returns data for the frontend to display whether it was correct.

#### Input
|Field|Type|Notes|
|-|-|-|
|question|number|Question ID|
|query|string|User query|

#### Output
An array of rows using the same format as the `expected` field returned by `/question`, OR an error string if the query did not execute successfully.

### POST /clearhistory
Clears the query history for a particular question.

#### Input
|Field|Type|Notes|
|-|-|-|
|question|number|Question ID|

#### Output
An empty object.