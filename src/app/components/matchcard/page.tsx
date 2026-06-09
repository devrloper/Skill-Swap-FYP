import Button from "@/app/ui/button";
import { Briefcase, MapPin, GraduationCap, Star } from "lucide-react";

export default function MatchCard({
  name,
  offer,
  seek,
  location,
  tags,
  imageUrl,
  showConnect = true,
  connectDisabled = false,
  connectLabel = "View Profile",
  rating = 0,
  reviewCount = 0,
  onConnect,
}) {
  const displayImage = imageUrl || "/girl.png";
  const numericRating =
    typeof rating === "number" && Number.isFinite(rating)
      ? rating
      : Number(rating) || 0;

  return (
    <div className="relative group mt-10">
      {/* Glass Card - Adjusted Opacity for Visibility */}
      <div
        className="
        relative bg-white/40 backdrop-blur-2xl cursor-pointer 
        border border-white/50 rounded-[40px] 
        p-8 pt-14 flex flex-col min-h-[320px] 
        shadow-[0_8px_30px_rgb(0,0,0,0.04)]
        transition-all duration-500 
        hover:bg-white/60 hover:shadow-2xl
      "
      >
        {/* Profile Image - Circular with gradient border */}
        <div className="absolute -top-10 left-10">
          <div className="h-20 w-20 rounded-full p-1 bg-gradient-to-br from-purple-400 to-pink-500 shadow-xl">
            <img
              src={displayImage}
              alt={name}
              className="h-full w-full rounded-full object-cover border-2 border-white"
            />
            {/* Online Indicator */}
            <div className="absolute bottom-1 right-1 bg-green-500 w-5 h-5 rounded-full border-4 border-white shadow-sm"></div>
          </div>
        </div>

        <div className="absolute right-8 top-6 inline-flex items-center gap-1.5 rounded-full bg-white/75 px-3 py-1.5 text-sm font-extrabold text-amber-500 shadow-md ring-1 ring-white/70 backdrop-blur">
          <Star size={16} fill="currentColor" />
          <span>{numericRating ? numericRating.toFixed(1) : "New"}</span>
          <span className="text-xs font-bold text-gray-500">
            ({reviewCount || 0})
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6">
          <h3 className="text-2xl font-extrabold text-gray-800 tracking-tight">
            {name}
          </h3>

          <div className="space-y-4">
            {/* Offering */}
            <div className="flex items-center gap-4">
              <div className="bg-white/60 p-2.5 rounded-2xl shadow-sm text-purple-600">
                <Briefcase size={18} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">
                  Offering
                </p>
                <p className="text-sm font-semibold text-gray-700">{offer}</p>
              </div>
            </div>

            {/* Seeking */}
            <div className="flex items-center gap-4">
              <div className="bg-white/60 p-2.5 rounded-2xl shadow-sm text-pink-600">
                <GraduationCap size={18} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">
                  Seeking
                </p>
                <p className="text-sm font-medium text-gray-600 italic leading-tight">
                  {seek}
                </p>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 pt-2">
            {tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="text-[11px] font-bold bg-gray-800/5 text-gray-600 px-4 py-1.5 rounded-xl border border-gray-200/50"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-end justify-between">
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-black text-gray-400 tracking-tighter">
              Location
            </p>
            <div className="flex items-center gap-1.5 text-blue-500 font-bold">
              <MapPin size={14} />
              <span className="text-sm">{location}</span>
            </div>
          </div>

          {showConnect && (
            <Button
              type="button"
              onClick={onConnect}
              disabled={connectDisabled}
              className="bg-gradient-to-r from-purple-800 to-pink-600 text-white px-8 py-3 rounded-2xl text-sm font-bold shadow-lg hover:shadow-pink-500/30 hover:scale-105 transition-all duration-300 active:scale-95"
            >
              {connectLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
