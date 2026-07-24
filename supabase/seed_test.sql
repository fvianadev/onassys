-- =====================================================
-- SEED DE TESTE UNIFICADO
-- Todos os dados marcados com [TESTE] para limpeza segura
-- Execute: db:del → db:migrate → db:seed:test
-- =====================================================

-- 1) FORNECEDORES
INSERT INTO fornecedores (nome_fantasia, contato, telefone)
VALUES
  ('[TESTE] Atacão', 'João', '(11) 3000-1111'),
  ('[TESTE] Distribuidora', 'Maria', '(11) 3000-2222'),
  ('[TESTE] Laticínios SP', 'Carlos', '(11) 3000-3333');

-- 2) MATERIAIS (20 insumos)
INSERT INTO materiais (id, nome, unidade_id, quantidade_atual, quantidade_minima, custo_unitario, fornecedor_id)
SELECT 'mat_t01', '[TESTE] Farinha', 1, 50, 10, 5.50, id FROM fornecedores WHERE nome_fantasia = '[TESTE] Atacão'
UNION ALL SELECT 'mat_t02', '[TESTE] Açúcar', 1, 30, 5, 4.20, id FROM fornecedores WHERE nome_fantasia = '[TESTE] Atacão'
UNION ALL SELECT 'mat_t03', '[TESTE] Leite', 3, 20, 5, 6.00, id FROM fornecedores WHERE nome_fantasia = '[TESTE] Laticínios SP'
UNION ALL SELECT 'mat_t04', '[TESTE] Manteiga', 1, 10, 2, 22.00, id FROM fornecedores WHERE nome_fantasia = '[TESTE] Laticínios SP'
UNION ALL SELECT 'mat_t05', '[TESTE] Ovos', 5, 120, 24, 0.80, id FROM fornecedores WHERE nome_fantasia = '[TESTE] Atacão'
UNION ALL SELECT 'mat_t06', '[TESTE] Óleo', 3, 15, 5, 8.50, id FROM fornecedores WHERE nome_fantasia = '[TESTE] Atacão'
UNION ALL SELECT 'mat_t07', '[TESTE] Sal', 2, 500, 100, 0.03, id FROM fornecedores WHERE nome_fantasia = '[TESTE] Atacão'
UNION ALL SELECT 'mat_t08', '[TESTE] Fermento', 2, 200, 50, 0.12, id FROM fornecedores WHERE nome_fantasia = '[TESTE] Distribuidora'
UNION ALL SELECT 'mat_t09', '[TESTE] Frango', 1, 8, 3, 18.00, id FROM fornecedores WHERE nome_fantasia = '[TESTE] Atacão'
UNION ALL SELECT 'mat_t10', '[TESTE] Catupiry', 1, 5, 2, 25.00, id FROM fornecedores WHERE nome_fantasia = '[TESTE] Laticínios SP'
UNION ALL SELECT 'mat_t11', '[TESTE] Chocolate', 1, 6, 2, 30.00, id FROM fornecedores WHERE nome_fantasia = '[TESTE] Distribuidora'
UNION ALL SELECT 'mat_t12', '[TESTE] Creme de leite', 2, 40, 10, 4.50, id FROM fornecedores WHERE nome_fantasia = '[TESTE] Laticínios SP'
UNION ALL SELECT 'mat_t13', '[TESTE] Leite condensado', 2, 30, 8, 5.00, id FROM fornecedores WHERE nome_fantasia = '[TESTE] Laticínios SP'
UNION ALL SELECT 'mat_t14', '[TESTE] Coco', 2, 15, 5, 7.00, id FROM fornecedores WHERE nome_fantasia = '[TESTE] Distribuidora'
UNION ALL SELECT 'mat_t15', '[TESTE] Canela', 2, 20, 5, 3.00, id FROM fornecedores WHERE nome_fantasia = '[TESTE] Distribuidora'
UNION ALL SELECT 'mat_t16', '[TESTE] Orégano', 2, 25, 5, 4.00, id FROM fornecedores WHERE nome_fantasia = '[TESTE] Distribuidora'
UNION ALL SELECT 'mat_t17', '[TESTE] Cebola', 1, 10, 3, 6.00, id FROM fornecedores WHERE nome_fantasia = '[TESTE] Atacão'
UNION ALL SELECT 'mat_t18', '[TESTE] Alho', 1, 5, 2, 12.00, id FROM fornecedores WHERE nome_fantasia = '[TESTE] Atacão'
UNION ALL SELECT 'mat_t19', '[TESTE] Presunto', 1, 4, 1, 28.00, id FROM fornecedores WHERE nome_fantasia = '[TESTE] Laticínios SP'
UNION ALL SELECT 'mat_t20', '[TESTE] Mussarela', 1, 6, 2, 32.00, id FROM fornecedores WHERE nome_fantasia = '[TESTE] Laticínios SP';

