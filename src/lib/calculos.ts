import { Material, FichaTecnicaItem, Produto, EstoqueProduto, Unidade } from '../types';

export function formatarNumero(valor: number, decimais: number = 2): string {
  if (Number.isInteger(valor)) return valor.toString();
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimais,
  });
}

export function normalizarQuantidade(
  qtdFicha: number,
  unidadeFichaId: number,
  unidadeMaterialId: number,
  unidades: Unidade[]
): number {
  const uf = unidades.find(u => u.id === unidadeFichaId)?.sigla?.toLowerCase() || '';
  const um = unidades.find(u => u.id === unidadeMaterialId)?.sigla?.toLowerCase() || '';

  if (uf === um) return qtdFicha;

  if (uf === 'g' && um === 'kg') return Number((qtdFicha / 1000).toFixed(3));
  if (uf === 'kg' && um === 'g') return Number((qtdFicha * 1000).toFixed(3));

  if (uf === 'ml' && um === 'l') return Number((qtdFicha / 1000).toFixed(3));
  if (uf === 'l' && um === 'ml') return Number((qtdFicha * 1000).toFixed(3));

  return qtdFicha;
}

export function calcularCustoProducao(
  produtoId: string,
  fichas: FichaTecnicaItem[],
  materiais: Material[],
  unidades: Unidade[]
): number {
  const ingredientes = fichas.filter((f) => f.produto_id === produtoId);
  if (ingredientes.length === 0) return 0;

  let custoTotal = 0;
  for (const ing of ingredientes) {
    const mat = materiais.find((m) => m.id === ing.material_id);
    if (mat) {
      const qtdNormalizada = normalizarQuantidade(ing.quantidade_necessaria, ing.unidade_id, mat.unidade_id, unidades);
      custoTotal += qtdNormalizada * mat.custo_unitario;
    }
  }
  return Number(custoTotal.toFixed(2));
}

/**
 * Checks if there are enough raw materials to produce a given quantity of a product.
 * Returns viability and list of missing materials.
 */
export function verificarViabilidadeProducao(
  produtoId: string,
  quantidade: number,
  fichas: FichaTecnicaItem[],
  materiais: Material[],
  unidades: Unidade[]
): {
  viavel: boolean;
  deficit: { materialId: string; materialNome: string; falta: number; unidade: string }[];
} {
  const ingredientes = fichas.filter((f) => f.produto_id === produtoId);
  const deficit: { materialId: string; materialNome: string; falta: number; unidade: string }[] = [];

  for (const ing of ingredientes) {
    const mat = materiais.find((m) => m.id === ing.material_id);
    if (!mat) continue;

    const qtdNormalizada = normalizarQuantidade(ing.quantidade_necessaria, ing.unidade_id, mat.unidade_id, unidades);
    const totalNecessario = qtdNormalizada * quantidade;

    if (mat.quantidade_atual < totalNecessario) {
      const faltaEstoqueUnidade = totalNecessario - mat.quantidade_atual;
      const unidadeNome = unidades.find(u => u.id === mat.unidade_id)?.sigla || '?';
      deficit.push({
        materialId: mat.id,
        materialNome: mat.nome,
        falta: Number(faltaEstoqueUnidade.toFixed(3)),
        unidade: unidadeNome,
      });
    }
  }

  return {
    viavel: deficit.length === 0,
    deficit,
  };
}

/**
 * Evaluates the absolute maximum doable production of a product based on current raw material stock.
 */
export function sugerirMaximoProduzivel(
  produtoId: string,
  fichas: FichaTecnicaItem[],
  materiais: Material[],
  unidades: Unidade[]
): number {
  const ingredientes = fichas.filter((f) => f.produto_id === produtoId);
  if (ingredientes.length === 0) return 0;

  let maxProduzivel = Infinity;

  for (const ing of ingredientes) {
    const mat = materiais.find((m) => m.id === ing.material_id);
    if (!mat) continue;

    const qtdNormalizada = normalizarQuantidade(ing.quantidade_necessaria, ing.unidade_id, mat.unidade_id, unidades);
    if (qtdNormalizada <= 0) continue;

    const possivelComMaterial = mat.quantidade_atual / qtdNormalizada;
    if (possivelComMaterial < maxProduzivel) {
      maxProduzivel = possivelComMaterial;
    }
  }

  const result = maxProduzivel === Infinity ? 0 : Math.floor(maxProduzivel);
  return result < 0 ? 0 : result;
}

