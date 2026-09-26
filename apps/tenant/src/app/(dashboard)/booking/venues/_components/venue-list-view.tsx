"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Badge,
  Card,
} from "@base/ui";
import { Building2, MapPin, Clock, Phone, Eye } from "lucide-react";

export interface VenueDetailModalData {
  id: string;
  code: string;
  name: string;
  coverUrl?: string | null;
  address?: string | null;
  openTime?: string | null;
  contactPhone?: string | null;
  description?: string | null;
  isDefault: boolean;
  status: string;
  spaces: Array<{
    id: string;
    code: string;
    name: string;
    capacity: number;
    status: string;
  }>;
}

export function VenueListView({
  venues,
}: {
  readonly venues: VenueDetailModalData[];
}) {
  const [selectedVenue, setSelectedVenue] = useState<VenueDetailModalData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {venues.map((venue) => (
          <Card
            key={venue.id}
            onClick={() => {
              setSelectedVenue(venue);
              setModalOpen(true);
            }}
            className="overflow-hidden border-slate-200 hover:shadow-md transition-all cursor-pointer group hover:border-primary/50 flex flex-col justify-between"
          >
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-slate-900 flex items-center gap-2 group-hover:text-primary transition-colors">
                  <Building2 className="size-4 text-primary" />
                  {venue.name}
                </span>
                {venue.isDefault && <Badge variant="secondary">默认主馆</Badge>}
              </div>

              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="size-3.5 shrink-0" />
                  <span>{venue.address || "未设置地址"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="size-3.5 shrink-0" />
                  <span>{venue.openTime || "未设置开放时间"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="size-3.5 shrink-0" />
                  <span>{venue.contactPhone || "未设置联系电话"}</span>
                </div>
              </div>
            </div>

            <div className="p-4 pt-2.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 text-xs">
              <span className="text-slate-400">下辖空间: {venue.spaces.length} 个</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedVenue(venue);
                  setModalOpen(true);
                }}
                className="inline-flex items-center gap-1 font-semibold text-primary hover:underline cursor-pointer"
              >
                <Eye className="size-3.5" />
                查看详情
              </button>
            </div>
          </Card>
        ))}

        {venues.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed p-16 text-center text-muted-foreground bg-slate-50/50">
            暂无场馆档案，请点击右上角新增场馆
          </div>
        )}
      </div>

      {/* 场馆详情弹窗 */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto p-6 rounded-2xl">
          {selectedVenue && (
            <>
              <DialogHeader className="border-b pb-4">
                <div className="flex items-center justify-between pr-6">
                  <DialogTitle className="text-lg font-bold flex items-center gap-2">
                    <Building2 className="size-5 text-primary" />
                    {selectedVenue.name}
                  </DialogTitle>
                  {selectedVenue.isDefault && <Badge variant="secondary">默认主馆</Badge>}
                </div>
                <DialogDescription className="text-xs text-slate-500 mt-1">
                  场馆编码: {selectedVenue.code}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-3 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <span className="text-slate-400">场馆地址:</span>{" "}
                    <strong>{selectedVenue.address || "校内展区"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">联系电话:</span>{" "}
                    <strong>{selectedVenue.contactPhone || "暂未公开"}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400">开放时间:</span>{" "}
                    <strong>{selectedVenue.openTime || "常规工作日开放"}</strong>
                  </div>
                </div>

                {selectedVenue.description && (
                  <div className="space-y-1">
                    <span className="font-bold text-slate-800">场馆简介:</span>
                    <p className="p-3 rounded-xl bg-slate-50 border border-slate-100 leading-relaxed text-slate-600">
                      {selectedVenue.description}
                    </p>
                  </div>
                )}

                {/* 下辖空间分区 */}
                <div className="space-y-2">
                  <span className="font-bold text-slate-800">下辖场所与空间区域 ({selectedVenue.spaces.length})</span>
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                        <tr>
                          <th className="p-2.5 text-left">空间名称</th>
                          <th className="p-2.5 text-left">空间编码</th>
                          <th className="p-2.5 text-left">容纳人数</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedVenue.spaces.map((sp) => (
                          <tr key={sp.id}>
                            <td className="p-2.5 font-medium">{sp.name}</td>
                            <td className="p-2.5 font-mono text-slate-400">{sp.code}</td>
                            <td className="p-2.5">{sp.capacity} 人</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
