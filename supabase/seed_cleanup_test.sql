-- =====================================================
-- LIMPEZA SEGURA DE DADOS DE TESTE
-- Remove APENAS registros marcados com [TESTE]
-- Seguro mesmo com dados reais misturados
-- Execute: db:seed:cleanup
-- =====================================================

-- Ordem respeita dependências de FK
DELETE FROM itens_pedido WHERE observacao LIKE '[TESTE]%';
DELETE FROM lancamentos_financeiros WHERE descricao LIKE '[TESTE]%';
DELETE FROM movimentacoes_produtos WHERE observacao LIKE '[TESTE]%';
DELETE FROM movimentacoes_materiais WHERE observacao LIKE '[TESTE]%';
DELETE FROM estoque_produtos WHERE produto_id IN (SELECT id FROM produtos WHERE nome LIKE '[TESTE]%');
DELETE FROM fichas_tecnicas WHERE produto_id IN (SELECT id FROM produtos WHERE nome LIKE '[TESTE]%');
DELETE FROM pedidos WHERE observacoes LIKE '[TESTE]%';
DELETE FROM produtos WHERE nome LIKE '[TESTE]%';
DELETE FROM materiais WHERE nome LIKE '[TESTE]%';
DELETE FROM clientes WHERE email LIKE '%@teste.com';
DELETE FROM fornecedores WHERE nome_fantasia LIKE '[TESTE]%';

SELECT 'DADOS DE TESTE REMOVIDOS' AS status;
