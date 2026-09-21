import test from "node:test";
import assert from "node:assert/strict";
import type { ControlPrismaClient } from "@base/db-control";
import type { TenantPrismaClient, TenantPrisma } from "@base/db-tenant";
import { DepartmentService } from "./department/service";
import { PositionService } from "./position/service";
import { EmployeeManagementService } from "./employee/service";

interface FakeDepartment {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  leaderMemberId: string | null;
  sort: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface FakePosition {
  id: string;
  name: string;
  code: string;
  description: string | null;
  sort: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface FakeEmployeeProfile {
  id: string;
  memberId: string | null;
  userId: string | null;
  invitationId: string | null;
  employeeNo: string | null;
  departmentId: string | null;
  positionId: string | null;
  managerEmployeeId: string | null;
  nameSnapshot: string;
  emailSnapshot: string;
  jobTitle: string | null;
  avatarUrl?: string | null;
  status: string;
  joinedAt: Date | null;
  terminatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface FakeUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
}

interface FakeMember {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  user?: FakeUser;
}

interface FakeAccount {
  id: string;
  accountId: string;
  providerId: string;
  userId: string;
  password?: string;
}

test("DepartmentService 部门树形层级加载、防环调换与 Fail-Closed 删除防护", async () => {
  const departments: FakeDepartment[] = [
    {
      id: "dept_root",
      name: "企业总公司",
      code: "ROOT",
      parentId: null,
      leaderMemberId: "mem_gm",
      sort: 0,
      status: "ACTIVE",
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    },
    {
      id: "dept_sales",
      name: "销售中心",
      code: "SALES",
      parentId: "dept_root",
      leaderMemberId: null,
      sort: 1,
      status: "ACTIVE",
      createdAt: new Date("2026-01-02"),
      updatedAt: new Date("2026-01-02"),
    },
    {
      id: "dept_sales_east",
      name: "华东销售部",
      code: "SALES_EAST",
      parentId: "dept_sales",
      leaderMemberId: null,
      sort: 1,
      status: "ACTIVE",
      createdAt: new Date("2026-01-03"),
      updatedAt: new Date("2026-01-03"),
    },
  ];

  const employees: FakeEmployeeProfile[] = [
    {
      id: "emp_1",
      memberId: "mem_gm",
      userId: "usr_gm",
      invitationId: null,
      employeeNo: "E0001",
      departmentId: "dept_root",
      positionId: "pos_gm",
      managerEmployeeId: null,
      nameSnapshot: "张总",
      emailSnapshot: "gm@example.com",
      jobTitle: "总经理",
      status: "ACTIVE",
      joinedAt: new Date(),
      terminatedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "emp_2",
      memberId: "mem_sales",
      userId: "usr_sales",
      invitationId: null,
      employeeNo: "E0002",
      departmentId: "dept_sales_east",
      positionId: "pos_sp",
      managerEmployeeId: "emp_1",
      nameSnapshot: "李销售",
      emailSnapshot: "sales@example.com",
      jobTitle: "销售专员",
      status: "ACTIVE",
      joinedAt: new Date(),
      terminatedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const orders: Array<{ id: string; deptId: string }> = [
    { id: "po_1", deptId: "dept_sales_east" },
  ];

  const mockTenantPrisma = {
    department: {
      async findMany() {
        return [...departments].sort((a, b) => a.sort - b.sort);
      },
      async findUnique({ where }: { where: { id?: string; code?: string } }) {
        if (where.id) return departments.find((d) => d.id === where.id) ?? null;
        if (where.code)
          return departments.find((d) => d.code === where.code) ?? null;
        return null;
      },
      async create({ data }: { data: FakeDepartment }) {
        const item = {
          ...data,
          id: data.id ?? `dept_mock_${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        departments.push(item);
        return item;
      },
      async update({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<FakeDepartment>;
      }) {
        const idx = departments.findIndex((d) => d.id === where.id);
        if (idx === -1) throw new Error("Not found");
        departments[idx] = { ...departments[idx], ...data };
        return departments[idx];
      },
      async delete({ where }: { where: { id: string } }) {
        const idx = departments.findIndex((d) => d.id === where.id);
        if (idx !== -1) departments.splice(idx, 1);
      },
      async count({ where }: { where: { parentId?: string } }) {
        if (where.parentId) {
          return departments.filter((d) => d.parentId === where.parentId)
            .length;
        }
        return 0;
      },
    },
    employeeProfile: {
      async groupBy({
        by,
        where,
      }: {
        by: string[];
        where: { status: string; departmentId: { not: null } };
      }) {
        if (by.includes("departmentId")) {
          const map = new Map<string, number>();
          for (const emp of employees) {
            if (emp.status === where.status && emp.departmentId) {
              map.set(emp.departmentId, (map.get(emp.departmentId) ?? 0) + 1);
            }
          }
          return Array.from(map.entries()).map(([departmentId, count]) => ({
            departmentId,
            _count: { _all: count },
          }));
        }
        return [];
      },
      async findMany({ where }: { where: { memberId?: { in: string[] } } }) {
        if (where.memberId?.in) {
          return employees.filter(
            (e) => e.memberId && where.memberId!.in.includes(e.memberId),
          );
        }
        return employees;
      },
      async findUnique({ where }: { where: { memberId?: string } }) {
        if (where.memberId) {
          return employees.find((e) => e.memberId === where.memberId) ?? null;
        }
        return null;
      },
      async count({
        where,
      }: {
        where: { departmentId?: string; status?: { not: string } };
      }) {
        return employees.filter((e) => {
          if (where.departmentId && e.departmentId !== where.departmentId)
            return false;
          if (where.status?.not && e.status === where.status.not) return false;
          return true;
        }).length;
      },
    },
    purchaseOrder: {
      async count({ where }: { where: { deptId: string } }) {
        return orders.filter((o) => o.deptId === where.deptId).length;
      },
    },
  } as unknown as TenantPrismaClient;

  const service = new DepartmentService();

  // 1. 树形层级加载
  const tree = await service.listDepartmentTree(mockTenantPrisma);
  assert.equal(tree.length, 1);
  assert.equal(tree[0].code, "ROOT");
  assert.equal(tree[0].leaderName, "张总");
  assert.equal(tree[0].employeeCount, 1);
  assert.equal(tree[0].children.length, 1);
  assert.equal(tree[0].children[0].code, "SALES");
  assert.equal(tree[0].children[0].children[0].code, "SALES_EAST");
  assert.equal(tree[0].children[0].children[0].employeeCount, 1);

  // 2. 创建部门
  const newDept = await service.createDepartment(mockTenantPrisma, {
    name: "采购中心",
    code: "PROCUREMENT",
    parentId: "dept_root",
    sort: 2,
  });
  assert.equal(newDept.code, "PROCUREMENT");

  // 校验编码唯一性
  await assert.rejects(
    () =>
      service.createDepartment(mockTenantPrisma, {
        name: "采购中心2",
        code: "PROCUREMENT",
      }),
    /已存在/,
  );

  // 3. 防环检测测试
  // (a) 不能将上级设为自己
  await assert.rejects(
    () =>
      service.updateDepartment(mockTenantPrisma, "dept_sales", {
        parentId: "dept_sales",
      }),
    /无法将部门的上级设置为其自身/,
  );

  // (b) 不能将上级设为子孙后代 (SALES 的子孙是 SALES_EAST，将 SALES 的父设为 SALES_EAST 会导致环)
  await assert.rejects(
    () =>
      service.updateDepartment(mockTenantPrisma, "dept_sales", {
        parentId: "dept_sales_east",
      }),
    /循环依赖/,
  );

  // 4. Fail-Closed 删除保护
  // (a) 存在子部门时禁止删除 (dept_sales 下有 dept_sales_east)
  await assert.rejects(
    () => service.deleteDepartment(mockTenantPrisma, "dept_sales"),
    /存在子部门/,
  );

  // (b) 存在在职员工时禁止删除 (dept_sales_east 下有 emp_2)
  await assert.rejects(
    () => service.deleteDepartment(mockTenantPrisma, "dept_sales_east"),
    /仍有在职员工/,
  );

  // (c) 清理员工后，有关联订单依然禁止删除
  employees.pop(); // 移除 emp_2
  await assert.rejects(
    () => service.deleteDepartment(mockTenantPrisma, "dept_sales_east"),
    /已关联历史业务单据/,
  );

  // (d) 空部门 (newDept) 成功删除
  await service.deleteDepartment(mockTenantPrisma, newDept.id);
  const found = departments.find((d) => d.id === newDept.id);
  assert.equal(found, undefined);
});

test("PositionService 岗位字典 CRUD、在职人数统计与删除保护", async () => {
  const positions: FakePosition[] = [
    {
      id: "pos_1",
      name: "采购经理",
      code: "pos_purchasing_mgr",
      description: "负责采购统筹",
      sort: 1,
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "pos_2",
      name: "财务会计",
      code: "pos_accountant",
      description: "负责财务对账",
      sort: 2,
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const employees: FakeEmployeeProfile[] = [
    {
      id: "emp_1",
      memberId: "mem_1",
      userId: "usr_1",
      invitationId: null,
      employeeNo: "E001",
      departmentId: "dept_1",
      positionId: "pos_1",
      managerEmployeeId: null,
      nameSnapshot: "张采购",
      emailSnapshot: "buyer@test.com",
      jobTitle: "主管",
      status: "ACTIVE",
      joinedAt: new Date(),
      terminatedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockTenantPrisma = {
    position: {
      async findMany() {
        return [...positions].sort((a, b) => a.sort - b.sort);
      },
      async findUnique({ where }: { where: { id?: string; code?: string } }) {
        if (where.id) return positions.find((p) => p.id === where.id) ?? null;
        if (where.code)
          return positions.find((p) => p.code === where.code) ?? null;
        return null;
      },
      async create({ data }: { data: FakePosition }) {
        const item = {
          ...data,
          id: `pos_${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        positions.push(item);
        return item;
      },
      async update({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<FakePosition>;
      }) {
        const idx = positions.findIndex((p) => p.id === where.id);
        if (idx === -1) throw new Error("Not found");
        positions[idx] = { ...positions[idx], ...data };
        return positions[idx];
      },
      async delete({ where }: { where: { id: string } }) {
        const idx = positions.findIndex((p) => p.id === where.id);
        if (idx !== -1) positions.splice(idx, 1);
      },
    },
    employeeProfile: {
      async groupBy({
        by,
        where,
      }: {
        by: string[];
        where: { status: string; positionId: { not: null } };
      }) {
        if (by.includes("positionId")) {
          const map = new Map<string, number>();
          for (const emp of employees) {
            if (emp.status === where.status && emp.positionId) {
              map.set(emp.positionId, (map.get(emp.positionId) ?? 0) + 1);
            }
          }
          return Array.from(map.entries()).map(([positionId, count]) => ({
            positionId,
            _count: { _all: count },
          }));
        }
        return [];
      },
      async count({
        where,
      }: {
        where: { positionId?: string; status?: { not: string } };
      }) {
        return employees.filter((e) => {
          if (where.positionId && e.positionId !== where.positionId)
            return false;
          if (where.status?.not && e.status === where.status.not) return false;
          return true;
        }).length;
      },
    },
  } as unknown as TenantPrismaClient;

  const service = new PositionService();

  // 1. 查询列表及在职人数统计
  const list = await service.listPositions(mockTenantPrisma);
  assert.equal(list.length, 2);
  assert.equal(list[0].code, "pos_purchasing_mgr");
  assert.equal(list[0].employeeCount, 1);
  assert.equal(list[1].employeeCount, 0);

  // 2. 创建新岗位
  const created = await service.createPosition(mockTenantPrisma, {
    name: "仓库管理员",
    code: "pos_warehouse_keeper",
    description: "负责出入库",
  });
  assert.equal(created.code, "pos_warehouse_keeper");

  // 3. 启停状态切换
  const toggled = await service.togglePositionStatus(
    mockTenantPrisma,
    created.id,
  );
  assert.equal(toggled.status, "INACTIVE");

  // 4. 删除防护：有关联员工禁止删除
  await assert.rejects(
    () => service.deletePosition(mockTenantPrisma, "pos_1"),
    /仍有关联在职员工/,
  );

  // 无关联员工正常删除
  await service.deletePosition(mockTenantPrisma, created.id);
  assert.equal(
    positions.find((p) => p.id === created.id),
    undefined,
  );
});

test("EmployeeManagementService 直接录入建号、调岗调部门与版本号递增", async () => {
  let authVersion = 1;

  const users: FakeUser[] = [
    {
      id: "usr_existing",
      name: "已有全局用户",
      email: "existing@example.com",
      emailVerified: true,
    },
  ];

  const accounts: FakeAccount[] = [];
  const members: FakeMember[] = [];

  const mockControlPrisma = {
    user: {
      async findUnique({ where }: { where: { email?: string; id?: string } }) {
        if (where.email)
          return users.find((u) => u.email === where.email) ?? null;
        if (where.id) return users.find((u) => u.id === where.id) ?? null;
        return null;
      },
      async create({ data }: { data: FakeUser }) {
        users.push(data);
        return data;
      },
    },
    account: {
      async create({ data }: { data: FakeAccount }) {
        accounts.push(data);
        return data;
      },
    },
    member: {
      async findUnique({
        where,
      }: {
        where: {
          id?: string;
          organizationId_userId?: { organizationId: string; userId: string };
        };
      }) {
        if (where.id) return members.find((m) => m.id === where.id) ?? null;
        if (where.organizationId_userId) {
          return (
            members.find(
              (m) =>
                m.organizationId ===
                  where.organizationId_userId!.organizationId &&
                m.userId === where.organizationId_userId!.userId,
            ) ?? null
          );
        }
        return null;
      },
      async findMany({
        where,
      }: {
        where: { organizationId: string; id?: { in: string[] } };
      }) {
        return members
          .filter((m) => {
            if (m.organizationId !== where.organizationId) return false;
            if (where.id?.in && !where.id.in.includes(m.id)) return false;
            return true;
          })
          .map((m) => ({
            ...m,
            user: users.find((u) => u.id === m.userId),
          }));
      },
      async create({ data }: { data: FakeMember }) {
        members.push(data);
        return data;
      },
      async update({
        where,
        data,
      }: {
        where: { id: string };
        data: { role: string };
      }) {
        const m = members.find((item) => item.id === where.id);
        if (!m) throw new Error("Member not found");
        m.role = data.role;
        return m;
      },
    },
    organization: {
      async update({
        where,
        data,
      }: {
        where: { id: string };
        data: { authorizationVersion?: { increment: number } };
      }) {
        if (data.authorizationVersion?.increment) {
          authVersion += data.authorizationVersion.increment;
        }
        return { id: where.id, authorizationVersion: authVersion };
      },
    },
    tenantAccount: {
      async upsert({
        create,
        update,
      }: {
        create: Record<string, unknown>;
        update: Record<string, unknown>;
      }) {
        return { ...create, ...update };
      },
    },
  } as unknown as ControlPrismaClient;

  const departments: FakeDepartment[] = [
    {
      id: "dept_root",
      name: "总公司",
      code: "ROOT",
      parentId: null,
      leaderMemberId: null,
      sort: 0,
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "dept_dev",
      name: "研发部",
      code: "DEV",
      parentId: "dept_root",
      leaderMemberId: null,
      sort: 1,
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const positions: FakePosition[] = [
    {
      id: "pos_engineer",
      name: "研发工程师",
      code: "pos_dev_eng",
      description: null,
      sort: 1,
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "pos_lead",
      name: "技术主管",
      code: "pos_tech_lead",
      description: null,
      sort: 2,
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const profiles: FakeEmployeeProfile[] = [];

  const mockTenantPrisma = {
    department: {
      async findMany() {
        return departments;
      },
      async findUnique({ where }: { where: { id: string } }) {
        return departments.find((d) => d.id === where.id) ?? null;
      },
    },
    position: {
      async findUnique({ where }: { where: { id: string } }) {
        return positions.find((p) => p.id === where.id) ?? null;
      },
    },
    employeeProfile: {
      async findUnique({
        where,
      }: {
        where: { id?: string; employeeNo?: string };
      }) {
        if (where.id) return profiles.find((p) => p.id === where.id) ?? null;
        if (where.employeeNo)
          return (
            profiles.find((p) => p.employeeNo === where.employeeNo) ?? null
          );
        return null;
      },
      async findMany({
        where,
      }: {
        where?: TenantPrisma.EmployeeProfileWhereInput;
      }) {
        return profiles
          .filter((p) => {
            if (where?.departmentId) {
              const deptFilter = where.departmentId;
              if (
                typeof deptFilter === "object" &&
                deptFilter !== null &&
                "in" in deptFilter &&
                Array.isArray(deptFilter.in)
              ) {
                if (!p.departmentId || !deptFilter.in.includes(p.departmentId))
                  return false;
              } else if (p.departmentId !== deptFilter) {
                return false;
              }
            }
            if (where?.positionId && p.positionId !== where.positionId)
              return false;
            if (where?.status && p.status !== where.status) return false;
            return true;
          })
          .map((p) => ({
            ...p,
            department: departments.find((d) => d.id === p.departmentId),
            position: positions.find((pos) => pos.id === p.positionId),
            manager: profiles.find((m) => m.id === p.managerEmployeeId),
          }));
      },
      async create({ data }: { data: FakeEmployeeProfile }) {
        const item: FakeEmployeeProfile = {
          ...data,
          id: `emp_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          invitationId: null,
          joinedAt: new Date(),
          terminatedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        profiles.push(item);
        return {
          ...item,
          department: departments.find((d) => d.id === item.departmentId),
          position: positions.find((pos) => pos.id === item.positionId),
          manager: profiles.find((m) => m.id === item.managerEmployeeId),
        };
      },
      async update({
        where,
        data,
      }: {
        where: { id: string };
        data:
          | TenantPrisma.EmployeeProfileUpdateInput
          | TenantPrisma.EmployeeProfileUncheckedUpdateInput;
      }) {
        const p = profiles.find((item) => item.id === where.id);
        if (!p) throw new Error("Profile not found");
        Object.assign(p, data);
        if ("department" in data && data.department?.connect?.id) {
          p.departmentId = data.department.connect.id;
        } else if ("department" in data && data.department?.disconnect) {
          p.departmentId = null;
        }
        if ("position" in data && data.position?.connect?.id) {
          p.positionId = data.position.connect.id;
        } else if ("position" in data && data.position?.disconnect) {
          p.positionId = null;
        }
        return {
          ...p,
          department: departments.find((d) => d.id === p.departmentId),
          position: positions.find((pos) => pos.id === p.positionId),
          manager: profiles.find((m) => m.id === p.managerEmployeeId),
        };
      },
    },
  } as unknown as TenantPrismaClient;

  const service = new EmployeeManagementService();

  // 1. 直接录入建号新员工 (自动创建 User + Account + Member + Profile + authVersion++)
  const newEmp = await service.directCreateEmployee(
    mockTenantPrisma,
    mockControlPrisma,
    "org_test",
    {
      name: "新员工小王",
      email: "wang@example.com",
      employeeNo: "E1001",
      departmentId: "dept_dev",
      positionId: "pos_engineer",
      initialRoleCodes: ["buyer"],
      password: "Password123!",
    },
  );

  assert.equal(newEmp.name, "新员工小王");
  assert.equal(newEmp.email, "wang@example.com");
  assert.equal(newEmp.status, "ACTIVE");
  assert.equal(newEmp.roles[0], "buyer");
  assert.equal(authVersion, 2); // authorizationVersion incremented

  // 验证 Account 凭证已正确哈希
  const createdAccount = accounts.find((a) => a.userId === newEmp.userId);
  assert.ok(createdAccount?.password && createdAccount.password.length > 20);

  // 2. 复用已有全局用户开通当前租户
  const emp2 = await service.directCreateEmployee(
    mockTenantPrisma,
    mockControlPrisma,
    "org_test",
    {
      name: "已有全局用户",
      email: "existing@example.com",
      employeeNo: "E1002",
      departmentId: "dept_root",
      positionId: "pos_lead",
      initialRoleCodes: ["admin"],
    },
  );
  assert.equal(emp2.userId, "usr_existing");
  assert.equal(emp2.roles[0], "admin");
  assert.equal(authVersion, 3);

  // 3. 员工列表多维联动检索 (按部门树下推过滤)
  const allList = await service.listEmployees(
    mockTenantPrisma,
    mockControlPrisma,
    "org_test",
  );
  assert.equal(allList.length, 2);

  // 包含子部门查询 ROOT，应当返回 ROOT 与 DEV 下全部员工
  const treeList = await service.listEmployees(
    mockTenantPrisma,
    mockControlPrisma,
    "org_test",
    {
      departmentId: "dept_root",
      includeChildren: true,
    },
  );
  assert.equal(treeList.length, 2);

  // 仅查询 DEV 部门
  const devList = await service.listEmployees(
    mockTenantPrisma,
    mockControlPrisma,
    "org_test",
    {
      departmentId: "dept_dev",
      includeChildren: false,
    },
  );
  assert.equal(devList.length, 1);
  assert.equal(devList[0].employeeNo, "E1001");

  // 4. 调部门：验证 departmentId 更新且 authorizationVersion++
  await service.transferDepartment(
    mockTenantPrisma,
    mockControlPrisma,
    "org_test",
    {
      employeeId: newEmp.id,
      targetDepartmentId: "dept_root",
    },
  );
  const updatedEmp1 = profiles.find((p) => p.id === newEmp.id);
  assert.equal(updatedEmp1?.departmentId, "dept_root");
  assert.equal(authVersion, 4);

  // 5. 调岗位：遵循 Position != Role，更新 positionId 且不自增权限版本
  await service.transferPosition(mockTenantPrisma, {
    employeeId: newEmp.id,
    targetPositionId: "pos_lead",
  });
  assert.equal(updatedEmp1?.positionId, "pos_lead");
  assert.equal(authVersion, 4); // 没有自增权限版本

  // 6. 升降角色：更新 Member.role 且 authorizationVersion++
  await service.transferRoles(mockControlPrisma, "org_test", {
    memberId: newEmp.memberId!,
    newRoleCodes: ["admin", "buyer"],
  });
  const member = members.find((m) => m.id === newEmp.memberId);
  assert.equal(member?.role, "admin,buyer");
  assert.equal(authVersion, 5);

  // 7. 停用与恢复：停用自增 authorizationVersion++，驱动 Access Gate 立即拦截
  await service.suspendEmployee(
    mockTenantPrisma,
    mockControlPrisma,
    "org_test",
    newEmp.id,
  );
  assert.equal(updatedEmp1?.status, "SUSPENDED");
  assert.equal(authVersion, 6);

  await service.resumeEmployee(
    mockTenantPrisma,
    mockControlPrisma,
    "org_test",
    newEmp.id,
  );
  assert.equal(updatedEmp1?.status, "ACTIVE");
  assert.equal(authVersion, 7);

  // 8. 设置主管：防自环校验
  await assert.rejects(
    () => service.updateManager(mockTenantPrisma, newEmp.id, newEmp.id),
    /直属主管不能指定为员工本人/,
  );
});
