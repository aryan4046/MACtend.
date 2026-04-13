import { useState, useEffect } from "react";
import { detectMac, registerStudent } from "../api";
import { Laptop2, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

export function StudentRegistration() {
  const [macAddress, setMacAddress] = useState<string | null>(null);
  const [macStatus, setMacStatus] = useState<"checking" | "found" | "error">("checking");
  const [statusMessage, setStatusMessage] = useState("Checking device compatibility...");
  
  const [formData, setFormData] = useState({
    name: "",
    enrollment: "",
    email: "",
    college: "SOCET",
    programme: "BTech",
    career_path: "AOC",
    branch: "CSE",
    semester: "4",
    section: "A"
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registerResult, setRegisterResult] = useState<{type: "success" | "error", message: string} | null>(null);

  useEffect(() => {
    checkMac();
  }, []);

  const checkMac = async () => {
    try {
      const res = await detectMac();
      if (res.mac_address) {
        setMacAddress(res.mac_address);
        setMacStatus("found");
        setStatusMessage("Device compatibility verified.");
      } else {
        setMacStatus("error");
        setStatusMessage("Network error: Could not verify device ID.");
      }
    } catch (err) {
      setMacStatus("error");
      setStatusMessage("Connection failed. Must be on college network.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!macAddress) return;
    
    setIsSubmitting(true);
    setRegisterResult(null);

    try {
      const payload = {
        name: formData.name,
        enrollment_number: formData.enrollment,
        email: formData.email,
        college: formData.college,
        mac_address: macAddress,
        programme: formData.programme,
        career_path: formData.career_path,
        branch: formData.branch,
        semester: formData.semester,
        section: formData.section
      };

      const res = await registerStudent(payload);
      if (res.success) {
        setRegisterResult({ type: "success", message: "Device successfully registered!" });
      } else {
        setRegisterResult({ type: "error", message: res.error || res.message || "Failed to register" });
      }
    } catch (err: any) {
      setRegisterResult({ type: "error", message: "Server error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (macStatus === "checking") {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
        <h2 className="text-xl font-semibold text-slate-700">{statusMessage}</h2>
        <p className="text-slate-500 mt-2">Connecting to secure access network...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="bg-white/70 backdrop-blur-xl border border-slate-200/60 shadow-xl rounded-3xl overflow-hidden mt-8">
        
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white relative">
          <div className="absolute top-4 right-4 bg-white/20 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 backdrop-blur-md">
            {macStatus === "found" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
            {macStatus === "found" ? "Network Secured" : "Network Unsecured"}
          </div>
          <Laptop2 size={40} className="mb-4 opacity-90" />
          <h1 className="text-2xl font-bold">Register Your Device</h1>
          <p className="text-blue-100 mt-2 text-sm max-w-sm">
            Link your current device to your student profile to access automated attendance check-ins.
          </p>
        </div>

        <div className="p-8">
          {macStatus === "error" && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-start gap-3 mb-6">
              <AlertTriangle className="shrink-0 mt-0.5" size={18} />
              <div>
                <strong className="block font-semibold">Device Detection Failed</strong>
                <span className="text-sm">We could not read your hardware signature. You must be connected to the campus Wi-Fi interface.</span>
              </div>
            </div>
          )}

          {registerResult && (
            <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${
              registerResult.type === "success" 
                ? "bg-green-50 text-green-700 border border-green-100" 
                : "bg-red-50 text-red-700 border border-red-100"
            }`}>
              {registerResult.type === "success" ? <CheckCircle2 className="shrink-0" size={18} /> : <AlertTriangle className="shrink-0" size={18} />}
              <span>{registerResult.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                <input
                  type="text" name="name" required value={formData.name} onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-slate-900"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Enrollment Number</label>
                <input
                  type="text" name="enrollment" required value={formData.enrollment} onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-slate-900"
                  placeholder="0123CS201..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Student Email</label>
              <input
                type="email" name="email" required value={formData.email} onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-slate-900"
                placeholder="student@college.edu"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Select College</label>
              <select 
                name="college" 
                value={formData.college} 
                onChange={handleChange} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-slate-900"
              >
                <option value="SOCET">SOCET</option>
                <option value="ASOIT">ASOIT</option>
              </select>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Programme</label>
                <select name="programme" value={formData.programme} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="BTech">B.Tech</option>
                  <option value="MTech">M.Tech</option>
                  <option value="MCA">MCA</option>
                  <option value="BCA">BCA</option>
                  <option value="MBA">MBA</option>
                  <option value="Diploma">Diploma</option>
                  <option value="BSc">B.Sc</option>
                  <option value="MSc">M.Sc</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Career Path</label>
                <select name="career_path" value={formData.career_path} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="AOC">AOC</option>
                  <option value="FSWD">FSWD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Branch</label>
                <select name="branch" value={formData.branch} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="CSE">CSE</option>
                  <option value="IT">IT</option>
                  <option value="ECE">ECE</option>
                  <option value="ME">ME</option>
                  <option value="Civil">Civil</option>
                  <option value="Chemical">Chemical</option>
                  <option value="Automobile">Automobile</option>
                  <option value="Electrical">Electrical</option>
                  <option value="AIML">AIML</option>
                  <option value="DS">Data Science</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Semester</label>
                <select name="semester" value={formData.semester} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500">
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Section</label>
                <select name="section" value={formData.section} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500">
                  {["A", "B", "C", "D"].map(sec => (
                    <option key={sec} value={sec}>{sec}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={macStatus !== "found" || isSubmitting}
              className="w-full mt-4 flex items-center justify-center p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/20"
            >
              {isSubmitting ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
              {isSubmitting ? "Linking Device..." : "Register Device"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
