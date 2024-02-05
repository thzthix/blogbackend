const dummy = (blogs) => {
  return 1
}
const totalLikes = (blogs) => {
  const reducer = (sum, item) => {
    return sum + item.likes
  }
  return blogs.reduce(reducer, 0)
}
const maxLikes = (blogs) => {
  const max = blogs.reduce(
    (prev, current) => (prev.likes > current.likes ? prev : current),
    0
  )
  return max
}

const maxBlogs = (blogs) => {
  const freqs = blogs.reduce((accObj, blog) => {
    if (!accObj[blog.author]) {
      accObj[blog.author] = 1
    } else {
      accObj[blog.author] += 1
    }
    return accObj
  }, {})
  const max = Math.max(...Object.values(freqs))
  for (const author in freqs) {
    if (freqs[author] === max) {
      return {
        author,
        blogs: freqs[author],
      }
    }
  }
}
module.exports = {
  dummy,
  totalLikes,
  maxLikes,
  maxBlogs,
}
