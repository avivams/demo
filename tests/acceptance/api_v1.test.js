const request = require('supertest');
const express = require('express');
const api_v1 = require('../../src/api/v1');
const DBServiceLike = require('../../src/db');
const app = express();
const { expect } = require('@jest/globals');

app.use(express.json());
app.use('/api/v1', api_v1);

const BASE_URL = '/api/v1/employees';
const EMPLOYEES = [
    { name: 'Asaf Granit', position: 'Chef' },
    { name: 'Eyal Shani', position: 'Head Chef' },
    { name: 'Shani Knafo', position: 'Pastry Chef' },
    { name: 'Haim Cohen', position: 'Chef' },
    { name: 'Meir Adoni', position: 'Sous Chef' },
    { name: 'Oded Shakarov', position: 'Chef' },
    { name: 'Ruthie Cohen', position: 'Waiter' },
    { name: 'Roni Kobar', position: 'Chef' },
    { name: 'Ofer Kfir', position: 'Chef' },
    { name: 'Yael Avrahami', position: 'Cook' }
];
const INVALID_EMPLOYEE = { name: '' };
const INVALID_IDS = [ 999, 1000 ];

async function resetDatabase() {
    await DBServiceLike.clear();
}

describe('API v1 Routes - Acceptance Tests', function () {
    beforeEach(async function () {
        await resetDatabase();
    });

    describe('GET /employees', function () {
        it('should return all employees', async function () {
            const { name, position } = EMPLOYEES[0];
            await DBServiceLike.createEmployee(name, position);

            const response = await request(app).get(BASE_URL);
            expect(response.status).toBe(200);
            expect(response.body).toEqual(expect.arrayContaining([
                expect.objectContaining(EMPLOYEES[0])
            ]));
        });
    });

    describe('GET /employees/:id', function () {
        it('should return an employee by ID', async function () {
            const { name, position } = EMPLOYEES[1];
            const employee = await DBServiceLike.createEmployee(name, position);

            const response = await request(app).get(`${BASE_URL}/${employee.id}`);
            expect(response.status).toBe(200);
            expect(response.body).toEqual(expect.objectContaining(EMPLOYEES[1]));
        });

        it('should return 404 for non-existent employee', async function () {
            const response = await request(app).get(`${BASE_URL}/999`);
            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: 'Employee not found' });
        });
    });

    describe('POST /employees', function () {
        it('should create a new employee', async function () {
            const newEmployee = EMPLOYEES[2];
            const response = await request(app)
                .post(BASE_URL)
                .send(newEmployee);

            expect(response.status).toBe(201);
            expect(response.body).toEqual(expect.objectContaining(newEmployee));

            const createdEmployee = await DBServiceLike.employees.get(response.body.id);
            expect(createdEmployee).toEqual(expect.objectContaining(newEmployee));
        });

        it('should return 400 for invalid input', async function () {
            const response = await request(app)
                .post(BASE_URL)
                .send(INVALID_EMPLOYEE);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Invalid input');
        });
    });

    describe('PUT /employees/:id', function () {
        it('should update an existing employee', async function () {
            const { name, position } = EMPLOYEES[3];
            const employee = await DBServiceLike.createEmployee(name, position);
            const updatedData = { name: 'Haim Cohen', position: 'Executive Chef' };

            const response = await request(app)
                .put(`${BASE_URL}/${employee.id}`)
                .send(updatedData);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(expect.objectContaining(updatedData));

            const updatedEmployee = await DBServiceLike.employees.get(employee.id);
            expect(updatedEmployee).toEqual(expect.objectContaining(updatedData));
        });

        it('should return 404 for non-existent employee', async function () {
            const response = await request(app)
                .put(`${BASE_URL}/999`)
                .send({ name: 'Non Existent', position: 'None' });

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: 'Employee not found' });
        });
    });

    describe('DELETE /employees/:id', function () {
        it('should delete an employee', async function () {
            const { name, position } = EMPLOYEES[4];
            const employee = await DBServiceLike.createEmployee(name, position);

            const response = await request(app)
                .delete(`${BASE_URL}/${employee.id}`);

            expect(response.status).toBe(204);

            const deletedEmployee = await DBServiceLike.employees.get(employee.id);
            expect(deletedEmployee).toBeUndefined();
        });

        it('should return 404 for non-existent employee', async function () {
            const response = await request(app)
                .delete(`${BASE_URL}/999`);

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: 'Employee not found' });
        });
    });

    describe('POST /employees/bulk', function () {
        it('should create multiple employees', async function () {
            const employees = [EMPLOYEES[5], EMPLOYEES[6]];

            const response = await request(app)
                .post(`${BASE_URL}/bulk`)
                .send(employees);

            expect(response.status).toBe(200);

            const createdEmployees = await Promise.all(employees.filter(emp =>
                DBServiceLike.hasEmployeeByName(emp.name)
            ));

            expect(createdEmployees).toEqual(expect.arrayContaining(employees));
        });

        it('should return errors for invalid bulk input', async function () {
            const invalidEmployees = [INVALID_EMPLOYEE];

            const response = await request(app)
                .post(`${BASE_URL}/bulk`)
                .send(invalidEmployees);

            expect(response.status).toBe(400);
            expect(response.body.failed).toEqual(expect.arrayContaining([
                expect.objectContaining(INVALID_EMPLOYEE)
            ]));
        });

        it('should handle a mix of successful and failed bulk creation', async function () {
            const employees = [EMPLOYEES[7], INVALID_EMPLOYEE];

            const response = await request(app)
                .post(`${BASE_URL}/bulk`)
                .send(employees);

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(expect.arrayContaining([
                expect.objectContaining(EMPLOYEES[7])
            ]));
            expect(response.body.failed).toEqual(expect.arrayContaining([
                expect.objectContaining({ name: '' })
            ]));
        });
    });

    describe('PUT /employees/bulk', function () {
        it('should update multiple employees', async function () {
            const { name, position } = EMPLOYEES[8];
            const employee = await DBServiceLike.createEmployee(name, position);
            const updates = [{ id: employee.id, name: 'Ofer Kfir', position: 'Executive Chef' }];

            const response = await request(app)
                .put(`${BASE_URL}/bulk`)
                .send(updates);

            expect(response.status).toBe(200);

            const updatedEmployee = await DBServiceLike.employees.get(employee.id);
            expect(updatedEmployee).toEqual(expect.objectContaining(updates[0]));
        });

        it('should return errors for invalid bulk update input', async function () {
            const invalidUpdates = [{ id: 999, name: 'Non Existent', position: 'None' }];

            const response = await request(app)
                .put(`${BASE_URL}/bulk`)
                .send(invalidUpdates);

            expect(response.status).toBe(400);
            expect(response.body.failed).toEqual(expect.arrayContaining([
                expect.objectContaining({ id: 999, error: 'Employee not found' })
            ]));
        });

        it('should handle a mix of successful and failed bulk updates', async function () {
            const { name, position } = EMPLOYEES[9];
            const employee = await DBServiceLike.createEmployee(name, position);
            const updates = [
                { id: employee.id, name: 'Yael Avrahami', position: 'Executive Chef' },
                { id: 999, name: 'Non Existent', position: 'None' }
            ];

            const response = await request(app)
                .put(`${BASE_URL}/bulk`)
                .send(updates);

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(expect.arrayContaining([
                expect.objectContaining({ id: employee.id, name: 'Yael Avrahami', position: 'Executive Chef' })
            ]));
            expect(response.body.failed).toEqual(expect.arrayContaining([
                expect.objectContaining({ id: 999, error: 'Employee not found' })
            ]));
        });
    });

    describe('GET /employees/bulk', function () {
        it('should return employees for given IDs', async function () {
            const employees = [
                await DBServiceLike.createEmployee(EMPLOYEES[8].name, EMPLOYEES[8].position),
                await DBServiceLike.createEmployee(EMPLOYEES[9].name, EMPLOYEES[9].position)
            ];
            
            const response = await request(app)
                .post(`/api/v1/employees/ids`).send({ ids: employees.map(e => e.id) });

            expect(response.status).toBe(200);
            expect(response.body.foundEmployees).toEqual(expect.arrayContaining(employees));
        });

        it('should return 400 for invalid IDs', async function () {
            const response = await request(app)
                .post(`/api/v1/employees/ids`).send({ ids: INVALID_IDS });

            expect(response.status).toBe(200);
            expect(response.body.notFoundIds).toEqual(INVALID_IDS);
        });
    });
});
