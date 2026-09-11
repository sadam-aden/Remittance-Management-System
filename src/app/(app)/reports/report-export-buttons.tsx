"use client";

import { FileText, FileSpreadsheet, FileDown, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReportExportButtons({ queryString }: { queryString: string }) {
  function openPrintView() {
    window.open(`/reports-print?${queryString}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        render={<a href={`/api/reports/export/csv?${queryString}`} />}
      >
        <FileDown size={14} /> CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        render={<a href={`/api/reports/export/excel?${queryString}`} />}
      >
        <FileSpreadsheet size={14} /> Excel
      </Button>
      <Button
        variant="outline"
        size="sm"
        render={<a href={`/api/reports/export/pdf?${queryString}`} />}
      >
        <FileText size={14} /> PDF
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={openPrintView}>
        <Printer size={14} /> Print
      </Button>
    </div>
  );
}
