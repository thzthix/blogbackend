const Blog = require('../models/blog')
const User = require('../models/user')
const supertest = require('supertest')
const jwt = require('jsonwebtoken')
const app = require('../app')
const api = supertest(app)

const initialBlogs = [
  {
    _id: '5a422a851b54a676234d17f7',
    title: 'React patterns',
    author: 'Michael Chan',
    url: 'https://reactpatterns.com/',
    likes: 7,
    __v: 0,
  },
  {
    _id: '5a422aa71b54a676234d17f8',
    title: 'Go To Statement Considered Harmful',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
    likes: 5,
    __v: 0,
  },
  {
    _id: '5a422b3a1b54a676234d17f9',
    title: 'Canonical string reduction',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
    likes: 12,
    __v: 0,
  },
]
const initialUsers = [
  {
    username: 'root33',
    name: 'fubao',
    password: 'salainen',
  },
]
const nonExistingId = async () => {
  const blog = new Blog({
    title: 'willremovethissoon',
    url: 'remove.com',
    author: 'remover',
  })
  await blog.save()
  await blog.deleteOne()

  return blog._id.toString()
}

const blogsInDb = async () => {
  const blogs = await Blog.find({})
  return blogs.map((blog) => blog.toJSON())
}
const usersInDb = async () => {
  const users = await User.find({})
  return users.map((u) => u.toJSON())
}
const loginUser = async (user) => {
  const loginResult = await api
    .post('/api/login')
    .send(user)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  return loginResult.body.token
}
const decodeToken = (token) => {
  const decodedToken = jwt.verify(token, process.env.SECRET)
  return decodedToken.id
}
const getUserById = async (id) => {
  const user = await User.findById(id)
  return user
}
module.exports = {
  initialBlogs,
  initialUsers,
  nonExistingId,
  blogsInDb,
  usersInDb,
  loginUser,
  decodeToken,
  getUserById,
}
