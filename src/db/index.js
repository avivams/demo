const Joi = require('joi');
const { ERRORS } = require('../constants');

class DBServiceLike {
    constructor() {
        this.employees = new Map();
        this.idCounter = 1;
    }

    static getSchemas() {
        const baseEmployeeSchema = Joi.object({
            name: Joi.string().min(3).required(),
            position: Joi.string().min(3).required()
        });

        const baseEmployeeWithIdSchema = baseEmployeeSchema.keys({
            id: Joi.number().integer().positive().required()
        });

        return {
            employeeSchema: baseEmployeeSchema,
            updateEmployeeSchema: baseEmployeeWithIdSchema,
            idsSchema: Joi.array().items(Joi.number().integer().positive()).required()
        };
    }

    async createEmployee(name, position) {
        const { employeeSchema } = DBServiceLike.getSchemas();
        const employee = { name, position };

        const { error } = employeeSchema.validate(employee);
        if (error) throw new Error(error.message);
        
        this.validateDupEmployee(name);

        const id = this.idCounter++;
        employee.id = id;
        this.employees.set(id, employee);
        return employee;
    }

    async createEmployees(employeesData) {
        const createdEmployees = [];
        const failedEmployees = [];
        for (const employeeData of employeesData) {
            try {
                const employee = await this.createEmployee(employeeData.name, employeeData.position);
                createdEmployees.push(employee);
            } catch (err) {
                failedEmployees.push({ ...employeeData, error: err.message });
            }
        }
        return { createdEmployees, failedEmployees };
    }

    async getAllEmployees(page, limit) {
        const employees = Array.from(this.employees.values());
        const paginatedEmployees = employees.slice((page - 1) * limit, page * limit);
        return paginatedEmployees;
    }

    async getEmployeeById(id) {
        const employee = this.employees.get(id);
        if (!employee) throw new Error(ERRORS.EMPLOYEE_NOT_FOUND);
        return employee;
    }

    async getEmployeesByIds(ids) {
        const { idsSchema } = DBServiceLike.getSchemas();
        const { error } = idsSchema.validate(ids);
        if (error) throw new Error(error.message);

        const foundEmployees = [];
        const notFoundIds = [];

        for (const id of ids) {
            const employee = this.employees.get(id);
            if (employee) {
                foundEmployees.push(employee);
            } else {
                notFoundIds.push(id);
            }
        }

        return { foundEmployees, notFoundIds };
    }

    async updateEmployee(id, updates) {
        const employee = this.employees.get(id);
        if (!employee) throw new Error(ERRORS.EMPLOYEE_NOT_FOUND);

        const { updateEmployeeSchema } = DBServiceLike.getSchemas();
        const { error } = updateEmployeeSchema.validate({ ...employee, ...updates });
        if (error) throw new Error(error.message);

        const updatedEmployee = { ...employee, ...updates };

        updatedEmployee.name !== employee.name && this.validateDupEmployee(updatedEmployee.name);
        
        this.employees.set(id, updatedEmployee);
        return updatedEmployee;
    }

    async updateEmployees(employeesData) {
        const updatedEmployees = [];
        const failedEmployees = [];
        for (const { id, ...updates } of employeesData) {
            try {
                const employee = await this.updateEmployee(id, updates);
                updatedEmployees.push(employee);
            } catch (err) {
                failedEmployees.push({ id, ...updates, error: err.message });
            }
        }
        return { updatedEmployees, failedEmployees };
    }

    async deleteEmployee(id) {
        if (!this.employees.has(id)) throw new Error(ERRORS.EMPLOYEE_NOT_FOUND);
        this.employees.delete(id);
    }

    async deleteEmployees(ids) {
        const { idsSchema } = DBServiceLike.getSchemas();
        const { error } = idsSchema.validate(ids);
        if (error) throw new Error(ERRORS.INVALID_INPUT);

        const deletedEmployees = [];
        const failedDeletes = [];

        for (const id of ids) {
            try {
                await this.deleteEmployee(id);
                deletedEmployees.push(id);
            } catch (err) {
                failedDeletes.push({ id, error: err.message });
            }
        }

        return { deletedEmployees, failedDeletes };
    }

    validateDupEmployee(name) {
        if (this.hasEmployeeByName(name)) 
            throw new Error(ERRORS.DUPLICATE_NAME);
    }

    hasEmployeeByName(name) {
        return !!Array.from(this.employees.values()).filter(v => v.name === name).length;
    }

    clear() {
        this.employees.clear();
    }
}

module.exports = new DBServiceLike();
