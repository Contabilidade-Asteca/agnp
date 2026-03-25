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
    return { nextIds: { professional: 1, client: 1, procedure: 1, receipt: 1 }, professionals: [], clients: [], procedures: [], receipts: [] };
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function getProfessionalByName(name, data) {
  return data.professionals.find(p => p.nome.toLowerCase() === name.toLowerCase());
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
  const id = parseInt(req.params.id);
  const prof = data.professionals.find(p => p.id === id);
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
  const client = { id, nome: req.body.nome, cpf: req.body.cpf, telefone: req.body.telefone, nascimento: req.body.nascimento };
  data.clients.push(client);
  writeData(data);
  res.json(client);
});

app.put('/api/clients/:id', (req, res) => {
  const data = readData();
  const id = parseInt(req.params.id);
  const cli = data.clients.find(c => c.id === id);
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
  res.json(data.procedures);
});

app.post('/api/procedures', (req, res) => {
  const data = readData();
  const id = data.nextIds.procedure++;
  const { tipo, clienteId, profissionalId, procedimento, valor } = req.body;
  const dateStr = new Date().toISOString();
  // compute splitted values
  let valorAgnes = 0;
  let valorNeisy = 0;
  const v = parseFloat(valor);
  if (tipo === 'MAQUINA') {
    valorAgnes = v * 0.5;
    valorNeisy = v * 0.5;
  } else if (tipo === 'NEISY') {
    valorAgnes = v * 0.5;
    valorNeisy = v + (v * 0.5);
  }
  const procedure = { id, tipo, clienteId, profissionalId, procedimento, valor: v, data: dateStr, valorAgnes, valorNeisy };
  data.procedures.push(procedure);
  // create receipts
  if (tipo === 'MAQUINA') {
    // receipts for Agnes and Neisy
    const agnesProf = getProfessionalByName('Agnes', data);
    const neisyProf = getProfessionalByName('Neisy', data);
    if (agnesProf) {
      const rid = data.nextIds.receipt++;
      data.receipts.push({
        id: rid,
        procedureId: id,
        professionalId: agnesProf.id,
        profissionalNome: agnesProf.nome,
        valor: v * 0.5,
        parcela: null,
        status: 'Pendente'
      });
    }
    if (neisyProf) {
      const rid2 = data.nextIds.receipt++;
      data.receipts.push({
        id: rid2,
        procedureId: id,
        professionalId: neisyProf.id,
        profissionalNome: neisyProf.nome,
        valor: v * 0.5,
        parcela: null,
        status: 'Pendente'
      });
    }
  } else if (tipo === 'NEISY') {
    const neisyProf = getProfessionalByName('Neisy', data);
    if (neisyProf) {
      // parcela 1: 100% to Neisy
      const rid1 = data.nextIds.receipt++;
      data.receipts.push({
        id: rid1,
        procedureId: id,
        professionalId: neisyProf.id,
        profissionalNome: neisyProf.nome,
        valor: v,
        parcela: 1,
        status: 'Pendente'
      });
      // parcela 2: 50% to Agnes and 50% to Neisy; we only generate receipt for Neisy
      const rid2 = data.nextIds.receipt++;
      data.receipts.push({
        id: rid2,
        procedureId: id,
        professionalId: neisyProf.id,
        profissionalNome: neisyProf.nome,
        valor: v * 0.5,
        parcela: 2,
        status: 'Pendente'
      });
    }
  }
  writeData(data);
  res.json(procedure);
});

app.get('/api/receipts', (req, res) => {
  const data = readData();
  // also include procedure info and client/professional name for convenience
  const enriched = data.receipts.map(rec => {
    const procedure = data.procedures.find(p => p.id === rec.procedureId);
    const client = data.clients.find(c => c.id === procedure.clienteId);
    const professional = data.professionals.find(p => p.id === rec.professionalId);
    return {
      ...rec,
      procedureName: procedure.procedimento,
      procedureTipo: procedure.tipo,
      clientName: client ? client.nome : '',
      professionalName: professional ? professional.nome : rec.profissionalNome
    };
  });
  res.json(enriched);
});

app.put('/api/receipts/:id', (req, res) => {
  const data = readData();
  const id = parseInt(req.params.id);
  const rec = data.receipts.find(r => r.id === id);
  if (!rec) return res.status(404).json({ error: 'Recibo não encontrado' });
  rec.status = req.body.status || rec.status;
  writeData(data);
  res.json(rec);
});

app.get('/api/summary', (req, res) => {
  const data = readData();
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  let total = 0;
  const income = {};
  data.procedures.forEach(proc => {
    const procDate = new Date(proc.data);
    if (procDate.getMonth() === month && procDate.getFullYear() === year) {
      total += proc.valor;
      // accumulate incomes
      const agnesName = 'Agnes';
      const neisyName = 'Neisy';
      if (proc.tipo === 'MAQUINA') {
        income[agnesName] = (income[agnesName] || 0) + proc.valor * 0.5;
        income[neisyName] = (income[neisyName] || 0) + proc.valor * 0.5;
      } else if (proc.tipo === 'NEISY') {
        income[agnesName] = (income[agnesName] || 0) + proc.valor * 0.5;
        income[neisyName] = (income[neisyName] || 0) + (proc.valor + proc.valor * 0.5);
      } else {
        const prof = data.professionals.find(p => p.id === proc.profissionalId);
        if (prof) income[prof.nome] = (income[prof.nome] || 0) + proc.valor;
      }
    }
  });
  res.json({ total, income });
});

app.listen(PORT, () => {
  console.log('Servidor rodando na porta', PORT);
});
