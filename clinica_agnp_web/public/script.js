document.addEventListener('DOMContentLoaded', () => {
  const pages = {
    cadastros: document.getElementById('page-cadastros'),
    procedimentos: document.getElementById('page-procedimentos'),
    resumo: document.getElementById('page-resumo')
  };

  const navButtons = {
    cadastros: document.getElementById('nav-cadastros'),
    procedimentos: document.getElementById('nav-procedimentos'),
    resumo: document.getElementById('nav-resumo')
  };

  let incomeChart;
  let typesChart;

  function formatCurrency(value) {
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function showPage(name) {
    Object.keys(pages).forEach((key) => {
      pages[key].classList.toggle('active', key === name);
      navButtons[key].classList.toggle('active', key === name);
    });

    if (name === 'cadastros') {
      loadProfessionals();
      loadClients();
    }

    if (name === 'procedimentos') {
      loadClientsDropdown();
      loadProfessionalsDropdown();
      loadProcedures();
      loadReceipts();
      updateRateioHint();
    }

    if (name === 'resumo') {
      loadSummary();
    }
  }

  navButtons.cadastros.addEventListener('click', () => showPage('cadastros'));
  navButtons.procedimentos.addEventListener('click', () => showPage('procedimentos'));
  navButtons.resumo.addEventListener('click', () => showPage('resumo'));

  // Profissionais
  const profIdInput = document.getElementById('prof-id');
  const profNomeInput = document.getElementById('prof-nome');
  const profCrmInput = document.getElementById('prof-crm');
  const profSalvarBtn = document.getElementById('prof-salvar');
  const tableProf = document.getElementById('table-profissionais').querySelector('tbody');
  let editingProf = false;

  profSalvarBtn.addEventListener('click', async () => {
    const nome = profNomeInput.value.trim();
    const crm = profCrmInput.value.trim();

    if (!nome || !crm) {
      alert('Preencha nome e CRM do profissional.');
      return;
    }

    if (editingProf) {
      await fetch(`/api/professionals/${profIdInput.value}`, {
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

    profIdInput.value = '';
    profNomeInput.value = '';
    profCrmInput.value = '';
    editingProf = false;
    profSalvarBtn.textContent = 'Salvar Profissional';

    loadProfessionals();
    loadProfessionalsDropdown();
  });

  async function loadProfessionals() {
    const professionals = await (await fetch('/api/professionals')).json();
    tableProf.innerHTML = '';

    professionals.forEach((prof) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${prof.nome}</td>
        <td>${prof.crm}</td>
        <td><button class="edit-prof" data-id="${prof.id}">Editar</button></td>
      `;
      tableProf.appendChild(tr);
    });

    document.querySelectorAll('.edit-prof').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const professionalsList = await (await fetch('/api/professionals')).json();
        const prof = professionalsList.find((p) => p.id === Number(btn.dataset.id));
        if (!prof) return;

        profIdInput.value = prof.id;
        profNomeInput.value = prof.nome;
        profCrmInput.value = prof.crm;
        editingProf = true;
        profSalvarBtn.textContent = 'Atualizar Profissional';
      });
    });
  }

  async function loadProfessionalsDropdown() {
    const select = document.getElementById('proc-profissional');
    const professionals = await (await fetch('/api/professionals')).json();
    select.innerHTML = '<option value="">Selecione o profissional</option>';
    professionals.forEach((prof) => {
      const option = document.createElement('option');
      option.value = prof.id;
      option.textContent = prof.nome;
      select.appendChild(option);
    });
  }

  // Clientes
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

    if (!nome || !cpf || !telefone || !nascimento) {
      alert('Preencha todos os dados do cliente.');
      return;
    }

    if (editingCli) {
      await fetch(`/api/clients/${cliIdInput.value}`, {
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

    cliIdInput.value = '';
    cliNomeInput.value = '';
    cliCpfInput.value = '';
    cliTelInput.value = '';
    cliNascInput.value = '';
    editingCli = false;
    cliSalvarBtn.textContent = 'Salvar Cliente';

    loadClients();
    loadClientsDropdown();
  });

  async function loadClients() {
    const clients = await (await fetch('/api/clients')).json();
    tableCli.innerHTML = '';

    clients.forEach((cli) => {
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

    document.querySelectorAll('.edit-cli').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const clientsList = await (await fetch('/api/clients')).json();
        const cli = clientsList.find((c) => c.id === Number(btn.dataset.id));
        if (!cli) return;

        cliIdInput.value = cli.id;
        cliNomeInput.value = cli.nome;
        cliCpfInput.value = cli.cpf;
        cliTelInput.value = cli.telefone;
        cliNascInput.value = cli.nascimento;
        editingCli = true;
        cliSalvarBtn.textContent = 'Atualizar Cliente';
      });
    });
  }

  async function loadClientsDropdown() {
    const select = document.getElementById('proc-cliente');
    const clients = await (await fetch('/api/clients')).json();
    select.innerHTML = '<option value="">Selecione o cliente</option>';

    clients.forEach((cli) => {
      const option = document.createElement('option');
      option.value = cli.id;
      option.textContent = cli.nome;
      select.appendChild(option);
    });
  }

  // Procedimentos
  const procTipoInput = document.getElementById('proc-tipo');
  const procRateioInput = document.getElementById('proc-rateio');

  function updateRateioHint() {
    if (procTipoInput.value === 'MAQUINA') {
      procRateioInput.value = '50% Agnes / 50% Neisy (2 recibos)';
    } else {
      procRateioInput.value = '1ª parcela 100% Neisy + 2ª parcela 50/50 (1 recibo Neisy)';
    }
  }

  procTipoInput.addEventListener('change', updateRateioHint);

  document.getElementById('proc-salvar').addEventListener('click', async () => {
    const tipo = procTipoInput.value;
    const clienteId = Number(document.getElementById('proc-cliente').value);
    const profissionalId = Number(document.getElementById('proc-profissional').value);
    const procedimento = document.getElementById('proc-nome').value.trim();
    const valor = Number(document.getElementById('proc-valor').value);

    if (!tipo || !clienteId || !profissionalId || !procedimento || Number.isNaN(valor) || valor <= 0) {
      alert('Preencha todos os campos do procedimento corretamente.');
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
    const procedures = await (await fetch('/api/procedures')).json();
    const table = document.getElementById('table-procedimentos').querySelector('tbody');
    table.innerHTML = '';

    procedures.forEach((proc) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${proc.id}</td>
        <td>${proc.tipo}</td>
        <td>${proc.clientName}</td>
        <td>${proc.professionalName}</td>
        <td>${proc.procedimento}</td>
        <td>${formatCurrency(proc.valor)}</td>
        <td>${proc.rateioDescricao || '-'}</td>
        <td>${formatCurrency(proc.valorAgnes)}</td>
        <td>${formatCurrency(proc.valorNeisy)}</td>
        <td>${new Date(proc.data).toLocaleString('pt-BR')}</td>
      `;
      table.appendChild(tr);
    });
  }

  // Recibos
  async function loadReceipts() {
    const receipts = await (await fetch('/api/receipts')).json();
    const table = document.getElementById('table-recibos').querySelector('tbody');
    table.innerHTML = '';

    receipts.forEach((rec) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${rec.id}</td>
        <td>${rec.procedureName}</td>
        <td>${rec.clientName}</td>
        <td>${rec.professionalName}</td>
        <td>${rec.parcela || 'Única'}</td>
        <td>${formatCurrency(rec.valor)}</td>
        <td>${rec.status}</td>
        <td>
          ${rec.status !== 'Emitido' ? `<button class="emit-rec" data-id="${rec.id}">Emitir</button>` : ''}
          <button class="pdf-rec" data-id="${rec.id}">PDF</button>
        </td>
      `;
      table.appendChild(tr);
    });

    document.querySelectorAll('.emit-rec').forEach((btn) => {
      btn.addEventListener('click', async () => {
        await fetch(`/api/receipts/${btn.dataset.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Emitido' })
        });
        loadReceipts();
      });
    });

    document.querySelectorAll('.pdf-rec').forEach((btn) => {
      btn.addEventListener('click', () => {
        window.open(`/api/receipts/${btn.dataset.id}/pdf`, '_blank');
      });
    });
  }

  // Resumo + gráficos
  async function loadSummary() {
    const summary = await (await fetch('/api/summary')).json();

    document.getElementById('resumo-total').textContent = formatCurrency(summary.total);
    const resumoLista = document.getElementById('resumo-lista');
    resumoLista.innerHTML = '';

    Object.entries(summary.income).forEach(([name, value]) => {
      const li = document.createElement('li');
      li.textContent = `${name}: ${formatCurrency(value)}`;
      resumoLista.appendChild(li);
    });

    renderIncomeChart(summary.income);
    renderTypesChart(summary.proceduresByType);
  }

  function renderIncomeChart(income) {
    const ctx = document.getElementById('chart-income');
    if (incomeChart) incomeChart.destroy();

    incomeChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(income),
        datasets: [{
          label: 'Receita por Profissional (R$)',
          data: Object.values(income),
          backgroundColor: ['#3f51b5', '#009688']
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } }
      }
    });
  }

  function renderTypesChart(types) {
    const ctx = document.getElementById('chart-types');
    if (typesChart) typesChart.destroy();

    typesChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Processo Máquina', 'Atendimentos Neisy'],
        datasets: [{
          data: [types.MAQUINA || 0, types.NEISY || 0],
          backgroundColor: ['#ff9800', '#8e24aa']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
          title: { display: true, text: 'Distribuição da Receita por Tipo de Processo' }
        }
      }
    });
  }

  showPage('cadastros');
});
