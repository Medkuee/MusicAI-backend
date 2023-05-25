const { PrismaClient } = require("@prisma/client")
const express = require("express")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const prisma = new PrismaClient()
const app = express()

app.use(express.json())

function findUserByToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, "secret-key", (err, decoded) => {
      if (err) {
        reject(err)
      } else {
        const userId = decoded.userId
        resolve(userId)
      }
    })
  })
}

app.post(`/signup`, async (req, res) => {
  const { email, password, name } = req.body
  if (!email || !password) {
    return res.status(401).json({ message: "Invalid email or password" })
  }
  const hashedPassword = await bcrypt.hash(password, 10)

  const result = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
    },
  })
  res.json(result)
})

app.post("/login", async (req, res) => {
  const { email, password } = req.body

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" })
  }

  const isPasswordValid = await bcrypt.compare(password, user.password)
  if (!isPasswordValid) {
    return res.status(401).json({ message: "password" })
  }

  const token = jwt.sign({ userId: user.id }, "secret-key", {
    expiresIn: "7d",
  })
  res.json({ token })
})

app.get("/getusers", async (req, res) => {
  const user = await prisma.user.findMany({})

  res.json({ user })
})

app.get("/profile", async (req, res) => {
  const token = req.headers.authorization.split(" ")[1] // assuming the token is sent as a Bearer token
  try {
    const userId = await findUserByToken(token)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        music: {
          orderBy: { createdAt: "desc" },
        },
      },
    })
    res.json(user)
  } catch (err) {
    res.status(401).json({ error: "Invalid token" })
  }
})
app.post("/createMusic", async (req, res) => {
  const token = req.headers.authorization.split(" ")[1] // assuming the token is sent as a Bearer token
  try {
    const { data } = req.body
    console.log("data", data)
    const userId = await findUserByToken(token)
    const music = await prisma.music.create({
      data: { userId: userId, notes: data },
    })
    res.json(music)
  } catch (err) {
    res.status(401).json({ error: "Invalid token" })
  }
})

app.get("/music/:id", async (req, res) => {
  const { id } = req.params
  console.log("id", id)
  const token = req.headers.authorization.split(" ")[1] // assuming the token is sent as a Bearer token
  try {
    const userId = await findUserByToken(token)
    const music = await prisma.music.findUnique({
      where: { id: parseInt(id) },
    })
    res.json(music)
  } catch (err) {
    res.status(401).json({ error: "Invalid token" })
  }
})

const server = app.listen(3000, () =>
  console.log(`
🚀 Server ready at: http://localhost:3000`),
)
