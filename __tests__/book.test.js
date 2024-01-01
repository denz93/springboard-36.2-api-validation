const supertest = require('supertest');
const app = require('../app')
const db = require('../db')
const fs = require('node:fs');
afterAll(async () => {
  await db.end()
})
describe("/Books API", () => {
  const client = supertest(app);
  const sampleAuthors = [
    {id: 1, name: 'Jane Austen'},
    {id: 2, name: 'George Orwell'},
    {id: 3, name: 'Fyodor Dostoevsky'},
    {id: 4, name: 'William Shakespeare'},
  ];
  const sampleBooks = [
    {
      "isbn": "0691161518",
      "amazon_url": "http://a.co/eobPtX2",
      "author_id": 1,
      "language": "english",
      "pages": 264,
      "publisher": "Princeton University Press",
      "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
      "year": 2017
    },
    {
      "isbn": "1234567890",
      "amazon_url": "http://a.co/d9PzSbz",
      "author_id": 2,
      "language": "english",
      "pages": 279,
      "publisher": "Vintage Classics",
      "title": "Pride and Prejudice",
      "year": 1813
    },
    {
      "isbn": "0987654321",
      "amazon_url": "http://a.co/4f56ExR",
      "author_id": 3,
      "language": "english",
      "pages": 328,
      "publisher": "Signet Classics",
      "title": "1984",
      "year": 1949
    },
    {
      "isbn": "1122334455",
      "amazon_url": "http://a.co/hd8g5Jd",
      "author_id": 4,
      "language": "english",
      "pages": 1216,
      "publisher": "Mariner Books",
      "title": "The Lord of the Rings",
      "year": 1954
    }
  ]

  beforeAll(async () => {
    await db.query('DROP TABLE IF EXISTS books_tags')
    await db.query('DROP TABLE IF EXISTS books')
    await db.query('DROP TABLE IF EXISTS authors')
    await db.query('DROP TABLE IF EXISTS tags')
    await db.query(fs.readFileSync('data.sql', 'utf-8'))
  }, 2000)

  beforeEach(async () => { 
    await db.query('DELETE FROM books_tags')
    await db.query('DELETE FROM books')
    await db.query('DELETE FROM authors')
    await db.query('DELETE FROM tags')
    const authorValues = sampleAuthors.map(author => `('${author.id}', '${author.name}')`).join(',\n')
    await db.query(`
      INSERT INTO authors (id, name)
      VALUES ${authorValues}
    `)
    const bookValues = sampleBooks.map(book => `('${book.isbn}', '${book.amazon_url}', ${book.author_id}, '${book.language}', ${book.pages}, '${book.publisher}', '${book.title}', ${book.year})`).join(',\n')
    await db.query(`
      INSERT INTO books (isbn, amazon_url, author_id, language, pages, publisher, title, year)
      VALUES ${bookValues}
    `)

  }, 2000)
  
  test('GET /', async () => {
    const res = await client.get('/books')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({books: expect.arrayContaining(sampleBooks)})
  })
  test('GET /:id', async () => {
    const res = await client.get(`/books/${sampleBooks[0].isbn}`)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({book: sampleBooks[0]})
  })

  test('POST /', async () => {
    const newBook = {
      "isbn": "9876543210", // Ensure the ISBN is unique
      "amazon_url": "http://a.co/uniqueBookUrl",
      "author_id": 2,
      "language": "english",
      "pages": 635,
      "publisher": "Penguin Classics",
      "title": "Moby Dick",
      "year": 1851
    }
        
    const res = await client.post('/books').send(newBook)
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({book: newBook})

    const res2 = await client.post(`/books`).send({...newBook, isbn: undefined})
    expect(res2.status).toBe(400)
    expect(res2.body).toMatchObject({
      message: 'Invalid body request', 
      error: {
        details: expect.arrayContaining([
          expect.objectContaining({message: 'requires property "isbn"'})
        ])
      }
  })

    const res3 = await client.post(`/books`).send({pages: "123"})
    expect(res3.status).toBe(400)
    expect(res3.body).toMatchObject({
      message: 'Invalid body request',
      error: {
        details: expect.arrayContaining([
          expect.objectContaining({message: 'is not of a type(s) integer'})
        ])
      }
    })
  })


  test('PUT /:isbn', async () => {
    const newBook = {...sampleBooks[0]}
    newBook.amazon_url += 'updated'
    newBook.author_id += 1
    newBook.language += 'updated'
    newBook.pages += 1
    newBook.publisher += 'updated'
    newBook.title += 'updated'
    newBook.year += 1
    let res = await client.put(`/books/${newBook.isbn}`).send(newBook)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({book: newBook})
    res = await client.get(`/books/${newBook.isbn}`)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({book: newBook})

    let res2 = await client.put(`/books/${newBook.isbn}`).send({...newBook, title: undefined, isbn: undefined})
    expect(res2.status).toBe(400)
    expect(res2.body).toMatchObject({
      message: 'Invalid body request', 
      error: {
        details: expect.arrayContaining([
          expect.objectContaining({message: 'requires property "title"'})
        ])
      }
    })

  })

  test('DELETE /:isbn', async () => {
    const res = await client.delete(`/books/${sampleBooks[0].isbn}`)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({message: 'Book deleted'})
    const res2 = await client.get(`/books/${sampleBooks[0].isbn}`)
    expect(res2.status).toBe(404)
  })

  test('PATCH /:isbn', async () => {
    const res = await client.patch(`/books/${sampleBooks[0].isbn}`).send({pages: 100})
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({book: {...sampleBooks[0], pages: 100}})
    const res2 = await client.get(`/books/${sampleBooks[0].isbn}`)
    expect(res2.status).toBe(200)
    expect(res2.body).toMatchObject({book: {...sampleBooks[0], pages: 100}})
  })

  test('GET /:isbn/tags', async () => {
    const res = await client.get(`/books/${sampleBooks[0].isbn}/tags`)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({tags: []})
  })

  test('POST /:isbn/tags', async () => {
    const res = await client.post(`/books/${sampleBooks[0].isbn}/tags/fiction`)
    expect(res.status).toBe(200)
    const res2 = await client.get(`/books/${sampleBooks[0].isbn}/tags`)
    expect(res2.status).toBe(200)
    expect(res2.body).toMatchObject({tags: [{name: 'fiction'}]})
  })
})