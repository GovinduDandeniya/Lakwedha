const Joi = require('joi');

const reviewPrescriptionSchema = Joi.object({
    status: Joi.string().valid('pending', 'approved', 'rejected').required(),
    medicines: Joi.array().items(
        Joi.object({
            name: Joi.string().required(),
            dosage: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
            qty: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
            duration: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
            unitPrice: Joi.number().min(0).optional(),
        })
    ).optional(),
    totalAmount: Joi.number().min(0).optional()
});

const updateMedicinesSchema = Joi.object({
    medicines: Joi.array().items(
        Joi.object({
            name: Joi.string().required(),
            dosage: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
            qty: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
            duration: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
            unitPrice: Joi.number().min(0).optional(),
        })
    ).required()
});

const updateOrderStatusSchema = Joi.object({
    status: Joi.string().valid('pending', 'approved', 'processing', 'shipped', 'completed').required()
});

const updatePaymentStatusSchema = Joi.object({
    paymentStatus: Joi.string().valid('pending', 'paid', 'failed').required()
});



module.exports = {
    reviewPrescriptionSchema,
    updateMedicinesSchema,
    updateOrderStatusSchema,
    updatePaymentStatusSchema,
    createPrescriptionSchema
};
