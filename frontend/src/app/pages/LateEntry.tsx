import { useState } from "react";
import { useNavigate } from "react-router";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import { toggleAttendance, getAttendance } from "../api";

interface Student {
  id: string;
  enrollmentNumber: string;
  name: string;
  present: boolean;
}

// Mock data for students not yet marked present
const mockStudents: Student[] = [
  { id: "1", enrollmentNumber: "2021CSE001", name: "Rahul Kumar", present: false },
  { id: "2", enrollmentNumber: "2021CSE005", name: "Priya Sharma", present: false },
  { id: "3", enrollmentNumber: "2021CSE012", name: "Amit Patel", present: false },
  { id: "4", enrollmentNumber: "2021CSE018", name: "Sneha Gupta", present: false },
  { id: "5", enrollmentNumber: "2021CSE023", name: "Vikram Singh", present: false },
  { id: "6", enrollmentNumber: "2021CSE029", name: "Anjali Verma", present: false },
  { id: "7", enrollmentNumber: "2021CSE034", name: "Rohan Mishra", present: false },
  { id: "8", enrollmentNumber: "2021CSE041", name: "Pooja Reddy", present: false },
  { id: "9", enrollmentNumber: "2021CSE047", name: "Arjun Rao", present: false },
  { id: "10", enrollmentNumber: "2021CSE053", name: "Divya Joshi", present: false },
];

export function LateEntry() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

  useState(() => {
    getAttendance().then(res => {
      if (res.success) {
        const absentees = res.logs
          .filter((log: any) => log.time === "--:--")
          .map((log: any) => ({
            id: log.studentId,
            enrollmentNumber: log.enrollmentNumber,
            name: log.name,
            present: false
          }));
        setStudents(absentees);
      }
    });
  });

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.enrollmentNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const handleMarkPresent = async () => {
    const activeSessionRes = await fetch("/api/session/status").then(r => r.json());
    if (!activeSessionRes.is_active) {
        alert("No active session found.");
        return;
    }

    const subject = activeSessionRes.subject;
    const promises = Array.from(selectedStudents).map(studentId => 
        toggleAttendance({
            studentId,
            subject,
            present: true,
            source: "manual-late"
        })
    );

    await Promise.all(promises);
    alert(`${selectedStudents.size} student(s) marked as present`);
    navigate("/teacher/dashboard");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center">
          <h1 className="font-semibold text-xl tracking-tight">MACtend<span className="text-blue-600">.</span></h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-xl font-medium mb-2">Mark Late Entry</h2>
        <p className="text-sm text-gray-600 mb-6">
          Shows only students not yet marked present.
        </p>

        {/* Search Bar */}
        <div className="mb-6">
          <Input
            type="text"
            placeholder="Search by name or enrollment number"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-full max-w-md"
          />
        </div>

        {/* Student List */}
        <div className="space-y-3 mb-6">
          {filteredStudents.length === 0 ? (
            <p className="text-gray-500 py-4">No students found.</p>
          ) : (
            filteredStudents.map((student) => (
              <div
                key={student.id}
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <Checkbox
                  id={`student-${student.id}`}
                  checked={selectedStudents.has(student.id)}
                  onCheckedChange={() => handleToggleStudent(student.id)}
                />
                <Label
                  htmlFor={`student-${student.id}`}
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                    <span className="font-medium">{student.enrollmentNumber}</span>
                    <span className="text-gray-700">{student.name}</span>
                  </div>
                </Label>
              </div>
            ))
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleMarkPresent}
            disabled={selectedStudents.size === 0}
            className="rounded-full bg-blue-600 hover:bg-blue-700"
          >
            Mark Selected as Present ({selectedStudents.size})
          </Button>
          <Button
            onClick={() => navigate("/teacher/dashboard")}
            variant="outline"
            className="rounded-full"
          >
            Back to Dashboard
          </Button>
        </div>
      </main>
    </div>
  );
}
