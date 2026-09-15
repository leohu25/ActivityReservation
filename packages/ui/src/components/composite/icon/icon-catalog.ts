import type React from "react";
import {
  LayoutDashboard,
  Folder,
  FolderTree,
  Layers,
  LayoutGrid,
  Sliders,
  Compass,
  Boxes,
  Users,
  UserCheck,
  Building2,
  ShieldCheck,
  KeyRound,
  IdCard,
  UserCog,
  Lock,
  Package,
  PackageCheck,
  Scale,
  Tags,
  Barcode,
  Truck,
  Factory,
  Cpu,
  Wrench,
  Warehouse,
  Sparkles,
  ShoppingCart,
  ShoppingBag,
  FileText,
  Receipt,
  CreditCard,
  Wallet,
  Coins,
  FileCheck,
  ClipboardList,
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  Activity,
  History,
  Search,
  Settings,
  ExternalLink,
  Link2,
  Globe,
  Database,
  Server,
  HelpCircle,
  Share2,
} from "lucide-react";

export type IconCategory =
  | "category"
  | "org"
  | "supply"
  | "order"
  | "report"
  | "system";

export interface IconItem {
  readonly name: string;
  readonly label: string;
  readonly category: IconCategory;
  readonly component: React.ComponentType<{ className?: string }>;
  readonly keywords: readonly string[];
}

export const ICON_CATEGORIES: readonly {
  readonly id: IconCategory;
  readonly label: string;
}[] = [
  { id: "category", label: "容器分类" },
  { id: "org", label: "组织人员" },
  { id: "supply", label: "物料供应链" },
  { id: "order", label: "订单财务" },
  { id: "report", label: "报表分析" },
  { id: "system", label: "系统连接" },
] as const;

