import { Decimal } from "decimal.js";

export interface BomProcessCalcItem {
  seqNo: number;
  lossRate: number | string | Decimal;
  yieldRate: number | string | Decimal;
}

export interface BomCalcParams {
  overrideTotalYield: boolean;
  totalYieldRate?: number | string | Decimal | null;
  processes: BomProcessCalcItem[];
}

export interface MaterialBomNode {
  bomCode: string;
  outputItemCode: string;
  subBomCodes: string[]; // 外部子件依赖的子BOM编码
}

/**
 * 工艺 BOM 出成率与拓扑计算引擎
 */
export class BomCalculatorEngine {
  /**
   * 计算综合出成率(%)
   * 若开启 overrideTotalYield 则直接以表头 totalYieldRate 为准；
   * 否则执行各工序出成率连乘：∏ (yieldRate / 100) * 100
   */
  static calculateTotalYieldRate(params: BomCalcParams): Decimal {
    if (
      params.overrideTotalYield &&
      params.totalYieldRate !== null &&
      params.totalYieldRate !== undefined
    ) {
      return new Decimal(params.totalYieldRate.toString());
    }

    if (!params.processes || params.processes.length === 0) {
      return new Decimal(100);
    }

    let acc = new Decimal(1);
    // 按工序顺序连乘
    const sorted = [...params.processes].sort((a, b) => a.seqNo - b.seqNo);
    for (const proc of sorted) {
      const yieldRatio = new Decimal(proc.yieldRate.toString()).dividedBy(100);
      acc = acc.times(yieldRatio);
    }

    return acc.times(100).toDecimalPlaces(4, Decimal.ROUND_HALF_UP);
  }

  /**
   * MRP 投入产出反推计算：
   * 已知成品净需求量 Q_out，根据综合出成率倒推毛料投料量 Q_in:
   * Q_in = Q_out / (totalYieldRate / 100)
   */
  static calculateTheoreticalInput(
    outputQty: number | string | Decimal,
    totalYieldRate: number | string | Decimal,
    precision = 3,
  ): Decimal {
    const yieldRateDec = new Decimal(totalYieldRate.toString());
    if (yieldRateDec.isZero() || yieldRateDec.isNegative()) {
      throw new Error("综合出成率必须大于 0");
    }
    const input = new Decimal(outputQty.toString()).dividedBy(
      yieldRateDec.dividedBy(100),
    );
    return input.toDecimalPlaces(precision, Decimal.ROUND_HALF_UP);
  }

  /**
   * 依赖有向图循环引用检测 (DFS Cycle Detection)
   * 若检测到环路，抛出包含完整环路链路的 Error
   */
  static assertNoCyclicDependency(
    rootBomCode: string,
    bomGraph: Map<string, string[]>,
  ): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    function dfs(current: string): void {
      visited.add(current);
      recursionStack.add(current);
      path.push(current);

      const neighbors = bomGraph.get(current) || [];
      for (const next of neighbors) {
        if (!visited.has(next)) {
          dfs(next);
        } else if (recursionStack.has(next)) {
          const cyclePath = [...path, next].join(" -> ");
          throw new Error(`检测到 BOM 循环引用依赖闭环: ${cyclePath}`);
        }
      }

      path.pop();
      recursionStack.delete(current);
    }

    dfs(rootBomCode);
  }
}
