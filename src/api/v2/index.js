const express = require('express');
const DBServiceLike = require('../../db');
const { ERRORS, SUCCESS_MESSAGES } = require('../../constants');
const { logError, logSuccess } = require('../logger');
const { isNonEmptyArray } = require('../../utils');

const router = express.Router();

// Helper function to send responses
const sendResponse = (res, statusCode, message, data) => {
    if (statusCode >= 400) {
        logError(message);
    } else if (message) {
        logSuccess(message, data);
    }
    res.status(statusCode).json(data);
};

// Helper function to handle responses
const handleResponse = (res, successMessage, data, failedItems, failedMessage) => {
    if (data.length > 0 && failedItems.length > 0) {
        sendResponse(res, 200, `${successMessage} - Failed IDs: ${failedItems.map(item => item.id).join(', ')}`, { data, failed: failedItems });
    } else if (data.length > 0) {
        sendResponse(res, 200, successMessage, { data, failed: failedItems });
    } else if (failedItems.length > 0) {
        const failedIds = failedItems.map(item => item.id).join(', ');
        const message = `${failedMessage} - Failed IDs: ${failedIds}`;
        sendResponse(res, 400, message, { error: ERRORS.FAILED_CREATION, failed: failedItems });
    } else {
        sendResponse(res, 500, ERRORS.INTERNAL_SERVER_ERROR, { error: ERRORS.INTERNAL_SERVER_ERROR });
    }
};

// create 1 employee
router.post('/employees', async (req, res) => {
    try {
        const { name, position } = req.body;
        if (!name || !position) {
            return sendResponse(res, 400, ERRORS.INVALID_ARRAY, { error: ERRORS.INVALID_ARRAY });
        }

        const employee = await DBServiceLike.createEmployee(name, position);
        sendResponse(res, 201, `${SUCCESS_MESSAGES.EMPLOYEE_CREATED} - ID: ${employee.id}`, employee);
    } catch (error) {
        sendResponse(res, 500, ERRORS.INTERNAL_SERVER_ERROR, { error: ERRORS.INTERNAL_SERVER_ERROR });
    }
});

// create bulk employees
router.post('/employees/bulk', async (req, res) => {
    try {
        const employeesData = req.body;
        if (!isNonEmptyArray(employeesData)) {
            return sendResponse(res, 400, ERRORS.INVALID_ARRAY, { error: ERRORS.INVALID_ARRAY });
        }

        const { createdEmployees, failedEmployees } = await DBServiceLike.createEmployees(employeesData);
        const successMessage = `${SUCCESS_MESSAGES.EMPLOYEES_CREATED} - IDs: ${createdEmployees.map(e => e.id).join(', ')}`;
        handleResponse(res, successMessage, createdEmployees, failedEmployees, ERRORS.FAILED_CREATION);
    } catch (error) {
        sendResponse(res, 500, ERRORS.INTERNAL_SERVER_ERROR, { error: ERRORS.INTERNAL_SERVER_ERROR });
    }
});

// get employees
router.get('/employees', async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const employees = await DBServiceLike.getAllEmployees(parseInt(page, 10), parseInt(limit, 10));
        sendResponse(res, 200, undefined, employees);
    } catch (error) {
        sendResponse(res, 500, ERRORS.INTERNAL_SERVER_ERROR, { error: ERRORS.INTERNAL_SERVER_ERROR });
    }
});

// get employee by id
router.get('/employees/:id', async (req, res) => {
    try {
        const employee = await DBServiceLike.getEmployeeById(parseInt(req.params.id, 10));
        sendResponse(res, 200, `${SUCCESS_MESSAGES.EMPLOYEE_RETRIEVED} - ID: ${employee.id}`, employee);
    } catch (error) {
        sendResponse(res, 500, ERRORS.INTERNAL_SERVER_ERROR, { error: ERRORS.INTERNAL_SERVER_ERROR });
    }
});

// get employee by ids
router.post('/employees/ids', async (req, res) => {
    try {
        const { ids } = req.body;
        if (!isNonEmptyArray(ids)) {
            return sendResponse(res, 400, ERRORS.INVALID_ARRAY, { error: ERRORS.INVALID_ARRAY });
        }

        const { foundEmployees, notFoundIds } = await DBServiceLike.getEmployeesByIds(ids);
        sendResponse(res, 200, undefined, { foundEmployees, notFoundIds });
    } catch (error) {
        sendResponse(res, 500, ERRORS.INTERNAL_SERVER_ERROR, { error: ERRORS.INTERNAL_SERVER_ERROR });
    }
});

// update employee
router.put('/employees/:id', async (req, res) => {
    try {
        const updates = req.body;
        const employee = await DBServiceLike.updateEmployee(parseInt(req.params.id, 10), updates);
        sendResponse(res, 200, `${SUCCESS_MESSAGES.EMPLOYEE_UPDATED} - ID: ${employee.id}`, employee);
    } catch (error) {
        sendResponse(res, 500, ERRORS.INTERNAL_SERVER_ERROR, { error: ERRORS.INTERNAL_SERVER_ERROR });
    }
});

// update bullk employees
router.put('/employees/bulk', async (req, res) => {
    try {
        const employeesData = req.body;
        if (!isNonEmptyArray(employeesData)) {
            return sendResponse(res, 400, ERRORS.INVALID_ARRAY, { error: ERRORS.INVALID_ARRAY });
        }

        const { updatedEmployees, failedEmployees } = await DBServiceLike.updateEmployees(employeesData);
        const successMessage = `${SUCCESS_MESSAGES.EMPLOYEES_UPDATED} - IDs: ${updatedEmployees.map(e => e.id).join(', ')}`;
        handleResponse(res, successMessage, updatedEmployees, failedEmployees, ERRORS.FAILED_UPDATE_EMPLOYEES);
    } catch (error) {
        sendResponse(res, 500, ERRORS.INTERNAL_SERVER_ERROR, { error: ERRORS.INTERNAL_SERVER_ERROR });
    }
});

// delete employee
router.delete('/employees/:id', async (req, res) => {
    try {
        await DBServiceLike.deleteEmployee(parseInt(req.params.id, 10));
        sendResponse(res, 204, `${SUCCESS_MESSAGES.EMPLOYEE_DELETED} - ID: ${req.params.id}`, {});
    } catch (error) {
        sendResponse(res, 500, ERRORS.INTERNAL_SERVER_ERROR, { error: ERRORS.INTERNAL_SERVER_ERROR });
    }
});

// delete bulk employees
router.delete('/employees/bulk', async (req, res) => {
    try {
        const { ids } = req.body;
        if (!isNonEmptyArray(ids)) {
            return sendResponse(res, 400, ERRORS.INVALID_ARRAY, { error: ERRORS.INVALID_ARRAY });
        }

        const { deletedEmployees, failedDeletes } = await DBServiceLike.deleteEmployees(ids);
        const successMessage = `${SUCCESS_MESSAGES.EMPLOYEES_DELETED} - IDs: ${deletedEmployees.join(', ')}`;
        handleResponse(res, successMessage, deletedEmployees, failedDeletes, ERRORS.FAILED_DELETE_EMPLOYEES);
    } catch (error) {
        sendResponse(res, 500, ERRORS.INTERNAL_SERVER_ERROR, { error: ERRORS.INTERNAL_SERVER_ERROR });
    }
});

module.exports = router;