-- 3) CLIENTES (5)
INSERT INTO clientes (id, nome, tipo_id, telefone, email, endereco)
VALUES
  ('cli_t01', '[TESTE] Lanchonete Central', 1, '(11) 99999-0001', 'central@teste.com', 'Rua A, 123'),
  ('cli_t02', '[TESTE] Buffet Festa', 2, '(11) 99999-0002', 'festa@teste.com', 'Av B, 456'),
  ('cli_t03', '[TESTE] Maria Silva', 3, '(11) 99999-0003', 'maria@teste.com', 'Rua C, 789'),
  ('cli_t04', '[TESTE] Padaria São João', 1, '(11) 99999-0004', 'saojoao@teste.com', 'Rua D, 321'),
  ('cli_t05', '[TESTE] Confeitaria Doce', 2, '(11) 99999-0005', 'doce@teste.com', 'Av E, 654');

-- 4) PRODUTOS (5)
INSERT INTO produtos (id, nome, categoria_id, descricao, unidade_producao_id, tempo_producao_minutos, custo_producao_calculado, ativo, margem_lucro, preco_venda)
VALUES
  ('prod_t01', '[TESTE] Coxinha', 1, '[TESTE] Coxinha de frango', 5, 45, 3.50, true, 100, 8.00),
  ('prod_t02', '[TESTE] Brigadeiro', 2, '[TESTE] Brigadeiro gourmet', 5, 20, 1.20, true, 150, 3.00),
  ('prod_t03', '[TESTE] Bolo', 3, '[TESTE] Bolo de cenoura', 1, 60, 18.00, true, 120, 45.00),
  ('prod_t04', '[TESTE] Pastel', 1, '[TESTE] Pastel de carne', 5, 30, 2.80, true, 100, 6.00),
  ('prod_t05', '[TESTE] Pizza', 1, '[TESTE] Pizza margherita', 1, 40, 22.00, true, 80, 60.00);

-- 5) FICHAS TÉCNICAS
INSERT INTO fichas_tecnicas (id, produto_id, material_id, quantidade_necessaria, unidade_id)
VALUES
  ('ft_t01', 'prod_t01', 'mat_t01', 0.500, 1),  -- Coxinha: farinha
  ('ft_t02', 'prod_t01', 'mat_t09', 0.300, 1),  -- Coxinha: frango
  ('ft_t03', 'prod_t01', 'mat_t10', 0.100, 1),  -- Coxinha: catupiry
  ('ft_t04', 'prod_t01', 'mat_t05', 1.000, 5),  -- Coxinha: ovo
  ('ft_t05', 'prod_t02', 'mat_t02', 0.200, 1),  -- Brigadeiro: açúcar
  ('ft_t06', 'prod_t02', 'mat_t03', 0.200, 3),  -- Brigadeiro: leite
  ('ft_t07', 'prod_t02', 'mat_t04', 0.050, 1),  -- Brigadeiro: manteiga
  ('ft_t08', 'prod_t02', 'mat_t11', 0.100, 1),  -- Brigadeiro: chocolate
  ('ft_t09', 'prod_t03', 'mat_t01', 0.300, 1),  -- Bolo: farinha
  ('ft_t10', 'prod_t03', 'mat_t02', 0.250, 1),  -- Bolo: açúcar
  ('ft_t11', 'prod_t03', 'mat_t05', 3.000, 5),  -- Bolo: ovos
  ('ft_t12', 'prod_t03', 'mat_t06', 0.150, 3),  -- Bolo: óleo
  ('ft_t13', 'prod_t04', 'mat_t01', 0.400, 1),  -- Pastel: farinha
  ('ft_t14', 'prod_t04', 'mat_t19', 0.150, 1),  -- Pastel: presunto
  ('ft_t15', 'prod_t04', 'mat_t20', 0.100, 1),  -- Pastel: mussarela
  ('ft_t16', 'prod_t05', 'mat_t01', 0.400, 1),  -- Pizza: farinha
  ('ft_t17', 'prod_t05', 'mat_t20', 0.200, 1),  -- Pizza: mussarela
  ('ft_t18', 'prod_t05', 'mat_t16', 0.020, 2),  -- Pizza: orégano
  ('ft_t19', 'prod_t05', 'mat_t17', 0.050, 1),  -- Pizza: cebola
  ('ft_t20', 'prod_t05', 'mat_t18', 0.020, 1);  -- Pizza: alho

