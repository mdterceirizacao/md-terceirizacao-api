const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const multer = require('multer');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Criar pasta uploads caso não exista
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Configuração de upload (para currículo PDF)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// -------------------------------------------------------------
//  CONFIGURAÇÃO CORRETA PARA GMAIL + APP PASSWORD (Render OK)
// -------------------------------------------------------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
// -------------------------------------------------------------

// ---------------------- ROTAS ---------------------- //

// Rota teste
app.get('/', (req, res) => {
  res.send('API funcionando!');
});

// Formulário de Contato
app.post('/api/contact', async (req, res) => {
  const { nome, email, mensagem } = req.body;

  if (!nome || !email || !mensagem) {
    return res.status(400).json({ error: 'Preencha todos os campos.' });
  }

  try {
    await transporter.sendMail({
      from: `"Formulário de Contato" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `📬 Nova mensagem de ${nome}`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color:#f5f5f5; padding:30px;">
          <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:12px; 
          overflow:hidden; box-shadow:0 4px 18px rgba(0,0,0,0.12); border: 1px solid #e0e0e0;">

            <div style="background:linear-gradient(135deg, #1f2937, #000000); padding:25px 20px; color:#fbbf24; text-align:center;">
              <h1 style="margin:0; font-size:26px;">📬 Nova Mensagem Recebida</h1>
              <p style="margin:0; margin-top:6px; font-size:14px; color:#fef3c7;">
                Você recebeu um novo contato através do site.
              </p>
            </div>

            <div style="padding:25px 30px; color:#111827;">
              <h2 style="font-size:20px; margin-bottom:15px; color:#1f2937;">Informações do Remetente</h2>

              <div style="background:#fef3c7; border-left:6px solid #fbbf24; padding:15px 18px; border-radius:6px; margin-bottom:25px;">
                <p style="margin:5px 0;"><strong>👤 Nome:</strong> ${nome}</p>
                <p style="margin:5px 0;"><strong>📧 Email:</strong> ${email}</p>
              </div>

              <h2 style="font-size:20px; margin-bottom:12px; color:#1f2937;">Mensagem</h2>

              <div style="background:#f9fafb; border:1px solid #e5e7eb; padding:20px; border-radius:8px; font-size:15px; 
              line-height:1.6; white-space:pre-line;">
                ${mensagem}
              </div>

              <div style="margin-top:35px; text-align:center; color:#6b7280; font-size:13px;">
                <hr style="border:none; border-top:1px solid #e5e7eb; margin:25px 0;">
                <p style="margin:0;">Mensagem enviada automaticamente pelo site <strong>MD Terceirização</strong>.</p>
                <p style="margin:0;">🎯 Atendimento corporativo · Segurança · Profissionalismo</p>
              </div>
            </div>

          </div>
        </div>
      `
    });

    res.json({ success: true, message: 'Mensagem enviada com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao enviar o email.' });
  }
});

// Formulário Trabalhe Conosco
app.post('/api/trabalheconosco', upload.single('curriculo'), async (req, res) => {
  const { nome, email, telefone } = req.body;
  const file = req.file;

  if (!nome || !email || !telefone || !file) {
    return res.status(400).json({ error: 'Preencha todos os campos e anexe o currículo.' });
  }

  try {
    await transporter.sendMail({
      from: `"Trabalhe Conosco" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `📄 Novo candidato: ${nome}`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color:#f5f5f5; padding:30px;">
          <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:12px; 
          overflow:hidden; box-shadow:0 4px 18px rgba(0,0,0,0.12); border: 1px solid #e0e0e0;">

            <div style="background:linear-gradient(135deg, #1f2937, #000000); padding:25px 20px; color:#fbbf24; text-align:center;">
              <h1 style="margin:0; font-size:26px;">📄 Novo Envio de Currículo</h1>
              <p style="margin:0; margin-top:6px; font-size:14px; color:#fef3c7;">Um candidato enviou um currículo através do site.</p>
            </div>

            <div style="padding:25px 30px; color:#111827;">
              <h2 style="font-size:20px; margin-bottom:15px; color:#1f2937;">Dados do Candidato</h2>

              <div style="background:#fef3c7; border-left:6px solid #fbbf24; padding:15px 18px; border-radius:6px; margin-bottom:25px;">
                <p style="margin:5px 0;"><strong>👤 Nome:</strong> ${nome}</p>
                <p style="margin:5px 0;"><strong>📧 Email:</strong> ${email}</p>
                <p style="margin:5px 0;"><strong>📱 Telefone:</strong> ${telefone}</p>
              </div>

              <h2 style="font-size:20px; margin-bottom:12px; color:#1f2937;">Currículo</h2>

              <div style="background:#f9fafb; border:1px solid #e5e7eb; padding:20px; border-radius:8px; font-size:15px;">
                O currículo em PDF foi anexado a este e-mail.<br><br>
                ✔ Arquivo recebido com sucesso<br>
                ✔ Formato: PDF
              </div>

              <div style="margin-top:35px; text-align:center; color:#6b7280; font-size:13px;">
                <hr style="border:none; border-top:1px solid #e5e7eb; margin:25px 0;">
                <p style="margin:0;">Mensagem enviada automaticamente pelo site <strong>MD Terceirização</strong>.</p>
                <p style="margin:0;">🏢 Processos seletivos · Profissionais qualificados</p>
              </div>
            </div>

          </div>
        </div>
      `,
      attachments: [
        {
          filename: file.originalname,
          path: file.path
        }
      ]
    });

    res.json({ success: true, message: 'Currículo enviado com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao enviar o email.' });
  }
});

// --------------------------------------------------- //

app.listen(process.env.PORT || 3000, () =>
  console.log("Servidor rodando")
);
