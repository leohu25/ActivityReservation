-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "activity" (
    "id" UUID NOT NULL,
    "venue_id" UUID NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "cover_url" VARCHAR(500),
    "description" TEXT,
    "type" VARCHAR(30) NOT NULL DEFAULT 'GENERAL',
    "audit_mode" VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
    "allow_team" BOOLEAN NOT NULL DEFAULT true,
    "min_team_size" INTEGER NOT NULL DEFAULT 5,
    "max_team_size" INTEGER NOT NULL DEFAULT 50,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000',
    "dept_id" UUID,
    "updated_by_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_session" (
    "id" UUID NOT NULL,
    "activity_id" UUID NOT NULL,
    "space_id" UUID,
    "date" VARCHAR(20) NOT NULL,
    "start_time" VARCHAR(10) NOT NULL,
    "end_time" VARCHAR(10) NOT NULL,
    "total_capacity" INTEGER NOT NULL DEFAULT 50,
    "booked_count" INTEGER NOT NULL DEFAULT 0,
    "lecturer_id" UUID,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000',
    "dept_id" UUID,
    "updated_by_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "activity_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "type" VARCHAR(20) NOT NULL DEFAULT 'INDIVIDUAL',
    "applicant_name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "id_card" VARCHAR(50),
    "organization" VARCHAR(150),
    "people_count" INTEGER NOT NULL DEFAULT 1,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "audit_remark" VARCHAR(255),
    "audited_by_id" UUID,
    "audited_at" TIMESTAMP(3),
    "qr_code_sign" VARCHAR(255),
    "checked_in_at" TIMESTAMP(3),
    "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000',
    "dept_id" UUID,
    "updated_by_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_team" (
    "id" UUID NOT NULL,
    "appointment_id" UUID NOT NULL,
    "team_name" VARCHAR(150) NOT NULL,
    "invite_code" VARCHAR(20) NOT NULL,
    "leader_name" VARCHAR(100) NOT NULL,
    "leader_phone" VARCHAR(50) NOT NULL,
    "contact_email" VARCHAR(100),
    "target_count" INTEGER NOT NULL DEFAULT 10,
    "joined_count" INTEGER NOT NULL DEFAULT 1,
    "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000',
    "dept_id" UUID,
    "updated_by_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointment_team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_visitor" (
    "id" UUID NOT NULL,
    "appointment_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(50),
    "id_card" VARCHAR(50),
    "is_leader" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000',
    "dept_id" UUID,
    "updated_by_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointment_visitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachment" (
    "id" UUID NOT NULL,
    "module" VARCHAR(50) NOT NULL,
    "target_id" VARCHAR(64),
    "field_key" VARCHAR(50),
    "file_name" VARCHAR(255) NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "file_url" VARCHAR(1000) NOT NULL,
    "file_size" BIGINT NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000',
    "dept_id" UUID,
    "updated_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,

    CONSTRAINT "attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campus_sync_record" (
    "id" UUID NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "user_code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "department" VARCHAR(150),
    "class_name" VARCHAR(100),
    "id_card" VARCHAR(50),
    "phone" VARCHAR(50),
    "email" VARCHAR(100),
    "sync_status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "error_msg" VARCHAR(500),
    "bound_user_id" UUID,
    "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000',
    "dept_id" UUID,
    "updated_by_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campus_sync_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_profile" (
    "id" UUID NOT NULL,
    "company_name" TEXT NOT NULL,
    "short_name" TEXT,
    "credit_code" TEXT,
    "legal_person" TEXT,
    "contact_phone" TEXT,
    "contact_email" TEXT,
    "address" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Shanghai',
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "parent_id" UUID,
    "leader_member_id" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_profile" (
    "id" UUID NOT NULL,
    "member_id" TEXT,
    "user_id" TEXT,
    "invitation_id" TEXT,
    "employee_no" TEXT,
    "department_id" UUID,
    "position_id" UUID,
    "manager_employee_id" UUID,
    "name" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "phone" TEXT,
    "job_title" TEXT,
    "avatar_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "joined_at" TIMESTAMP(3),
    "terminated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news" (
    "id" UUID NOT NULL,
    "venue_id" UUID,
    "title" VARCHAR(200) NOT NULL,
    "cover_url" VARCHAR(500),
    "summary" VARCHAR(300),
    "content" TEXT NOT NULL,
    "author" VARCHAR(100),
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "is_top" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED',
    "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000',
    "dept_id" UUID,
    "updated_by_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "position" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "space" (
    "id" UUID NOT NULL,
    "venue_id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 50,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "description" VARCHAR(255),
    "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000',
    "dept_id" UUID,
    "updated_by_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "space_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_menu_item" (
    "id" UUID NOT NULL,
    "parent_id" UUID,
    "item_type" TEXT NOT NULL DEFAULT 'PAGE',
    "page_key" TEXT,
    "external_url" TEXT,
    "open_in_new_tab" BOOLEAN NOT NULL DEFAULT false,
    "custom_label" TEXT,
    "custom_icon" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000',
    "dept_id" UUID,
    "updated_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,

    CONSTRAINT "tenant_menu_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venue" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "cover_url" VARCHAR(500),
    "address" VARCHAR(255),
    "open_time" VARCHAR(100),
    "contact_phone" VARCHAR(50),
    "description" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000',
    "dept_id" UUID,
    "updated_by_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volunteer_application" (
    "id" UUID NOT NULL,
    "activity_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "student_no" VARCHAR(50),
    "major" VARCHAR(100),
    "service_role" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "audit_remark" VARCHAR(255),
    "created_by_id" UUID NOT NULL DEFAULT '00000000-0000-7000-8000-000000000000',
    "dept_id" UUID,
    "updated_by_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "volunteer_application_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_venue_id_idx" ON "activity"("venue_id");

-- CreateIndex
CREATE INDEX "activity_status_idx" ON "activity"("status");

-- CreateIndex
CREATE INDEX "activity_start_date_end_date_idx" ON "activity"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "activity_dept_id_idx" ON "activity"("dept_id");

-- CreateIndex
CREATE INDEX "activity_is_deleted_idx" ON "activity"("is_deleted");

-- CreateIndex
CREATE INDEX "activity_session_activity_id_idx" ON "activity_session"("activity_id");

-- CreateIndex
CREATE INDEX "activity_session_date_start_time_idx" ON "activity_session"("date", "start_time");

-- CreateIndex
CREATE INDEX "activity_session_status_idx" ON "activity_session"("status");

-- CreateIndex
CREATE INDEX "activity_session_dept_id_idx" ON "activity_session"("dept_id");

-- CreateIndex
CREATE INDEX "activity_session_is_deleted_idx" ON "activity_session"("is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "appointment_code_key" ON "appointment"("code");

-- CreateIndex
CREATE INDEX "appointment_activity_id_idx" ON "appointment"("activity_id");

-- CreateIndex
CREATE INDEX "appointment_session_id_idx" ON "appointment"("session_id");

-- CreateIndex
CREATE INDEX "appointment_phone_idx" ON "appointment"("phone");

-- CreateIndex
CREATE INDEX "appointment_status_idx" ON "appointment"("status");

-- CreateIndex
CREATE INDEX "appointment_dept_id_idx" ON "appointment"("dept_id");

-- CreateIndex
CREATE INDEX "appointment_is_deleted_idx" ON "appointment"("is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "appointment_team_appointment_id_key" ON "appointment_team"("appointment_id");

-- CreateIndex
CREATE UNIQUE INDEX "appointment_team_invite_code_key" ON "appointment_team"("invite_code");

-- CreateIndex
CREATE INDEX "appointment_team_invite_code_idx" ON "appointment_team"("invite_code");

-- CreateIndex
CREATE INDEX "appointment_team_dept_id_idx" ON "appointment_team"("dept_id");

-- CreateIndex
CREATE INDEX "appointment_team_is_deleted_idx" ON "appointment_team"("is_deleted");

-- CreateIndex
CREATE INDEX "appointment_visitor_appointment_id_idx" ON "appointment_visitor"("appointment_id");

-- CreateIndex
CREATE INDEX "appointment_visitor_dept_id_idx" ON "appointment_visitor"("dept_id");

-- CreateIndex
CREATE INDEX "appointment_visitor_is_deleted_idx" ON "appointment_visitor"("is_deleted");

-- CreateIndex
CREATE INDEX "attachment_target_id_module_idx" ON "attachment"("target_id", "module");

-- CreateIndex
CREATE INDEX "attachment_created_by_id_idx" ON "attachment"("created_by_id");

-- CreateIndex
CREATE INDEX "campus_sync_record_type_sync_status_idx" ON "campus_sync_record"("type", "sync_status");

-- CreateIndex
CREATE INDEX "campus_sync_record_dept_id_idx" ON "campus_sync_record"("dept_id");

-- CreateIndex
CREATE INDEX "campus_sync_record_is_deleted_idx" ON "campus_sync_record"("is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "campus_sync_record_type_user_code_key" ON "campus_sync_record"("type", "user_code");

-- CreateIndex
CREATE UNIQUE INDEX "department_code_key" ON "department"("code");

-- CreateIndex
CREATE INDEX "department_parent_id_idx" ON "department"("parent_id");

-- CreateIndex
CREATE INDEX "department_status_idx" ON "department"("status");

-- CreateIndex
CREATE UNIQUE INDEX "employee_profile_member_id_key" ON "employee_profile"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "employee_profile_employee_no_key" ON "employee_profile"("employee_no");

-- CreateIndex
CREATE INDEX "employee_profile_department_id_idx" ON "employee_profile"("department_id");

-- CreateIndex
CREATE INDEX "employee_profile_position_id_idx" ON "employee_profile"("position_id");

-- CreateIndex
CREATE INDEX "employee_profile_manager_employee_id_idx" ON "employee_profile"("manager_employee_id");

-- CreateIndex
CREATE INDEX "employee_profile_member_id_idx" ON "employee_profile"("member_id");

-- CreateIndex
CREATE INDEX "employee_profile_status_idx" ON "employee_profile"("status");

-- CreateIndex
CREATE INDEX "news_venue_id_idx" ON "news"("venue_id");

-- CreateIndex
CREATE INDEX "news_status_idx" ON "news"("status");

-- CreateIndex
CREATE INDEX "news_dept_id_idx" ON "news"("dept_id");

-- CreateIndex
CREATE INDEX "news_is_deleted_idx" ON "news"("is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "position_code_key" ON "position"("code");

-- CreateIndex
CREATE INDEX "position_status_idx" ON "position"("status");

-- CreateIndex
CREATE INDEX "space_venue_id_idx" ON "space"("venue_id");

-- CreateIndex
CREATE INDEX "space_status_idx" ON "space"("status");

-- CreateIndex
CREATE INDEX "space_dept_id_idx" ON "space"("dept_id");

-- CreateIndex
CREATE INDEX "space_is_deleted_idx" ON "space"("is_deleted");

-- CreateIndex
CREATE INDEX "tenant_menu_item_parent_id_sort_order_idx" ON "tenant_menu_item"("parent_id", "sort_order");

-- CreateIndex
CREATE INDEX "tenant_menu_item_is_deleted_idx" ON "tenant_menu_item"("is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "venue_code_key" ON "venue"("code");

-- CreateIndex
CREATE INDEX "venue_status_idx" ON "venue"("status");

-- CreateIndex
CREATE INDEX "venue_dept_id_idx" ON "venue"("dept_id");

-- CreateIndex
CREATE INDEX "venue_is_deleted_idx" ON "venue"("is_deleted");

-- CreateIndex
CREATE INDEX "volunteer_application_activity_id_idx" ON "volunteer_application"("activity_id");

-- CreateIndex
CREATE INDEX "volunteer_application_phone_idx" ON "volunteer_application"("phone");

-- CreateIndex
CREATE INDEX "volunteer_application_status_idx" ON "volunteer_application"("status");

-- CreateIndex
CREATE INDEX "volunteer_application_dept_id_idx" ON "volunteer_application"("dept_id");

-- CreateIndex
CREATE INDEX "volunteer_application_is_deleted_idx" ON "volunteer_application"("is_deleted");

-- Database Comments
COMMENT ON TABLE "activity" IS '活动表 (Activity)';
COMMENT ON TABLE "activity_session" IS '活动排班场次表 (ActivitySession)';
COMMENT ON TABLE "appointment" IS '预约申请单主表 (Appointment)';
COMMENT ON COLUMN "appointment"."type" IS '预约模式: INDIVIDUAL(个人预约), TEAM(团队拼团预约), INTERNAL(校内内部免审预约)';
COMMENT ON COLUMN "appointment"."status" IS '审批状态: PENDING(待审核), APPROVED(已通过), REJECTED(已驳回), CANCELLED(已取消), CHECKED_IN(已核销入场)';
COMMENT ON TABLE "appointment_team" IS '团队预约扩展信息表 (AppointmentTeam)';
COMMENT ON TABLE "appointment_visitor" IS '预约同行人/访客明细表 (AppointmentVisitor)';
COMMENT ON TABLE "attachment" IS '通用业务附件元数据模型 (Tenant DB 物理隔离，严格对齐 ADR-009 实体审计基线)';
COMMENT ON COLUMN "attachment"."id" IS '附件主键ID';
COMMENT ON COLUMN "attachment"."module" IS '归属业务模块 (如 employee, customer, item 等)';
COMMENT ON COLUMN "attachment"."target_id" IS '关联业务实体主键ID (如员工档案ID、客户ID)';
COMMENT ON COLUMN "attachment"."field_key" IS '业务字段标识 (如 avatar, id_card, attachment 等)';
COMMENT ON COLUMN "attachment"."file_name" IS '原始文件名';
COMMENT ON COLUMN "attachment"."storage_key" IS '对象存储内部 Key';
COMMENT ON COLUMN "attachment"."file_url" IS '访问 URL';
COMMENT ON COLUMN "attachment"."file_size" IS '文件大小 (字节)';
COMMENT ON COLUMN "attachment"."mime_type" IS 'MIME 类型';
COMMENT ON COLUMN "attachment"."created_by_id" IS '创建人 ID (必填，审计基线，UUIDv7)';
COMMENT ON COLUMN "attachment"."dept_id" IS '归属部门 ID (选填，支持部门数据范围权限过滤，UUIDv7)';
COMMENT ON COLUMN "attachment"."updated_by_id" IS '更新人 ID (选填，UUIDv7)';
COMMENT ON COLUMN "attachment"."created_at" IS '创建时间 (必填)';
COMMENT ON COLUMN "attachment"."updated_at" IS '更新时间 (必填)';
COMMENT ON COLUMN "attachment"."is_deleted" IS '软删除标记 (必填)';
COMMENT ON COLUMN "attachment"."deleted_at" IS '软删除时间 (选填)';
COMMENT ON COLUMN "attachment"."deleted_by_id" IS '软删除人 ID (选填，UUIDv7)';
COMMENT ON TABLE "campus_sync_record" IS '教职工与学生组织主数据同步表 (CampusSyncRecord)';
COMMENT ON TABLE "company_profile" IS '租户企业扩展资料模型 (与平台 Organization 动静分离)';
COMMENT ON COLUMN "company_profile"."id" IS '企业扩展资料主键ID';
COMMENT ON COLUMN "company_profile"."company_name" IS '企业主体注册全称';
COMMENT ON COLUMN "company_profile"."short_name" IS '企业简称/品牌名';
COMMENT ON COLUMN "company_profile"."credit_code" IS '统一社会信用代码';
COMMENT ON COLUMN "company_profile"."legal_person" IS '法定代表人姓名';
COMMENT ON COLUMN "company_profile"."contact_phone" IS '官方业务联系电话';
COMMENT ON COLUMN "company_profile"."contact_email" IS '官方业务联系邮箱';
COMMENT ON COLUMN "company_profile"."address" IS '经营办公/注册地址';
COMMENT ON COLUMN "company_profile"."timezone" IS '业务时区 (默认 Asia/Shanghai)';
COMMENT ON COLUMN "company_profile"."currency" IS '结算本位币种 (默认 CNY)';
COMMENT ON COLUMN "company_profile"."created_at" IS '记录创建时间';
COMMENT ON COLUMN "company_profile"."updated_at" IS '记录更新时间';
COMMENT ON TABLE "department" IS '部门拓扑模型 (用于数据范围 DEPT / DEPT_TREE 判定)';
COMMENT ON COLUMN "department"."id" IS '部门主键ID (UUIDv7)';
COMMENT ON COLUMN "department"."name" IS '部门名称';
COMMENT ON COLUMN "department"."code" IS '部门业务编码';
COMMENT ON COLUMN "department"."parent_id" IS '父级部门ID (支持树状拓扑)';
COMMENT ON COLUMN "department"."leader_member_id" IS '部门分管领导/主管成员ID (关联平台 Member.id)';
COMMENT ON COLUMN "department"."sort" IS '显示排序权重 (数字越小越靠前)';
COMMENT ON COLUMN "department"."status" IS '部门状态: ACTIVE(正常) / DISABLED(停用)';
COMMENT ON COLUMN "department"."created_at" IS '创建时间';
COMMENT ON COLUMN "department"."updated_at" IS '更新时间';
COMMENT ON TABLE "employee_profile" IS '租户内员工档案模型 (对应 Control DB Member.id，组织人事与数据范围事实源)';
COMMENT ON COLUMN "employee_profile"."id" IS '员工档案主键ID';
COMMENT ON COLUMN "employee_profile"."member_id" IS '关联平台租户成员主键 (Control DB Member.id)';
COMMENT ON COLUMN "employee_profile"."user_id" IS '关联平台用户账号ID (Control DB User.id)';
COMMENT ON COLUMN "employee_profile"."invitation_id" IS '邀请记录ID (关联邀请审核流)';
COMMENT ON COLUMN "employee_profile"."employee_no" IS '员工工号 (企业内部唯一)';
COMMENT ON COLUMN "employee_profile"."department_id" IS '所属部门主键ID';
COMMENT ON COLUMN "employee_profile"."position_id" IS '所属岗位主键ID';
COMMENT ON COLUMN "employee_profile"."manager_employee_id" IS '直属上级经理档案ID';
COMMENT ON COLUMN "employee_profile"."name" IS '员工姓名';
COMMENT ON COLUMN "employee_profile"."email" IS '员工工作邮箱';
COMMENT ON COLUMN "employee_profile"."phone" IS '员工手机号';
COMMENT ON COLUMN "employee_profile"."job_title" IS '职务头衔/对外称谓';
COMMENT ON COLUMN "employee_profile"."avatar_url" IS '员工头像/工牌照 URL';
COMMENT ON COLUMN "employee_profile"."status" IS '员工在职状态: ACTIVE(在职) / TERMINATED(离职) / SUSPENDED(停职)';
COMMENT ON COLUMN "employee_profile"."joined_at" IS '入职报到时间';
COMMENT ON COLUMN "employee_profile"."terminated_at" IS '离职归档时间';
COMMENT ON COLUMN "employee_profile"."created_at" IS '档案创建时间';
COMMENT ON COLUMN "employee_profile"."updated_at" IS '档案最后更新时间';
COMMENT ON TABLE "news" IS '场馆动态与新闻发布表 (News)';
COMMENT ON TABLE "position" IS '岗位模型 (实现 Position != Role 物理正交解耦)';
COMMENT ON COLUMN "position"."id" IS '岗位主键ID';
COMMENT ON COLUMN "position"."name" IS '岗位名称';
COMMENT ON COLUMN "position"."code" IS '岗位业务编码';
COMMENT ON COLUMN "position"."description" IS '岗位职责详细描述';
COMMENT ON COLUMN "position"."sort" IS '排序权重 (数字越小越靠前)';
COMMENT ON COLUMN "position"."status" IS '岗位状态: ACTIVE(正常) / DISABLED(停用)';
COMMENT ON COLUMN "position"."created_at" IS '创建时间';
COMMENT ON COLUMN "position"."updated_at" IS '更新时间';
COMMENT ON TABLE "space" IS '场所空间表 (Spaces)';
COMMENT ON TABLE "tenant_menu_item" IS '租户动态导航菜单配置模型 (支持现场层级调整、自定义别名与跨切片灵活编排)';
COMMENT ON COLUMN "tenant_menu_item"."id" IS '节点主键ID';
COMMENT ON COLUMN "tenant_menu_item"."parent_id" IS '父节点ID (空表示顶级大菜单/顶级单页)';
COMMENT ON COLUMN "tenant_menu_item"."item_type" IS '节点类型: GROUP(大菜单/目录分组) | PAGE(具体功能页面) | LINK(外部链接)';
COMMENT ON COLUMN "tenant_menu_item"."page_key" IS '关联的标准页面键名 (若 itemType="PAGE"，对应 StandardPageDescriptor.pageKey)';
COMMENT ON COLUMN "tenant_menu_item"."external_url" IS '外部跳转 URL (若 itemType="LINK"，如 "https://bi.company.com")';
COMMENT ON COLUMN "tenant_menu_item"."open_in_new_tab" IS '是否在新标签页打开';
COMMENT ON COLUMN "tenant_menu_item"."custom_label" IS '自定义显示别名 (现场实施重命名；空则使用页面契约 defaultLabel)';
COMMENT ON COLUMN "tenant_menu_item"."custom_icon" IS '自定义图标名称 (空则使用页面契约 defaultIcon)';
COMMENT ON COLUMN "tenant_menu_item"."sort_order" IS '排序权重 (升序排列)';
COMMENT ON COLUMN "tenant_menu_item"."is_visible" IS '是否可见';
COMMENT ON COLUMN "tenant_menu_item"."created_by_id" IS '创建人 ID (UUIDv7，系统写入为 SYSTEM_ACTOR_ID)';
COMMENT ON COLUMN "tenant_menu_item"."dept_id" IS '归属部门 ID (UUIDv7)';
COMMENT ON COLUMN "tenant_menu_item"."updated_by_id" IS '更新人 ID (UUIDv7)';
COMMENT ON COLUMN "tenant_menu_item"."created_at" IS '创建时间';
COMMENT ON COLUMN "tenant_menu_item"."updated_at" IS '更新时间';
COMMENT ON COLUMN "tenant_menu_item"."is_deleted" IS '软删除标记';
COMMENT ON COLUMN "tenant_menu_item"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "tenant_menu_item"."deleted_by_id" IS '软删除人 ID (UUIDv7)';
COMMENT ON TABLE "venue" IS '场馆档案表 (Venues)';
COMMENT ON TABLE "volunteer_application" IS '志愿者申请表 (VolunteerApplication)';
COMMENT ON COLUMN "volunteer_application"."status" IS '状态: PENDING(待审核), APPROVED(已录用), REJECTED(未录取)';