-- 6) ESTOQUE PRODUTOS
INSERT INTO estoque_produtos (id, produto_id, quantidade_disponivel, quantidade_minima)
VALUES
  ('est_t01', 'prod_t01', 30, 10),
  ('est_t02', 'prod_t02', 50, 15),
  ('est_t03', 'prod_t03', 5, 2),
  ('est_t04', 'prod_t04', 20, 8),
  ('est_t05', 'prod_t05', 3, 1);

-- 7) PEDIDOS (10 — variados status, últimos 30 dias)
INSERT INTO pedidos (id, cliente_id, data_pedido, data_entrega_prevista, status_id, observacoes, valor_total, desconto_valor, criado_by, categoria_receita_id)
VALUES
  -- Entregues (status 5)
  ('ped_t01', 'cli_t01', NOW() - INTERVAL '28 days', NOW() - INTERVAL '27 days', 5, '[TESTE] Pedido regular lanchonete', 120.00, 0, 'Admin', 1),
  ('ped_t02', 'cli_t02', NOW() - INTERVAL '25 days', NOW() - INTERVAL '24 days', 5, '[TESTE] Festas de aniversário', 240.00, 10, 'Admin', 1),
  ('ped_t03', 'cli_t03', NOW() - INTERVAL '20 days', NOW() - INTERVAL '19 days', 5, '[TESTE] Compra pessoa particular', 80.00, 0, 'Admin', 1),
  ('ped_t04', 'cli_t04', NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days', 5, '[TESTE] Padaria reposição', 180.00, 0, 'Admin', 1),
  ('ped_t05', 'cli_t05', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', 5, '[TESTE] Confeitaria encomenda', 350.00, 20, 'Admin', 1),
  -- Em produção / pronto (status 3-4)
  ('ped_t06', 'cli_t01', NOW() - INTERVAL '5 days', NOW() + INTERVAL '1 day', 3, '[TESTE] Pedido em andamento', 95.00, 0, 'Admin', 1),
  ('ped_t07', 'cli_t02', NOW() - INTERVAL '3 days', NOW() + INTERVAL '2 days', 4, '[TESTE] Pronto para entrega', 200.00, 0, 'Admin', 1),
  -- Confirmados (status 2)
  ('ped_t08', 'cli_t03', NOW() - INTERVAL '2 days', NOW() + INTERVAL '3 days', 2, '[TESTE] Confirmado aguardando', 65.00, 0, 'Admin', 1),
  ('ped_t09', 'cli_t04', NOW() - INTERVAL '1 day', NOW() + INTERVAL '4 days', 2, '[TESTE] Pedido confirmado padaria', 110.00, 0, 'Admin', 1),
  -- Rascunho (status 1)
  ('ped_t10', 'cli_t05', NOW(), NOW() + INTERVAL '5 days', 1, '[TESTE] Rascunho pedido grande', 450.00, 50, 'Admin', 1);

-- 8) ITENS PEDIDO (~25)
INSERT INTO itens_pedido (id, pedido_id, produto_id, quantidade_solicitada, quantidade_produzida, preco_unitario, observacao)
VALUES
  -- ped_t01: Lanchonete
  ('ip_t01', 'ped_t01', 'prod_t01', 10, 10, 8.00, '[TESTE]'),
  ('ip_t02', 'ped_t01', 'prod_t02', 20, 20, 3.00, '[TESTE]'),
  -- ped_t02: Buffet
  ('ip_t03', 'ped_t02', 'prod_t02', 60, 60, 3.00, '[TESTE]'),
  ('ip_t04', 'ped_t02', 'prod_t01', 15, 15, 8.00, '[TESTE]'),
  -- ped_t03: Particular
  ('ip_t05', 'ped_t03', 'prod_t03', 1, 1, 45.00, '[TESTE]'),
  ('ip_t06', 'ped_t03', 'prod_t02', 10, 10, 3.00, '[TESTE]'),
  -- ped_t04: Padaria
  ('ip_t07', 'ped_t04', 'prod_t01', 15, 15, 8.00, '[TESTE]'),
  ('ip_t08', 'ped_t04', 'prod_t04', 10, 10, 6.00, '[TESTE]'),
  -- ped_t05: Confeitaria
  ('ip_t09', 'ped_t05', 'prod_t03', 5, 5, 45.00, '[TESTE]'),
  ('ip_t10', 'ped_t05', 'prod_t05', 3, 3, 60.00, '[TESTE]'),
  -- ped_t06: Em produção
  ('ip_t11', 'ped_t06', 'prod_t01', 8, 5, 8.00, '[TESTE]'),
  ('ip_t12', 'ped_t06', 'prod_t02', 10, 0, 3.00, '[TESTE]'),
  -- ped_t07: Pronto
  ('ip_t13', 'ped_t07', 'prod_t05', 2, 2, 60.00, '[TESTE]'),
  ('ip_t14', 'ped_t07', 'prod_t04', 10, 10, 6.00, '[TESTE]'),
  -- ped_t08: Confirmado
  ('ip_t15', 'ped_t08', 'prod_t02', 15, 0, 3.00, '[TESTE]'),
  ('ip_t16', 'ped_t08', 'prod_t01', 5, 0, 8.00, '[TESTE]'),
  -- ped_t09: Confirmado
  ('ip_t17', 'ped_t09', 'prod_t01', 10, 0, 8.00, '[TESTE]'),
  ('ip_t18', 'ped_t09', 'prod_t03', 1, 0, 45.00, '[TESTE]'),
  -- ped_t10: Rascunho
  ('ip_t19', 'ped_t10', 'prod_t05', 5, 0, 60.00, '[TESTE]'),
  ('ip_t20', 'ped_t10', 'prod_t01', 20, 0, 8.00, '[TESTE]'),
  ('ip_t21', 'ped_t10', 'prod_t02', 30, 0, 3.00, '[TESTE]');

-- 9) MOVIMENTAÇÕES MATERIAIS (entradas de compra)
INSERT INTO movimentacoes_materiais (id, material_id, tipo_id, quantidade, custo_unitario, valor_pago, observacao)
VALUES
  ('mov_mt01', 'mat_t01', 1, 50, 5.50, 275.00, '[TESTE] Compra farinha lote 1'),
  ('mov_mt02', 'mat_t02', 1, 30, 4.20, 126.00, '[TESTE] Compra açúcar'),
  ('mov_mt03', 'mat_t05', 1, 120, 0.80, 96.00, '[TESTE] Compra ovos'),
  ('mov_mt04', 'mat_t09', 1, 8, 18.00, 144.00, '[TESTE] Compra frango'),
  ('mov_mt05', 'mat_t11', 1, 6, 30.00, 180.00, '[TESTE] Compra chocolate'),
  ('mov_mt06', 'mat_t03', 1, 20, 6.00, 120.00, '[TESTE] Compra leite'),
  ('mov_mt07', 'mat_t04', 1, 10, 22.00, 220.00, '[TESTE] Compra manteiga'),
  ('mov_mt08', 'mat_t20', 1, 6, 32.00, 192.00, '[TESTE] Compra mussarela');

