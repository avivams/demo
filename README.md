# Home Assignment

Employees management API

## Run

```bash
npm i
node "./src/index"
```
Or with Docker
```bash
docker build -t "clar-aviv.ams2" .
docker run -p 3000:3000 "clar-aviv.ams2"
```
For testing run
```bash
npm run test
```

## Postman

The project has a Postman-ready file including all endpoints.
Install Postman, and import JSON file ```postman.json```.

## Project notes

1. Support of API versioning (v1 and v2). Only to show concept - no real difference between versions.
2. Using async functions to only show async concept. (DB is in-memory).
3. Server is using port 3000.
4. Tests covers all endpoints and db functions. Jest testing framework.
5. All logs are written to ```logs``` dir in ```/src/api/logger/logs```.