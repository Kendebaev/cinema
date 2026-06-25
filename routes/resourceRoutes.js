const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');
const { validateBody } = require('../middleware/validationMiddleware');

// Public listing
router.get('/resource', resourceController.listResources);

// Protected Admin CRUD operations
router.post('/resource', isAuthenticated, isAdmin, validateBody('resource'), resourceController.createResource);
router.put('/resource/:id', isAuthenticated, isAdmin, validateBody('resource'), resourceController.updateResource);
router.delete('/resource/:id', isAuthenticated, isAdmin, resourceController.deleteResource);

module.exports = router;