-- 10) MOVIMENTAÇÕES PRODUTOS (saídas de entrega)
INSERT INTO movimentacoes_produtos (id, produto_id, tipo_id, quantidade, pedido_id, observacao)
VALUES
  ('mov_pt01', 'prod_t01', 6, 10, 'ped_t01', '[TESTE] Entrega lanchonete'),
  ('mov_pt02', 'prod_t02', 6, 20, 'ped_t01', '[TESTE] Entrega lanchonete'),
  ('mov_pt03', 'prod_t02', 6, 60, 'ped_t02', '[TESTE] Entrega buffet'),
  ('mov_pt04', 'prod_t01', 6, 15, 'ped_t02', '[TESTE] Entrega buffet'),
  ('mov_pt05', 'prod_t03', 6, 1, 'ped_t03', '[TESTE] Entrega particular'),
  ('mov_pt06', 'prod_t01', 6, 15, 'ped_t04', '[TESTE] Entrega padaria'),
  ('mov_pt07', 'prod_t04', 6, 10, 'ped_t04', '[TESTE] Entrega padaria'),
  ('mov_pt08', 'prod_t03', 6, 5, 'ped_t05', '[TESTE] Entrega confeitaria'),
  ('mov_pt09', 'prod_t05', 6, 3, 'ped_t05', '[TESTE] Entrega confeitaria');

