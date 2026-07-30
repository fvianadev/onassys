import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MiniFactoryStore } from '../lib/store';
import { calcularDivisor, escalarReceita, normalizarQuantidade } from '../lib/calculos';
import SelectSearch from './SelectSearch';
import { ArrowLeft, Plus, Trash2, FileText, Save, X, Copy, Package } from 'lucide-react';

const DRAFT_KEY = 'gerador-produto-draft';

interface IngredienteLinha {
  materialId: string;
  qtdTotal: number;
  unidadeId: number;
}

interface GeradorProdutosProps {
  store: MiniFactoryStore;
  onBack: () => void;
  onUpdate: () => void;
}

const UNIDADES_PRODUTO = [
  { value: 5, label: 'un — Unidade' },
  { value: 8, label: 'ct — Cento' },
  { value: 9, label: 'dz — Dúzia' },
  { value: 6, label: 'cx — Caixa' },
  { value: 7, label: 'pc — Pacote' },
];

export default function GeradorProdutos({ store, onBack, onUpdate }: GeradorProdutosProps) {
  const [produtoNome, setProdutoNome] = useState('');
  const [unidadeId, setUnidadeId] = useState(5);
  const [rende, setRende] = useState(0);
  const [uniMedida, setUniMedida] = useState(1);
  const [ingredientes, setIngredientes] = useState<IngredienteLinha[]>([
    { materialId: '', qtdTotal: 0, unidadeId: 1 },
  ]);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [draftData, setDraftData] = useState<any>(null);
  const [abaAtiva, setAbaAtiva] = useState<'criar' | 'gerados'>('criar');
  const [produtoEditandoId, setProdutoEditandoId] = useState<string | null>(null);
  const [showConfirmExcluir, setShowConfirmExcluir] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Carregar rascunho ao montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setDraftData(data);
        setShowRestorePrompt(true);
      }
    } catch { /* ignora JSON inválido */ }
  }, []);

  // Salvar rascunho automaticamente (debounce 500ms)
  useEffect(() => {
    if (showRestorePrompt) return; // não salvar enquanto prompt está aberto
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const hasData = produtoNome || rende > 0 || ingredientes.some(i => i.materialId);
      if (hasData) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          produtoNome, unidadeId, rende, uniMedida, ingredientes,
        }));
      }
    }, 500);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [produtoNome, unidadeId, rende, uniMedida, ingredientes, showRestorePrompt]);

  const handleRestaurarDraft = () => {
    if (draftData) {
      setProdutoNome(draftData.produtoNome || '');
      setUnidadeId(draftData.unidadeId || 5);
      setRende(draftData.rende || 0);
      setUniMedida(draftData.uniMedida || 100);
      setIngredientes(draftData.ingredientes || [{ materialId: '', qtdTotal: 0, unidadeId: 1 }]);
    }
    setShowRestorePrompt(false);
  };

  const handleDescartarDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setShowRestorePrompt(false);
    setDraftData(null);
  };

  const divisor = useMemo(() => calcularDivisor(rende, uniMedida), [rende, uniMedida]);
  const uniMedidaSigla = useMemo(() => {
    const u = store.unidades.find(u => u.id === unidadeId);
    return u?.sigla || 'un';
  }, [store.unidades, unidadeId]);

  const handleAddIngrediente = () => {
    setIngredientes([...ingredientes, { materialId: '', qtdTotal: 0, unidadeId: 1 }]);
  };

  const handleRemoveIngrediente = (idx: number) => {
    setIngredientes(ingredientes.filter((_, i) => i !== idx));
  };

  const handleIngredienteChange = (idx: number, field: keyof IngredienteLinha, value: string | number) => {
    const next = [...ingredientes];
    if (field === 'materialId') {
      const mat = store.materiais.find(m => m.id === value);
      next[idx] = { ...next[idx], materialId: value as string, unidadeId: mat?.unidade_id || 1 };
    } else {
      next[idx] = { ...next[idx], [field]: value };
    }
    setIngredientes(next);
  };

  const materiaisDisponiveis = useMemo(() => {
    const usados = ingredientes.map(i => i.materialId).filter(Boolean);
    return store.materiais
      .filter(m => !usados.includes(m.id))
      .map(m => ({ value: m.id, label: m.nome }));
  }, [store.materiais, ingredientes]);

  const todosMateriais = useMemo(() =>
    store.materiais.map(m => ({ value: m.id, label: m.nome })),
    [store.materiais]
  );

  const dadosTabela = useMemo(() => {
    return ingredientes.map(ing => {
      const mat = store.materiais.find(m => m.id === ing.materialId);
      const unidade = store.unidades.find(u => u.id === ing.unidadeId);
      const qtdNormalizada = mat ? normalizarQuantidade(ing.qtdTotal, ing.unidadeId, mat.unidade_id, store.unidades) : 0;
      const vlUni = mat?.custo_unitario || 0;
      const vlTotal = qtdNormalizada * vlUni;
      const qtdPorUnidade = divisor > 0 ? qtdNormalizada / divisor : 0;
      const vlUniTotal = qtdPorUnidade * vlUni;

      return {
        materialId: ing.materialId,
        materialNome: mat?.nome || '',
        qtdTotal: ing.qtdTotal,
        unidadeSigla: unidade?.sigla || '',
        vlUni,
        vlTotal,
        qtdPorUnidade,
        vlUniTotal,
        custoUnitario: mat?.custo_unitario || 0,
      };
    });
  }, [ingredientes, store.materiais, store.unidades, divisor]);

  const totalReceitaOriginal = useMemo(() =>
    dadosTabela.reduce((sum, d) => sum + d.vlTotal, 0),
    [dadosTabela]
  );

  const totalCustoProd = useMemo(() =>
    dadosTabela.reduce((sum, d) => sum + d.vlUniTotal, 0),
    [dadosTabela]
  );

  const handleSalvar = async () => {
    if (!produtoNome.trim()) { alert('Preencha o nome do produto.'); return; }
    if (rende <= 0) { alert('O rendimento deve ser maior que 0.'); return; }
    if (!unidadeId) { alert('Selecione a unidade do produto.'); return; }
    const validos = ingredientes.filter(i => i.materialId && i.qtdTotal > 0);
    if (validos.length === 0) { alert('Preencha pelo menos 1 ingrediente com quantidade maior que 0.'); return; }

    const nomesIngredientes = validos
      .map(v => store.materiais.find(m => m.id === v.materialId)?.nome)
      .filter(Boolean)
      .join(', ');

    const produtoResult = await store.addProduto({
      nome: produtoNome.trim(),
      categoria_id: store.categoriasFinanceiro[0]?.id || 1,
      descricao: `${produtoNome.trim()} — Ingredientes: ${nomesIngredientes}.`,
      unidade_producao_id: unidadeId,
      tempo_producao_minutos: 0,
      custo_producao_calculado: totalCustoProd,
      ativo: true,
      margem_lucro: 0,
      preco_venda: 0,
    });

    if (!produtoResult) { alert('Erro ao criar produto.'); return; }

    for (const ing of validos) {
      const qtdPorUnidade = divisor > 0 ? (normalizarQuantidade(ing.qtdTotal, ing.unidadeId, store.materiais.find(m => m.id === ing.materialId)?.unidade_id || ing.unidadeId, store.unidades)) / divisor : 0;
      await store.addFichaTecnica({
        produto_id: produtoResult.id,
        material_id: ing.materialId,
        quantidade_necessaria: Number(qtdPorUnidade.toFixed(4)),
        unidade_id: store.materiais.find(m => m.id === ing.materialId)?.unidade_id || ing.unidadeId,
      });
    }

    alert(`Produto "${produtoNome}" e ficha técnica criados com sucesso!`);
    localStorage.removeItem(DRAFT_KEY);
    onUpdate();
    onBack();
  };

  const handleCancelar = () => {
    localStorage.removeItem(DRAFT_KEY);
    onBack();
  };

  // Produtos que têm fichas técnicas (para aba Gerados)
  const produtosGerados = useMemo(() => {
    const produtoIdsComFichas = [...new Set(store.fichas.map(f => f.produto_id))];
    return produtoIdsComFichas.map(pid => {
      const produto = store.produtos.find(p => p.id === pid);
      const fichasDoProduto = store.fichas.filter(f => f.produto_id === pid);
      const custoTotal = fichasDoProduto.reduce((sum, f) => {
        const mat = store.materiais.find(m => m.id === f.material_id);
        return sum + (f.quantidade_necessaria * (mat?.custo_unitario || 0));
      }, 0);
      return { produto, fichas: fichasDoProduto, custoTotal };
    }).filter(x => x.produto);
  }, [store.produtos, store.fichas, store.materiais]);

  const handleCriarSimilar = (produtoId: string) => {
    const fichasDoProduto = store.fichas.filter(f => f.produto_id === produtoId);
    const novosIngredientes: IngredienteLinha[] = fichasDoProduto.map(f => {
      const mat = store.materiais.find(m => m.id === f.material_id);
      return {
        materialId: f.material_id,
        qtdTotal: f.quantidade_necessaria, // valor por unidade (já dividido)
        unidadeId: mat?.unidade_id || f.unidade_id,
      };
    });
    setIngredientes(novosIngredientes.length > 0 ? novosIngredientes : [{ materialId: '', qtdTotal: 0, unidadeId: 1 }]);
    setProdutoNome('');
    setProdutoEditandoId(null);
    setAbaAtiva('criar');
    localStorage.removeItem(DRAFT_KEY);
  };

  const handleExcluirProduto = async (produtoId: string) => {
    const result = await store.deleteProdutoCompleto(produtoId);
    if (result !== false) {
      setShowConfirmExcluir(null);
      onUpdate();
    }
  };

  const handleImprimir = () => {
    const printContent = `
      <html>
      <head>
        <title>Ficha Técnica — ${produtoNome}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          h1 { color: #8B4513; font-size: 24px; margin-bottom: 5px; }
          h2 { color: #8B4513; font-size: 14px; margin: 15px 0 8px; border-bottom: 2px solid #D4A574; padding-bottom: 4px; }
          .info { display: flex; gap: 30px; margin: 10px 0 20px; font-size: 13px; }
          .info span { font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 12px; }
          th { background: #8B4513; color: white; padding: 8px; text-align: left; }
          td { padding: 6px 8px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background: #f9f5f0; }
          .total { font-weight: bold; background: #D4A574 !important; color: white; }
          .right { text-align: right; }
        </style>
      </head>
      <body>
        <h1>FICHA TÉCNICA — ${produtoNome}</h1>
        <div class="info">
          <div><span>Rendimento:</span> ${rende} unidades</div>
          <div><span>Unidade:</span> ${uniMedidaSigla} (${uniMedida} un)</div>
          <div><span>Divisor:</span> ${divisor.toFixed(2)}</div>
        </div>
        <h2>FICHA DA RECEITA ADQUIRIDA</h2>
        <table>
          <tr><th>Descrição</th><th class="right">QTD</th><th>UNI</th><th class="right">VL UNI</th><th class="right">VL TOTAL</th></tr>
          ${dadosTabela.filter(d => d.materialId).map(d => `
            <tr>
              <td>${d.materialNome}</td>
              <td class="right">${d.qtdTotal.toFixed(3)}</td>
              <td>${d.unidadeSigla}</td>
              <td class="right">R$ ${d.vlUni.toFixed(2)}</td>
              <td class="right">R$ ${d.vlTotal.toFixed(2)}</td>
            </tr>
          `).join('')}
          <tr class="total"><td colspan="4">T. REC. ADQ</td><td class="right">R$ ${totalReceitaOriginal.toFixed(2)}</td></tr>
        </table>
        <h2>FICHA POR UNIDADE DE MEDIDA (${uniMedidaSigla})</h2>
        <table>
          <tr><th>Descrição</th><th class="right">QTD / ${uniMedidaSigla}</th><th class="right">VL UNI TOTAL</th></tr>
          ${dadosTabela.filter(d => d.materialId).map(d => `
            <tr>
              <td>${d.materialNome}</td>
              <td class="right">${d.qtdPorUnidade.toFixed(3)} ${d.unidadeSigla}</td>
              <td class="right">R$ ${d.vlUniTotal.toFixed(2)}</td>
            </tr>
          `).join('')}
          <tr class="total"><td>T. CUST. PROD.</td><td></td><td class="right">R$ ${totalCustoProd.toFixed(2)}</td></tr>
        </table>
      </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 300);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Modal de Restaurar Rascunho */}
      {showRestorePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-[#1c140c] rounded-xl border border-amber-200 dark:border-[#2d1e0d] p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-100 mb-2">Rascunho encontrado</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
              Existe um rascunho salvo anteriormente. Deseja restaurá-lo?
            </p>
            <div className="flex gap-2">
              <button onClick={handleDescartarDraft} className="flex-1 py-2 px-3 rounded-lg text-xs font-bold border border-gray-300 dark:border-[#2d1e0d] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2d1e0d] transition">
                Descartar
              </button>
              <button onClick={handleRestaurarDraft} className="flex-1 py-2 px-3 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition">
                Restaurar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={handleCancelar} className="p-2 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition">
          <ArrowLeft size={20} className="text-amber-700" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-amber-950 dark:text-amber-100">Gerador de Produtos</h1>
          <p className="text-xs text-gray-500">Crie produtos a partir de receitas adquiridas</p>
        </div>
        {/* Toggle Abas */}
        <div className="flex bg-amber-100 dark:bg-[#2d1e0d] rounded-lg p-1">
          <button
            onClick={() => setAbaAtiva('criar')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${abaAtiva === 'criar' ? 'bg-amber-600 text-white shadow' : 'text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-[#3d2e1d]'}`}
          >
            Criar
          </button>
          <button
            onClick={() => setAbaAtiva('gerados')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${abaAtiva === 'gerados' ? 'bg-amber-600 text-white shadow' : 'text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-[#3d2e1d]'}`}
          >
            Gerados ({produtosGerados.length})
          </button>
        </div>
      </div>

      {/* Aba Criar */}
      {abaAtiva === 'criar' && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COLUNA ESQUERDA — Dados + Receita Original */}
        <div className="space-y-4">
          {/* Dados do Produto */}
          <div className="bg-white dark:bg-[#120c06] rounded-xl border border-amber-100 dark:border-[#2d1e0d] p-4 space-y-3">
            <h2 className="text-sm font-bold text-amber-900 dark:text-amber-200 uppercase">Dados do Produto</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Produto</label>
                <input
                  type="text"
                  value={produtoNome}
                  onChange={e => setProdutoNome(e.target.value)}
                  placeholder="Nome do produto"
                  className="w-full h-9 border border-amber-200 dark:border-[#2d1e0d] rounded-lg px-3 text-xs focus:outline-none focus:border-amber-400 bg-white dark:bg-[#1c140c]"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">Rende (total)</label>
                <input
                  type="number" min="1" step="1"
                  value={rende || ''}
                  onChange={e => setRende(Number(e.target.value))}
                  placeholder="Ex: 100"
                  className="w-full h-9 border border-amber-200 dark:border-[#2d1e0d] rounded-lg px-3 text-xs font-mono focus:outline-none focus:border-amber-400 bg-white dark:bg-[#1c140c]"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">Unidade</label>
                <select
                  value={unidadeId}
                  onChange={e => { setUnidadeId(Number(e.target.value)); setUniMedida(UNIDADES_PRODUTO.find(u => u.value === Number(e.target.value))?.value === 5 ? 1 : UNIDADES_PRODUTO.find(u => u.value === Number(e.target.value))?.value === 8 ? 100 : UNIDADES_PRODUTO.find(u => u.value === Number(e.target.value))?.value === 9 ? 12 : 50); }}
                  className="w-full h-9 border border-amber-200 dark:border-[#2d1e0d] rounded-lg px-3 text-xs focus:outline-none focus:border-amber-400 bg-white dark:bg-[#1c140c]"
                >
                  {UNIDADES_PRODUTO.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">QTD BASE</label>
                <input
                  type="number" min="1" step="1"
                  value={uniMedida}
                  onChange={e => setUniMedida(Number(e.target.value))}
                  className="w-full h-9 border border-amber-200 dark:border-[#2d1e0d] rounded-lg px-3 text-xs font-mono focus:outline-none focus:border-amber-400 bg-white dark:bg-[#1c140c]"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">Divisor</label>
                <div className="h-9 border border-amber-200 dark:border-[#2d1e0d] rounded-lg px-3 flex items-center text-xs font-mono bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200">
                  {divisor > 0 ? divisor.toFixed(2) : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Ficha da Receita Adquirida */}
          <div className="bg-white dark:bg-[#120c06] rounded-xl border border-amber-100 dark:border-[#2d1e0d] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-amber-900 dark:text-amber-200 uppercase">Ficha da Receita Adquirida</h2>
              <button onClick={handleAddIngrediente} className="flex items-center gap-1 text-[10px] font-bold text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200 transition">
                <Plus size={12} /> Adicionar
              </button>
            </div>

            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 text-[9px] font-bold text-gray-400 uppercase">
                <div className="col-span-4">Descrição</div>
                <div className="col-span-2 text-right">QTD</div>
                <div className="col-span-1">UNI</div>
                <div className="col-span-2 text-right">VL UNI</div>
                <div className="col-span-2 text-right">VL TOTAL</div>
                <div className="col-span-1"></div>
              </div>

              {/* Rows */}
              {ingredientes.map((ing, idx) => {
                const mat = store.materiais.find(m => m.id === ing.materialId);
                const unidade = store.unidades.find(u => u.id === ing.unidadeId);
                const qtdNorm = mat ? normalizarQuantidade(ing.qtdTotal, ing.unidadeId, mat.unidade_id, store.unidades) : 0;
                const vlTotal = qtdNorm * (mat?.custo_unitario || 0);

                return (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4">
                      <SelectSearch
                        value={ing.materialId}
                        onChange={v => handleIngredienteChange(idx, 'materialId', v)}
                        options={ing.materialId ? todosMateriais : materiaisDisponiveis}
                        placeholder="Selecione"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number" step="0.001" min="0" inputMode="decimal"
                        value={ing.qtdTotal || ''}
                        onChange={e => handleIngredienteChange(idx, 'qtdTotal', Number(e.target.value))}
                        className="w-full h-8 border border-amber-200 dark:border-[#2d1e0d] rounded px-2 text-[10px] font-mono text-right focus:outline-none focus:border-amber-400 bg-white dark:bg-[#1c140c]"
                      />
                    </div>
                    <div className="col-span-1 flex items-center h-8 text-[10px] font-mono text-gray-500">
                      {unidade?.sigla || ''}
                    </div>
                    <div className="col-span-2 flex items-center h-8 text-[10px] font-mono text-right text-emerald-700 dark:text-emerald-400 font-semibold">
                      R$ {(mat?.custo_unitario || 0).toFixed(2)}
                    </div>
                    <div className="col-span-2 flex items-center h-8 text-[10px] font-mono text-right font-bold">
                      R$ {vlTotal.toFixed(2)}
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                      <button onClick={() => handleRemoveIngrediente(idx)} className="text-red-400 hover:text-red-600 transition">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Totais */}
              <div className="grid grid-cols-12 gap-2 items-center pt-2 border-t border-amber-100 dark:border-[#2d1e0d]">
                <div className="col-span-4 text-[10px] font-bold text-amber-900 dark:text-amber-200">TOTAIS</div>
                <div className="col-span-2"></div>
                <div className="col-span-1"></div>
                <div className="col-span-2 text-[10px] font-bold text-right text-amber-900 dark:text-amber-200">T. REC. ADQ</div>
                <div className="col-span-2 text-[10px] font-mono font-bold text-right text-amber-900 dark:text-amber-200">R$ {totalReceitaOriginal.toFixed(2)}</div>
                <div className="col-span-1"></div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA — Preview + Ações */}
        <div className="space-y-4">
          {/* Ficha por Unidade de Medida */}
          <div className="bg-white dark:bg-[#120c06] rounded-xl border border-amber-100 dark:border-[#2d1e0d] p-4 space-y-3">
            <h2 className="text-sm font-bold text-amber-900 dark:text-amber-200 uppercase">
              Ficha por Unidade de Medida
            </h2>

            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-10 gap-2 text-[9px] font-bold text-gray-400 uppercase">
                <div className="col-span-4">Descrição</div>
                <div className="col-span-3 text-right">QTD / {uniMedidaSigla}</div>
                <div className="col-span-3 text-right">VL UNI TOTAL</div>
              </div>

              {/* Rows */}
              {dadosTabela.filter(d => d.materialId).map((d, idx) => (
                <div key={idx} className="grid grid-cols-10 gap-2 items-center">
                  <div className="col-span-4 text-[10px] font-medium truncate">{d.materialNome}</div>
                  <div className="col-span-3 text-[10px] font-mono text-right">
                    {d.qtdPorUnidade.toFixed(3)} <span className="text-gray-400">{d.unidadeSigla}</span>
                  </div>
                  <div className="col-span-3 text-[10px] font-mono text-right font-semibold">
                    R$ {d.vlUniTotal.toFixed(2)}
                  </div>
                </div>
              ))}

              {/* Total */}
              <div className="grid grid-cols-10 gap-2 items-center pt-2 border-t border-amber-100 dark:border-[#2d1e0d]">
                <div className="col-span-4 text-[10px] font-bold text-amber-900 dark:text-amber-200">T. CUST. PROD.</div>
                <div className="col-span-3"></div>
                <div className="col-span-3 text-[10px] font-mono font-bold text-right text-amber-900 dark:text-amber-200">
                  R$ {totalCustoProd.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3">
            <button onClick={handleImprimir} className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold border border-amber-200 dark:border-[#2d1e0d] text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition">
              <FileText size={16} /> Baixar Ficha
            </button>
            <button onClick={handleSalvar} className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold border transition bg-amber-600 hover:bg-amber-500 text-white border-amber-600 shadow-md">
              <Save size={16} /> Salvar Produto + Ficha
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Aba Gerados */}
      {abaAtiva === 'gerados' && (
      <div className="space-y-4">
        {produtosGerados.length === 0 ? (
          <div className="bg-white dark:bg-[#120c06] rounded-xl border border-amber-100 dark:border-[#2d1e0d] p-8 text-center">
            <Package size={32} className="mx-auto mb-3 text-amber-300" />
            <p className="text-sm text-gray-500">Nenhum produto gerado ainda.</p>
            <p className="text-xs text-gray-400 mt-1">Crie um produto na aba "Criar" para vê-lo aqui.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#120c06] rounded-xl border border-amber-100 dark:border-[#2d1e0d] p-4">
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 text-[9px] font-bold text-gray-400 uppercase pb-2 border-b border-amber-100 dark:border-[#2d1e0d]">
                <div className="col-span-4">Produto</div>
                <div className="col-span-2 text-right">Custo</div>
                <div className="col-span-2 text-center">Unidade</div>
                <div className="col-span-2 text-center">Fichas</div>
                <div className="col-span-2 text-center">Ações</div>
              </div>

              {/* Rows */}
              {produtosGerados.map(({ produto, fichas, custoTotal }) => (
                <div key={produto!.id} className="grid grid-cols-12 gap-2 items-center py-2 hover:bg-amber-50 dark:hover:bg-[#2d1e0d] rounded-lg transition">
                  <div className="col-span-4">
                    <div className="text-xs font-bold text-amber-900 dark:text-amber-100 truncate">{produto!.nome}</div>
                    <div className="text-[10px] text-gray-400">{produto!.descricao?.substring(0, 40)}...</div>
                  </div>
                  <div className="col-span-2 text-xs font-mono text-right text-emerald-700 dark:text-emerald-400">
                    R$ {custoTotal.toFixed(2)}
                  </div>
                  <div className="col-span-2 text-xs text-center text-gray-500">
                    {store.unidades.find(u => u.id === produto!.unidade_producao_id)?.sigla || '—'}
                  </div>
                  <div className="col-span-2 text-xs text-center text-gray-500">
                    {fichas.length} ingrediente{fichas.length !== 1 ? 's' : ''}
                  </div>
                  <div className="col-span-2 flex items-center justify-center gap-1">
                    <button
                      onClick={() => handleCriarSimilar(produto!.id)}
                      className="p-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition"
                      title="Criar similar"
                    >
                      <Copy size={12} className="text-amber-600" />
                    </button>
                    <button
                      onClick={() => setShowConfirmExcluir(produto!.id)}
                      className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                      title="Excluir"
                    >
                      <Trash2 size={12} className="text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      )}

      {/* Modal Confirmar Exclusão */}
      {showConfirmExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-[#1c140c] rounded-xl border border-amber-200 dark:border-[#2d1e0d] p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-100 mb-2">Excluir produto?</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
              Esta ação irá excluir o produto e todas as suas fichas técnicas. Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirmExcluir(null)} className="flex-1 py-2 px-3 rounded-lg text-xs font-bold border border-gray-300 dark:border-[#2d1e0d] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2d1e0d] transition">
                Cancelar
              </button>
              <button onClick={() => handleExcluirProduto(showConfirmExcluir)} className="flex-1 py-2 px-3 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
