const Joi = require('joi');
const { PRESCRIPTION_STATUS, ORDER_STATUS, PAYMENT_STATUS } = require('../config/constants');

// Pharmacy: Review Prescription
const reviewPrescriptionSchema = Joi.object({
    status: Joi.string().valid('approved', 'rejected').required(),
    medicines: Joi.array().items(
        Joi.object({
            name: Joi.string().required(),
            qty: Joi.number().min(1).required(),
            unitPrice: Joi.number().min(0).required(),
            totalPrice: Joi.number().min(0).required()
        })
    ).required(),
    totalAmount: Joi.number().min(0).required()
});

// Pharmacy: Update Medicines
const updateMedicinesSchema = Joi.object({
    medicines: Joi.array().items(
        Joi.object({
            name: Joi.string().min(1).required(),
            quantity: Joi.number().min(1).required(),
            price: Joi.number().min(0).required()
        })
    ).min(1).required()
});

// Order: Update Status
const updateOrderStatusSchema = Joi.object({
    status: Joi.string().valid(...Object.values(ORDER_STATUS)).required()
});

// Order: Update Payment
const updatePaymentStatusSchema = Joi.object({
    paymentStatus: Joi.string().valid(...Object.values(PAYMENT_STATUS)).required()
});

module.exports = {
    reviewPrescriptionSchema,
    updateMedicinesSchema,
    updateOrderStatusSchema,
    updatePaymentStatusSchema
};
