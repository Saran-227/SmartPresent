"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// 👇 Create a type for the weekly menu keys
type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";

type WeeklyMenu = Record<DayOfWeek, string>;

const defaultMenu: WeeklyMenu = {
  Monday: "Rajma Chawal with Salad",
  Tuesday: "Aloo Gobi with Roti & Curd",
  Wednesday: "Chole Puri with Halwa",
  Thursday: "Kadhi Chawal with Pickle",
  Friday: "Vegetable Pulao with Raita",
  Saturday: "Poha & Milk with Fruits",
};

export default function MidDayMealDashboard() {
  // 👇 Strongly type our state with WeeklyMenu
  const [menu, setMenu] = useState<WeeklyMenu>(defaultMenu);
  const [editingDay, setEditingDay] = useState<DayOfWeek | null>(null);
  const [newMeal, setNewMeal] = useState("");
  const [today, setToday] = useState<DayOfWeek | "">("");

  useEffect(() => {
    const day = new Date().toLocaleDateString("en-US", { weekday: "long" }) as DayOfWeek;
    setToday(day);
  }, []);

  const handleEdit = (day: DayOfWeek) => {
    setEditingDay(day);
    setNewMeal(menu[day]); // ✅ Now TypeScript knows the type here
  };

  const handleSave = () => {
    if (editingDay) {
      setMenu((prev) => ({ ...prev, [editingDay]: newMeal }));
      setEditingDay(null);
      setNewMeal("");
    }
  };

  return (
    <Card className="bg-white border-orange-200">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          🍽️ Mid-Day Meal Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(menu).map(([day, meal]) => (
            <div
              key={day}
              className={`p-4 border rounded-lg shadow-sm ${
                day === today ? "bg-orange-50 border-orange-400" : "bg-gray-50"
              }`}
            >
              <h3 className="text-lg font-semibold text-orange-600 flex justify-between items-center">
                {day}
                {day === today && <span className="text-xs bg-orange-200 px-2 py-1 rounded">Today</span>}
              </h3>

              {editingDay === day ? (
                <div className="mt-2 flex gap-2">
                  <Input
                    value={newMeal}
                    onChange={(e) => setNewMeal(e.target.value)}
                    placeholder="Enter new meal"
                    className="flex-1"
                  />
                  <Button onClick={handleSave} className="bg-orange-500 text-white">
                    Save
                  </Button>
                </div>
              ) : (
                <div className="mt-2 flex justify-between items-center">
                  <p className="text-sm text-gray-700">{meal}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(day as DayOfWeek)}
                    className="text-orange-600 border-orange-300 hover:bg-orange-100"
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
