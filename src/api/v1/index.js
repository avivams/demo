const express = require('express');
const DBServiceLike = require('../../db');
const { ERRORS, SUCCESS_MESSAGES } = require('../../constants');
const { logError, logSuccess } = require('../logger');
const { isNonEmptyArray } = require('../../utils');
const AWSXRay = require('aws-xray-sdk');

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
        sendResponse(res, 400, message, { error: message, failed: failedItems });
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
        if (error.message === ERRORS.DUPLICATE_NAME)
            sendResponse(res, 400, ERRORS.DUPLICATE_NAME, { error: ERRORS.DUPLICATE_NAME });
        else sendResponse(res, 500, ERRORS.INTERNAL_SERVER_ERROR, { error: ERRORS.INTERNAL_SERVER_ERROR });
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
        const employees = await DBServiceLike.getAllEmployees(parseInt(page), parseInt(limit));
        sendResponse(res, 200, undefined, employees);
    } catch (error) {
        sendResponse(res, 500, ERRORS.INTERNAL_SERVER_ERROR, { error: ERRORS.INTERNAL_SERVER_ERROR });
    }
});

// get employee by id
router.get('/employees/:id', async (req, res) => {
    const segment = AWSXRay.getSegment();
    const sub = segment.addNewSubsegment("http:get-employee");

    const sendService = {
        send: () => new Promise(resolve => {
            setTimeout(() => {
                AWSXRay.captureAsyncFunc('db-get-employee', async function (subsegment) {
                    subsegment.close();
                    resolve();
                });
            }, 200);
        })
    }
    AWSXRay.captureAWSClient(sendService);
    await sendService.send();

    try {
        const employee = await DBServiceLike.getEmployeeById(parseInt(req.params.id));
        sendResponse(res, 200, undefined, employee);
    } catch (error) {
        if (error?.message === ERRORS.EMPLOYEE_NOT_FOUND) 
            sendResponse(res, 404, ERRORS.EMPLOYEE_NOT_FOUND, { error: ERRORS.EMPLOYEE_NOT_FOUND });
        else sendResponse(res, 500, ERRORS.INTERNAL_SERVER_ERROR, { error: ERRORS.INTERNAL_SERVER_ERROR });
    }
    sub.close();
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

// update bullk employees
router.put('/employees/bulk', async (req, res) => {
    try {
        const employeesData = req.body;
        if (!isNonEmptyArray(employeesData)) {
            return sendResponse(res, 400, ERRORS.INVALID_ARRAY, { error: ERRORS.INVALID_ARRAY });
        }
        employeesData.forEach(emp => emp.id = parseInt(emp.id));
        const { updatedEmployees, failedEmployees } = await DBServiceLike.updateEmployees(employeesData);
        const successMessage = `${SUCCESS_MESSAGES.EMPLOYEES_UPDATED} - IDs: ${updatedEmployees.map(e => e.id).join(', ')}`;
        handleResponse(res, successMessage, updatedEmployees, failedEmployees, ERRORS.FAILED_UPDATE_EMPLOYEES);
    } catch (error) {
        sendResponse(res, 500, ERRORS.INTERNAL_SERVER_ERROR, { error: ERRORS.INTERNAL_SERVER_ERROR });
    }
});

// update employee
router.put('/employees/:id', async (req, res) => {
    try {
        const updates = req.body;
        const employee = await DBServiceLike.updateEmployee(parseInt(req.params.id), updates);
        sendResponse(res, 200, `${SUCCESS_MESSAGES.EMPLOYEE_UPDATED} - ID: ${employee.id}`, employee);
    } catch (error) {
        if (error.message === ERRORS.DUPLICATE_NAME)
            sendResponse(res, 400, error.message, { error: error.message });
        else if (error.message === ERRORS.EMPLOYEE_NOT_FOUND)
            sendResponse(res, 404, error.message, { error: error.message });
        else sendResponse(res, 500, ERRORS.INTERNAL_SERVER_ERROR, { error: ERRORS.INTERNAL_SERVER_ERROR });
    }
});

// delete employee
router.delete('/employees/:id', async (req, res) => {
    const segment = AWSXRay.getSegment();
    segment.addAnnotation('api', 'employees');
    const sub = segment.addNewSubsegment('DELETE/employees/'+req?.params?.id);
    try {
        await DBServiceLike.deleteEmployee(parseInt(req.params.id));
        sendResponse(res, 204, `${SUCCESS_MESSAGES.EMPLOYEE_DELETED} - ID: ${req.params.id}`, {});
    } catch (error) {
        if (error.message === ERRORS.EMPLOYEE_NOT_FOUND) 
            sendResponse(res, 404, error.message, { error: error.message });
        else sendResponse(res, 500, ERRORS.INTERNAL_SERVER_ERROR, { error: ERRORS.INTERNAL_SERVER_ERROR });
    }
    sub.close();
});

// delete bulk employees
router.delete('/employees/bulk', async (req, res) => {
    try {
        const { ids } = req.body;
        if (!isNonEmptyArray(ids)) {
            return sendResponse(res, 400, ERRORS.INVALID_ARRAY, { error: ERRORS.INVALID_ARRAY });
        }

        const { deletedEmployees, failedDeletes } = await DBServiceLike.deleteEmployees(ids.map(id => parseInt(id)));
        const successMessage = `${SUCCESS_MESSAGES.EMPLOYEES_DELETED} - IDs: ${deletedEmployees.join(', ')}`;
        handleResponse(res, successMessage, deletedEmployees, failedDeletes, ERRORS.FAILED_DELETE_EMPLOYEES);
    } catch (error) {
        sendResponse(res, 500, ERRORS.INTERNAL_SERVER_ERROR, { error: ERRORS.INTERNAL_SERVER_ERROR });
    }
});

module.exports = router;
