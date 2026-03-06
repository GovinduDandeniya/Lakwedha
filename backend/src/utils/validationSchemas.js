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

// Prescription form validation
const createPrescriptionSchema = Joi.object({
    patientId: Joi.string().required(),
    medications: Joi.alternatives().try(
        Joi.string(), // When sent via FormData, arrays come as stringified JSON
        Joi.array().items(
            Joi.object({
                name: Joi.string().required(),
                dosage: Joi.string().required(),
                duration: Joi.string().required(),
            })
        )
    ).required(),
    notes: Joi.string().allow('').optional(),
    fileUrl: Joi.string().allow('').optional()
});

module.exports = {
    reviewPrescriptionSchema,
    updateMedicinesSchema,
    updateOrderStatusSchema,
    updatePaymentStatusSchema,
    createPrescriptionSchema
};
