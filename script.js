// Seleção de elementos do DOM
const form = document.getElementById('finance-form');
const transactionTypeInput = document.getElementById('transaction-type');
const clientNameInput = document.getElementById('client-name');
const amountInput = document.getElementById('amount');
const serviceTypeInput = document.getElementById('service-type');
const paymentMethodInput = document.getElementById('payment-method');
const dateInput = document.getElementById('date');
const submitBtn = document.getElementById('submit-btn');

const recordsTableBody = document.querySelector('#records-table tbody');
const totalEntradasSpan = document.getElementById('total-entradas');
const totalSaidasSpan = document.getElementById('total-saidas');
const totalAmountSpan = document.getElementById('total-amount');

// Elementos dos Modais
const confirmModal = document.getElementById('confirm-modal');
const btnConfirmYes = document.getElementById('btn-confirm-yes');
const btnConfirmNo = document.getElementById('btn-confirm-no');

const saveModal = document.getElementById('save-modal');
const btnSaveYes = document.getElementById('btn-save-yes');
const btnSaveNo = document.getElementById('btn-save-no');

const historicModal = document.getElementById('historic-modal');
const btnCloseHistoric = document.getElementById('btn-close-historic');
const historicListDiv = document.getElementById('historic-list');

// Elementos dos Botões Principais
const btnSaveData = document.getElementById('btnSaveData');
const btnShare = document.getElementById('btnShare');
const btnHistoric = document.getElementById('historic');

// Variáveis de controle
let indexToDelete = null;

// Carregar dados do localStorage
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let historicMonths = JSON.parse(localStorage.getItem('historicMonths')) || [];

// Mudar dinamicamente o texto do botão de envio
transactionTypeInput.addEventListener('change', () => {
    submitBtn.textContent = `Registrar ${transactionTypeInput.value}`;
});

function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateString) {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

// Atualizar a interface da tabela ativa
function updateUI() {
    recordsTableBody.innerHTML = '';
    let totalEntradas = 0;
    let totalSaidas = 0;

    const reversedTransactions = [...transactions].reverse();

    reversedTransactions.forEach((transaction, reversedIndex) => {
        const originalIndex = transactions.length - 1 - reversedIndex;
        const row = document.createElement('tr');
        
        const isEntrada = transaction.type === 'Entrada';
        const classeTipo = isEntrada ? 'badge-entrada' : 'badge-saida';
        const classeValor = isEntrada ? 'valor-positivo' : 'valor-negativo';

        row.innerHTML = `
            <td>${formatDate(transaction.date)}</td>
            <td><span class="${classeTipo}">${transaction.type}</span></td>
            <td>${transaction.client}</td>
            <td>${transaction.service || 'Não informado'}</td>
            <td>${transaction.method}</td>
            <td class="${classeValor}">${formatCurrency(transaction.amount)}</td>
            <td><button class="delete-btn" onclick="askDeleteTransaction(${originalIndex})">Excluir</button></td>
        `;
        recordsTableBody.appendChild(row);
    });

    transactions.forEach(t => {
        if (t.type === 'Saída') {
            totalSaidas += t.amount;
        } else {
            totalEntradas += t.amount;
        }
    });

    const saldoAtual = totalEntradas - totalSaidas;

    totalEntradasSpan.textContent = formatCurrency(totalEntradas);
    totalSaidasSpan.textContent = formatCurrency(totalSaidas);
    totalAmountSpan.textContent = formatCurrency(saldoAtual);
    
    // Altera a cor do texto do Saldo Geral dependendo do valor
    if (saldoAtual < 0) {
        totalAmountSpan.className = 'valor-negativo';
    } else {
        totalAmountSpan.className = 'valor-positivo';
    }
}

// Formulário para adicionar transação
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const newTransaction = {
        type: transactionTypeInput.value,
        client: clientNameInput.value,
        amount: parseFloat(amountInput.value),
        service: serviceTypeInput.value,
        method: paymentMethodInput.value,
        date: dateInput.value
    };

    transactions.push(newTransaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));

    updateUI();
    form.reset();
    dateInput.value = new Date().toISOString().split('T')[0];
    submitBtn.textContent = `Registrar ${transactionTypeInput.value}`;
});

