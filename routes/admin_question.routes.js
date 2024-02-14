/* eslint-disable consistent-return */
/* eslint-disable no-underscore-dangle */
var ObjectId = require('mongoose').Types.ObjectId;
const express = require('express');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();
const Question = require('../model/Question');
const Answer = require('../model/Answer');
const BrainGameType = require('../model/BrainGameType');
router.post('/delete', async (req, res) => {
	try {
		const { _id, brain_game_type } = req.body;

		// Find the question to be deleted
		const deletedQuestion = await Question.findOne({ _id });

		// Check if the question exists
		if (!deletedQuestion) {
			return res.status(404).json({
				success: false,
				message: 'Question not found',
			});
		}

		// Delete the question and its associated answers
		await Question.deleteOne({ _id });
		await Answer.deleteMany({ question: _id });

		// Retrieve all questions for the corresponding brain_game_type except for the deleted question
		console.log("hi", brain_game_type)

		await BrainGameType.updateOne(
			{ _id: brain_game_type },
			{ $inc: { count: -1 } }
		);

		res.json({
			success: true,
			message: 'Question has been removed',
		});
	} catch (err) {
		res.status(500).json({
			success: false,
			message: 'An error occurred while deleting the question',
			error: err
		});
	}
});

router.post('/', auth, async (req, res) => {
	try {
		const { _id, question, image, brain_game_type, answers, incorrect_answers } = req.body;
		if (!question || answers.length === 0) {
			return res.json({
				success: false,
				error: 'Please enter all fields'
			});
		}

		let questionObj = new Question({
			question,
			image,
			brain_game_type: new ObjectId(brain_game_type)
		});;

		if (_id) {
			questionObj = await Question.findOne({ _id: _id });
			questionObj.question = question;
			questionObj.brain_game_type = new ObjectId(brain_game_type);
			questionObj.updated_at = Date.now();
		}

		// Retrieve the brain game type from the database and check its user_id
		const gameType = await BrainGameType.findById(brain_game_type);
		if (gameType.user_id.toString() !== req.user._id.toString()) {
			return res.status(401).json({
				success: false,
				error: 'You are not authorized to add a question to this brain game type'
			});
		}

		await questionObj.save();

		await Answer.deleteOne({ question: questionObj });

		answers.forEach(answer => {
			const newAnswer = new Answer({
				question: questionObj,
				answer: answer,
				brain_game_type: new ObjectId(brain_game_type),
				is_correct_answer: true
			});

			newAnswer.save();
		});

		incorrect_answers.forEach(answer => {
			const newAnswer = new Answer({
				question: questionObj,
				answer: answer,
				brain_game_type: new ObjectId(brain_game_type),
				is_correct_answer: false
			});

			newAnswer.save();
		});

		// Increment the corresponding BrainGameType count by 1
		await BrainGameType.updateOne(
			{ _id: brain_game_type },
			{ $inc: { count: 1 } }
		);

		res.json({
			success: true,
			message: 'New question created',
		});
	} catch (err) {
		res.json({
			success: false,
			err: err
		});
	}
});

// /api/question/:id call
router.get('/:id', async (req, res) => {


	try {
		const question = await Question.findOne({ _id: req.params.id });

		const answers = await Answer.find({ question: question, is_correct_answer: true });
		const incorrectAnswers = await Answer.find({ question: question, is_correct_answer: false });

		let answerList = [];
		answers.forEach(answer => {
			answerList.push(answer.answer);
		});

		let incorrectAnswerList = [];
		incorrectAnswers.forEach(answer => {
			incorrectAnswerList.push(answer.answer);
		});

		res.json({
			success: true,
			query: req.query,
			question: {
				_id: question._id,
				question: question.question,
				image: question.image,
				brain_game_type: question.brain_game_type,
				answers: answerList,
				incorrect_answers: incorrectAnswerList
			}
		});
	} catch (err) {
		res.json({
			success: false,
			err: err
		});
	}
});
router.get('/', async (req, res) => {
	const pagination = req.query.pagination ? parseInt(req.query.pagination) : 10;
	const page = req.query.page ? parseInt(req.query.page) : 1;
	const filter = req.query.brain_game_type ? { 'brain_game_type': req.query.brain_game_type } : {};
	try {
		const questions = await Question.find(filter)
			.populate({ path: 'brain_game_type', model: BrainGameType })
			.sort({ updated_at: 'desc' })
			.skip(pagination * page - pagination)
			.limit(pagination);


		const count = await Question.countDocuments(filter);

		let question_list = [];

		for (const question of questions) {
			let str_answer = '';
			const answers = await Answer.find({ question: question._id });

			answers.forEach(answer => {
				if (str_answer === '') {
					str_answer = answer.answer;
				} else {
					str_answer += ', ' + answer.answer;
				}
			});

			let game_type_name = '';
			if (question.brain_game_type) {
				game_type_name = question.brain_game_type.game_type_name;
			}

			question_list.push({
				_id: question._id,
				question: question.question,
				image: question.image,
				brain_game_type: game_type_name,
				answers: str_answer
			});
		}
		const totalPages = Math.ceil(count / pagination);

		const response = {
			success: true,
			query: req.query,
			total: count,
			questions: question_list,
			pages: totalPages
		};


		res.json(response);
	} catch (err) {
		console.error("Error:", err);
		res.status(500).json({
			success: false,
			error: err.message
		});
	}
});


module.exports = router;
