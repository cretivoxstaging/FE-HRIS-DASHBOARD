
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const leaveRequests = [
  { id: 1, employee: "John Doe", startDate: "2023-07-01", endDate: "2023-07-05", status: "" },
  { id: 2, employee: "Jane Smith", startDate: "2023-07-10", endDate: "2023-07-12", status: "" },
  { id: 3, employee: "Bob Johnson", startDate: "2023-07-15", endDate: "2023-07-16", status: "" },
]

export default function LeavePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Pengajuan Cuti</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Karyawan</TableHead>
            <TableHead>Tanggal Mulai</TableHead>
            <TableHead>Tanggal Selesai</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaveRequests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>{request.employee}</TableCell>
              <TableCell>{request.startDate}</TableCell>
              <TableCell>{request.endDate}</TableCell>
              <TableCell>{request.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

