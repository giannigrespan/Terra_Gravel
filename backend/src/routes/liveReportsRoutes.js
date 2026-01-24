const express = require('express');
const router = express.Router();
const liveReportsController = require('../controllers/liveReportsController');
const { authenticate } = require('../middleware/auth');
const { body, param, query: queryValidator } = require('express-validator');

// Validation middleware
const createReportValidation = [
  body('reportType')
    .isIn(['ROAD_CLOSED', 'MUD', 'FALLEN_TREE', 'DANGEROUS_DOGS', 'FLOODING', 'CONSTRUCTION', 'ICE', 'GRAVEL_CONDITION', 'OTHER'])
    .withMessage('Invalid report type'),
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
  body('severity')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Severity must be between 1 and 5'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description too long'),
];

const getReportsValidation = [
  queryValidator('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  queryValidator('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
  queryValidator('radius')
    .optional()
    .isFloat({ min: 1, max: 100 })
    .withMessage('Radius must be between 1 and 100 km'),
];

/**
 * @route   POST /api/v1/reports
 * @desc    Create a live road report
 * @access  Private
 */
router.post('/', authenticate, createReportValidation, liveReportsController.createReport);

/**
 * @route   GET /api/v1/reports
 * @desc    Get live reports in area
 * @access  Private
 */
router.get('/', authenticate, getReportsValidation, liveReportsController.getReports);

/**
 * @route   GET /api/v1/reports/mine
 * @desc    Get my reports
 * @access  Private
 */
router.get('/mine', authenticate, liveReportsController.getMyReports);

/**
 * @route   GET /api/v1/reports/:reportId
 * @desc    Get single report
 * @access  Private
 */
router.get('/:reportId', authenticate, liveReportsController.getReport);

/**
 * @route   POST /api/v1/reports/:reportId/vote
 * @desc    Vote on a report (confirm/deny)
 * @access  Private
 */
router.post('/:reportId/vote', authenticate, liveReportsController.voteReport);

/**
 * @route   DELETE /api/v1/reports/:reportId
 * @desc    Delete own report
 * @access  Private
 */
router.delete('/:reportId', authenticate, liveReportsController.deleteReport);

module.exports = router;
