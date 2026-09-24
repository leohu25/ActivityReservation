import "server-only";
import { getTenantDbManager } from "@base/db-tenant";
import { getServerAuthRuntime } from "@base/auth";

export async function seedNingweiDemoData(organizationId: string) {
  const runtime = getServerAuthRuntime();
  const manager = getTenantDbManager({ repository: runtime.tenantContextRepository });
  const prisma = await manager.getClient(organizationId);

  // 1. 初始化场馆档案
  const venue = await prisma.venue.upsert({
    where: { code: "VENUE-NW-01" },
    update: {},
    create: {
      code: "VENUE-NW-01",
      name: "宁波卫生职业技术学院校史馆",
      address: "宁波市高教园区学府路88号 图文信息中心1楼",
      openTime: "周二至周日 09:00 - 16:30 (逢周一闭馆)",
      contactPhone: "0574-88888888",
      description: "宁波卫生职业技术学院校史馆是展示学校办学历程、育人成果及医学人文底蕴的核心窗口。",
      isDefault: true,
      createdById: "00000000-0000-7000-8000-000000000000",
    },
  });

  // 2. 初始化场所空间
  const spaceA = await prisma.space.upsert({
    where: { id: "0195e000-0000-7000-8000-000000000010" },
    update: {},
    create: {
      id: "0195e000-0000-7000-8000-000000000010",
      venueId: venue.id,
      code: "SPACE-01",
      name: "校史馆主序厅",
      capacity: 50,
      createdById: "00000000-0000-7000-8000-000000000000",
    },
  });

  // 3. 发布热门活动
  const activity1 = await prisma.activity.upsert({
    where: { id: "0195e000-0000-7000-8000-000000000020" },
    update: {},
    create: {
      id: "0195e000-0000-7000-8000-000000000020",
      venueId: venue.id,
      title: "【官方导览】宁卫百年医学人文传承与校史沉浸式讲解",
      description: "由金牌学生讲解员带队，深入了解百年宁卫发展脉络与医学护理实训成果。",
      type: "LECTURE",
      auditMode: "MANUAL",
      allowTeam: true,
      minTeamSize: 5,
      maxTeamSize: 40,
      startDate: new Date("2026-09-25T00:00:00Z"),
      endDate: new Date("2026-10-15T00:00:00Z"),
      status: "PUBLISHED",
      sortOrder: 10,
      createdById: "00000000-0000-7000-8000-000000000000",
    },
  });

  const activity2 = await prisma.activity.upsert({
    where: { id: "0195e000-0000-7000-8000-000000000021" },
    update: {},
    create: {
      id: "0195e000-0000-7000-8000-000000000021",
      venueId: venue.id,
      title: "【开放日活动】医学急救常识科普与心肺复苏体验营",
      description: "面向社会公众与中小学生开展急救普及培训与技能实操体验。",
      type: "GENERAL",
      auditMode: "AUTO",
      allowTeam: false,
      startDate: new Date("2026-09-26T00:00:00Z"),
      endDate: new Date("2026-10-20T00:00:00Z"),
      status: "PUBLISHED",
      sortOrder: 5,
      createdById: "00000000-0000-7000-8000-000000000000",
    },
  });

  // 4. 排布具体场次
  const session1 = await prisma.activitySession.upsert({
    where: { id: "0195e000-0000-7000-8000-000000000030" },
    update: {},
    create: {
      id: "0195e000-0000-7000-8000-000000000030",
      activityId: activity1.id,
      spaceId: spaceA.id,
      date: "2026-09-26",
      startTime: "09:30",
      endTime: "11:00",
      totalCapacity: 30,
      bookedCount: 2,
      status: "ACTIVE",
      createdById: "00000000-0000-7000-8000-000000000000",
    },
  });

  const session2 = await prisma.activitySession.upsert({
    where: { id: "0195e000-0000-7000-8000-000000000031" },
    update: {},
    create: {
      id: "0195e000-0000-7000-8000-000000000031",
      activityId: activity1.id,
      spaceId: spaceA.id,
      date: "2026-09-26",
      startTime: "14:00",
      endTime: "15:30",
      totalCapacity: 40,
      bookedCount: 0,
      status: "ACTIVE",
      createdById: "00000000-0000-7000-8000-000000000000",
    },
  });

  // 5. 初始化一条预约申请待审核单
  await prisma.appointment.upsert({
    where: { code: "APPT202609250001" },
    update: {},
    create: {
      code: "APPT202609250001",
      activityId: activity1.id,
      sessionId: session1.id,
      type: "INDIVIDUAL",
      applicantName: "王晓明 (校友代表)",
      phone: "13857887374",
      idCard: "330200********1234",
      organization: "宁波市第一医院",
      peopleCount: 2,
      status: "PENDING",
      createdById: "00000000-0000-7000-8000-000000000000",
      visitors: {
        create: [
          {
            name: "李红梅",
            phone: "13900001111",
            idCard: "330200********5678",
            createdById: "00000000-0000-7000-8000-000000000000",
          },
        ],
      },
    },
  });

  // 6. 初始化教职工/学生组织同步数据示例
  await prisma.campusSyncRecord.upsert({
    where: {
      type_userCode: {
        type: "TEACHER",
        userCode: "T2026001",
      },
    },
    update: {},
    create: {
      type: "TEACHER",
      userCode: "T2026001",
      name: "张建国 (主讲教师)",
      department: "护理学院基础医学部",
      phone: "13857887374",
      email: "zhangjg@ningwei.edu.cn",
      syncStatus: "SYNCED",
      createdById: "00000000-0000-7000-8000-000000000000",
    },
  });

  await prisma.campusSyncRecord.upsert({
    where: {
      type_userCode: {
        type: "STUDENT",
        userCode: "S20240101",
      },
    },
    update: {},
    create: {
      type: "STUDENT",
      userCode: "S20240101",
      name: "陈雨晨 (学生代表)",
      className: "24高职护理3班",
      phone: "13700002222",
      syncStatus: "SYNCED",
      createdById: "00000000-0000-7000-8000-000000000000",
    },
  });

  console.log("✔ 宁卫活动预约演示基础业务数据注入成功！");
}
