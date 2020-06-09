const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const sendgrid = require('../helper/sendgrid');

const Receipt = require('../model/Receipt');

const stripe = require('stripe')('sk_test_K5M4s7GThvVc9agmF34w3RuM00cTsYB54b');

router.post('/secret', auth, async (req, res) => {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: req.body.amount * 100,
            currency: 'gbp',
            // Verify your integration in this guide by including this parameter
            metadata: {integration_check: 'accept_a_payment'},
        });

        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret
        });
    } catch (err) {
        res.json({
            success: false,
            message: err
        });
    }
});

router.post('/deposit_successed', auth, async (req, res) => {
    try {
        req.user.balance += req.body.amount * 100;
        await req.user.save();

        const receipt = new Receipt({
            user_id: req.user._id,
            payment_method: req.body.payment_method,
            payment_type: 'Deposit',
            amount: req.body.amount * 100,
        });
        await receipt.save();

        sendgrid.sendReceiptEmail(req.user.email, req.user.username, "receipt_" + receipt._id, req.body.amount);

        res.json({
            success: true,
            balance: req.user.balance
        });
    } catch (err) {
        res.json({
            success: false,
            message: err
        });
    }
});

router.post('/withdraw_request', auth, async (req, res) => {
    try {
        const receipt = new Receipt({
            user_id: req.user._id,
            email: req.body.email,
            payment_method: req.body.payment_method,
            payment_type: 'Withdraw',
            amount: req.body.amount * 100,
        });
        await receipt.save();

        sendgrid.sendWithdrawEmail(req.user.email, req.user.username, "receipt_" + receipt._id, req.body.amount);
        res.json({
            success: true,
            message: ''
        });
    } catch (e) {
        res.json({
            success: false,
            message: err
        });
    }
});

module.exports = router;
