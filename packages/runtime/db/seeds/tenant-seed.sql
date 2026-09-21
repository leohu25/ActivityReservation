-- ==============================================================================
-- 租户默认组织与岗位基线种子数据 (Tenant Base Seed SQL)
-- 适用场景：新租户建库/重置后由迁移引擎显式执行
-- 参数说明：
--   $1: 根部门 ID (UUID)
--   $2: 租户组织全称 (Text)
--   $3: 租户 Owner Member ID (UUID)
--   $4: 总经理岗位 ID (UUID)
--   $5: 部门主管岗位 ID (UUID)
--   $6: 业务专员岗位 ID (UUID)
-- ==============================================================================

WITH ins_dept AS (
  INSERT INTO "department" (
    "id", "name", "code", "parent_id", "leader_member_id", "sort", "status", "created_at", "updated_at"
  ) VALUES (
    $1, $2, 'ROOT', NULL, $3, 0, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ) ON CONFLICT ("code") DO NOTHING
)
INSERT INTO "position" (
  "id", "name", "code", "description", "sort", "status", "created_at", "updated_at"
) VALUES
  ($4, '总经理', 'pos_gm', '企业最高管理负责人', 1, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ($5, '部门主管', 'pos_supervisor', '部门业务管理负责人', 10, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ($6, '业务专员', 'pos_specialist', '基层核心业务经办人员', 20, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;
