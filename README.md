# simple-node-api
A mockup for an API implemented using node.js, express and typescript.

Use `npm run start` to build and run the API.

## Configuration
This project requires a configuration file to be created in order to function. For a development environment, this file should exist at `./config/development.json`, and must be completed according to the following format:
```json
{
    {
    "Database": {
        "Server": "[server url here]",
        "Database": "[database name here]",
        "Port": [database port here],
        "User": "[user name here]",
        "Password": "[user password here]"
    }
}
}
```
All fields within square brackets must be manually configured to include the correct information.