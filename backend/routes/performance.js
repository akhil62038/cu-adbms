const express = require('express');
const router = express.Router();
const { getMockData } = require('../config/database');

const ratingFields = ['rating', 'communication', 'technical', 'teamwork', 'punctuality'];
const recommendations = ['Promote', 'Bonus', 'Training', 'PIP', 'None'];

function validateReview(payload) {
  for (const field of ratingFields) {
    const rating = Number(payload[field]);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return `${field} rating must be between 1 and 5.`;
    }
  }
  if (!payload.review_period || !String(payload.review_period).trim()) return 'Review period is required.';
  if (payload.recommendation && !recommendations.includes(payload.recommendation)) return 'Choose a valid recommendation.';
  return null;
}

function withNames(review, data) {
  const employee = data.employees.find((emp) => emp.EMP_ID === review.EMP_ID);
  const reviewer = data.employees.find((emp) => emp.EMP_ID === review.REVIEWER_ID);
  return {
    ...review,
    FULL_NAME: employee ? `${employee.FIRST_NAME} ${employee.LAST_NAME}` : 'Unknown',
    REVIEWER_NAME: reviewer ? `${reviewer.FIRST_NAME} ${reviewer.LAST_NAME}` : 'Unknown'
  };
}

router.get('/', (req, res) => {
  const data = getMockData();
  return res.json({ status: 'SUCCESS', data: data.performance.map((review) => withNames(review, data)) });
});

router.post('/add', (req, res) => {
  const payload = req.body || {};
  const data = getMockData();
  const employeeId = Number(payload.emp_id);
  const reviewerId = Number(payload.reviewer_id);
  if (!data.employees.some((emp) => emp.EMP_ID === employeeId)) {
    return res.status(404).json({ status: 'ERROR', message: 'Employee not found.' });
  }
  if (!data.employees.some((emp) => emp.EMP_ID === reviewerId)) {
    return res.status(404).json({ status: 'ERROR', message: 'Reviewer not found.' });
  }
  const error = validateReview(payload);
  if (error) return res.status(400).json({ status: 'ERROR', message: error });

  const reviewPeriod = String(payload.review_period).trim();
  if (data.performance.some((review) => review.EMP_ID === employeeId && review.REVIEW_PERIOD === reviewPeriod)) {
    return res.status(409).json({ status: 'ERROR', message: 'A review already exists for this employee and period.' });
  }

  const review = {
    REVIEW_ID: data.performance.reduce((max, item) => Math.max(max, item.REVIEW_ID), 0) + 1,
    EMP_ID: employeeId,
    REVIEW_PERIOD: reviewPeriod,
    REVIEWER_ID: reviewerId,
    RATING: Number(payload.rating),
    COMMUNICATION: Number(payload.communication),
    TECHNICAL: Number(payload.technical),
    TEAMWORK: Number(payload.teamwork),
    PUNCTUALITY: Number(payload.punctuality),
    STRENGTHS: String(payload.strengths || '').trim(),
    IMPROVEMENTS: String(payload.improvements || '').trim(),
    GOALS: String(payload.goals || '').trim(),
    RECOMMENDATION: payload.recommendation || 'None'
  };
  data.performance.push(review);
  return res.status(201).json({ status: 'SUCCESS', data: withNames(review, data), message: 'Performance review added.' });
});

router.put('/:id', (req, res) => {
  const data = getMockData();
  const review = data.performance.find((item) => item.REVIEW_ID === Number(req.params.id));
  if (!review) return res.status(404).json({ status: 'ERROR', message: 'Performance review not found.' });

  const payload = req.body || {};
  const merged = {
    rating: payload.rating ?? review.RATING,
    communication: payload.communication ?? review.COMMUNICATION,
    technical: payload.technical ?? review.TECHNICAL,
    teamwork: payload.teamwork ?? review.TEAMWORK,
    punctuality: payload.punctuality ?? review.PUNCTUALITY,
    review_period: payload.review_period ?? review.REVIEW_PERIOD,
    recommendation: payload.recommendation ?? review.RECOMMENDATION
  };
  const error = validateReview(merged);
  if (error) return res.status(400).json({ status: 'ERROR', message: error });

  const fields = {
    rating: 'RATING',
    communication: 'COMMUNICATION',
    technical: 'TECHNICAL',
    teamwork: 'TEAMWORK',
    punctuality: 'PUNCTUALITY',
    review_period: 'REVIEW_PERIOD',
    recommendation: 'RECOMMENDATION',
    strengths: 'STRENGTHS',
    improvements: 'IMPROVEMENTS',
    goals: 'GOALS'
  };
  Object.entries(fields).forEach(([input, key]) => {
    if (payload[input] !== undefined) review[key] = ratingFields.includes(input) ? Number(payload[input]) : String(payload[input]).trim();
  });
  return res.json({ status: 'SUCCESS', data: withNames(review, data), message: 'Performance review updated.' });
});

router.delete('/:id', (req, res) => {
  const data = getMockData();
  const index = data.performance.findIndex((item) => item.REVIEW_ID === Number(req.params.id));
  if (index === -1) return res.status(404).json({ status: 'ERROR', message: 'Performance review not found.' });
  data.performance.splice(index, 1);
  return res.json({ status: 'SUCCESS', message: 'Performance review deleted.' });
});

module.exports = router;
