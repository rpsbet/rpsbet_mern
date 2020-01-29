const express = require('express');

const router = express.Router();

// /api/item call
router.post('/', async (req, res) => {
    let file = req.files.file;

    file.mv('./client/public/img/uploads/' + file.name, function(err) {
        if (err)
            return res.status(500).send(err);

        res.status(200).json({filename: file.name});
    });
});

module.exports = router;