// Modal de exclusão de serviço simples
window.askDeleteTransaction = function(index) {
    indexToDelete = index;
    confirmModal.classList.add('active');
};

btnConfirmYes.addEventListener('click', () => {
    if (indexToDelete !== null) {
        transactions.splice(indexToDelete, 1);
        localStorage.setItem('transactions', JSON.stringify(transactions));
        updateUI();
    }
    closeModal();
});

btnConfirmNo.addEventListener('click', () => closeModal());

function closeModal() {
    confirmModal.classList.remove('active');
    indexToDelete = null;
}

// ================= LÓGICA DO MODAL PARA SALVAR MÊS =================
btnSaveData.addEventListener('click', () => {
    if (transactions.length === 0) {
        alert('Não há transações na tabela atual para salvar no histórico.');
        return;
    }
    saveModal.classList.add('active'); 
});

btnSaveYes.addEventListener('click', () => {
    let totalEntradas = 0;
    let totalSaidas = 0;
    
    transactions.forEach(t => {
        if (t.type === 'Saída') {
            totalSaidas += t.amount;
        } else {
            totalEntradas += t.amount;
        }
    });

    const novoHistorico = {
        dataSalvamento: new Date().toLocaleDateString('pt-BR'),
        entradas: totalEntradas,
        saidas: totalSaidas,
        saldo: totalEntradas - totalSaidas,
        quantidadeServicos: transactions.length,
        detalhes: [...transactions]
    };

    historicMonths.push(novoHistorico);
    localStorage.setItem('historicMonths', JSON.stringify(historicMonths));

    transactions = [];
    localStorage.setItem('transactions', JSON.stringify(transactions));

    updateUI();
    saveModal.classList.remove('active');
    renderHistoricList(); 
});

btnSaveNo.addEventListener('click', () => {
    saveModal.classList.remove('active');
});

// ================= GERAÇÃO E GERENCIAMENTO DO HISTÓRICO MENSAL =================
function renderHistoricList() {
    historicListDiv.innerHTML = '';

    if (historicMonths.length === 0) {
        historicListDiv.innerHTML = '<p style="color: #666; text-align: center;">Nenhum mês foi arquivado ainda.</p>';
        return;
    }

    const reversedHistoric = [...historicMonths].reverse();

    reversedHistoric.forEach((hist, reversedIndex) => {
        const originalIndex = historicMonths.length - 1 - reversedIndex;

        const item = document.createElement('div');
        item.className = 'historic-item';
        item.innerHTML = `
            <div class="historic-info">
                <strong>📦 Fechamento em:</strong> ${hist.dataSalvamento}<br>
                <strong>🔢 Movimentações:</strong> ${hist.quantidadeServicos}<br>
                <strong>🟢 Entradas:</strong> <span style="color: #2a9d8f;">${formatCurrency(hist.entradas || 0)}</span><br>
                <strong>🔴 Saídas:</strong> <span style="color: #e63946;">${formatCurrency(hist.saidas || 0)}</span><br>
                <strong>💰 Saldo Final:</strong> <span style="color: #0077b6; font-weight: bold;">${formatCurrency(hist.saldo ?? hist.total)}</span>
            </div>
            <div class="historic-actions">
                <button class="hist-btn-share" onclick="shareHistoricMonth(${originalIndex})" title="Compartilhar este relatório">
                    <i class="fa-solid fa-share-from-square"></i>
                </button>
                <button class="hist-btn-delete" onclick="deleteHistoricMonth(${originalIndex})" title="Excluir este mês">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        `;
        historicListDiv.appendChild(item);
    });
}

