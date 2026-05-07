// 1. AJUSTE: Usamos 'window.supabase' para evitar conflito de nomes
const SUPABASE_URL = 'https://wysxikeddqxyqexgveuc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_cpoIBJKYPBPGBQ_KrhddxQ_IWwvjiJY';
const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function carregarDashboard() {
    console.log("Iniciando carregamento...");
    // Buscar Prazos e Tarefas com os relacionamentos de processo e cliente
    const { data: tarefas, error: errTarefas } = await _supabase
        .from('prazos_tarefas')
        .select('*, processos(tipo_acao, clientes(nome))')
        .order('data_vencimento', { ascending: true });

    if (errTarefas) {
        console.error('Erro ao buscar tarefas:', errTarefas);
    } else {
        renderizarTarefas(tarefas);
    }

    // Atualizar as barras de metas
    atualizarMetas();
}

function renderizarTarefas(tarefas) {
    const hoje = new Date();
    // Ajuste para pegar os IDs que estão no seu HTML atual
    const colunaUrgente = document.getElementById('col-urgente') || document.querySelector('.urgente');
    const colunaAtencao = document.getElementById('col-prazo') || document.querySelector('.atencao');

    if (!colunaUrgente || !colunaAtencao) return;

    // Limpar apenas os cards antigos, mantendo o título da coluna
    const cards = document.querySelectorAll('.task-card');
    cards.forEach(card => card.remove());

    tarefas.forEach(tarefa => {
        const dataVencimento = new Date(tarefa.data_vencimento);
        const card = document.createElement('div');
        card.className = 'task-card';
        
        // Pegando os dados vindos do relacionamento
        const nomeCliente = tarefa.processos?.clientes?.nome || "Cliente não informado";
        const tipoAcao = tarefa.processos?.tipo_acao || "Geral";

        card.innerHTML = `
            <span class="badge">${tipoAcao}</span>
            <h4>${nomeCliente}</h4>
            <p>${tarefa.descricao}</p>
            <div class="task-meta">
                <span class="deadline">${new Date(tarefa.data_vencimento).toLocaleDateString('pt-BR')}</span>
                <span class="owner">${tarefa.responsavel || 'Equipe'}</span>
            </div>
        `;

        // Se a data é hoje ou já passou, vai para Urgente
        if (dataVencimento <= hoje) {
            colunaUrgente.appendChild(card);
        } else {
            colunaAtencao.appendChild(card);
        }
    });
}

async function atualizarMetas() {
    const { count: totalPrev } = await _supabase
        .from('processos')
        .select('*', { count: 'exact', head: true })
        .eq('tipo_acao', 'Previdenciário');

    const { count: totalCorp } = await _supabase
        .from('processos')
        .select('*', { count: 'exact', head: true })
        .eq('tipo_acao', 'Corporativo');

    // Selecionando as barras pelos IDs corretos
    const barraPrev = document.getElementById('bar-prev');
    const barraCorp = document.getElementById('bar-corp');

    if (barraPrev) {
        const porcPrev = Math.min((totalPrev / 150) * 100, 100);
        barraPrev.style.width = `${porcPrev}%`;
        // Se tiver o texto do contador, atualiza também
        const txtPrev = document.getElementById('count-prev');
        if (txtPrev) txtPrev.innerText = totalPrev || 0;
    }

    if (barraCorp) {
        const porcCorp = Math.min((totalCorp / 8) * 100, 100);
        barraCorp.style.width = `${porcCorp}%`;
        const txtCorp = document.getElementById('count-corp');
        if (txtCorp) txtCorp.innerText = totalCorp || 0;
    }
}

document.addEventListener('DOMContentLoaded', carregarDashboard);
