const express = require('express')
const router = express.Router()
const Author = require('../models/author');
module.exports = router;

router.get('/', async function (req, res, next) {
  try {
    const authors = await Author.findAll();
    return res.json({ authors });
  } catch (err) {
    return next(err);
  }
})

router.get('/:authorId', async function (req, res, next) {
  try {
    const author = await Author.findOne(req.params.authorId);
    return res.json({ author });
  } catch (err) {
    return next(err);
  }
})

router.post('/', async function (req, res, next) {
  try {
    const author = new Author(req.body);
    await author.save();
    return res.status(201).json({ author });
  } catch (err) {
    return next(err);
  }
})

router.get('/:authorId/books', async function (req, res, next) {
  try {
    const author = await Author.findOne(req.params.authorId);
    return res.json({ books: await author.books() });
  } catch (err) {
    return next(err);
  }
})

router.post('/:authorId/books/:bookId', async function (req, res, next) {
  try {
    const author = await Author.findOne(req.params.authorId);
    return res.json({ book: await author.addBook({isbn: req.params.bookId}) });
  } catch (err) {
    return next(err);
  }
})

router.post('/:authorId/books', async function (req, res, next) {
  try {
    const author = await Author.findOne(req.params.authorId);
    return res.json({ book: await author.addBook(req.body) });
  } catch (err) {
    return next(err);
  }
})

router.delete('/:authorId/books/:bookId', async function (req, res, next) {
  try {
    const author = await Author.findOne(req.params.authorId);
    await author.removeBook({ isbn: req.params.bookId });
    return res.json({ book: await author.removeBook({ isbn: req.params.bookId }) });
  } catch (err) {
    return next(err);
  }
})