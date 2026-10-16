require("dotenv").config()
const { PrismaClient } = require("@prisma/client")
const express = require("express")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  console.error("JWT_SECRET is not set. Copy .env.example to .env and set it.")
  process.exit(1)
}

const MAX_NOTES = 100

const prisma = new PrismaClient()
const app = express()

app.use(express.json())

function findUserByToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        reject(err)
      } else {
        const userId = decoded.userId
        resolve(userId)
      }
    })
  })
}

// Expects "Authorization: Bearer <token>", returns null if missing or malformed
function getToken(req) {
  const header = req.headers.authorization
  if (typeof header !== "string") return null
  const [scheme, token] = header.split(" ")
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) return null
  return token
}

// Never send the password hash back to the client
function withoutPassword(user) {
  const { password, ...rest } = user
  return rest
}

// Notes recorded on the mobile piano screen:
// note = piano key index (0-87), duration in seconds, startTime in ms
function isValidNotes(notes) {
  if (!Array.isArray(notes) || notes.length === 0 || notes.length > MAX_NOTES) {
    return false
  }
  return notes.every(
    n =>
      n !== null &&
      typeof n === "object" &&
      Number.isInteger(n.note) &&
      n.note >= 0 &&
      n.note <= 87 &&
      Number.isFinite(n.duration) &&
      n.duration >= 0 &&
      Number.isFinite(n.startTime) &&
      n.startTime >= 0 &&
      (n.noteValue === undefined || typeof n.noteValue === "string"),
  )
}

app.post(`/signup`, async (req, res) => {
  const { email, password, name } = req.body
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email ||
    !password
  ) {
    return res.status(401).json({ message: "Invalid email or password" })
  }
  if (name !== undefined && name !== null && typeof name !== "string") {
    return res.status(400).json({ message: "Invalid name" })
  }
  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    const result = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    })
    res.json(withoutPassword(result))
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ message: "Email is already registered" })
    }
    console.error(err)
    res.status(500).json({ message: "Could not create user" })
  }
})

app.post("/login", async (req, res) => {
  const { email, password } = req.body
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(401).json({ message: "Invalid email or password" })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.password) {
    return res.status(401).json({ message: "Invalid email or password" })
  }

  const isPasswordValid = await bcrypt.compare(password, user.password)
  if (!isPasswordValid) {
    return res.status(401).json({ message: "Invalid email or password" })
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
    expiresIn: "7d",
  })
  res.json({ token })
})

app.get("/profile", async (req, res) => {
  const token = getToken(req)
  if (!token) {
    return res.status(401).json({ error: "Invalid token" })
  }
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
    if (!user) {
      return res.status(401).json({ error: "Invalid token" })
    }
    res.json(withoutPassword(user))
  } catch (err) {
    res.status(401).json({ error: "Invalid token" })
  }
})
app.post("/createMusic", async (req, res) => {
  const token = getToken(req)
  if (!token) {
    return res.status(401).json({ error: "Invalid token" })
  }
  try {
    const { data } = req.body
    console.log("data", data)
    const userId = await findUserByToken(token)
    if (!isValidNotes(data)) {
      return res.status(400).json({ error: "Invalid notes" })
    }
    const notes = data.map(({ note, noteValue, duration, startTime }) => ({
      note,
      noteValue,
      duration,
      startTime,
    }))
    const music = await prisma.music.create({
      data: { userId: userId, notes },
    })
    res.json(music)
  } catch (err) {
    res.status(401).json({ error: "Invalid token" })
  }
})

app.get("/music/:id", async (req, res) => {
  const { id } = req.params
  console.log("id", id)
  const token = getToken(req)
  if (!token) {
    return res.status(401).json({ error: "Invalid token" })
  }
  try {
    const userId = await findUserByToken(token)
    const musicId = Number(id)
    if (!Number.isInteger(musicId) || musicId <= 0) {
      return res.status(400).json({ error: "Invalid music id" })
    }
    // Only return music that belongs to the logged in user
    const music = await prisma.music.findFirst({
      where: { id: musicId, userId },
    })
    if (!music) {
      return res.status(404).json({ error: "Music not found" })
    }
    res.json(music)
  } catch (err) {
    res.status(401).json({ error: "Invalid token" })
  }
})

const server = app.listen(3000, () =>
  console.log(`
🚀 Server ready at: http://localhost:3000`),
)
