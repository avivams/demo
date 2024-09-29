const DBServiceLike = require('../../src/db');
const { ERRORS } = require('../../src/constants');
const { expect } = require('@jest/globals');

describe('DBServiceLike Unit Tests', () => {
    const VALID_EMPLOYEE = { name: 'Asaf Granit', position: 'Chef' };
    const INVALID_EMPLOYEE = { name: '' };
    const EMPLOYEE_UPDATE = { name: 'Haim Cohen', position: 'Executive Chef' };
    const NON_EXISTENT_ID = 999;

    beforeEach(async () => {
        DBServiceLike.employees.clear();
    });

    describe('createEmployee', () => {
        it('should create a new employee', async () => {
            const createdEmployee = await DBServiceLike.createEmployee(VALID_EMPLOYEE.name, VALID_EMPLOYEE.position);

            expect(createdEmployee).toMatchObject(VALID_EMPLOYEE);
            expect(createdEmployee.id).toBeDefined();
        });

        it('should throw an error for invalid employee input', async () => {
            await expect(DBServiceLike.createEmployee(INVALID_EMPLOYEE)).rejects.toThrow(ERRORS.INVALID_INPUT);
        });
    });

    describe('getEmployeeById', () => {
        it('should retrieve an employee by ID', async () => {
            const createdEmployee = await DBServiceLike.createEmployee(VALID_EMPLOYEE.name, VALID_EMPLOYEE.position);

            const fetchedEmployee = await DBServiceLike.employees.get(createdEmployee.id);
            expect(fetchedEmployee).toMatchObject(VALID_EMPLOYEE);
        });

        it('should return null for non-existent employee ID', async () => {
            const fetchedEmployee = await DBServiceLike.employees.get(NON_EXISTENT_ID);
            expect(fetchedEmployee).toBeUndefined();
        });
    });

    describe('updateEmployee', () => {
        it('should update an existing employee', async () => {
            const createdEmployee = await DBServiceLike.createEmployee(VALID_EMPLOYEE.name, VALID_EMPLOYEE.position);

            const updatedEmployee = await DBServiceLike.updateEmployee(createdEmployee.id, EMPLOYEE_UPDATE);

            expect(updatedEmployee).toMatchObject(EMPLOYEE_UPDATE);
        });

        it('should throw an error for updating non-existent employee', async () => {
            await expect(DBServiceLike.updateEmployee(NON_EXISTENT_ID, EMPLOYEE_UPDATE)).rejects.toThrow(ERRORS.EMPLOYEE_NOT_FOUND);
        });
    });

    describe('deleteEmployee', () => {
        it('should delete an employee by ID', async () => {
            const createdEmployee = await DBServiceLike.createEmployee(VALID_EMPLOYEE.name, VALID_EMPLOYEE.position);

            await DBServiceLike.deleteEmployee(createdEmployee.id);

            const fetchedEmployee = await DBServiceLike.employees.get(createdEmployee.id);
            expect(fetchedEmployee).toBeUndefined();
        });

        it('should throw an error for deleting non-existent employee', async () => {
            await expect(DBServiceLike.deleteEmployee(NON_EXISTENT_ID)).rejects.toThrow(ERRORS.EMPLOYEE_NOT_FOUND);
        });
    });

    describe('createEmployees', () => {
        const BULK_EMPLOYEES = [
            { name: 'Oded Shakarov', position: 'Chef' },
            { name: 'Ruthie Cohen', position: 'Waiter' }
        ];
        const INVALID_BULK_EMPLOYEES = [
            { name: 'Yael Avrahami', position: 'Cook' },
            INVALID_EMPLOYEE
        ];

        it('should create multiple employees', async () => {
            const result = await DBServiceLike.createEmployees(BULK_EMPLOYEES);

            expect(result.createdEmployees).toHaveLength(BULK_EMPLOYEES.length);
            expect(result.failedEmployees).toHaveLength(0);
        });

        it('should handle invalid inputs in bulk creation', async () => {
            const result = await DBServiceLike.createEmployees(INVALID_BULK_EMPLOYEES);

            expect(result.createdEmployees).toHaveLength(1);
            expect(result.failedEmployees).toHaveLength(1);
            expect(result.failedEmployees[0].error).toBe('"name" is not allowed to be empty');
        });
    });

    describe('updateEmployees', () => {
        const BULK_UPDATE = [
            { id: 1, name: 'Roni Kobar', position: 'Executive Chef' },
            { id: NON_EXISTENT_ID, name: 'Non Existent', position: 'None' }
        ];

        it('should update multiple employees', async () => {
            const { createdEmployees: employees } = await DBServiceLike.createEmployees(BULK_UPDATE)
            employees[0].position = "Chef";
            employees[1].position = "Waiter";

            const result = await DBServiceLike.updateEmployees(employees);

            expect(result.updatedEmployees).toHaveLength(2);
            expect(result.failedEmployees).toHaveLength(0);

            const updatedEmployee = await DBServiceLike.employees.get(employees[0].id);
            expect(updatedEmployee.position).toBe('Chef');
        });

        it('should handle invalid updates in bulk update', async () => {
            const emp = await DBServiceLike.createEmployee(BULK_UPDATE[0].name, BULK_UPDATE[0].position);
            const check = [...BULK_UPDATE];
            check[0].id = emp.id;
            const result = await DBServiceLike.updateEmployees(BULK_UPDATE);

            expect(result.updatedEmployees).toHaveLength(1);
            expect(result.failedEmployees).toHaveLength(1);
            expect(result.failedEmployees[0].error).toBe(ERRORS.EMPLOYEE_NOT_FOUND);
        });
    });

    describe('getEmployeesByIds', () => {
        const INVALID_IDS = [NON_EXISTENT_ID, 1000];

        it('should retrieve multiple employees by IDs', async () => {
            const employees = [
                await DBServiceLike.createEmployee('Ofer Kfir', 'Chef'),
                await DBServiceLike.createEmployee('Yael Avrahami', 'Cook')
            ];

            const result = await DBServiceLike.getEmployeesByIds(employees.map(e => e.id));

            expect(result.foundEmployees).toHaveLength(employees.length);
            expect(result.notFoundIds).toHaveLength(0);
        });

        it('should handle invalid IDs in bulk retrieval', async () => {
            const result = await DBServiceLike.getEmployeesByIds(INVALID_IDS);

            expect(result.foundEmployees).toHaveLength(0);
            expect(result.notFoundIds).toEqual(INVALID_IDS);
        });
    });
});
