var ObjectId = require('mongoose').Types.ObjectId;
const express = require('express');

const router = express.Router();
const BrainGameType = require('../model/BrainGameType');

router.post('/delete', async (req, res) => {
	try {
		const { _id } = req.body;

		await BrainGameType.remove({_id: _id});
        const brain_game_types = await BrainGameType.find({}).sort({game_type_name: 'asc'});
	
		res.json({
			success: true,
            message: 'Game type has been removed',
            brain_game_types
		});
	} catch (err) {
		res.json({
			success: false,
			err: err
		});
	}
});

router.post('/', async (req, res) => {
	try {
		const { _id, game_type_name } = req.body;

		let brainGameType = new BrainGameType({
			game_type_name,
		});;
		
		if (_id) {
			brainGameType = await BrainGameType.findOne({_id: _id});
			brainGameType.game_type_name = game_type_name;
			brainGameType.updated_at = Date.now();
		}
	
		await brainGameType.save();
        const brain_game_types = await BrainGameType.find({}).sort({game_type_name: 'asc'});
	
		res.json({
			success: true,
            message: 'New question created',
            brain_game_types
		});
	} catch (err) {
		res.json({
				success: false,
				err: err
		});
	}
});

router.get('/:id', async (req, res) => {
	try {
        const brainGameType = await BrainGameType.findOne({_id: req.params.id});

        res.json({
            success: true,
            query: req.query,
            brain_game_type: brainGameType
        });
	} catch (err) {
        res.json({
            success: false,
            err: err
        });
	}
});

router.get('/', async (req, res) => {
	try {
        const brain_game_types = await BrainGameType.find({}).sort({created_at: 'asc'});

		res.json({
				success: true,
				query: req.query,
				brain_game_types,
		});
	} catch (err) {
		res.json({
				success: false,
				err: err
		});
	}
});

module.exports = router;
