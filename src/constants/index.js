const ERRORS = {
    EMPLOYEE_NOT_FOUND: 'Employee not found',
    FAILED_CREATION: 'Failed to create employees',
    FAILED_DELETION: 'Failed to delete employees',
    DATABASE_ERROR: 'Database error occurred',
    VALIDATION_ERROR: 'Validation error occurred',
    EMPLOYEE_ID_MISSING: 'Employee ID is missing in the request',
    FAILED_CREATE_EMPLOYEE: 'Failed to create employee',
    FAILED_GET_EMPLOYEE: 'Failed to retrieve employee',
    FAILED_DELETE_EMPLOYEE: 'Failed to delete employee',
    INTERNAL_SERVER_ERROR: 'Internal server error',
    DUPLICATE_NAME: 'Duplicate name'
};

const SUCCESS_MESSAGES = {
    EMPLOYEE_CREATED: 'Employee created successfully',
    EMPLOYEE_UPDATED: 'Employee updated successfully',
    EMPLOYEE_DELETED: 'Employee deleted successfully',
};

module.exports = { ERRORS, SUCCESS_MESSAGES };
