export default function SidebarFilters() {
  return (
    <div className="space-y-6">

      {/* Promo Card */}
      <div className="bg-black text-white p-6 rounded-3xl relative overflow-hidden">
        <h2 className="text-2xl font-bold mb-8 relative z-10">
          Get Your best profession with LuckyJob
        </h2>
        <button className="bg-sky-400 text-black px-6 py-2 rounded-full font-semibold hover:bg-sky-300 transition-colors">
          Learn more
        </button>
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10"></div>
      </div>

      {/* Filters Sidebar */}
      <aside className="bg-white/30 backdrop-blur-lg border border-white/30 rounded-xl shadow-sm p-4 h-fit">
        <h3 className="font-semibold mb-4">Refine Your Search</h3>

        <div className="space-y-4 text-sm">
          <div>
            <p className="font-medium mb-2">Exchange Type</p>
            <label className="block">
              <input type="checkbox" className="mr-2" /> In-Person
            </label>
            <label className="block">
              <input type="checkbox" className="mr-2" /> Remote
            </label>
          </div>

          <div>
            <p className="font-medium mb-2">Skill Level</p>
            <label className="block">
              <input type="radio" name="level" className="mr-2" /> Beginner
            </label>
            <label className="block">
              <input type="radio" name="level" className="mr-2" /> Intermediate
            </label>
            <label className="block">
              <input type="radio" name="level" className="mr-2" /> Advanced
            </label>
          </div>

          <div>
            <p className="font-medium mb-2">Availability</p>
            <label className="block">
              <input type="checkbox" className="mr-2" /> Weekdays
            </label>
            <label className="block">
              <input type="checkbox" className="mr-2" /> Weekends
            </label>
          </div>
        </div>
      </aside>

    </div>
  );
}
