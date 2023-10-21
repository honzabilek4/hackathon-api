import { Prisma, PrismaClient } from '@prisma/client';
import express, { Request, Response, NextFunction } from 'express';
const { Server } = require('socket.io');
const { createServer } = require('node:http');

const prisma = new PrismaClient();
const app = express();
const logger = require('morgan');
const cors = require('cors');
app.use(express.json())
app.use(cors());
// app.use(logger('[:date[clf]] :method :url :status :response-time ms - :res[content-length]'));
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST","OPTIONS"]
  }
});

// Socket.io connection handling
io.on('connection', (socket: any) => {
  // console.log('A client connected');
  socket.on("update", (data: any) => {
    console.log("socket:" + data);
    socket.emit(data)
  })
  // Handle client disconnection
  // socket.on('disconnect', () => {
  //   console.log('A client disconnected');
  // });
});

app.post(`/transcribe`, async (req, res) => {
  try {
    const { original, translated, timestamp } = req.body;
    const data = {
      original,
      translated,
      timestamp
    }    
    const result = await prisma.transcript.create({
      data,
    })      
    io.emit("update", result);
    res.json(result)
  }
  catch (e) {
    res.json({ error: e })
  }
})

app.get("/socket", async (req,res)=>{
  io.emit("update", "test");
  res.json("result")
})

app.get(`/transcribe`, async (req, res) => {
  try {
    const result = await prisma.transcript.findMany()
    res.json(result)
  }
  catch (e) {
    res.json({ error: e })
  }
})

app.put(`/transcribe/:id`, async (req, res) => {
  try {
    const { original, translated } = req.body;
    const result = await prisma.transcript.update({
      where: { id: Number(req.params.id) },
      data: {
        original,
        translated
      }
    });
    res.json(result)
  }
  catch (e) {
    res.json({ error: e })
  }
})

app.delete(`/transcribe/:id`, async (req, res)=>{
  try{
    const result = await prisma.transcript.delete({
      where: {id: Number(req.params.id)},
    })
    res.json(result);
  }
  catch(e){
    res.json({ error: e })
  }
})


// app.post(`/signup`, async (req, res) => {
//   const { name, email, posts } = req.body

//   const postData = posts?.map((post: Prisma.PostCreateInput) => {
//     return { title: post?.title, content: post?.content }
//   })

//   const result = await prisma.user.create({
//     data: {
//       name,
//       email,
//       posts: {
//         create: postData,
//       },
//     },
//   })
//   res.json(result)
// })

// app.post(`/post`, async (req, res) => {
//   const { title, content, authorEmail } = req.body
//   const result = await prisma.post.create({
//     data: {
//       title,
//       content,
//       author: { connect: { email: authorEmail } },
//     },
//   })
//   res.json(result)
// })

// app.put('/post/:id/views', async (req, res) => {
//   const { id } = req.params

//   try {
//     const post = await prisma.post.update({
//       where: { id: Number(id) },
//       data: {
//         viewCount: {
//           increment: 1,
//         },
//       },
//     })

//     res.json(post)
//   } catch (error) {
//     res.json({ error: `Post with ID ${id} does not exist in the database` })
//   }
// })

// app.put('/publish/:id', async (req, res) => {
//   const { id } = req.params

//   try {
//     const postData = await prisma.post.findUnique({
//       where: { id: Number(id) },
//       select: {
//         published: true,
//       },
//     })

//     const updatedPost = await prisma.post.update({
//       where: { id: Number(id) || undefined },
//       data: { published: !postData?.published },
//     })
//     res.json(updatedPost)
//   } catch (error) {
//     res.json({ error: `Post with ID ${id} does not exist in the database` })
//   }
// })

// app.delete(`/post/:id`, async (req, res) => {
//   const { id } = req.params
//   const post = await prisma.post.delete({
//     where: {
//       id: Number(id),
//     },
//   })
//   res.json(post)
// })

// app.get('/users', async (req, res) => {
//   const users = await prisma.user.findMany()
//   res.json(users)
// })

// app.get('/user/:id/drafts', async (req, res) => {
//   const { id } = req.params

//   const drafts = await prisma.user
//     .findUnique({
//       where: {
//         id: Number(id),
//       },
//     })
//     .posts({
//       where: { published: false },
//     })

//   res.json(drafts)
// })

// app.get(`/post/:id`, async (req, res) => {
//   const { id }: { id?: string } = req.params

//   const post = await prisma.post.findUnique({
//     where: { id: Number(id) },
//   })
//   res.json(post)
// })

// app.get('/feed', async (req, res) => {
//   const { searchString, skip, take, orderBy } = req.query

//   const or: Prisma.PostWhereInput = searchString
//     ? {
//       OR: [
//         { title: { contains: searchString as string } },
//         { content: { contains: searchString as string } },
//       ],
//     }
//     : {}

//   const posts = await prisma.post.findMany({
//     where: {
//       published: true,
//       ...or,
//     },
//     include: { author: true },
//     take: Number(take) || undefined,
//     skip: Number(skip) || undefined,
//     orderBy: {
//       updatedAt: orderBy as Prisma.SortOrder,
//     },
//   })

//   res.json(posts)
// })

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.message || err);
  console.error(err.stack)
  res.status(err.status || 500);
  res.send({
    result: false,
    message: err.message
  });
});

// app.listen(3000, () => console.log(`🚀 Server ready at: http://localhost:3000`))
server.listen(3000,()=> console.log("listening for sockets on 3000"))
