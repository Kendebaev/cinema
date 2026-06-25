const Joi = require('joi');

// Regex for international phone numbers (e.g., +1234567890 or 87771234567)
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

// Regex for password complexity: at least 1 uppercase letter, 1 lowercase letter, and 1 number
const passwordComplexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

const schemas = {
    register: Joi.object({
        username: Joi.string().min(3).max(30).required().messages({
            'string.min': 'Username must be at least 3 characters long',
            'any.required': 'Username is required'
        }),
        email: Joi.string().email().required().messages({
            'string.email': 'Please enter a valid email address',
            'any.required': 'Email is required'
        }),
        phone: Joi.string().pattern(phoneRegex).required().messages({
            'string.pattern.base': 'Please enter a valid phone number (e.g. +77071234567 or 87071234567)',
            'any.required': 'Phone number is required'
        }),
        password: Joi.string().pattern(passwordComplexityRegex).required().messages({
            'string.pattern.base': 'Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, and one number',
            'any.required': 'Password is required'
        }),
        confirmPassword: Joi.any().equal(Joi.ref('password')).required().messages({
            'any.only': 'Passwords do not match',
            'any.required': 'Confirm password is required'
        })
    }),

    login: Joi.object({
        username: Joi.string().required().messages({
            'any.required': 'Username is required'
        }),
        password: Joi.string().required().messages({
            'any.required': 'Password is required'
        })
    }),

    resource: Joi.object({
        title: Joi.string().min(1).max(100).required().messages({
            'string.min': 'Title cannot be empty',
            'any.required': 'Title is required'
        }),
        genre: Joi.string().min(1).max(50).required().messages({
            'string.min': 'Genre cannot be empty',
            'any.required': 'Genre is required'
        }),
        duration: Joi.number().integer().positive().required().messages({
            'number.base': 'Duration must be a number',
            'number.positive': 'Duration must be positive',
            'any.required': 'Duration is required'
        }),
        releaseDate: Joi.string().isoDate().required().messages({
            'string.isoDate': 'Release Date must be in YYYY-MM-DD format',
            'any.required': 'Release Date is required'
        }),
        rating: Joi.number().min(0).max(10).required().messages({
            'number.min': 'Rating must be at least 0',
            'number.max': 'Rating cannot exceed 10',
            'any.required': 'Rating is required'
        }),
        description: Joi.string().allow('').max(500)
    })
};

const validateBody = (schemaName) => {
    return (req, res, next) => {
        if (!schemas[schemaName]) {
            return next(new Error(`Validation schema '${schemaName}' not found`));
        }

        const { error } = schemas[schemaName].validate(req.body, { abortEarly: false });
        
        if (error) {
            const errorMessages = error.details.map(d => d.message).join(', ');
            
            // Check if it's an API request
            if (req.originalUrl.startsWith('/api') || req.xhr || req.headers.accept?.includes('json')) {
                return res.status(400).json({
                    success: false,
                    message: errorMessages,
                    errors: error.details.map(d => ({ field: d.path[0], message: d.message }))
                });
            }
            
            // Return to view with error state
            return res.render(schemaName === 'register' ? 'register' : 'login', {
                error: errorMessages,
                success: null
            });
        }
        
        next();
    };
};

module.exports = { validateBody, schemas };
