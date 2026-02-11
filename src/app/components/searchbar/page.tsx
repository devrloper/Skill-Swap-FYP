import Button from "@/app/ui/button"
 export default function SearchBar() {
    return (
      <div className="    bg-white/30 backdrop-blur-lg
    border border-white/30 p-4 rounded-xl shadow-sm grid grid-cols-1 md:grid-cols-5 gap-3">
        {[
          "I'm offering...",
          "I'm seeking...",
          "Location",
          "Skill Level",
        ].map((item, i) => (
          <select
            key={i}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option>{item}</option>
          </select>
        ))}
  
        <Button>
          Search
        </Button>
      </div>
    );
  }
  