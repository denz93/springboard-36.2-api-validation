CREATE TABLE authors (
  id SERIAL PRIMARY KEY,
  name TEXT
);
CREATE TABLE books (
  isbn TEXT PRIMARY KEY,
  amazon_url TEXT,
  language TEXT, 
  pages INTEGER,
  publisher TEXT,
  title TEXT, 
  year INTEGER,
  author_id INTEGER,
  FOREIGN KEY (author_id) REFERENCES authors(id)
);



CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name TEXT,
  UNIQUE (name)
);

CREATE TABLE books_tags (
  book_id TEXT REFERENCES books(isbn),
  tag_id SERIAL REFERENCES tags(id),
  PRIMARY KEY (book_id, tag_id)
);



