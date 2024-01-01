const db = require('../db')
class Tag {
  constructor({ id, name }) {
    this.id = id
    this.name = name
  }

  static async create({ name }) {
    const result = await db.query(
      `INSERT INTO tags (name) VALUES ($1) RETURNING *`,
      [name]
    )
    return new Tag(result.rows[0])
  }

  static async findAll() {
    const result = await db.query(`SELECT * FROM tags`)
    return result.rows.map(tag => new Tag(tag))
  }

  static async remove(id) {
    const result = await db.query(
      `DELETE FROM tags WHERE id = $1 RETURNING *`,
      [id]
    )
    return new Tag(result.rows[0])
  }

  async books() {
    const result = await db.query(
      `SELECT * FROM books_tags
      JOIN books ON books_tags.book_id = books.isbn
      WHERE books_tags.tag_id = $1`,
      [this.id]
    )
    return result.rows.map(r => new Book(r))
  }

  async save() {
    if (this.id) {
      await db.query(
        `UPDATE tags SET name = $1 WHERE id = $2`,
        [this.name, this.id]
      )
      
    } else {
      const result = await db.query(
        `INSERT INTO tags (name) 
        VALUES ($1) 
        ON CONFLICT (name) DO NOTHING
        RETURNING *`,
        [this.name]
      )
      this.id = result.rows[0].id
    }
  }
}

module.exports = Tag;