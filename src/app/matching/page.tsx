import Navbar from "@/app/components/navbar/page";
import SearchBar from "@/app/components/searchbar/page";
import MatchCard from "@/app/components/matchcard/page";
import SidebarFilters from "@/app/components/sidebarfilters/page";

export default function FindMatchPage() {
  return (
    <div className="relative min-h-screen mt-18">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/study1.png')" }}
      />

      {/* Content */}
      <div className="relative z-10">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Heading */}
          <div className="text-center mb-8 text-white">
            <h1 className="text-5xl font-bold">Find a Match</h1>
            <p className="text-white/80 mt-2">
              Connect with skilled professionals to exchange services and learn
              from each other.
            </p>
          </div>

          {/* Search */}
          <SearchBar />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-8">
            {/* Matches */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
              <MatchCard
                name="Jessica M."
                offer="Graphic Design"
                seek="Spanish Lessons"
                location="New York, NY"
                tags={["Graphic Design", "Language Exchange"]}
              />

              <MatchCard
                name="Daniel S."
                offer="Photography"
                seek="Guitar Skills"
                location="Brooklyn, NY"
                tags={["Photography", "In-Person"]}
              />

              <MatchCard
                name="Anna L."
                offer="Yoga"
                seek="Web Development"
                location="Remote"
                tags={["Yoga", "Web Development"]}
              />

              <MatchCard
                name="Michael T."
                offer="Video Editing"
                seek="Cooking Skills"
                location="New York, NY"
                tags={["Video Editing", "Cooking"]}
              />
            </div>

            {/* Sidebar */}
            <SidebarFilters />
          </div>
        </main>
      </div>
    </div>
  );
}
