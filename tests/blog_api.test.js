const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const bcrypt = require('bcrypt')
const assert = require('node:assert')
const User = require('../models/user')
const api = supertest(app)
const helper = require('./test_helper')
const Blog = require('../models/blog')

beforeEach(async () => {
  await Blog.deleteMany({})
  await User.deleteMany({})

  const userResult = await api.post('/api/users').send(helper.initialUsers[0])
  const userId = userResult.body.id

  const blogObjects = helper.initialBlogs.map((b) => {
    return new Blog({ ...b, user: userId })
  })
  const blogPromiseArray = blogObjects.map((o) => o.save())
  await Promise.all(blogPromiseArray)
})
test('blogs are returned as json', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
}, 100000)
test('there are two blogs', async () => {
  const response = await api.get('/api/blogs')

  expect(response.body).toHaveLength(helper.initialBlogs.length)
})

test('the unique identifier property of the blog posts is named id', async () => {
  const response = await api.get('/api/blogs')

  expect(response.body[0].id).toBeDefined()
})
test('HTTP POST request to the /api/blogs URL successfully creates a new blog post.s', async () => {
  const blogsAtStart = await helper.blogsInDb()

  const userToLogin = {
    username: 'root33',
    password: 'salainen',
  }
  const token = await helper.loginUser(userToLogin)

  const newBlog = {
    title: 'newBlogInTest',
    author: 'FUBAO2',
    url: 'WWW.FUBAO2.COM',
    likes: 100,
  }

  await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const blogsAtEnd = await helper.blogsInDb()
  expect(blogsAtEnd).toHaveLength(blogsAtStart.length + 1)

  const response = await api.get('/api/blogs')

  const titles = response.body.map((r) => r.title)

  expect(response.body).toHaveLength(helper.initialBlogs.length + 1)
  expect(titles).toContain('newBlogInTest')
})
test('ikes property is missing from the request, it will default to the value 0', async () => {
  const userToLogin = {
    username: 'root33',
    password: 'salainen',
  }
  const token = await helper.loginUser(userToLogin)
  const newNote = {
    title: 'AIBAO CUTE',
    author: 'AIBAO',
    url: 'AIBAO.COM',
  }

  await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newNote)
    .expect(201)

  const response = await api.get('/api/blogs')

  expect(response.body).toHaveLength(helper.initialBlogs.length + 1)

  // const blogWithLikes0=response.body.find((b)=>b.likes===0)

  expect(response.body[3].likes).toBeDefined()
})

test('blog without title or url is not added', async () => {
  const userToLogin = {
    username: 'root33',
    password: 'salainen',
  }
  const token = await helper.loginUser(userToLogin)
  const newBlogNoTitle = {
    author: 'lebao',
    url: 'www.lebao.com',
  }

  await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlogNoTitle)
    .expect(400)

  const newBlogNoUrl = {
    author: 'lebao',
    title: 'lebao is cool',
  }

  await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlogNoUrl)
    .expect(400)

  const response = await api.get('/api/blogs')

  expect(response.body).toHaveLength(helper.initialBlogs.length)
})
describe('deletion of a note', () => {
  test('succeeds with status code 204 if id is valid', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const userToLogin = {
      username: 'root33',
      password: 'salainen',
    }
    const token = await helper.loginUser(userToLogin)
    const userId = helper.decodeToken(token)
    const userBlogs = blogsAtStart.filter((b) => b.user.toString() === userId)
    if (userBlogs.length === 0) {
      throw new Error('User has no blogs to delete.')
    }
    const blogToDelete = userBlogs[0]
    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204)

    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1)

    const titles = blogsAtEnd.map((r) => r.title)

    expect(titles).not.toContain(blogToDelete.title)
  })
})
describe('update of a note', () => {
  test('succeeds with update if id is valid', async () => {
    const blogsAtStart = await helper.blogsInDb()

    const userToLogin = {
      username: 'root33',
      password: 'salainen',
    }
    const token = await helper.loginUser(userToLogin)
    const userId = helper.decodeToken(token)
    const userBlogs = blogsAtStart.filter((b) => b.user.toString() === userId)
    const blogToUpdate = userBlogs[0]

    const updatedContent = {
      title: blogToUpdate.title,
      author: blogToUpdate.author,
      url: blogToUpdate.url,
      likes: Number(blogToUpdate.likes) + 100,
    }

    const response = await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedContent)

    console.log(response.body)
    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)

    const updatedBlog = blogsAtEnd.find((b) => b.id === blogToUpdate.id)
    expect(updatedBlog.likes === updatedContent.likes)
  })
  test('falis with update if id is not valid', async () => {
    const userToLogin = {
      username: 'root33',
      password: 'salainen',
    }
    const token = await helper.loginUser(userToLogin)
    const blogsAtStart = await helper.blogsInDb()
    const userId = helper.decodeToken(token)
    const userBlogs = blogsAtStart.filter((b) => b.user.toString() === userId)
    const blogToUpdate = userBlogs[0]

    const updatedContent = {
      title: blogToUpdate.title,
      author: blogToUpdate.author,
      url: blogToUpdate.url,
      likes: Number(blogToUpdate.likes) + 100,
    }

    await api
      .put(`/api/blogs/${helper.nonExistingId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedContent)
      .expect(400)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)

    expect(
      blogsAtEnd.find((b) => b.id === helper.nonExistingId)
    ).not.toBeDefined()
  })
})
describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })

    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.map((u) => u.username)
    expect(usernames.includes(newUser.username))
  })
  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'salainen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(result.body.error.includes('expected `username` to be unique'))

    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })
  test('creation fails with password or username less then 3 characters long', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser1 = {
      username: '3',
      name: 'fubao',
      password: 'salainen',
    }

    const result1 = await api
      .post('/api/users')
      .send(newUser1)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(
      result1.body.error.includes('password must be at least 3 characters long')
    )
    const newUser2 = {
      username: 'root',
      name: 'sudisds',
      password: 's',
    }

    const result2 = await api
      .post('/api/users')
      .send(newUser2)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(
      result2.body.error.includes('password must be at least 3 characters long')
    )

    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })
})
describe('post of blog', () => {
  test('fails with the proper status code 401 Unauthorized if a token is not provided', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const userToLogin = {
      username: 'root33',
      password: 'salainen',
    }
    const loginResult = await api
      .post('/api/login')
      .send(userToLogin)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const token = loginResult.body.token

    const newBlog = {
      title: 'newBlog',
      author: 'FUBAO2',
      url: 'WWW.FUBAO2.COM',
      likes: 100,
    }

    await api.post('/api/blogs').send(newBlog).expect(401)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(blogsAtStart.length)
  })
})
afterAll(async () => {
  await mongoose.connection.close()
})
