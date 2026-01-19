import { useState } from "react";
import { X } from "lucide-react";

export default function EducationStep({ onNext }) {
  const [educations, setEducations] = useState([]); // table rows
  const [newEdu, setNewEdu] = useState({
    degree: "",
    institute: "",
    start: "",
    end: "",
  });

  // Update the input fields
  const updateNewEdu = (field, value) => {
    setNewEdu({ ...newEdu, [field]: value });
  };

  // Add new education to table
  const addEducation = () => {
    const { degree, institute, start, end } = newEdu;
    if (!degree || !institute || !start || !end) {
      alert("Please fill all fields!");
      return;
    }
    setEducations([...educations, newEdu]);
    setNewEdu({ degree: "", institute: "", start: "", end: "" });
  };

  // Delete row from table
  const deleteEducation = (index) => {
    setEducations(educations.filter((_, i) => i !== index));
  };

  // Update value directly in table
  const updateTableEdu = (index, field, value) => {
    const updated = [...educations];
    updated[index][field] = value;
    setEducations(updated);
  };

  return (
    <div className="space-y-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <h3 className="text-2xl font-semibold text-gray-900">Education</h3>

      {/* Input Fields for New Education */}
      <div className="rounded-2xl p-6 bg-gradient-to-br from-indigo-50/70 via-purple-50/60 to-pink-50/70 border border-purple-100 shadow-sm space-y-4">
        <h4 className="text-xs font-semibold tracking-widest text-gray-600 uppercase">
          Add New Education
        </h4>

        <SoftInput
          placeholder="Degree / Qualification"
          value={newEdu.degree}
          onChange={(e) => updateNewEdu("degree", e.target.value)}
        />
        <SoftInput
          placeholder="Institute Name"
          value={newEdu.institute}
          onChange={(e) => updateNewEdu("institute", e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SoftInput
            placeholder="Start Year"
            value={newEdu.start}
            onChange={(e) => updateNewEdu("start", e.target.value)}
          />
          <SoftInput
            placeholder="End Year"
            value={newEdu.end}
            onChange={(e) => updateNewEdu("end", e.target.value)}
          />
        </div>

        <button
          onClick={addEducation}
          className="mt-2 px-4 py-2 rounded-xl bg-purple-600 text-white font-semibold shadow hover:scale-[1.03] transition"
        >
          Add Education
        </button>
      </div>

      {/* Table of Educations */}
      {educations.length > 0 && (
        <div className="overflow-x-auto mt-6">
          <table className="min-w-full bg-white border border-gray-200 rounded-xl overflow-hidden">
            <thead className="bg-purple-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">#</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Degree</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Institute</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Start Year</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">End Year</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {educations.map((edu, index) => (
                <tr key={index} className="border-t border-gray-100">
                  <td className="px-4 py-2 text-sm text-gray-700">{index + 1}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    <input
                      value={edu.degree}
                      onChange={(e) => updateTableEdu(index, "degree", e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 rounded"
                    />
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    <input
                      value={edu.institute}
                      onChange={(e) => updateTableEdu(index, "institute", e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 rounded"
                    />
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    <input
                      value={edu.start}
                      onChange={(e) => updateTableEdu(index, "start", e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 rounded"
                    />
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    <input
                      value={edu.end}
                      onChange={(e) => updateTableEdu(index, "end", e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 rounded"
                    />
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    <button
                      onClick={() => deleteEducation(index)}
                      className="text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CV Upload */}
      <div className="rounded-2xl p-6 bg-indigo-50/60 border border-indigo-100 space-y-4">
        <h4 className="text-xs font-semibold tracking-widest text-gray-600 uppercase">
          Upload CV / Resume (Optional)
        </h4>
        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-purple-300 rounded-xl p-6 cursor-pointer hover:bg-purple-50 transition">
          <span className="text-sm text-gray-600">
            Drag & drop your CV or click to upload
          </span>
          <span className="text-xs text-gray-400">PDF, DOC, DOCX (Max 5MB)</span>
          <input type="file" accept=".pdf,.doc,.docx" className="hidden" />
        </label>
      </div>

      {/* Continue Button */}
      <div className="flex justify-end">
        <button
          onClick={onNext}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold shadow-md hover:scale-[1.03] transition"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

function SoftInput({ placeholder, value, onChange, type = "text" }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full rounded-xl px-4 py-3 bg-indigo-50/60 border border-indigo-100 text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400/40 transition"
    />
  );
}
