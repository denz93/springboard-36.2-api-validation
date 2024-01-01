const supertest = require('supertest');
const app = require('../app');
const db = require('../db');
const fs = require('node:fs');

beforeAll(async () => {
  await db.query('DROP TABLE IF EXISTS books_tags');
  await db.query('DROP TABLE IF EXISTS books');
  await db.query('DROP TABLE IF EXISTS authors');
  await db.query('DROP TABLE IF EXISTS tags');
  await db.query(fs.readFileSync('data.sql', 'utf-8'));

})
describe('/Authors API', () => {
  const client = supertest(app);
  const sampleAuthors = [
    { id: 1, name: 'Jane Austen' },
    { id: 2, name: 'George Orwell' },
    { id: 3, name: 'Fyodor Dostoevsky' },
    { id: 4, name: 'William Shakespeare' }
  ]
  const sampleBooks = [
    {
      "isbn": "0691161518",
      "amazon_url": "http://a.co/eobPtX2",
      "author_id": null,
      "language": "english",
      "pages": 264,
      "publisher": "Princeton University Press",
      "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
      "year": 2017
    },
    {
      "isbn": "1234567890",
      "amazon_url": "http://a.co/d9PzSbz",
      "author_id": null,
      "language": "english",
      "pages": 279,
      "publisher": "Vintage Classics",
      "title": "Pride and Prejudice",
      "year": 1813
    },
  ]

  beforeEach(async () => {
    await db.query(`DELETE FROM books_tags`)
    await db.query(`DELETE FROM books`)
    await db.query(`DELETE FROM authors`)
    await db.query(`DELETE FROM tags`)
    const authorValues = sampleAuthors.map(author => `(${author.id}, '${author.name}')`).join(',')
    await db.query(`INSERT INTO authors VALUES ${authorValues}`)
    const bookValues = sampleBooks.map(book => `('${book.isbn}', '${book.amazon_url}', ${book.author_id ? book.author_id : 'NULL'}, '${book.language}', ${book.pages}, '${book.publisher}', '${book.title}', ${book.year})`).join(',')
    await db.query(`INSERT INTO books(isbn, amazon_url, author_id, language, pages, publisher, title, year) VALUES ${bookValues}`)
  })

  test('GET /', async () => {
    const res = await client.get('/authors')
    expect(res.status).toBe(200)
    expect(res.body.authors).toHaveLength(4)
    expect(res.body).toMatchObject({
      authors: sampleAuthors
    })
  })

  test('GET /:id', async () => {
    const res = await client.get('/authors/1')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      author: sampleAuthors[0]
    })
  })

  test('POST /authors/:authorId/books/:isbn', async () => {
    const res = await client.post(`/authors/1/books/${sampleBooks[0].isbn}`)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      book: {
        ...sampleBooks[0],
        author_id: 1
      }
    })
  })
})