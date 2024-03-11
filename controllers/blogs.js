const blogsRouter = require('express').Router()
const jwt = require('jsonwebtoken')
const Blog = require('../models/blog')
const User = require('../models/user')
const middleware = require('../utils/middleware')
blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', {
    username: 1,
    name: 1,
    id: 1,
  })
  response.json(blogs)
})

blogsRouter.get('/:id', async (request, response, next) => {
  try {
    const blog = await Blog.findById(request.params.id).populate('user', {
      username: 1,
      name: 1,
      id: 1,
    })

    if (blog) {
      response.json(blog)
    } else {
      response.status(404).end()
    }
  } catch (error) {
    next(error)
  }
})

blogsRouter.post('/', middleware.userExtractor, async (request, response) => {
  const body = request.body

  const user = request.user

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes || 0,
    user: user.id,
  })

  const savedBlog = await blog.save()
  user.blogs = user.blogs.concat(savedBlog._id)
  await user.save()
  response.status(201).json(savedBlog)
})
blogsRouter.delete(
  '/:id',
  middleware.userExtractor,
  async (request, response) => {
    const user = request.user
    if (!user) {
      return response.status(401).json({ error: 'token invalid' })
    }
    const blog = await Blog.findById(request.params.id)
    if (blog.user.toString() === user._id.toString()) {
      await Blog.findByIdAndDelete(request.params.id)
      user.blogs = user.blogs.filter((b) => b.id !== request.params.id)
      await user.save()
      response.status(204).end()
    } else {
      return response.status(401).json({ error: 'only creater can delete' })
    }
  }
)
blogsRouter.put(
  '/:id',
  middleware.userExtractor,
  async (request, response, next) => {
    const { title, author, url, likes } = request.body
    const user = request.user
    if (!user) {
      return response.status(401).json({ error: 'token invalid' })
    }

    const blog = {
      ...(title && { title }),
      ...(author && { author }),
      ...(url && { url }),
      ...(likes && { likes }),
    }

    try {
      const savedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, {
        new: true,
      }).orFail()
      response.json(savedBlog)
    } catch (error) {
      response.status(400).json({ error: 'invalid id' })
    }
  }
)
module.exports = blogsRouter
