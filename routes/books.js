const express = require("express");
const Book = require("../models/book");
const jsonschema = require('jsonschema')
const router = express.Router();
const validator = new jsonschema.Validator();
const bookSchema = require('../schemas/book.schema.json')
const ExpressError = require("../expressError");
const Tag = require('../models/tag');
/**
 * 
 * @param {jsonschema.Schema} schema 
 * @returns 
 */
function validateBodyMiddleware(schema) {
  /**
   * @param {express.Request} req 
   * @param {express.Response} res
   * @param {express.NextFunction} next
   */
  return async function (req, res, next) {
    const result = validator.validate(req.body, schema) 
    if (result.valid) {
      next(null);
    } else {
      const error = new ExpressError('Invalid body request', 400);
      error.details = result.errors
      return next(error);
    }
  };
}
/** GET / => {books: [book, ...]}  */

router.get("/", async function (req, res, next) {
  try {
    const books = await Book.findAll(req.query);
    return res.json({ books });
  } catch (err) {
    return next(err);
  }
});

/** GET /[id]  => {book: book} */

router.get("/:id", async function (req, res, next) {
  try {
    const book = await Book.findOne(req.params.id);
    return res.json({ book });
  } catch (err) {
    return next(err);
  }
});

/** POST /   bookData => {book: newBook}  */

router.post("/", validateBodyMiddleware(bookSchema), async function (req, res, next) {
  try {
    const book = await Book.create(req.body);
    return res.status(201).json({ book });
  } catch (err) {
    return next(err);
  }
});

/** PUT /[isbn]   bookData => {book: updatedBook}  */

router.put("/:isbn", validateBodyMiddleware({...bookSchema, required: bookSchema.required.filter(r => r !== 'isbn')}), async function (req, res, next) {
  try {
    const book = await Book.update(req.params.isbn, req.body);
    return res.json({ book });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[isbn]   => {message: "Book deleted"} */

router.delete("/:isbn", async function (req, res, next) {
  try {
    await Book.remove(req.params.isbn);
    return res.json({ message: "Book deleted" });
  } catch (err) {
    return next(err);
  }
});

router.patch("/:isbn", async function (req, res, next) {
  try {
    const book = await Book.partialUpdaate(req.params.isbn, req.body);
    return res.json({ book });
  } catch (err) {
    return next(err);
  }
})

router.get('/:isbn/tags', async function (req, res, next) {
  try {
    const book = await Book.findOne(req.params.isbn);
    res.json({ tags: await book.tags() });
    next(null)
  } catch (err) {
    console.log(err)
    next(err)
  }
})

router.post('/:isbn/tags/:tagName', async function (req, res, next) {
  try {
    const book = await Book.findOne(req.params.isbn);
    await book.addTag(new Tag({ name: req.params.tagName }))
    res.json({ result: 'success'  });
    next(null)
  } catch (err) {
    console.log({err})
    next(err)
  }
})

module.exports = router;
