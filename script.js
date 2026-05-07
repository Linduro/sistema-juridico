// Configuração do Supabase (Usando as chaves fornecidas)
const SUPABASE_URL = 'https://wysxikeddqxyqexgveuc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_cpoIBJKYPBPGBQ_KrhddxQ_IWwvjiJY';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function carregarDashboard() {
    // 1. Buscar Prazos e Tarefas
    const { data: tarefas, error: errTarefas } = await supabase
        .from('prazos_tarefas')
        .select('*, processos(numero_processo, tipo_acao, clientes(nome))')
        .order('data_vencimento', { ascending: true });

    if (errTarefas) console.error('Erro ao buscar tarefas:', errTarefas);
    else renderizarTarefas(tarefas);

    // 2. Atualizar Metas (Contagem de Contratos)
    atualizarMetas();
}

function renderizarTarefas(tarefas) {
    const hoje = new Date();
    const colunaUrgente = document.querySelector('.task-column.urgente');
    const colunaAtencao = document.querySelector('.task-column.atencao');

    // Limpar colunas antes de renderizar
    colunaUrgente.querySelectorAll('.task-card').forEach(el => el.remove());
    colunaAtencao.querySelectorAll('.task-card').forEach(el => el.remove());

    tarefas.forEach(tarefa => {
        const dataVencimento = new Date(tarefa.data_vencimento);
        const card = document.createElement('div');
        card.className = 'task-card';
        
        card.innerHTML = `
            <span class="badge ${tarefa.processos.tipo_acao.toLowerCase()}">${tarefa.processos.tipo_acao}</span>
            <h4>${tarefa.processos.clientes.nome}</h4>
            <p>${tarefa.descricao}</p>
            <div class="task-meta">
                <span class="deadline">${new Date(tarefa.data_vencimento).toLocaleDateString('pt-BR')}</span>
                <span class="owner">${tarefa.responsavel}</span>
            </div>
        `;

        // Lógica de distribuição inspirada no AdvBox
        if (dataVencimento <= hoje) {
            colunaUrgente.appendChild(card);
        } else {
            colunaAtencao.appendChild(card);
        }
    });
}

async function atualizarMetas() {
    // Busca total de contratos no banco
    const { count: totalPrev } = await supabase
        .from('processos')
        .select('*', { count: 'exact', head: true })
        .eq('tipo_acao', 'Previdenciário');

    const { count: totalCorp } = await supabase
        .from('processos')
        .select('*', { count: 'exact', head: true })
        .eq('tipo_acao', 'Corporativo');

    // Atualiza as barras de progresso (Metas: 150 Prev / 8 Corp)
    const porcPrev = (totalPrev / 150) * 100;
    const porcCorp = (totalCorp / 8) * 100;

    document.querySelector('.progress-bar').style.width = `${porcPrev}%`;
    document.querySelector('.progress-bar.corporativo').style.width = `${porcCorp}%`;
}

// Inicializa o sistema
document.addEventListener('DOMContentLoaded', carregarDashboard);
