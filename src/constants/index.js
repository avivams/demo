const ERRORS = {
    INVALID_ARRAY: 'Invalid input: must be a non-empty array',
    EMPLOYEE_NOT_FOUND: 'Employee not found',
    FAILED_CREATION: 'Failed to create employees',
    FAILED_UPDATE: 'Failed to update employees',
    FAILED_DELETION: 'Failed to delete employees',
    DATABASE_ERROR: 'Database error occurred',
    VALIDATION_ERROR: 'Validation error occurred',
    EMPLOYEE_ID_MISSING: 'Employee ID is missing in the request',
    FAILED_CREATE_EMPLOYEE: 'Failed to create employee',
    FAILED_CREATE_EMPLOYEES: 'Failed to create employees',
    FAILED_GET_EMPLOYEES: 'Failed to retrieve employees',
    FAILED_GET_EMPLOYEE: 'Failed to retrieve employee',
    FAILED_UPDATE_EMPLOYEE: 'Failed to update employee',
    FAILED_UPDATE_EMPLOYEES: 'Failed to update employees',
    FAILED_DELETE_EMPLOYEE: 'Failed to delete employee',
    FAILED_DELETE_EMPLOYEES: 'Failed to delete employees',
    INTERNAL_SERVER_ERROR: 'Internal server error',
    DUPLICATE_NAME: 'Duplicate name'
};

const SUCCESS_MESSAGES = {
    EMPLOYEE_CREATED: 'Employee created successfully',
    EMPLOYEES_CREATED: 'Employees created successfully',
    EMPLOYEE_UPDATED: 'Employee updated successfully',
    EMPLOYEES_UPDATED: 'Employees updated successfully',
    EMPLOYEE_DELETED: 'Employee deleted successfully',
    EMPLOYEES_DELETED: 'Employees deleted successfully',
};

module.exports = { ERRORS, SUCCESS_MESSAGES };
