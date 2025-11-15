const express = require('express');
const cors = require('cors');
const multer = require('multer');
const dotenv = require('dotenv');
const fs = require('fs');
const { Resend } = require('resend');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Criar pasta de uploads caso não exista
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Multer para uploads PDF
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// INIT RESEND
const resend = new Resend(process.env.RESEND_API_KEY);

// ------------------- ROTAS ----------------------

// Teste
app.get('/', (req, res) => {
  res.send('API funcionando com Resend!');
});

// ---------------- CONTATO -----------------------
app.post('/api/contact', async (req, res) => {
  const { nome, email, mensagem } = req.body;

  if (!nome || !email || !mensagem) {
    return res.status(400).json({ error: 'Preencha todos os campos.' });
  }

  try {
    await resend.emails.send({
      from: 'MD Terceirização <onboarding@resend.dev>',
      to: process.env.EMAIL_TO,
      subject: `📬 Nova mensagem de ${nome}`,
      html: `
        <h1>Nova mensagem de contato</h1>
        <p><strong>Nome:</strong> ${nome}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Mensagem:</strong></p>
        <p>${mensagem.replace(/\n/g, "<br>")}</p>
      `
    });

    res.json({ success: true, message: 'Mensagem enviada com sucesso!' });
  } catch (err) {
    console.error("Erro Resend:", err);
    res.status(500).json({ error: 'Erro ao enviar o email.' });
  }
});

// ---------------- TRABALHE CONOSCO -----------------------
app.post('/api/trabalheconosco', upload.single('curriculo'), async (req, res) => {
  const { nome, email, telefone } = req.body;
  const file = req.file;

  if (!nome || !email || !telefone || !file) {
    return res.status(400).json({ error: 'Preencha todos os campos e envie o currículo.' });
  }

  try {
    const pdfBuffer = fs.readFileSync(file.path);

    await resend.emails.send({
      from: 'MD Terceirização <onboarding@resend.dev>',
      to: process.env.EMAIL_TO,
      subject: `📄 Novo candidato: ${nome}`,
      html: `
        <h1>Novo Currículo Recebido</h1>
        <p><strong>Nome:</strong> ${nome}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Telefone:</strong> ${telefone}</p>
        <p>O currículo segue em anexo.</p>
      `,
      attachments: [
        {
          filename: file.originalname,
          content: pdfBuffer.toString("base64")
        }
      ]
    });

    res.json({ success: true, message: 'Currículo enviado com sucesso!' });
  } catch (err) {
    console.error("Erro Resend:", err);
    res.status(500).json({ error: 'Erro ao enviar o email.' });
  }
});

// ----------------------------------------------

app.listen(process.env.PORT || 10000, () =>
  console.log("Servidor rodando com Resend")
);
