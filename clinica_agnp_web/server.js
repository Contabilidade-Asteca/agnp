const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = path.join(__dirname, 'data.json');

function readData() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data || '{}');
  } catch (err) {
    return {
      nextIds: { professional: 1, client: 1, procedure: 1, receipt: 1 },
      professionals: [],
      clients: [],
      procedures: [],
      receipts: []
    };
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function getProfessionalByName(name, data) {
  return data.professionals.find((p) => p.nome.toLowerCase() === name.toLowerCase());
}

function enrichProcedure(procedure, data) {
  const client = data.clients.find((c) => c.id === procedure.clienteId);
  const professional = data.professionals.find((p) => p.id === procedure.profissionalId);
  return {
    ...procedure,
    clientName: client ? client.nome : '',
    professionalName: professional ? professional.nome : ''
  };
}

function enrichReceipt(receipt, data) {
  const procedure = data.procedures.find((p) => p.id === receipt.procedureId);
  if (!procedure) return null;
  const client = data.clients.find((c) => c.id === procedure.clienteId);
  const professional = data.professionals.find((p) => p.id === receipt.professionalId);
  return {
    ...receipt,
    procedureName: procedure.procedimento,
    procedureTipo: procedure.tipo,
    procedureDate: procedure.data,
    clientName: client ? client.nome : '',
    professionalName: professional ? professional.nome : receipt.profissionalNome
  };
}

app.get('/api/professionals', (req, res) => {
  const data = readData();
  res.json(data.professionals);
});

app.post('/api/professionals', (req, res) => {
  const data = readData();
  const id = data.nextIds.professional++;
  const professional = { id, nome: req.body.nome, crm: req.body.crm };
  data.professionals.push(professional);
  writeData(data);
  res.json(professional);
});

app.put('/api/professionals/:id', (req, res) => {
  const data = readData();
  const id = parseInt(req.params.id, 10);
  const prof = data.professionals.find((p) => p.id === id);
  if (!prof) return res.status(404).json({ error: 'Profissional não encontrado' });
  prof.nome = req.body.nome;
  prof.crm = req.body.crm;
  writeData(data);
  res.json(prof);
});

app.get('/api/clients', (req, res) => {
  const data = readData();
  res.json(data.clients);
});

app.post('/api/clients', (req, res) => {
  const data = readData();
  const id = data.nextIds.client++;
  const client = {
    id,
    nome: req.body.nome,
    cpf: req.body.cpf,
    telefone: req.body.telefone,
    nascimento: req.body.nascimento
  };
  data.clients.push(client);
  writeData(data);
  res.json(client);
});

app.put('/api/clients/:id', (req, res) => {
  const data = readData();
  const id = parseInt(req.params.id, 10);
  const cli = data.clients.find((c) => c.id === id);
  if (!cli) return res.status(404).json({ error: 'Cliente não encontrado' });
  cli.nome = req.body.nome;
  cli.cpf = req.body.cpf;
  cli.telefone = req.body.telefone;
  cli.nascimento = req.body.nascimento;
  writeData(data);
  res.json(cli);
});

app.get('/api/procedures', (req, res) => {
  const data = readData();
  res.json(data.procedures.map((procedure) => enrichProcedure(procedure, data)));
});

app.post('/api/procedures', (req, res) => {
  const data = readData();
  const id = data.nextIds.procedure++;
  const { tipo, clienteId, profissionalId, procedimento, valor } = req.body;
  const dateStr = new Date().toISOString();

  const v = parseFloat(valor);
  let valorAgnes = 0;
  let valorNeisy = 0;
  let rateioDescricao = '';

  if (tipo === 'MAQUINA') {
    valorAgnes = v * 0.5;
    valorNeisy = v * 0.5;
    rateioDescricao = '50% Agnes / 50% Neisy';
  } else if (tipo === 'NEISY') {
    valorAgnes = v * 0.5;
    valorNeisy = v + v * 0.5;
    rateioDescricao = '1ª parcela 100% Neisy + 2ª parcela 50% Agnes / 50% Neisy';
  }

  const procedure = {
    id,
    tipo,
    clienteId,
    profissionalId,
    procedimento,
    valor: v,
    data: dateStr,
    valorAgnes,
    valorNeisy,
    rateioDescricao
  };

  data.procedures.push(procedure);

  if (tipo === 'MAQUINA') {
    const agnesProf = getProfessionalByName('Agnes', data);
    const neisyProf = getProfessionalByName('Neisy', data);

    if (agnesProf) {
      data.receipts.push({
        id: data.nextIds.receipt++,
        procedureId: id,
        professionalId: agnesProf.id,
        profissionalNome: agnesProf.nome,
        valor: valorAgnes,
        parcela: 'Única',
        status: 'Pendente',
        descricao: 'Recibo da profissional Agnes (50%).'
      });
    }

    if (neisyProf) {
      data.receipts.push({
        id: data.nextIds.receipt++,
        procedureId: id,
        professionalId: neisyProf.id,
        profissionalNome: neisyProf.nome,
        valor: valorNeisy,
        parcela: 'Única',
        status: 'Pendente',
        descricao: 'Recibo da profissional Neisy (50%).'
      });
    }
  }

  if (tipo === 'NEISY') {
    const neisyProf = getProfessionalByName('Neisy', data);
    if (neisyProf) {
      data.receipts.push({
        id: data.nextIds.receipt++,
        procedureId: id,
        professionalId: neisyProf.id,
        profissionalNome: neisyProf.nome,
        valor: valorNeisy,
        parcela: '1ª + 2ª',
        status: 'Pendente',
        descricao: 'Recibo único da Neisy (1ª parcela integral + 50% da 2ª parcela).'
      });
    }
  }

  writeData(data);
  res.json(enrichProcedure(procedure, data));
});

app.get('/api/receipts', (req, res) => {
  const data = readData();
  const enriched = data.receipts.map((receipt) => enrichReceipt(receipt, data)).filter(Boolean);
  res.json(enriched);
});

app.put('/api/receipts/:id', (req, res) => {
  const data = readData();
  const id = parseInt(req.params.id, 10);
  const rec = data.receipts.find((r) => r.id === id);
  if (!rec) return res.status(404).json({ error: 'Recibo não encontrado' });
  rec.status = req.body.status || rec.status;
  writeData(data);
  res.json(rec);
});

function escapePdfText(text) {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function buildSimplePdf(lines) {
  const textCommands = lines
    .map((line, index) => `1 0 0 1 50 ${780 - index * 20} Tm (${escapePdfText(line)}) Tj`)
    .join('\n');

  const stream = `BT\n/F1 12 Tf\n${textCommands}\nET`;
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj',
    `4 0 obj << /Length ${Buffer.byteLength(stream, 'utf8')} >> stream\n${stream}\nendstream endobj`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj'
  ];

  let offset = 9;
  const body = objects.map((obj) => {
    const current = offset;
    offset += Buffer.byteLength(obj + '\n', 'utf8');
    return { current, obj };
  });

  const xrefStart = offset;
  const xref = ['xref', `0 ${objects.length + 1}`, '0000000000 65535 f ']
    .concat(body.map((entry) => `${String(entry.current).padStart(10, '0')} 00000 n `))
    .join('\n');

  const trailer = `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  const pdf = ['%PDF-1.4', ...body.map((b) => b.obj), xref, trailer].join('\n') + '\n';
  return Buffer.from(pdf, 'utf8');
}

app.get('/api/receipts/:id/pdf', (req, res) => {
  const data = readData();
  const id = parseInt(req.params.id, 10);
  const receipt = data.receipts.find((r) => r.id === id);
  if (!receipt) return res.status(404).json({ error: 'Recibo não encontrado' });

  const enriched = enrichReceipt(receipt, data);
  if (!enriched) return res.status(404).json({ error: 'Dados do procedimento não encontrados' });

  const lines = [
    'Recibo - Clinica AGNP',
    `Recibo: #${enriched.id}`,
    `Data de emissao: ${new Date().toLocaleDateString('pt-BR')}`,
    `Status: ${enriched.status}`,
    '-------------------------------',
    `Tipo: ${enriched.procedureTipo}`,
    `Procedimento: ${enriched.procedureName}`,
    `Cliente: ${enriched.clientName}`,
    `Profissional: ${enriched.professionalName}`,
    `Parcela: ${enriched.parcela || 'Unica'}`,
    `Valor: R$ ${Number(enriched.valor).toFixed(2)}`,
    `Descricao: ${enriched.descricao || '-'}`,
    `Data procedimento: ${new Date(enriched.procedureDate).toLocaleString('pt-BR')}`,
    'Assinatura: ____________________________'
  ];

  const pdf = buildSimplePdf(lines);
  const fileName = `recibo_${enriched.id}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
  res.send(pdf);
});

app.get('/api/summary', (req, res) => {
  const data = readData();
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  let total = 0;
  const income = {};
  const proceduresByType = { MAQUINA: 0, NEISY: 0 };

  data.procedures.forEach((proc) => {
    const procDate = new Date(proc.data);
    if (procDate.getMonth() === month && procDate.getFullYear() === year) {
      total += proc.valor;
      proceduresByType[proc.tipo] = (proceduresByType[proc.tipo] || 0) + proc.valor;
      income.Agnes = (income.Agnes || 0) + proc.valorAgnes;
      income.Neisy = (income.Neisy || 0) + proc.valorNeisy;
    }
  });

  res.json({
    total,
    month,
    year,
    income,
    proceduresByType
  });
});

app.listen(PORT, () => {
  console.log('Servidor rodando na porta', PORT);
});
