import React from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";

export default function AdminWidgetsPage() {
  const widgets = [
    { id: "WDG-001", name: "Cover", priority: "Must", tier: "Basic, Pro, Premium" },
    { id: "WDG-002", name: "Event Details", priority: "Must", tier: "Basic, Pro, Premium" },
    { id: "WDG-003", name: "Gallery", priority: "Must", tier: "Basic (5), Pro (20), Premium (Unlimited)" },
    { id: "WDG-005", name: "Countdown", priority: "Should", tier: "Pro, Premium" },
    { id: "WDG-006", name: "Music Background", priority: "Should", tier: "Pro, Premium" },
    { id: "WDG-007", name: "RSVP & Confirmation", priority: "Must", tier: "Basic, Pro, Premium" },
    { id: "WDG-011", name: "Google Maps Integration", priority: "Must", tier: "Pro, Premium" },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold">Widget & Entitlement Management</h1>
        <p className="text-sm text-zinc-500">
          Daftar komponen widget dan keterkaitannya dengan tingkatan paket (PRD v3.0 Bagian 7).
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode Widget</TableHead>
                <TableHead>Nama Widget</TableHead>
                <TableHead>Prioritas PRD</TableHead>
                <TableHead>Ketersediaan di Paket</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {widgets.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-mono text-xs">{w.id}</TableCell>
                  <TableCell className="font-semibold">{w.name}</TableCell>
                  <TableCell><Badge variant="outline">{w.priority}</Badge></TableCell>
                  <TableCell className="text-xs text-zinc-600 dark:text-zinc-300">{w.tier}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
