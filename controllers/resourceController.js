const Movie = require('../models/Movie');

// POST /resource - Create resource (Admin protected)
exports.createResource = async (req, res, next) => {
    try {
        const result = await Movie.create(req.body);
        const createdMovie = await Movie.findById(result.insertedId);
        
        res.status(201).json({
            success: true,
            message: 'Resource created successfully',
            data: createdMovie
        });
    } catch (err) {
        next(err);
    }
};

// GET /resource - List resources with search, filtering, and pagination
exports.listResources = async (req, res, next) => {
    try {
        const search = req.query.search || '';
        const genre = req.query.genre || '';
        const rating = req.query.rating || '';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sort || '';

        const { items, totalItems } = await Movie.findFiltered({
            search,
            genre,
            rating,
            page,
            limit,
            sortBy
        });

        const totalPages = Math.ceil(totalItems / limit);

        res.status(200).json({
            success: true,
            data: items,
            pagination: {
                totalItems,
                totalPages,
                currentPage: page,
                limit
            }
        });
    } catch (err) {
        next(err);
    }
};

// PUT /resource/:id - Update resource (Admin protected)
exports.updateResource = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const existing = await Movie.findById(id);
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found'
            });
        }

        await Movie.update(id, req.body);
        const updatedMovie = await Movie.findById(id);

        res.status(200).json({
            success: true,
            message: 'Resource updated successfully',
            data: updatedMovie
        });
    } catch (err) {
        next(err);
    }
};

// DELETE /resource/:id - Delete resource (Admin protected)
exports.deleteResource = async (req, res, next) => {
    try {
        const { id } = req.params;

        const existing = await Movie.findById(id);
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found'
            });
        }

        await Movie.delete(id);
        
        res.status(200).json({
            success: true,
            message: 'Resource deleted successfully'
        });
    } catch (err) {
        next(err);
    }
};
