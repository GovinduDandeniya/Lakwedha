const Joi = require('joi');

// Review prescription: approve or reject with optional medicines + total
exports.reviewPrescriptionSchema = Joi.object({
    status: Joi.string().valid('approved', 'rejected').required(),
    medicines: Joi.array().items(
        Joi.object({
            name: Joi.string().required(),
            qty: Joi.number().min(1).required(),
            unitPrice: Joi.number().min(0).required(),
        })
    ).optional(),
    totalAmount: Joi.number().min(0).optional(),
    note: Joi.string().allow('', null).optional(),
});

// Update medicines list on a prescription
exports.updateMedicinesSchema = Joi.object({
    medicines: Joi.array().items(
        Joi.object({
            name: Joi.string().required(),
            quantity: Joi.number().min(1).required(),
            price: Joi.number().min(0).required(),
        })
    ).min(1).required(),
});
