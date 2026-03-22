const Joi = require('joi');

// Review prescription: approve or reject with optional medicines + total
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
    totalAmount: Joi.number().min(0).optional(),
    note: Joi.string().allow('', null).optional(),
});

// Update medicines list on a prescription
const updateMedicinesSchema = Joi.object({
    medicines: Joi.array().items(
        Joi.object({
            name: Joi.string().required(),
            dosage: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
            qty: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
            duration: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
            unitPrice: Joi.number().min(0).optional(),
        })
    ).min(1).required(),
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
    medications: Joi.any().custom((value, helpers) => {
        let parsed;
        if (typeof value === 'string') {
            try {
                parsed = JSON.parse(value);
            } catch (err) {
                return helpers.message('Invalid JSON format for medications array.');
            }
        } else {
            parsed = value;
        }

        if (!Array.isArray(parsed) || parsed.length === 0) {
            return helpers.message('Medications must be a non-empty array.');
        }

        const itemSchema = Joi.object({
            name: Joi.string().required(),
            dosage: Joi.string().required(),
            duration: Joi.string().required(),
        });

        for (const item of parsed) {
            const { error } = itemSchema.validate(item);
            if (error) {
                return helpers.message(`Invalid medication object: ${error.details[0].message}`);
            }
        }

        return parsed;
    }).required(),
    notes: Joi.string().allow('').optional(),
    fileUrl: Joi.string().allow('').optional()
});

// EMR Form Validation
const createEMRSchema = Joi.object({
    patientId: Joi.string().required(),
    diagnosis: Joi.string().required(),
    treatment: Joi.string().required(),
    notes: Joi.string().required()
});

module.exports = {
    reviewPrescriptionSchema,
    updateMedicinesSchema,
    updateOrderStatusSchema,
    updatePaymentStatusSchema,
    createPrescriptionSchema,
    createEMRSchema
};
