export default function SidebarFilters() {
    return (
      <aside className="    bg-white/30 backdrop-blur-lg
    border border-white/30 rounded-xl shadow-sm p-4 h-fit">
        <h3 className="font-semibold mb-4">Refine Your Search</h3>
  
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-medium mb-2">Exchange Type</p>
            <label className="block">
              <input type="checkbox" /> In-Person
            </label>
            <label className="block">
              <input type="checkbox" /> Remote
            </label>
          </div>
  
          <div>
            <p className="font-medium mb-2">Skill Level</p>
            <label className="block">
              <input type="radio" name="level" /> Beginner
            </label>
            <label className="block">
              <input type="radio" name="level" /> Intermediate
            </label>
            <label className="block">
              <input type="radio" name="level" /> Advanced
            </label>
          </div>
  
          <div>
            <p className="font-medium mb-2">Availability</p>
            <label className="block">
              <input type="checkbox" /> Weekdays
            </label>
            <label className="block">
              <input type="checkbox" /> Weekends
            </label>
          </div>
        </div>
      </aside>
    );
  }
  