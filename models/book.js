const db = require("../db");
const Tag = require('./tag')

/** Collection of related methods for books. */

class Book {
  /**
   * 
   * @param {Object} params
   * @param {string} params.isbn
   * @param {string} params.amazon_url
   * @param {number} params.author_id
   * @param {string} params.language
   * @param {number} params.pages
   * @param {string} params.publisher
   * @param {string} params.title
   * @param {number} params.year
   */
  constructor({ isbn, amazon_url, author_id, language, pages, publisher, title, year }) {
    this.isbn = isbn
    this.amazon_url = amazon_url
    this.author_id = author_id
    this.language = language
    this.pages = pages
    this.publisher = publisher
    this.title = title
    this.year = year
  }

  /** given an isbn, return book data with that isbn:
   *
   * => {isbn, amazon_url, author, language, pages, publisher, title, year}
   *
   **/

  static async findOne(isbn) {
    const bookRes = await db.query(
        `SELECT isbn,
                amazon_url,
                author_id,
                language,
                pages,
                publisher,
                title,
                year
            FROM books 
            WHERE isbn = $1`, [isbn]);

    if (bookRes.rows.length === 0) {
      throw { message: `There is no book with an isbn '${isbn}`, status: 404 }
    }

    return new Book(bookRes.rows[0]);
  }

  /** Return array of book data:
   *
   * => [ {isbn, amazon_url, author, language,
   *       pages, publisher, title, year}, ... ]
   *
   * */

  static async findAll() {
    const booksRes = await db.query(
        `SELECT isbn,
                amazon_url,
                author_id,
                language,
                pages,
                publisher,
                title,
                year
            FROM books 
            ORDER BY title`);

    return booksRes.rows.map(r => new Book(r));
  }

  /** create book in database from data, return book data:
   *
   * {isbn, amazon_url, author, language, pages, publisher, title, year}
   *
   * => {isbn, amazon_url, author, language, pages, publisher, title, year}
   *
   * */

  static async create(data) {
    const result = await db.query(
      `INSERT INTO books (
            isbn,
            amazon_url,
            author_id,
            language,
            pages,
            publisher,
            title,
            year) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING isbn,
                   amazon_url,
                   author_id,
                   language,
                   pages,
                   publisher,
                   title,
                   year`,
      [
        data.isbn,
        data.amazon_url,
        data.author_id??null,
        data.language,
        data.pages,
        data.publisher,
        data.title,
        data.year
      ]
    );

    return new Book(result.rows[0]);
  }

  /** Update data with matching ID to data, return updated book.

   * {isbn, amazon_url, author, language, pages, publisher, title, year}
   *
   * => {isbn, amazon_url, author, language, pages, publisher, title, year}
   *
   * */

  static async update(isbn, data) {
    const result = await db.query(
      `UPDATE books SET 
            amazon_url=($1),
            author_id=($2),
            language=($3),
            pages=($4),
            publisher=($5),
            title=($6),
            year=($7)
            WHERE isbn=$8
        RETURNING isbn,
                  amazon_url,
                  author_id,
                  language,
                  pages,
                  publisher,
                  title,
                  year`,
      [
        data.amazon_url,
        data.author_id,
        data.language,
        data.pages,
        data.publisher,
        data.title,
        data.year,
        isbn
      ]
    );

    if (result.rows.length === 0) {
      throw { message: `There is no book with an isbn '${isbn}`, status: 404 }
    }

    return new Book(result.rows[0]);
  }

  /** remove book with matching isbn. Returns undefined. */

  static async remove(isbn) {
    const result = await db.query(
      `DELETE FROM books 
         WHERE isbn = $1 
         RETURNING isbn`,
        [isbn]);

    if (result.rows.length === 0) {
      throw { message: `There is no book with an isbn '${isbn}`, status: 404 }
    }
  }

  static async partialUpdaate(isbn, data) {
    const keys = Object.keys(data);
    const setString = keys
      .map((key, index) => `"${key}"=($${index + 1})`)
      .join(", ");
    const result = await db.query(`
      UPDATE books SET ${setString}
      WHERE isbn = $${keys.length + 1}
      RETURNING *
    `, [...keys.map((key) => data[key]), isbn]);
    return new Book(result.rows[0]);
  }

  async tags() {
    const result = await db.query(
      `SELECT tags.*
       FROM tags
       JOIN books_tags ON books_tags.tag_id = tags.id
       WHERE books_tags.book_id = $1
       ORDER BY tags.name`,
      [this.isbn]
    );
    return result.rows.map(r => new Tag(r));
  }

  /**
   * 
   * @param {Tag} tag 
   * @returns 
   */
  async addTag(tag) {
    if (!tag.id) {
      await tag.save()
    }
    const result = await db.query(
      `
        INSERT INTO books_tags (book_id, tag_id)
        VALUES ($1, $2)
        ON CONFLICT (book_id, tag_id) DO NOTHING
      `,
      [this.isbn, tag.id]
    );
    return true
  }
}


module.exports = Book;