-- 11) LANÇAMENTOS FINANCEIROS (receitas + despesas dos últimos 30 dias)
INSERT INTO lancamentos_financeiros (data_lancamento, valor, tipo, categoria_id, descricao, pedido_id, forma_pagamento)
VALUES
  -- Receitas (vendas)
  ((NOW() - INTERVAL '28 days')::DATE, 120.00, 'receita', 1, '[TESTE] Venda lanchonete', 'ped_t01', 'Pix'),
  ((NOW() - INTERVAL '25 days')::DATE, 240.00, 'receita', 1, '[TESTE] Venda buffet', 'ped_t02', 'Dinheiro'),
  ((NOW() - INTERVAL '20 days')::DATE, 80.00, 'receita', 1, '[TESTE] Venda particular', 'ped_t03', 'Crédito'),
  ((NOW() - INTERVAL '15 days')::DATE, 180.00, 'receita', 1, '[TESTE] Venda padaria', 'ped_t04', 'Débito'),
  ((NOW() - INTERVAL '10 days')::DATE, 350.00, 'receita', 1, '[TESTE] Venda confeitaria', 'ped_t05', 'Pix'),
  -- Despesas (compras de insumos)
  ((NOW() - INTERVAL '27 days')::DATE, 275.00, 'despesa', 2, '[TESTE] Compra farinha', NULL, 'Pix'),
  ((NOW() - INTERVAL '24 days')::DATE, 126.00, 'despesa', 2, '[TESTE] Compra açúcar', NULL, 'Dinheiro'),
  ((NOW() - INTERVAL '22 days')::DATE, 96.00, 'despesa', 2, '[TESTE] Compra ovos', NULL, 'Pix'),
  ((NOW() - INTERVAL '18 days')::DATE, 144.00, 'despesa', 2, '[TESTE] Compra frango', NULL, 'Débito'),
  ((NOW() - INTERVAL '14 days')::DATE, 180.00, 'despesa', 2, '[TESTE] Compra chocolate', NULL, 'Crédito'),
  ((NOW() - INTERVAL '12 days')::DATE, 120.00, 'despesa', 2, '[TESTE] Compra leite', NULL, 'Pix'),
  ((NOW() - INTERVAL '8 days')::DATE, 220.00, 'despesa', 2, '[TESTE] Compra manteiga', NULL, 'Dinheiro'),
  ((NOW() - INTERVAL '5 days')::DATE, 192.00, 'despesa', 2, '[TESTE] Compra mussarela', NULL, 'Pix');

SELECT 'SEED DE TESTE INSERIDO' AS status;
