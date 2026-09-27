"use client";

/**
 * Analytics Charts Client Component
 * Uses recharts to display spending insights
 */
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCents } from "@/lib/utils";

interface AnalyticsData {
  monthlySpending: Array<{ month: string; amount: number }>;
  sentVsReceived: Array<{ name: string; value: number }>;
  topRecipients: Array<{ name: string; amount: number; count: number }>;
}

const COLORS = ["#c9a84c", "#10573f"];

export default function Analytics({ data }: { data: AnalyticsData }) {
  return (
    <div className="space-y-8">
      {/* Monthly Spending Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-brand-dark mb-4">Monthly Spending (Last 6 Months)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.monthlySpending}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip
              formatter={(value: number) => formatCents(value)}
              contentStyle={{ backgroundColor: "#fff", border: "1px solid #ccc" }}
            />
            <Bar dataKey="amount" fill="#c9a84c" name="Spending" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Sent vs Received Pie Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-brand-dark mb-4">Money Sent vs Received</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data.sentVsReceived}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${formatCents(value)}`}
              outerRadius={100}
              fill="#c9a84c"
              dataKey="value"
            >
              {data.sentVsReceived.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatCents(value)} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Top Recipients */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-brand-dark mb-4">Top 5 Recipients</h2>
        {data.topRecipients.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No transfer history yet</p>
        ) : (
          <div className="space-y-3">
            {data.topRecipients.map((recipient, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-semibold text-brand-dark">{recipient.name}</p>
                  <p className="text-sm text-gray-500">{recipient.count} transfer(s)</p>
                </div>
                <p className="font-bold text-gold text-lg">{formatCents(recipient.amount)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
