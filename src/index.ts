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
app.use(logger('[:date[clf]] :method :url :status :response-time ms - :res[content-length]'));
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"]
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
    const { original, translated, timestamp, sessionId } = req.body;
    const session = await prisma.session.findUniqueOrThrow({
      where: { id: sessionId }
    });

    const data = {
      original,
      translated,
      timestamp,
      sessionId
    }
    const createResult = await prisma.transcript.create({
      data,
    })
    const result = { name: session.name, sourceLang: session.sourceLang, targetLang: session.targetLang, ...createResult };
    io.emit("update", result);
    res.json(result)
  }
  catch (e) {
    res.status(500)
    console.log(e)
    res.json({ error: e })
  }
})

app.get("/socket", async (req, res) => {
  io.emit("update", "test");
  res.json("result")
})

app.get("/export", async (req, res) => {
  const transcripts = await prisma.transcript.findMany()
  const sessions = await prisma.session.findMany();
  const mergedTranscripts = transcripts.map(t => {
    const session = sessions.find(s => s.id === t.sessionId);
    return { name: session?.name, sourceLang: session?.sourceLang, targetLang: session?.targetLang, ...t };

  })

  let csvData = ["name", "timestamp", "original", "translated", "sourceLang", "targetLang"].join(";") + "\r\n";
  mergedTranscripts.forEach((session) => {
    // populating the CSV content
    // and converting the null fields to ""
    csvData += [session.name, session.timestamp, session.original, session.translated, session.sourceLang, session?.targetLang].join(";") + "\r\n";
  })


  res
    .set({
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="export.csv"`,
    }).send(csvData)


})

app.get(`/full-transcript`, async (req, res) => {
  try {
    const transcripts = await prisma.transcript.findMany()
    const sessions = await prisma.session.findMany();
    const mergedTranscripts = transcripts.map(t => {
      const session = sessions.find(s => s.id === t.sessionId);
      return { name: session?.name, sourceLang: session?.sourceLang, targetLang: session?.targetLang, ...t };

    })
    res.json(mergedTranscripts);
  }
  catch (e) {
    res.status(500);
    console.log(e)
    res.json({ error: e })
  }
})

app.get(`/transcribe`, async (req, res) => {
  try {
    const result = await prisma.transcript.findMany()
    res.json(result)
  }
  catch (e) {
    res.status(500);
    console.log(e)
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
    res.status(500);
    console.log(e)
    res.json({ error: e })
  }
})

app.delete(`/transcribe/:id`, async (req, res) => {
  try {
    const result = await prisma.transcript.delete({
      where: { id: Number(req.params.id) },
    })
    res.json(result);
  }
  catch (e) {
    res.status(500);
    console.log(e)
    res.json({ error: e })
  }
})


app.post(`/session`, async (req, res) => {
  try {
    const { sourceLang, targetLang, name } = req.body;
    const data = {
      sourceLang,
      targetLang,
      name
    }
    const result = await prisma.session.create({
      data,
    })
    res.json(result)
  }
  catch (e) {
    res.status(500)
    console.log(e)
    res.json({ error: e })
  }
})

app.get(`/session/:id`, async (req, res) => {
  try {
    const result = await prisma.session.delete({
      where: { id: req.params.id }
    })
    res.json(result);
  }
  catch (e) {
    res.status(500);
    console.log(e)
    res.json({ error: e })
  }
})


app.get("/session", async (req, res) => {
  try {
    const result = await prisma.session.findMany()
    res.json(result)
  }
  catch (e) {
    res.status(500);
    console.log(e)
    res.json({ error: e })
  }
})


app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.message || err);
  console.error(err.stack)
  res.status(err.status || 500);
  res.send({
    result: false,
    message: err.message
  });
});


server.listen(3000, () => console.log("listening for sockets on 3000"))
