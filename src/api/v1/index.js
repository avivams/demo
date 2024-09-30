const express = require('express');
const DBServiceLike = require('../../db');
const { ERRORS, SUCCESS_MESSAGES } = require('../../constants');
const AWSXRay = require('aws-xray-sdk');

const router = express.Router();

// Helper function to send responses
const sendResponse = (res, statusCode, message, data) => {
    res.status(statusCode).json(data);
};

// create 1 employee
router.post('/employees', async (req, res) => {
    const segment = AWSXRay.getSegment();
    const sub = segment.addNewSubsegment("POST/employee/");

    const { name, position } = req.body;
    if (!name || !position) {
        return sendResponse(res, 400, ERRORS.FAILED_CREATION, { error: ERRORS.FAILED_CREATION });
    }

    const employee = await DBServiceLike.createEmployee(name, position);
    sendResponse(res, 201, `${SUCCESS_MESSAGES.EMPLOYEE_CREATED} - ID: ${employee.id}`, employee);

    sub.close();
});

// get employee by id
router.get('/employees/:id', async (req, res) => {
    const segment = AWSXRay.getSegment();
    const sub = segment.addNewSubsegment("GET/employee/");

    await new Promise(resolve => {
        setTimeout(() => {
            AWSXRay.captureAsyncFunc('db-get-employee', async function (subsegment) {
                subsegment.close();
                resolve();
            });
        }, 200);
    });

    const employee = await DBServiceLike.getEmployeeById(parseInt(req.params.id));
    sendResponse(res, 200, undefined, employee);
    sub.close();
});

// delete employee
router.delete('/employees/:id', async (req, res) => {
    const segment = AWSXRay.getSegment();
    segment.addAnnotation('api', 'employees');
    const sub = segment.addNewSubsegment('DELETE/employees/' + req?.params?.id);

    await DBServiceLike.deleteEmployee(parseInt(req.params.id));
    sendResponse(res, 204, `${SUCCESS_MESSAGES.EMPLOYEE_DELETED} - ID: ${req.params.id}`, {});

    sub.close();
});
