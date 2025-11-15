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

// Criar pasta uploads se não existir
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Configuração do Multer para PDFs
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Resend API
const resend = new Resend(process.env.RESEND_API_KEY);

// ------------------------------------------------------------
// ROTA TESTE
// ------------------------------------------------------------
app.get('/', (req, res) => {
  res.send('API funcionando com Resend!');
});

// ------------------------------------------------------------
// FORMULÁRIO DE CONTATO
// ------------------------------------------------------------
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
        <div style="font-family: Arial, sans-serif; background:#f5f6fa; padding: 30px;">
          <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.12);">

            <div style="background:#111827;padding:25px;text-align:center;border-bottom:4px solid #fbbf24;">
              <h1 style="color:#fbbf24;margin:0;font-size:26px;">📬 Novo Contato Recebido</h1>
              <p style="color:#e5e7eb;margin:5px 0 0;font-size:14px;">
                Formulário de contato do site MD Terceirização
              </p>
            </div>

            <div style="padding:30px;color:#111827;font-size:15px;line-height:1.6;">
              <h2 style="margin-top:0;color:#1f2937;font-size:20px;">Informações do Contato</h2>

              <div style="background:#fef3c7;border-left:6px solid #fbbf24;padding:15px;border-radius:6px;">
                <p style="margin:6px 0;"><strong>👤 Nome:</strong> ${nome}</p>
                <p style="margin:6px 0;"><strong>📧 Email:</strong> ${email}</p>
              </div>

              <h2 style="margin:25px 0 10px;color:#1f2937;font-size:20px;">Mensagem</h2>

              <div style="background:#f9fafb;border:1px solid #e5e7eb;padding:20px;border-radius:8px;">
                ${mensagem.replace(/\n/g, "<br>")}
              </div>
            </div>

            <div style="text-align:center;background:#f3f4f6;padding:15px;color:#6b7280;font-size:13px;">
              <p style="margin:3px 0;">Email enviado automaticamente pelo site <strong>MD Terceirização</strong>.</p>
              <p style="margin:3px 0;">Atendimento corporativo · Profissionalismo · Segurança</p>
            </div>

          </div>
        </div>
      `
    });

    res.json({ success: true, message: 'Mensagem enviada com sucesso!' });
  } catch (err) {
    console.error("Erro Resend:", err);
    res.status(500).json({ error: 'Erro ao enviar o email.' });
  }
});

// ------------------------------------------------------------
// FORMULÁRIO TRABALHE CONOSCO
// ------------------------------------------------------------
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
        <div style="font-family: Arial, sans-serif; background:#f5f6fa; padding: 30px;">
          <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.12);">

            <div style="background:#111827;padding:25px;text-align:center;border-bottom:4px solid #3b82f6;">
              <h1 style="color:#3b82f6;margin:0;font-size:26px;">📄 Novo Currículo Recebido</h1>
              <p style="color:#e5e7eb;margin:5px 0 0;font-size:14px;">Processo seletivo MD Terceirização</p>
            </div>

            <div style="padding:30px;color:#111827;font-size:15px;line-height:1.6;">
              <h2 style="margin-top:0;color:#1f2937;font-size:20px;">Dados do Candidato</h2>

              <div style="background:#dbeafe;border-left:6px solid #3b82f6;padding:15px;border-radius:6px;">
                <p style="margin:6px 0;"><strong>👤 Nome:</strong> ${nome}</p>
                <p style="margin:6px 0;"><strong>📧 Email:</strong> ${email}</p>
                <p style="margin:6px 0;"><strong>📱 Telefone:</strong> ${telefone}</p>
              </div>

              <h2 style="margin:25px 0 12px;color:#1f2937;font-size:20px;">Currículo em anexo</h2>

              <div style="background:#f9fafb;border:1px solid #e5e7eb;padding:20px;border-radius:8px;">
                ✔ O currículo em PDF foi anexado a este e-mail.<br>
                ✔ Arquivo recebido com sucesso<br>
                ✔ Formato: PDF
              </div>
            </div>

            <div style="text-align:center;background:#f3f4f6;padding:15px;color:#6b7280;font-size:13px;">
              <p style="margin:3px 0;">Mensagem enviada automaticamente pelo site <strong>MD Terceirização</strong>.</p>
              <p style="margin:3px 0;">Profissionais qualificados · Processos seletivos</p>
            </div>

          </div>
        </div>
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

// ------------------------------------------------------------
// START SERVER
// ------------------------------------------------------------
app.listen(process.env.PORT || 10000, () =>
  console.log("Servidor rodando com Resend")
);