btnHistoric.addEventListener('click', () => {
    renderHistoricList();
    historicModal.classList.add('active');
});

btnCloseHistoric.addEventListener('click', () => {
    historicModal.classList.remove('active');
});

window.deleteHistoricMonth = function(index) {
    if (confirm("Tem certeza de que deseja excluir permanentemente este mês do histórico?")) {
        historicMonths.splice(index, 1);
        localStorage.setItem('historicMonths', JSON.stringify(historicMonths));
        renderHistoricList(); 
    }
};

// ================= FUNÇÃO CENTRAL DE COMPARTILHAMENTO =================
function gerarTextoRelatorio(lista, titulo, dataEnvio, totalEntradas, totalSaidas) {
    let texto = `*📊 ${titulo}*\n`;
    texto += `Data de Fechamento/Envio: ${dataEnvio}\n`;
    texto += `------------------------------------------\n\n`;

    const reversed = [...lista].reverse();
    reversed.forEach((t) => {
        const valorFormatado = t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const iconeTipo = t.type === 'Saída' ? '🔴 [SAÍDA]' : '🟢 [ENTRADA]';
        
        let dataExibicao = t.date;
        if (t.date && t.date.includes('-')) {
            const [ano, mes, dia] = t.date.split('-');
            dataExibicao = `${dia}/${mes}/${ano}`;
        }
        
        texto += `${iconeTipo}\n`;
        texto += `📅 *Data:* ${dataExibicao}\n`;
        texto += `👤 *Cliente/Favorecido:* ${t.client}\n`;
        texto += `✨ *Serviço/Descrição:* ${t.service || 'Não informado'}\n`;
        texto += `💳 *Pagamento:* ${t.method}\n`;
        texto += `💰 *Valor:* ${valorFormatado}\n`;
        texto += `------------------------------------------\n`;
    });

    texto += `\n*🟢 TOTAL ENTRADAS:* ${formatCurrency(totalEntradas)}`;
    texto += `\n*🔴 TOTAL SAÍDAS:* ${formatCurrency(totalSaidas)}`;
    texto += `\n*✅ SALDO DO PERÍODO: ${formatCurrency(totalEntradas - totalSaidas)}*`;
    return texto;
}

function dispararCompartilhamento(texto) {
    if (navigator.share) {
        navigator.share({ title: 'Relatório Financeiro', text: texto })
        .catch((error) => {
            const urlWhatsApp = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;
            window.open(urlWhatsApp, '_blank');
        });
    } else {
        const urlWhatsApp = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;
        window.open(urlWhatsApp, '_blank');
    }
}

// Botão Compartilhar Mês Atual
btnShare.addEventListener('click', () => {
    if (transactions.length === 0) {
        alert('Não há dados ativos para compartilhar no momento.');
        return;
    }
    let totalEntradas = 0;
    let totalSaidas = 0;
    transactions.forEach(t => {
        if (t.type === 'Saída') totalSaidas += t.amount;
        else totalEntradas += t.amount;
    });

    const texto = gerarTextoRelatorio(
        transactions, 
        'RELATÓRIO FINANCEIRO - MÊS CORRENTE', 
        new Date().toLocaleDateString('pt-BR'), 
        totalEntradas,
        totalSaidas
    );
    dispararCompartilhamento(texto);
});

// Compartilhar mês específico do Histórico
window.shareHistoricMonth = function(index) {
    const hist = historicMonths[index];
    const tEntradas = hist.entradas || hist.total || 0; // fallback para chaves antigas se houver
    const tSaidas = hist.saidas || 0;

    const texto = gerarTextoRelatorio(
        hist.detalhes, 
        `RELATÓRIO HISTÓRICO (${hist.dataSalvamento})`, 
        hist.dataSalvamento, 
        tEntradas,
        tSaidas
    );
    dispararCompartilhamento(texto);
};

// Inicialização
dateInput.value = new Date().toISOString().split('T')[0];
updateUI();