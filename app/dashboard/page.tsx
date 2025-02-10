"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";

export default function DashboardPage() {
  const [overtimeCount, setOvertimeCount] = useState(0);

  useEffect(() => {
    const fetchOvertimeCount = async () => {
      try {
        const response = await fetch(
          "https://hris-api-kappa.vercel.app/api/v1/overtime?pageSize=200",
          {
            headers: {
              Authorization:
                "Bearer $2a$12$JSyMjCxUTNmGBlAQOQQeaOFrOdtdUmn.U/17DlvOK1t.Ot0BTRGli",
            },
          }
        );
        const data = await response.json();
        setOvertimeCount(data.overtime?.length || 0);
      } catch (error) {
        console.error("Error fetching overtime count:", error);
      }
    };

    fetchOvertimeCount();
  }, []);

  return (
    <div className="space-y-4">
      {" "}
      <h1 className="text-2xl font-bold text-black">Dashboard</h1>{" "}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {" "}
        <Card className="bg-green-400 text-black">
          {" "}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            {" "}
            <CardTitle className="text-sm font-medium">
              Numbers of Employees
            </CardTitle>{" "}
          </CardHeader>{" "}
          <CardContent>
            {" "}
            <div className="text-2xl font-bold">33</div>{" "}
          </CardContent>{" "}
        </Card>{" "}
        {/* <Card className="bg-gray-300 text-black"> <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"> <CardTitle className="text-sm font-medium">Pengajuan Cuti</CardTitle> </CardHeader> <CardContent> <div className="text-2xl font-bold">5</div> </CardContent> </Card> */}{" "}
        <Card className="bg-green-400 text-black">
          {" "}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            {" "}
            <CardTitle className="text-sm font-medium">
              Overtime Submission
            </CardTitle>{" "}
          </CardHeader>{" "}
          <CardContent>
            {" "}
            <div className="text-2xl font-bold">{overtimeCount}</div>{" "}
          </CardContent>{" "}
        </Card>{" "}
      </div>{" "}
    </div>
  );
}
