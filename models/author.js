const db = require('../db');
const Book = require('./book');

class Author {
  constructor({ id, name }) {
    this.id = id
    this.name = name
  }
  static async findOne(id) {
    const result = await db.query(`SELECT * FROM authors WHERE id = $1`, [id])
    return new Author(result.rows[0])
  }

  static async findAll() {
    const result = await db.query(`SELECT * FROM authors`)
    return result.rows.map(author => new Author(author))
  }

  static async create({ name }) {
    const result = await db.query(
      `INSERT INTO authors (name) VALUES ($1) RETURNING *`,
      [name]
    )
    return new Author(result.rows[0])
  }

  static async remove(id) {
    const result = await db.query(
      `DELETE FROM authors WHERE id = $1 RETURNING *`,
      [id]
    )
    return new Author(result.rows[0])
  }

  async books() {
    const result = await db.query(
      `SELECT * FROM books WHERE author_id = $1`,
      [this.id]
    )
    return result.rows.map(r => new Book(r))
  }

  /**
   * 
   * @param {Book} book 
   * @returns 
   */
  async addBook(book) {
    const result = await db.query(
      `
        INSERT INTO books (isbn, amazon_url, author_id, language, pages, publisher, title, year)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (isbn) DO UPDATE SET author_id = $3
        RETURNING *
      `,
      [book.isbn, book.amazon_url, this.id, book.language, book.pages, book.publisher, book.title, book.year]
    )
    return new Book(result.rows[0])
  }

  /**
   * 
   * @param {Book} book 
   */
  async removeBook(book) {
    if (book.isbn) {
      const result = await db.query(`
        UPDATE books SET author_id = NULL WHERE isbn = $1 AND author_id = $2
      `, [book.isbn, this.id])
      return result.rowCount > 0
    }
    return true
  }

  async save() {
    if (this.id) {
      const result = await db.query(`
        INSERT INTO authors (name) VALUES ($1) RETURNING *
      `, [this.name])
      this.id = result.rows[0].id
    } else {
      await db.query(`
        UPDATE authors SET name = $1 WHERE id = $2
      `, [this.name, this.id])
    }
  }
}

module.exports = Author