/**
 * Intelligent alert system check for a full order.
 * For each ordered item:
 * 1. checks how much is available in finished goods store (`quantidade_disponivel`).
 * 2. If below quantity requested, gets the remaining amount needed (`faltaFisico`).
 * 3. Checks if raw ingredients are sufficient to construct the remaining amount (`faltaFisico`).
 * 4. Aggregates all ingredient requirements to check for double-counting across different list items.
 */
export interface AlertaItemPedido {
  produtoId: string;
  produtoNome: string;
  quantidadeSolicitada: number;
  disponivelEstoque: number; // physically ready
  faltaFisico: number;        // negative of above
  ingredientesDeficit: { materialNome: string; falta: number; unidade: string }[];
}

export function analisarEstoqueParaPedido(
  itens: { produtoId: string; produtoNome: string; quantidadeSolicitada: number }[],
  estoqueProdutos: EstoqueProduto[],
  fichas: FichaTecnicaItem[],
  materiais: Material[],
  unidades: Unidade[]
): {
  tudoDisponivelEmEstoquePronto: boolean;
  podeProduzirRestante: boolean;
  itensAnalise: AlertaItemPedido[];
  resumoFaltasMateriais: { materialNome: string; falta: number; unidade: string }[];
} {
  const itensAnalise: AlertaItemPedido[] = [];
  let tudoDisponivelEmEstoquePronto = true;

  const materiaisSimulados = materiais.map((m) => ({ ...m }));
  const materialFaltasAcumuladas: { [materialId: string]: { nome: string; falta: number; unidade: string } } = {};

  for (const item of itens) {
    const estoque = estoqueProdutos.find((e) => e.produto_id === item.produtoId);
    const disponivel = estoque ? estoque.quantidade_disponivel : 0;
    const faltaFisico = Math.max(0, item.quantidadeSolicitada - disponivel);

    if (faltaFisico > 0) {
      tudoDisponivelEmEstoquePronto = false;
    }

    const ingredientesDefic: { materialNome: string; falta: number; unidade: string }[] = [];

    if (faltaFisico > 0) {
      const ingredientesFicha = fichas.filter((f) => f.produto_id === item.produtoId);
      for (const ing of ingredientesFicha) {
        const matSimulado = materiaisSimulados.find((m) => m.id === ing.material_id);
        if (!matSimulado) continue;

        const qtdNormalizada = normalizarQuantidade(ing.quantidade_necessaria, ing.unidade_id, matSimulado.unidade_id, unidades);
        const totalSimuladoNecessario = qtdNormalizada * faltaFisico;

        if (matSimulado.quantidade_atual >= totalSimuladoNecessario) {
          matSimulado.quantidade_atual -= totalSimuladoNecessario;
        } else {
          const faltaParaEsteIngrediente = totalSimuladoNecessario - matSimulado.quantidade_atual;
          matSimulado.quantidade_atual = 0;
          const unidadeNome = unidades.find(u => u.id === matSimulado.unidade_id)?.sigla || '?';

          ingredientesDefic.push({
            materialNome: matSimulado.nome,
            falta: Number(faltaParaEsteIngrediente.toFixed(3)),
            unidade: unidadeNome,
          });

          if (!materialFaltasAcumuladas[matSimulado.id]) {
            materialFaltasAcumuladas[matSimulado.id] = {
              nome: matSimulado.nome,
              falta: 0,
              unidade: unidadeNome,
            };
          }
          materialFaltasAcumuladas[matSimulado.id].falta += faltaParaEsteIngrediente;
        }
      }
    }

    itensAnalise.push({
      produtoId: item.produtoId,
      produtoNome: item.produtoNome,
      quantidadeSolicitada: item.quantidadeSolicitada,
      disponivelEstoque: disponivel,
      faltaFisico,
      ingredientesDeficit: ingredientesDefic,
    });
  }

  const resumoFaltasMateriais = Object.values(materialFaltasAcumuladas).map((f) => ({
    materialNome: f.nome,
    falta: Number(f.falta.toFixed(3)),
    unidade: f.unidade,
  }));

  const podeProduzirRestante = resumoFaltasMateriais.length === 0;

  return {
    tudoDisponivelEmEstoquePronto,
    podeProduzirRestante,
    itensAnalise,
    resumoFaltasMateriais,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Gerador de Fichas Técnicas
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Calcula o DIVISOR = RENDE / UNI(CT)
 * Ex: Rende 310, UNI=100 → Divisor = 3,10
 */
export function calcularDivisor(rende: number, uniMedida: number): number {
  if (uniMedida <= 0) return 0;
  return rende / uniMedida;
}

/**
 * Escala uma quantidade pela fórmula: qtdTotal / divisor
 * Ex: 1,297 kg / 3,10 = 0,418 kg por cento
 */
export function escalarReceita(qtdTotal: number, divisor: number): number {
  if (divisor <= 0) return 0;
  return qtdTotal / divisor;
}

/**
 * Calcula o custo total da receita original (VL TOTAL de cada ingrediente)
 */
export function calcularCustoReceitaOriginal(
  ingredientes: { qtdTotal: number; unidadeId: number; materialId: string }[],
  materiais: Material[],
  unidades: Unidade[]
): number {
  let custoTotal = 0;
  for (const ing of ingredientes) {
    const mat = materiais.find(m => m.id === ing.materialId);
    if (mat) {
      const qtdNormalizada = normalizarQuantidade(ing.qtdTotal, ing.unidadeId, mat.unidade_id, unidades);
      custoTotal += qtdNormalizada * mat.custo_unitario;
    }
  }
  return Number(custoTotal.toFixed(2));
}

/**
 * Calcula o custo por unidade de medida (por cento, por dúzia, etc.)
 * Retorna o custo total da receita escalada para UNI(CT) unidades
 */
export function calcularCustoReceitaEscala(
  ingredientes: { qtdTotal: number; unidadeId: number; materialId: string }[],
  materiais: Material[],
  unidades: Unidade[],
  divisor: number
): { porUnidade: number; total: number } {
  if (divisor <= 0) return { porUnidade: 0, total: 0 };

  let custoTotal = 0;
  for (const ing of ingredientes) {
    const mat = materiais.find(m => m.id === ing.materialId);
    if (mat) {
      const qtdNormalizada = normalizarQuantidade(ing.qtdTotal, ing.unidadeId, mat.unidade_id, unidades);
      const qtdEscalada = qtdNormalizada / divisor;
      custoTotal += qtdEscalada * mat.custo_unitario;
    }
  }

  const total = Number(custoTotal.toFixed(2));
  return { porUnidade: total, total };
}

/**
 * Gera dados da ficha técnica escalada (para preview e para salvar)
 * Retorna cada ingrediente com: materialId, qtdEscalada, unidadeId, custoUnitario, custoTotal
 */
export function gerarFichaTecnicaEscala(
  ingredientes: { qtdTotal: number; unidadeId: number; materialId: string }[],
  materiais: Material[],
  unidades: Unidade[],
  divisor: number
): {
  materialId: string;
  materialNome: string;
  qtdOriginal: number;
  unidadeSigla: string;
  custoUnitario: number;
  qtdEscalada: number;
  custoTotal: number;
}[] {
  return ingredientes.map(ing => {
    const mat = materiais.find(m => m.id === ing.materialId);
    const unidade = unidades.find(u => u.id === ing.unidadeId);
    const qtdNormalizada = mat ? normalizarQuantidade(ing.qtdTotal, ing.unidadeId, mat.unidade_id, unidades) : ing.qtdTotal;
    const qtdEscalada = divisor > 0 ? qtdNormalizada / divisor : 0;
    const custoUnitario = mat?.custo_unitario || 0;
    const custoTotal = qtdEscalada * custoUnitario;

    return {
      materialId: ing.materialId,
      materialNome: mat?.nome || '',
      qtdOriginal: ing.qtdTotal,
      unidadeSigla: unidade?.sigla || '',
      custoUnitario,
      qtdEscalada: Number(qtdEscalada.toFixed(3)),
      custoTotal: Number(custoTotal.toFixed(2)),
    };
  });
}
