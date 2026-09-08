-- 降级回滚脚本：按外键依赖逆序移除采购订单与部门表
DROP TABLE IF EXISTS "purchase_order";
DROP TABLE IF EXISTS "department";