export const ENTERPRISE_ICONS: readonly IconItem[] = [
  // 容器分类
  {
    name: "LayoutDashboard",
    label: "仪表工作台",
    category: "category",
    component: LayoutDashboard,
    keywords: ["dashboard", "gongzuotai", "yibiaopan", "home"],
  },
  {
    name: "Folder",
    label: "文件夹",
    category: "category",
    component: Folder,
    keywords: ["folder", "wenjianjia", "mulu", "group"],
  },
  {
    name: "FolderTree",
    label: "目录树",
    category: "category",
    component: FolderTree,
    keywords: ["tree", "cengji", "mulushu"],
  },
  {
    name: "Layers",
    label: "层级多维",
    category: "category",
    component: Layers,
    keywords: ["layers", "cengji", "duowei"],
  },
  {
    name: "LayoutGrid",
    label: "应用矩阵",
    category: "category",
    component: LayoutGrid,
    keywords: ["grid", "yingyong", "juzhen"],
  },
  {
    name: "Sliders",
    label: "控制台配置",
    category: "category",
    component: Sliders,
    keywords: ["sliders", "kongzhitai", "canshu"],
  },
  {
    name: "Compass",
    label: "导航罗盘",
    category: "category",
    component: Compass,
    keywords: ["compass", "daohang", "luopan"],
  },
  {
    name: "Boxes",
    label: "业务模块",
    category: "category",
    component: Boxes,
    keywords: ["boxes", "mokuai", "hezi"],
  },

  // 组织人员
  {
    name: "Users",
    label: "组织员工",
    category: "org",
    component: Users,
    keywords: ["users", "yuangong", "zuzhi", "renshi"],
  },
  {
    name: "UserCheck",
    label: "客户档案",
    category: "org",
    component: UserCheck,
    keywords: ["customer", "kehu", "yanzheng", "dangan"],
  },
  {
    name: "Building2",
    label: "企业公司",
    category: "org",
    component: Building2,
    keywords: ["company", "qiye", "gongsi", "zuzhi"],
  },
  {
    name: "ShieldCheck",
    label: "权限角色",
    category: "org",
    component: ShieldCheck,
    keywords: ["security", "quanxian", "juese", "dunpai"],
  },
  {
    name: "KeyRound",
    label: "安全凭据",
    category: "org",
    component: KeyRound,
    keywords: ["key", "yaoshi", "pingju", "mima"],
  },
  {
    name: "IdCard",
    label: "岗位职务",
    category: "org",
    component: IdCard,
    keywords: ["position", "gangwei", "zhiwu", "mingpian"],
  },
  {
    name: "UserCog",
    label: "用户运维",
    category: "org",
    component: UserCog,
    keywords: ["usercog", "yunwei", "guanli"],
  },
  {
    name: "Lock",
    label: "安全锁定",
    category: "org",
    component: Lock,
    keywords: ["lock", "suoding", "anquan"],
  },

  // 物料供应链
  {
    name: "Package",
    label: "物料货品",
    category: "supply",
    component: Package,
    keywords: ["package", "wuliao", "huopin", "baoguo"],
  },
  {
    name: "PackageCheck",
    label: "质量验收",
    category: "supply",
    component: PackageCheck,
    keywords: ["check", "yanshou", "zhijian"],
  },
  {
    name: "Scale",
    label: "计量单位",
    category: "supply",
    component: Scale,
    keywords: ["unit", "jiliang", "danwei", "cheng"],
  },
  {
    name: "Tags",
    label: "分类标签",
    category: "supply",
    component: Tags,
    keywords: ["tags", "biaoqian", "fenlei", "shuxing"],
  },
  {
    name: "Barcode",
    label: "条码批次",
    category: "supply",
    component: Barcode,
    keywords: ["barcode", "tiaoma", "pici", "saoma"],
  },
  {
    name: "Truck",
    label: "物流配送",
    category: "supply",
    component: Truck,
    keywords: ["truck", "wuliu", "peisong", "cheliang"],
  },
  {
    name: "Factory",
    label: "制造工厂",
    category: "supply",
    component: Factory,
    keywords: ["factory", "gongchang", "zhizao", "chejian"],
  },
  {
    name: "Cpu",
    label: "工艺BOM",
    category: "supply",
    component: Cpu,
    keywords: ["cpu", "gongyi", "bom", "peifang"],
  },
  {
    name: "Wrench",
    label: "工器具",
    category: "supply",
    component: Wrench,
    keywords: ["wrench", "gongju", "weixiu"],
  },
  {
    name: "Warehouse",
    label: "仓储库房",
    category: "supply",
    component: Warehouse,
    keywords: ["warehouse", "cangku", "kufang", "cangchu"],
  },
  {
    name: "Sparkles",
    label: "主推特色",
    category: "supply",
    component: Sparkles,
    keywords: ["sparkles", "tese", "liangdian"],
  },

  // 订单财务
  {
    name: "ShoppingCart",
    label: "采购管理",
    category: "order",
    component: ShoppingCart,
    keywords: ["procurement", "caigou", "gouwuche"],
  },
  {
    name: "ShoppingBag",
    label: "销售单据",
    category: "order",
    component: ShoppingBag,
    keywords: ["sales", "xiaoshou", "dingdan", "daju"],
  },
  {
    name: "FileText",
    label: "文档单据",
    category: "order",
    component: FileText,
    keywords: ["file", "wendang", "danju", "dangan"],
  },
  {
    name: "Receipt",
    label: "报价发票",
    category: "order",
    component: Receipt,
    keywords: ["quote", "baojia", "fapiao", "piaoju"],
  },
  {
    name: "CreditCard",
    label: "资金结算",
    category: "order",
    component: CreditCard,
    keywords: ["card", "jiesuan", "yinhang", "zhifu"],
  },
  {
    name: "Wallet",
    label: "账户钱包",
    category: "order",
    component: Wallet,
    keywords: ["wallet", "qianbao", "zhanghu"],
  },
  {
    name: "Coins",
    label: "金额货币",
    category: "order",
    component: Coins,
    keywords: ["coins", "jine", "huobi", "feiyong"],
  },
  {
    name: "FileCheck",
    label: "审批复核",
    category: "order",
    component: FileCheck,
    keywords: ["audit", "shenpi", "fuhe"],
  },
  {
    name: "ClipboardList",
    label: "任务工单",
    category: "order",
    component: ClipboardList,
    keywords: ["tasks", "renwu", "gongdan", "qingdan"],
  },

  // 报表分析
  {
    name: "BarChart3",
    label: "统计柱状图",
    category: "report",
    component: BarChart3,
    keywords: ["chart", "zhuzhuangtu", "tongji", "kanban"],
  },
  {
    name: "LineChart",
    label: "趋势折线图",
    category: "report",
    component: LineChart,
    keywords: ["line", "qushi", "zhexiantu"],
  },
  {
    name: "PieChart",
    label: "占比饼图",
    category: "report",
    component: PieChart,
    keywords: ["pie", "bingtu", "zhanbi"],
  },
  {
    name: "TrendingUp",
    label: "业绩增长",
    category: "report",
    component: TrendingUp,
    keywords: ["trending", "zengzhang", "yeji"],
  },
  {
    name: "Activity",
    label: "实时监控",
    category: "report",
    component: Activity,
    keywords: ["activity", "jiankong", "dongtai"],
  },
  {
    name: "History",
    label: "操作审计",
    category: "report",
    component: History,
    keywords: ["history", "shenji", "rizhi", "chaxun"],
  },
  {
    name: "Search",
    label: "搜索中心",
    category: "report",
    component: Search,
    keywords: ["search", "sousuo", "chaxun"],
  },

  // 系统连接
  {
    name: "Settings",
    label: "系统设置",
    category: "system",
    component: Settings,
    keywords: ["settings", "shezhi", "xitong", "peizhi"],
  },
  {
    name: "ExternalLink",
    label: "外部链接",
    category: "system",
    component: ExternalLink,
    keywords: ["external", "waibulianjie", "tiaozhuan", "link"],
  },
  {
    name: "Link2",
    label: "业务关联",
    category: "system",
    component: Link2,
    keywords: ["link", "guanlian", "lianjie"],
  },
  {
    name: "Globe",
    label: "公网站点",
    category: "system",
    component: Globe,
    keywords: ["globe", "wangzhan", "gongwang", "portal"],
  },
  {
    name: "Database",
    label: "数据底座",
    category: "system",
    component: Database,
    keywords: ["database", "shujuku", "dizuo"],
  },
  {
    name: "Server",
    label: "服务集群",
    category: "system",
    component: Server,
    keywords: ["server", "fuwuqi", "jiqun"],
  },
  {
    name: "HelpCircle",
    label: "帮助中心",
    category: "system",
    component: HelpCircle,
    keywords: ["help", "bangzhu", "wendang", "zhinan"],
  },
  {
    name: "Share2",
    label: "协同集成",
    category: "system",
    component: Share2,
    keywords: ["share", "xietong", "jicheng", "fenxiang"],
  },
] as const;

export const ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string }>
> = Object.fromEntries(ENTERPRISE_ICONS.map((i) => [i.name, i.component]));
