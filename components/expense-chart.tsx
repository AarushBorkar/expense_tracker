"use client"

import { useState } from "react"
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Sector, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency } from "@/lib/currency"

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#FF6B6B",
  "#4ECDC4",
  "#C7F464",
]

type ExpenseChartProps = {
  data: Array<{
    name: string
    value: number | string
  }>
}

export function ExpenseChart({ data }: ExpenseChartProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [chartView, setChartView] = useState<"pie" | "donut">("pie")

  // Ensure all values are numbers
  const normalizedData = data.map((item) => ({
    name: item.name,
    value: Number(item.value) || 0,
  }))

  const total = normalizedData.reduce((sum, item) => sum + item.value, 0)

  // Sort data by value (descending)
  const sortedData = [...normalizedData].sort((a, b) => b.value - a.value)

  // Calculate percentages
  const dataWithPercentage = sortedData.map((item) => ({
    ...item,
    percentage: ((item.value / total) * 100).toFixed(1),
  }))

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index)
  }

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props

    const numValue = Number(value) || 0

    return (
      <g>
        <text x={cx} y={cy - 20} dy={8} textAnchor="middle" fill="#888">
          {payload.name}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#333" className="text-xl font-bold">
          ${numValue.toFixed(2)}
        </text>
        <text x={cx} y={cy + 30} textAnchor="middle" fill="#999">
          {`${(percent * 100).toFixed(1)}%`}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={chartView === "donut" ? innerRadius - 5 : 0}
          outerRadius={outerRadius}
          fill={fill}
        />
      </g>
    )
  }

  // Replace this function
  // const formatCurrency = (value: any) => {
  //   const num = Number(value) || 0
  //   return `$${num.toFixed(2)}`
  // }

  // Use the imported function instead

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Expense Breakdown</CardTitle>
            <CardDescription>Total: {formatCurrency(total)}</CardDescription>
          </div>
          <Tabs
            defaultValue="pie"
            className="w-[200px]"
            onValueChange={(value) => setChartView(value as "pie" | "donut")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pie">Pie</TabsTrigger>
              <TabsTrigger value="donut">Donut</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={dataWithPercentage}
                cx="50%"
                cy="50%"
                innerRadius={chartView === "donut" ? 70 : 0}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                onMouseEnter={onPieEnter}
                paddingAngle={chartView === "donut" ? 2 : 0}
              >
                {dataWithPercentage.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) => [formatCurrency(value), "Amount"]}
                labelFormatter={(name) => `Category: ${name}`}
              />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                formatter={(value, entry, index) => `${value} (${dataWithPercentage[index]?.percentage}%)`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-2">Expense Details</h4>
          <div className="overflow-auto max-h-[200px]">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-2">Category</th>
                  <th className="text-right p-2">Amount</th>
                  <th className="text-right p-2">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {dataWithPercentage.map((item, index) => (
                  <tr key={index} className="border-b border-muted">
                    <td className="p-2 flex items-center">
                      <div
                        className="mr-2 h-3 w-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      {item.name}
                    </td>
                    <td className="text-right p-2">{formatCurrency(item.value)}</td>
                    <td className="text-right p-2">{item.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

