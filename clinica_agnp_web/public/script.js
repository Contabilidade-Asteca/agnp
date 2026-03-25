document.addEventListener('DOMContentLoaded', () => {
  // navigation
  const pages = {
    profissionais: document.getElementById('page-profissionais'),
    clientes: document.getElementById('page-clientes'),
    procedimentos: document.getElementById('page-procedimentos'),
    recibos: document.getElementById('page-recibos'),
    resumo: document.getElementById('page-resumo')
  };
  const navButtons = {
    profissionais: document.getElementById('nav-profissionais'),
    clientes: document.getElementById('nav-clientes'),
    procedimentos: document.getElementById('nav-procedimentos'),
    recibos: document.getElementById('nav-recibos'),
    resumo: document.getElementById('nav-resumo')
  };
  function showPage(name) {
    Object.keys(pages).forEach(key => {
      pages[key].classList.toggle('active', key === name);
      navButtons[key].classList.toggle('active', key === name);
    });
    if (name === 'profissionais') loadProfessionals();
    if (name === 'clientes') loadClients();
    if (name === 'procedimentos') {
      loadProcedures();
      loadClientsDropdown();
      loadProfessionalsDropdown();
    }
    if (name === 'recibos') loadReceipts();
    if (name === 'resumo') loadSummary();
  }
  navButtons.profissionais.addEventListener('click', () => showPage('profissionais'));
  navButtons.clientes.addEventListener('click', () => showPage('clientes'));
  navButtons.procedimentos.addEventListener('click', () => showPage('procedimentos'));
  navButtons.recibos.addEventListener('click', () => showPage('recibos'));
  navButtons.resumo.addEventListener('click', () => showPage('resumo'));

  // load initial page
  showPage('profissionais');

  // Professional CRUD
  const profIdInput = document.getElementById('prof-id');
  const profNomeInput = document.getElementById('prof-nome');
  const profCrmInput = document.getElementById('prof-crm');
  const profSalvarBtn = document.getElementById('prof-salvar');
  const tableProf = document.getElementById('table-profissionais').querySelector('tbody');
  let editingProf = false;
  profSalvarBtn.addEventListener('click', async () => {
    const nome = profNomeInput.value.trim();
    const crm = profCrmInput.value.trim();
    if (!nome || !crm) { alert('Preencha todos os campos'); return; }
    if (editingProf) {
      const id = profIdInput.value;
      await fetch(`/api/professionals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, crm })
      });
    } else {
      await fetch('/api/professionals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, crm })
      });
    }
    profNomeInput.value = '';
    profCrmInput.value = '';
    profIdInput.value = '';
    editingProf = false;
    profSalvarBtn.textContent = 'Salvar';
    loadProfessionals();
    loadProfessionalsDropdown();
  });

  async function loadProfessionals() {
    const res = await fetch('/api/professionals');
    const professionals = await res.json();
    tableProf.innerHTML = '';
    professionals.forEach(prof => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${prof.nome}</td>
        <td>${prof.crm}</td>
        <td>
          <button class="edit-prof" data-id="${prof.id}">Editar</button>
        </td>
      `;
      tableProf.appendChild(tr);
    });
    // attach listeners for edit
    document.querySelectorAll('.edit-prof').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const res = await fetch('/api/professionals');
        const professionals = await res.json();
        const prof = professionals.find(p => p.id == id);
        profIdInput.value = prof.id;
        profNomeInput.value = prof.nome;
        profCrmInput.value = prof.crm;
        editingProf = true;
        profSalvarBtn.textContent = 'Atualizar';
        showPage('profissionais');
      });
    });
  }

  async function loadProfessionalsDropdown() {
    const select = document.getElementById('proc-profissional');
    const res = await fetch('/api/professionals');
    const professionals = await res.json();
    select.innerHTML = '';
    professionals.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.nome;
      select.appendChild(opt);
    });
  }

  // Client CRUD
  const cliIdInput = document.getElementById('cli-id');
  const cliNomeInput = document.getElementById('cli-nome');
  const cliCpfInput = document.getElementById('cli-cpf');
  const cliTelInput = document.getElementById('cli-telefone');
  const cliNascInput = document.getElementById('cli-nascimento');
  const cliSalvarBtn = document.getElementById('cli-salvar');
  const tableCli = document.getElementById('table-clientes').querySelector('tbody');
  let editingCli = false;
  cliSalvarBtn.addEventListener('click', async () => {
    const nome = cliNomeInput.value.trim();
    const cpf = cliCpfInput.value.trim();
    const telefone = cliTelInput.value.trim();
    const nascimento = cliNascInput.value;
    if (!nome || !cpf || !telefone || !nascimento) { alert('Preencha todos os campos'); return; }
    if (editingCli) {
      const id = cliIdInput.value;
      await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, cpf, telefone, nascimento })
      });
    } else {
      await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, cpf, telefone, nascimento })
      });
    }
    cliNomeInput.value = '';
    cliCpfInput.value = '';
    cliTelInput.value = '';
    cliNascInput.value = '';
    cliIdInput.value = '';
    editingCli = false;
    cliSalvarBtn.textContent = 'Salvar';
    loadClients();
    loadClientsDropdown();
  });

  async function loadClients() {
    const res = await fetch('/api/clients');
    const clients = await res.json();
    tableCli.innerHTML = '';
    clients.forEach(cli => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${cli.nome}</td>
        <td>${cli.cpf}</td>
        <td>${cli.telefone}</td>
        <td>${cli.nascimento}</td>
        <td><button class="edit-cli" data-id="${cli.id}">Editar</button></td>
      `;
      tableCli.appendChild(tr);
    });
    document.querySelectorAll('.edit-cli').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const res = await fetch('/api/clients');
        const clients = await res.json();
        const cli = clients.find(c => c.id == id);
        cliIdInput.value = cli.id;
        cliNomeInput.value = cli.nome;
        cliCpfInput.value = cli.cpf;
        cliTelInput.value = cli.telefone;
        cliNascInput.value = cli.nascimento;
        editingCli = true;
        cliSalvarBtn.textContent = 'Atualizar';
        showPage('clientes');
      });
    });
  }

  async function loadClientsDropdown() {
    const select = document.getElementById('proc-cliente');
    const res = await fetch('/api/clients');
    const clients = await res.json();
    select.innerHTML = '';
    clients.forEach(cli => {
      const opt = document.createElement('option');
      opt.value = cli.id;
      opt.textContent = cli.nome;
      select.appendChild(opt);
    });
  }

  // Procedure operations
  const procSalvarBtn = document.getElementById('proc-salvar');
  procSalvarBtn.addEventListener('click', async () => {
    const tipo = document.getElementById('proc-tipo').value;
    const clienteId = parseInt(document.getElementById('proc-cliente').value);
    const profissionalId = parseInt(document.getElementById('proc-profissional').value);
    const procedimento = document.getElementById('proc-nome').value.trim();
    const valorStr = document.getElementById('proc-valor').value;
    const valor = parseFloat(valorStr);
    if (!tipo || !clienteId || !profissionalId || !procedimento || isNaN(valor)) {
      alert('Preencha todos os campos');
      return;
    }
    await fetch('/api/procedures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, clienteId, profissionalId, procedimento, valor })
    });
    document.getElementById('proc-nome').value = '';
    document.getElementById('proc-valor').value = '';
    loadProcedures();
    loadReceipts();
    loadSummary();
  });

  async function loadProcedures() {
    const res = await fetch('/api/procedures');
    const procedures = await res.json();
    const table = document.getElementById('table-procedimentos').querySelector('tbody');
    table.innerHTML = '';
    for (const proc of procedures) {
      // look up names
      const clientRes = await fetch('/api/clients');
      const clientsList = await clientRes.json();
      const client = clientsList.find(c => c.id === proc.clienteId);
      const profRes = await fetch('/api/professionals');
      const profsList = await profRes.json();
      const prof = profsList.find(p => p.id === proc.profissionalId);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${proc.id}</td>
        <td>${proc.tipo}</td>
        <td>${client ? client.nome : ''}</td>
        <td>${proc.procedimento}</td>
        <td>${proc.valor.toFixed(2)}</td>
        <td>${proc.valorAgnes.toFixed(2)}</td>
        <td>${proc.valorNeisy.toFixed(2)}</td>
        <td>${new Date(proc.data).toLocaleString()}</td>
      `;
      table.appendChild(tr);
    }
  }

  // Receipts operations
  async function loadReceipts() {
    const res = await fetch('/api/receipts');
    const receipts = await res.json();
    const table = document.getElementById('table-recibos').querySelector('tbody');
    table.innerHTML = '';
    receipts.forEach(rec => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${rec.id}</td>
        <td>${rec.procedureName}</td>
        <td>${rec.clientName}</td>
        <td>${rec.professionalName}</td>
        <td>${rec.valor.toFixed(2)}</td>
        <td>${rec.parcela ? rec.parcela : '-'}</td>
        <td>${rec.status}</td>
        <td>
          ${rec.status !== 'Emitido' ? `<button class="emit-rec" data-id="${rec.id}">Emitir</button>` : ''}
        </td>
      `;
      table.appendChild(tr);
    });
    // attach emit actions
    document.querySelectorAll('.emit-rec').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        await fetch(`/api/receipts/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Emitido' })
        });
        loadReceipts();
      });
    });
  }

  // Summary
  async function loadSummary() {
    const res = await fetch('/api/summary');
    const summary = await res.json();
    document.getElementById('resumo-total').textContent = summary.total.toFixed(2);
    const ul = document.getElementById('resumo-lista');
    ul.innerHTML = '';
    Object.keys(summary.income).forEach(prof => {
      const li = document.createElement('li');
      li.textContent = `${prof}: ${summary.income[prof].toFixed(2)}`;
      ul.appendChild(li);
    });
  }
});
